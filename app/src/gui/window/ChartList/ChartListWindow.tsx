import { useContext, useEffect, useState } from "react"
import {
  GameType,
  GameTypeRegistry,
} from "../../../chart/gameTypes/GameTypeRegistry"
import { Chart } from "../../../chart/sm/Chart"
import { EventHandler } from "../../../util/EventHandler"
import { DropdownInput } from "../../inputs/DropdownInput"
import { WindowContext, WindowData } from "../WindowManager"
import { ChartListDetails } from "./ChartListDetails"
import { ChartListItem } from "./ChartListItem"

export function ChartListWindowContent() {
  const windowData = useContext(WindowContext)
  const [gameType, setGameType] = useState<GameType>(
    GameTypeRegistry.getPriority()[0]
  )
  const [sm, setSm] = useState(windowData?.app.chartManager.loadedSM)
  const [charts, setCharts] = useState<Chart[]>([])
  const [selectedChart, setSelectedChart] = useState<Chart | null>(null)
  const [hoveredChart, setHoveredChart] = useState<Chart | null>(null)

  function loadCharts(game?: GameType) {
    if (!windowData) return
    const charts = windowData.app.chartManager.loadedSM?.getChartsByGameType(
      game?.id ?? gameType.id
    )
    if (charts) setCharts(charts)
    else setCharts([])
  }

  function getGameTypeString(gameType: GameType) {
    return (
      gameType.id +
      " (" +
      (windowData?.app.chartManager.loadedSM?.getChartsByGameType(gameType.id)
        .length ?? 0) +
      ") "
    )
  }

  function smLoaded() {
    setGameType(windowData!.app.chartManager.loadedChart?.gameType ?? gameType)
    setSm(windowData!.app.chartManager.loadedSM)
    loadCharts(windowData!.app.chartManager.loadedChart?.gameType ?? gameType)
  }

  function chartLoaded() {
    setSelectedChart(windowData!.app.chartManager.loadedChart ?? null)
    smLoaded()
  }

  function selectChart(chart: Chart | null) {
    if (!chart) {
      windowData!.app.chartManager.loadChart()
      const charts = windowData!.app.chartManager.loadedSM?.getChartsByGameType(
        gameType.id
      )
      if (charts && charts.length > 0) setSelectedChart(charts.at(-1)!)
      else setSelectedChart(null)
      return
    }
    windowData!.app.chartManager.loadChart(chart)
    setSelectedChart(chart)
  }

  useEffect(() => {
    loadCharts()
    setSelectedChart(windowData!.app.chartManager.loadedChart!)
    setGameType(windowData!.app.chartManager.loadedChart?.gameType ?? gameType)
    EventHandler.on("smLoadedAfter", smLoaded)
    EventHandler.on("chartLoaded", chartLoaded)
    return () => {
      EventHandler.off("smLoadedAfter", smLoaded)
      EventHandler.off("chartLoaded", chartLoaded)
    }
  }, [])

  return (
    <div className="flex-column-full">
      <div className="chart-view-type-wrapper">
        <div className="chart-view-type-label">Game Type:</div>
        <DropdownInput
          values={GameTypeRegistry.getPriority().map(gameType =>
            getGameTypeString(gameType)
          )}
          value={getGameTypeString(gameType)}
          onChange={value => {
            const gt =
              GameTypeRegistry.getGameType(value.split(" ")[0]) ?? gameType
            setGameType(gt)
            loadCharts(gt)
          }}
        />
      </div>
      <div className="chart-view-scroller">
        <div className="chart-list">
          {charts.map(chart => (
            <ChartListItem
              key={chart._id}
              chart={chart}
              selected={selectedChart === chart}
              onSelect={selectChart}
              onHover={() => setHoveredChart(chart)}
              onUnhover={() => setHoveredChart(null)}
            />
          ))}
          <div
            className="chart-list-item"
            onClick={() => {
              const newChart = new Chart(windowData!.app.chartManager.loadedSM!)
              newChart.gameType = gameType
              windowData!.app.chartManager.loadedSM!.addChart(newChart)
              windowData!.app.chartManager.loadChart(newChart)
              setSelectedChart(newChart)
            }}
          >
            <div className="title">+</div>
            <div className="chart-list-info">New Blank Chart</div>
          </div>
        </div>

        <div className="chart-info">
          {(hoveredChart ?? selectedChart) && (
            <ChartListDetails
              sm={sm!}
              chart={hoveredChart ?? selectedChart!}
              selectChart={selectChart}
              loadCharts={loadCharts}
            />
          )}
        </div>
      </div>
    </div>
  )
}

export function ChartListWindow(): WindowData {
  return {
    title: "Chart List",
    width: 500,
    height: 400,
    id: "chart_list",
    content: <ChartListWindowContent />,
  }
}
