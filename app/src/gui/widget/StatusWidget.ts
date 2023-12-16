import { Parser } from "expr-eval"
import { Container, Sprite, Texture } from "pixi.js"
import { EditMode, EditTimingMode } from "../../chart/ChartManager"
import { BetterRoundedRect } from "../../util/BetterRoundedRect"
import { EventHandler } from "../../util/EventHandler"
import { roundDigit } from "../../util/Math"
import { Options } from "../../util/Options"
import { Flags } from "../../util/Switches"
import { Icons } from "../Icons"
import { Dropdown } from "../element/Dropdown"
import { TimingTrackOrderPopup } from "../popup/TimingTrackOrderPopup"
import { Widget } from "./Widget"
import { WidgetManager } from "./WidgetManager"

interface NoteArrow {
  element: HTMLButtonElement
  sprite: Container
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
  private readonly playIcon: HTMLImageElement
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
  private readonly arrangeTimingTracks: HTMLButtonElement

  private noteArrows: NoteArrow[] = []
  private readonly noteArrowMask: Sprite

  private lastTime = -1
  private lastBeat = -1
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
    const skipStartIcon = document.createElement("img")
    skipStartIcon.src = Icons.SKIP_START
    skipStartIcon.style.height = "36px"
    this.skipStart.appendChild(skipStartIcon)
    this.skipStart.onclick = () => {
      this.manager.chartManager.setBeat(0)
    }

    this.skipEnd = document.createElement("button")
    const skipEndIcon = document.createElement("img")
    skipEndIcon.style.height = "36px"
    skipEndIcon.src = Icons.SKIP_END
    this.skipEnd.appendChild(skipEndIcon)
    this.skipStart.appendChild(skipStartIcon)
    this.skipEnd.onclick = () => {
      this.manager.chartManager.lastNote()
    }

    this.play = document.createElement("button")
    const playIcon = document.createElement("img")
    playIcon.src = Icons.PLAY
    this.play.appendChild(playIcon)
    this.playIcon = playIcon
    this.play.onclick = () => {
      if (
        this.manager.chartManager.getMode() == EditMode.Record ||
        this.manager.chartManager.getMode() == EditMode.Play
      ) {
        this.manager.chartManager.setMode(EditMode.Edit)
      }
      this.manager.chartManager.playPause()
    }

    this.record = document.createElement("button")
    const recordIcon = document.createElement("img")
    recordIcon.style.height = "36px"
    recordIcon.src = Icons.RECORD
    this.record.appendChild(recordIcon)
    this.record.onclick = () => {
      this.manager.chartManager.setMode(EditMode.Record)
    }

    if (Flags.viewMode || !Flags.recordMode) this.record.style.display = "none"

    this.playtest = document.createElement("button")
    const playtestIcon = document.createElement("img")
    playtestIcon.style.height = "30px"
    playtestIcon.src = Icons.PLAYTEST
    this.playtest.appendChild(playtestIcon)
    this.playtest.onclick = () => {
      this.manager.chartManager.setMode(EditMode.Play)
    }

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
    min.innerText = "-"
    min.spellcheck = false
    min.contentEditable = "true"
    min.style.maxWidth = "27px"
    min.onkeydown = ev => {
      if (ev.key == "Enter") min.blur()
      if (ev.key == "Tab") sec.focus()
      if (ev.key == "Escape") {
        min.innerText = Math.floor(
          Math.abs(this.manager.chartManager.getTime()) / 60
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
    sec.innerText = "-"
    sec.spellcheck = false
    sec.contentEditable = "true"
    sec.style.maxWidth = "18px"
    sec.onkeydown = ev => {
      if (ev.key == "Enter") sec.blur()
      if (ev.key == "Tab") millis.focus()
      if (ev.key == "Escape") {
        sec.innerText = Math.floor(
          Math.abs(this.manager.chartManager.getTime()) % 60
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
    millis.innerText = "-"
    millis.spellcheck = false
    millis.contentEditable = "true"
    millis.style.maxWidth = "27px"
    millis.onkeydown = ev => {
      if (ev.key == "Enter") millis.blur()
      if (ev.key == "Tab") min.focus()
      if (ev.key == "Escape") {
        millis.innerText = (
          roundDigit(Math.abs(this.manager.chartManager.getTime()) % 1, 3) *
          1000
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
    beat.innerText = "-"
    beat.spellcheck = false
    beat.contentEditable = "true"
    beat.onkeydown = ev => {
      if (ev.key == "Enter") beat.blur()
      if (ev.key == "Escape") {
        if (this.beatDropdown.value == "Measure") {
          const measure =
            this.manager.chartManager.loadedChart?.timingData?.getMeasure(
              this.manager.chartManager.getBeat()
            ) ?? this.manager.chartManager.getBeat() / 4
          beat.innerText = roundDigit(measure, 3).toFixed(3)
        } else {
          beat.innerText = roundDigit(
            this.manager.chartManager.getBeat(),
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
            this.manager.chartManager.getBeat()
          ) ?? this.manager.chartManager.getBeat() / 4
        beat.innerText = roundDigit(measure, 3).toFixed(3)
      } else {
        beat.innerText = roundDigit(
          this.manager.chartManager.getBeat(),
          3
        ).toFixed(3)
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
    this.editSteps.classList.add("edit-fancy-button")
    const editStepsIcon = document.createElement("img")
    editStepsIcon.src = Icons.ADD
    this.editSteps.appendChild(editStepsIcon)
    this.editSteps.appendChild(document.createTextNode("Edit Steps"))
    this.editSteps.onclick = () => {
      this.manager.chartManager.editTimingMode = EditTimingMode.Off
    }
    this.editSteps.style.background = "rgba(255,255,255,0.15)"

    this.editTiming = document.createElement("button")
    this.editTiming.classList.add("edit-fancy-button")
    const editTimingIcon = document.createElement("img")
    editTimingIcon.src = Icons.SPEED
    this.editTiming.appendChild(editTimingIcon)
    this.editTiming.appendChild(document.createTextNode("Edit Timing"))
    this.editTiming.onclick = () => {
      this.manager.chartManager.editTimingMode = EditTimingMode.Edit
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
    const addTimingEventIcon = document.createElement("img")
    addTimingEventIcon.style.height = "32px"
    addTimingEventIcon.src = Icons.ADD_EVENT
    this.addTimingEvent.appendChild(addTimingEventIcon)
    this.addTimingEvent.onclick = () => {
      if (this.manager.chartManager.editTimingMode == EditTimingMode.Add)
        this.manager.chartManager.editTimingMode = EditTimingMode.Edit
      else this.manager.chartManager.editTimingMode = EditTimingMode.Add
    }
    this.timingContainer.appendChild(this.addTimingEvent)

    this.arrangeTimingTracks = document.createElement("button")
    const arrangeTimingTracksIcon = document.createElement("img")
    arrangeTimingTracksIcon.style.height = "32px"
    arrangeTimingTracksIcon.src = Icons.EYE
    this.arrangeTimingTracks.appendChild(arrangeTimingTracksIcon)
    this.arrangeTimingTracks.onclick = () => {
      TimingTrackOrderPopup.active
        ? TimingTrackOrderPopup.close()
        : TimingTrackOrderPopup.open()
    }
    this.arrangeTimingTracks.id = "arrange-tracks"
    this.timingContainer.appendChild(this.arrangeTimingTracks)

    this.editBar.appendChild(this.editChoiceContainer)

    const right = document.createElement("div")
    right.classList.add("note-placeholder-right")
    this.stepsContainer.appendChild(right)

    EventHandler.on("resize", () => {
      this.trackingMovement = true
      this.idleFrames = 5
    })

    EventHandler.on("chartLoaded", () => {
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
        const sprite = this.manager.chartManager
          .chartView!.getNotefield()
          .getNoteSprite({
            type,
            beat: 0,
            col: 0,
          })
        sprite.width = 32
        sprite.height = 32
        const bg = new Sprite(Texture.WHITE)
        bg.tint = 0
        bg.alpha = 0.5
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
        element.style.height = "48px"
        element.style.width = "48px"
        element.classList.add("note-placeholder")
        element.onclick = () => {
          this.manager.chartManager.setEditingNoteType(type)
        }
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
    const time = this.manager.chartManager.getTime()
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

    const beat = this.manager.chartManager.getBeat()
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
          this.editSteps.style.background = "rgba(255,255,255,0.15)"
          this.editTiming.style.background = ""
          break
        case EditTimingMode.Add:
          this.addTimingEvent.style.background = "rgba(255,255,255,0.15)"
          break
        case EditTimingMode.Edit:
          this.addTimingEvent.style.background = ""
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
      this.editSteps.style.background =
        timingMode == EditTimingMode.Off ? "rgba(255,255,255,0.15)" : ""
      this.editTiming.style.background =
        timingMode == EditTimingMode.Off ? "" : "rgba(255,255,255,0.15)"
    }

    const playing = this.manager.chartManager.chartAudio.isPlaying()
    if (this.lastPlaying != playing) {
      this.playIcon.src = playing ? Icons.STOP : Icons.PLAY
      this.lastPlaying = playing
    }
    this.playIcon.style.height =
      this.manager.chartManager.chartAudio.isPlaying() ? "28px" : ""

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
    this.noteArrows.forEach(arrow => {
      if (Options.general.smoothAnimations) {
        const target = noteType == arrow.type ? 0.15 : arrow.hovered ? 0.05 : 0
        arrow.highlight.alpha =
          (target - arrow.highlight.alpha) * 0.3 + arrow.highlight.alpha
      } else {
        arrow.highlight.alpha =
          noteType == arrow.type ? 0.15 : arrow.hovered ? 0.05 : 0
      }
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
      this.lastTime = -999
      return
    }
    let time = min * 60 + sec + millis / 1000
    if (time > 9999999) time = 9999999
    this.manager.chartManager.setTime(time)
    //force update
    this.lastTime = -999
  }

  private updateBeat() {
    let beat = this.parseString(this.beat)
    if (beat === null) {
      this.lastBeat = -999
      return
    }
    if (this.beatDropdown.value == "Measure") {
      const timingData = this.manager.chartManager.loadedChart?.timingData
      beat = timingData?.getBeatFromMeasure(beat) ?? beat * 4
    }
    if (beat > 9999999) beat = 9999999
    this.manager.chartManager.setBeat(beat)
    //force update
    this.lastBeat = -999
  }

  private parseString(el: HTMLDivElement) {
    try {
      const val = Parser.evaluate(el.innerText)
      if (!isFinite(val)) return 0
      if (val < 0) return 0
      return val
    } catch {
      return null
    }
  }
}
