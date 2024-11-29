import { Chart } from "./Chart"
import { ChartTimingData } from "./ChartTimingData"
import { TimingData } from "./TimingData"
import { TIMING_EVENT_NAMES, TimingEventType, TimingType } from "./TimingTypes"

export class SongTimingData extends TimingData {
  protected offset: number = 0
  protected chartTimingDatas: ChartTimingData[] = []

  constructor() {
    super()
    TIMING_EVENT_NAMES.forEach(type => this.createColumn(type))
  }

  createChartTimingData(chart: Chart) {
    const newData = new ChartTimingData(this, chart)
    this.chartTimingDatas.push(newData)
    return newData
  }

  getColumn<Type extends TimingEventType>(type: Type) {
    return this.columns[type]!
  }

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
