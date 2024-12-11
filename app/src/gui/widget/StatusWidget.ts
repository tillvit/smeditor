import { Parser } from "expr-eval"
import { Color, Sprite, Texture } from "pixi.js"
import tippy from "tippy.js"
import { EditMode, EditTimingMode } from "../../chart/ChartManager"
import { NoteskinSprite } from "../../chart/gameTypes/noteskin/Noteskin"
import {
  HOLD_NOTE_TYPES,
  HoldNoteType,
  TapNoteType,
} from "../../chart/sm/NoteTypes"
import { BetterRoundedRect } from "../../util/BetterRoundedRect"
import { assignTint, blendPixiColors } from "../../util/Color"
import { EventHandler } from "../../util/EventHandler"
import { Flags } from "../../util/Flags"
import { Keybinds } from "../../util/Keybinds"
import { roundDigit } from "../../util/Math"
import { Options } from "../../util/Options"
import { Themes } from "../../util/Theme"
import { Icons } from "../Icons"
import { Dropdown } from "../element/Dropdown"
import { SplitTimingPopup } from "../popup/SplitTimingPopup"
import { TimingTrackOrderPopup } from "../popup/TimingTrackOrderPopup"
import { SyncWindow } from "../window/SyncWindow"
import { Widget } from "./Widget"
import { WidgetManager } from "./WidgetManager"

interface NoteArrow {
  element: HTMLButtonElement
  sprite: NoteskinSprite
  bg: Sprite
  highlight: BetterRoundedRect
  type: string
  hovered: boolean
}

export class StatusWidget extends Widget {
  private view: HTMLDivElement

  private readonly playbackBar: HTMLDivElement
  private readonly skipStart: HTMLButtonElement
  private readonly skipEnd: HTMLButtonElement
  private readonly play: HTMLButtonElement
  private readonly playIcon: HTMLDivElement
  private readonly stopIcon: HTMLDivElement
  private readonly record: HTMLButtonElement
  private readonly playtest: HTMLButtonElement
  private readonly timeCounter: HTMLDivElement
  private readonly beatCounter: HTMLDivElement
  private readonly min: HTMLDivElement
  private readonly sec: HTMLDivElement
  private readonly millis: HTMLDivElement
  private readonly beat: HTMLDivElement
  private readonly beatDropdown: Dropdown<string>

  private readonly editBar: HTMLDivElement
  private readonly editSteps: HTMLButtonElement
  private readonly editTiming: HTMLButtonElement
  private readonly stepsContainer: HTMLDivElement
  private readonly timingContainer: HTMLDivElement
  private readonly editChoiceContainer: HTMLDivElement

  private readonly addTimingEvent: HTMLButtonElement
  private readonly splitTiming: HTMLButtonElement
  private readonly toggleTimingTracks: HTMLButtonElement
  private readonly detectSync: HTMLButtonElement
  private readonly offsetCounter: HTMLDivElement
  private readonly offset: HTMLDivElement

  private noteArrows: NoteArrow[] = []
  private readonly noteArrowMask: Sprite

  private lastTime: number | null = null
  private lastBeat: number | null = null
  private lastOffset: number | null = null
  private lastMode = EditMode.Edit
  private lastTimingMode = EditTimingMode.Off
  private lastHover = 0
  private lastPlaying = false
  private hovering = false

  private trackingMovement = true
  private idleFrames = 0
  private lastBounds?: DOMRect

  constructor(manager: WidgetManager) {
    super(manager)

    const view = document.createElement("div")
    view.id = "status-widget"
    document.getElementById("view-wrapper")?.appendChild(view)

    if (Flags.viewMode) view.classList.add("collapsed")

    this.playbackBar = document.createElement("div")
    this.playbackBar.classList.add("playback-bar")
    this.editBar = document.createElement("div")
    this.editBar.classList.add("edit-bar")

    this.skipStart = document.createElement("button")
    this.skipStart.tabIndex = -1
    const skipStartIcon = Icons.getIcon("SKIP_START", 36)
    this.skipStart.appendChild(skipStartIcon)
    this.skipStart.onclick = () => {
      this.manager.chartManager.beat = Math.max(
        0,
        this.manager.chartManager.loadedChart!.getBeatFromSeconds(0)
      )
      this.skipStart.blur()
    }

    Keybinds.createKeybindTooltip(
      this.skipStart
    )`Skip to start ${"jumpSongStart"}`

    this.skipEnd = document.createElement("button")
    this.skipEnd.tabIndex = -1
    const skipEndIcon = Icons.getIcon("SKIP_END", 36)
    this.skipEnd.appendChild(skipEndIcon)
    this.skipEnd.onclick = () => {
      this.manager.chartManager.beat =
        this.manager.chartManager.loadedChart!.getBeatFromSeconds(
          this.manager.chartManager.chartAudio.getSongLength()
        )
      this.skipEnd.blur()
    }

    Keybinds.createKeybindTooltip(this.skipEnd)`Skip to end ${"jumpSongEnd"}`

    this.play = document.createElement("button")
    this.play.tabIndex = -1

    const playIcon = Icons.getIcon("PLAY", 40)
    this.play.appendChild(playIcon)
    this.playIcon = playIcon

    const stopIcon = Icons.getIcon("STOP", 32)
    this.play.appendChild(stopIcon)
    this.stopIcon = stopIcon
    this.stopIcon.style.display = "none"

    this.play.onclick = () => {
      if (
        this.manager.chartManager.getMode() == EditMode.Record ||
        this.manager.chartManager.getMode() == EditMode.Play
      ) {
        this.manager.chartManager.setMode(EditMode.Edit)
      }
      this.manager.chartManager.playPause()
      this.play.blur()
    }

    Keybinds.createKeybindTooltip(this.play)`Play/Pause ${"playback"}`

    this.record = document.createElement("button")
    this.record.tabIndex = -1
    const recordIcon = Icons.getIcon("RECORD", 36, undefined, "red")
    this.record.appendChild(recordIcon)
    this.record.onclick = () => {
      this.manager.chartManager.setMode(EditMode.Record)
      this.record.blur()
    }

    Keybinds.createKeybindTooltip(this.record)`Record ${"recordMode"}`

    if (Flags.viewMode || !Flags.recordMode) this.record.style.display = "none"

    this.playtest = document.createElement("button")
    this.playtest.tabIndex = -1
    const playtestIcon = Icons.getIcon("PLAYTEST", 30)
    this.playtest.appendChild(playtestIcon)
    this.playtest.onclick = () => {
      this.manager.chartManager.setMode(EditMode.Play)
      this.playtest.blur()
    }

    Keybinds.createKeybindTooltip(this.playtest)`Playtest ${"playMode"}`

    if (!Flags.playMode) this.playtest.style.display = "none"

    const line = document.createElement("div")
    line.classList.add("playback-separator")

    this.timeCounter = document.createElement("div")
    this.timeCounter.classList.add("playback-counter")
    const timeContainer = document.createElement("div")
    timeContainer.style.display = "flex"
    timeContainer.classList.add("playback-counter-main")
    const min = document.createElement("div")
    min.classList.add("inlineEdit")
    min.innerText = "00"
    min.spellcheck = false
    min.contentEditable = "true"
    min.style.maxWidth = "27px"
    min.onkeydown = ev => {
      if (ev.key == "Enter") min.blur()
      if (ev.key == "Escape") {
        min.innerText = Math.floor(
          Math.abs(this.manager.chartManager.time) / 60
        )
          .toString()
          .padStart(2, "0")
        min.blur()
      }
    }
    min.onfocus = () => setTimeout(() => this.selectText(min), 25)
    min.onblur = () => this.updateTime()
    min.ondragstart = ev => ev.preventDefault()
    const sec = document.createElement("div")
    sec.classList.add("inlineEdit")
    sec.innerText = "00"
    sec.spellcheck = false
    sec.contentEditable = "true"
    sec.style.maxWidth = "18px"
    sec.onkeydown = ev => {
      if (ev.key == "Enter") sec.blur()
      if (ev.key == "Escape") {
        sec.innerText = Math.floor(
          Math.abs(this.manager.chartManager.time) % 60
        )
          .toString()
          .padStart(2, "0")
        sec.blur()
      }
    }
    sec.onfocus = () => setTimeout(() => this.selectText(sec), 25)
    sec.onblur = () => this.updateTime()
    sec.ondragstart = ev => ev.preventDefault()
    const millis = document.createElement("div")
    millis.classList.add("inlineEdit")
    millis.innerText = "000"
    millis.spellcheck = false
    millis.contentEditable = "true"
    millis.style.maxWidth = "27px"
    millis.onkeydown = ev => {
      if (ev.key == "Enter") millis.blur()
      if (ev.key == "Escape") {
        millis.innerText = (
          roundDigit(Math.abs(this.manager.chartManager.time) % 1, 3) * 1000
        )
          .toString()
          .padStart(3, "0")
        millis.blur()
      }
    }
    millis.onfocus = () => setTimeout(() => this.selectText(millis), 25)
    millis.onblur = () => this.updateTime()
    millis.ondragstart = ev => ev.preventDefault()
    this.min = min
    this.sec = sec
    this.millis = millis

    const timeLabel = document.createElement("div")
    timeLabel.classList.add("playback-counter-label")
    timeLabel.innerText = "Time"
    timeContainer.appendChild(min)
    timeContainer.appendChild(document.createTextNode(":"))
    timeContainer.appendChild(sec)
    timeContainer.appendChild(document.createTextNode("."))
    timeContainer.appendChild(millis)
    this.timeCounter.appendChild(timeContainer)
    this.timeCounter.appendChild(timeLabel)

    const line2 = document.createElement("div")
    line2.classList.add("playback-separator")

    this.beatCounter = document.createElement("div")
    this.beatCounter.classList.add("playback-counter")
    const beat = document.createElement("div")
    beat.classList.add("playback-counter-main", "inlineEdit")
    beat.innerText = "0.000"
    beat.spellcheck = false
    beat.contentEditable = "true"
    beat.onkeydown = ev => {
      if (ev.key == "Enter") beat.blur()
      if (ev.key == "Escape") {
        if (this.beatDropdown.value == "Measure") {
          const measure =
            this.manager.chartManager.loadedChart?.timingData?.getMeasure(
              this.manager.chartManager.beat
            ) ?? this.manager.chartManager.beat / 4
          beat.innerText = roundDigit(measure, 3).toFixed(3)
        } else {
          beat.innerText = roundDigit(
            this.manager.chartManager.beat,
            3
          ).toFixed(3)
        }
        beat.blur()
      }
    }
    beat.onfocus = () => {
      setTimeout(() => this.selectText(beat), 25)
    }
    beat.onblur = () => this.updateBeat()
    beat.ondragstart = ev => ev.preventDefault()
    this.beat = beat
    this.beatDropdown = Dropdown.create(["Beat", "Measure"], "Beat")
    this.beatDropdown.view
      .querySelector(".dropdown-selected")!
      .classList.add("playback-counter-label")
    this.beatCounter.appendChild(beat)
    this.beatCounter.appendChild(this.beatDropdown.view)
    this.beatDropdown.onChange(() => {
      if (this.beatDropdown.value == "Measure") {
        const measure =
          this.manager.chartManager.loadedChart?.timingData?.getMeasure(
            this.manager.chartManager.beat
          ) ?? this.manager.chartManager.beat / 4
        beat.innerText = roundDigit(measure, 3).toFixed(3)
      } else {
        beat.innerText = roundDigit(this.manager.chartManager.beat, 3).toFixed(
          3
        )
      }
    })

    this.playbackBar.appendChild(this.skipStart)
    this.playbackBar.appendChild(this.skipEnd)
    this.playbackBar.appendChild(this.play)
    this.playbackBar.appendChild(this.record)
    this.playbackBar.appendChild(this.playtest)
    this.playbackBar.appendChild(line)
    this.playbackBar.appendChild(this.timeCounter)
    this.playbackBar.appendChild(line2)
    this.playbackBar.appendChild(this.beatCounter)

    this.editSteps = document.createElement("button")
    this.editSteps.tabIndex = -1
    this.editSteps.classList.add("edit-fancy-button")
    const editStepsIcon = Icons.getIcon("FEET", 24)
    editStepsIcon.style.marginBottom = "2px"
    this.editSteps.appendChild(editStepsIcon)
    this.editSteps.appendChild(document.createTextNode("Edit Steps"))
    this.editSteps.onclick = () => {
      this.manager.chartManager.editTimingMode = EditTimingMode.Off
      this.editSteps.blur()
    }
    this.editSteps.classList.add("active")

    this.editTiming = document.createElement("button")
    this.editTiming.tabIndex = -1
    this.editTiming.classList.add("edit-fancy-button")
    const editTimingIcon = Icons.getIcon("METRONOME", 24)
    editTimingIcon.style.marginBottom = "2px"
    this.editTiming.appendChild(editTimingIcon)
    this.editTiming.appendChild(document.createTextNode("Edit Timing"))
    this.editTiming.onclick = () => {
      this.manager.chartManager.editTimingMode = EditTimingMode.Edit
      this.editTiming.blur()
    }

    const line4 = document.createElement("div")
    line4.classList.add("playback-separator")

    const leftContainer = document.createElement("div")
    leftContainer.classList.add("edit-bar-left")

    leftContainer.appendChild(this.editSteps)
    leftContainer.appendChild(this.editTiming)
    leftContainer.appendChild(line4)
    this.editBar.appendChild(leftContainer)

    this.editChoiceContainer = document.createElement("div")
    this.editChoiceContainer.classList.add("edit-choice-container")

    this.stepsContainer = document.createElement("div")
    this.stepsContainer.classList.add("edit-steps-container")

    this.timingContainer = document.createElement("div")
    this.timingContainer.classList.add("edit-timing-container")
    this.editChoiceContainer.appendChild(this.stepsContainer)
    this.editChoiceContainer.appendChild(this.timingContainer)

    this.addTimingEvent = document.createElement("button")
    this.addTimingEvent.tabIndex = -1
    const addTimingEventIcon = Icons.getIcon("ADD_EVENT", 32)
    this.addTimingEvent.appendChild(addTimingEventIcon)
    this.addTimingEvent.onclick = () => {
      if (this.manager.chartManager.editTimingMode == EditTimingMode.Add)
        this.manager.chartManager.editTimingMode = EditTimingMode.Edit
      else this.manager.chartManager.editTimingMode = EditTimingMode.Add
      this.addTimingEvent.blur()
    }
    this.timingContainer.appendChild(this.addTimingEvent)

    Keybinds.createKeybindTooltip(
      this.addTimingEvent
    )`Add timing events ${"toggleAddTiming"}`

    const line5 = document.createElement("div")
    line5.classList.add("playback-separator")
    this.timingContainer.appendChild(line5)

    this.splitTiming = document.createElement("button")
    this.splitTiming.tabIndex = -1
    const splitTimingIcon = Icons.getIcon("SPLIT_TIMING", 32)
    this.splitTiming.appendChild(splitTimingIcon)
    this.splitTiming.onclick = () => {
      SplitTimingPopup.active
        ? SplitTimingPopup.close()
        : SplitTimingPopup.open(this.manager.app)
      this.splitTiming.blur()
    }
    this.splitTiming.id = "split-timing"
    this.timingContainer.appendChild(this.splitTiming)

    tippy(this.splitTiming, {
      content: "Manage split timing",
    })

    this.toggleTimingTracks = document.createElement("button")
    this.toggleTimingTracks.tabIndex = -1
    const arrangeTimingTracksIcon = Icons.getIcon("EYE", 32)
    this.toggleTimingTracks.appendChild(arrangeTimingTracksIcon)
    this.toggleTimingTracks.onclick = () => {
      TimingTrackOrderPopup.active
        ? TimingTrackOrderPopup.close()
        : TimingTrackOrderPopup.open()
      this.toggleTimingTracks.blur()
    }
    this.toggleTimingTracks.id = "toggle-tracks"
    this.timingContainer.appendChild(this.toggleTimingTracks)

    tippy(this.toggleTimingTracks, {
      content: "Toggle timing track visibility",
    })

    this.detectSync = document.createElement("button")
    this.detectSync.tabIndex = -1
    const detectSyncIcon = Icons.getIcon("DETECT_SYNC", 32)
    this.detectSync.appendChild(detectSyncIcon)
    this.detectSync.onclick = () => {
      this.manager.app.windowManager.openWindow(
        new SyncWindow(this.manager.app)
      )
      this.detectSync.blur()
    }
    this.detectSync.id = "detect-sync"
    this.timingContainer.appendChild(this.detectSync)

    Keybinds.createKeybindTooltip(
      this.detectSync
    )`Detect audio sync ${"detectSync"}`

    const line6 = document.createElement("div")
    line6.classList.add("playback-separator")
    this.timingContainer.appendChild(line6)

    this.offsetCounter = document.createElement("div")
    this.offsetCounter.classList.add("playback-counter")
    const offsetLabel = document.createElement("div")
    offsetLabel.classList.add("playback-counter-label")
    offsetLabel.innerText = "Offset"
    const offset = document.createElement("div")
    offset.classList.add("playback-counter-main", "inlineEdit")
    offset.innerText = "0.000"
    offset.spellcheck = false
    offset.contentEditable = "true"
    offset.onkeydown = ev => {
      if (ev.key == "Enter") offset.blur()
      if (ev.key == "Escape") {
        offset.innerText = roundDigit(
          this.manager.chartManager.loadedChart?.timingData.getOffset() ?? 0,
          3
        ).toFixed(3)
        offset.blur()
      }
    }
    offset.tabIndex = -1
    offset.onfocus = () => {
      setTimeout(() => this.selectText(offset), 25)
    }
    offset.onblur = () => this.updateOffset()
    offset.ondragstart = ev => ev.preventDefault()

    this.offset = offset
    this.offsetCounter.appendChild(offset)
    this.offsetCounter.appendChild(offsetLabel)

    this.timingContainer.appendChild(this.offsetCounter)

    this.editBar.appendChild(this.editChoiceContainer)

    const right = document.createElement("div")
    right.classList.add("note-placeholder-right")
    this.stepsContainer.appendChild(right)

    EventHandler.on("resize", () => {
      this.trackingMovement = true
      this.idleFrames = 5
    })

    EventHandler.on("noteskinLoaded", () => {
      this.stepsContainer.replaceChildren()
      this.noteArrows.forEach(noteArrow => {
        this.removeChild(noteArrow.sprite)
        this.removeChild(noteArrow.bg)
        this.removeChild(noteArrow.highlight)
      })
      this.noteArrows = []
      const rightPlaceholder = document.createElement("div")
      rightPlaceholder.classList.add("note-placeholder-right")
      this.stepsContainer.appendChild(rightPlaceholder)
      if (!this.manager.chartManager.loadedChart) return
      for (const type of this.manager.chartManager.loadedChart.gameType
        .editNoteTypes) {
        if (HOLD_NOTE_TYPES.includes(type as HoldNoteType)) continue
        const sprite = this.manager.chartManager
          .chartView!.getNotefield()
          .createNote({
            type: type as TapNoteType,
            beat: 0,
            col: 0,
            quant: 4,
            second: 0,
            warped: false,
            fake: false,
          })
        sprite.scale.set(0.5)
        const bg = new Sprite(Texture.WHITE)
        assignTint(bg, "widget-bg")
        bg.width = 48
        bg.height = 48
        bg.anchor.set(0.5)
        const highlight = new BetterRoundedRect("noBorder")
        highlight.alpha = 0
        highlight.width = 48
        highlight.height = 48
        highlight.pivot.x = 24
        highlight.pivot.y = 24
        const element = document.createElement("button")
        element.tabIndex = -1
        element.style.height = "48px"
        element.style.width = "48px"
        element.classList.add("note-placeholder")
        element.onclick = () => {
          this.manager.chartManager.setEditingNoteType(type)
          element.blur()
        }
        Keybinds.createKeybindTooltip(element)`${"\\" + type} ${
          "noteType" + type
        }`
        const noteArrow = {
          element,
          sprite,
          type,
          bg,
          highlight,
          hovered: false,
        }
        element.onmouseover = () => {
          noteArrow.hovered = true
        }
        element.onmouseleave = () => {
          noteArrow.hovered = false
        }
        this.addChild(bg)
        this.addChild(sprite)
        this.addChild(highlight)
        const bound = element.getBoundingClientRect()
        sprite.position.y =
          bound.top -
          this.manager.app.view.clientHeight / 2 -
          this.manager.app.view.getBoundingClientRect().top +
          24
        sprite.position.x =
          bound.left - this.manager.app.view.clientWidth / 2 + 24
        bg.position = sprite.position
        this.noteArrows.push(noteArrow)
      }
      this.stepsContainer.replaceChildren(
        ...this.noteArrows.map(arrow => arrow.element),
        rightPlaceholder
      )
      this.trackingMovement = true
      this.idleFrames = 5
    })

    this.noteArrowMask = new Sprite(Texture.WHITE)
    this.noteArrowMask.height = 48
    this.noteArrowMask.width = 2500
    this.noteArrowMask.anchor.y = 1
    this.noteArrowMask.anchor.x = 0.5
    this.addChild(this.noteArrowMask)
    this.mask = this.noteArrowMask

    view.onmouseenter = () => {
      this.lastHover = Date.now()
      this.hovering = true
      this.view.style.opacity = ""
      this.view.style.transition = ""
    }
    view.onmouseleave = () => (this.hovering = false)

    view.appendChild(this.playbackBar)
    view.appendChild(this.editBar)
    this.view = view
    view.style.display = "none"
  }

  update(): void {
    this.view.style.display =
      this.manager.chartManager.loadedSM && Flags.status ? "" : "none"
    const time = this.manager.chartManager.time
    if (this.lastTime != time) {
      if (document.activeElement != this.min)
        this.min.innerText =
          (time < 0 ? "-" : "") +
          Math.floor(Math.abs(time) / 60)
            .toString()
            .padStart(2, "0")
      if (document.activeElement != this.sec)
        this.sec.innerText = Math.floor(Math.abs(time) % 60)
          .toString()
          .padStart(2, "0")
      if (document.activeElement != this.millis)
        this.millis.innerText = (roundDigit(Math.abs(time) % 1, 3) * 1000)
          .toString()
          .padStart(3, "0")
      this.lastTime = time
    }

    const beat = this.manager.chartManager.beat
    if (this.lastBeat != beat) {
      if (document.activeElement != this.beat) {
        if (this.beatDropdown.value == "Measure") {
          const measure =
            this.manager.chartManager.loadedChart?.timingData?.getMeasure(
              beat
            ) ?? beat / 4
          this.beat.innerText = roundDigit(measure, 3).toFixed(3)
        } else {
          this.beat.innerText = roundDigit(beat, 3).toFixed(3)
        }
      }
      this.lastBeat = beat
    }

    const offset =
      this.manager.chartManager.loadedChart?.timingData.getOffset() ?? 0
    if (this.lastOffset != offset) {
      if (document.activeElement != this.offset) {
        this.offset.innerText = roundDigit(offset, 3).toFixed(3)
      }
    }

    const mode = this.manager.chartManager.getMode()
    const timingMode = this.manager.chartManager.editTimingMode
    if (this.lastMode != mode) {
      switch (mode) {
        case EditMode.Edit:
          this.skipStart.disabled = false
          this.skipEnd.disabled = false
          this.record.disabled = false
          this.playtest.disabled = false
          this.min.contentEditable = "true"
          this.sec.contentEditable = "true"
          this.millis.contentEditable = "true"
          this.beat.contentEditable = "true"
          this.offset.contentEditable = "true"
          this.record.style.background = ""
          this.playtest.style.background = ""
          this.view.style.opacity = ""
          this.view.style.transition = ""
          this.view.classList.remove("collapsed")
          this.beatDropdown.disabled = false
          break
        case EditMode.Record:
          this.lastHover = Date.now()
          this.skipStart.disabled = true
          this.skipEnd.disabled = true
          this.record.disabled = false
          this.record.style.background = "rgba(170, 0, 0, 0.35)"
          this.playtest.disabled = true
          this.min.contentEditable = "false"
          this.sec.contentEditable = "false"
          this.millis.contentEditable = "false"
          this.beat.contentEditable = "false"
          this.offset.contentEditable = "false"
          if (timingMode != EditTimingMode.Off) {
            this.visible = false
          }
          this.view.classList.add("collapsed")
          this.beatDropdown.closeDropdown()
          this.beatDropdown.disabled = true
          break
        case EditMode.Play:
          this.lastHover = Date.now()
          this.skipStart.disabled = true
          this.skipEnd.disabled = true
          this.record.disabled = true
          this.playtest.disabled = false
          this.playtest.style.background = "rgba(12, 97, 31, 0.35)"
          this.min.contentEditable = "false"
          this.sec.contentEditable = "false"
          this.millis.contentEditable = "false"
          this.beat.contentEditable = "false"
          this.offset.contentEditable = "false"
          if (timingMode != EditTimingMode.Off) {
            this.visible = false
          }
          this.view.classList.add("collapsed")
          this.beatDropdown.closeDropdown()
          this.beatDropdown.disabled = true
          break
        case EditMode.View:
          this.lastHover = Date.now()
          this.skipStart.disabled = false
          this.skipEnd.disabled = false
          this.record.disabled = true
          this.playtest.disabled = false
          this.min.contentEditable = "true"
          this.sec.contentEditable = "true"
          this.millis.contentEditable = "true"
          this.beat.contentEditable = "true"
          this.offset.contentEditable = "true"
          if (timingMode != EditTimingMode.Off) {
            this.visible = false
          }
          this.view.classList.add("collapsed")
          this.beatDropdown.closeDropdown()
          this.beatDropdown.disabled = true
      }
      this.trackingMovement = true
      this.idleFrames = 5
      this.lastMode = mode
    }

    if (this.lastTimingMode != timingMode) {
      switch (timingMode) {
        case EditTimingMode.Off:
          this.visible = true
          this.stepsContainer.style.transform = ""
          this.timingContainer.style.transform = ""
          this.editSteps.classList.add("active")
          this.editTiming.classList.remove("active")
          this.offset.tabIndex = -1
          break
        case EditTimingMode.Add:
          this.addTimingEvent.classList.add("active")
          break
        case EditTimingMode.Edit:
          this.addTimingEvent.classList.remove("active")
          this.offset.tabIndex = 0
      }
      if (
        (this.lastTimingMode == EditTimingMode.Off &&
          timingMode != EditTimingMode.Off) ||
        (this.lastTimingMode != EditTimingMode.Off &&
          timingMode == EditTimingMode.Off)
      )
        this.manager.chartManager.clearSelections()
      this.trackingMovement = true
      this.idleFrames = 5
      this.lastTimingMode = timingMode
      this.stepsContainer.style.transform =
        timingMode == EditTimingMode.Off ? "" : "translateY(-48px)"
      this.timingContainer.style.transform =
        timingMode == EditTimingMode.Off ? "" : "translateY(-48px)"
      this.editSteps.classList.toggle(
        "active",
        timingMode == EditTimingMode.Off
      )
      this.editTiming.classList.toggle(
        "active",
        timingMode != EditTimingMode.Off
      )
    }

    const playing = this.manager.chartManager.chartAudio.isPlaying()
    if (this.lastPlaying != playing) {
      this.playIcon.style.display = playing ? "none" : ""
      this.stopIcon.style.display = playing ? "" : "none"
      this.lastPlaying = playing
    }

    if (mode == EditMode.Play || mode == EditMode.Record) {
      if (
        this.view.style.opacity == "" &&
        !this.hovering &&
        Date.now() - this.lastHover > 3000
      ) {
        this.view.style.opacity = "0.2"
        this.view.style.transition = "2s cubic-bezier(.11,.72,.51,1.14)"
      }
    }

    if (this.trackingMovement) {
      const firstArrow = this.noteArrows[0]
      if (firstArrow) {
        const bounds = firstArrow.element.getBoundingClientRect()
        this.noteArrows.forEach((noteArrow, index) => {
          noteArrow.sprite.position.y =
            bounds.top -
            this.manager.app.view.clientHeight / 2 -
            this.manager.app.view.getBoundingClientRect().top +
            24
          noteArrow.sprite.position.x =
            bounds.left -
            this.manager.app.view.clientWidth / 2 +
            24 +
            index * 48
          noteArrow.bg.position = noteArrow.sprite.position
          noteArrow.highlight.position = noteArrow.sprite.position
        })
        if (this.lastBounds) {
          const delta =
            Math.abs(this.lastBounds.top - bounds.top) +
            Math.abs(this.lastBounds.left - bounds.left)
          if (delta == 0) {
            this.idleFrames--
            if (this.idleFrames < 0) {
              this.trackingMovement = false
              this.lastBounds = undefined
              if (timingMode != EditTimingMode.Off) {
                this.visible = false
              }
            }
          }
        }
        this.lastBounds = bounds
      }
      const viewbounds = this.view.getBoundingClientRect()
      this.noteArrowMask.y =
        viewbounds.bottom -
        this.manager.app.view.clientHeight / 2 -
        this.manager.app.view.getBoundingClientRect().top
    }

    const noteType = this.manager.chartManager.getEditingNoteType()
    const hoverColor = Themes.getColor("editable-overlay-hover")
    const activeColor = Themes.getColor("editable-overlay-active")
    const emptyColor = new Color(hoverColor).setAlpha(0)
    this.noteArrows.forEach(arrow => {
      let color =
        noteType == arrow.type
          ? activeColor
          : arrow.hovered
            ? hoverColor
            : emptyColor
      if (Options.general.smoothAnimations) {
        color = new Color(
          blendPixiColors(
            new Color(arrow.highlight.tint).setAlpha(arrow.highlight.alpha),
            color,
            0.3
          )
        )
      }
      arrow.highlight.tint = color.toNumber()
      arrow.highlight.alpha = color.alpha
    })
  }

  private selectText(element: HTMLElement) {
    const sel = window.getSelection()
    const range = document.createRange()
    if (!sel || !range) return
    range.selectNodeContents(element)
    sel.removeAllRanges()
    sel.addRange(range)
  }

  private updateTime() {
    this.millis.innerText = this.millis.innerText.padEnd(3, "0").slice(0, 3)
    const min = this.parseString(this.min)
    const sec = this.parseString(this.sec)
    const millis = this.parseString(this.millis)
    if (min === null || sec === null || millis === null) {
      this.lastTime = null
      return
    }
    let time = min * 60 + sec + millis / 1000
    if (time > 9999999) time = 9999999
    if (time < 0) time = 0
    this.manager.chartManager.time = time
    // force update
    this.lastTime = null
  }

  private updateBeat() {
    let beat = this.parseString(this.beat)
    if (beat === null) {
      this.lastBeat = null
      return
    }
    if (this.beatDropdown.value == "Measure") {
      const timingData = this.manager.chartManager.loadedChart?.timingData
      beat = timingData?.getBeatFromMeasure(beat) ?? beat * 4
    }
    if (beat > 9999999) beat = 9999999
    if (beat < 0) beat = 0
    this.manager.chartManager.beat = beat
    // force update
    this.lastBeat = null
  }

  private updateOffset() {
    let offset = this.parseString(this.offset)
    if (offset === null) {
      this.lastOffset = null
      return
    }
    if (offset > 9999999) offset = 9999999
    if (offset < -9999999) offset = -9999999

    // force update
    this.lastOffset = null

    if (
      !this.manager.chartManager.loadedChart ||
      !this.manager.chartManager.loadedSM
    )
      return
    ;(this.manager.chartManager.loadedChart.timingData.hasChartOffset()
      ? this.manager.chartManager.loadedChart.timingData
      : this.manager.chartManager.loadedSM.timingData
    ).setOffset(offset)
  }

  private parseString(el: HTMLDivElement) {
    try {
      const val = Parser.evaluate(el.innerText)
      if (!isFinite(val)) return 0
      return val
    } catch {
      return null
    }
  }
}
