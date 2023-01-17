import { App } from "../App"
import { Chart } from "../chart/sm/Chart"
import { CHART_DIFFICULTIES } from "../chart/sm/ChartTypes"
import { GameTypeRegistry } from "../chart/types/GameTypeRegistry"
import { Dropdown } from "../gui/Dropdown"
import { safeParse } from "../util/Util"
import { Window } from "./Window"

interface NewChartOption {
  title: string | ((chart: Chart, window: NewChartWindow) => string)
  element: (
    chart: Chart,
    window: NewChartWindow,
    update: () => void
  ) => HTMLElement
}

const FIELDS: NewChartOption[] = [
  {
    title: "Game Type",
    element: chart => {
      const dropdown = Dropdown.create(
        GameTypeRegistry.getPriority().map(type => type.id)
      )
      dropdown.setSelected(chart.gameType.id)
      dropdown.onChange(value => {
        chart.gameType = GameTypeRegistry.getGameType(value)!
      })
      return dropdown.view
    },
  },
  {
    title: "Difficulty",
    element: chart => {
      const container = document.createElement("div")
      container.classList.add("flex-row", "flex-column-gap", "flex-static")
      const dropdown = Dropdown.create(CHART_DIFFICULTIES)
      dropdown.onChange(value => {
        chart.difficulty = value
      })
      const input = document.createElement("input")
      input.classList.add("short", "right")
      input.type = "text"
      input.value = chart.meter + ""
      input.oninput = () => {
        input.value = input.value.replaceAll(/[^.0-9+-]/g, "")
      }
      input.onblur = () => {
        let num = Math.round(safeParse(input.value))
        if (num < 1) num = 1
        chart.meter = num
      }
      input.onkeydown = ev => {
        if (ev.key == "Enter") input.blur()
      }
      container.appendChild(dropdown.view)
      container.appendChild(input)
      return container
    },
  },
  {
    title: "Copy Steps",
    element: (_, window) => {
      const container = document.createElement("div")
      container.classList.add("flex-row", "flex-column-gap", "flex-static")
      const gameTypeDropdown = Dropdown.create([
        "Don't copy",
        ...GameTypeRegistry.getPriority()
          .map(
            gameType => window.app.chartManager.sm?.charts[gameType.id] ?? []
          )
          .filter(charts => charts.length > 0)
          .map(charts => charts[0].gameType.id + " (" + charts.length + ")"),
      ])
      const chartDropdown = Dropdown.create([] as Chart[])

      gameTypeDropdown.onChange(value => {
        if (value == "Don't copy") {
          window.copyChart = undefined
          chartDropdown.setItems([])
          return
        }
        const gameType = GameTypeRegistry.getGameType(value.split(" ")[0])!
        const charts = window.app.chartManager.sm?.charts[gameType.id] ?? []
        chartDropdown.setItems(charts)
        window.copyChart = charts[0]
      })

      chartDropdown.onChange(value => {
        window.copyChart = value
      })
      container.appendChild(gameTypeDropdown.view)
      container.appendChild(chartDropdown.view)
      return container
    },
  },
]
export class NewChartWindow extends Window {
  app: App
  chart: Chart
  copyChart?: Chart

  constructor(app: App) {
    super({
      title: "New Chart",
      width: 350,
      height: 160,
      disableClose: false,
      win_id: "new_chart",
      blocking: false,
    })
    this.app = app
    if (!app.chartManager.sm) {
      this.closeWindow()
      throw Error("No simfile loaded")
    }
    this.chart = new Chart(app.chartManager.sm)
    this.initView(this.viewElement)
    window.onmessage = message => {
      if (message.data == "smLoaded" && message.source == window) {
        this.closeWindow()
      }
    }
  }

  initView(viewElement: HTMLDivElement): void {
    viewElement.replaceChildren()
    viewElement.classList.add("options")
    const padding = document.createElement("div")
    padding.classList.add("padding", "flex-row-gap")
    FIELDS.forEach(field => {
      const container = document.createElement("div")
      container.classList.add("container", "flex-row")

      const label = document.createElement("div")
      label.classList.add("label", "flex-grow")

      const item = field.element(this.chart, this, () => {
        label.innerText =
          typeof field.title == "function"
            ? field.title(this.chart, this)
            : field.title
      })
      label.innerText =
        typeof field.title == "function"
          ? field.title(this.chart, this)
          : field.title

      container.appendChild(label)
      container.appendChild(item)

      padding.appendChild(container)
    })
    //Menu Button Options
    const menu_options = document.createElement("div")
    menu_options.classList.add("menu-options")

    const menu_options_left = document.createElement("div")
    menu_options_left.classList.add("menu-left")
    const menu_options_right = document.createElement("div")
    menu_options_right.classList.add("menu-right")
    menu_options.appendChild(menu_options_left)
    menu_options.appendChild(menu_options_right)

    const cancel = document.createElement("button")
    cancel.innerText = "Cancel"
    cancel.onclick = () => {
      this.closeWindow()
    }

    const select_btn = document.createElement("button")
    select_btn.innerText = "Create"
    select_btn.classList.add("confirm")
    select_btn.onclick = () => {
      this.chart.setNotedata(
        this.copyChart?.notedata
          .filter(note => note.col < this.chart.gameType.numCols)
          .map(note => this.chart.computeNote(note)) ?? []
      )
      this.app.chartManager.sm!.addChart(this.chart)
      this.app.chartManager.loadChart(this.chart)
      this.closeWindow()
    }
    menu_options_left.appendChild(cancel)
    menu_options_right.appendChild(select_btn)
    padding.appendChild(menu_options)
    viewElement.appendChild(padding)
  }
}
