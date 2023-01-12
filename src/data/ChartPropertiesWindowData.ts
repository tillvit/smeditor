import { App } from "../App"
import { CHART_DIFFICULTIES } from "../chart/sm/ChartTypes"
import { Dropdown } from "../gui/Dropdown"
import { NumberSpinner } from "../gui/NumberSpinner"

type ChartPropertiesWindowData = {
  title: string
  element: (app: App) => HTMLElement
}

export const CHART_PROPERTIES_WINDOW_DATA: {
  [key: string]: ChartPropertiesWindowData
} = {
  type: {
    title: "Chart Type",
    element: app => {
      const chart = app.chartManager.chart!
      const container = document.createElement("div")
      container.classList.add("flex-row", "flex-column-gap", "flex-static")
      const dropdown = Dropdown.create([chart.gameType.id])
      dropdown.disabled = true
      container.appendChild(dropdown.view)
      return container
    },
  },
  difficulty: {
    title: "Difficulty",
    element: app => {
      const chart = app.chartManager.chart!
      const container = document.createElement("div")
      container.classList.add("flex-row", "flex-column-gap", "flex-static")
      const dropdown = Dropdown.create(CHART_DIFFICULTIES, chart.difficulty)
      dropdown.onChange(value => {
        chart.difficulty = value
      })
      const input = NumberSpinner.create(chart.meter, 1, 0, 1)
      input.input.classList.add("short", "right")
      input.onChange = value => {
        if (!value) {
          input.setValue(chart.meter)
          return
        }
        chart.meter = value
      }
      container.appendChild(dropdown.view)
      container.appendChild(input.view)
      return container
    },
  },
  credit: {
    title: "Chart Artist",
    element: app => {
      const chart = app.chartManager.chart!
      const input = document.createElement("input")
      input.type = "text"
      input.autocomplete = "off"
      input.spellcheck = false
      input.onkeydown = ev => {
        if (ev.key == "Enter") input.blur()
      }
      input.onblur = () => {
        chart.credit = input.value
      }
      input.value = chart.credit
      return input
    },
  },
  name: {
    title: "Chart Name",
    element: app => {
      const chart = app.chartManager.chart!
      const input = document.createElement("input")
      input.type = "text"
      input.autocomplete = "off"
      input.spellcheck = false
      input.onkeydown = ev => {
        if (ev.key == "Enter") input.blur()
      }
      input.onblur = () => {
        chart.chartName = input.value
      }
      input.value = chart.chartName
      return input
    },
  },
  description: {
    title: "Description",
    element: app => {
      const chart = app.chartManager.chart!
      const input = document.createElement("input")
      input.type = "text"
      input.autocomplete = "off"
      input.spellcheck = false
      input.onkeydown = ev => {
        if (ev.key == "Enter") input.blur()
      }
      input.onblur = () => {
        chart.description = input.value
      }
      input.value = chart.description
      return input
    },
  },
  style: {
    title: "Chart Style",
    element: app => {
      const chart = app.chartManager.chart!
      const input = document.createElement("input")
      input.type = "text"
      input.autocomplete = "off"
      input.spellcheck = false
      input.onkeydown = ev => {
        if (ev.key == "Enter") input.blur()
      }
      input.onblur = () => {
        chart.chartStyle = input.value
      }
      input.value = chart.chartStyle
      return input
    },
  },
}
