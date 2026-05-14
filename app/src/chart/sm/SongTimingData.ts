import { Chart } from "./Chart"
import { ChartTimingData } from "./ChartTimingData"
import { Simfile } from "./Simfile"
import { TimingData } from "./TimingData"
import { TIMING_EVENT_NAMES, TimingEventType, TimingType } from "./TimingTypes"

export class SongTimingData extends TimingData {
  protected offset: number = 0
  protected chartTimingDatas: ChartTimingData[] = []
  protected sm

  constructor(simfile: Simfile) {
    super()
    this.sm = simfile
    TIMING_EVENT_NAMES.forEach(type => this.createColumn(type))
  }

  protected callListeners(
    modifiedEvents: { type: TimingEventType }[] = []
  ): void {
    this.sm.recalculateAllStats()
    super.callListeners(modifiedEvents)
  }

  createChartTimingData(chart: Chart) {
    const newData = new ChartTimingData(this, chart)
    this.chartTimingDatas.push(newData)
    return newData
  }

  /**
   * Return all events of a type in the song timing data. This will not include any chart-specific events.
   * If you want to respect chart-specific timing events, use `ChartTimingData.getColumn()` instead.
   */
  getColumn<Type extends TimingEventType>(type: Type) {
    return this.columns[type]!
  }

  /**
   * Returns the offset for the song timing data. This will not return the chart-specific offset if it exists.
   * If you want to get the effective offset for a chart, use `ChartTimingData.getOffset()` instead.
   * @returns
   */
  getOffset(): number {
    return this.offset
  }

  reloadCache(types: TimingType[] = []) {
    super.reloadCache(types)
    this.chartTimingDatas.forEach(data => data.reloadCache(types))
  }

  _setOffset(offset: number) {
    this.offset = offset
  }
}
