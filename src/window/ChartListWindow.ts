import { App } from "../App"
import { Chart } from "../chart/sm/Chart"
import { StepsType } from "../chart/sm/SimfileTypes"
import { Window } from "./Window"

type ChartListItem = HTMLDivElement & {
  chart: Chart
}

export class ChartListWindow extends Window {

  app: App
  stepsType: StepsType

  constructor(app: App, stepsType?: StepsType) {
    super({
      title: "Chart List", 
      width: 500,
      height: 400,
      win_id: "chart_list"
    })
    this.app = app
    this.stepsType = stepsType ?? this.app.options.chart.stepsType
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


    let charts = this.app.chartManager.sm?.charts[this.stepsType] ?? []
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
    this.loadChartDetails()
  }

  loadChartDetails() {
    
  }
}

