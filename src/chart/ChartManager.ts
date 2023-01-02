import { App } from "../App";
import { Simfile } from "./sm/Simfile";
import { ChartRenderer } from "./ChartRenderer";
import { ChartAudio } from "./audio/ChartAudio"
import { Howl } from 'howler';
import { IS_OSX, KEYBINDS } from "../data/KeybindData"
import { Chart } from "./sm/Chart"
import { BitmapText } from "pixi.js"
import { bsearch, getFPS, getTPS, roundDigit, tpsUpdate } from "../util/Util"
import { Keybinds } from "../listener/Keybinds"
import { isHoldNote, PartialNotedataEntry } from "./sm/NoteTypes"
import { Options } from "../util/Options"
import { GameplayStats } from "./play/GameplayStats"
import { TIMING_WINDOW_AUTOPLAY } from "./play/StandardTimingWindow"
import { GameTypeRegistry } from "./types/GameTypeRegistry"

const SNAPS = [1,2,3,4,6,8,12,16,24,48,-1]

interface PartialHold {
  startBeat: number,
  endBeat: number,
  roll: boolean,
  type: "mouse"|"key",
  originalNote: PartialNotedataEntry | undefined
  removedNotes: PartialNotedataEntry[]
}

export enum EditMode {
  View = "View Mode",
  Edit = "Edit Mode",
  Play = "Play Mode (Press Escape to exit)"
}

export class ChartManager {

  app: App

  songAudio: ChartAudio = new ChartAudio()
  chartView?: ChartRenderer
  info: BitmapText
  assistTick: Howl = new Howl({
    src: 'assets/sound/assist_tick.ogg',
    volume: 0.5
  })
  me_high: Howl = new Howl({
    src: 'assets/sound/metronome_high.ogg',
    volume: 0.5
  });
  me_low: Howl = new Howl({
    src: 'assets/sound/metronome_low.ogg',
    volume: 0.5
  });
  mine: Howl = new Howl({
    src: 'assets/sound/mine.ogg',
    volume: 0.5
  });
  sm?: Simfile
  sm_path: string = ""
  chart?: Chart

  private beat: number = 0
  private time: number = 0

  private holdEditing: (PartialHold | undefined)[] = []
  private editNoteTypeIndex: number = 0

  private snapIndex: number = 0
  private partialScroll: number = 0
  private noteIndex: number = 0
  private lastBeat: number = -1

  private lastSong: string = ""

  private mode: EditMode = EditMode.Edit
  private lastMode: EditMode = EditMode.Edit

  gameStats?: GameplayStats

  constructor(app: App) {

    this.app = app

    app.view.addEventListener?.("wheel", (event: WheelEvent) => {
      if (this.sm == undefined || this.chart == undefined || this.chartView == undefined) return
      if ((IS_OSX && event.metaKey) || (!IS_OSX && event.ctrlKey)) {
        Options.chart.speed = Math.max(10, Options.chart.speed * Math.pow(1.01, event.deltaY / 5 * Options.editor.scrollSensitivity))
      }else{
        if (this.mode == EditMode.Play) return
        let newbeat = this.beat
        let snap = Options.chart.snap
        let speed = Options.chart.speed
        if (snap == 0) {
          this.partialScroll = 0
          newbeat = this.beat + event.deltaY/speed * Options.editor.scrollSensitivity
        }else{
          this.partialScroll += event.deltaY/speed * Options.editor.scrollSensitivity
          if (Math.abs(this.partialScroll) > snap) {
            if (this.partialScroll < 0) newbeat = Math.round((this.beat+Math.ceil(this.partialScroll/snap)*snap)/snap)*snap
            else newbeat = Math.round((this.beat+Math.floor(this.partialScroll/snap)*snap)/snap)*snap
            this.partialScroll %= snap
          }
        }
        newbeat = Math.max(0,newbeat)
        if (newbeat != this.beat) this.setBeat(newbeat)
        if (!this.holdEditing.every(x => x == undefined)) {
          for (let col = 0; col < this.holdEditing.length; col++) {
            if (!this.holdEditing[col] || this.holdEditing[col]!.type == "mouse") continue
            this.editHoldBeat(col, this.beat, event.shiftKey)
          }
        }
      }
    }, {passive: true});

    this.info = new BitmapText("", {
      fontName: "Assistant",
      fontSize: 20,
    })
    this.info.x = 0
    this.info.y = 0
    this.info.zIndex = 1
    this.app.stage.addChild(this.info)
    this.app.ticker.add(() => {
      if (this.sm == undefined || this.chart == undefined || this.chartView == undefined) return
      this.chartView?.renderThis();
      this.info.text = this.mode
                     + "\nTime: " + roundDigit(this.time,3) 
                     + "\nBeat: " + roundDigit(this.beat,3)
                     + "\nFrame Time: " + this.app.frameTime.toFixed(3) + "ms"
                     + "\nFPS: " + getFPS(this.app)
                     + "\nTPS: " + getTPS()
                     + "\nNote Type: " + this.chart.gameType.editNoteTypes[this.editNoteTypeIndex]
      if (this.mode == EditMode.Play && this.gameStats) {
        this.info.text += "\nScore:" + (this.gameStats.getScore()*100).toFixed(2)
                        + "\nCumulative Score:" + (this.gameStats.getCumulativeScore()*100).toFixed(2)
      }
      // for (let hold of this.holdEditing) {
      //   this.info.text += hold == undefined ? "\nundefined" : "\n" + JSON.stringify(hold)
      // }
    });
    
    setInterval(()=>{
      if (this.sm == undefined || this.chart == undefined || this.chartView == undefined) return
      let time = this.songAudio.seek()
      if (this.songAudio.isPlaying()) { 
        this.setTime(time, true) 
        if (!this.holdEditing.every(x => !x)) {
          for (let col = 0; col < this.holdEditing.length; col++) {
            if (!this.holdEditing[col] || this.holdEditing[col]!.type == "mouse") continue
            let snap = Options.chart.snap == 0 ? 1/48 : Options.chart.snap
            let snapBeat = Math.round(this.beat/snap)*snap
            this.editHoldBeat(col, snapBeat, false)
          }
        }
      }
      let notedata = this.chart.notedata
      let hasPlayed = false
      while(this.noteIndex < notedata.length && time > notedata[this.noteIndex].second + Options.audio.effectOffset) {
        if (this.songAudio.isPlaying() && this.chart.gameType.gameLogic.shouldAssistTick(notedata[this.noteIndex])) {
          if (this.mode != EditMode.Play) this.chartView.doJudgment(notedata[this.noteIndex], 0, TIMING_WINDOW_AUTOPLAY)
          if (!hasPlayed && Options.audio.assistTick) {
            this.assistTick.play()
            hasPlayed = true
          }
        }
        this.noteIndex++
      }
      let metronomeBeat = Math.floor(this.chart.getBeat(this.time + Options.audio.effectOffset))
      if (metronomeBeat != this.lastBeat) {
        this.lastBeat = metronomeBeat
        if (this.songAudio.isPlaying() && Options.audio.metronome) {
          if (this.lastBeat % 4 == 0) this.me_high.play()
          else this.me_low.play()
        }
      }
      if (this.mode == EditMode.Play) {
        this.chart.gameType.gameLogic.update(this)
      }
      tpsUpdate()
    }, 5)

    window.addEventListener("message", (event)=>{
      if (event.data == "resize" && event.source == window) {
        if (this.chartView) {
          this.chartView.x = this.app.renderer.screen.width/2
          this.chartView.y = this.app.renderer.screen.height/2
        }
      }
    })


    window.addEventListener("keyup", (event: KeyboardEvent)=>{
      if (this.mode != EditMode.Edit) return
      if (event.code.startsWith("Digit")) {
        let col = parseInt(event.code.slice(5))-1
        this.endEditing(col)
      }
    }, true)

    
    window.addEventListener("keydown", (event: KeyboardEvent) => {
      if (this.mode != EditMode.Edit) return
      if (event.target instanceof HTMLTextAreaElement) return
      if (event.target instanceof HTMLInputElement) return
      //Start editing note
      if (event.code.startsWith("Digit") && !event.repeat) {
        let col = parseInt(event.code.slice(5))-1
        if (col < (this.chart?.gameType.numCols ?? 4)) { 
          this.setNote(col, "key")
          event.preventDefault()
          event.stopImmediatePropagation()
        }
      }
      if (!this.holdEditing.every(x => x == undefined)) {
        let keyName = Keybinds.getKeyNameFromCode(event.code)
        // Override any move+key combos when editing a hold
        let keybinds = ["cursorUp","cursorDown","previousNote", "nextNote", "previousMeasure", "nextMeasure","jumpChartStart","jumpChartEnd","jumpSongStart","jumpSongEnd"]
        for (let keybind of keybinds) {
          if (KEYBINDS[keybind].keybinds.map(x=>x.key).includes(keyName)) {
            event.preventDefault()
            event.stopImmediatePropagation()
            KEYBINDS[keybind].callback(this.app)
            for (let col = 0; col < this.holdEditing.length; col++) {
              if (!this.holdEditing[col] || this.holdEditing[col]!.type == "mouse") continue
              this.editHoldBeat(col, this.beat, event.shiftKey)
            }
            return
          }
        }
        // Stop editing when undo/redo pressed
        for (let keybind of ["undo", "redo"]) {
          if (KEYBINDS[keybind].keybinds.map(x=>x.key).includes(keyName)) {
            this.holdEditing = []
            return
          }
        }
      }
    }, true)

    window.addEventListener("keydown", (event: KeyboardEvent) => {
      if (this.mode != EditMode.Play) return
      if (event.key == "Escape") {
        this.setMode(this.lastMode)
        this.songAudio.pause()
      }
    }, true)
  }

  getBeat(): number {
    return this.beat
  }

  getTime(): number {
    return this.time
  }

  setBeat(beat: number) {
    if (!this.chart) return
    let seekBack = this.beat > beat
    this.beat = beat
    this.time = this.chart.getSeconds(this.beat)
    this.songAudio.seek(this.time)
    if (seekBack) this.seekBack()
  }

  setTime(time: number, ignoreSetSongTime?: boolean) {
    if (!this.chart) return
    let seekBack = this.time > time
    this.time = time
    this.beat = this.chart.getBeat(this.time)
    if (!ignoreSetSongTime) this.songAudio.seek(this.time)
    if (seekBack) this.seekBack()
  }

  async loadSM(path: string) {
    this.songAudio.stop()
    this.lastSong = ""
    this.sm_path = path
    this.time = 0
    this.beat = 0

    let smFile = await this.app.files.getFile(path)
    this.sm = new Simfile(smFile)

    await this.sm.loaded
    window.postMessage("smLoaded")
    await this.loadChart()
    if (this.time == 0) this.setBeat(0)
  }

  async loadChart(chart?: Chart) {
    if (this.sm == undefined) return
    if (chart == undefined) {
      for (let gameType of GameTypeRegistry.getPriority()) {
        let charts = this.sm.charts[gameType.id]
        if (charts && charts.length > 0) {
          chart = charts.at(-1)
          break
        }
      }
      if (!chart) return
    }
    
    this.chart = chart
    this.beat = this.chart.getBeat(this.time)

    window.postMessage("chartModified")
  
    if (this.chartView) {
      this.chartView.destroy()
      this.app.stage.removeChild(this.chartView)
    }
      
    this.seekBack()
    this.chartView = new ChartRenderer(this)
    this.chartView.x = this.app.renderer.screen.width/2
    this.chartView.y = this.app.renderer.screen.height/2
    if (this.mode == EditMode.Play) this.setMode(this.lastMode)

    if (this.chart.getMusicPath() != this.lastSong) {
      this.lastSong = this.chart.getMusicPath()
      let audioPlaying = this.songAudio.isPlaying()
      await this.loadAudio()
      if (audioPlaying) this.songAudio.play()
    }
  }
  

  async loadAudio() {
    if (!this.sm || !this.chart) return
    this.songAudio.stop()
    let musicPath = this.chart.getMusicPath()
    if (musicPath == "") {
      console.warn("No Audio File!")
      this.songAudio = new ChartAudio(undefined)
      await this.songAudio.loaded
      return
    }
    let audioFile: File | undefined = this.getAudioFile(musicPath)
    if (audioFile == undefined) {
      console.warn("Failed to load audio file " + musicPath)
      this.songAudio = new ChartAudio(undefined)
      await this.songAudio.loaded
      return
    }
    let audio_url = await URL.createObjectURL(audioFile)
    this.songAudio = new ChartAudio(audio_url)
    await this.songAudio.loaded
    this.songAudio.seek(this.time)
    this.updateSoundProperties()
    this.seekBack()
  }

  private getAudioFile(musicPath: string) {
    let audioFile: File | undefined = this.app.files.getFileRelativeTo(this.sm_path, musicPath)
    if (audioFile) return audioFile

    console.warn("Failed to find audio file " + musicPath)

    //Capitalization error
    let dir = this.sm_path.split("/")
    dir.pop()
    dir = dir.concat(musicPath.split("/"))
    let aName = dir.pop()!
    let path = this.app.files.resolvePath(dir).join("/")
    let files = Object.entries(this.app.files.files).filter(entry => entry[0].startsWith(path)).map(entry => entry[1])
    audioFile = files.filter(file => file.name.toLowerCase() == aName.toLowerCase())[0]
    if (audioFile) return audioFile

    //Any audio file in dir
    audioFile = files.filter(file => file.type.startsWith("audio/"))[0]
    return audioFile
  }

  getAudio(): ChartAudio {
    return this.songAudio
  }

  updateSoundProperties() {
    this.setEffectVolume(Options.audio.soundEffectVolume)
    this.setVolume(Options.audio.songVolume)
    this.setRate(Options.audio.rate)
  }

  setRate(rate: number) {
    Options.audio.rate = rate
    this.songAudio.rate(rate)
  }
  
  setVolume(volume: number) {
    Options.audio.songVolume = volume
    this.songAudio.volume(volume)
  }
  
  setEffectVolume(volume: number) {
    Options.audio.soundEffectVolume = volume
    this.assistTick.volume(volume)
    this.me_high.volume(volume)
    this.me_low.volume(volume)
    this.mine.volume(volume)
  }

  seekBack() {
    if (this.sm == undefined || this.chart == undefined || this.chartView == undefined || this.chart.notedata.length == 0) {
      this.noteIndex = 0
      return
    }
    this.noteIndex = bsearch(this.chart.notedata, this.time, a => a.second) + 1
    if (this.noteIndex >= 1 && this.time <= this.chart.notedata[this.noteIndex-1].second) this.noteIndex--
  }

  playPause() {
    if (this.songAudio.isPlaying()) this.songAudio.pause()
    else this.songAudio.play()
  }

  setAndSnapBeat(beat: number) {
    let snap = Math.max(0.001,Options.chart.snap)
    let newbeat = Math.round((beat)/snap)*snap
    newbeat = Math.max(0,newbeat)
    this.setBeat(newbeat)
  }
  
  previousSnap(){
    this.snapIndex = ((this.snapIndex-1) + SNAPS.length) % SNAPS.length
    Options.chart.snap = SNAPS[this.snapIndex]==-1?0:1/SNAPS[this.snapIndex]
  }
  
  nextSnap(){
    this.snapIndex = ((this.snapIndex+1) + SNAPS.length) % SNAPS.length
    Options.chart.snap = SNAPS[this.snapIndex]==-1?0:1/SNAPS[this.snapIndex]
  }

  private removeDuplicateBeats(arr: number[]): number[] {
    if (arr.length === 0) return arr;
    var ret = [arr[0]];
    for (var i = 1; i < arr.length; i++) { 
      if (arr[i-1] !== arr[i]) {
        ret.push(arr[i]);
      }
    }
    return ret;
  }

  previousNote() {
    if (this.sm == undefined || this.chart == undefined || this.chartView == undefined) return
    if (this.chart.notedata.length == 0) return
    let holdTails = this.chart.notedata.filter(isHoldNote).map(note => note.beat + note.hold)
    let beats = this.chart.notedata.map(note => note.beat).concat(holdTails).sort((a,b)=>a-b)
    beats = this.removeDuplicateBeats(beats)
    let index = bsearch(beats, this.beat)
    if (this.beat == beats[index]) index--
    this.setBeat(beats[Math.max(0, index)])
  }

  nextNote() {
    if (this.sm == undefined || this.chart == undefined || this.chartView == undefined) return
    if (this.chart.notedata.length == 0) return
    let holdTails = this.chart.notedata.filter(isHoldNote).map(note => note.beat + note.hold)
    let beats = this.chart.notedata.map(note => note.beat).concat(holdTails).sort((a,b)=>a-b)
    beats = this.removeDuplicateBeats(beats)
    let index = bsearch(beats, this.beat)
    if (this.beat >= beats[index]) index++
    this.setBeat(beats[Math.min(beats.length - 1, index)])
  }

  firstNote() {
    if (this.sm == undefined || this.chart == undefined || this.chartView == undefined) return
    if (this.chart.notedata.length == 0) return
    this.setBeat(this.chart.notedata[0].beat)
  }

  lastNote() {
    if (this.sm == undefined || this.chart == undefined || this.chartView == undefined) return
    if (this.chart.notedata.length == 0) return
    let note = this.chart.notedata[this.chart.notedata.length-1]
    this.setBeat(note.beat + (isHoldNote(note) ? note.hold : 0))
  }

  setNote(col: number, type: "mouse"|"key", beat?: number) {
    if (this.sm == undefined || this.chart == undefined || this.chartView == undefined) return
    beat = beat ?? this.beat
    beat = Math.max(0, Math.round(beat*48)/48)
    let conflictingNote = this.chart.notedata.filter(note => {
      if (note.col != col) return false
      if (Math.abs(note.beat-beat!) < 0.003) return true
      return (isHoldNote(note)  && note.beat <= beat! && note.beat + note.hold! >= beat!)
    })

    let holdEdit: PartialHold = {
      startBeat: beat!,
      endBeat: beat!,
      roll: false,
      originalNote: undefined,
      type,
      removedNotes: conflictingNote
    }
    this.holdEditing[col] = holdEdit

    if (conflictingNote.length == 0) {
      holdEdit.originalNote = {
        beat: beat!,
        col: col,
        type: this.getEditingNoteType()
      }
    }
    this.seekBack()
    this.app.actionHistory.run({
      action: () => {
        holdEdit.removedNotes.forEach(note => this.chart!.removeNote(note))
        if (holdEdit.originalNote) this.chart!.addNote(holdEdit.originalNote!)
      },
      undo: () => {
        if (holdEdit.originalNote) this.chart!.removeNote(holdEdit.originalNote!)
        holdEdit.removedNotes.forEach(note => this.chart!.addNote(note))
      },

    })
  }

  editHoldBeat(col: number, beat: number, roll: boolean) {
    if (this.sm == undefined || this.chart == undefined || this.chartView == undefined) return
    let hold = this.holdEditing[col]
    if (hold == undefined) return
    if (beat == hold.startBeat && beat == hold.endBeat) return

    hold.startBeat = Math.max(0, Math.round(Math.min(beat, hold.startBeat)*48)/48)
    hold.endBeat = Math.max(0, Math.round(Math.max(beat, hold.endBeat)*48)/48)
    hold.roll ||= roll
    if (!hold.originalNote) {
      this.chart.addNote({
        beat: hold.startBeat,
        col: col,
        type: hold.roll ? "Roll" : "Hold",
        hold: hold.endBeat - hold.startBeat
      })
    }else{
      this.chart.modifyNote(hold.originalNote, {
        beat: hold.startBeat,
        type: hold.roll ? "Roll" : "Hold",
        hold: hold.endBeat - hold.startBeat
      })
    }
    hold.originalNote = {
      beat: hold.startBeat,
      col: col,
      type: hold.roll ? "Roll" : "Hold",
      hold: hold.endBeat - hold.startBeat
    }
    let conflictingNotes = this.chart.notedata.filter(note => {
      if (note.beat == hold!.originalNote!.beat && note.col == hold!.originalNote!.col) return false
      if (note.col != col) return false
      if (note.beat >= hold!.startBeat && note.beat <= hold!.endBeat) return true
      return (isHoldNote(note) && (note.beat + note.hold >= hold!.startBeat && note.beat + note.hold <= hold!.endBeat))
    })
    hold.removedNotes = hold.removedNotes.concat(conflictingNotes)
    conflictingNotes.forEach(note => this.chart!.removeNote(note))
    this.seekBack()
  }

  endEditing(col: number) {
    this.holdEditing[col] = undefined
  }

  previousNoteType() {
    let numNoteTypes = this.chart?.gameType.editNoteTypes.length ?? 0
    this.editNoteTypeIndex = ((this.editNoteTypeIndex-1) + numNoteTypes) % numNoteTypes
  }
  
  nextNoteType() {
    let numNoteTypes = this.chart?.gameType.editNoteTypes.length ?? 0
    this.editNoteTypeIndex = ((this.editNoteTypeIndex+1) + numNoteTypes) % numNoteTypes
  }

  getEditingNoteType(): string {
    return this.chart?.gameType.editNoteTypes[this.editNoteTypeIndex] ?? ""
  }

  getMode(): EditMode {
    return this.mode
  }

  setMode(mode: EditMode) {
    if (!this.chart || !this.chartView) return
    if (this.mode == mode) return
    this.lastMode = this.mode
    this.mode = mode
    if (this.mode == EditMode.Play) {
      this.chart.notedata.forEach(note => {
        note.gameplay = {
          hideNote: false,
          hasHit: false,
        }
      })
      for (let note of this.chart.notedata) {
        if (note.second < this.time) note.gameplay!.hasHit = true
        else break
      }
      this.chart.gameType.gameLogic.reset(this)
      this.gameStats = new GameplayStats(this.chart.notedata)
      this.chartView.resetPlay()
      this.songAudio.seek(this.time - 1)
      this.songAudio.play()
    }else{
      this.chartView.endPlay()
      this.chart?.notedata.forEach(note => note.gameplay = undefined)
    }
  }

  judgeCol(col: number) {
    if (!this.chart || !this.chartView || this.mode != EditMode.Play) return
    this.chart.gameType.gameLogic.keyDown(this, col)
  }

  judgeColUp(col: number) {
    if (!this.chart || !this.chartView || this.mode != EditMode.Play) return
    this.chart.gameType.gameLogic.keyUp(this, col)
  }

}


