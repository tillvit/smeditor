import { App } from "../App"
import { GameType, GameTypeRegistry } from "../chart/gameTypes/GameTypeRegistry"
import { Chart } from "../chart/sm/Chart"
import { CHART_DIFFICULTIES } from "../chart/sm/ChartTypes"
import { CHART_PROPERTIES_DATA } from "../data/ChartListWindowData"
import { Dropdown } from "../gui/element/Dropdown"
import { ActionHistory } from "../util/ActionHistory"
import { EventHandler } from "../util/EventHandler"
import { clamp, isNumericKeyPress, safeParse } from "../util/Util"
import { ConfimationWindow } from "./ConfirmationWindow"
import { Window } from "./Window"

type ChartListItem = HTMLDivElement & {
  chart: Chart
}

export class ChartListWindow extends Window {
  app: App
  gameType: GameType

  private chartList?: HTMLDivElement
  private chartInfo?: HTMLDivElement
  private gameTypeDropdown?: Dropdown<string>
  private smLoadHandler = () => {
    this.gameTypeDropdown!.setItems(
      GameTypeRegistry.getPriority().map(gameType => {
        const charts = this.app.chartManager.loadedSM?.charts[gameType.id] ?? []
        return gameType.id + " (" + charts.length + ")"
      })
    )
    this.gameTypeDropdown!.setSelected(
      this.gameType.id +
        " (" +
        (this.app.chartManager.loadedSM?.charts[this.gameType.id] ?? [])
          .length +
        ") "
    )
    this.gameType = this.app.chartManager.loadedChart?.gameType ?? this.gameType
    this.loadCharts()
  }

  constructor(app: App, gameType?: GameType) {
    super({
      title: "Chart List",
      width: 500,
      height: 400,
      win_id: "chart_list",
    })
    this.app = app
    this.gameType =
      gameType ??
      app.chartManager.loadedChart?.gameType ??
      GameTypeRegistry.getPriority()[0]
    this.initView()
    EventHandler.on("smLoadedAfter", this.smLoadHandler)
  }

  initView() {
    this.viewElement.replaceChildren()

    const padding = document.createElement("div")
    padding.classList.add("padding")

    const gameTypeWrapper = document.createElement("div")
    gameTypeWrapper.classList.add("chart-view-type-wrapper")

    const gameTypeLabel = document.createElement("div")
    gameTypeLabel.classList.add("chart-view-type-label")
    gameTypeLabel.innerText = "Game Type:"

    this.gameTypeDropdown = Dropdown.create(
      GameTypeRegistry.getPriority().map(gameType => {
        const charts = this.app.chartManager.loadedSM?.charts[gameType.id] ?? []
        return gameType.id + " (" + charts.length + ")"
      }),
      this.gameType.id +
        " (" +
        (this.app.chartManager.loadedSM?.charts[this.gameType.id] ?? [])
          .length +
        ") "
    )
    this.gameTypeDropdown.onChange(value => {
      this.gameType =
        GameTypeRegistry.getGameType(value.split(" ")[0]) ?? this.gameType
      this.loadCharts()
    })
    gameTypeWrapper.appendChild(gameTypeLabel)
    gameTypeWrapper.appendChild(this.gameTypeDropdown.view)

    const scroller = document.createElement("div")
    scroller.classList.add("chart-view-scroller")
    padding.appendChild(gameTypeWrapper)
    padding.appendChild(scroller)

    this.chartList = document.createElement("div")
    this.chartList.classList.add("chart-list")

    this.chartInfo = document.createElement("div")
    this.chartInfo.classList.add("chart-info")

    scroller.appendChild(this.chartList)
    scroller.appendChild(this.chartInfo)

    this.viewElement.appendChild(padding)

    this.loadCharts()
  }

  onClose(): void {
    EventHandler.off("smLoadedAfter", this.smLoadHandler)
  }

  private loadCharts() {
    const charts =
      this.app.chartManager.loadedSM?.charts[this.gameType.id] ?? []
    const chartEls: HTMLElement[] = []
    this.gameTypeDropdown!.setItems(
      GameTypeRegistry.getPriority().map(gameType => {
        const charts = this.app.chartManager.loadedSM?.charts[gameType.id] ?? []
        return gameType.id + " (" + charts.length + ")"
      })
    )
    this.gameTypeDropdown!.setSelected(
      this.gameType.id +
        " (" +
        (this.app.chartManager.loadedSM?.charts[this.gameType.id] ?? [])
          .length +
        ") "
    )
    charts.forEach(chart => {
      const chartListItem = document.createElement("div") as ChartListItem
      chartListItem.classList.add("chart-list-item")
      chartListItem.chart = chart
      if (this.app.chartManager.loadedChart == chart)
        chartListItem.classList.add("selected")

      chartListItem.onclick = () => {
        if (chartListItem.chart == this.app.chartManager.loadedChart) return
        this.app.chartManager.loadChart(chartListItem.chart)
        this.chartList!.querySelectorAll(".selected").forEach(el =>
          el.classList.remove("selected")
        )
        chartListItem.classList.add("selected")
      }

      chartListItem.onmouseenter = () => {
        this.loadChartDetails(chartListItem.chart)
      }
      chartListItem.onmouseleave = () => {
        this.loadChartDetails()
      }

      const title = document.createElement("div")
      title.innerText = chart.meter + ""
      title.classList.add("title", chart.difficulty)
      const info = document.createElement("div")
      info.classList.add("chart-list-info")
      const credit = document.createElement("div")
      credit.innerText = chart.credit
      credit.classList.add("title", "chart-credit")
      const stepCount = document.createElement("div")
      stepCount.innerText = chart.notedata.length + ""
      stepCount.classList.add("title", "chart-step-count")

      info.appendChild(credit)
      info.appendChild(stepCount)

      // const actionTray = document.createElement("div")
      // actionTray.classList.add("flex-row", "action-tray")

      // const openIcon = document.createElement("img")
      // openIcon.src = Icons.MENU_VERTICAL
      // openIcon.classList.add("icon")

      // const copyIcon = document.createElement("img")
      // copyIcon.src = Icons.COPY
      // copyIcon.classList.add("icon")

      // const deleteIcon = document.createElement("img")
      // deleteIcon.src = Icons.TRASH
      // deleteIcon.classList.add("icon")

      // actionTray.appendChild(openIcon)
      // actionTray.appendChild(copyIcon)
      // actionTray.appendChild(deleteIcon)

      chartListItem.appendChild(title)
      chartListItem.appendChild(info)
      // chartListItem.appendChild(actionTray)
      chartEls.push(chartListItem)
    })
    const addChart = document.createElement("div")
    addChart.classList.add("chart-list-item")
    const addTitle = document.createElement("div")
    addTitle.innerText = "+"
    addTitle.classList.add("title")
    const addInfo = document.createElement("div")
    addInfo.classList.add("chart-list-info")
    addInfo.innerText = "New Blank Chart"
    addChart.appendChild(addTitle)
    addChart.appendChild(addInfo)
    addChart.onclick = () => {
      const newChart = new Chart(this.app.chartManager.loadedSM!)
      newChart.gameType = this.gameType
      this.app.chartManager.loadedSM!.addChart(newChart)
      this.app.chartManager.loadChart(newChart)
      this.loadCharts()
      // ActionHistory.instance.run({
      //   action: app => {
      //     app.chartManager.sm!.addChart(newChart)
      //     app.chartManager.loadChart(newChart)
      //     this.loadCharts()
      //   },
      //   undo: app => {
      //     app.chartManager.sm!.removeChart(newChart)
      //     app.chartManager.loadChart()
      //     this.loadCharts()
      //   },
      // })
    }

    this.chartList!.replaceChildren(...chartEls, addChart)
    this.loadChartDetails()
  }

  private loadChartDetails(chart?: Chart) {
    chart = chart ?? this.app.chartManager.loadedChart
    if (chart?.gameType.id != this.gameType.id) {
      this.chartInfo!.replaceChildren()
      return
    }
    if (!chart) return

    const sortDifficulties = () =>
      this.app.chartManager.loadedSM!.charts[chart!.gameType.id]!.sort(
        (a, b) => {
          if (
            CHART_DIFFICULTIES.indexOf(a.difficulty) ==
            CHART_DIFFICULTIES.indexOf(b.difficulty)
          )
            return a.meter - b.meter
          return (
            CHART_DIFFICULTIES.indexOf(a.difficulty) -
            CHART_DIFFICULTIES.indexOf(b.difficulty)
          )
        }
      )

    const main = document.createElement("div")
    main.classList.add("chart-info-main")
    const difficulty = Dropdown.create(CHART_DIFFICULTIES, chart.difficulty)
    difficulty.view.classList.add("no-border", "white")
    difficulty.onChange(value => {
      const lastVal = chart!.difficulty
      ActionHistory.instance.run({
        action: () => {
          chart!.difficulty = value
          sortDifficulties()
          this.loadCharts()
        },
        undo: () => {
          chart!.difficulty = lastVal
          sortDifficulties()
          this.loadCharts()
        },
      })
    })

    const meter = document.createElement("div")
    meter.spellcheck = false
    meter.contentEditable = "true"
    meter.classList.add("inlineEdit", "chart-meter")
    meter.onkeydown = ev => {
      if (!isNumericKeyPress(ev)) ev.preventDefault()
      if (ev.key == "Enter") meter.blur()
    }

    meter.onblur = () => {
      let value = Math.round(safeParse(meter.innerText))
      value = clamp(1, value, 2 ** 31 - 1)
      const lastVal = chart!.meter
      ActionHistory.instance.run({
        action: () => {
          chart!.meter = value
          sortDifficulties()
          this.loadCharts()
        },
        undo: () => {
          chart!.meter = lastVal
          sortDifficulties()
          this.loadCharts()
        },
      })
      meter.scrollLeft = 0
    }
    meter.innerText = chart.meter + ""

    const properties = document.createElement("div")
    properties.classList.add("chart-properties")

    main.appendChild(difficulty.view)
    main.appendChild(meter)

    Object.values(CHART_PROPERTIES_DATA).forEach(entry => {
      const label = document.createElement("div")
      label.classList.add("label")
      label.innerText = entry.title

      const item = entry.element(chart!, this.app)

      if (entry.title == "Artist") {
        item.addEventListener("blur", () => this.loadCharts())
      }

      properties.appendChild(label)
      properties.appendChild(item)
    })

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

    //Menu Button Options
    const menu_options = document.createElement("div")
    menu_options.classList.add("menu-options")

    const copyButton = document.createElement("button")
    copyButton.innerText = "Duplicate Chart"
    copyButton.onclick = () => {
      const newChart: Chart = Object.assign(
        Object.create(Object.getPrototypeOf(chart)),
        chart
      )
      newChart.setNotedata(
        chart!.notedata.map(note => chart!.computeNote(note)) ?? []
      )
      this.app.chartManager.loadedSM!.addChart(newChart)
      this.app.chartManager.loadChart(newChart)
      this.loadCharts()
      // ActionHistory.instance.run({
      //   action: app => {
      //     app.chartManager.sm!.addChart(newChart)
      //     app.chartManager.loadChart(newChart)
      //     this.loadCharts()
      //   },
      //   undo: app => {
      //     app.chartManager.sm!.removeChart(newChart)
      //     app.chartManager.loadChart()
      //     this.loadCharts()
      //   },
      // })
    }
    menu_options.append(copyButton)

    const deleteButton = document.createElement("button")
    deleteButton.innerText = "Delete Chart"
    deleteButton.onclick = () => {
      this.app.windowManager.openWindow(
        new ConfimationWindow(
          this.app,
          "Delete chart",
          "Are you sure you want to delete this chart?",
          [
            {
              type: "default",
              label: "Cancel",
            },
            {
              type: "delete",
              label: "Delete",
              callback: () => {
                if (this.app.chartManager.loadedSM!.removeChart(chart!)) {
                  this.app.chartManager.loadChart()
                  this.gameType =
                    this.app.chartManager.loadedChart?.gameType ?? this.gameType
                  this.loadCharts()
                }
              },
            },
          ]
        )
      )
    }
    deleteButton.classList.add("delete")
    menu_options.append(deleteButton)

    this.chartInfo!.replaceChildren(main, properties, nps, grid, menu_options)
  }
}
