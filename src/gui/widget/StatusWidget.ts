import { Parser } from "expr-eval"
import { EditMode } from "../../chart/ChartManager"
import { isNumericKeyPress, roundDigit } from "../../util/Util"
import { Icons } from "../Icons"
import { Widget } from "./Widget"
import { WidgetManager } from "./WidgetManager"

export class StatusWidget extends Widget {
  private view: HTMLDivElement

  private playbackBar: HTMLDivElement
  private skipStart: HTMLButtonElement
  private skipEnd: HTMLButtonElement
  private play: HTMLButtonElement
  private playIcon: HTMLImageElement
  private record: HTMLButtonElement
  private playtest: HTMLButtonElement
  private timeCounter: HTMLDivElement
  private beatCounter: HTMLDivElement
  private min: HTMLDivElement
  private sec: HTMLDivElement
  private millis: HTMLDivElement
  private beat: HTMLDivElement

  private editBar: HTMLDivElement
  private editSteps: HTMLButtonElement
  private editTiming: HTMLButtonElement

  private lastTime = 0
  private lastBeat = 0
  private lastMode = EditMode.Edit
  private lastHover = 0
  private hovering = false
  constructor(manager: WidgetManager) {
    super(manager)
    const view = document.createElement("div")
    view.id = "status-widget"
    document.getElementById("view-wrapper")?.appendChild(view)

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

    this.playtest = document.createElement("button")
    const playtestIcon = document.createElement("img")
    playtestIcon.style.height = "30px"
    playtestIcon.src = Icons.PLAYTEST
    this.playtest.appendChild(playtestIcon)
    this.playtest.onclick = () => {
      this.manager.chartManager.setMode(EditMode.Play)
    }

    const line = document.createElement("div")
    line.classList.add("playback-seperator")

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
    min.onkeydown = ev => {
      if (!isNumericKeyPress(ev)) ev.preventDefault()
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
    min.onfocus = () => this.selectText(min)
    min.onblur = () => this.updateTime()
    min.ondragstart = ev => ev.preventDefault()
    const sec = document.createElement("div")
    sec.classList.add("inlineEdit")
    sec.innerText = "-"
    sec.spellcheck = false
    sec.contentEditable = "true"
    sec.onkeydown = ev => {
      if (!isNumericKeyPress(ev)) ev.preventDefault()
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
    sec.onfocus = () => this.selectText(sec)
    sec.onblur = () => this.updateTime()
    sec.ondragstart = ev => ev.preventDefault()
    const millis = document.createElement("div")
    millis.classList.add("inlineEdit")
    millis.innerText = "-"
    millis.spellcheck = false
    millis.contentEditable = "true"
    millis.onkeydown = ev => {
      if (!isNumericKeyPress(ev)) ev.preventDefault()
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
    millis.onfocus = () => this.selectText(millis)
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
    line2.classList.add("playback-seperator")

    this.beatCounter = document.createElement("div")
    this.beatCounter.classList.add("playback-counter")
    const beat = document.createElement("div")
    beat.classList.add("playback-counter-main", "inlineEdit")
    beat.innerText = "-"
    beat.spellcheck = false
    beat.contentEditable = "true"
    beat.onkeydown = ev => {
      if (!isNumericKeyPress(ev)) ev.preventDefault()
      if (ev.key == "Enter") beat.blur()
      if (ev.key == "Escape") {
        beat.innerText = roundDigit(
          this.manager.chartManager.getBeat(),
          3
        ).toFixed(3)
        beat.blur()
      }
    }
    beat.onfocus = () => {
      this.selectText(beat)
    }
    beat.onblur = () => this.updateBeat()
    beat.ondragstart = ev => ev.preventDefault()
    this.beat = beat
    const beatLabel = document.createElement("div")
    beatLabel.classList.add("playback-counter-label")
    beatLabel.innerText = "Beat"
    this.beatCounter.appendChild(beat)
    this.beatCounter.appendChild(beatLabel)

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

    this.editTiming = document.createElement("button")
    this.editTiming.classList.add("edit-fancy-button")
    const editTimingIcon = document.createElement("img")
    editTimingIcon.src = Icons.SPEED
    this.editTiming.appendChild(editTimingIcon)
    this.editTiming.appendChild(document.createTextNode("Edit Timing"))

    const line3 = document.createElement("div")
    line3.classList.add("playback-seperator")

    this.editBar.appendChild(this.editSteps)
    this.editBar.appendChild(this.editTiming)
    this.editBar.appendChild(line3)

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
    this.view.style.display = this.manager.chartManager.sm ? "" : "none"
    const time = this.manager.chartManager.getTime()
    if (this.lastTime != time) {
      if (document.activeElement != this.min)
        this.min.innerText = Math.floor(Math.abs(time) / 60)
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
      if (document.activeElement != this.beat)
        this.beat.innerText = roundDigit(beat, 3).toFixed(3)
      this.lastBeat = beat
    }

    const mode = this.manager.chartManager.getMode()
    if (this.lastMode != mode) {
      switch (mode) {
        case EditMode.Edit:
        case EditMode.View:
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
          break
        case EditMode.Record:
          this.lastHover = Date.now()
          this.skipStart.disabled = true
          this.skipEnd.disabled = true
          this.record.disabled = false
          this.record.style.background = "rgba(170, 0, 0, 0.2)"
          this.playtest.disabled = true
          this.min.contentEditable = "false"
          this.sec.contentEditable = "false"
          this.millis.contentEditable = "false"
          this.beat.contentEditable = "false"
          this.view.classList.add("collapsed")
          break
        case EditMode.Play:
          this.lastHover = Date.now()
          this.skipStart.disabled = true
          this.skipEnd.disabled = true
          this.record.disabled = true
          this.playtest.disabled = false
          this.playtest.style.background = "rgba(12, 97, 31, 0.2)"
          this.min.contentEditable = "false"
          this.sec.contentEditable = "false"
          this.millis.contentEditable = "false"
          this.beat.contentEditable = "false"
          this.view.classList.add("collapsed")
      }
      this.lastMode = mode
    }

    this.playIcon.src = this.manager.chartManager.songAudio.isPlaying()
      ? Icons.STOP
      : Icons.PLAY
    this.playIcon.style.height = this.manager.chartManager.songAudio.isPlaying()
      ? "28px"
      : ""

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
    let time =
      this.safeParse(this.min) * 60 +
      this.safeParse(this.sec) +
      this.safeParse(this.millis) / 1000
    if (time > 9999999) time = 9999999
    this.manager.chartManager.setTime(time)
  }

  private updateBeat() {
    let beat = this.safeParse(this.beat)
    if (beat > 9999999) beat = 9999999
    this.manager.chartManager.setBeat(beat)
  }

  private safeParse(el: HTMLDivElement) {
    try {
      const val = Parser.evaluate(el.innerText)
      if (!isFinite(val)) return 0
      if (val < 0) return 0
      return val
    } catch {
      return 0
    }
  }
}
