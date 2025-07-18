import { TechBox } from "../../chart/component/edit/TechErrorIndicators"
import { Chart } from "../../chart/sm/Chart"
import {
  TECH_ERROR_DESCRIPTIONS,
  TechErrors,
} from "../../chart/stats/parity/ParityDataTypes"
import { EventHandler } from "../../util/EventHandler"
import { Popup, PopupOptions } from "./Popup"

interface TechErrorPopupOptions {
  box: TechBox
  beat: number
  error: TechErrors
  ignored: boolean
  chart: Chart
}

export class TechErrorPopup extends Popup {
  static options: TechErrorPopupOptions & PopupOptions
  static cachedError?: { beat: number; error: TechErrors }

  static editText: HTMLDivElement

  static onParityChange: () => void

  static open(options: TechErrorPopupOptions) {
    if (this.active) return
    this.cachedError = {
      beat: options.beat,
      error: options.error,
    }
    const ignored = options.chart.isErrorIgnored(
      this.cachedError.error,
      this.cachedError.beat
    )
    super._open({
      ...options,
      attach: options.box,
      title: TECH_ERROR_DESCRIPTIONS[options.error].title,
      description: TECH_ERROR_DESCRIPTIONS[options.error].description,
      width: 150,
      editable: false,
      cancelableOnOpen: false,
      background: ignored ? "#404040" : "#41031c",
      textColor: "#ffffff",
      options: [],
    })

    this.onParityChange = this.updateValues.bind(this)
    EventHandler.on("parityIgnoresModified", this.onParityChange)
    EventHandler.on("parityModified", this.onParityChange)
    this.updateValues()
  }
  static buildContent() {
    const editText = document.createElement("div")
    editText.innerText = "click to ignore"
    editText.style.marginTop = "4px"
    editText.style.height = "10px"
    editText.classList.add("popup-desc")
    this.editText = editText
    this.view!.appendChild(editText)
  }

  private static updateValues() {
    if (!this.active || !this.cachedError) return
    const ignored = this.options.chart.isErrorIgnored(
      this.cachedError.error,
      this.cachedError.beat
    )
    this.editText.innerText = ignored ? "click to unignore" : "click to ignore"
    this.view!.style.backgroundColor = ignored ? "#404040" : "#41031c"
  }

  static close() {
    if (!this.active) return
    super.close()
    EventHandler.off("parityIgnoresModified", this.onParityChange)
    EventHandler.off("parityModified", this.onParityChange)
    this.cachedError = undefined
  }

  static getError() {
    return this.cachedError
  }
}
