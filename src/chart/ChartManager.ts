import { Howl } from "howler/dist/howler.core.min.js"
import { BitmapText } from "pixi.js"
import { App } from "../App"
import { AUDIO_EXT } from "../data/FileData"
import { IS_OSX, KEYBIND_DATA } from "../data/KeybindData"
import { WaterfallManager } from "../gui/element/WaterfallManager"
import { DebugWidget } from "../gui/widget/DebugWidget"
import { WidgetManager } from "../gui/widget/WidgetManager"
import { ChartListWindow } from "../gui/window/ChartListWindow"
import { ConfirmationWindow } from "../gui/window/ConfirmationWindow"
import { ActionHistory } from "../util/ActionHistory"
import {
  decodeNotes,
  decodeTempo,
  encodeNotes,
  encodeTempo,
} from "../util/Ascii85"
import { EventHandler } from "../util/EventHandler"
import { Keybinds } from "../util/Keybinds"
import { clamp } from "../util/Math"
import { Options } from "../util/Options"
import { basename, dirname, extname } from "../util/Path"
import { tpsUpdate } from "../util/Performance"
import { RecentFileHandler } from "../util/RecentFileHandler"
import { bsearch } from "../util/Util"
import { FileHandler } from "../util/file-handler/FileHandler"
import { ChartRenderer } from "./ChartRenderer"
import { ChartAudio } from "./audio/ChartAudio"
import { GameTypeRegistry } from "./gameTypes/GameTypeRegistry"
import { GameplayStats } from "./play/GameplayStats"
import { TIMING_WINDOW_AUTOPLAY } from "./play/StandardTimingWindow"
import { Chart } from "./sm/Chart"
import {
  Notedata,
  NotedataEntry,
  PartialNotedataEntry,
  isHoldNote,
} from "./sm/NoteTypes"
import { Simfile } from "./sm/Simfile"
import { TimingEvent } from "./sm/TimingTypes"

const SNAPS = [1, 2, 3, 4, 6, 8, 12, 16, 24, 48, -1]

interface PartialHold {
  startBeat: number
  endBeat: number
  roll: boolean
  type: "mouse" | "key"
  originalNote: PartialNotedataEntry | undefined
  removedNotes: PartialNotedataEntry[]
}

interface Selection {
  notes: Notedata
  shift?: {
    columnShift: number
    beatShift: number
  }
  inProgressNotes: Notedata
}

interface EventSelection {
  shift?: {
    beatShift: number
  }
  timingEvents: TimingEvent[]
  inProgressTimingEvents: TimingEvent[]
}

export enum EditMode {
  View = "View Mode",
  Edit = "Edit Mode",
  Play = "Play Mode",
  Record = "Record Mode",
}

export enum EditTimingMode {
  Off,
  Edit,
  Add,
}

export class ChartManager {
  app: App

  chartAudio: ChartAudio = new ChartAudio()
  chartView?: ChartRenderer
  widgetManager: WidgetManager

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

  loadedSM?: Simfile
  smPath = ""
  loadedChart?: Chart

  selection: Selection = {
    notes: [],
    inProgressNotes: [],
  }

  eventSelection: EventSelection = {
    timingEvents: [],
    inProgressTimingEvents: [],
  }

  editTimingMode = EditTimingMode.Off

  private beat = 0
  private time = 0

  private holdEditing: (PartialHold | undefined)[] = []
  private editNoteTypeIndex = 0

  private snapIndex = 0
  private partialScroll = 0
  private noteIndex = 0
  private lastMetronomeDivision = -1
  private lastMetronomeMeasure = -1

  private lastSong = ""

  private mode: EditMode = EditMode.Edit
  private lastMode: EditMode = EditMode.Edit

  private noChartTextA: BitmapText
  private noChartTextB: BitmapText

  private virtualClipboard = ""

  startRegion?: number
  endRegion?: number

  gameStats?: GameplayStats

  constructor(app: App) {
    this.app = app

    // Override default cut/copy/paste
    document.addEventListener(
      "cut",
      e => {
        if ((<HTMLElement>e.target).classList.contains("inlineEdit")) return
        if (e.target instanceof HTMLTextAreaElement) return
        if (e.target instanceof HTMLInputElement) return
        if (this.mode != EditMode.Edit) return
        const data = this.copy()
        if (data) e.clipboardData?.setData("text/plain", data)
        this.deleteSelection()
        e.preventDefault()
      },
      true
    )
    document.addEventListener(
      "copy",
      e => {
        if ((<HTMLElement>e.target).classList.contains("inlineEdit")) return
        if (e.target instanceof HTMLTextAreaElement) return
        if (e.target instanceof HTMLInputElement) return
        if (this.mode != EditMode.Edit) return
        const data = this.copy()
        if (data) e.clipboardData?.setData("text/plain", data)
        e.preventDefault()
        e.stopImmediatePropagation()
      },
      true
    )
    document.addEventListener(
      "paste",
      e => {
        if ((<HTMLElement>e.target).classList.contains("inlineEdit")) return
        if (e.target instanceof HTMLTextAreaElement) return
        if (e.target instanceof HTMLInputElement) return
        if (this.mode != EditMode.Edit) return
        const clipboard = e.clipboardData?.getData("text/plain")
        if (clipboard) this.paste(clipboard)
        e.preventDefault()
        e.stopImmediatePropagation()
      },
      true
    )

    // Scrolling
    app.view.addEventListener?.("wheel", (event: WheelEvent) => {
      if (
        this.loadedSM == undefined ||
        this.loadedChart == undefined ||
        this.chartView == undefined
      )
        return
      event.preventDefault()
      if ((IS_OSX && event.metaKey) || (!IS_OSX && event.ctrlKey)) {
        // Change the playfield's speed
        Options.chart.speed = clamp(
          Options.chart.speed *
            Math.pow(
              1.01,
              (event.deltaY / 5) * Options.general.scrollSensitivity
            ),
          10,
          35000
        )
      } else {
        if (this.mode == EditMode.Play || this.mode == EditMode.Record) return
        let newbeat = this.beat
        const snap = Options.chart.snap
        const speed = Options.chart.speed * (Options.chart.reverse ? -1 : 1)
        if (snap == 0) {
          this.partialScroll = 0
          newbeat =
            this.beat +
            (event.deltaY / speed) * Options.general.scrollSensitivity
        } else {
          if (Options.general.scrollSnapEveryScroll) {
            if (event.deltaY < 0) {
              newbeat = Math.round((this.beat - snap) / snap) * snap
            } else {
              newbeat = Math.round((this.beat + snap) / snap) * snap
            }
          } else {
            this.partialScroll +=
              (event.deltaY / speed) * Options.general.scrollSensitivity

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
    })

    this.widgetManager = new WidgetManager(this)
    this.app.stage.addChild(this.widgetManager)

    // No chart text
    this.noChartTextA = new BitmapText("No Chart", {
      fontName: "Main",
      fontSize: 30,
    })
    this.noChartTextA.anchor.set(0.5)
    this.noChartTextA.tint = 0x555555
    this.app.stage.addChild(this.noChartTextA)
    this.noChartTextB = new BitmapText("Create a new chart", {
      fontName: "Main",
      fontSize: 15,
    })
    this.noChartTextB.anchor.set(0.5)
    this.noChartTextB.tint = 0x556677
    this.noChartTextB.eventMode = "static"
    this.noChartTextB.on("mouseover", () => {
      this.noChartTextB.tint = 0x8899aa
    })
    this.noChartTextB.on("mouseleave", () => {
      this.noChartTextB.tint = 0x556677
    })
    this.noChartTextB.on("mousedown", () => {
      this.app.windowManager.openWindow(
        new ChartListWindow(app, GameTypeRegistry.getGameType("dance-single"))
      )
    })
    this.noChartTextA.visible = false
    this.noChartTextB.visible = false
    this.noChartTextA.x = this.app.renderer.screen.width / 2
    this.noChartTextA.y = this.app.renderer.screen.height / 2 - 20
    this.noChartTextB.x = this.app.renderer.screen.width / 2
    this.noChartTextB.y = this.app.renderer.screen.height / 2 + 10
    this.app.stage.addChild(this.noChartTextB)

    // Update ChartRenderer every frame
    this.app.ticker.add(() => {
      const updateStart = performance.now()
      this.widgetManager.update()
      if (this.loadedSM && this.loadedChart && this.chartView) {
        this.chartView.update()
      }
      DebugWidget.instance?.addDrawUpdateTimeValue(
        performance.now() - updateStart
      )
    })

    // Faster update loop, more precision
    setInterval(() => {
      if (!this.loadedSM || !this.loadedChart || !this.chartView) return
      const updateStart = performance.now()
      const time = this.chartAudio.seek()
      if (this.chartAudio.isPlaying()) {
        // Set the current beat from time
        this.setTime(time, true)

        // If digit keys are pressed, modify the current chart
        if (!this.holdEditing.every(x => !x)) {
          for (let col = 0; col < this.holdEditing.length; col++) {
            if (
              !this.holdEditing[col] ||
              this.holdEditing[col]!.type == "mouse"
            )
              continue
            let tapBeat = this.beat
            if (this.mode == EditMode.Record) {
              tapBeat = this.loadedChart.getBeatFromSeconds(
                this.time + Options.play.offset
              )
            }
            const snap = Options.chart.snap == 0 ? 1 / 48 : Options.chart.snap
            const snapBeat = Math.round(tapBeat / snap) * snap
            const hold = this.holdEditing[col]!
            const holdLength =
              Math.max(
                0,
                Math.round(Math.max(this.beat, hold.endBeat) * 48) / 48
              ) -
              Math.max(
                0,
                Math.round(Math.min(this.beat, hold.startBeat) * 48) / 48
              )
            // Minimum hold length of 0.3 seconds
            if (
              (holdLength * 60) /
                this.loadedChart.timingData.getBPM(this.beat) >
              0.3
            )
              this.editHoldBeat(col, snapBeat, false)
          }
        }
      }

      const notedata = this.loadedChart.getNotedata()
      // Play assist tick
      let hasPlayedAssistTick = false
      while (
        this.noteIndex < notedata.length &&
        time > notedata[this.noteIndex].second + Options.play.effectOffset
      ) {
        if (
          this.mode != EditMode.Record &&
          this.chartAudio.isPlaying() &&
          this.loadedChart.gameType.gameLogic.shouldAssistTick(
            notedata[this.noteIndex]
          )
        ) {
          if (this.mode != EditMode.Play)
            this.chartView.doJudgment(
              notedata[this.noteIndex],
              0,
              TIMING_WINDOW_AUTOPLAY
            )
          if (!hasPlayedAssistTick && Options.audio.assistTick) {
            this.assistTick.play()
            hasPlayedAssistTick = true
          }
        }
        this.noteIndex++
      }
      // Play metronome
      const offsetBeat = this.loadedChart.getBeatFromSeconds(
        this.time + Options.play.effectOffset
      )

      const offsetDivision = Math.floor(
        this.loadedChart.timingData.getDivisionOfMeasure(offsetBeat)
      )

      const offsetMeasure = Math.floor(
        this.loadedChart.timingData.getMeasure(offsetBeat)
      )

      if (
        offsetMeasure != this.lastMetronomeMeasure ||
        offsetDivision != this.lastMetronomeDivision
      ) {
        this.lastMetronomeDivision = offsetDivision
        this.lastMetronomeMeasure = offsetMeasure
        if (this.chartAudio.isPlaying() && Options.audio.metronome) {
          if (offsetDivision == 0) this.me_high.play()
          else this.me_low.play()
        }
      }
      // Update the game logic
      if (this.mode == EditMode.Play) {
        this.loadedChart.gameType.gameLogic.update(this)
      }
      this.updateSoundProperties()
      tpsUpdate()
      DebugWidget.instance?.addUpdateTimeValue(performance.now() - updateStart)
    }, 5)

    EventHandler.on("resize", () => {
      if (this.chartView) {
        this.chartView.x = this.app.renderer.screen.width / 2
        this.chartView.y = this.app.renderer.screen.height / 2
      }
      this.noChartTextA.x = this.app.renderer.screen.width / 2
      this.noChartTextA.y = this.app.renderer.screen.height / 2 - 20
      this.noChartTextB.x = this.app.renderer.screen.width / 2
      this.noChartTextB.y = this.app.renderer.screen.height / 2 + 10
    })

    EventHandler.on("chartModified", () => {
      if (this.loadedChart) {
        this.loadedChart.recalculateStats()
        EventHandler.emit("chartModifiedAfter")
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
        const keyName = Keybinds.getKeyNameFromCode(event.code)
        if (this.mode != EditMode.Edit) return
        if ((<HTMLElement>event.target).classList.contains("inlineEdit")) return
        if (event.target instanceof HTMLTextAreaElement) return
        if (event.target instanceof HTMLInputElement) return
        //Start editing note
        if (
          event.code.startsWith("Digit") &&
          !event.repeat &&
          !event.ctrlKey &&
          !event.metaKey &&
          !event.altKey &&
          !event.ctrlKey
        ) {
          const col = parseInt(event.code.slice(5)) - 1
          if (col < (this.loadedChart?.gameType.numCols ?? 4) && col > -1) {
            this.setNote(col, "key")
            event.preventDefault()
            event.stopImmediatePropagation()
          }
        }
        if (!this.holdEditing.every(x => x == undefined)) {
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
            if (
              KEYBIND_DATA[keybind].combos.map(x => x.key).includes(keyName)
            ) {
              event.preventDefault()
              event.stopImmediatePropagation()
              KEYBIND_DATA[keybind].callback(this.app)
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
            if (
              KEYBIND_DATA[keybind].combos.map(x => x.key).includes(keyName)
            ) {
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
        if (this.mode != EditMode.Play && this.mode != EditMode.Record) return
        if (event.key == "Escape") {
          this.setMode(this.lastMode)
          this.chartAudio.pause()
        }
      },
      true
    )
  }

  /**
   * Returns the current beat.
   *
   * @return {*}  {number}
   * @memberof ChartManager
   */
  getBeat(): number {
    return this.beat
  }

  /**
   * Returns the current time.
   *
   * @return {*}  {number}
   * @memberof ChartManager
   */
  getTime(): number {
    return this.time
  }

  /**
   * Sets the current beat to the specified value. Also updates the current time.
   *
   * @param {number} beat
   * @memberof ChartManager
   */
  setBeat(beat: number) {
    if (!this.loadedChart) return
    this.beat = beat
    this.time = this.loadedChart.getSecondsFromBeat(this.beat)
    this.chartAudio.seek(this.time)
    this.getAssistTickIndex()
  }

  /**
   * Sets the current time to the specified value. Also updates the current beat.
   *
   * @param {number} time
   * @param {boolean} [ignoreSetSongTime] - If set to true, does not update the audio position.
   * @memberof ChartManager
   */
  setTime(time: number, ignoreSetSongTime?: boolean) {
    if (!this.loadedChart) return
    this.time = time
    this.beat = this.loadedChart.getBeatFromSeconds(this.time)
    if (!ignoreSetSongTime) {
      this.chartAudio.seek(this.time)
      this.getAssistTickIndex()
    }
  }

  /**
   * Loads the SM from the specified path. If no path is specified, the current SM is hidden.
   *
   * @param {string} [path]
   * @memberof ChartManager
   */
  async loadSM(path?: string) {
    // Save confirmation
    if (ActionHistory.instance.isDirty()) {
      const window = new ConfirmationWindow(
        this.app,
        "Save",
        "Do you wish to save the current file?",
        [
          {
            label: "Cancel",
            type: "default",
          },
          {
            label: "No",
            type: "default",
          },
          {
            label: "Yes",
            type: "confirm",
          },
        ]
      )
      this.app.windowManager.openWindow(window)
      const option = await window.resolved
      if (option == "Cancel") return
      if (option == "Yes") this.save()
    }

    // Destroy everything if no path specified
    if (!path) {
      this.smPath = ""
      this.loadedSM = undefined
      this.chartAudio.stop()
      this.noChartTextA.visible = false
      this.noChartTextB.visible = false
      this.chartView?.destroy({ children: true })
      return
    }

    this.chartAudio.stop()
    this.lastSong = ""
    this.smPath = path
    this.time = 0
    this.beat = 0

    // Load the SM file
    const smHandle = await FileHandler.getFileHandle(this.smPath)
    const smFile = await smHandle!.getFile()
    this.loadedSM = new Simfile(smFile)

    await this.loadedSM.loaded

    this.noChartTextA.visible = true
    this.noChartTextB.visible = true
    this.editTimingMode = EditTimingMode.Off

    EventHandler.emit("smLoaded")
    await this.loadChart()
    EventHandler.emit("smLoadedAfter")
    if (this.time == 0) this.setBeat(0)

    RecentFileHandler.addSM(this.smPath, this.loadedSM)
  }

  /**
   * Loads the specified chart. If no chart is loaded, the chart with the highest difficulty is loaded.
   *
   * @param {Chart} [chart]
   * @memberof ChartManager
   */
  async loadChart(chart?: Chart) {
    if (this.loadedSM == undefined) return

    // Find the chart with the highest difficulty
    if (chart == undefined) {
      if (this.loadedChart) {
        const charts = this.loadedSM.charts[this.loadedChart.gameType.id]
        if (charts && charts.length > 0) {
          chart = charts.at(-1)
        }
      }
      if (!chart) {
        for (const gameType of GameTypeRegistry.getPriority()) {
          const charts = this.loadedSM.charts[gameType.id]
          if (charts && charts.length > 0) {
            chart = charts.at(-1)
            break
          }
        }
      }
      // If no chart is found, display the no chart text.
      if (!chart) {
        this.chartView?.destroy({ children: true })
        this.chartView?.removeChildren()
        this.beat = 0
        this.time = 0
        this.loadedChart = undefined
        this.chartView = undefined
        this.noChartTextA.visible = true
        this.noChartTextB.visible = true
        EventHandler.emit("chartLoaded")
        EventHandler.emit("chartModified")
        return
      }
    }

    if (chart == this.loadedChart) return
    this.chartView?.destroy({ children: true })
    this.chartView?.removeChildren()

    // Load the chart
    this.clearSelections()
    this.loadedChart = chart
    this.beat = this.loadedChart.getBeatFromSeconds(this.time)
    ActionHistory.instance.reset()

    Options.play.timingCollection =
      Options.play.defaultTimingCollection[chart.gameType.id] ?? "ITG"

    this.getAssistTickIndex()
    this.chartView = new ChartRenderer(this)
    this.chartView.x = this.app.renderer.screen.width / 2
    this.chartView.y = this.app.renderer.screen.height / 2
    if (this.mode == EditMode.Play || this.mode == EditMode.Record)
      this.setMode(this.lastMode)

    if (this.loadedChart.getMusicPath() != this.lastSong) {
      this.lastSong = this.loadedChart.getMusicPath()
      const audioPlaying = this.chartAudio.isPlaying()
      await this.loadAudio()
      EventHandler.emit("audioLoaded")
      if (audioPlaying) this.chartAudio.play()
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

    EventHandler.emit("chartLoaded")
    EventHandler.emit("audioLoaded")
    EventHandler.emit("chartModified")
  }

  /**
   * Loads the audio of the current chart.
   *
   * @memberof ChartManager
   */
  async loadAudio() {
    if (!this.loadedSM || !this.loadedChart) return
    this.chartAudio.stop()
    this.chartAudio?.destroy()
    const musicPath = this.loadedChart.getMusicPath()
    if (musicPath == "") {
      WaterfallManager.createFormatted(
        "Failed to load audio: no audio file",
        "error"
      )
      this.chartAudio = new ChartAudio(undefined)
      return
    }
    const audioHandle = await this.getAudioHandle(musicPath)
    if (audioHandle == undefined) {
      WaterfallManager.createFormatted(
        "Failed to load audio: couldn't find audio file " + musicPath,
        "error"
      )
      this.chartAudio = new ChartAudio(undefined)
      return
    }
    const audioFile = await audioHandle.getFile()
    this.chartAudio = new ChartAudio(await audioFile.arrayBuffer())
    this.chartAudio.seek(this.time)
    this.getAssistTickIndex()
  }

  /**
   * Finds the audio file associated with the music path.
   * If none is found, attempt to find other audio files in the directory.
   *
   * @private
   * @param {string} musicPath
   * @return {*}
   * @memberof ChartManager
   */
  private async getAudioHandle(musicPath: string) {
    let audioHandle: FileSystemFileHandle | undefined =
      await FileHandler.getFileHandleRelativeTo(this.smPath, musicPath)
    if (audioHandle) return audioHandle

    //Capitalization error
    const dirFiles = await FileHandler.getDirectoryFiles(dirname(this.smPath))
    audioHandle = dirFiles.filter(
      fileHandle =>
        fileHandle.name.toLowerCase() == basename(musicPath).toLowerCase()
    )[0]
    if (audioHandle) {
      WaterfallManager.createFormatted(
        "Failed to locate audio file " +
          musicPath +
          ", using file " +
          audioHandle.name +
          " instead",
        "warn"
      )
      return audioHandle
    }

    //Any audio file in dir
    audioHandle = dirFiles.filter(fileHandle =>
      AUDIO_EXT.includes(extname(fileHandle.name))
    )[0]
    if (audioHandle) {
      WaterfallManager.createFormatted(
        "Failed to locate audio file " +
          musicPath +
          ", using file " +
          audioHandle.name +
          " instead",
        "warn"
      )
    }
    return audioHandle
  }

  getAudio(): ChartAudio {
    return this.chartAudio
  }

  private updateSoundProperties() {
    this.setEffectVolume(
      Options.audio.soundEffectVolume * Options.audio.masterVolume
    )
    this.setVolume(Options.audio.songVolume * Options.audio.masterVolume)
    this.setRate(Options.audio.rate)
  }

  setRate(rate: number) {
    this.chartAudio.rate(rate)
  }

  setVolume(volume: number) {
    this.chartAudio.volume(volume)
  }

  setEffectVolume(volume: number) {
    if (this.assistTick.volume() != volume) this.assistTick.volume(volume)
    if (this.me_high.volume() != volume) this.me_high.volume(volume)
    if (this.me_low.volume() != volume) this.me_low.volume(volume)
    if (this.mine.volume() != volume) this.mine.volume(volume)
  }

  private getAssistTickIndex() {
    if (
      this.loadedSM == undefined ||
      this.loadedChart == undefined ||
      this.chartView == undefined ||
      this.loadedChart.getNotedata().length == 0
    ) {
      this.noteIndex = 0
      return
    }
    this.noteIndex =
      bsearch(this.loadedChart.getNotedata(), this.time, a => a.second) + 1
    if (
      this.noteIndex >= 1 &&
      this.time <= this.loadedChart.getNotedata()[this.noteIndex - 1].second
    )
      this.noteIndex--
  }

  playPause() {
    if (this.chartAudio.isPlaying()) this.chartAudio.pause()
    else this.chartAudio.play()
  }

  setAndSnapBeat(beat: number) {
    if (!this.loadedChart) return
    const snap = Math.max(0.001, Options.chart.snap)
    const beatOfMeasure = this.loadedChart.timingData.getBeatOfMeasure(beat)
    const measureBeat = beat - beatOfMeasure
    const newBeatOfMeasure = Math.round(beatOfMeasure / snap) * snap
    let newBeat = measureBeat + newBeatOfMeasure
    newBeat = Math.max(0, newBeat)
    this.setBeat(newBeat)
  }

  previousSnap() {
    this.snapIndex = (this.snapIndex - 1 + SNAPS.length) % SNAPS.length
    Options.chart.snap =
      SNAPS[this.snapIndex] == -1 ? 0 : 1 / SNAPS[this.snapIndex]
    EventHandler.emit("snapChanged")
  }

  nextSnap() {
    this.snapIndex = (this.snapIndex + 1 + SNAPS.length) % SNAPS.length
    Options.chart.snap =
      SNAPS[this.snapIndex] == -1 ? 0 : 1 / SNAPS[this.snapIndex]
    EventHandler.emit("snapChanged")
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

  /**
   * Seeks to the previous note.
   *
   * @memberof ChartManager
   */
  previousNote() {
    if (
      this.loadedSM == undefined ||
      this.loadedChart == undefined ||
      this.chartView == undefined
    )
      return
    if (this.loadedChart.getNotedata().length == 0) return
    const holdTails = this.loadedChart
      .getNotedata()
      .filter(isHoldNote)
      .map(note => note.beat + note.hold)
    let beats = this.loadedChart
      .getNotedata()
      .map(note => note.beat)
      .concat(holdTails)
      .sort((a, b) => a - b)
    beats = this.removeDuplicateBeats(beats)
    let index = bsearch(beats, this.beat)
    if (this.beat == beats[index]) index--
    this.setBeat(beats[Math.max(0, index)])
  }

  /**
   * Seeks to the next note.
   *
   * @memberof ChartManager
   */
  nextNote() {
    if (
      this.loadedSM == undefined ||
      this.loadedChart == undefined ||
      this.chartView == undefined
    )
      return
    if (this.loadedChart.getNotedata().length == 0) return
    const holdTails = this.loadedChart
      .getNotedata()
      .filter(isHoldNote)
      .map(note => note.beat + note.hold)
    let beats = this.loadedChart
      .getNotedata()
      .map(note => note.beat)
      .concat(holdTails)
      .sort((a, b) => a - b)
    beats = this.removeDuplicateBeats(beats)
    let index = bsearch(beats, this.beat)
    if (this.beat >= beats[index]) index++
    this.setBeat(beats[Math.min(beats.length - 1, index)])
  }

  /**
   * Seeks to the first note.
   *
   * @memberof ChartManager
   */
  firstNote() {
    if (
      this.loadedSM == undefined ||
      this.loadedChart == undefined ||
      this.chartView == undefined
    )
      return
    const notedata = this.loadedChart.getNotedata()
    if (notedata.length == 0) return
    this.setBeat(notedata[0].beat)
  }

  /**
   * Seeks to the last note.
   *
   * @memberof ChartManager
   */
  lastNote() {
    if (
      this.loadedSM == undefined ||
      this.loadedChart == undefined ||
      this.chartView == undefined
    )
      return
    const notedata = this.loadedChart.getNotedata()
    if (notedata.length == 0) return
    const note = notedata[notedata.length - 1]
    this.setBeat(note.beat + (isHoldNote(note) ? note.hold : 0))
  }

  /**
   * Places/removes a note at the specified beat and column
   *
   * @param {number} col - The column to place the note at
   * @param {("mouse" | "key")} type - The input type
   * @param {number} [beat] - The beat to place the note at. Defaults to the current beat.
   * @memberof ChartManager
   */
  setNote(col: number, type: "mouse" | "key", beat?: number) {
    if (
      this.loadedSM == undefined ||
      this.loadedChart == undefined ||
      this.chartView == undefined
    )
      return
    beat = beat ?? this.beat
    beat = Math.max(0, Math.round(beat * 48) / 48)
    const conflictingNote = this.loadedChart.getNotedata().filter(note => {
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
        holdEdit.removedNotes.forEach(note =>
          this.loadedChart!.removeNote(note)
        )
        if (holdEdit.originalNote)
          this.loadedChart!.addNote(holdEdit.originalNote)
      },
      undo: () => {
        if (holdEdit.originalNote)
          this.loadedChart!.removeNote(holdEdit.originalNote)
        holdEdit.removedNotes.forEach(note => this.loadedChart!.addNote(note))
      },
    })
  }

  /**
   * Extends the hold in the specified column to the current beat
   *
   * @param {number} col - The column of the hold.
   * @param {number} beat - The beat to extend to
   * @param {boolean} roll - Whether to convert holds into rolls
   * @memberof ChartManager
   */
  editHoldBeat(col: number, beat: number, roll: boolean) {
    if (
      this.loadedSM == undefined ||
      this.loadedChart == undefined ||
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
      this.loadedChart.addNote({
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
        this.loadedChart.modifyNote(hold.originalNote, props)
      }
    }
    hold.originalNote = {
      beat: hold.startBeat,
      col: col,
      type: hold.roll ? "Roll" : "Hold",
      hold: hold.endBeat - hold.startBeat,
    }
    const conflictingNotes = this.loadedChart.getNotedata().filter(note => {
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
    conflictingNotes.forEach(note => this.loadedChart!.removeNote(note))
    this.getAssistTickIndex()
  }

  /**
   * Stops editing in a column
   *
   * @param {number} col
   * @memberof ChartManager
   */
  endEditing(col: number) {
    this.holdEditing[col] = undefined
  }

  previousNoteType() {
    const numNoteTypes = this.loadedChart?.gameType.editNoteTypes.length ?? 0
    this.editNoteTypeIndex =
      (this.editNoteTypeIndex - 1 + numNoteTypes) % numNoteTypes
  }

  nextNoteType() {
    const numNoteTypes = this.loadedChart?.gameType.editNoteTypes.length ?? 0
    this.editNoteTypeIndex =
      (this.editNoteTypeIndex + 1 + numNoteTypes) % numNoteTypes
  }

  getEditingNoteType(): string {
    return (
      this.loadedChart?.gameType.editNoteTypes[this.editNoteTypeIndex] ?? ""
    )
  }

  setEditingNoteType(type: string) {
    if (!this.loadedChart) return
    const types = this.loadedChart?.gameType.editNoteTypes
    const index = types.indexOf(type)
    if (index == -1) return
    this.editNoteTypeIndex = index
  }

  /**
   * Gets the current mode.
   *
   * @return {*}  {EditMode}
   * @memberof ChartManager
   */
  getMode(): EditMode {
    return this.mode
  }

  /**
   * Sets the current mode to the specified mode.
   *
   * @param {EditMode} mode
   * @memberof ChartManager
   */
  setMode(mode: EditMode) {
    if (!this.loadedChart || !this.chartView) return
    if (this.mode == mode) {
      if (mode == EditMode.Play || mode == EditMode.Record) {
        this.setMode(this.lastMode)
        this.getAssistTickIndex()
        this.chartAudio.pause()
      }
      return
    }
    if (this.mode == EditMode.View || this.mode == EditMode.Edit)
      this.lastMode = this.mode
    this.mode = mode

    const notedata = this.loadedChart.getNotedata()
    if (this.mode == EditMode.Play) {
      notedata.forEach(note => {
        note.gameplay = {
          hideNote: false,
          hasHit: false,
        }
      })
      for (const note of notedata) {
        if (note.second < this.time) note.gameplay!.hasHit = true
        else break
      }
      this.loadedChart.gameType.gameLogic.endPlay(this)
      this.gameStats = new GameplayStats(this)
      this.widgetManager.startPlay()
      this.chartAudio.seek(Math.max(0, this.time) - 1)
      this.chartAudio.play()
    } else if (this.mode == EditMode.Record) {
      this.chartAudio.seek(Math.max(0, this.time) - 1)
      this.chartAudio.play()
    } else {
      this.chartView.endPlay()
      notedata.forEach(note => (note.gameplay = undefined))
    }
  }

  /**
   * Judges a key down on a certain column.
   * Places notes if the current mode is Record Mode.
   * @param {number} col
   * @memberof ChartManager
   */
  judgeCol(col: number) {
    if (!this.loadedChart || !this.chartView) return
    if (this.mode == EditMode.Play)
      this.loadedChart.gameType.gameLogic.keyDown(this, col)
    else if (this.mode == EditMode.Record) {
      const tapBeat = this.loadedChart.getBeatFromSeconds(
        this.time + Options.play.offset
      )
      const snap = Options.chart.snap == 0 ? 1 / 48 : Options.chart.snap
      const snapBeat = Math.round(tapBeat / snap) * snap
      this.setNote(col, "key", snapBeat)
    }
  }

  /**
   * Judges a key up on a certain column.
   *
   * @param {number} col
   * @memberof ChartManager
   */
  judgeColUp(col: number) {
    if (!this.loadedChart || !this.chartView) return
    if (this.mode == EditMode.Play)
      this.loadedChart.gameType.gameLogic.keyUp(this, col)
    else if (this.mode == EditMode.Record) this.endEditing(col)
  }

  /**
   * Saves the current chart to disk.
   *
   * @memberof ChartManager
   */
  async save() {
    if (!this.loadedSM) return
    if (!ActionHistory.instance.isDirty()) {
      WaterfallManager.create("Saved")
      return
    }
    const path_arr = this.smPath.split("/")
    const name = path_arr.pop()!.split(".").slice(0, -1).join(".")
    const path = path_arr.join("/")
    if (
      !this.loadedSM.usesSplitTiming() &&
      (await FileHandler.getFileHandle(path + "/" + name + ".sm"))
    ) {
      FileHandler.writeFile(
        path + "/" + name + ".sm",
        this.loadedSM.serialize("sm")
      )
    }
    if (
      this.loadedSM.requiresSSC() ||
      (await FileHandler.getFileHandle(path + "/" + name + ".ssc"))
    )
      FileHandler.writeFile(
        path + "/" + name + ".ssc",
        this.loadedSM.serialize("ssc")
      )
    if (this.loadedSM.usesSplitTiming()) {
      WaterfallManager.create("Saved. No SM file since split timing was used.")
    } else {
      WaterfallManager.create("Saved")
    }
    ActionHistory.instance.setLimit()
    return
  }

  hasSelection() {
    return (
      this.selection.notes.length > 0 ||
      this.eventSelection.timingEvents.length > 0 ||
      (this.startRegion !== undefined && this.endRegion !== undefined)
    )
  }

  hasRange() {
    return (
      this.selection.notes.length > 1 ||
      this.eventSelection.timingEvents.length > 1 ||
      (this.startRegion !== undefined && this.endRegion !== undefined)
    )
  }

  /**
   * Clears the current selection
   *
   * @memberof ChartManager
   */
  clearSelections() {
    this.selection = {
      notes: [],
      inProgressNotes: [],
    }
    this.eventSelection = {
      timingEvents: [],
      inProgressTimingEvents: [],
    }
  }

  startDragSelection() {
    this.selection.inProgressNotes = []
  }

  endDragSelection() {
    this.selection.notes = this.selection.notes.concat(
      this.selection.inProgressNotes
    )
  }

  startDragEventSelection() {
    this.eventSelection.inProgressTimingEvents = []
  }

  endDragEventSelection() {
    this.eventSelection.timingEvents = this.eventSelection.timingEvents.concat(
      this.eventSelection.inProgressTimingEvents
    )
  }

  addNoteToDragSelection(note: NotedataEntry) {
    this.selection.inProgressNotes.push(note)
  }

  removeNoteFromDragSelection(note: NotedataEntry) {
    const index = this.selection.inProgressNotes.indexOf(note)
    if (index == -1) return
    this.selection.inProgressNotes.splice(index, 1)
  }

  addEventToDragSelection(event: TimingEvent) {
    this.eventSelection.inProgressTimingEvents.push(event)
  }

  removeEventFromDragSelection(event: TimingEvent) {
    const index = this.eventSelection.inProgressTimingEvents.indexOf(event)
    if (index == -1) return
    this.eventSelection.inProgressTimingEvents.splice(index, 1)
  }

  addNoteToSelection(note: NotedataEntry) {
    this.selection.notes.push(note)
  }

  removeNoteFromSelection(note: NotedataEntry) {
    const index = this.selection.notes.indexOf(note)
    if (index == -1) return
    this.selection.notes.splice(index, 1)
  }

  addEventToSelection(event: TimingEvent) {
    this.eventSelection.timingEvents.push(event)
  }

  removeEventFromSelection(event: TimingEvent) {
    const index = this.eventSelection.timingEvents.indexOf(event)
    if (index == -1) return
    this.eventSelection.timingEvents.splice(index, 1)
  }

  selectRegion() {
    if (!this.loadedChart) return
    if (this.endRegion !== undefined) {
      this.startRegion = undefined
      this.endRegion = undefined
    }
    if (this.startRegion === undefined) {
      this.clearSelections()
      this.startRegion = this.beat
      return
    }
    if (this.endRegion === undefined) {
      this.endRegion = this.beat
      if (this.endRegion < this.startRegion) {
        this.endRegion = this.startRegion
        this.startRegion = this.beat
      }
      this.loadedChart
        .getNotedata()
        .filter(
          note => note.beat >= this.startRegion! && note.beat < this.endRegion!
        )
        .filter(note => !this.selection.notes.includes(note))
        .forEach(note => this.addNoteToSelection(note))
      return
    }
  }

  modifySelection(modify: (note: NotedataEntry) => PartialNotedataEntry) {
    if (!this.loadedChart) return
    const removedNotes = this.selection.notes
    const newNotes = structuredClone(this.selection.notes)
      .map(modify)
      .sort((a, b) => {
        if (a.beat == b.beat) return a.col - b.col
        return a.beat - b.beat
      })
    if (newNotes.length == 0) return

    const notedata = this.loadedChart.getNotedata()
    let startIndex = bsearch(notedata, newNotes[0].beat, note => note.beat)
    const conflictingNotes: NotedataEntry[] = []
    for (const newNote of newNotes) {
      let latestNoteIndex = startIndex
      const isHold = isHoldNote(newNote)
      while (
        notedata[startIndex] &&
        notedata[startIndex].beat <= newNote.beat + (isHold ? newNote.hold : 0)
      ) {
        const note = notedata[startIndex]
        startIndex++
        if (note.beat < newNote.beat) latestNoteIndex = startIndex
        if (removedNotes.includes(note)) continue
        if (note.col != newNote.col) continue
        if (note.beat == newNote.beat) {
          conflictingNotes.push(note)
        }
        if (
          isHold &&
          note.beat > newNote.beat &&
          note.beat <= newNote.beat + newNote.hold
        ) {
          conflictingNotes.push(note)
        }
      }
      startIndex = latestNoteIndex
    }

    this.app.actionHistory.run({
      action: () => {
        this.loadedChart!.removeNotes(removedNotes.concat(conflictingNotes))
        this.clearSelections()
        this.selection.notes = this.loadedChart!.addNotes(newNotes)
      },
      undo: () => {
        this.loadedChart!.removeNotes(newNotes)
        this.loadedChart!.addNotes(conflictingNotes)
        this.clearSelections()
        this.selection.notes = this.loadedChart!.addNotes(removedNotes)
      },
    })
  }

  modifyEventSelection(modify: (note: TimingEvent) => TimingEvent) {
    if (!this.loadedChart) return
    const timingData = this.loadedChart.timingData
    const removedEvents = this.eventSelection.timingEvents
    const newEvents = structuredClone(this.eventSelection.timingEvents).map(
      modify
    )
    if (newEvents.length == 0) return

    let conflicts: TimingEvent[] = []
    this.app.actionHistory.run({
      action: () => {
        timingData.rawDeleteMultiple(removedEvents)
        timingData.rawInsertMultiple(newEvents)
        conflicts = timingData.findConflicts()
        timingData.rawDeleteMultiple(conflicts)
        this.clearSelections()
        this.eventSelection.timingEvents = newEvents
        EventHandler.emit("timingModified")
        EventHandler.emit("chartModified")
        if (newEvents.find(event => event.type == "TIMESIGNATURES")) {
          EventHandler.emit("timeSigChanged")
        }
      },
      undo: () => {
        timingData.rawInsertMultiple(conflicts)
        timingData.rawDeleteMultiple(newEvents)
        timingData.rawInsertMultiple(removedEvents)
        this.clearSelections()
        this.eventSelection.timingEvents = removedEvents
        EventHandler.emit("timingModified")
        EventHandler.emit("chartModified")
        if (newEvents.find(event => event.type == "TIMESIGNATURES")) {
          EventHandler.emit("timeSigChanged")
        }
      },
      redo: () => {
        timingData.rawDeleteMultiple(removedEvents)
        timingData.rawInsertMultiple(newEvents)
        timingData.rawDeleteMultiple(conflicts)
        this.clearSelections()
        this.eventSelection.timingEvents = newEvents
        EventHandler.emit("timingModified")
        EventHandler.emit("chartModified")
        if (newEvents.find(event => event.type == "TIMESIGNATURES")) {
          EventHandler.emit("timeSigChanged")
        }
      },
    })
  }

  deleteSelection() {
    if (this.selection.notes.length == 0) return
    const removedNotes = this.selection.notes
    this.app.actionHistory.run({
      action: () => {
        this.loadedChart!.removeNotes(removedNotes)
        this.clearSelections()
      },
      undo: () => {
        this.selection.notes = this.loadedChart!.addNotes(removedNotes)
      },
    })
  }

  deleteEventSelection() {
    if (this.eventSelection.timingEvents.length == 0) return
    const removedEvents = this.eventSelection.timingEvents
    const timingData = this.loadedChart!.timingData
    let conflicts: TimingEvent[] = []
    this.app.actionHistory.run({
      action: () => {
        timingData.rawDeleteMultiple(removedEvents)
        conflicts = timingData.findConflicts()
        timingData.rawDeleteMultiple(conflicts)
        this.clearSelections()
        EventHandler.emit("timingModified")
        EventHandler.emit("chartModified")
        if (removedEvents.find(event => event.type == "TIMESIGNATURES")) {
          EventHandler.emit("timeSigChanged")
        }
      },
      undo: () => {
        timingData.rawInsertMultiple(conflicts)
        timingData.rawInsertMultiple(removedEvents)
        this.eventSelection.timingEvents = removedEvents
        EventHandler.emit("timingModified")
        EventHandler.emit("chartModified")
        if (removedEvents.find(event => event.type == "TIMESIGNATURES")) {
          EventHandler.emit("timeSigChanged")
        }
      },
      redo: () => {
        timingData.rawDeleteMultiple(removedEvents)
        timingData.rawDeleteMultiple(conflicts)
        this.clearSelections()
        EventHandler.emit("timingModified")
        EventHandler.emit("chartModified")
        if (removedEvents.find(event => event.type == "TIMESIGNATURES")) {
          EventHandler.emit("timeSigChanged")
        }
      },
    })
  }

  paste(data: string) {
    if (!this.loadedChart) return
    if (data.startsWith("ArrowVortex:notes:")) {
      if (!this.pasteNotes(data)) this.pasteNotes(this.virtualClipboard)
    }
    if (
      data.startsWith("ArrowVortex:tempo:") ||
      data.startsWith("SMEditor:tempo:")
    ) {
      if (!this.pasteTempo(data)) this.pasteTempo(this.virtualClipboard)
      return
    }
  }

  pasteNotes(data: string) {
    if (!this.loadedChart) return true
    const notes = decodeNotes(data)
    if (!notes) return false
    if (notes.length == 0) return false
    notes
      .map(note => {
        note.beat += this.beat
        note.beat = Math.round(note.beat * 48) / 48
        return note
      })
      .sort((a, b) => {
        if (a.beat == b.beat) return a.col - b.col
        return a.beat - b.beat
      })
    const notedata = this.loadedChart.getNotedata()
    let startIndex = bsearch(notedata, notes[0].beat, note => note.beat)
    const conflictingNotes: NotedataEntry[] = []
    for (const newNote of notes) {
      let latestNoteIndex = startIndex
      const isHold = isHoldNote(newNote)
      while (
        notedata[startIndex] &&
        notedata[startIndex].beat <= newNote.beat + (isHold ? newNote.hold : 0)
      ) {
        const note = notedata[startIndex]
        startIndex++
        if (note.beat < newNote.beat) latestNoteIndex = startIndex
        if (note.col != newNote.col) continue
        if (note.beat == newNote.beat) {
          conflictingNotes.push(note)
        }
        if (
          isHold &&
          note.beat > newNote.beat &&
          note.beat <= newNote.beat + newNote.hold
        ) {
          conflictingNotes.push(note)
        }
      }
      startIndex = latestNoteIndex
    }
    this.app.actionHistory.run({
      action: () => {
        this.loadedChart!.removeNotes(conflictingNotes)
        this.clearSelections()
        this.selection.notes = this.loadedChart!.addNotes(notes)
      },
      undo: () => {
        this.loadedChart!.removeNotes(notes)
        this.loadedChart!.addNotes(conflictingNotes)
        this.clearSelections()
      },
    })
    return true
  }

  pasteTempo(data: string) {
    if (!this.loadedChart) return true
    const events = decodeTempo(data)
    if (!events) return false
    if (events.length == 0) return false

    const timingData = this.loadedChart.timingData
    let conflicts: TimingEvent[] = []
    events.forEach(event => {
      if (event.type == "ATTACKS") event.second += this.time
      else event.beat += this.beat
    })
    this.app.actionHistory.run({
      action: () => {
        timingData.rawInsertMultiple(events)
        conflicts = timingData.findConflicts()
        timingData.rawDeleteMultiple(conflicts)
        this.clearSelections()
        this.eventSelection.timingEvents = events
        EventHandler.emit("timingModified")
        EventHandler.emit("chartModified")
        if (events.find(event => event.type == "TIMESIGNATURES")) {
          EventHandler.emit("timeSigChanged")
        }
      },
      undo: () => {
        timingData.rawInsertMultiple(conflicts)
        timingData.rawDeleteMultiple(events)
        this.clearSelections()
        EventHandler.emit("timingModified")
        EventHandler.emit("chartModified")
        if (events.find(event => event.type == "TIMESIGNATURES")) {
          EventHandler.emit("timeSigChanged")
        }
      },
      redo: () => {
        timingData.rawInsertMultiple(events)
        timingData.rawDeleteMultiple(conflicts)
        this.clearSelections()
        this.eventSelection.timingEvents = events
        EventHandler.emit("timingModified")
        EventHandler.emit("chartModified")
        if (events.find(event => event.type == "TIMESIGNATURES")) {
          EventHandler.emit("timeSigChanged")
        }
      },
    })
    return true
  }

  copy(): string | undefined {
    if (this.selection.notes.length != 0) {
      const firstBeat = Math.min(...this.selection.notes.map(note => note.beat))
      const notes = structuredClone(this.selection.notes)
        .map(note => {
          note.beat -= firstBeat
          return note
        })
        .sort((a, b) => {
          if (a.beat == b.beat) return a.col - b.col
          return a.beat - b.beat
        })
      const encoded = encodeNotes(notes)
      this.virtualClipboard = encoded
      return encoded
    } else if (this.eventSelection.timingEvents.length != 0) {
      const firstBeat = Math.min(
        ...this.eventSelection.timingEvents.map(note => note.beat!)
      )
      const firstSec =
        this.loadedChart!.timingData.getSecondsFromBeat(firstBeat)
      const events = structuredClone(this.eventSelection.timingEvents)
        .map(note => {
          if (note.type == "ATTACKS") {
            note.second -= firstSec
            return note
          }
          note.beat -= firstBeat
          return note
        })
        .sort((a, b) => {
          if (a.type != b.type) return a.type.localeCompare(b.type)
          if (a.type == "ATTACKS") return a.second - b.second!
          return a.beat - b.beat!
        })
      const encoded = encodeTempo(events)
      this.virtualClipboard = encoded
      return encoded
    }
  }
}
