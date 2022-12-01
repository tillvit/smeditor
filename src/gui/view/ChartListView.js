import { createWindow } from "../BaseWindow.js";

export function createChartListWindow() {
  let window = createWindow("Select a chart...", 500, 300, "chartList", true)
  makeChartListView(window)
  return window
}


function makeChartListView(view) {
  view.replaceChildren()
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

  sm.charts[options.chart.stepsType].forEach(chart => {
    let title = document.createElement("div")
    title.innerText = chart.difficulty + " " + chart.meter
    title.classList.add("title")
    chartListScroller.appendChild(title)
  });
  view.appendChild(padding)
}
