import { ActionHistory } from "../../util/ActionHistory"
import { EventHandler } from "../../util/EventHandler"
import { Chart } from "./Chart"
import { SongTimingData } from "./SongTimingData"
import { TimingData } from "./TimingData"
import {
  DeletableEvent,
  TIMING_EVENT_NAMES,
  TimingEvent,
  TimingEventType,
  TimingType,
} from "./TimingTypes"

export class ChartTimingData extends TimingData {
  readonly songTimingData: SongTimingData
  private readonly chart: Chart

  constructor(simfileTimingData: SongTimingData, chart: Chart) {
    super()
    this.songTimingData = simfileTimingData
    this.chart = chart
  }

  protected callListeners(
    modifiedEvents: { type: TimingEventType }[] = []
  ): void {
    this.chart.sm.recalculateAllStats()
    super.callListeners(modifiedEvents)
  }

  getColumn<Type extends TimingEventType>(type: Type) {
    return this.columns[type] ?? this.songTimingData.getColumn(type)
  }

  getOffset(): number {
    return this.offset ?? this.songTimingData.getOffset()
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
    const cachedSimfileOffset = this.songTimingData.getOffset()

    ActionHistory.instance.run({
      action: () => {
        this.songTimingData._setOffset(cachedOffset)
        this.offset = undefined

        this.songTimingData.reloadCache()
        this.callListeners()
      },
      undo: () => {
        this.offset = cachedOffset
        this.songTimingData._setOffset(cachedSimfileOffset)

        this.songTimingData.reloadCache()
        this.callListeners()
      },
    })
  }

  removeChartOffset() {
    if (this.offset === undefined) return
    const cachedOffset = this.offset
    ActionHistory.instance.run({
      action: () => {
        this.offset = undefined

        this.songTimingData.reloadCache()
        this.callListeners()
      },
      undo: () => {
        this.offset = cachedOffset

        this.songTimingData.reloadCache()
        this.callListeners()
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
    const cachedSimfileOffset = this.songTimingData.getOffset()

    let results: ReturnType<TimingData["_insert"]>
    ActionHistory.instance.run({
      action: app => {
        TIMING_EVENT_NAMES.forEach(type => {
          delete this.columns[type]
        })

        results = this.songTimingData._insert(events)
        this.songTimingData._delete(results.errors)

        if (cachedOffset !== undefined) {
          this.songTimingData._setOffset(cachedOffset)
          this.offset = undefined
        }

        this.songTimingData.reloadCache()

        app?.chartManager.clearSelections()

        this.callListeners(events)
      },
      undo: app => {
        this.songTimingData._insert(results.errors)
        this.songTimingData._delete(results.events)
        this.songTimingData._insert(results.insertConflicts)

        Object.assign(this.columns, cachedColumns)

        if (cachedOffset !== undefined) {
          this.offset = cachedOffset
          this.songTimingData._setOffset(cachedSimfileOffset)
        }

        this.songTimingData.reloadCache()
        app?.chartManager.clearSelections()
        this.callListeners(events)
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
    ActionHistory.instance.run({
      action: app => {
        columns.forEach(type => {
          delete this.columns[type]
        })

        results = this.songTimingData._insert(events)
        this.songTimingData._delete(results.errors)

        this.songTimingData.reloadCache()

        app?.chartManager.clearSelections()

        this.callListeners(events)
      },
      undo: app => {
        this.songTimingData._insert(results.errors)
        this.songTimingData._delete(results.events)
        this.songTimingData._insert(results.insertConflicts)

        Object.assign(this.columns, cachedColumns)

        this.songTimingData.reloadCache()
        app?.chartManager.clearSelections()
        this.callListeners(events)
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
            structuredClone(this.songTimingData.getColumn(type))
          )
        })

        this.songTimingData.reloadCache()

        app?.chartManager.clearSelections()

        this.callListeners()
        if (hasTimeSig) EventHandler.emit("timeSigChanged")
      },
      undo: app => {
        columns.forEach(type => {
          delete this.columns[type]
        })

        this.songTimingData.reloadCache()
        app?.chartManager.clearSelections()
        this.callListeners()
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
            structuredClone(this.songTimingData.getColumn(type))
          )
        })

        this.songTimingData.reloadCache()
        this.offset = this.getOffset()

        app?.chartManager.clearSelections()

        this.callListeners()
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

        this.songTimingData.reloadCache()
        app?.chartManager.clearSelections()
        this.callListeners()
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

        this.songTimingData.reloadCache()

        app?.chartManager.clearSelections()

        this.callListeners()
        if (hasTimeSig) EventHandler.emit("timeSigChanged")
      },
      undo: app => {
        columns.forEach(type => {
          delete this.columns[type]
        })

        this.songTimingData.reloadCache()
        app?.chartManager.clearSelections()
        this.callListeners()
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

        this.songTimingData.reloadCache()

        app?.chartManager.clearSelections()

        this.callListeners()
        EventHandler.emit("timeSigChanged")
      },
      undo: app => {
        missingColumns.forEach(type => {
          delete this.columns[type]
        })
        if (missingOffset) this.offset = undefined

        this.songTimingData.reloadCache()
        app?.chartManager.clearSelections()
        this.callListeners()
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

        this.songTimingData.reloadCache()

        app?.chartManager.clearSelections()

        this.callListeners()
        if (hasTimeSig) EventHandler.emit("timeSigChanged")
      },
      undo: app => {
        Object.assign(this.columns, cachedColumns)

        this.songTimingData.reloadCache()
        app?.chartManager.clearSelections()
        this.callListeners()
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

        this.songTimingData.reloadCache()

        app?.chartManager.clearSelections()

        this.callListeners()
        EventHandler.emit("timeSigChanged")
      },
      undo: app => {
        Object.assign(this.columns, cachedColumns)
        this.offset = cachedOffset

        this.songTimingData.reloadCache()
        app?.chartManager.clearSelections()
        this.callListeners()
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

  insertColumnEvents(events: TimingEvent[]): void {
    const { smEvents, chartEvents } = this.splitSM(events)

    let smResults: ReturnType<TimingData["_insert"]>
    let chartResults: ReturnType<TimingData["_insert"]>
    ActionHistory.instance.run({
      action: app => {
        chartResults = this._insert(chartEvents)
        this._delete(chartResults.errors)

        smResults = this.songTimingData._insert(smEvents)
        this.songTimingData._delete(smResults.errors)

        this.songTimingData.reloadCache()

        app?.chartManager.clearSelections()
        app?.chartManager.setEventSelection(
          this.findEvents(chartResults.events).concat(
            this.songTimingData.findEvents(smResults.events)
          )
        )
        this.callListeners(events)
      },
      undo: app => {
        this.songTimingData._insert(smResults.errors)
        this.songTimingData._delete(smResults.events)
        this.songTimingData._insert(smResults.insertConflicts)

        this._insert(chartResults.errors)
        this._delete(chartResults.events)
        this._insert(chartResults.insertConflicts)

        this.songTimingData.reloadCache()
        app?.chartManager.clearSelections()
        this.callListeners(events)
      },
    })
  }

  modifyColumnEvents(events: [TimingEvent, TimingEvent][]): void {
    const { smEvents, chartEvents } = this.splitSMPairs(events)

    let smResults: ReturnType<TimingData["_modify"]>
    let chartResults: ReturnType<TimingData["_modify"]>

    ActionHistory.instance.run({
      action: app => {
        chartResults = this._modify(chartEvents)
        this._delete(chartResults.errors)

        smResults = this.songTimingData._modify(smEvents)
        this.songTimingData._delete(smResults.errors)

        this.songTimingData.reloadCache()

        app?.chartManager.clearSelections()
        app?.chartManager.setEventSelection(
          this.findEvents(chartResults.newEvents).concat(
            this.songTimingData.findEvents(smResults.newEvents)
          )
        )
        this.callListeners(events.map(pair => pair[0]))
      },
      undo: app => {
        this.songTimingData._insert(smResults.errors)
        this.songTimingData._delete(smResults.newEvents)
        this.songTimingData._insert(smResults.insertConflicts)
        this.songTimingData._insert(smResults.oldEvents)

        this._insert(chartResults.errors)
        this._delete(chartResults.newEvents)
        this._insert(chartResults.insertConflicts)
        this._insert(chartResults.oldEvents)

        this.songTimingData.reloadCache()

        app?.chartManager.clearSelections()
        app?.chartManager.setEventSelection(
          this.findEvents(chartResults.oldEvents).concat(
            this.songTimingData.findEvents(smResults.oldEvents)
          )
        )
        this.callListeners(events.map(pair => pair[0]))
      },
    })
  }

  deleteColumnEvents(events: DeletableEvent[]): void {
    const { smEvents, chartEvents } = this.splitSM(events)

    let chartResults: ReturnType<TimingData["_delete"]>
    let smResults: ReturnType<TimingData["_delete"]>
    ActionHistory.instance.run({
      action: app => {
        chartResults = this._delete(chartEvents)
        this._delete(chartResults.errors)

        smResults = this.songTimingData._delete(smEvents)
        this.songTimingData._delete(smResults.errors)

        this.songTimingData.reloadCache()

        app?.chartManager.clearSelections()
        this.callListeners(events)
      },
      undo: app => {
        this.songTimingData._insert(smResults.errors)
        this.songTimingData._insert(smResults.removedEvents)

        this._insert(chartResults.errors)
        this._insert(chartResults.removedEvents)

        this.songTimingData.reloadCache()

        app?.chartManager.clearSelections()
        app?.chartManager.setEventSelection(
          this.findEvents(chartResults.removedEvents).concat(
            this.songTimingData.findEvents(smResults.removedEvents)
          )
        )
        this.callListeners(events)
      },
    })
  }
}
