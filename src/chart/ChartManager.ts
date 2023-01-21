import { Howl } from "howler"
import { BitmapText } from "pixi.js"
import { App } from "../App"
import { IS_OSX, KEYBINDS } from "../data/KeybindData"
import { WaterfallManager } from "../gui/element/WaterfallManager"
import { WidgetManager } from "../gui/widget/WidgetManager"
import { Keybinds } from "../listener/Keybinds"
import { EventHandler } from "../util/EventHandler"
import { Options } from "../util/Options"
import { TimerStats } from "../util/TimerStats"
import { bsearch, tpsUpdate } from "../util/Util"
import { NewChartWindow } from "../window/NewChartWindow"
import { ChartAudio } from "./audio/ChartAudio"
import { ChartRenderer } from "./ChartRenderer"
import { GameplayStats } from "./play/GameplayStats"
import { TIMING_WINDOW_AUTOPLAY } from "./play/StandardTimingWindow"
import { Chart } from "./sm/Chart"
import { isHoldNote, PartialNotedataEntry } from "./sm/NoteTypes"
import { Simfile } from "./sm/Simfile"
import { GameTypeRegistry } from "./types/GameTypeRegistry"

const SNAPS = [1, 2, 3, 4, 6, 8, 12, 16, 24, 48, -1]

interface PartialHold {
  startBeat: number
  endBeat: number
  roll: boolean
  type: "mouse" | "key"
  originalNote: PartialNotedataEntry | undefined
  removedNotes: PartialNotedataEntry[]
}

export enum EditMode {
  View = "View Mode",
  Edit = "Edit Mode",
  Play = "Play Mode (ESC to exit)",
}

export class ChartManager {
  app: App

  songAudio: ChartAudio = new ChartAudio()
  chartView?: ChartRenderer
  widgetManager: WidgetManager
  noChartTextA: BitmapText
  noChartTextB: BitmapText
  assistTick: Howl = new Howl({
    src: "assets/sound/assist_tick.ogg",
    volume: 0.5,
  })
  me_high: Howl = new Howl({
    src: "assets/sound/metronome_high.ogg",
    volume: 0.5,
  })
  me_low: Howl = new Howl({
    src: "assets/sound/metronome_low.ogg",
    volume: 0.5,
  })
  mine: Howl = new Howl({
    src: "assets/sound/mine.ogg",
    volume: 0.5,
  })
  sm?: Simfile
  sm_path = ""
  chart?: Chart

  private beat = 0
  private time = 0

  private holdEditing: (PartialHold | undefined)[] = []
  private editNoteTypeIndex = 0

  private snapIndex = 0
  private partialScroll = 0
  private noteIndex = 0
  private lastBeat = -1

  private lastSong = ""

  private mode: EditMode = EditMode.Edit
  private lastMode: EditMode = EditMode.Edit

  gameStats?: GameplayStats

  constructor(app: App) {
    this.app = app

    app.view.addEventListener?.(
      "wheel",
      (event: WheelEvent) => {
        if (
          this.sm == undefined ||
          this.chart == undefined ||
          this.chartView == undefined
        )
          return
        if ((IS_OSX && event.metaKey) || (!IS_OSX && event.ctrlKey)) {
          Options.chart.speed = Math.max(
            10,
            Options.chart.speed *
              Math.pow(
                1.01,
                (event.deltaY / 5) * Options.editor.scrollSensitivity
              )
          )
        } else {
          if (this.mode == EditMode.Play) return
          let newbeat = this.beat
          const snap = Options.chart.snap
          const speed = Options.chart.speed * (Options.chart.reverse ? -1 : 1)
          if (snap == 0) {
            this.partialScroll = 0
            newbeat =
              this.beat +
              (event.deltaY / speed) * Options.editor.scrollSensitivity
          } else {
            this.partialScroll +=
              (event.deltaY / speed) * Options.editor.scrollSensitivity
            if (Math.abs(this.partialScroll) > snap) {
              if (this.partialScroll < 0)
                newbeat =
                  Math.round(
                    (this.beat + Math.ceil(this.partialScroll / snap) * snap) /
                      snap
                  ) * snap
              else
                newbeat =
                  Math.round(
                    (this.beat + Math.floor(this.partialScroll / snap) * snap) /
                      snap
                  ) * snap
              this.partialScroll %= snap
            }
          }
          newbeat = Math.max(0, newbeat)
          if (newbeat != this.beat) this.setBeat(newbeat)
          if (!this.holdEditing.every(x => x == undefined)) {
            for (let col = 0; col < this.holdEditing.length; col++) {
              if (
                !this.holdEditing[col] ||
                this.holdEditing[col]!.type == "mouse"
              )
                continue
              this.editHoldBeat(col, this.beat, event.shiftKey)
            }
          }
        }
      },
      { passive: true }
    )

    this.widgetManager = new WidgetManager(this)

    this.noChartTextA = new BitmapText("No Chart", {
      fontName: "Assistant",
      fontSize: 30,
    })
    this.noChartTextA.x = this.app.renderer.screen.width / 2
    this.noChartTextA.y = this.app.renderer.screen.height / 2 - 20
    this.noChartTextA.anchor.set(0.5)
    this.noChartTextA.tint = 0x555555
    this.app.stage.addChild(this.noChartTextA)
    this.noChartTextB = new BitmapText("Create a new chart", {
      fontName: "Assistant",
      fontSize: 15,
    })
    this.noChartTextB.x = this.app.renderer.screen.width / 2
    this.noChartTextB.y = this.app.renderer.screen.height / 2 + 10
    this.noChartTextB.anchor.set(0.5)
    this.noChartTextB.tint = 0x556677
    this.noChartTextB.interactive = true
    this.noChartTextB.on("mouseover", () => {
      this.noChartTextB.tint = 0x8899aa
    })
    this.noChartTextB.on("mouseleave", () => {
      this.noChartTextB.tint = 0x556677
    })
    this.noChartTextB.on("mousedown", () => {
      this.app.windowManager.openWindow(new NewChartWindow(app))
    })
    this.noChartTextA.visible = false
    this.noChartTextB.visible = false
    this.app.stage.addChild(this.noChartTextB)
    this.app.stage.addChild(this.widgetManager)
    this.app.ticker.add(() => {
      if (
        this.sm == undefined ||
        this.chart == undefined ||
        this.chartView == undefined
      )
        return
      TimerStats.time("ChartRenderer Update Time")
      this.chartView?.renderThis()
      this.widgetManager.update()
      TimerStats.endTime("ChartRenderer Update Time")
    })

    setInterval(() => {
      if (
        this.sm == undefined ||
        this.chart == undefined ||
        this.chartView == undefined
      )
        return
      const time = this.songAudio.seek()
      TimerStats.time("Update Time")
      if (this.songAudio.isPlaying()) {
        this.setTime(time, true)
        if (!this.holdEditing.every(x => !x)) {
          for (let col = 0; col < this.holdEditing.length; col++) {
            if (
              !this.holdEditing[col] ||
              this.holdEditing[col]!.type == "mouse"
            )
              continue
            const snap = Options.chart.snap == 0 ? 1 / 48 : Options.chart.snap
            const snapBeat = Math.round(this.beat / snap) * snap
            this.editHoldBeat(col, snapBeat, false)
          }
        }
      }
      const notedata = this.chart.notedata
      let hasPlayed = false
      while (
        this.noteIndex < notedata.length &&
        time > notedata[this.noteIndex].second + Options.audio.effectOffset
      ) {
        if (
          this.songAudio.isPlaying() &&
          this.chart.gameType.gameLogic.shouldAssistTick(
            notedata[this.noteIndex]
          )
        ) {
          if (this.mode != EditMode.Play)
            this.chartView.doJudgment(
              notedata[this.noteIndex],
              0,
              TIMING_WINDOW_AUTOPLAY
            )
          if (!hasPlayed && Options.audio.assistTick) {
            this.assistTick.play()
            hasPlayed = true
          }
        }
        this.noteIndex++
      }
      const metronomeBeat = Math.floor(
        this.chart.getBeat(this.time + Options.audio.effectOffset)
      )
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
      this.updateSoundProperties()
      tpsUpdate()
      TimerStats.endTime("Update Time")
    }, 5)

    EventHandler.on("resize", () => {
      if (this.chartView) {
        this.chartView.x = this.app.renderer.screen.width / 2
        this.chartView.y = this.app.renderer.screen.height / 2
      }
    })

    EventHandler.on("chartModified", () => {
      if (this.chart) {
        this.chart.recalculateStats()
      }
    })

    window.addEventListener(
      "keyup",
      (event: KeyboardEvent) => {
        if (this.mode != EditMode.Edit) return
        if (event.code.startsWith("Digit")) {
          const col = parseInt(event.code.slice(5)) - 1
          this.endEditing(col)
        }
      },
      true
    )

    window.addEventListener(
      "keydown",
      (event: KeyboardEvent) => {
        if (this.mode != EditMode.Edit) return
        if (event.target instanceof HTMLTextAreaElement) return
        if (event.target instanceof HTMLInputElement) return
        //Start editing note
        if (event.code.startsWith("Digit") && !event.repeat) {
          const col = parseInt(event.code.slice(5)) - 1
          if (col < (this.chart?.gameType.numCols ?? 4)) {
            this.setNote(col, "key")
            event.preventDefault()
            event.stopImmediatePropagation()
          }
        }
        if (!this.holdEditing.every(x => x == undefined)) {
          const keyName = Keybinds.getKeyNameFromCode(event.code)
          // Override any move+key combos when editing a hold
          const keybinds = [
            "cursorUp",
            "cursorDown",
            "previousNote",
            "nextNote",
            "previousMeasure",
            "nextMeasure",
            "jumpChartStart",
            "jumpChartEnd",
            "jumpSongStart",
            "jumpSongEnd",
          ]
          for (const keybind of keybinds) {
            if (KEYBINDS[keybind].keybinds.map(x => x.key).includes(keyName)) {
              event.preventDefault()
              event.stopImmediatePropagation()
              KEYBINDS[keybind].callback(this.app)
              for (let col = 0; col < this.holdEditing.length; col++) {
                if (
                  !this.holdEditing[col] ||
                  this.holdEditing[col]!.type == "mouse"
                )
                  continue
                this.editHoldBeat(col, this.beat, event.shiftKey)
              }
              return
            }
          }
          // Stop editing when undo/redo pressed
          for (const keybind of ["undo", "redo"]) {
            if (KEYBINDS[keybind].keybinds.map(x => x.key).includes(keyName)) {
              this.holdEditing = []
              return
            }
          }
        }
      },
      true
    )

    window.addEventListener(
      "keydown",
      (event: KeyboardEvent) => {
        if (this.mode != EditMode.Play) return
        if (event.key == "Escape") {
          this.setMode(this.lastMode)
          this.songAudio.pause()
        }
      },
      true
    )
  }

  getBeat(): number {
    return this.beat
  }

  getTime(): number {
    return this.time
  }

  setBeat(beat: number) {
    if (!this.chart) return
    this.beat = beat
    this.time = this.chart.getSeconds(this.beat)
    this.songAudio.seek(this.time)
    this.getAssistTickIndex()
  }

  setTime(time: number, ignoreSetSongTime?: boolean) {
    if (!this.chart) return
    this.time = time
    this.beat = this.chart.getBeat(this.time)
    if (!ignoreSetSongTime) {
      this.songAudio.seek(this.time)
      this.getAssistTickIndex()
    }
  }

  async loadSM(path?: string) {
    if (!path) {
      this.sm_path = ""
      this.sm = undefined
      this.songAudio.stop()
      this.noChartTextA.visible = false
      this.noChartTextB.visible = false
      if (this.chartView) this.chartView.destroy({ children: true })
      return
    }

    this.songAudio.stop()
    this.lastSong = ""
    this.sm_path = path
    this.time = 0
    this.beat = 0

    const smFile = this.app.files.getFile(path)
    this.sm = new Simfile(smFile)

    await this.sm.loaded

    this.noChartTextA.visible = true
    this.noChartTextB.visible = true

    EventHandler.emit("smLoaded")
    this.loadChart()
    if (this.time == 0) this.setBeat(0)
  }

  loadChart(chart?: Chart) {
    if (this.sm == undefined) return
    if (chart == undefined) {
      for (const gameType of GameTypeRegistry.getPriority()) {
        const charts = this.sm.charts[gameType.id]
        if (charts && charts.length > 0) {
          chart = charts.at(-1)
          break
        }
      }
      if (!chart) return
    }

    this.chart = chart
    this.beat = this.chart.getBeat(this.time)

    Options.play.timingCollection =
      Options.play.defaultTimingCollection[chart.gameType.id] ?? "ITG"

    EventHandler.emit("chartLoaded")
    EventHandler.emit("chartModified")

    if (this.chartView) this.chartView.destroy({ children: true })

    this.getAssistTickIndex()
    this.chartView = new ChartRenderer(this)
    this.chartView.x = this.app.renderer.screen.width / 2
    this.chartView.y = this.app.renderer.screen.height / 2
    if (this.mode == EditMode.Play) this.setMode(this.lastMode)

    if (this.chart.getMusicPath() != this.lastSong) {
      this.lastSong = this.chart.getMusicPath()
      const audioPlaying = this.songAudio.isPlaying()
      this.loadAudio()
      if (audioPlaying) this.songAudio.play()
    }

    this.noChartTextA.visible = false
    this.noChartTextB.visible = false

    WaterfallManager.create(
      "Loaded chart " +
        chart.difficulty +
        " " +
        chart.meter +
        " " +
        chart.gameType.id
    )
  }

  loadAudio() {
    if (!this.sm || !this.chart) return
    this.songAudio.stop()
    const musicPath = this.chart.getMusicPath()
    if (musicPath == "") {
      WaterfallManager.createFormatted(
        "Failed to load audio: no audio file",
        "error"
      )
      this.songAudio = new ChartAudio(undefined)
      return
    }
    const audioFile: File | undefined = this.getAudioFile(musicPath)
    if (audioFile == undefined) {
      WaterfallManager.createFormatted(
        "Failed to load audio: couldn't find audio file " + musicPath,
        "error"
      )
      this.songAudio = new ChartAudio(undefined)
      return
    }
    const audio_url = URL.createObjectURL(audioFile)
    this.songAudio = new ChartAudio(audio_url)
    this.songAudio.seek(this.time)
    this.getAssistTickIndex()
  }

  private getAudioFile(musicPath: string) {
    let audioFile: File | undefined = this.app.files.getFileRelativeTo(
      this.sm_path,
      musicPath
    )
    if (audioFile) return audioFile

    //Capitalization error
    let dir = this.sm_path.split("/")
    dir.pop()
    dir = dir.concat(musicPath.split("/"))
    const aName = dir.pop()!
    const path = this.app.files.resolvePath(dir).join("/")
    const files = Object.entries(this.app.files.files)
      .filter(entry => entry[0].startsWith(path))
      .map(entry => entry[1])
    audioFile = files.filter(
      file => file.name.toLowerCase() == aName.toLowerCase()
    )[0]
    if (audioFile) {
      WaterfallManager.createFormatted(
        "Failed to locate audio file " +
          musicPath +
          ", using file " +
          audioFile.name +
          " instead",
        "warn"
      )
      return audioFile
    }

    //Any audio file in dir
    audioFile = files.filter(file => file.type.startsWith("audio/"))[0]
    if (audioFile) {
      WaterfallManager.createFormatted(
        "Failed to locate audio file " +
          musicPath +
          ", using file " +
          audioFile.name +
          " instead",
        "warn"
      )
    }
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
    this.songAudio.rate(rate)
  }

  setVolume(volume: number) {
    this.songAudio.volume(volume)
  }

  setEffectVolume(volume: number) {
    if (this.assistTick.volume() != volume) this.assistTick.volume(volume)
    if (this.me_high.volume() != volume) this.me_high.volume(volume)
    if (this.me_low.volume() != volume) this.me_low.volume(volume)
    if (this.mine.volume() != volume) this.mine.volume(volume)
  }

  getAssistTickIndex() {
    if (
      this.sm == undefined ||
      this.chart == undefined ||
      this.chartView == undefined ||
      this.chart.notedata.length == 0
    ) {
      this.noteIndex = 0
      return
    }
    this.noteIndex = bsearch(this.chart.notedata, this.time, a => a.second) + 1
    if (
      this.noteIndex >= 1 &&
      this.time <= this.chart.notedata[this.noteIndex - 1].second
    )
      this.noteIndex--
  }

  playPause() {
    if (this.songAudio.isPlaying()) this.songAudio.pause()
    else this.songAudio.play()
  }

  setAndSnapBeat(beat: number) {
    const snap = Math.max(0.001, Options.chart.snap)
    let newbeat = Math.round(beat / snap) * snap
    newbeat = Math.max(0, newbeat)
    this.setBeat(newbeat)
  }

  previousSnap() {
    this.snapIndex = (this.snapIndex - 1 + SNAPS.length) % SNAPS.length
    Options.chart.snap =
      SNAPS[this.snapIndex] == -1 ? 0 : 1 / SNAPS[this.snapIndex]
  }

  nextSnap() {
    this.snapIndex = (this.snapIndex + 1 + SNAPS.length) % SNAPS.length
    Options.chart.snap =
      SNAPS[this.snapIndex] == -1 ? 0 : 1 / SNAPS[this.snapIndex]
  }

  private removeDuplicateBeats(arr: number[]): number[] {
    if (arr.length === 0) return arr
    const ret = [arr[0]]
    for (let i = 1; i < arr.length; i++) {
      if (arr[i - 1] !== arr[i]) {
        ret.push(arr[i])
      }
    }
    return ret
  }

  previousNote() {
    if (
      this.sm == undefined ||
      this.chart == undefined ||
      this.chartView == undefined
    )
      return
    if (this.chart.notedata.length == 0) return
    const holdTails = this.chart.notedata
      .filter(isHoldNote)
      .map(note => note.beat + note.hold)
    let beats = this.chart.notedata
      .map(note => note.beat)
      .concat(holdTails)
      .sort((a, b) => a - b)
    beats = this.removeDuplicateBeats(beats)
    let index = bsearch(beats, this.beat)
    if (this.beat == beats[index]) index--
    this.setBeat(beats[Math.max(0, index)])
  }

  nextNote() {
    if (
      this.sm == undefined ||
      this.chart == undefined ||
      this.chartView == undefined
    )
      return
    if (this.chart.notedata.length == 0) return
    const holdTails = this.chart.notedata
      .filter(isHoldNote)
      .map(note => note.beat + note.hold)
    let beats = this.chart.notedata
      .map(note => note.beat)
      .concat(holdTails)
      .sort((a, b) => a - b)
    beats = this.removeDuplicateBeats(beats)
    let index = bsearch(beats, this.beat)
    if (this.beat >= beats[index]) index++
    this.setBeat(beats[Math.min(beats.length - 1, index)])
  }

  firstNote() {
    if (
      this.sm == undefined ||
      this.chart == undefined ||
      this.chartView == undefined
    )
      return
    if (this.chart.notedata.length == 0) return
    this.setBeat(this.chart.notedata[0].beat)
  }

  lastNote() {
    if (
      this.sm == undefined ||
      this.chart == undefined ||
      this.chartView == undefined
    )
      return
    if (this.chart.notedata.length == 0) return
    const note = this.chart.notedata[this.chart.notedata.length - 1]
    this.setBeat(note.beat + (isHoldNote(note) ? note.hold : 0))
  }

  setNote(col: number, type: "mouse" | "key", beat?: number) {
    if (
      this.sm == undefined ||
      this.chart == undefined ||
      this.chartView == undefined
    )
      return
    beat = beat ?? this.beat
    beat = Math.max(0, Math.round(beat * 48) / 48)
    const conflictingNote = this.chart.notedata.filter(note => {
      if (note.col != col) return false
      if (Math.abs(note.beat - beat!) < 0.003) return true
      return (
        isHoldNote(note) && note.beat <= beat! && note.beat + note.hold >= beat!
      )
    })

    const holdEdit: PartialHold = {
      startBeat: beat,
      endBeat: beat,
      roll: false,
      originalNote: undefined,
      type,
      removedNotes: conflictingNote,
    }
    this.holdEditing[col] = holdEdit

    if (conflictingNote.length == 0) {
      holdEdit.originalNote = {
        beat: beat,
        col: col,
        type: this.getEditingNoteType(),
      }
    }
    this.getAssistTickIndex()
    this.app.actionHistory.run({
      action: () => {
        holdEdit.removedNotes.forEach(note => this.chart!.removeNote(note))
        if (holdEdit.originalNote) this.chart!.addNote(holdEdit.originalNote)
      },
      undo: () => {
        if (holdEdit.originalNote) this.chart!.removeNote(holdEdit.originalNote)
        holdEdit.removedNotes.forEach(note => this.chart!.addNote(note))
      },
    })
  }

  editHoldBeat(col: number, beat: number, roll: boolean) {
    if (
      this.sm == undefined ||
      this.chart == undefined ||
      this.chartView == undefined
    )
      return
    const hold = this.holdEditing[col]
    if (hold == undefined) return
    if (beat == hold.startBeat && beat == hold.endBeat) return

    hold.startBeat = Math.max(
      0,
      Math.round(Math.min(beat, hold.startBeat) * 48) / 48
    )
    hold.endBeat = Math.max(
      0,
      Math.round(Math.max(beat, hold.endBeat) * 48) / 48
    )
    hold.roll ||= roll
    if (!hold.originalNote) {
      this.chart.addNote({
        beat: hold.startBeat,
        col: col,
        type: hold.roll ? "Roll" : "Hold",
        hold: hold.endBeat - hold.startBeat,
      })
    } else {
      const props = {
        beat: hold.startBeat,
        type: hold.roll ? "Roll" : "Hold",
        hold: hold.endBeat - hold.startBeat,
      }
      if (
        props.beat != hold.originalNote.beat ||
        props.type != hold.originalNote.type ||
        !isHoldNote(hold.originalNote) ||
        props.hold != hold.originalNote.hold
      ) {
        this.chart.modifyNote(hold.originalNote, props)
      }
    }
    hold.originalNote = {
      beat: hold.startBeat,
      col: col,
      type: hold.roll ? "Roll" : "Hold",
      hold: hold.endBeat - hold.startBeat,
    }
    const conflictingNotes = this.chart.notedata.filter(note => {
      if (
        note.beat == hold.originalNote!.beat &&
        note.col == hold.originalNote!.col
      )
        return false
      if (note.col != col) return false
      if (note.beat >= hold.startBeat && note.beat <= hold.endBeat) return true
      return (
        isHoldNote(note) &&
        note.beat + note.hold >= hold.startBeat &&
        note.beat + note.hold <= hold.endBeat
      )
    })
    hold.removedNotes = hold.removedNotes.concat(conflictingNotes)
    conflictingNotes.forEach(note => this.chart!.removeNote(note))
    this.getAssistTickIndex()
  }

  endEditing(col: number) {
    this.holdEditing[col] = undefined
  }

  previousNoteType() {
    const numNoteTypes = this.chart?.gameType.editNoteTypes.length ?? 0
    this.editNoteTypeIndex =
      (this.editNoteTypeIndex - 1 + numNoteTypes) % numNoteTypes
  }

  nextNoteType() {
    const numNoteTypes = this.chart?.gameType.editNoteTypes.length ?? 0
    this.editNoteTypeIndex =
      (this.editNoteTypeIndex + 1 + numNoteTypes) % numNoteTypes
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
      for (const note of this.chart.notedata) {
        if (note.second < this.time) note.gameplay!.hasHit = true
        else break
      }
      this.chart.gameType.gameLogic.reset(this)
      this.gameStats = new GameplayStats(this)
      this.widgetManager.startPlay()
      this.songAudio.seek(this.time - 1)
      this.songAudio.play()
    } else {
      this.chartView.endPlay()
      this.chart?.notedata.forEach(note => (note.gameplay = undefined))
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
