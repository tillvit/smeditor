import { Container } from "pixi.js"
import { ChartTimingData } from "../../chart/sm/ChartTimingData"
import { TimingEvent, TimingEventType } from "../../chart/sm/TimingTypes"
import { EventHandler } from "../../util/EventHandler"
import { clamp } from "../../util/Math"

export class TimingTypePopup {
  static activePopup?: TimingTypePopup
  private button
  private type
  private timingData: ChartTimingData
  private readonly popup: HTMLDivElement
  private zoomer!: HTMLDivElement
  private editText!: HTMLDivElement
  private title!: HTMLDivElement
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
    TimingTypePopup.activePopup?.close()
    TimingTypePopup.activePopup = this
  }
  private movePosition() {
    const point = this.button.getBounds()
    // will the box stay in bounds?
    const centerx = point.left + point.width / 2
    const width = 150
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
    popupZoomer.style.width = "150px"
    popupZoomer.style.backgroundColor = "#333333"
    this.zoomer = popupZoomer
    popup.appendChild(popupZoomer)
    const title = document.createElement("div")
    title.innerText = "Song Column"
    title.classList.add("popup-title")
    this.title = title
    popupZoomer.appendChild(title)

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
    TimingTypePopup.activePopup = undefined
  }

  select() {
    this.persistent = true
    this.zoomer.classList.add("selected")
    this.editText.style.transform = "scale(0)"
    this.editText.style.height = "0px"
    setTimeout(() => window.addEventListener("click", this.clickOutside), 200)
  }

  updateValues() {
    this.title.innerText = this.timingData.isPropertyChartSpecific(this.type)
      ? "Chart Column"
      : "Song Column"
  }
}
