import { App } from "../App";
import { Simfile } from "./sm/Simfile";
import { ChartRenderer } from "./ChartRenderer";
import { ChartAudio } from "./audio/ChartAudio"
import { Howl } from 'howler';
import { IS_OSX, KEYBINDS } from "../data/KeybindData"
import { Chart } from "./sm/Chart"
import { NoteTexture } from "./renderer/NoteTexture"
import { BitmapText } from "pixi.js"
import { bsearch, getFPS, roundDigit } from "../util/Util"
import { Keybinds } from "../listener/Keybinds"
import { NotedataEntry, NoteType, PartialNotedataEntry } from "./sm/NoteTypes"
import { Judgment } from "./play/Judgment"
import { HoldJudgment } from "./play/HoldJudgment"

const SNAPS = [1,2,3,4,6,8,12,16,24,48,-1]
const ADDABLE_NOTE_TYPES: NoteType[] = ["Tap", "Mine", "Fake", "Lift"]

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
  sm?: Simfile
  sm_path: string = ""
  chart?: Chart

  private beat: number = 0
  private time: number = 0

  private holdEditing: (PartialHold | undefined)[] = [,,,,]
  private editNoteTypeIndex: number = 0

  private snapIndex: number = 0
  private partialScroll: number = 0
  private noteIndex: number = 0
  private lastBeat: number = -1

  private mode: EditMode = EditMode.Edit
  private lastMode: EditMode = EditMode.Edit

  private chordCohesion: Map<number, NotedataEntry[]> = new Map
  private missNoteIndex: number = 0
  private holdProgress: NotedataEntry[] = []
  private heldCols: boolean[] = []

  constructor(app: App) {

    this.app = app
    NoteTexture.initArrowTex(app)

    app.view.addEventListener?.("wheel", (event: WheelEvent) => {
      if (this.mode == EditMode.Play) return
      if (this.sm == undefined || this.chart == undefined || this.chartView == undefined) return
      if ((IS_OSX && event.metaKey) || (!IS_OSX && event.ctrlKey)) {
        this.app.options.chart.speed = Math.max(10, app.options.chart.speed * Math.pow(1.01, event.deltaY / 5 * app.options.editor.scrollSensitivity))
      }else{
        let newbeat = this.beat
        let snap = app.options.chart.snap
        let speed = app.options.chart.speed
        if (snap == 0) {
          this.partialScroll = 0
          newbeat = this.beat + event.deltaY/speed * app.options.editor.scrollSensitivity
        }else{
          this.partialScroll += event.deltaY/speed * app.options.editor.scrollSensitivity
          if (Math.abs(this.partialScroll) > snap) {
            if (this.partialScroll < 0) newbeat = Math.round((this.beat+Math.ceil(this.partialScroll/snap)*snap)/snap)*snap
            else newbeat = Math.round((this.beat+Math.floor(this.partialScroll/snap)*snap)/snap)*snap
            this.partialScroll %= snap
          }
        }
        newbeat = Math.max(0,newbeat)
        if (newbeat != this.beat) this.setBeat(newbeat)
        if (!this.holdEditing.every(x => x == undefined)) {
          for (let col = 0; col < 4; col++) {
            if (this.holdEditing[col] == undefined || this.holdEditing[col]!.type == "mouse") continue
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
    this.app.pixi.stage.addChild(this.info)
    this.app.pixi.ticker.add(() => {
      if (this.sm == undefined || this.chart == undefined || this.chartView == undefined) return
      this.chartView?.renderThis();
      this.info.text = this.mode
                     + "\nTime: " + roundDigit(this.time,3) 
                     + "\nBeat: " + roundDigit(this.beat,3)
                     + "\nFPS: " + getFPS(this.app.pixi)
                     + "\nNote Type: " + ADDABLE_NOTE_TYPES[this.editNoteTypeIndex]
      // for (let hold of this.holdEditing) {
      //   this.info.text += hold == undefined ? "\nundefined" : "\n" + JSON.stringify(hold)
      // }
    });
    
    setInterval(()=>{
      if (this.sm == undefined || this.chart == undefined || this.chartView == undefined) return
      let time = this.songAudio.seek()
      if (this.songAudio.isPlaying()) { 
        this.setTime(time) 
        if (!this.holdEditing.every(x => x == undefined)) {
          for (let col = 0; col < 4; col++) {
            if (this.holdEditing[col] == undefined || this.holdEditing[col]!.type == "mouse") continue
            let snap = this.app.options.chart.snap == 0 ? 1/48 : this.app.options.chart.snap
            let snapBeat = Math.round(this.beat/snap)*snap
            this.editHoldBeat(col, snapBeat, false)
          }
        }
      }
      let notedata = this.chart.notedata
      let hasPlayed = false
      while(this.noteIndex < notedata.length && time > notedata[this.noteIndex].second + app.options.audio.effectOffset) {
        if (this.songAudio.isPlaying() && (notedata[this.noteIndex].type != "Fake" && notedata[this.noteIndex].type != "Mine") && !notedata[this.noteIndex].fake) {
          if (this.mode != EditMode.Play) this.chartView.doJudgment(notedata[this.noteIndex], 0, Judgment.FANTASTIC)
          if (!hasPlayed && app.options.audio.assistTick) {
            this.assistTick.play()
            hasPlayed = true
          }
        }
        this.noteIndex++
      }
      let metronomeBeat = Math.floor(this.chart.getBeat(this.time + app.options.audio.effectOffset))
      if (metronomeBeat != this.lastBeat) {
        this.lastBeat = metronomeBeat
        if (this.songAudio.isPlaying() && app.options.audio.metronome) {
          if (this.lastBeat % 4 == 0) this.me_high.play()
          else this.me_low.play()
        }
      }
      if (this.mode == EditMode.Play) {
        let hitTime = this.time + this.app.options.play.offset
        let hitWindowStart = hitTime - Judgment.timingWindows[Judgment.timingWindows.length-1].getTimingWindow()/1000
        let doneMiss = false
        while (this.chart.notedata[this.missNoteIndex] && this.chart.notedata[this.missNoteIndex].second < hitWindowStart) {
          let note = this.chart.notedata[this.missNoteIndex]
          if (!doneMiss && note.type != "Mine" && !note.fake && !note.judged) {
            this.chartView.doJudgment(note, 0, Judgment.MISS)
            doneMiss = true
          }
          this.missNoteIndex++
        }

        for (let hold of this.holdProgress) {
          if (!hold.hold || !hold.lastActivation) continue
          if (this.heldCols[hold.col] && hold.type == "Hold") hold.lastActivation = Date.now()
          let unheldTime = Date.now() - hold.lastActivation 
          let window = HoldJudgment.HOLD_HELD.getTimingWindow()
          if (hold.type == "Roll") HoldJudgment.ROLL_HELD.getTimingWindow()
          if (!hold.lastFlash ||  Date.now() - hold.lastFlash > 30) {
            this.chartView.doHoldInProgressJudgment(hold)
            hold.lastFlash = Date.now()
          }
          if (unheldTime >= window) {
            this.chartView.doHoldJudgment(hold, HoldJudgment.DROPPED)
            hold.droppedBeat = this.beat
            this.holdProgress.splice(this.holdProgress.indexOf(hold), 1)
            continue
          }
          if (this.beat >= hold.beat + hold.hold!) {
            if (hold.type == "Hold") this.chartView.doHoldJudgment(hold, HoldJudgment.HOLD_HELD)
            else this.chartView.doHoldJudgment(hold, HoldJudgment.ROLL_HELD)
            this.holdProgress.splice(this.holdProgress.indexOf(hold), 1)
          }
        }
      }
    })

    window.addEventListener("resize", ()=>{
      if (this.chartView) {
        this.chartView.x = this.app.pixi.screen.width/2
        this.chartView.y = this.app.pixi.screen.height/2
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
        if (col < 4) {
          let snap = this.app.options.chart.snap == 0 ? 1/48 : this.app.options.chart.snap
          let snapBeat = Math.round(this.beat/snap)*snap
          this.setNote(col, "key", snapBeat)
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
            for (let col = 0; col < 4; col++) {
              if (this.holdEditing[col] == undefined || this.holdEditing[col]!.type == "mouse") continue
              this.editHoldBeat(col, this.beat, event.shiftKey)
            }
            return
          }
        }
        // Stop editing when undo/redo pressed
        for (let keybind of ["undo","redo"]) {
          if (KEYBINDS[keybind].keybinds.map(x=>x.key).includes(keyName)) {
            for (let i = 0; i < 4; i++) this.holdEditing[i] = undefined
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

  setTime(time: number) {
    if (!this.chart) return
    let seekBack = this.time > time
    this.time = time
    this.beat = this.chart.getBeat(this.time)
    if (seekBack) this.seekBack()
  }

  async loadSM(path: string) {
    this.sm_path = path
    this.time = 0
    this.beat = 0

    let smFile = await this.app.files.getFile(path)
    this.sm = new Simfile(smFile)
    await this.sm.loaded
    
    this.loadChart()
    this.loadAudio()
  }

  loadChart(chart?: Chart) {
    if (this.sm == undefined) return
    if (chart == undefined) {
      let charts = this.sm.charts[this.app.options.chart.stepsType]
      if (!charts || charts!.length == 0) return
      chart = charts![charts!.length - 1]
    }
    
    this.chart = chart
    this.beat = this.chart.getBeat(this.time)
  
    if (this.chartView) this.app.pixi.stage.removeChild(this.chartView)
      
    this.seekBack()
    this.chartView = new ChartRenderer(this)
    this.chartView.x = this.app.pixi.screen.width/2
    this.chartView.y = this.app.pixi.screen.height/2
  }
  

  async loadAudio() {
    if (!this.sm || !this.chart) return
    this.songAudio.stop()
    let audio_onload = (audio: ChartAudio) => {
      audio.seek(this.chart?.getSeconds(0) ?? this.sm!.timingData.getSeconds(0))
      this.setTime(this.chart?.getSeconds(0) ?? this.sm!.timingData.getSeconds(0)) 
      this.updateSoundProperties()
    }
    let musicPath = this.chart.getMusicPath()
    if (musicPath == "") {
      console.warn("No Audio File!")
      this.songAudio = new ChartAudio(undefined, audio_onload)
      return
    }
    let audioFile: File | undefined = this.app.files.getFileRelativeTo(this.sm_path, musicPath)
    if (audioFile == undefined) {
      console.warn("Failed to load audio file " + musicPath)
      this.songAudio = new ChartAudio(undefined, audio_onload)
      return
    }
    let audio_url = await URL.createObjectURL(audioFile)
    this.songAudio = new ChartAudio(audio_url, audio_onload)

    this.seekBack()
  }

  getAudio(): ChartAudio {
    return this.songAudio
  }

  updateSoundProperties() {
    this.setEffectVolume(this.app.options.audio.soundEffectVolume)
    this.setVolume(this.app.options.audio.songVolume)
    this.setRate(this.app.options.audio.rate)
  }

  setRate(rate: number) {
    this.app.options.audio.rate = rate
    this.songAudio.rate(rate)
  }
  
  setVolume(volume: number) {
    this.app.options.audio.songVolume = volume
    this.songAudio.volume(volume)
  }
  
  setEffectVolume(volume: number) {
    this.app.options.audio.soundEffectVolume = volume
    this.assistTick.volume(volume)
    this.me_high.volume(volume)
    this.me_low.volume(volume)
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
    let snap = Math.max(0.001,this.app.options.chart.snap)
    let newbeat = Math.round((beat)/snap)*snap
    newbeat = Math.max(0,newbeat)
    this.setBeat(newbeat)
  }
  
  previousSnap(){
    this.snapIndex = ((this.snapIndex-1) + SNAPS.length) % SNAPS.length
    this.app.options.chart.snap = SNAPS[this.snapIndex]==-1?0:1/SNAPS[this.snapIndex]
  }
  
  nextSnap(){
    this.snapIndex = ((this.snapIndex+1) + SNAPS.length) % SNAPS.length
    this.app.options.chart.snap = SNAPS[this.snapIndex]==-1?0:1/SNAPS[this.snapIndex]
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
    let holdTails = this.chart.notedata.filter(note => note.hold).map(note => note.beat + note.hold!)
    let beats = this.chart.notedata.map(note => note.beat).concat(holdTails).sort((a,b)=>a-b)
    beats = this.removeDuplicateBeats(beats)
    let index = bsearch(beats, this.beat)
    if (this.beat == beats[index]) index--
    this.setBeat(beats[Math.max(0, index)])
  }

  nextNote() {
    if (this.sm == undefined || this.chart == undefined || this.chartView == undefined) return
    if (this.chart.notedata.length == 0) return
    let holdTails = this.chart.notedata.filter(note => note.hold).map(note => note.beat + note.hold!)
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
    this.setBeat(note.beat + (note.hold ?? 0))
  }

  setNote(col: number, type: "mouse"|"key", beat?: number) {
    if (this.sm == undefined || this.chart == undefined || this.chartView == undefined) return
    beat = beat ?? this.beat
    beat = Math.max(0, Math.round(beat*48)/48)
    let conflictingNote = this.chart.notedata.filter(note => {
      if (note.col != col) return false
      if (Math.abs(note.beat-beat!) < 0.003) return true
      return (note.hold && note.beat <= beat! && note.beat + note.hold! >= beat!)
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
        type: ADDABLE_NOTE_TYPES[this.editNoteTypeIndex]
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
      return (note.hold && (note.beat + note.hold >= hold!.startBeat && note.beat + note.hold <= hold!.endBeat))
    })
    hold.removedNotes = hold.removedNotes.concat(conflictingNotes)
    conflictingNotes.forEach(note => this.chart!.removeNote(note))
    this.seekBack()
  }

  endEditing(col: number) {
    this.holdEditing[col] = undefined
  }

  previousNoteType() {
    this.editNoteTypeIndex = ((this.editNoteTypeIndex-1) + ADDABLE_NOTE_TYPES.length) % ADDABLE_NOTE_TYPES.length
  }
  
  nextNoteType() {
    this.editNoteTypeIndex = ((this.editNoteTypeIndex+1) + ADDABLE_NOTE_TYPES.length) % ADDABLE_NOTE_TYPES.length
  }

  getEditingNoteType(): NoteType {
    return ADDABLE_NOTE_TYPES[this.editNoteTypeIndex]
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
      this.chart?.notedata.forEach(note => {
        note.lastActivation = -1
        note.judged = note.second < this.time
        note.hide = false
      })
      this.chordCohesion.clear()
      for (let note of this.chart.notedata) {
        if (note.type == "Mine" || note.fake) continue
        if (!this.chordCohesion.has(note.beat)) this.chordCohesion.set(note.beat, [])
        this.chordCohesion.get(note.beat)!.push(note)
      }
      let hitTime = this.time + this.app.options.play.offset
      let hitWindowStart = hitTime - Judgment.timingWindows[Judgment.timingWindows.length-1].getTimingWindow()/1000
      let firstHittableNote = bsearch(this.chart.notedata, hitWindowStart, a => a.second) + 1
      if (firstHittableNote >= 1 && hitWindowStart <= this.chart.notedata[firstHittableNote-1].second) firstHittableNote--
      this.missNoteIndex = firstHittableNote
      this.holdProgress = []
      this.heldCols.map(_ => false)
      this.songAudio.seek(this.time - 1)
      this.songAudio.play()
    }else{
      this.chart?.notedata.forEach(note => {
        note.lastActivation = -1
        note.judged = false
        note.hide = false
      })
    }
  }

  judgeCol(col: number) {
    if (!this.chart || !this.chartView || this.mode != EditMode.Play) return
    let hitTime = this.time + this.app.options.play.offset
    let hitWindowStart = hitTime - Judgment.timingWindows[Judgment.timingWindows.length-1].getTimingWindow()/1000
    let hitWindowEnd = hitTime + Judgment.timingWindows[Judgment.timingWindows.length-1].getTimingWindow()/1000
    let firstHittableNote = bsearch(this.chart.notedata, hitWindowStart, a => a.second) + 1
    if (firstHittableNote >= 1 && hitWindowStart <= this.chart.notedata[firstHittableNote-1].second) firstHittableNote--
    let closestNote: NotedataEntry | undefined = undefined
    this.heldCols[col] = true
    for (let hold of this.holdProgress) {
      if (hold.type == "Roll" && hold.col == col) hold.lastActivation = Date.now()
    }
    while (this.chart.notedata[firstHittableNote] && this.chart.notedata[firstHittableNote].second <= hitWindowEnd) {
      let note = this.chart.notedata[firstHittableNote]
      if (note.judged || note.col != col || note.type == "Mine" || note.type == "Lift" || note.fake) {
        firstHittableNote++
        continue
      }
      if (!closestNote || Math.abs(note.second-hitTime) < Math.abs(closestNote.second-hitTime)) {
        closestNote = note
      }
      firstHittableNote++
    }
    if (closestNote) {
      closestNote.hit = true
      if (closestNote.hold) {
        closestNote.lastActivation = Date.now()
        this.holdProgress.push(closestNote)
      }
      let chord = this.chordCohesion.get(closestNote.beat)!
      if (chord.every(note => note.hit)) {
        chord.forEach(note => note.judged = true)
        for (let judgment of Judgment.timingWindows) {
          if (judgment.getTimingWindow()/1000 >= Math.abs(hitTime-closestNote.second)) {
            if (judgment.order < 4) chord.forEach(note => {if (!note.hold) note.hide = true})
            chord.forEach(note => this.chartView!.doJudgment(note, hitTime-note.second, judgment))
            break
          }
        }
      }
    }
  }

  judgeColUp(col: number) {
    if (!this.chart || !this.chartView || this.mode != EditMode.Play) return
    let hitTime = this.time + this.app.options.play.offset
    let hitWindowStart = hitTime - Judgment.timingWindows[Judgment.timingWindows.length-1].getTimingWindow()/1000
    let hitWindowEnd = hitTime + Judgment.timingWindows[Judgment.timingWindows.length-1].getTimingWindow()/1000
    let firstHittableNote = bsearch(this.chart.notedata, hitWindowStart, a => a.second) + 1
    if (firstHittableNote >= 1 && hitWindowStart <= this.chart.notedata[firstHittableNote-1].second) firstHittableNote--
    let closestNote: NotedataEntry | undefined = undefined
    this.heldCols[col] = false
    while (this.chart.notedata[firstHittableNote] && this.chart.notedata[firstHittableNote].second <= hitWindowEnd) {
      let note = this.chart.notedata[firstHittableNote]
      if (note.judged || note.col != col || note.type != "Lift" || note.fake) {
        firstHittableNote++
        continue
      }
      if (!closestNote || Math.abs(note.second-hitTime) < Math.abs(closestNote.second-hitTime)) {
        closestNote = note
      }
      firstHittableNote++
    }
    if (closestNote) {
      closestNote.hit = true
      let chord = this.chordCohesion.get(closestNote.beat)!
      if (chord.every(note => note.hit)) {
        chord.forEach(note => note.judged = true)
        for (let judgment of Judgment.timingWindows) {
          if (judgment.getTimingWindow()/1000 >= Math.abs(hitTime-closestNote.second)) {
            if (judgment.order < 4) chord.forEach(note => {if (!note.hold) note.hide = true})
            chord.forEach(note => this.chartView!.doJudgment(note, hitTime-note.second, judgment))
            break
          }
        }
      }
    }
  }
}


