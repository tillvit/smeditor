import { App } from "../App"
import { StepsType } from "../chart/sm/SimfileTypes"
import { Window } from "./Window"

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
    let chartListTitle = document.createElement("div")
    chartListTitle.classList.add("title")
    chartListTitle.innerText = "Chart List"
    let chartListScroller = document.createElement("div")
    chartListScroller.classList.add("chart-list-scroller")
  
    let chartInfo = document.createElement("div")
    chartInfo.classList.add("chart-info")
  
    wrapper.appendChild(chartList)
    wrapper.appendChild(chartInfo)
  
    chartList.appendChild(chartListTitle)
    chartList.appendChild(chartListScroller)
  
    let charts = this.app.chartManager.sm?.charts[this.stepsType] ?? []
    charts.forEach(chart => {
      let title = document.createElement("div")
      title.innerText = chart.difficulty + " " + chart.meter
      title.classList.add("title")
      chartListScroller.appendChild(title)
    });
    viewElement.appendChild(padding) 
  }
  
}
