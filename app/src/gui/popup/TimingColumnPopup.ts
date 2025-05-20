import { Container } from "pixi.js"
import tippy from "tippy.js"
import { ChartTimingData } from "../../chart/sm/ChartTimingData"
import { TimingEvent, TimingEventType } from "../../chart/sm/TimingTypes"
import { SPLIT_TIMING_DATA } from "../../data/SplitTimingData"
import { EventHandler } from "../../util/EventHandler"
import { Popup, PopupOptions } from "./Popup"

interface TimingColumnPopupOptions {
  attach: Container
  type: TimingEventType
  timingData: ChartTimingData
}

export class TimingColumnPopup extends Popup {
  static options: TimingColumnPopupOptions & PopupOptions

  private static convertText: HTMLDivElement
  private static convertBtnOne: HTMLButtonElement
  private static convertBtnTwo: HTMLButtonElement
  private static readonly onTimingChange = this.updateValues.bind(this)

  onConfirm: (event: TimingEvent) => void = () => {}
  persistent = false

  static open(options: TimingColumnPopupOptions) {
    super._open({
      ...options,
      title: "Column",
      description: "",
      width: 255,
      editable: true,
      cancelableOnOpen: false,
    })
    EventHandler.on("timingModified", this.onTimingChange)
    this.updateValues()
  }

  static buildContent() {
    const popupOptions = document.createElement("div")
    popupOptions.style.display = "flex"
    popupOptions.style.gap = "0.25rem"
    popupOptions.style.alignItems = "center"
    popupOptions.style.flexDirection = "column"
    popupOptions.style.marginTop = "0.6rem"
    popupOptions.style.fontSize = "0.75rem"

    const convertText = document.createElement("div")
    const convertBtnOne = document.createElement("button")
    const convertBtnTwo = document.createElement("button")

    this.convertBtnOne = convertBtnOne
    this.convertBtnTwo = convertBtnTwo
    this.convertText = convertText

    popupOptions.replaceChildren(convertText, convertBtnOne, convertBtnTwo)

    this.view!.appendChild(popupOptions)
  }

  static close() {
    if (!this.popup || !this.active) return
    super.close()
    EventHandler.off("timingModified", this.onTimingChange)
  }

  static updateValues() {
    const isChart = this.options.timingData.isPropertyChartSpecific(
      this.options.type
    )
    const type = isChart ? "chart" : "song"
    this.title!.innerText = SPLIT_TIMING_DATA[type].title
    this.desc!.innerText = SPLIT_TIMING_DATA[type].desc
    this.convertText.innerText = SPLIT_TIMING_DATA[type].convertText
    this.convertBtnOne.innerText = SPLIT_TIMING_DATA[type].buttonOne.text
    this.convertBtnTwo.innerText = SPLIT_TIMING_DATA[type].buttonTwo.text
    this.convertBtnTwo.classList.toggle("delete", isChart)

    tippy(this.convertBtnOne, {
      content: SPLIT_TIMING_DATA[type].buttonOne.tooltip,
    })
    tippy(this.convertBtnTwo, {
      content: SPLIT_TIMING_DATA[type].buttonTwo.tooltip,
    })

    this.convertBtnOne.onclick = () => {
      SPLIT_TIMING_DATA[type].buttonOne.action(
        this.options.timingData,
        this.options.type
      )
      this.close()
    }

    this.convertBtnTwo.onclick = () => {
      SPLIT_TIMING_DATA[type].buttonTwo.action(
        this.options.timingData,
        this.options.type
      )
      this.close()
    }
  }
}
