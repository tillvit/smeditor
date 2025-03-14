import { Graphics } from "pixi.js"
import { EventHandler } from "../../util/EventHandler"
import { Options } from "../../util/Options"
import { NumberSpinner } from "../element/NumberSpinner"
import { Popup } from "./Popup"

export class SnapPopup extends Popup {
  private static onSnapChange = this.updateValues.bind(this)
  private static divInput: NumberSpinner
  private static divLabel: HTMLDivElement
  private static beatInput: NumberSpinner

  static open(snapSprite: Graphics) {
    if (this.active) return
    super._open({
      attach: snapSprite,
      title: "Snap Options",
      width: 200,
      editable: true,
      cancelableOnOpen: false,
    })
    EventHandler.on("snapChanged", this.onSnapChange)
  }

  static buildContent() {
    const flex = document.createElement("div")
    flex.classList.add("popup-flex")
    this.view!.appendChild(flex)

    const divRow = document.createElement("div")
    divRow.classList.add("popup-row")
    const divRowLeft = document.createElement("div")
    divRowLeft.innerText = "Snap to nearest "
    const divRowInput = NumberSpinner.create({
      value: Options.chart.snap == 0 ? 0 : Math.round(4 / Options.chart.snap),
      step: 1,
      precision: 0,
      min: 0,
      max: 1000,
    })
    divRowInput.onchange = value => {
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
    const beatRowInput = NumberSpinner.create({
      value: Options.chart.snap,
      step: 0.001,
      precision: 3,
      min: 0,
    })
    beatRowInput.onchange = value => {
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
  }

  private static updateValues() {
    if (
      document.activeElement == this.divInput.input ||
      document.activeElement == this.beatInput.input
    )
      return
    this.divInput.value =
      Options.chart.snap == 0 ? 0 : Math.round(4 / Options.chart.snap)
    this.divLabel.innerText = this.suffixSnap() + " note"

    this.beatInput.value = Options.chart.snap
  }

  private static suffixSnap() {
    const div = Options.chart.snap == 0 ? 0 : Math.round(4 / Options.chart.snap)
    if (div % 10 == 1 && div != 11) return "st"
    if (div % 10 == 2 && div != 12) return "nd"
    if (div % 10 == 3 && div != 13) return "rd"
    return "th"
  }

  static close() {
    if (!this.popup || !this.active) return
    super.close()
    EventHandler.off("timingModified", this.onSnapChange)
  }
}
