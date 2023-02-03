import { App } from "../App"
import { TIMING_WINDOW_DATA } from "../data/TimingDataWindowData"
import { Dropdown } from "../gui/element/Dropdown"
import { EventHandler } from "../util/EventHandler"
import { Window } from "./Window"

export class TimingDataWindow extends Window {
  app: App

  private lastBeat: number
  private songTiming = false
  private interval

  constructor(app: App) {
    super({
      title: "Edit Timing Data",
      width: 300,
      height: 340,
      disableClose: false,
      win_id: "timing_data",
      blocking: false,
    })
    this.app = app
    this.lastBeat = Math.round(this.app.chartManager.getBeat() * 1000) / 1000
    this.songTiming = !this.app.chartManager.chart!.timingData.isEmpty()
    this.initView(this.viewElement)
    this.interval = setInterval(() => {
      if (
        Math.round(this.app.chartManager.getBeat() * 1000) / 1000 !=
        this.lastBeat
      ) {
        this.lastBeat =
          Math.round(this.app.chartManager.getBeat() * 1000) / 1000
        this.setData(this.viewElement)
      }
    }, 17)
    EventHandler.on("timingModified", () => this.setData(this.viewElement))
  }

  onClose() {
    clearInterval(this.interval)
  }

  initView(viewElement: HTMLDivElement): void {
    viewElement.replaceChildren()
    viewElement.classList.add("timing-data")
    const padding = document.createElement("div")
    padding.classList.add("padding")
    const songLabel = document.createElement("div")
    songLabel.classList.add("label")
    songLabel.innerText = "Apply to"

    const item = Dropdown.create(
      ["All charts", "This chart"],
      this.songTiming ? "This chart" : "All charts"
    )
    item.onChange(value => {
      this.songTiming = value == "This chart"
    })
    padding.appendChild(songLabel)
    padding.appendChild(item.view)
    Object.values(TIMING_WINDOW_DATA).forEach(entry => {
      const label = document.createElement("div")
      label.classList.add("label")
      label.innerText = entry.title

      const item = entry.element.create(this.app, () => this.songTiming)

      padding.appendChild(label)
      padding.appendChild(item)
    })
    viewElement.appendChild(padding)
    this.setData(viewElement)
  }

  setData(viewElement: HTMLDivElement) {
    if (!this.app.chartManager.chart) return
    Object.values(TIMING_WINDOW_DATA).forEach((entry, index) => {
      const item = viewElement.children[0].children[index * 2 + 3]
      entry.element.update(
        item,
        this.app.chartManager.chart!.timingData,
        this.lastBeat
      )
    })
  }
}
