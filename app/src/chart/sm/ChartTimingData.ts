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

  /**
   * Return all events of a type for the chart. If there is chart-specific timing data for the type, this will return that. Otherwise, it will return the song timing data for the type.
   * @param type
   * @returns
   */
  getColumn<Type extends TimingEventType>(type: Type) {
    return this.columns[type] ?? this.songTimingData.getColumn(type)
  }

  /**
   * Returns the offset for the chart. If there is a chart-specific offset, this will return that. Otherwise, it will return the song offset.
   * @returns
   */
  getOffset(): number {
    return this.offset ?? this.songTimingData.getOffset()
  }

  /**
   * Returns true if there is any chart-specific timing data, including the offset and any timing event columns.
   * @returns
   */
  usesChartTiming(): boolean {
    return this.offset !== undefined || Object.values(this.columns).length > 0
  }

  hasChartOffset() {
    return this.offset !== undefined
  }

  /**
   * Returns whether the specified timing event type has a chart-specific column.
   * @param type
   * @returns
   */
  isPropertyChartSpecific(type: TimingEventType): boolean {
    return type in this.columns
  }

  /**
   * Copies the chart offset to the song timing data.
   * @returns
   */
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

  /**
   * Removes the chart offset, making the timing data use the song offset.
   * @returns
   */

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

  /**
   * Copies all chart-specific timing data into the song timing data, converting chart-specific columns into song-specific columns.
   * This will overwrite all timing data in the song timing data with the chart-specific timing data.
   */

  copyAllToSimfile() {
    const cachedColumns = structuredClone(this.columns)
    const events = Object.values(cachedColumns).flat()

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

  /**
   * Copies the specified columns from the chart timing data into the song timing data, converting the column to a song-specific column.
   * This will overwrite the events in the song timing data for the specified columns.
   * @param columns
   */

  copyColumnsToSimfile(columns: TimingEventType[]) {
    const cachedColumns = structuredClone(this.columns)
    const events = Object.values(cachedColumns).flat()

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

  /**
   * Copies the specified columns from the song timing data into the chart timing data, converting the column to a chart-specific column.
   * This will remove existing chart-specific timing data for the specified columns.
   * @param columns
   */

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

  /**
   * Copies all song timing data into the chart timing data. This will remove existing chart-specific timing data.
   */
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

  /**
   * Creates chart-specific columns for the specified timing event types, copying events from the song timing data.
   * @param columns
   */
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

  /**
   * Creates empty chart-specific columns for the specified timing event types.
   */
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

  /**
   * Deletes the specified columns from the chart timing data, converting the column to a song-specific column.
   * @param columns
   */
  deleteColumns(columns: TimingEventType[]) {
    const cachedColumns = structuredClone(this.columns)

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

  /**
   * Deletes all chart-specific timing data, including all chart-specific columns and the chart offset if it exists.
   */
  deleteAllChartSpecific() {
    const cachedColumns = structuredClone(this.columns)
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

  /**
   * Inserts timing events into the chart timing data.
   * Events will be inserted into the song timing data if their column type is not chart-specific,
   * and into the chart timing data if it is.
   * @param events The events to be inserted.
   */
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

  /**
   * Modifies timing events in the chart timing data.
   * @param events The events to be modified. Each event is represented as a pair, where the first element is the original event and the second element is the modified event.
   */
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

  /**
   * Deletes timing events from the chart timing data.
   * @param events The events to be deleted.
   */
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
