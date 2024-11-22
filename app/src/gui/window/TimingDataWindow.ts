import { App } from "../../App"
import { TIMING_WINDOW_DATA } from "../../data/TimingDataWindowData"
import { EventHandler } from "../../util/EventHandler"
import { Window } from "./Window"

export class TimingDataWindow extends Window {
  app: App

  private lastBeat: number
  private readonly interval
  private changeHandler = () => this.setData()

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
    this.lastBeat = Math.round(this.app.chartManager.beat * 1000) / 1000
    this.initView()
    this.interval = setInterval(() => {
      if (
        Math.round(this.app.chartManager.beat * 1000) / 1000 !=
        this.lastBeat
      ) {
        this.lastBeat = Math.round(this.app.chartManager.beat * 1000) / 1000
        this.setData()
      }
    }, 17)
    EventHandler.on("timingModified", this.changeHandler)
    EventHandler.on("chartLoaded", this.changeHandler)
  }

  onClose() {
    EventHandler.off("timingModified", this.changeHandler)
    clearInterval(this.interval)
  }

  initView(): void {
    this.viewElement.replaceChildren()
    this.viewElement.classList.add("timing-data")
    const padding = document.createElement("div")
    padding.classList.add("padding")

    Object.values(TIMING_WINDOW_DATA).forEach(entry => {
      const label = document.createElement("div")
      label.classList.add("label")
      label.innerText = entry.title

      const item = entry.element.create(this.app)

      padding.appendChild(label)
      padding.appendChild(item)
    })
    this.viewElement.appendChild(padding)
    this.setData()
  }

  setData() {
    if (!this.app.chartManager.loadedChart) return
    Object.values(TIMING_WINDOW_DATA).forEach((entry, index) => {
      const item = this.viewElement.children[0].children[index * 2 + 1]
      entry.element.update(
        item,
        this.app.chartManager.loadedChart!.timingData,
        this.lastBeat
      )
    })
  }
}
