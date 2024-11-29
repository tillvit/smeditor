import { ActionHistory } from "../../util/ActionHistory"
import { EventHandler } from "../../util/EventHandler"
import { Chart } from "./Chart"
import { SimfileTimingData } from "./SimfileTimingData"
import { TimingData } from "./TimingData"
import {
  DeletableEvent,
  TIMING_EVENT_NAMES,
  TimingEvent,
  TimingEventType,
  TimingType,
} from "./TimingTypes"

export class ChartTimingData extends TimingData {
  readonly simfileTimingData: SimfileTimingData
  private readonly chart: Chart

  constructor(simfileTimingData: SimfileTimingData, chart: Chart) {
    super()
    this.simfileTimingData = simfileTimingData
    this.chart = chart
  }

  getColumn<Type extends TimingEventType>(type: Type) {
    return this.columns[type] ?? this.simfileTimingData.getColumn(type)
  }

  getOffset(): number {
    return this.offset ?? this.simfileTimingData.getOffset()
  }

  usesChartTiming(): boolean {
    return this.offset !== undefined || Object.values(this.columns).length > 0
  }

  hasChartOffset() {
    return this.offset !== undefined
  }

  isPropertyChartSpecific(type: TimingEventType): boolean {
    return type in this.columns
  }

  copyOffsetToSimfile() {
    if (this.offset === undefined) return
    const cachedOffset = this.offset
    const cachedSimfileOffset = this.simfileTimingData.getOffset()

    ActionHistory.instance.run({
      action: () => {
        this.simfileTimingData._setOffset(cachedOffset)
        this.offset = undefined

        this.simfileTimingData.reloadCache()
        EventHandler.emit("timingModified")
        EventHandler.emit("chartModified")
      },
      undo: () => {
        this.offset = cachedOffset
        this.simfileTimingData._setOffset(cachedSimfileOffset)

        this.simfileTimingData.reloadCache()
        EventHandler.emit("timingModified")
        EventHandler.emit("chartModified")
      },
    })
  }

  removeChartOffset() {
    if (this.offset === undefined) return
    const cachedOffset = this.offset
    ActionHistory.instance.run({
      action: () => {
        this.offset = undefined

        this.simfileTimingData.reloadCache()
        EventHandler.emit("timingModified")
        EventHandler.emit("chartModified")
      },
      undo: () => {
        this.offset = cachedOffset

        this.simfileTimingData.reloadCache()
        EventHandler.emit("timingModified")
        EventHandler.emit("chartModified")
      },
    })
  }

  copyAllToSimfile() {
    const cachedColumns = Object.fromEntries(
      Object.values(this.columns).map(col => [col.type, col])
    )
    const events = Object.values(cachedColumns)
      .map(c => c.events)
      .flat()

    const cachedOffset = this.offset
    const cachedSimfileOffset = this.simfileTimingData.getOffset()

    let results: ReturnType<TimingData["_insert"]>
    ActionHistory.instance.run({
      action: app => {
        TIMING_EVENT_NAMES.forEach(type => {
          delete this.columns[type]
        })

        results = this.simfileTimingData._insert(events)
        this.simfileTimingData._delete(results.errors)

        if (cachedOffset !== undefined) {
          this.simfileTimingData._setOffset(cachedOffset)
          this.offset = undefined
        }

        this.simfileTimingData.reloadCache()

        app.chartManager.clearSelections()

        EventHandler.emit("timingModified")
        EventHandler.emit("chartModified")
        EventHandler.emit("timeSigChanged")
      },
      undo: app => {
        this.simfileTimingData._insert(results.errors)
        this.simfileTimingData._delete(results.events)
        this.simfileTimingData._insert(results.insertConflicts)

        Object.assign(this.columns, cachedColumns)

        if (cachedOffset !== undefined) {
          this.offset = cachedOffset
          this.simfileTimingData._setOffset(cachedSimfileOffset)
        }

        this.simfileTimingData.reloadCache()
        app.chartManager.clearSelections()
        EventHandler.emit("timingModified")
        EventHandler.emit("chartModified")
        EventHandler.emit("timeSigChanged")
      },
    })
  }

  copyColumnsToSimfile(columns: TimingEventType[]) {
    const cachedColumns = Object.fromEntries(
      columns
        .map(type => this.columns[type])
        .filter(col => col !== undefined)
        .map(col => [col.type, col])
    )
    const events = Object.values(cachedColumns)
      .map(c => c.events)
      .flat()

    let results: ReturnType<TimingData["_insert"]>
    const hasTimeSig = columns.includes("TIMESIGNATURES")
    ActionHistory.instance.run({
      action: app => {
        columns.forEach(type => {
          delete this.columns[type]
        })

        results = this.simfileTimingData._insert(events)
        this.simfileTimingData._delete(results.errors)

        this.simfileTimingData.reloadCache()

        app.chartManager.clearSelections()

        EventHandler.emit("timingModified")
        EventHandler.emit("chartModified")
        if (hasTimeSig) EventHandler.emit("timeSigChanged")
      },
      undo: app => {
        this.simfileTimingData._insert(results.errors)
        this.simfileTimingData._delete(results.events)
        this.simfileTimingData._insert(results.insertConflicts)

        Object.assign(this.columns, cachedColumns)

        this.simfileTimingData.reloadCache()
        app.chartManager.clearSelections()
        EventHandler.emit("timingModified")
        EventHandler.emit("chartModified")
        if (hasTimeSig) EventHandler.emit("timeSigChanged")
      },
    })
  }

  copyColumnsFromSimfile(columns: TimingEventType[]) {
    const hasTimeSig = columns.includes("TIMESIGNATURES")
    ActionHistory.instance.run({
      action: app => {
        columns.forEach(type => {
          this.createColumn(type)
          Object.assign(
            this.columns[type]!,
            structuredClone(this.simfileTimingData.getColumn(type))
          )
        })

        this.simfileTimingData.reloadCache()

        app.chartManager.clearSelections()

        EventHandler.emit("timingModified")
        EventHandler.emit("chartModified")
        if (hasTimeSig) EventHandler.emit("timeSigChanged")
      },
      undo: app => {
        columns.forEach(type => {
          delete this.columns[type]
        })

        this.simfileTimingData.reloadCache()
        app.chartManager.clearSelections()
        EventHandler.emit("timingModified")
        EventHandler.emit("chartModified")
        if (hasTimeSig) EventHandler.emit("timeSigChanged")
      },
    })
  }

  copyAllFromSimfile() {
    const cachedColumns = Object.fromEntries(
      TIMING_EVENT_NAMES.map(type => [type, this.columns[type]])
    )
    const cachedOffset = this.offset
    ActionHistory.instance.run({
      action: app => {
        TIMING_EVENT_NAMES.forEach(type => {
          this.createColumn(type)
          Object.assign(
            this.columns[type]!,
            structuredClone(this.simfileTimingData.getColumn(type))
          )
        })

        this.simfileTimingData.reloadCache()
        this.offset = this.getOffset()

        app.chartManager.clearSelections()

        EventHandler.emit("timingModified")
        EventHandler.emit("chartModified")
        EventHandler.emit("timeSigChanged")
      },
      undo: app => {
        TIMING_EVENT_NAMES.forEach(type => {
          if (cachedColumns[type] && this.columns[type]) {
            Object.assign(this.columns[type], cachedColumns[type])
          } else {
            delete this.columns[type]
          }
        })

        this.offset = cachedOffset

        this.simfileTimingData.reloadCache()
        app.chartManager.clearSelections()
        EventHandler.emit("timingModified")
        EventHandler.emit("chartModified")
        EventHandler.emit("timeSigChanged")
      },
    })
  }

  createChartColumns(columns: TimingEventType[]) {
    const hasTimeSig = columns.includes("TIMESIGNATURES")
    ActionHistory.instance.run({
      action: app => {
        columns.forEach(type => {
          this.createColumn(type)
        })

        this.simfileTimingData.reloadCache()

        app.chartManager.clearSelections()

        EventHandler.emit("timingModified")
        EventHandler.emit("chartModified")
        if (hasTimeSig) EventHandler.emit("timeSigChanged")
      },
      undo: app => {
        columns.forEach(type => {
          delete this.columns[type]
        })

        this.simfileTimingData.reloadCache()
        app.chartManager.clearSelections()
        EventHandler.emit("timingModified")
        EventHandler.emit("chartModified")
        if (hasTimeSig) EventHandler.emit("timeSigChanged")
      },
    })
  }

  createEmptyData() {
    const missingColumns = TIMING_EVENT_NAMES.filter(
      type => !this.columns[type]
    )
    const missingOffset = !this.hasChartOffset()
    ActionHistory.instance.run({
      action: app => {
        missingColumns.forEach(type => {
          this.createColumn(type)
        })
        if (missingOffset) this.offset = 0

        this.simfileTimingData.reloadCache()

        app.chartManager.clearSelections()

        EventHandler.emit("timingModified")
        EventHandler.emit("chartModified")
        EventHandler.emit("timeSigChanged")
      },
      undo: app => {
        missingColumns.forEach(type => {
          delete this.columns[type]
        })
        if (missingOffset) this.offset = undefined

        this.simfileTimingData.reloadCache()
        app.chartManager.clearSelections()
        EventHandler.emit("timingModified")
        EventHandler.emit("chartModified")
        EventHandler.emit("timeSigChanged")
      },
    })
  }

  deleteColumns(columns: TimingEventType[]) {
    const cachedColumns = Object.fromEntries(
      columns
        .map(type => this.columns[type])
        .filter(col => col !== undefined)
        .map(col => [col.type, col])
    )

    const hasTimeSig = columns.includes("TIMESIGNATURES")
    ActionHistory.instance.run({
      action: app => {
        columns.forEach(type => {
          delete this.columns[type]
        })

        this.simfileTimingData.reloadCache()

        app.chartManager.clearSelections()

        EventHandler.emit("timingModified")
        EventHandler.emit("chartModified")
        if (hasTimeSig) EventHandler.emit("timeSigChanged")
      },
      undo: app => {
        Object.assign(this.columns, cachedColumns)

        this.simfileTimingData.reloadCache()
        app.chartManager.clearSelections()
        EventHandler.emit("timingModified")
        EventHandler.emit("chartModified")
        if (hasTimeSig) EventHandler.emit("timeSigChanged")
      },
    })
  }

  deleteAllChartSpecific() {
    const cachedColumns = Object.fromEntries(
      Object.values(this.columns).map(col => [col.type, col])
    )
    const cachedOffset = this.offset

    ActionHistory.instance.run({
      action: app => {
        TIMING_EVENT_NAMES.forEach(type => {
          delete this.columns[type]
        })
        this.offset = undefined

        this.simfileTimingData.reloadCache()

        app.chartManager.clearSelections()

        EventHandler.emit("timingModified")
        EventHandler.emit("chartModified")
        EventHandler.emit("timeSigChanged")
      },
      undo: app => {
        Object.assign(this.columns, cachedColumns)
        this.offset = cachedOffset

        this.simfileTimingData.reloadCache()
        app.chartManager.clearSelections()
        EventHandler.emit("timingModified")
        EventHandler.emit("chartModified")
        EventHandler.emit("timeSigChanged")
      },
    })
  }

  reloadCache(types: TimingType[] = []) {
    super.reloadCache(types)
    this.chart.recalculateNotes()
  }

  private splitSM<Type extends { type: TimingEventType }>(events: Type[]) {
    const smEvents: Type[] = []
    const chartEvents: Type[] = []
    events.forEach(event => {
      if (this.isPropertyChartSpecific(event.type)) {
        chartEvents.push(event)
      } else {
        smEvents.push(event)
      }
    })
    return { chartEvents, smEvents }
  }

  private splitSMPairs(events: [TimingEvent, TimingEvent][]) {
    const smEvents: [TimingEvent, TimingEvent][] = []
    const chartEvents: [TimingEvent, TimingEvent][] = []
    events.forEach(pair => {
      if (this.isPropertyChartSpecific(pair[0].type)) {
        chartEvents.push(pair)
      } else {
        smEvents.push(pair)
      }
    })
    return { chartEvents, smEvents }
  }

  insertMulti(events: TimingEvent[]): void {
    const { smEvents, chartEvents } = this.splitSM(events)

    let smResults: ReturnType<TimingData["_insert"]>
    let chartResults: ReturnType<TimingData["_insert"]>
    const hasTimeSig = events.find(event => event.type == "TIMESIGNATURES")
    ActionHistory.instance.run({
      action: app => {
        chartResults = this._insert(chartEvents)
        this._delete(chartResults.errors)

        smResults = this.simfileTimingData._insert(smEvents)
        this.simfileTimingData._delete(smResults.errors)

        this.simfileTimingData.reloadCache()

        app.chartManager.clearSelections()
        app.chartManager.setEventSelection(
          this.findEvents(chartResults.events).concat(
            this.simfileTimingData.findEvents(smResults.events)
          )
        )
        EventHandler.emit("timingModified")
        EventHandler.emit("chartModified")
        if (hasTimeSig) EventHandler.emit("timeSigChanged")
      },
      undo: app => {
        this.simfileTimingData._insert(smResults.errors)
        this.simfileTimingData._delete(smResults.events)
        this.simfileTimingData._insert(smResults.insertConflicts)

        this._insert(chartResults.errors)
        this._delete(chartResults.events)
        this._insert(chartResults.insertConflicts)

        this.simfileTimingData.reloadCache()
        app.chartManager.clearSelections()
        EventHandler.emit("timingModified")
        EventHandler.emit("chartModified")
        if (hasTimeSig) EventHandler.emit("timeSigChanged")
      },
    })
  }

  modifyMulti(events: [TimingEvent, TimingEvent][]): void {
    const { smEvents, chartEvents } = this.splitSMPairs(events)

    let smResults: ReturnType<TimingData["_modify"]>
    let chartResults: ReturnType<TimingData["_modify"]>

    const hasTimeSig = events.find(pair => pair[0].type == "TIMESIGNATURES")
    ActionHistory.instance.run({
      action: app => {
        chartResults = this._modify(chartEvents)
        this._delete(chartResults.errors)

        smResults = this.simfileTimingData._modify(smEvents)
        this.simfileTimingData._delete(smResults.errors)

        this.simfileTimingData.reloadCache()

        app.chartManager.clearSelections()
        app.chartManager.setEventSelection(
          this.findEvents(chartResults.newEvents).concat(
            this.simfileTimingData.findEvents(smResults.newEvents)
          )
        )
        EventHandler.emit("timingModified")
        EventHandler.emit("chartModified")
        if (hasTimeSig) EventHandler.emit("timeSigChanged")
      },
      undo: app => {
        this.simfileTimingData._insert(smResults.errors)
        this.simfileTimingData._delete(smResults.newEvents)
        this.simfileTimingData._insert(smResults.insertConflicts)
        this.simfileTimingData._insert(smResults.oldEvents)

        this._insert(chartResults.errors)
        this._delete(chartResults.newEvents)
        this._insert(chartResults.insertConflicts)
        this._insert(chartResults.oldEvents)

        this.simfileTimingData.reloadCache()

        app.chartManager.clearSelections()
        app.chartManager.setEventSelection(
          this.findEvents(chartResults.oldEvents).concat(
            this.simfileTimingData.findEvents(smResults.oldEvents)
          )
        )
        EventHandler.emit("timingModified")
        EventHandler.emit("chartModified")
        if (hasTimeSig) EventHandler.emit("timeSigChanged")
      },
    })
  }

  deleteMulti(events: DeletableEvent[]): void {
    const { smEvents, chartEvents } = this.splitSM(events)

    let chartResults: ReturnType<TimingData["_delete"]>
    let smResults: ReturnType<TimingData["_delete"]>
    const hasTimeSig = events.find(event => event.type == "TIMESIGNATURES")
    ActionHistory.instance.run({
      action: app => {
        chartResults = this._delete(chartEvents)
        this._delete(chartResults.errors)

        smResults = this.simfileTimingData._delete(smEvents)
        this.simfileTimingData._delete(smResults.errors)

        this.simfileTimingData.reloadCache()

        app.chartManager.clearSelections()
        EventHandler.emit("timingModified")
        EventHandler.emit("chartModified")
        if (hasTimeSig) EventHandler.emit("timeSigChanged")
      },
      undo: app => {
        this.simfileTimingData._insert(smResults.errors)
        this.simfileTimingData._insert(smResults.removedEvents)

        this._insert(chartResults.errors)
        this._insert(chartResults.removedEvents)

        this.simfileTimingData.reloadCache()

        app.chartManager.clearSelections()
        app.chartManager.setEventSelection(
          this.findEvents(chartResults.removedEvents).concat(
            this.simfileTimingData.findEvents(smResults.removedEvents)
          )
        )
        EventHandler.emit("timingModified")
        EventHandler.emit("chartModified")
        if (hasTimeSig) EventHandler.emit("timeSigChanged")
      },
    })
  }
}
