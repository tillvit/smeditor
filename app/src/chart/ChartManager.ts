import { errors } from "file-system-access/lib/util"
import { Howl } from "howler/dist/howler.core.min.js"
import { BitmapText } from "pixi.js"
import assistTick from "../../assets/sound/assist_tick.wav"
import metronomeHigh from "../../assets/sound/metronome_high.wav"
import metronomeLow from "../../assets/sound/metronome_low.wav"
import mine from "../../assets/sound/mine.wav"
import { App } from "../App"
import { AUDIO_EXT } from "../data/FileData"
import { KEYBIND_DATA } from "../data/KeybindData"
import { WaterfallManager } from "../gui/element/WaterfallManager"
import { AppUpdateNotification } from "../gui/notification/AppUpdateNotification"
import { CoreUpdateNotification } from "../gui/notification/CoreUpdateNotification"
import { OfflineUpdateNotification } from "../gui/notification/OfflineUpdateNotification"
import { DebugWidget } from "../gui/widget/DebugWidget"
import { WidgetManager } from "../gui/widget/WidgetManager"
import { ChartListWindow } from "../gui/window/ChartListWindow"
import { ConfirmationWindow } from "../gui/window/ConfirmationWindow"
import { InitialWindow } from "../gui/window/InitialWindow"
import { KeyComboWindow } from "../gui/window/KeyComboWindow"
import { ActionHistory } from "../util/ActionHistory"
import {
  decodeNotes,
  decodeTempo,
  encodeNotes,
  encodeTempo,
} from "../util/Ascii85"
import { EventHandler } from "../util/EventHandler"
import { Flags } from "../util/Flags"
import { Keybinds } from "../util/Keybinds"
import { clamp } from "../util/Math"
import { Options } from "../util/Options"
import { basename, dirname, extname } from "../util/Path"
import { tpsUpdate } from "../util/Performance"
import { RecentFileHandler } from "../util/RecentFileHandler"
import { SchedulableSoundEffect } from "../util/SchedulableSoundEffect"
import {
  IS_OSX,
  bsearch,
  bsearchEarliest,
  compareObjects,
  getNoteEnd,
} from "../util/Util"
import { CustomScriptRunner } from "../util/custom-script/CustomScriptRunner"
import {
  createSMFromPayload,
  createSMPayload,
} from "../util/custom-script/CustomScriptUtils"
import { FileHandler } from "../util/file-handler/FileHandler"
import { ChartRenderer } from "./ChartRenderer"
import { ChartAudio } from "./audio/ChartAudio"
import { GameTypeRegistry } from "./gameTypes/GameTypeRegistry"
import { NoteskinRegistry } from "./gameTypes/noteskin/NoteskinRegistry"
import { GameplayStats } from "./play/GameplayStats"
import { TIMING_WINDOW_AUTOPLAY } from "./play/StandardTimingWindow"
import { TimingWindowCollection } from "./play/TimingWindowCollection"
import { Chart } from "./sm/Chart"
import {
  HoldNotedataEntry,
  NoteType,
  Notedata,
  NotedataEntry,
  PartialHoldNotedataEntry,
  PartialNotedata,
  PartialNotedataEntry,
  isHoldNote,
} from "./sm/NoteTypes"
import { serializeSMEData } from "./sm/SMEParser"
import { Simfile } from "./sm/Simfile"
import { Cached, TIMING_EVENT_NAMES, TimingEvent } from "./sm/TimingTypes"

const SNAPS = [1, 2, 3, 4, 6, 8, 12, 16, 24, 48, -1]
const EFFECT_BUFFER = 0.2

interface PartialHold {
  startBeat: number
  endBeat: number
  roll: boolean
  type: "mouse" | "key"
  originalNote: PartialNotedataEntry | undefined
  removedNotes: NotedataEntry[]
  truncatedHolds: {
    oldNote: PartialHoldNotedataEntry
    newNote: PartialNotedataEntry
  }[]
  direction: "up" | "down" | null
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
  timingEvents: Cached<TimingEvent>[]
  inProgressTimingEvents: Cached<TimingEvent>[]
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

window.createSMPayload = createSMPayload
window.createSMFromPayload = createSMFromPayload
const testScript: CustomScript = {
  name: "Test Script",
  description: "A test script that does nothing",
  code: `
    // This is a test script that does nothing
    // sm is the Simfile object
    // chart is the Chart object
    // selection is an array of NotedataEntry objects that are currently selected
    // args is an array of arguments passed to the script
    console.log("Hello from the test script!")
    console.log("Simfile:", sm)
    console.log("Chart:", chart)
    console.log("Selection:", selection)
    console.log("Args:", args)
    chart.notedata.forEach(note => {
      note.col = (note.col + 1) % chart.gameType.numCols
    })
`,
  arguments: [],
}
window.test = () => CustomScriptRunner.run(window.app, testScript, [])

export class ChartManager {
  app: App

  chartAudio: ChartAudio = new ChartAudio()
  chartView?: ChartRenderer
  widgetManager: WidgetManager

  assistTick = new SchedulableSoundEffect({
    src: assistTick,
    volume: 0.5,
  })
  me_high = new SchedulableSoundEffect({
    src: metronomeHigh,
    volume: 0.5,
  })
  me_low = new SchedulableSoundEffect({
    src: metronomeLow,
    volume: 0.5,
  })
  mine: Howl = new Howl({
    src: mine,
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

  private holdEditing: (PartialHold | undefined)[] = []
  private editNoteTypeIndex = 0

  private partialScroll = 0
  private noteFlashIndex = 0
  private assistTickIndex = 0
  private lastMetronomeDivision = -1
  private lastMetronomeMeasure = -1
  private holdFlashes: HoldNotedataEntry[] = []

  private lastSong: string | null = null

  private mode: EditMode = EditMode.Edit
  private lastMode: EditMode = EditMode.Edit

  private _beat = 0
  private cachedSecond = 0
  private cachedBeat = 0

  private readonly noChartTextA: BitmapText
  private readonly noChartTextB: BitmapText
  private readonly loadingText: BitmapText

  private shiftPressed = 0

  private virtualClipboard = ""
  private lastAutoSave = 0

  startRegion?: number
  endRegion?: number

  gameStats?: GameplayStats

  constructor(app: App) {
    this.app = app

    // Check for shift press
    document.addEventListener("keydown", e => {
      if (e.key == "Shift") {
        this.shiftPressed++
      }
    })

    document.addEventListener("keyup", e => {
      if (e.key == "Shift") {
        this.shiftPressed = Math.max(this.shiftPressed - 1, 0)
      }
    })

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
        if (this.eventSelection.timingEvents.length > 0) {
          this.deleteEventSelection()
        } else {
          this.deleteSelection()
        }
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
        if (clipboard) this.paste(clipboard, this.shiftPressed > 0)
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
        const delta =
          (event.deltaY / 5) *
          Options.chart.scroll.scrollSensitivity *
          (Options.chart.scroll.invertZoomScroll ? -1 : 1)
        Options.chart.speed = clamp(
          Options.chart.speed * Math.pow(1.01, delta),
          10,
          35000
        )
      } else {
        if (this.mode == EditMode.Play || this.mode == EditMode.Record) return
        let newbeat = this.beat
        const snap = Options.chart.snap
        let delta =
          (event.deltaY / Options.chart.speed) *
          Options.chart.scroll.scrollSensitivity
        if (Options.chart.reverse && Options.chart.scroll.invertReverseScroll)
          delta *= -1
        if (Options.chart.scroll.invertScroll) delta *= -1

        if (snap == 0) {
          this.partialScroll = 0
          newbeat = this.beat + delta
        } else {
          if (Options.chart.scroll.scrollSnapEveryScroll) {
            if (delta < 0) {
              newbeat = Math.round((this.beat - snap) / snap) * snap
            } else {
              newbeat = Math.round((this.beat + snap) / snap) * snap
            }
          } else {
            this.partialScroll += delta

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
        if (newbeat != this.beat) this.beat = newbeat
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
    this.app.stage.addChild(this.noChartTextB)

    this.loadingText = new BitmapText("Loading simfile...", {
      fontName: "Main",
      fontSize: 20,
    })
    this.loadingText.anchor.set(0.5)
    this.loadingText.tint = 0x555555
    this.app.stage.addChild(this.loadingText)
    this.loadingText.visible = false

    this.noChartTextA.x = 0
    this.noChartTextA.y = -20
    this.noChartTextB.x = 0
    this.noChartTextB.y = 10

    this.loadingText.x = 0
    this.loadingText.y = 0

    // Faster update loop, more precision
    setInterval(() => {
      if (!this.loadedSM || !this.loadedChart || !this.chartView) return
      const updateStart = performance.now()
      const time = this.chartAudio.seek()
      if (this.chartAudio.isPlaying()) {
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
                (this.loadedChart.timingData.getEventAtBeat("BPMS", this.beat)
                  ?.value ?? 120) >
              0.3
            )
              this.editHoldBeat(col, snapBeat, false)
          }
        }
      }

      const notedata = this.loadedChart.getNotedata()
      if (this.chartAudio.isPlaying()) {
        this._beat = this.loadedChart?.getBeatFromSeconds(this.time) ?? 0
        let note = notedata[this.noteFlashIndex]
        // Play note flash
        while (this.noteFlashIndex < notedata.length && time > note.second) {
          if (
            this.mode != EditMode.Record &&
            this.loadedChart.gameType.gameLogic.shouldAssistTick(note)
          ) {
            if (this.mode != EditMode.Play) {
              this.chartView.doJudgement(note, 0, TIMING_WINDOW_AUTOPLAY)
              if (isHoldNote(note)) {
                if (note.type == "Hold") {
                  this.chartView.getNotefield().activateHold(note.col)
                }
                if (note.type == "Roll") {
                  this.chartView.getNotefield().activateRoll(note.col)
                }
                this.holdFlashes.push(note)
              }
            }
          }
          this.noteFlashIndex++
          note = notedata[this.noteFlashIndex]
        }

        // Deactivate hold flashes
        this.holdFlashes = this.holdFlashes.filter(hold => {
          if (this._beat < hold.beat + hold.hold) return true
          if (this.chartView) {
            if (hold.type == "Hold") {
              this.chartView.getNotefield().releaseHold(hold.col)
            }
            if (hold.type == "Roll") {
              this.chartView.getNotefield().releaseRoll(hold.col)
            }
            this.chartView.doJudgement(
              hold,
              null,
              TimingWindowCollection.getCollection(
                Options.play.timingCollection
              ).getHeldJudgement(hold)
            )
          }
          return false
        })

        // Play assist tick
        const assistRows = new Set()
        while (
          this.assistTickIndex < notedata.length &&
          time >
            notedata[this.assistTickIndex].second +
              Options.play.effectOffset -
              EFFECT_BUFFER
        ) {
          if (
            assistRows.has(notedata[this.assistTickIndex].second) ||
            notedata[this.assistTickIndex].second +
              Options.play.effectOffset -
              time <
              0
          ) {
            this.assistTickIndex++
            continue
          }
          if (
            this.mode != EditMode.Record &&
            this.loadedChart.gameType.gameLogic.shouldAssistTick(
              notedata[this.assistTickIndex]
            )
          ) {
            if (Options.audio.assistTick && Flags.assist) {
              this.assistTick.play(
                (notedata[this.assistTickIndex].second +
                  Options.play.effectOffset -
                  time) /
                  Options.audio.rate
              )
            }
            assistRows.add(notedata[this.assistTickIndex].second)
          }
          this.assistTickIndex++
        }
      }
      // Play metronome
      if (
        this.chartAudio.isPlaying() &&
        Options.audio.metronome &&
        Flags.assist
      ) {
        const td = this.loadedChart.timingData
        const offsetBeat = this.loadedChart.getBeatFromSeconds(
          this.time + Options.play.effectOffset + EFFECT_BUFFER
        )

        const scheduledBeats = new Set()

        const startMeasure = td.getBeatFromMeasure(this.lastMetronomeMeasure)
        const divLength = td.getDivisionLength(startMeasure)
        const startBeat = startMeasure + divLength * this.lastMetronomeDivision

        const measureBeats = [
          ...td.getMeasureBeats(startBeat, offsetBeat),
        ].slice(1)
        for (const [barBeat, isMeasure] of measureBeats) {
          if (this.beat > barBeat) continue
          const barSecond = td.getSecondsFromBeat(barBeat)
          if (scheduledBeats.has(barSecond)) continue
          scheduledBeats.add(barSecond)
          const offset =
            (barSecond + Options.play.effectOffset - this.time) /
            Options.audio.rate
          if (isMeasure) this.me_high.play(offset)
          else this.me_low.play(offset)
        }
        if (measureBeats.length > 0) {
          const lastBeat = measureBeats.at(-1)![0]
          this.lastMetronomeMeasure = Math.floor(td.getMeasure(lastBeat))
          this.lastMetronomeDivision = Math.round(
            td.getDivisionOfMeasure(lastBeat)
          )
        }
      }

      // Update the game logic
      if (this.mode == EditMode.Play) {
        this.loadedChart.gameType.gameLogic.update(this)
      }

      // Autosave
      if (
        this.lastAutoSave + Options.general.autosaveInterval * 1000 <
        Date.now()
      ) {
        this.lastAutoSave = Date.now()
        if (ActionHistory.instance.isDirty()) {
          this.autosave()
        }
      }

      this.updateSoundProperties()
      tpsUpdate()
      DebugWidget.instance?.addUpdateTimeValue(performance.now() - updateStart)
    }, 5)

    EventHandler.on("chartModified", () => {
      if (this.loadedChart) {
        this.setNoteIndex()
        EventHandler.emit("chartModifiedAfter")
      }
    })

    EventHandler.on("userOptionUpdated", (option: string) => {
      if (
        option != "audio.rate" &&
        option != "play.effectOffset" &&
        option != "audio.assistTick" &&
        option != "audio.metronome"
      )
        return
      this.assistTick.stop()
      this.me_low.stop()
      this.me_high.stop()
      this.setNoteIndex()
    })

    window.addEventListener(
      "keyup",
      (event: KeyboardEvent) => {
        if (this.mode != EditMode.Edit) return
        if (event.code.startsWith("Digit")) {
          let col = parseInt(event.code.slice(5)) - 1
          if (col == -1) col = 9 // 0 key to 10th column
          this.endEditing(col)
        }
      },
      true
    )

    window.addEventListener(
      "keydown",
      (event: KeyboardEvent) => {
        const keyName = Keybinds.getKeyNameFromEvent(event)
        if (this.mode != EditMode.Edit) return
        if ((<HTMLElement>event.target).classList.contains("inlineEdit")) return
        if (event.target instanceof HTMLTextAreaElement) return
        if (event.target instanceof HTMLInputElement) return
        if (KeyComboWindow.active) return
        // Start editing note
        if (
          event.code.startsWith("Digit") &&
          !event.repeat &&
          !event.ctrlKey &&
          !event.metaKey &&
          !event.altKey &&
          !event.ctrlKey
        ) {
          let col = parseInt(event.code.slice(5)) - 1
          if (col == -1) col = 9 // 0 key to 10th column
          if (col < (this.loadedChart?.gameType.numCols ?? 4)) {
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
              Keybinds.getCombosForKeybind(keybind)
                .map(x => x.key)
                .includes(keyName)
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
              Keybinds.getCombosForKeybind(keybind)
                .map(x => x.key)
                .includes(keyName)
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

  get beat() {
    if (!this.loadedChart) return 0
    if (!this.chartAudio.isPlaying()) {
      return this._beat
    }
    if (this.cachedSecond == this.time) return this.cachedBeat
    const beat = this.loadedChart.getBeatFromSeconds(this.time)
    this.cachedBeat = beat
    this.cachedSecond = this.time
    return beat
  }

  set beat(beat: number) {
    if (!this.loadedChart) return
    this.chartAudio.seek(this.loadedChart.getSecondsFromBeat(beat))
    this._beat = beat

    this.setNoteIndex()

    this.lastMetronomeMeasure = Math.floor(
      this.loadedChart.timingData.getMeasure(this.beat)
    )
    this.lastMetronomeDivision = Math.floor(
      this.loadedChart.timingData.getDivisionOfMeasure(this.beat)
    )
  }

  get time() {
    return this.chartAudio.seek()
  }

  set time(time: number) {
    if (!this.loadedChart) return
    this.chartAudio.seek(time)
    this._beat = this.loadedChart.getBeatFromSeconds(time)
    this.setNoteIndex()
  }

  /**
   * Loads the SM from the specified path. If no path is specified, the current SM is hidden.
   *
   * @param {string} [path]
   * @memberof ChartManager
   */
  async loadSM(path?: string) {
    AppUpdateNotification.close()
    CoreUpdateNotification.close()
    OfflineUpdateNotification.close()
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
      if (option == "No") await this.removeAutosaves()
    }

    // Destroy everything if no path specified
    if (!path) {
      this.smPath = ""
      this.loadedSM?.destroy()
      this.loadedSM = undefined
      this.chartAudio.stop()
      this.noChartTextA.visible = false
      this.noChartTextB.visible = false
      this.chartView?.destroy({ children: true })
      return
    }

    this.chartAudio.stop()
    this.chartAudio.seek(0)
    this.lastSong = null
    this.smPath = path

    this.loadingText.visible = true

    // Check if SSC available
    if (extname(this.smPath) == ".sm" && Options.general.loadSSC != "Never") {
      const sscPath = this.getSMPath(".ssc")
      if (await FileHandler.hasFile(sscPath)) {
        if (Options.general.loadSSC == "Prompt") {
          const window = new ConfirmationWindow(
            this.app,
            "Use SSC File",
            "An SSC file was found. Do you wish to use the SSC file instead?",
            [
              {
                label: "No",
                type: "default",
              },
              {
                label: "Yes",
                type: "confirm",
              },
            ],
            "You can change the default behavior in settings"
          )
          this.app.windowManager.openWindow(window)
          const option = await window.resolved
          if (option == "Yes") this.smPath = sscPath
        } else if (Options.general.loadSSC == "Always") {
          WaterfallManager.create("Loading available SSC file")
          this.smPath = sscPath
        }
      }
    }

    // Check for an autosave

    let loadPath = this.smPath

    const autosavePath = this.getSMPath(".smebak")
    if (await FileHandler.hasFile(autosavePath)) {
      const window = new ConfirmationWindow(
        this.app,
        "Autosave",
        "An autosave was found. Do you wish to load the autosave?",
        [
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
      if (option == "Yes") {
        loadPath = autosavePath
      }
    }

    // Load the SM file
    const smHandle = await FileHandler.getFileHandle(loadPath)
    if (!smHandle) {
      WaterfallManager.createFormatted(
        "Couldn't load the file at " + loadPath,
        "error"
      )
      this.app.windowManager.openWindow(new InitialWindow(this.app))
      this.loadingText.visible = false
      return
    }
    const smFile = await smHandle.getFile()

    const dataHandle = await FileHandler.getFileHandle(this.getDataPath())
    const dataFile = dataHandle ? await dataHandle.getFile() : undefined

    this.loadedSM?.destroy()
    this.loadedSM = new Simfile(smFile, dataFile)

    await this.loadedSM.loaded

    this.loadingText.visible = false

    this.noChartTextA.visible = true
    this.noChartTextB.visible = true
    this.editTimingMode = EditTimingMode.Off

    EventHandler.emit("smLoaded")
    await this.loadChart()
    EventHandler.emit("smLoadedAfter")
    this.beat = 0

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
        const charts = this.loadedSM.getChartsByGameType(
          this.loadedChart.gameType.id
        )
        if (charts && charts.length > 0) {
          chart = charts.at(-1)
        }
      }
      if (!chart) {
        for (const gameType of GameTypeRegistry.getPriority()) {
          const charts = this.loadedSM.getChartsByGameType(gameType.id)
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
        this.loadedChart = undefined
        this.chartView = undefined
        this.noChartTextA.visible = true
        this.noChartTextB.visible = true
        EventHandler.emit("chartLoaded", null)
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

    Options.play.timingCollection = "ITG"
    for (const [key, collection] of Object.entries(
      Options.play.defaultTimingCollections
    )) {
      if (chart.gameType.id.startsWith(key)) {
        Options.play.timingCollection = collection
        break
      }
    }

    // Check if the same noteskin is compatible with the current chart
    const oldType = GameTypeRegistry.getGameType(Options.chart.noteskin.type)
    const newNoteskin = {
      type: chart.gameType.id,
      name: Options.chart.lastNoteskins[chart.gameType.id] ?? "default",
    }
    if (oldType) {
      const oldSkin = NoteskinRegistry.getNoteskinData(
        oldType,
        Options.chart.noteskin.name
      )
      if (oldSkin?.gameTypes.includes(chart.gameType.id)) {
        // Use the old note skin
        newNoteskin.name = oldSkin.id
      }
    }
    Options.chart.noteskin = newNoteskin
    Options.chart.lastNoteskins[chart.gameType.id] = newNoteskin.name

    this.setNoteIndex()
    this.chartView = new ChartRenderer(this)
    if (this.mode == EditMode.Play || this.mode == EditMode.Record)
      this.setMode(this.lastMode)
    if (Flags.viewMode) this.setMode(EditMode.View)

    this.noChartTextA.visible = false
    this.noChartTextB.visible = false

    if (this.loadedChart.getMusicPath() != this.lastSong) {
      this.lastSong = this.loadedChart.getMusicPath()
      const audioPlaying = this.chartAudio.isPlaying()
      await this.loadAudio()
      if (audioPlaying) this.chartAudio.play()
    }

    WaterfallManager.create(
      "Loaded chart " +
        chart.difficulty +
        " " +
        chart.meter +
        " " +
        chart.gameType.id
    )

    EventHandler.emit("chartLoaded", chart)
    EventHandler.emit("chartModified")

    if (Flags.autoPlay) {
      this.playPause()
    }
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
    WaterfallManager.create("Loading audio...")
    if (musicPath == "") {
      WaterfallManager.createFormatted(
        "Failed to load audio: no audio file",
        "error"
      )
      const prevBeat = Math.max(0, this.beat)
      this.chartAudio = new ChartAudio(undefined)
      this.beat = prevBeat
      EventHandler.emit("audioLoaded")
      return
    }
    const audioHandle = await this.getAudioHandle(musicPath)
    if (audioHandle == undefined) {
      WaterfallManager.createFormatted(
        "Failed to load audio: couldn't find audio file " + musicPath,
        "error"
      )
      const prevBeat = Math.max(0, this.beat)
      this.chartAudio = new ChartAudio(undefined)
      this.beat = prevBeat
      EventHandler.emit("audioLoaded")
      return
    }
    const audioFile = await audioHandle.getFile()
    const prevBeat = Math.max(0, this.beat)
    this.chartAudio = new ChartAudio(
      await audioFile.arrayBuffer(),
      extname(audioFile.name)
    )
    this.chartAudio.onLoad(() => {
      WaterfallManager.create("Loaded audio")
    })
    this.beat = prevBeat
    this.chartAudio.onStop = () => {
      this.assistTick.stop()
      this.me_high.stop()
      this.me_low.stop()
    }
    this.setNoteIndex()
    EventHandler.emit("audioLoaded")
  }

  /**
   * Finds the audio file associated with the music path.
   * If none is found, attempt to find other audio files in the directory.
   *
   * @private
   * @param {string} musicPath
   * @return {Promise<FileSystemFileHandle | undefined>}
   * @memberof ChartManager
   */
  private async getAudioHandle(
    musicPath: string
  ): Promise<FileSystemFileHandle | undefined> {
    let audioHandle: FileSystemFileHandle | undefined =
      await FileHandler.getFileHandleRelativeTo(this.smPath, musicPath)
    if (audioHandle) return audioHandle

    //Capitalization error
    try {
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
    } catch {
      return undefined
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
    this.assistTick.volume(volume)
    this.me_high.volume(volume)
    this.me_low.volume(volume)
    if (this.mine.volume() != volume) this.mine.volume(volume)
  }

  private setNoteIndex() {
    if (
      this.loadedSM == undefined ||
      this.loadedChart == undefined ||
      this.chartView == undefined ||
      this.loadedChart.getNotedata().length == 0
    ) {
      this.noteFlashIndex = 0
      this.assistTickIndex = 0
      return
    }

    this.assistTick.stop()
    this.noteFlashIndex =
      bsearch(this.loadedChart.getNotedata(), this.time, a => a.second) + 1
    if (
      this.noteFlashIndex >= 1 &&
      this.time <=
        this.loadedChart.getNotedata()[this.noteFlashIndex - 1].second
    )
      this.noteFlashIndex--

    this.assistTickIndex = this.noteFlashIndex
    for (const hold of this.holdFlashes) {
      if (hold.type == "Hold") {
        this.chartView.getNotefield().releaseHold(hold.col)
      } else if (hold.type == "Roll") {
        this.chartView.getNotefield().releaseRoll(hold.col)
      }
    }
    this.holdFlashes = []
  }

  playPause() {
    this.setNoteIndex()
    if (this.chartAudio.isPlaying()) {
      this.chartAudio.pause()
      this._beat = this.loadedChart?.getBeatFromSeconds(this.time) ?? 0
    } else this.chartAudio.play()
  }

  getClosestTick(beat: number, quant: number) {
    if (!this.loadedChart) return 0
    const snap = Math.max(0.001, 4 / quant)
    const beatOfMeasure = this.loadedChart.timingData.getBeatOfMeasure(beat)
    const measureBeat = beat - beatOfMeasure
    const newBeatOfMeasure = Math.round(beatOfMeasure / snap) * snap
    return Math.max(0, measureBeat + newBeatOfMeasure)
  }

  snapToNearestTick(beat: number) {
    this.beat = Math.max(0, this.getClosestTick(beat, 4 / Options.chart.snap))
  }

  snapToPreviousTick() {
    if (!this.loadedChart) return
    const snap = Math.max(0.001, Options.chart.snap)
    const currentMeasure = Math.floor(
      this.loadedChart.timingData.getMeasure(this.beat)
    )
    const currentMeasureBeat =
      this.loadedChart.timingData.getBeatFromMeasure(currentMeasure)

    const closestTick =
      Math.floor((this.beat - currentMeasureBeat) / snap) * snap
    const nextTick =
      Math.abs(closestTick - (this.beat - currentMeasureBeat)) < 0.0005
        ? closestTick - snap
        : closestTick
    const newBeat = nextTick + currentMeasureBeat

    // Check if we cross over the previous measure
    if (nextTick < 0) {
      const previousMeasureBeat =
        this.loadedChart.timingData.getBeatFromMeasure(currentMeasure - 1)
      const closestMeasureTick =
        Math.round((newBeat - previousMeasureBeat) / snap) * snap
      this.beat = Math.max(0, previousMeasureBeat + closestMeasureTick)
      return
    }

    this.beat = Math.max(0, newBeat)
  }

  snapToNextTick() {
    if (!this.loadedChart) return
    const snap = Math.max(0.001, Options.chart.snap)
    const currentMeasure = Math.floor(
      this.loadedChart.timingData.getMeasure(this.beat)
    )
    const currentMeasureBeat =
      this.loadedChart.timingData.getBeatFromMeasure(currentMeasure)

    const closestTick =
      Math.floor((this.beat - currentMeasureBeat + 0.0005) / snap) * snap
    const nextTick = closestTick + snap
    const newBeat = nextTick + currentMeasureBeat

    // Check if we cross over the next measure

    const nextMeasureBeat = this.loadedChart.timingData.getBeatFromMeasure(
      currentMeasure + 1
    )

    if (newBeat > nextMeasureBeat) {
      this.beat = nextMeasureBeat
      return
    }

    this.beat = newBeat
  }

  previousSnap() {
    let curIndex = this.getSnapIndex() - 1
    curIndex = (curIndex + SNAPS.length) % SNAPS.length
    Options.chart.snap = SNAPS[curIndex] == -1 ? 0 : 1 / SNAPS[curIndex]
    EventHandler.emit("snapChanged")
  }

  nextSnap() {
    let curIndex = this.getSnapIndex()
    if (
      curIndex == SNAPS.length - 1 ||
      Math.abs(1 / Options.chart.snap - SNAPS[curIndex]) <= 0.0005
    ) {
      curIndex++
    }
    curIndex = (curIndex + SNAPS.length) % SNAPS.length
    Options.chart.snap = SNAPS[curIndex] == -1 ? 0 : 1 / SNAPS[curIndex]
    EventHandler.emit("snapChanged")
  }

  private getSnapIndex() {
    if (Options.chart.snap == 0) return SNAPS.length - 1
    return SNAPS.findIndex(s => 1 / s <= Options.chart.snap)
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

  private getRows() {
    if (
      this.loadedSM == undefined ||
      this.loadedChart == undefined ||
      this.chartView == undefined
    )
      return []
    if (this.loadedChart.getNotedata().length == 0) return []
    const holdTails = this.loadedChart
      .getNotedata()
      .filter(isHoldNote)
      .map(note => note.beat + note.hold)
    const beats = this.loadedChart
      .getNotedata()
      .map(note => note.beat)
      .concat(holdTails)
      .sort((a, b) => a - b)
    return this.removeDuplicateBeats(beats)
  }

  /**
   * Seeks to the previous note.
   *
   * @memberof ChartManager
   */
  previousNote() {
    const rows = this.getRows()
    if (rows.length == 0) return
    let index = bsearch(rows, this.beat)
    if (this.beat == rows[index]) index--
    this.beat = rows[Math.max(0, index)]
  }

  /**
   * Seeks to the next note.
   *
   * @memberof ChartManager
   */
  nextNote() {
    const rows = this.getRows()
    if (rows.length == 0) return
    let index = bsearch(rows, this.beat)
    if (this.beat >= rows[index]) index++
    this.beat = rows[Math.min(rows.length - 1, index)]
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
    this.beat = notedata[0].beat
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
    this.beat = getNoteEnd(note)
  }

  private truncateHold(
    hold: PartialHoldNotedataEntry,
    beat: number
  ): PartialNotedataEntry {
    const newHoldEndBeat = clamp(
      Math.round((beat - Math.max(1 / 48, Options.chart.snap)) * 48) / 48,
      hold.beat,
      hold.beat + hold.hold - 1 / 48
    )
    if (newHoldEndBeat == hold.beat)
      return {
        beat: hold.beat,
        col: hold.col,
        type: "Tap",
      }
    return {
      beat: hold.beat,
      col: hold.col,
      type: hold.type,
      hold: newHoldEndBeat - hold.beat,
    }
  }

  /**
   * Places/removes a note at the specified beat and column
   *
   * @param {number} col - The column to place the note at
   * @param {("mouse" | "key")} type - The input type
   * @param {number} [beat] - The beat to place the note at. Defaults to the current beat.
   * @memberof ChartManager
   */
  setNote(col: number, type: "mouse" | "key", beat: number = this.beat) {
    if (
      this.loadedSM == undefined ||
      this.loadedChart == undefined ||
      this.chartView == undefined
    )
      return
    if (Options.chart.forceSnapNotes) {
      const snap = Options.chart.snap == 0 ? 1 / 48 : Options.chart.snap
      beat = Math.round(beat / snap) * snap
    }
    beat = Math.max(0, Math.round(beat * 48) / 48)

    const conflictingNotes = this.loadedChart.getNotedata().filter(note => {
      if (note.col != col) return false
      if (Math.abs(note.beat - beat) < 0.003) return true
      return isHoldNote(note) && note.beat == beat
    })
    const truncatedHolds = this.loadedChart
      .getNotedata()
      .filter(
        note =>
          isHoldNote(note) &&
          note.col == col &&
          beat > note.beat &&
          beat <= Math.round((note.beat + note.hold) * 48) / 48
      )
      .map(hold => {
        return {
          oldNote: hold as HoldNotedataEntry,
          newNote: this.truncateHold(hold as HoldNotedataEntry, beat),
        }
      })

    const holdEdit: PartialHold = {
      startBeat: beat,
      endBeat: beat,
      roll: false,
      originalNote: undefined,
      type,
      removedNotes: conflictingNotes,
      truncatedHolds: truncatedHolds,
      direction: null,
    }
    this.holdEditing[col] = holdEdit

    if (conflictingNotes.length == 0) {
      holdEdit.originalNote = {
        beat: beat,
        col: col,
        type: this.getEditingNoteType()!,
      }
    }
    this.setNoteIndex()
    this.app.actionHistory.run({
      action: () => {
        holdEdit.removedNotes.forEach(note => {
          this.loadedChart!.removeNote(note)
          this.removeNoteFromSelection(note)
        })

        holdEdit.truncatedHolds.forEach(data =>
          this.loadedChart!.modifyNote(data.oldNote, data.newNote)
        )
        if (holdEdit.originalNote)
          this.loadedChart!.addNote(holdEdit.originalNote)
      },
      undo: () => {
        if (holdEdit.originalNote)
          this.loadedChart!.removeNote(holdEdit.originalNote)
        holdEdit.truncatedHolds.forEach(data =>
          this.loadedChart!.modifyNote(data.newNote, data.oldNote)
        )
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
    beat = Math.round(beat * 48) / 48
    if (beat == hold.startBeat && beat == hold.endBeat) return
    if (hold.direction === null) {
      if (beat < hold.startBeat) {
        hold.direction = "up"
      } else {
        hold.direction = "down"
      }
    }
    if (Options.chart.defaultHoldPlacement) {
      if (hold.direction == "up") {
        hold.startBeat = Math.min(hold.endBeat, Math.round(beat * 48) / 48)
      } else {
        hold.endBeat = Math.max(hold.startBeat, Math.round(beat * 48) / 48)
      }
    } else {
      hold.startBeat = Math.min(hold.startBeat, Math.round(beat * 48) / 48)
      hold.endBeat = Math.max(hold.endBeat, Math.round(beat * 48) / 48)
    }
    hold.roll ||= roll
    if (!hold.originalNote) {
      const note: PartialNotedataEntry = {
        beat: hold.startBeat,
        col: col,
        type: hold.roll ? "Roll" : "Hold",
        hold: hold.endBeat - hold.startBeat,
      }
      if (hold.endBeat - hold.startBeat == 0) {
        note.type = "Tap"
        Object.assign(note, { hold: undefined })
      }
      this.loadedChart.addNote(note)
    } else {
      const props: Partial<PartialNotedataEntry> = {
        beat: hold.startBeat,
        type: hold.roll ? "Roll" : "Hold",
        hold: hold.endBeat - hold.startBeat,
      }
      if (hold.endBeat - hold.startBeat == 0) {
        props.hold = undefined
        props.type = "Tap"
      }
      if (
        props.beat != hold.originalNote.beat ||
        props.type != hold.originalNote.type ||
        (isHoldNote(hold.originalNote) && props.hold != hold.originalNote.hold)
      ) {
        this.loadedChart.modifyNote(hold.originalNote, props)
      }
    }
    hold.originalNote = {
      beat: hold.startBeat,
      col: col,
      type:
        hold.endBeat - hold.startBeat == 0
          ? "Tap"
          : hold.roll
            ? "Roll"
            : "Hold",
      hold:
        hold.endBeat - hold.startBeat == 0
          ? undefined
          : hold.endBeat - hold.startBeat,
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
    this.setNoteIndex()
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

  getEditingNoteType(): NoteType | null {
    return (
      this.loadedChart?.gameType.editNoteTypes[this.editNoteTypeIndex] ?? null
    )
  }

  setEditingNoteType(type: NoteType) {
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
        this.setNoteIndex()
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
      this.holdFlashes = []
      for (let i = 0; i < this.loadedChart.gameType.numCols; i++) {
        this.chartView.getNotefield().releaseHold(i)
        this.chartView.getNotefield().releaseRoll(i)
      }
      for (const note of notedata) {
        if (note.second < this.time) note.gameplay!.hasHit = true
        else break
      }
      this.gameStats = new GameplayStats(this)
      this.widgetManager.startPlay()
      this.chartAudio.seek(Math.max(0, this.time) - 1)
      this.loadedChart.gameType.gameLogic.startPlay(this)
      this.chartAudio.play()
      this.chartView.startPlay()
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
    if (this.smPath.startsWith("https://") || this.smPath.startsWith("http://"))
      return

    const smPath = this.getSMPath(".sm")
    const sscPath = this.getSMPath(".ssc")

    let error: string | null = null
    if (
      !this.loadedSM.usesChartTiming() &&
      (await FileHandler.getFileHandle(this.getSMPath(".sm")))
    ) {
      await FileHandler.writeFile(smPath, this.loadedSM.serialize("sm")).catch(
        err => {
          const message = err.message
          if (!message.includes(errors.GONE[0])) {
            error = message
          }
        }
      )
    }
    if (
      this.loadedSM.requiresSSC() ||
      (await FileHandler.getFileHandle(sscPath))
    ) {
      await FileHandler.writeFile(
        sscPath,
        this.loadedSM.serialize("ssc")
      ).catch(err => {
        const message = err.message
        if (!message.includes(errors.GONE[0])) {
          error = message
        }
      })
    }
    await FileHandler.writeFile(
      this.getDataPath(),
      serializeSMEData(this.loadedSM)
    ).catch(err => {
      const message = err.message
      if (!message.includes(errors.GONE[0])) {
        error = message
      }
    })

    if (error == null) {
      if (this.loadedSM.usesChartTiming()) {
        WaterfallManager.create(
          "Saved. No SM file since split timing was used."
        )
      } else {
        WaterfallManager.create("Saved")
      }
      await this.removeAutosaves()
    } else {
      WaterfallManager.createFormatted("Failed to save file: " + error, "error")
    }
    ActionHistory.instance.setLimit()
    return
  }

  getDataPath() {
    if (window.nw) {
      const path = window.nw.require("path")
      const pathData = path.parse(this.smPath)
      return path.resolve(pathData.dir, "data.sme") as string
    } else {
      const dir = dirname(this.smPath)
      return dir + "/data.sme"
    }
  }

  getSMPath(ext: string) {
    if (window.nw) {
      const path = window.nw.require("path")
      const pathData = path.parse(this.smPath)
      return path.resolve(pathData.dir, pathData.name + ext) as string
    } else {
      const dir = dirname(this.smPath)
      const baseName = basename(this.smPath)
      const fileName = baseName.includes(".")
        ? baseName.split(".").slice(0, -1).join(".")
        : baseName
      return dir + "/" + fileName + ext
    }
  }

  async removeAutosaves() {
    await FileHandler.removeFile(this.getSMPath(".smebak")).catch(() => {})
  }

  /**
   * Autosaves the current chart to disk.
   *
   * @memberof ChartManager
   */
  async autosave() {
    if (!this.loadedSM) return

    if (this.smPath.startsWith("https://") || this.smPath.startsWith("http://"))
      return

    // save as ssc

    let error: string | null = null
    await FileHandler.writeFile(
      this.getSMPath(".smebak"),
      this.loadedSM.serialize("smebak")
    ).catch(err => {
      const message = err.message
      if (!message.includes(errors.GONE[0])) {
        error = message
      }
    })
    if (error == null) {
      WaterfallManager.create("Autosaved")
    } else {
      WaterfallManager.createFormatted(
        "Failed to autosave file: " + error,
        "error"
      )
    }
    return
  }

  hasSelection() {
    return this.hasNoteSelection() || this.hasEventSelection()
  }

  hasNoteSelection() {
    return (
      this.selection.notes.length > 0 ||
      (this.startRegion !== undefined && this.endRegion !== undefined)
    )
  }

  hasEventSelection() {
    return this.eventSelection.timingEvents.length > 0
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
    let i1 = 0
    let i2 = 0
    const result: NotedataEntry[] = []
    const column1 = this.selection.inProgressNotes
    const column2 = this.selection.notes
    const compare = (a: NotedataEntry, b: NotedataEntry) => {
      if (a.beat == b.beat) return a.col - b.col
      return a.beat - b.beat
    }

    if (column1.length == 0 || column2.length == 0) {
      this.selection.notes = column1.concat(column2)
      this.selection.inProgressNotes = []
      return
    }

    while (true) {
      if (compare(column1[i1], column2[i2]) < 0) {
        result.push(column1[i1])
        i1++
        if (i1 >= column1.length) {
          this.selection.notes = result.concat(column2.slice(i2))
          break
        }
      } else {
        result.push(column2[i2])
        i2++
        if (i2 >= column2.length) {
          this.selection.notes = result.concat(column1.slice(i1))
          break
        }
      }
    }
    this.selection.inProgressNotes = []
  }

  startDragEventSelection() {
    this.eventSelection.inProgressTimingEvents = []
  }

  endDragEventSelection() {
    let i1 = 0
    let i2 = 0
    const result: Cached<TimingEvent>[] = []
    const column1 = this.eventSelection.inProgressTimingEvents
    const column2 = this.eventSelection.timingEvents
    const compare = (a: Cached<TimingEvent>, b: Cached<TimingEvent>) => {
      return a.beat - b.beat
    }

    if (column1.length == 0 || column2.length == 0) {
      this.eventSelection.timingEvents = column1.concat(column2)
      this.eventSelection.inProgressTimingEvents = []
      return
    }

    while (true) {
      if (compare(column1[i1], column2[i2]) < 0) {
        result.push(column1[i1])
        i1++
        if (i1 >= column1.length) {
          this.eventSelection.timingEvents = result.concat(column2.slice(i2))
          break
        }
      } else {
        result.push(column2[i2])
        i2++
        if (i2 >= column2.length) {
          this.eventSelection.timingEvents = result.concat(column1.slice(i1))
          break
        }
      }
    }
    this.eventSelection.inProgressTimingEvents = []
  }

  addNoteToDragSelection(note: NotedataEntry) {
    this.addNoteSelection(this.selection.inProgressNotes, note)
  }

  removeNoteFromDragSelection(note: NotedataEntry) {
    this.removeNoteSelection(this.selection.inProgressNotes, note)
  }

  addEventToDragSelection(event: Cached<TimingEvent>) {
    this.addEventSelection(this.eventSelection.inProgressTimingEvents, event)
  }

  removeEventFromDragSelection(event: Cached<TimingEvent>) {
    this.removeEventSelection(this.eventSelection.inProgressTimingEvents, event)
  }

  addNoteToSelection(note: NotedataEntry) {
    this.addNoteSelection(this.selection.notes, note)
  }

  removeNoteFromSelection(note: NotedataEntry) {
    this.removeNoteSelection(this.selection.notes, note)
  }

  setNoteSelection(notes: NotedataEntry[]) {
    this.selection.inProgressNotes = []
    this.selection.notes = [...notes].sort((a, b) => {
      if (a.beat == b.beat) return a.col - b.col
      return a.beat - b.beat
    })
  }

  addEventToSelection(event: Cached<TimingEvent>) {
    this.addEventSelection(this.eventSelection.timingEvents, event)
  }

  removeEventFromSelection(event: Cached<TimingEvent>) {
    this.removeEventSelection(this.eventSelection.timingEvents, event)
  }

  setEventSelection(notes: Cached<TimingEvent>[]) {
    this.eventSelection.inProgressTimingEvents = []
    this.eventSelection.timingEvents = notes.sort((a, b) => a.beat - b.beat)
  }

  isNoteInSelection(note: NotedataEntry) {
    return (
      this.getNoteSelectionIndex(this.selection.notes, note) != -1 ||
      this.getNoteSelectionIndex(this.selection.inProgressNotes, note) != -1
    )
  }

  isEventInSelection(event: Cached<TimingEvent>) {
    return (
      this.getEventSelectionIndex(this.eventSelection.timingEvents, event) !=
        -1 ||
      this.getEventSelectionIndex(
        this.eventSelection.inProgressTimingEvents,
        event
      ) != -1
    )
  }

  private addNoteSelection(list: NotedataEntry[], note: NotedataEntry) {
    let i = bsearchEarliest(list, note.beat, note => note.beat)
    while (
      list[i] &&
      (list[i].beat < note.beat ||
        (list[i].beat == note.beat && list[i].col < note.col))
    )
      i++
    list.splice(i, 0, note)
  }

  private removeNoteSelection(list: NotedataEntry[], note: NotedataEntry) {
    const index = this.getNoteSelectionIndex(list, note)
    if (index == -1) return
    list.splice(index, 1)
  }

  private getNoteSelectionIndex(list: NotedataEntry[], note: NotedataEntry) {
    let i = bsearchEarliest(list, note.beat, note => note.beat)
    while (list[i] && list[i].beat == note.beat) {
      if (compareObjects(list[i], note)) return i
      i++
    }
    return -1
  }

  private addEventSelection(
    list: Cached<TimingEvent>[],
    note: Cached<TimingEvent>
  ) {
    let i = bsearchEarliest(list, note.beat, note => note.beat)
    while (list[i] && list[i].beat <= note.beat) i++
    list.splice(i, 0, note)
  }

  private removeEventSelection(
    list: Cached<TimingEvent>[],
    note: Cached<TimingEvent>
  ) {
    const index = this.getEventSelectionIndex(list, note)
    if (index == -1) return
    list.splice(index, 1)
  }

  private getEventSelectionIndex(
    list: Cached<TimingEvent>[],
    note: Cached<TimingEvent>
  ) {
    let i = bsearchEarliest(list, note.beat, note => note.beat)
    while (list[i] && list[i].beat == note.beat) {
      if (compareObjects(list[i], note)) return i
      i++
    }
    return -1
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
    this.endRegion = this.beat
    if (this.endRegion < this.startRegion) {
      this.endRegion = this.startRegion
      this.startRegion = this.beat
    }
    EventHandler.emit("regionChanged", this.startRegion, this.endRegion)
    if (this.editTimingMode == EditTimingMode.Off) {
      this.setNoteSelection(
        this.loadedChart.getNotedataInRange(this.startRegion, this.endRegion)
      )
    } else {
      this.setEventSelection(
        TIMING_EVENT_NAMES.flatMap(
          event =>
            this.loadedChart!.timingData.getColumn(event)
              .events as Cached<TimingEvent>[]
        ).filter(
          event =>
            event.beat >= this.startRegion! && event.beat <= this.endRegion!
        )
      )
    }
  }

  modifySelection(
    modify: (note: NotedataEntry) => PartialNotedataEntry,
    clear = false
  ) {
    if (!this.loadedChart) return
    const selectionNotes = this.selection.notes
    const newNotes = structuredClone(this.selection.notes)
      .map(modify)
      .sort((a, b) => {
        if (a.beat == b.beat) return a.col - b.col
        return a.beat - b.beat
      })
    if (newNotes.length == 0) return
    const uniqueNotes: PartialNotedataEntry[] = []
    for (const note of newNotes) {
      const lastNote = uniqueNotes.at(-1)
      if (
        lastNote !== undefined &&
        lastNote.beat == note.beat &&
        lastNote.col == note.col
      ) {
        continue
      }
      uniqueNotes.push(note)
    }
    if (uniqueNotes.length == 0) return

    const { removedNotes, truncatedHolds } = this.checkConflicts(
      uniqueNotes,
      selectionNotes
    )

    if (clear) {
      // Remove all notes in the range that would be replaced
      const endBeats = uniqueNotes.map(note => getNoteEnd(note))
      let maxBeat = 0
      for (const endBeat of endBeats) {
        if (endBeat > maxBeat) {
          maxBeat = endBeat
        }
      }

      // We can treat this as just all holds from start to end
      const clearNotes: PartialHoldNotedataEntry[] = new Array(
        this.loadedChart.gameType.numCols
      )
        .fill(0)
        .map((_, i) => {
          return {
            type: "Hold",
            hold: maxBeat - uniqueNotes[0].beat,
            col: i,
            beat: uniqueNotes[0].beat,
          }
        })
      const {
        removedNotes: removedNotesCleared,
        truncatedHolds: truncatedHoldsCleared,
      } = this.checkConflicts(clearNotes, selectionNotes)

      // Merge both conflicts together
      removedNotesCleared.forEach(note => {
        if (!removedNotes.includes(note)) removedNotes.push(note)
      })

      truncatedHoldsCleared.forEach(note => {
        // Find a match with the same old note
        const match = truncatedHolds.find(
          truncated => truncated.oldNote == note.oldNote
        )
        if (match) {
          // Take the shorter of the two
          const oldHoldLength = isHoldNote(match.newNote)
            ? match.newNote.hold
            : 0
          const newHoldLength = isHoldNote(match.newNote)
            ? match.newNote.hold
            : 0
          const newLength = Math.min(oldHoldLength, newHoldLength)
          if (newLength == 0) {
            match.newNote = {
              beat: match.newNote.beat,
              col: match.newNote.col,
              type: "Tap",
            }
          } else {
            match.newNote = {
              beat: match.newNote.beat,
              col: match.newNote.col,
              type: match.newNote.type,
              hold: newLength,
            }
          }
        }
      })

      // Sort both arrays

      removedNotes.sort((a, b) => {
        if (a.beat == b.beat) return a.col - b.col
        return a.beat - b.beat
      })

      truncatedHolds.sort((a, b) => {
        if (a.newNote.beat == b.newNote.beat)
          return a.newNote.col - b.newNote.col
        return a.newNote.beat - b.newNote.beat
      })
    }

    this.app.actionHistory.run({
      action: () => {
        this.loadedChart!.removeNotes(
          selectionNotes.concat(removedNotes),
          false
        )
        truncatedHolds.forEach(data =>
          this.loadedChart!.modifyNote(data.oldNote, data.newNote, false)
        )
        this.clearSelections()
        this.setNoteSelection(this.loadedChart!.addNotes(uniqueNotes))
      },
      undo: () => {
        this.loadedChart!.removeNotes(uniqueNotes, false)
        truncatedHolds.forEach(data =>
          this.loadedChart!.modifyNote(data.newNote, data.oldNote, false)
        )
        this.loadedChart!.addNotes(removedNotes, false)
        this.clearSelections()
        this.setNoteSelection(this.loadedChart!.addNotes(selectionNotes))
      },
    })
  }

  private checkConflicts(
    notes: PartialNotedataEntry[],
    exclude: PartialNotedataEntry[] = []
  ) {
    if (notes.length == 0) return { removedNotes: [], truncatedHolds: [] }
    const notedata = this.loadedChart!.getNotedata()

    const numColumns = this.loadedChart!.gameType.numCols

    // Split data into columns
    const notedataCols: Notedata[] = new Array(numColumns).fill(0).map(_ => [])
    for (const note of notedata) {
      notedataCols[note.col].push(note)
    }

    const newNoteCols: PartialNotedataEntry[][] = new Array(numColumns)
      .fill(0)
      .map(_ => [])
    for (const note of notes) {
      if (note.col > numColumns) {
        continue
      }
      newNoteCols[note.col].push(note)
    }

    // Find conflicts by column

    const removedNotes: NotedataEntry[] = []
    const truncatedHolds: {
      oldNote: PartialHoldNotedataEntry
      newNote: PartialNotedataEntry
    }[] = []
    const modifiedNotes: NotedataEntry[] = []

    for (let col = 0; col < numColumns; col++) {
      if (newNoteCols[col].length == 0) continue

      // Find earliest existing note that can conflict
      let notedataIndex = notedataCols[col].findIndex(
        note =>
          newNoteCols[col][0].beat <=
          (isHoldNote(note) ? note.beat + note.hold : note.beat)
      )
      for (const newNote of newNoteCols[col]) {
        while (notedataCols[col][notedataIndex]) {
          const note = notedataCols[col][notedataIndex]
          const newNoteEndBeat = isHoldNote(newNote)
            ? newNote.beat + newNote.hold
            : newNote.beat
          if (!exclude.includes(note) && !modifiedNotes.includes(note)) {
            if (newNote.beat <= note.beat && newNoteEndBeat >= note.beat) {
              modifiedNotes.push(note)
              removedNotes.push(note)
            } else if (
              isHoldNote(note) &&
              note.beat + note.hold >= newNote.beat &&
              note.beat < newNote.beat
            ) {
              modifiedNotes.push(note)
              truncatedHolds.push({
                oldNote: note,
                newNote: this.truncateHold(note, newNote.beat),
              })
            }
          }
          if (notedataCols[col][notedataIndex + 1]?.beat > newNoteEndBeat) {
            // Check the next new note
            break
          }
          notedataIndex++
        }
      }
    }

    removedNotes.sort((a, b) => {
      if (a.beat == b.beat) return a.col - b.col
      return a.beat - b.beat
    })

    truncatedHolds.sort((a, b) => {
      if (a.newNote.beat == b.newNote.beat) return a.newNote.col - b.newNote.col
      return a.newNote.beat - b.newNote.beat
    })

    return { removedNotes, truncatedHolds }
  }

  modifyEventSelection(modify: (event: Cached<TimingEvent>) => TimingEvent) {
    if (!this.loadedChart || !this.loadedSM) return

    const events: [TimingEvent, TimingEvent][] =
      this.eventSelection.timingEvents.map(event => [
        event,
        modify(structuredClone(event)),
      ])

    this.loadedChart.timingData.modifyColumnEvents(events)
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
    if (!this.loadedChart || !this.loadedSM) return
    this.loadedChart.timingData.deleteColumnEvents(
      this.eventSelection.timingEvents
    )
  }

  paste(data: string, clear = false) {
    if (!this.loadedChart) return
    if (data.startsWith("ArrowVortex:notes:")) {
      if (!this.pasteNotes(data, clear))
        this.pasteNotes(this.virtualClipboard, clear)
    }
    if (
      data.startsWith("ArrowVortex:tempo:") ||
      data.startsWith("SMEditor:tempo:")
    ) {
      if (!this.pasteTempo(data)) this.pasteTempo(this.virtualClipboard)
      return
    }
  }

  pasteNotes(data: string, clear = false) {
    if (!this.loadedChart) return true
    const notes = decodeNotes(data)
    if (!notes) return false
    if (notes.length == 0) return false
    this.insertNotes(
      notes.map(note => {
        note.beat += this.beat
        note.beat = Math.round(note.beat * 48) / 48
        return note
      }),
      clear
    )
    return true
  }

  insertNotes(notes: PartialNotedata, clear = false) {
    notes.sort((a, b) => {
      if (a.beat == b.beat) return a.col - b.col
      return a.beat - b.beat
    })

    const { removedNotes, truncatedHolds } = this.checkConflicts(notes)

    if (clear) {
      // Remove all notes in the range that would be replaced
      const endBeats = notes.map(note => getNoteEnd(note))
      let maxBeat = 0
      for (const endBeat of endBeats) {
        if (endBeat > maxBeat) {
          maxBeat = endBeat
        }
      }

      // We can treat this as just all holds from start to end
      const clearNotes: PartialHoldNotedataEntry[] = new Array(
        this.loadedChart!.gameType.numCols
      )
        .fill(0)
        .map((_, i) => {
          return {
            type: "Hold",
            hold: maxBeat - notes[0].beat,
            col: i,
            beat: notes[0].beat,
          }
        })
      const {
        removedNotes: removedNotesCleared,
        truncatedHolds: truncatedHoldsCleared,
      } = this.checkConflicts(clearNotes)

      // Merge both conflicts together
      removedNotesCleared.forEach(note => {
        if (!removedNotes.includes(note)) removedNotes.push(note)
      })

      truncatedHoldsCleared.forEach(note => {
        // Find a match with the same old note
        const match = truncatedHolds.find(
          truncated => truncated.oldNote == note.oldNote
        )
        if (match) {
          // Take the shorter of the two
          const oldHoldLength = isHoldNote(match.newNote)
            ? match.newNote.hold
            : 0
          const newHoldLength = isHoldNote(match.newNote)
            ? match.newNote.hold
            : 0
          const newLength = Math.min(oldHoldLength, newHoldLength)
          if (newLength == 0) {
            match.newNote = {
              beat: match.newNote.beat,
              col: match.newNote.col,
              type: "Tap",
            }
          } else {
            match.newNote = {
              beat: match.newNote.beat,
              col: match.newNote.col,
              type: match.newNote.type,
              hold: newLength,
            }
          }
        }
      })

      // Sort both arrays

      removedNotes.sort((a, b) => {
        if (a.beat == b.beat) return a.col - b.col
        return a.beat - b.beat
      })

      truncatedHolds.sort((a, b) => {
        if (a.newNote.beat == b.newNote.beat)
          return a.newNote.col - b.newNote.col
        return a.newNote.beat - b.newNote.beat
      })
    }

    this.app.actionHistory.run({
      action: () => {
        this.loadedChart!.removeNotes(removedNotes, false)
        truncatedHolds.forEach(data => {
          this.loadedChart!.modifyNote(data.oldNote, data.newNote, false)
        })
        this.clearSelections()
        this.setNoteSelection(this.loadedChart!.addNotes(notes))
      },
      undo: () => {
        this.loadedChart!.removeNotes(notes, false)
        truncatedHolds.forEach(data => {
          this.loadedChart!.modifyNote(data.newNote, data.oldNote, false)
        })
        this.setNoteSelection(this.loadedChart!.addNotes(removedNotes))
        this.clearSelections()
      },
    })
  }

  pasteTempo(data: string) {
    if (!this.loadedChart || !this.loadedSM) return true
    const events = decodeTempo(data)
    if (!events) return false
    if (events.length == 0) return false

    events.forEach(event => {
      if (event.type == "ATTACKS") event.second += this.time
      else event.beat += this.beat
    })

    this.loadedChart.timingData.insertColumnEvents(events)

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
        ...this.eventSelection.timingEvents.map(note => note.beat)
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
          if (a.type == "ATTACKS") return a.second - b.second
          return a.beat - b.beat
        })
      const encoded = encodeTempo(events)
      this.virtualClipboard = encoded
      return encoded
    }
  }
}
