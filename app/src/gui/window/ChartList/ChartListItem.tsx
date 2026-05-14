import { Chart } from "../../../chart/sm/Chart"
import { useChart } from "../../hooks/ChartHook"

interface ChartListItemOptions {
  chart: Chart
  selected: boolean
  onSelect: (chart: Chart) => void
  onHover: () => void
  onUnhover: () => void
}

export function ChartListItem(props: ChartListItemOptions) {
  const chart = useChart(props.chart)

  return (
    <div
      className={`chart-list-item ${props.selected ? "selected" : ""}`}
      onClick={() => props.onSelect(props.chart)}
      onMouseEnter={() => props.onHover()}
      onMouseLeave={() => props.onUnhover()}
    >
      <div className={`title ${chart.difficulty}`}>{chart.meter}</div>
      <div className="chart-list-info">
        <div className="title chart-credit">{chart.credit}</div>
        <div className="title chart-step-count">{chart.stepCount}</div>
      </div>
    </div>
  )
}
