import { App } from "../App"
import { Chart } from "../chart/sm/Chart"
import { GameType } from "../chart/types/GameTypeRegistry"
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
      height: 250,
      win_id: "chart_list"
    })
    this.app = app
    this.gameType = gameType ?? app.chartManager.chart!.gameType
    this.initView(this.viewElement)
  }

  initView(viewElement: HTMLDivElement) {
    viewElement.replaceChildren()

    let padding = document.createElement("div")
    padding.classList.add("padding")
    let wrapper = document.createElement("div")
    wrapper.classList.add("chart-view-wrapper")
    padding.appendChild(wrapper)

    let chartList = document.createElement("div")
    chartList.classList.add("chart-list")

    let chartInfo = document.createElement("div")
    chartInfo.classList.add("chart-info")

    wrapper.appendChild(chartList)
    wrapper.appendChild(chartInfo)


    let charts = this.app.chartManager.sm?.charts[this.gameType.id] ?? []
    charts.forEach(chart => {
      let chartListItem = document.createElement("div") as ChartListItem
      chartListItem.classList.add("chart-list-item")
      chartListItem.chart = chart
      if (this.app.chartManager.chart == chart) chartListItem.classList.add("selected")

      chartListItem.onclick = () => {
        if (chartListItem.chart == this.app.chartManager.chart) return
        this.app.chartManager.loadChart(chartListItem.chart)
        padding.querySelectorAll(".selected").forEach(el => el.classList.remove("selected"))
        chartListItem.classList.add("selected")
      }

      chartListItem.onmouseenter = () => {
        this.loadChartDetails(chartInfo, chartListItem.chart)
      }
      chartListItem.onmouseleave = () => {
        this.loadChartDetails(chartInfo)
      }

      let title = document.createElement("div")
      title.innerText = chart.difficulty + " " + chart.meter
      title.classList.add("title", chart.difficulty)
      let attributes = document.createElement("div")
      attributes.classList.add("chart-attributes")
      let credit = document.createElement("div")
      credit.innerText = chart.credit
      credit.classList.add("title", "chart-credit")
      let stepCount = document.createElement("div")
      stepCount.innerText = chart.notedata.length + ""
      stepCount.classList.add("title", "chart-step-count")

      attributes.appendChild(credit)
      attributes.appendChild(stepCount)

      chartListItem.appendChild(title)
      chartListItem.appendChild(attributes)
      chartList.appendChild(chartListItem)
    });


    viewElement.appendChild(padding) 
    this.loadChartDetails(chartInfo)
  }

  private loadChartDetails(chartInfo: HTMLDivElement, chart?: Chart) {
    chart = chart ?? this.app.chartManager.chart!
    if (!chart) return
    let main = document.createElement("div")
    main.classList.add("chart-info-main")
    let difficulty = document.createElement("div")
    difficulty.innerText = chart.difficulty
    difficulty.classList.add("title", "chart-difficulty")
    let meter = document.createElement("div")
    meter.innerText = chart.meter + ""
    meter.classList.add("title", "chart-meter")

    main.appendChild(difficulty)
    main.appendChild(meter)

    let credit = document.createElement("div")
    credit.innerText = chart.credit
    credit.classList.add("title", "chart-credit")

    let notedataStats = chart.getNotedataStats()

    let grid = document.createElement("div")
    grid.classList.add("chart-info-grid")
    Object.entries(notedataStats.counts).forEach(entry => {
      let item = document.createElement("div")
      item.classList.add("chart-info-grid-item")
      let label = document.createElement("div")
      label.innerText = entry[0]
      label.classList.add("title", "chart-info-grid-label")
      let count = document.createElement("div")
      count.innerText = entry[1] + ""
      count.classList.add("title", "chart-info-grid-count")
      item.appendChild(label)
      item.appendChild(count)
      grid.appendChild(item)
    })

    chartInfo.replaceChildren(main,credit,grid)
  }
}

