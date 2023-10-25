import { ActionHistory } from "../../util/ActionHistory"
import { EventHandler } from "../../util/EventHandler"
import { Chart } from "./Chart"
import { ChartTimingData } from "./ChartTimingData"
import { TimingData } from "./TimingData"
import {
  DeletableEvent,
  TIMING_EVENT_NAMES,
  TimingEvent,
  TimingEventType,
  TimingType,
} from "./TimingTypes"

export class SimfileTimingData extends TimingData {
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

  insert(events: TimingEvent[]): void {
    let results: ReturnType<TimingData["_insert"]>
    const hasTimeSig = events.find(event => event.type == "TIMESIGNATURES")
    ActionHistory.instance.run({
      action: app => {
        results = this._insert(events)
        this._delete(results.errors)
        this.reloadCache()
        app.chartManager.clearSelections()
        app.chartManager.setEventSelection(this.findEvents(results.events))
        EventHandler.emit("timingModified")
        EventHandler.emit("chartModified")
        if (hasTimeSig) EventHandler.emit("timeSigChanged")
      },
      undo: app => {
        this._insert(results.errors)
        this._delete(results.events)
        this._insert(results.insertConflicts)
        this.reloadCache()
        app.chartManager.clearSelections()
        EventHandler.emit("timingModified")
        EventHandler.emit("chartModified")
        if (hasTimeSig) EventHandler.emit("timeSigChanged")
      },
    })
  }

  modify(events: [TimingEvent, TimingEvent][]): void {
    let results: ReturnType<TimingData["_modify"]>
    const hasTimeSig = events.find(pair => pair[0].type == "TIMESIGNATURES")
    ActionHistory.instance.run({
      action: app => {
        results = this._modify(events)
        this._delete(results.errors)
        this.reloadCache()
        app.chartManager.clearSelections()
        app.chartManager.setEventSelection(this.findEvents(results.newEvents))
        EventHandler.emit("timingModified")
        EventHandler.emit("chartModified")
        if (hasTimeSig) EventHandler.emit("timeSigChanged")
      },
      undo: app => {
        this._insert(results.errors)
        this._delete(results.newEvents)
        this._insert(results.insertConflicts)
        this._insert(results.oldEvents)
        this.reloadCache()
        app.chartManager.clearSelections()
        app.chartManager.setEventSelection(this.findEvents(results.oldEvents))
        EventHandler.emit("timingModified")
        EventHandler.emit("chartModified")
        if (hasTimeSig) EventHandler.emit("timeSigChanged")
      },
    })
  }

  delete(events: DeletableEvent[]): void {
    let results: ReturnType<TimingData["_delete"]>
    const hasTimeSig = events.find(event => event.type == "TIMESIGNATURES")
    ActionHistory.instance.run({
      action: app => {
        results = this._delete(events)
        this._delete(results.errors)
        this.reloadCache()
        app.chartManager.clearSelections()
        EventHandler.emit("timingModified")
        EventHandler.emit("chartModified")
        if (hasTimeSig) EventHandler.emit("timeSigChanged")
      },
      undo: app => {
        this._insert(results.errors)
        this._insert(results.removedEvents)
        this.reloadCache()
        app.chartManager.clearSelections()
        app.chartManager.setEventSelection(
          this.findEvents(results.removedEvents)
        )
        EventHandler.emit("timingModified")
        EventHandler.emit("chartModified")
        if (hasTimeSig) EventHandler.emit("timeSigChanged")
      },
    })
  }
}
