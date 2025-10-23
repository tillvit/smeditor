import { useEffect, useState } from "react"
import { Chart } from "../../chart/sm/Chart"
import { ChartDifficulty } from "../../chart/sm/ChartTypes"
import { ChartStats } from "../../chart/stats/ChartStats"
import { EventHandler } from "../../util/EventHandler"

type ChartProps = {
  meter: number
  difficulty: ChartDifficulty
  credit: string
  stepCount: number
  name: string
  style: string
  description: string
  noteCounts: Record<string, number>
  music: string | undefined
  parity?: ChartStats["parity"]
}

// readonly chart details

export function useChart(chart: Chart): ChartProps {
  const [props, setProps] = useState<ChartProps>(getChartProps())

  function getChartProps(): ChartProps {
    return {
      meter: chart.meter,
      difficulty: chart.difficulty,
      credit: chart.credit,
      stepCount: chart.getNotedata().length,
      name: chart.chartName,
      style: chart.chartStyle,
      description: chart.description,
      noteCounts: chart.stats.noteCounts,
      music: chart.music,
      parity: chart.stats.parity,
    }
  }

  useEffect(() => {
    setProps(getChartProps())
    function onChartModified() {
      setProps(getChartProps())
    }
    EventHandler.on("chartModified", onChartModified)
    EventHandler.on("parityModified", onChartModified)
    return () => {
      EventHandler.off("chartModified", onChartModified)
      EventHandler.off("parityModified", onChartModified)
    }
  }, [chart])

  return props
}
