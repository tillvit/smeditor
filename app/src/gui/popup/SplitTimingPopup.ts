import tippy from "tippy.js"
import { App } from "../../App"
import { TIMING_EVENT_COLORS } from "../../chart/component/timing/TimingAreaContainer"
import { TIMING_EVENT_NAMES, TimingEventType } from "../../chart/sm/TimingTypes"
import {
  SPLIT_OFFSET_DATA,
  SPLIT_TIMING_DATA,
} from "../../data/SplitTimingData"
import { blendColors } from "../../util/Color"
import { EventHandler } from "../../util/EventHandler"
import { Popup } from "./Popup"

export class SplitTimingPopup extends Popup {
  private static app: App
  private static timingGrid: HTMLDivElement
  private static onTimingChange = this.updateValues.bind(this)

  static open(app: App) {
    if (this.active) return
    this.app = app
    super._open({
      title: "Manage Split Timing",
      editable: false,
      attach: document.getElementById("split-timing")!,
      cancelableOnOpen: true,
      clickHandler: (event: MouseEvent) => {
        if (
          !this.popup?.contains(event.target as Node | null) &&
          !document
            .getElementById("split-timing")
            ?.contains(event.target as Node | null)
        )
          this.close()
      },
    })
    EventHandler.on("timingModified", this.onTimingChange)
  }

  static buildContent() {
    this.popup!.id = "split-timing"

    const timingGrid = document.createElement("div")
    timingGrid.classList.add("split-timing-grid")
    this.timingGrid = timingGrid

    const modifyGrid = this.buildModifyGrid()

    this.updateValues()

    this.view!.appendChild(timingGrid)
    this.view!.appendChild(modifyGrid)
  }

  static updateValues() {
    this.timingGrid.replaceChildren()

    // Build offset row
    const row = document.createElement("div")
    row.classList.add("split-timing-row")

    row.style.backgroundColor = "rgba(0, 0, 0, 0.3"

    const timingType = document.createElement("div")
    timingType.innerText = "OFFSET"

    const isChart =
      this.app.chartManager.loadedChart!.timingData.hasChartOffset()
    const type = isChart ? "chart" : "song"

    const columnType = document.createElement("div")
    columnType.innerText = isChart ? "C" : "S"

    tippy(columnType, {
      content: SPLIT_OFFSET_DATA[type].desc,
    })

    const buttonOne = document.createElement("button")
    buttonOne.innerText = SPLIT_OFFSET_DATA[type].buttonOne.text
    tippy(buttonOne, {
      content: SPLIT_OFFSET_DATA[type].buttonOne.tooltip,
    })
    buttonOne.onclick = () => {
      SPLIT_OFFSET_DATA[type].buttonOne.action(
        this.app.chartManager.loadedChart!.timingData
      )
    }

    const buttonTwo = document.createElement("button")
    buttonTwo.innerText = SPLIT_OFFSET_DATA[type].buttonTwo.text
    buttonTwo.classList.toggle("delete", isChart)
    tippy(buttonTwo, {
      content: SPLIT_OFFSET_DATA[type].buttonTwo.tooltip,
    })
    buttonTwo.onclick = () => {
      SPLIT_OFFSET_DATA[type].buttonTwo.action(
        this.app.chartManager.loadedChart!.timingData
      )
    }

    row.replaceChildren(timingType, columnType, buttonOne, buttonTwo)

    this.timingGrid.appendChild(row)

    // Build event rows
    for (const eventType of TIMING_EVENT_NAMES) {
      this.timingGrid.appendChild(this.buildRow(eventType))
    }

    return row
  }

  static buildRow(eventType: TimingEventType) {
    const row = document.createElement("div")
    row.classList.add("split-timing-row")

    row.style.backgroundColor = blendColors(
      TIMING_EVENT_COLORS[eventType].toString(16).padStart(6, "0"),
      "#333333",
      0.75
    )

    const timingType = document.createElement("div")
    timingType.innerText = eventType

    const isChart =
      this.app.chartManager.loadedChart!.timingData.isPropertyChartSpecific(
        eventType
      )
    const type = isChart ? "chart" : "song"

    const columnType = document.createElement("div")
    columnType.innerText = isChart ? "C" : "S"

    tippy(columnType, {
      content: SPLIT_TIMING_DATA[type].desc,
    })

    const buttonOne = document.createElement("button")
    buttonOne.innerText = SPLIT_TIMING_DATA[type].buttonOne.text
    tippy(buttonOne, {
      content: SPLIT_TIMING_DATA[type].buttonOne.tooltip,
    })
    buttonOne.onclick = () => {
      SPLIT_TIMING_DATA[type].buttonOne.action(
        this.app.chartManager.loadedChart!.timingData,
        eventType
      )
    }

    const buttonTwo = document.createElement("button")
    buttonTwo.innerText = SPLIT_TIMING_DATA[type].buttonTwo.text
    buttonTwo.classList.toggle("delete", isChart)
    tippy(buttonTwo, {
      content: SPLIT_TIMING_DATA[type].buttonTwo.tooltip,
    })
    buttonTwo.onclick = () => {
      SPLIT_TIMING_DATA[type].buttonTwo.action(
        this.app.chartManager.loadedChart!.timingData,
        eventType
      )
    }

    row.replaceChildren(timingType, columnType, buttonOne, buttonTwo)
    return row
  }

  static buildModifyGrid() {
    const modifyGrid = document.createElement("div")
    modifyGrid.classList.add("split-timing-grid")

    const chartRow = document.createElement("div")
    chartRow.classList.add("split-timing-modify-row")
    chartRow.style.backgroundColor = "rgba(0, 0, 0, 0.3"

    const chartTitle = document.createElement("div")
    chartTitle.innerText = "Convert all to chart timing"

    const chartButtonOne = document.createElement("button")
    chartButtonOne.innerText = SPLIT_TIMING_DATA["song"].buttonOne.text
    tippy(chartButtonOne, {
      content: SPLIT_TIMING_DATA["song"].buttonOne.tooltipAll,
    })
    chartButtonOne.onclick = () => {
      SPLIT_TIMING_DATA["song"].buttonOne.actionAll(
        this.app.chartManager.loadedChart!.timingData
      )
      chartButtonOne.blur()
    }

    const chartButtonTwo = document.createElement("button")
    chartButtonTwo.innerText = SPLIT_TIMING_DATA["song"].buttonTwo.text
    chartButtonTwo.classList.add("delete")
    tippy(chartButtonTwo, {
      content: SPLIT_TIMING_DATA["song"].buttonTwo.tooltipAll,
    })
    chartButtonTwo.onclick = () => {
      SPLIT_TIMING_DATA["song"].buttonTwo.actionAll(
        this.app.chartManager.loadedChart!.timingData
      )
      chartButtonTwo.blur()
    }

    chartRow.replaceChildren(chartTitle, chartButtonOne, chartButtonTwo)

    const songRow = document.createElement("div")
    songRow.classList.add("split-timing-modify-row")
    songRow.style.backgroundColor = "rgba(0, 0, 0, 0.3"

    const songTitle = document.createElement("div")
    songTitle.innerText = "Convert all to song timing"

    const songButtonOne = document.createElement("button")
    songButtonOne.innerText = SPLIT_TIMING_DATA["chart"].buttonOne.text
    tippy(songButtonOne, {
      content: SPLIT_TIMING_DATA["chart"].buttonOne.tooltipAll,
    })
    songButtonOne.onclick = () => {
      SPLIT_TIMING_DATA["chart"].buttonOne.actionAll(
        this.app.chartManager.loadedChart!.timingData
      )
      songButtonOne.blur()
    }

    const songButtonTwo = document.createElement("button")
    songButtonTwo.innerText = SPLIT_TIMING_DATA["chart"].buttonTwo.text
    tippy(songButtonTwo, {
      content: SPLIT_TIMING_DATA["chart"].buttonTwo.tooltipAll,
    })
    songButtonTwo.onclick = () => {
      SPLIT_TIMING_DATA["chart"].buttonTwo.actionAll(
        this.app.chartManager.loadedChart!.timingData
      )
      songButtonTwo.blur()
    }

    songRow.replaceChildren(songTitle, songButtonOne, songButtonTwo)

    modifyGrid.replaceChildren(chartRow, songRow)

    return modifyGrid
  }

  static close() {
    if (!this.popup || !this.active) return
    super.close()
  }
}
