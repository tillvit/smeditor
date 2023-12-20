import { Graphics } from "pixi.js"
import { EventHandler } from "../../util/EventHandler"
import { clamp } from "../../util/Math"
import { Options } from "../../util/Options"
import { NumberSpinner } from "../element/NumberSpinner"

export class SnapPopup {
  static active = false
  static persistent = false
  static popup?: HTMLDivElement

  private static clickOutside?: (e: MouseEvent) => void
  private static onSnapChange = this.updateValues.bind(this)
  private static moveInterval: NodeJS.Timeout
  private static updateInterval: NodeJS.Timeout
  private static editText: HTMLDivElement
  private static zoomer: HTMLDivElement
  private static divInput: NumberSpinner
  private static divLabel: HTMLDivElement
  private static beatInput: NumberSpinner

  static open(snapSprite: Graphics) {
    if (this.active) return
    this.popup = this.build()
    document.getElementById("popups")?.appendChild(this.popup)

    this.clickOutside = (event: MouseEvent) => {
      if (!this.popup?.contains(event.target as Node | null)) {
        this.persistent = false
        this.close()
      }
    }

    EventHandler.on("snapChanged", this.onSnapChange)

    // don't show until the position has been set
    this.popup.style.display = `none`
    setTimeout(() => this.movePosition(snapSprite))
    this.moveInterval = setInterval(() => this.movePosition(snapSprite), 150)
    this.active = true
  }

  private static movePosition(snapSprite: Graphics) {
    this.popup!.style.display = ``
    const point = snapSprite.getBounds()
    // will the box stay in bounds?
    const centerx = point.left + point.width / 2
    const width = 200
    const leftRestriction = width / 2 + 15
    const rightRestriction = window.innerWidth - width / 2 - 15
    this.popup!.style.left = `${clamp(
      centerx,
      leftRestriction,
      rightRestriction
    )}px`
    const centery = (point.top + point.height + 35) / 2
    this.popup!.style.top = `${point.top + point.height + 35}px`
    if (centery + this.popup!.clientHeight > window.innerHeight - 15) {
      this.popup!.style.transform = `translate(-50%, -100%)`
      this.popup!.style.top = `${point.top - point.height / 2}px`
    }
  }
  private static build() {
    const popup = document.createElement("div")
    popup.classList.add("popup")
    const popupZoomer = document.createElement("div")
    popupZoomer.classList.add("popup-zoomer")
    popupZoomer.style.width = "200px"
    popupZoomer.style.backgroundColor = "#333333"
    popup.appendChild(popupZoomer)
    this.zoomer = popupZoomer
    const title = document.createElement("div")
    title.innerText = "Snap Options"
    title.classList.add("popup-title")
    popupZoomer.appendChild(title)
    const flex = document.createElement("div")
    flex.classList.add("popup-flex")
    popupZoomer.appendChild(flex)

    const divRow = document.createElement("div")
    divRow.classList.add("popup-row")
    const divRowLeft = document.createElement("div")
    divRowLeft.innerText = "Snap to nearest "
    const divRowInput = NumberSpinner.create(
      Options.chart.snap == 0 ? 0 : Math.round(4 / Options.chart.snap),
      1,
      0,
      0,
      1000
    )
    divRowInput.onChange = value => {
      if (value === undefined) {
        this.updateValues()
        return
      }
      if (value == 0) Options.chart.snap = 0
      else Options.chart.snap = 4 / value
      this.updateValues()
    }
    const divRowRight = document.createElement("div")
    divRowRight.innerText = this.suffixSnap() + " note"
    divRow.replaceChildren(divRowLeft, divRowInput.view, divRowRight)

    const beatRow = document.createElement("div")
    beatRow.classList.add("popup-row")
    const beatRowLeft = document.createElement("div")
    beatRowLeft.innerText = "Snap every"
    const beatRowInput = NumberSpinner.create(Options.chart.snap, 0.001, 3, 0)
    beatRowInput.onChange = value => {
      if (value === undefined) {
        this.updateValues()
        return
      }
      if (value == 0) Options.chart.snap = 0
      else Options.chart.snap = value
      this.updateValues()
    }
    const beatRowRight = document.createElement("div")
    beatRowRight.innerText = " beats"
    beatRow.replaceChildren(beatRowLeft, beatRowInput.view, beatRowRight)

    flex.replaceChildren(divRow, beatRow)

    this.beatInput = beatRowInput
    this.divInput = divRowInput
    this.divLabel = divRowRight

    const editText = document.createElement("div")
    editText.innerText = "click to edit"
    editText.style.marginTop = "4px"
    editText.style.height = "10px"
    popupZoomer.appendChild(editText)
    editText.classList.add("popup-desc")
    this.editText = editText

    return popup
  }

  private static updateValues() {
    if (
      document.activeElement == this.divInput.input ||
      document.activeElement == this.beatInput.input
    )
      return
    this.divInput.setValue(
      Options.chart.snap == 0 ? 0 : Math.round(4 / Options.chart.snap)
    )
    this.divLabel.innerText = this.suffixSnap() + " note"

    this.beatInput.setValue(Options.chart.snap)
  }

  private static suffixSnap() {
    const div = Options.chart.snap == 0 ? 0 : Math.round(4 / Options.chart.snap)
    if (div % 10 == 1 && div != 11) return "st"
    if (div % 10 == 2 && div != 12) return "nd"
    if (div % 10 == 3 && div != 13) return "rd"
    return "th"
  }

  static close() {
    if (!this.popup || !this.active || this.persistent) return
    window.removeEventListener("click", this.clickOutside!, true)
    this.popup.classList.add("exiting")
    const popup = this.popup
    setTimeout(() => popup.remove(), 200)
    this.active = false
    this.persistent = false
    clearInterval(this.moveInterval)
    clearInterval(this.updateInterval)
    EventHandler.off("timingModified", this.onSnapChange)
  }

  static select() {
    this.persistent = true
    this.zoomer.classList.add("selected")
    this.editText.style.transform = "scale(0)"
    this.editText.style.height = "0px"
    setTimeout(
      () => window.addEventListener("click", this.clickOutside!, true),
      200
    )
  }
}
