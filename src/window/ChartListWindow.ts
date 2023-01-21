import { App } from "../App"
import { Chart } from "../chart/sm/Chart"
import { GameType, GameTypeRegistry } from "../chart/types/GameTypeRegistry"
import { Dropdown } from "../gui/element/Dropdown"
import { EventHandler } from "../util/EventHandler"
import { Window } from "./Window"

type ChartListItem = HTMLDivElement & {
  chart: Chart
}

export class ChartListWindow extends Window {
  app: App
  gameType: GameType

  constructor(app: App, gameType?: GameType) {
    super({
      title: "Chart List",
      width: 500,
      height: 300,
      win_id: "chart_list",
    })
    this.app = app
    this.gameType = gameType ?? app.chartManager.chart!.gameType
    this.initView(this.viewElement)
  }

  initView(viewElement: HTMLDivElement) {
    viewElement.replaceChildren()

    const padding = document.createElement("div")
    padding.classList.add("padding")

    const gameTypeWrapper = document.createElement("div")
    gameTypeWrapper.classList.add("chart-view-type-wrapper")

    const gameTypeLabel = document.createElement("div")
    gameTypeLabel.classList.add("chart-view-type-label")
    gameTypeLabel.innerText = "Game Type:"

    const gameTypeDropdown = Dropdown.create(
      GameTypeRegistry.getPriority().map(gameType => {
        const charts = this.app.chartManager.sm?.charts[gameType.id] ?? []
        return gameType.id + " (" + charts.length + ")"
      }),
      this.gameType.id +
        " (" +
        (this.app.chartManager.sm?.charts[this.gameType.id] ?? []).length +
        ") "
    )
    gameTypeDropdown.onChange(value => {
      this.gameType =
        GameTypeRegistry.getGameType(value.split(" ")[0]) ?? this.gameType
      this.loadCharts(chartList, chartInfo)
    })
    EventHandler.on("smLoaded", () => {
      gameTypeDropdown.setItems(
        GameTypeRegistry.getPriority().map(gameType => {
          const charts = this.app.chartManager.sm?.charts[gameType.id] ?? []
          return gameType.id + " (" + charts.length + ")"
        })
      )
      gameTypeDropdown.setSelected(
        this.gameType.id +
          " (" +
          (this.app.chartManager.sm?.charts[this.gameType.id] ?? []).length +
          ") "
      )
      this.gameType = this.app.chartManager.chart!.gameType ?? this.gameType
      this.loadCharts(chartList, chartInfo)
    })
    gameTypeWrapper.appendChild(gameTypeLabel)
    gameTypeWrapper.appendChild(gameTypeDropdown.view)

    const scroller = document.createElement("div")
    scroller.classList.add("chart-view-scroller")
    padding.appendChild(gameTypeWrapper)
    padding.appendChild(scroller)

    const chartList = document.createElement("div")
    chartList.classList.add("chart-list")

    const chartInfo = document.createElement("div")
    chartInfo.classList.add("chart-info")

    scroller.appendChild(chartList)
    scroller.appendChild(chartInfo)

    viewElement.appendChild(padding)

    this.loadCharts(chartList, chartInfo)
  }

  private loadCharts(chartList: HTMLDivElement, chartInfo: HTMLDivElement) {
    const charts = this.app.chartManager.sm?.charts[this.gameType.id] ?? []
    const chartEls: HTMLElement[] = []
    charts.forEach(chart => {
      const chartListItem = document.createElement("div") as ChartListItem
      chartListItem.classList.add("chart-list-item")
      chartListItem.chart = chart
      if (this.app.chartManager.chart == chart)
        chartListItem.classList.add("selected")

      chartListItem.onclick = () => {
        if (chartListItem.chart == this.app.chartManager.chart) return
        this.app.chartManager.loadChart(chartListItem.chart)
        chartList
          .querySelectorAll(".selected")
          .forEach(el => el.classList.remove("selected"))
        chartListItem.classList.add("selected")
      }

      chartListItem.onmouseenter = () => {
        this.loadChartDetails(chartInfo, chartListItem.chart)
      }
      chartListItem.onmouseleave = () => {
        this.loadChartDetails(chartInfo)
      }

      const title = document.createElement("div")
      title.innerText = chart.difficulty + " " + chart.meter
      title.classList.add("title", chart.difficulty)
      const attributes = document.createElement("div")
      attributes.classList.add("chart-attributes")
      const credit = document.createElement("div")
      credit.innerText = chart.credit
      credit.classList.add("title", "chart-credit")
      const stepCount = document.createElement("div")
      stepCount.innerText = chart.notedata.length + ""
      stepCount.classList.add("title", "chart-step-count")

      attributes.appendChild(credit)
      attributes.appendChild(stepCount)

      chartListItem.appendChild(title)
      chartListItem.appendChild(attributes)
      chartEls.push(chartListItem)
    })
    chartList.replaceChildren(...chartEls)
    this.loadChartDetails(chartInfo)
  }

  private loadChartDetails(chartInfo: HTMLDivElement, chart?: Chart) {
    chart = chart ?? this.app.chartManager.chart!
    if (chart.gameType.id != this.gameType.id) {
      chartInfo.replaceChildren()
      return
    }
    if (!chart) return
    const main = document.createElement("div")
    main.classList.add("chart-info-main")
    const difficulty = document.createElement("div")
    difficulty.innerText = chart.difficulty
    difficulty.classList.add("title", "chart-difficulty")
    const meter = document.createElement("div")
    meter.innerText = chart.meter + ""
    meter.classList.add("title", "chart-meter")

    main.appendChild(difficulty)
    main.appendChild(meter)

    const credit = document.createElement("div")
    credit.innerText = chart.credit
    credit.classList.add("title", "chart-credit")

    const notedataStats = chart.getNotedataStats()

    const nps = document.createElement("div")
    nps.classList.add("chart-info-grid-item")
    const label = document.createElement("div")
    label.innerText = "Peak NPS"
    label.classList.add("title", "chart-info-grid-label")
    const count = document.createElement("div")
    count.innerText =
      Math.max(Math.max(...notedataStats.npsGraph), 0).toFixed(2) + ""
    count.classList.add("title", "chart-info-grid-count")
    nps.appendChild(label)
    nps.appendChild(count)

    const grid = document.createElement("div")
    grid.classList.add("chart-info-grid")
    Object.entries(notedataStats.counts).forEach(entry => {
      const item = document.createElement("div")
      item.classList.add("chart-info-grid-item")
      const label = document.createElement("div")
      label.innerText = entry[0]
      label.classList.add("title", "chart-info-grid-label")
      const count = document.createElement("div")
      count.innerText = entry[1] + ""
      count.classList.add("title", "chart-info-grid-count")
      item.appendChild(label)
      item.appendChild(count)
      grid.appendChild(item)
    })

    chartInfo.replaceChildren(main, credit, nps, grid)
  }
}
