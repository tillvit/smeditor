import { Container } from "pixi.js"
import tippy from "tippy.js"
import { ChartTimingData } from "../../chart/sm/ChartTimingData"
import { TimingEvent, TimingEventType } from "../../chart/sm/TimingTypes"
import { EventHandler } from "../../util/EventHandler"
import { clamp } from "../../util/Math"

export class TimingColumnPopup {
  static activePopup?: TimingColumnPopup
  private button
  private type
  private timingData: ChartTimingData
  private readonly popup: HTMLDivElement
  private zoomer!: HTMLDivElement
  private editText!: HTMLDivElement
  private title!: HTMLDivElement
  private desc!: HTMLDivElement
  private convertText!: HTMLDivElement
  private convertBtnOne!: HTMLButtonElement
  private convertBtnTwo!: HTMLButtonElement
  private readonly onTimingChange = this.updateValues.bind(this)
  private readonly clickOutside
  private moveInterval

  onConfirm: (event: TimingEvent) => void = () => {}
  persistent = false
  constructor(
    button: Container,
    type: TimingEventType,
    timingData: ChartTimingData
  ) {
    this.button = button
    this.type = type
    this.timingData = timingData

    this.popup = this.build()
    this.updateValues()

    // instantly snap to position when first showing
    this.popup.style.transitionDuration = `0s`
    setTimeout(() => this.movePosition())

    this.clickOutside = (event: MouseEvent) => {
      if (!this.popup.contains(event.target as Node | null)) this.close()
    }
    EventHandler.on("timingModified", this.onTimingChange)
    document.getElementById("popups")?.appendChild(this.popup)
    this.moveInterval = setInterval(() => this.movePosition(), 150)
    TimingColumnPopup.activePopup?.close()
    TimingColumnPopup.activePopup = this
  }
  private movePosition() {
    const point = this.button.getBounds()
    // will the box stay in bounds?
    const centerx = point.left + point.width / 2
    const width = 250
    const leftRestriction = width / 2 + 15
    const rightRestriction = window.innerWidth - width / 2 - 15
    this.popup.style.left = `${clamp(
      centerx,
      leftRestriction,
      rightRestriction
    )}px`
    const canvasTop = document.getElementById("pixi")!.offsetTop + 9
    const centery = point.top + canvasTop + point.height / 2
    this.popup.style.top = `${point.top + point.height + canvasTop}px`
    if (centery + this.popup.clientHeight > window.innerHeight - 15) {
      this.popup.style.transform = `translate(-50%, -100%)`
      this.popup.style.top = `${point.top - point.height / 2 + canvasTop}px`
    }

    // allow smooth movement after initial one
    setTimeout(() => (this.popup.style.transitionDuration = ``), 10)
  }
  private build() {
    const popup = document.createElement("div")
    popup.classList.add("popup")
    const popupZoomer = document.createElement("div")
    popupZoomer.classList.add("popup-zoomer")
    popupZoomer.style.width = "250px"
    popupZoomer.style.backgroundColor = "#333333"
    this.zoomer = popupZoomer
    popup.appendChild(popupZoomer)

    const title = document.createElement("div")
    title.innerText = "Song Column"
    title.classList.add("popup-title")
    this.title = title
    popupZoomer.appendChild(title)

    const desc = document.createElement("div")
    desc.classList.add("popup-desc")
    this.desc = desc
    popupZoomer.appendChild(desc)

    const popupOptions = document.createElement("div")
    popupOptions.style.display = "flex"
    popupOptions.style.gap = "4px"
    popupOptions.style.alignItems = "center"
    popupOptions.style.flexDirection = "column"
    popupOptions.style.marginTop = "10px"
    popupOptions.style.fontSize = "12px"

    const convertText = document.createElement("div")
    const convertBtnOne = document.createElement("button")
    const convertBtnTwo = document.createElement("button")

    this.convertBtnOne = convertBtnOne
    this.convertBtnTwo = convertBtnTwo
    this.convertText = convertText

    popupOptions.replaceChildren(convertText, convertBtnOne, convertBtnTwo)

    popupZoomer.appendChild(popupOptions)

    const editText = document.createElement("div")
    editText.innerText = "click to edit"
    editText.style.marginTop = "4px"
    editText.style.height = "10px"
    popupZoomer.appendChild(editText)
    editText.classList.add("popup-desc")
    this.editText = editText

    return popup
  }

  close() {
    this.persistent = false
    EventHandler.off("timingModified", this.onTimingChange)
    window.removeEventListener("click", this.clickOutside)
    clearInterval(this.moveInterval)
    this.popup.classList.add("exiting")
    setTimeout(() => this.popup.remove(), 200)
    TimingColumnPopup.activePopup = undefined
  }

  select() {
    this.persistent = true
    this.zoomer.classList.add("selected")
    this.editText.style.transform = "scale(0)"
    this.editText.style.height = "0px"
    setTimeout(() => window.addEventListener("click", this.clickOutside), 200)
  }

  updateValues() {
    const isChart = this.timingData.isPropertyChartSpecific(this.type)
    this.title.innerText = isChart
      ? "Chart Timing Column"
      : "Song Timing Column"
    this.desc.innerText = isChart
      ? "Events in this column are only used by this difficulty"
      : "Events in this column are used by all difficulties (unless overridden)"
    this.convertText.innerText = isChart
      ? "Convert to song timing"
      : "Convert to chart timing"
    this.convertBtnOne.innerText = isChart
      ? "Copy chart events"
      : "Copy song events"
    this.convertBtnTwo.innerText = isChart
      ? "Delete chart events"
      : "Don't copy song events"
    this.convertBtnTwo.classList.toggle("delete", isChart)

    tippy(this.convertBtnOne, {
      content: isChart
        ? "Copies chart events from this column to song timing"
        : "Copies song events from this column to chart timing",
    })
    tippy(this.convertBtnTwo, {
      content: isChart
        ? "Reverts this column to the events in song timing, deleting any difficulty-specific events"
        : "Converts this column to chart timing without copying any song events",
    })

    // this.convertBtnOne.onclick = () => {
    //   this.timingData.getColumn(this.type).copyEvents(isChart)
    // }
  }
}
