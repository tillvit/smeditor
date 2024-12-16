import { ActionHistory } from "../../util/ActionHistory"
import { EventHandler } from "../../util/EventHandler"
import { clamp, roundDigit } from "../../util/Math"
import { Options } from "../../util/Options"
import { bsearch } from "../../util/Util"
import {
  AttackTimingEvent,
  BGChangeTimingEvent,
  BPMTimingEvent,
  BeatTimingCache,
  BeatTimingEvent,
  Cached,
  ColumnType,
  ComboTimingEvent,
  DelayTimingEvent,
  DeletableEvent,
  FGChangeTimingEvent,
  FakeTimingEvent,
  LabelTimingEvent,
  ScrollCacheTimingEvent,
  ScrollTimingEvent,
  SpeedTimingEvent,
  StopTimingEvent,
  TIMING_EVENT_NAMES,
  TickCountTimingEvent,
  TimeSignatureTimingEvent,
  TimingCache,
  TimingColumn,
  TimingEvent,
  TimingEventType,
  TimingType,
  WarpTimingEvent,
} from "./TimingTypes"

export abstract class TimingData {
  protected readonly _cache: TimingCache = {
    warpedBeats: new Map(),
    beatsToSeconds: new Map(),
  }
  protected columns: {
    [Type in TimingEventType]?: TimingColumn<
      Extract<TimingEvent, { type: Type }>
    >
  } = {}
  protected offset?: number

  private buildBeatTimingDataCache() {
    const cache: BeatTimingCache[] = []
    let events: BeatTimingEvent[] = this.getTimingData(
      "BPMS",
      "STOPS",
      "WARPS",
      "DELAYS"
    )
    events = events.concat(
      this.getTimingData("WARPS").map((event: WarpTimingEvent) => ({
        type: "WARP_DEST",
        beat: event.beat + event.value,
        value: event.value,
      }))
    )

    const ordering = ["WARP_DEST", "BPMS", "STOPS", "WARPS", "DELAYS"]
    events.sort((a, b) => {
      if (a.beat == b.beat) {
        return ordering.indexOf(a.type) - ordering.indexOf(b.type)
      }
      return a.beat - b.beat
    })

    const offset = this.getOffset()

    cache.push({
      beat: 0,
      secondBefore: -offset,
      secondOf: -offset,
      secondAfter: -offset,
      secondClamp: -offset,
      bpm: this.getTimingData("BPMS")[0]?.value ?? 120,
      warped: false,
    })
    for (const event of events) {
      if (cache.at(-1)?.beat != event.beat) {
        cache.at(-1)!.secondClamp = Math.max(
          Math.max(
            cache.at(-2)?.secondClamp ?? -offset,
            cache.at(-2)?.secondAfter ?? -offset
          ),
          cache.at(-1)!.secondBefore
        )

        let timeElapsed =
          ((event.beat - cache.at(-1)!.beat) * 60) / cache.at(-1)!.bpm
        if (cache.at(-1)!.warped) timeElapsed = 0

        cache.push({
          beat: event.beat,
          secondBefore: cache.at(-1)!.secondAfter + timeElapsed,
          secondOf: cache.at(-1)!.secondAfter + timeElapsed,
          secondAfter: cache.at(-1)!.secondAfter + timeElapsed,
          secondClamp: 0,
          bpm: cache.at(-1)!.bpm,
          warped: cache.at(-1)!.warped,
        })
      }
      if (event.type == "WARPS") cache.at(-1)!.warped = true
      if (event.type == "WARP_DEST") cache.at(-1)!.warped = false
      if (event.type == "BPMS") cache.at(-1)!.bpm = event.value
      if (event.type == "STOPS") {
        cache.at(-1)!.secondAfter += event.value
      }
      if (event.type == "DELAYS") {
        cache.at(-1)!.secondOf += event.value
        cache.at(-1)!.secondAfter += event.value
      }
    }

    cache.at(-1)!.secondClamp = Math.max(
      cache.at(-2)?.secondClamp ?? -offset,
      cache.at(-1)!.secondBefore
    )

    this._cache.beatTiming = cache
    this._cache.warpedBeats.clear()
    this._cache.beatsToSeconds.clear()
  }

  private buildEffectiveBeatTimingDataCache() {
    const cache: ScrollCacheTimingEvent[] = [...this.getTimingData("SCROLLS")]
    let effBeat = 0
    if (cache.length == 0) {
      this._cache.effectiveBeatTiming = []
      return
    }
    if (cache[0].beat != 0)
      cache.unshift({
        type: "SCROLLS",
        beat: 0,
        value: cache[0].value ?? 1,
      })
    effBeat = cache[0].beat
    for (let i = 0; i < cache.length - 1; i++) {
      const event = cache[i]
      const beats = cache[i + 1].beat - event.beat
      event.effectiveBeat = effBeat
      effBeat += event.value * beats
    }
    cache[cache.length - 1].effectiveBeat = effBeat
    this._cache.effectiveBeatTiming = cache
  }

  private buildMeasureTimingCache() {
    const timeSigs: TimeSignatureTimingEvent[] = [
      ...this.getTimingData("TIMESIGNATURES"),
    ]
    if (timeSigs.length == 0 || timeSigs[0].beat != 0) {
      timeSigs.unshift({ type: "TIMESIGNATURES", beat: 0, lower: 4, upper: 4 })
    }
    const cache = []
    let measure = 0
    for (let i = 0; i < timeSigs.length; i++) {
      const timeSig = timeSigs[i]
      const beatsPerMeasure = (4 / timeSig.lower) * timeSig.upper
      cache.push({
        measure,
        beat: timeSig.beat,
        beatsPerMeasure,
        divisionLength: 4 / timeSig.lower,
        numDivisions: timeSig.upper,
      })
      const deltaBeats = timeSigs[i + 1]?.beat - timeSig.beat
      measure += Math.ceil(deltaBeats / beatsPerMeasure)
    }
    this._cache.measureTiming = cache
  }

  private binarySearch<Type, Prop extends keyof Type>(
    cache: Type[],
    property: Prop,
    value: number
  ) {
    return cache[this.binarySearchIndex(cache, property, value)]
  }

  private binarySearchIndex<Type, Prop extends keyof Type>(
    cache: Type[],
    property: Prop,
    value: number
  ) {
    return bsearch(cache, value, a => a[property] as number)
  }

  private mergeColumns(
    columns: Cached<TimingEvent>[][]
  ): Cached<TimingEvent>[] {
    if (columns.length == 0) return []
    columns = columns.filter(column => column.length > 0)
    while (columns.length > 1) {
      const result = []
      for (let i = 0; i < columns.length; i += 2) {
        const a1 = columns[i]
        const a2 = columns[i + 1]
        const mergedPair = a2 ? this.mergeTwoColumns(a1, a2) : a1
        result.push(mergedPair)
      }
      columns = result
    }
    return columns[0] ?? []
  }

  private mergeTwoColumns(
    column1: Cached<TimingEvent>[],
    column2: Cached<TimingEvent>[]
  ): Cached<TimingEvent>[] {
    let i1 = 0
    let i2 = 0
    const result: Cached<TimingEvent>[] = []

    if (column1.length == 0 || column2.length == 0) {
      return column1.concat(column2)
    }

    while (true) {
      if (column1[i1].beat <= column2[i2].beat) {
        result.push(column1[i1])
        i1++
        if (i1 >= column1.length) return result.concat(column2.slice(i2))
      } else {
        result.push(column2[i2])
        i2++
        if (i2 >= column2.length) return result.concat(column1.slice(i1))
      }
    }
  }

  private splitEvents<Event extends DeletableEvent>(
    events: Event[]
  ): Map<TimingEventType, Event[]> {
    const out = new Map<TimingEventType, Event[]>()
    events.forEach(event => {
      if (!out.has(event.type)) out.set(event.type, [])
      out.get(event.type)!.push(event)
    })
    return out
  }

  private splitEventPairs(
    events: [TimingEvent, TimingEvent][]
  ): Map<TimingEventType, [TimingEvent, TimingEvent][]> {
    const out = new Map<TimingEventType, [TimingEvent, TimingEvent][]>()
    events.forEach(pair => {
      if (!out.has(pair[0].type)) out.set(pair[0].type, [])
      out.get(pair[0].type)!.push(pair)
    })
    return out
  }

  abstract getColumn<Type extends TimingEventType>(
    type: Type
  ): TimingColumn<Extract<TimingEvent, { type: Type }>>

  parse(type: TimingType, data: string): void {
    if (type == "OFFSET") {
      this.offset = parseFloat(data)
      return
    }
    if (!(type in this.columns)) this.createColumn(type)
    this.parseEvents(type, data)
  }

  abstract getOffset(): number

  setOffset(offset: number) {
    const oldOffset = this.offset
    ActionHistory.instance.run({
      action: () => {
        this.offset = offset
        this.reloadCache(["OFFSET"])
        EventHandler.emit("timingModified")
        EventHandler.emit("chartModified")
      },
      undo: () => {
        this.offset = oldOffset
        this.reloadCache(["OFFSET"])
        EventHandler.emit("timingModified")
        EventHandler.emit("chartModified")
      },
    })
  }

  serialize(fileType: "sm" | "ssc"): string {
    this.reloadCache()
    let str = ""
    if (this.offset) str += "#OFFSET:" + this.offset + ";\n"
    let types = [
      "BPMS",
      "STOPS",
      "WARPS",
      "DELAYS",
      "SPEEDS",
      "SCROLLS",
      "TICKCOUNTS",
      "TIMESIGNATURES",
      "LABELS",
      "COMBOS",
      "FAKES",
      "BGCHANGES",
      "FGCHANGES",
      "ATTACKS",
    ] satisfies TimingEventType[]
    if (fileType == "sm") {
      types = [
        "BPMS",
        "STOPS",
        "TIMESIGNATURES",
        "BGCHANGES",
        "FGCHANGES",
        "ATTACKS",
        // NotITG SM
        "SPEEDS",
        "SCROLLS",
      ]
    }
    for (const eventType of types) {
      if (!(eventType in this.columns)) continue
      str += this.formatProperty(fileType, eventType)
    }
    return str
  }

  private formatProperty(
    fileType: "sm" | "ssc",
    eventType: TimingEventType
  ): string {
    const precision = 3
    let str = ""
    const roundProp = (x: number) => roundDigit(x, precision).toFixed(precision)
    switch (eventType) {
      case "ATTACKS": {
        const events = this.columns[eventType]!.events
        str = events
          .map(
            event =>
              `TIME=${event.second}:${event.endType}=${event.value}:MODS=${event.mods}`
          )
          .join(":\n")
        break
      }
      case "BGCHANGES":
      case "FGCHANGES": {
        const events = this.columns[eventType]!.events
        str = events
          .map(event =>
            [
              event.beat,
              event.file,
              roundProp(event.updateRate),
              Number(event.crossFade),
              Number(event.stretchRewind),
              Number(event.stretchNoLoop),
              event.effect,
              event.file2,
              event.transition,
              event.color1,
              event.color2,
            ].join("=")
          )
          .join(",\n")
        break
      }
      case "BPMS":
      case "DELAYS":
      case "FAKES":
      case "SCROLLS":
      case "WARPS": {
        const events = this.columns[eventType]!.events
        str = events
          .map(event =>
            [roundProp(event.beat), roundProp(event.value)].join("=")
          )
          .join(",\n")
        break
      }
      case "STOPS": {
        let events: StopTimingEvent[] = this.columns[eventType]!.events
        if (fileType == "sm") {
          const warps = this.getTimingData("WARPS")
          const stopWarps: StopTimingEvent[] = warps.map(warp => {
            const bpm = this.getEventAtBeat("BPMS", warp.beat)!.value
            return {
              type: "STOPS",
              beat: warp.beat,
              value: (-60 / bpm) * warp.value,
            }
          })
          events = events.concat(stopWarps)
        }
        str = events
          .map(event =>
            [roundProp(event.beat), roundProp(event.value)].join("=")
          )
          .join(",\n")
        break
      }
      case "COMBOS": {
        const events = this.columns[eventType]!.events
        str = events
          .map(event => {
            if (event.hitMult == event.missMult) {
              return [roundProp(event.beat), event.hitMult].join("=")
            }
            return [roundProp(event.beat), event.hitMult, event.missMult].join(
              "="
            )
          })
          .join(",\n")
        break
      }
      case "LABELS":
      case "TICKCOUNTS": {
        const events = this.columns[eventType]!.events
        str = events
          .map(event => [roundProp(event.beat), event.value].join("="))
          .join(",\n")
        break
      }
      case "SPEEDS": {
        const events = this.getTimingData(eventType)
        str = events
          .map(event =>
            [
              roundProp(event.beat),
              roundProp(event.value),
              roundProp(event.delay),
              event.unit == "B" ? 0 : 1,
            ].join("=")
          )
          .join(",\n")
        break
      }
      case "TIMESIGNATURES": {
        const events = this.getTimingData(eventType)
        str = events
          .map(event =>
            [roundProp(event.beat), event.upper, event.lower].join("=")
          )
          .join(",\n")
        break
      }
    }
    if (str.includes(",")) str += "\n"
    return "#" + eventType + ":" + str + ";\n"
  }

  protected createColumn(type: TimingEventType) {
    this.columns[type] = {
      type,
      events: [],
    }
  }

  private getTime<Event extends DeletableEvent>(event: Event) {
    switch (event.type) {
      case "BPMS":
      case "STOPS":
      case "WARPS":
      case "DELAYS":
      case "LABELS":
      case "SPEEDS":
      case "SCROLLS":
      case "TICKCOUNTS":
      case "TIMESIGNATURES":
      case "COMBOS":
      case "FAKES":
      case "BGCHANGES":
      case "FGCHANGES":
        return event.beat!
      case "ATTACKS":
        return event.second!
    }
  }

  private isNullEvent(event: TimingEvent) {
    switch (event.type) {
      case "BPMS":
      case "SPEEDS":
      case "SCROLLS":
      case "TICKCOUNTS":
      case "TIMESIGNATURES":
      case "COMBOS":
        return false
      case "STOPS":
      case "WARPS":
      case "DELAYS":
      case "FAKES":
        return event.value == 0
      case "LABELS":
        return event.value == ""
      case "BGCHANGES":
      case "FGCHANGES":
        return event.file == ""
      case "ATTACKS":
        return event.mods == ""
    }
  }

  private isSimilar<Event extends TimingEvent>(eventA: Event, eventB: Event) {
    switch (eventA.type) {
      case "BPMS":
      case "LABELS":
      case "SPEEDS":
      case "SCROLLS":
      case "TICKCOUNTS":
        return eventA.type == eventB.type && eventA.value == eventB.value

      case "TIMESIGNATURES":
        return (
          eventA.type == eventB.type &&
          eventA.upper == eventB.upper &&
          eventA.lower == eventB.lower
        )
      case "COMBOS":
        return (
          eventA.type == eventB.type &&
          eventA.hitMult == eventB.hitMult &&
          eventA.missMult == eventB.missMult
        )
      case "STOPS":
      case "WARPS":
      case "DELAYS":
      case "FAKES":
      case "BGCHANGES":
      case "FGCHANGES":
      case "ATTACKS":
        return false
    }
  }

  private removeOverlapping<Event extends DeletableEvent>(
    events: Event[]
  ): Event[] {
    const out: Event[] = []
    let lastValue = null
    while (events.length > 0) {
      if (this.getTime(events[0]) != lastValue) {
        lastValue = this.getTime(events[0])
        out.push(events[0])
      }
      events.shift()
    }
    return out
  }

  private compareEvents<Event extends Cached<TimingEvent>>(
    partialEvent: DeletableEvent,
    event: Event
  ): boolean {
    const compare = (props: string[]) =>
      !props.some(
        prop =>
          partialEvent[prop as keyof DeletableEvent] !== undefined &&
          partialEvent[prop as keyof DeletableEvent] !==
            event[prop as keyof Event]
      )

    switch (partialEvent.type) {
      case "BPMS":
      case "STOPS":
      case "WARPS":
      case "DELAYS":
      case "SCROLLS":
      case "TICKCOUNTS":
      case "FAKES":
      case "LABELS":
        return compare(["type", "beat", "value"])
      case "SPEEDS":
        return compare(["type", "beat", "value", "unit", "delay"])
      case "TIMESIGNATURES":
        return compare(["type", "beat", "upper", "lower"])
      case "COMBOS":
        return compare(["type", "beat", "hitMult", "missMult"])
      case "ATTACKS":
        return compare(["type", "second", "mods", "endType", "value"])
      case "FGCHANGES":
      case "BGCHANGES":
        return compare([
          "type",
          "beat",
          "color1",
          "color2",
          "crossFade",
          "effect",
          "file1",
          "file2",
          "stretchNoLoop",
          "stretchRewind",
          "transition",
          "updateRate",
        ])
    }
  }

  protected insertEvents(type: TimingEventType, events: TimingEvent[]) {
    if (!this.columns[type]) this.createColumn(type)
    const column = this.columns[type]!
    const conflicts = []
    events = this.removeOverlapping(events)

    // Merge both two arrays
    let i = 0
    while (events[0] && column.events[i]) {
      const event = column.events[i]
      const eventsToInsert = []
      while (events[0] && this.getTime(event) >= this.getTime(events[0])) {
        eventsToInsert.push(events.shift()!)
      }
      if (eventsToInsert.length == 0) {
        i++
        continue
      }
      column.events.splice(
        i,
        0,
        ...(eventsToInsert as any) // cache the items later
      )
      i += eventsToInsert.length

      // Remove the original event if it shares the same second/beat as the last event
      if (this.getTime(eventsToInsert.at(-1)!) == this.getTime(event)) {
        conflicts.push(...column.events.splice(i, 1))
      } else {
        i++
      }
    }
    // Add the remaining items
    column.events.push(...(events as any))
    return conflicts
  }

  protected deleteEvents(type: TimingEventType, events: DeletableEvent[]) {
    if (!this.columns[type]) this.createColumn(type)
    const column = this.columns[type]!
    // Remove events that share the same second/beat
    events = this.removeOverlapping(events)

    const removedEvents: Cached<TimingEvent>[] = []

    let conflictIndex = 0
    let eventIndex = 0
    while (events[conflictIndex] && column.events[eventIndex]) {
      if (
        this.compareEvents(events[conflictIndex], column.events[eventIndex])
      ) {
        removedEvents.push(...column.events.splice(eventIndex, 1))
        conflictIndex++
      } else {
        eventIndex++
      }
    }
    return removedEvents
  }

  private getColumnType(type: TimingEventType): ColumnType {
    switch (type) {
      case "BPMS":
      case "LABELS":
      case "SPEEDS":
      case "SCROLLS":
      case "TICKCOUNTS":
      case "TIMESIGNATURES":
      case "COMBOS":
        return "continuing"
      case "STOPS":
      case "WARPS":
      case "DELAYS":
      case "FAKES":
      case "BGCHANGES":
      case "FGCHANGES":
      case "ATTACKS":
        return "instant"
    }
  }

  protected findConflictingEvents(type: TimingEventType): TimingEvent[] {
    const column = this.columns[type]
    if (!column) return []
    switch (this.getColumnType(column.type)) {
      case "continuing": {
        const conflicts = []

        // Find the first event that is not a null event
        let i = 0
        while (column.events[i] && this.isNullEvent(column.events[i])) {
          conflicts.push(column.events[i])
          i++
        }

        // Check conflicts with next events
        let lastEvent = column.events[i]
        i++
        for (; i < column.events.length; i++) {
          if (
            lastEvent.beat == column.events[i].beat ||
            this.isSimilar(lastEvent, column.events[i])
          ) {
            conflicts.push(column.events[i])
          } else {
            lastEvent = column.events[i]
          }
        }
        return conflicts
      }
      case "instant":
        return column.events.filter(event => this.isNullEvent(event))
    }
  }

  protected parseEvents<Type extends TimingEventType>(
    type: Type,
    data: string
  ) {
    switch (type) {
      case "BPMS":
      case "STOPS":
      case "WARPS":
      case "DELAYS":
      case "SCROLLS":
      case "FAKES":
        this.insertEvents(
          type,
          Array.from(data.matchAll(/(-?[\d.]+)=(-?[\d.]+)/g))
            .map<
              | BPMTimingEvent
              | StopTimingEvent
              | WarpTimingEvent
              | DelayTimingEvent
              | ScrollTimingEvent
              | FakeTimingEvent
            >(match => {
              return {
                type,
                beat: parseFloat(match[1]),
                value: parseFloat(match[2]),
              }
            })
            .sort((a, b) => a.beat - b.beat)
        )
        return
      case "TICKCOUNTS":
        this.insertEvents(
          type,
          Array.from(data.matchAll(/(-?[\d.]+)=(-?\d+)/g))
            .map<TickCountTimingEvent>(match => {
              return {
                type: "TICKCOUNTS",
                beat: parseFloat(match[1]),
                value: parseInt(match[2]),
              }
            })
            .sort((a, b) => a.beat - b.beat)
        )
        return
      case "LABELS":
        this.insertEvents(
          type,
          Array.from(
            data.matchAll(/((-?[\d.]+)=([^\n]+)=\d)|((-?[\d.]+)=([^\n,]+))/g)
          )
            .map<LabelTimingEvent>(match => {
              if (match[1] === undefined) {
                return {
                  type: "LABELS",
                  beat: parseFloat(match[5]),
                  value: match[6].trim(),
                }
              }
              return {
                type: "LABELS",
                beat: parseFloat(match[2]),
                value: match[3].trim(),
              }
            })
            .sort((a, b) => a.beat - b.beat)
        )
        return
      case "SPEEDS":
        this.insertEvents(
          type,
          Array.from(data.matchAll(/(-?[\d.]+)=(-?[\d.]+)=([\d.]+)=([01])/g))
            .map<SpeedTimingEvent>(match => {
              return {
                type: "SPEEDS",
                beat: parseFloat(match[1]),
                value: parseFloat(match[2]),
                delay: parseFloat(match[3]),
                unit: match[4].trim() == "0" ? "B" : "T",
              }
            })
            .sort((a, b) => a.beat - b.beat)
        )
        return
      case "TIMESIGNATURES":
        this.insertEvents(
          type,
          Array.from(data.matchAll(/(-?[\d.]+)=(\d+)=(\d+)/g))
            .map<TimeSignatureTimingEvent>(match => {
              return {
                type: "TIMESIGNATURES",
                beat: parseFloat(match[1]),
                upper: parseInt(match[2]),
                lower: parseInt(match[3]),
              }
            })
            .sort((a, b) => a.beat - b.beat)
        )
        return
      case "COMBOS":
        this.insertEvents(
          type,
          Array.from(data.matchAll(/(-?[\d.]+)=(\d+)=*(\d+)*/g))
            .map<ComboTimingEvent>(match => {
              return {
                type: "COMBOS",
                beat: parseFloat(match[1]),
                hitMult: parseInt(match[2]),
                missMult: parseInt(match[3] ?? match[2]),
              }
            })
            .sort((a, b) => a.beat - b.beat)
        )
        return
      case "ATTACKS":
        this.insertEvents(
          type,
          Array.from(
            data.matchAll(/TIME=(-?[\d.]+):(END|LEN)=(-?[\d.]+):MODS=([^:]+)/g)
          )
            .map<AttackTimingEvent>(match => {
              return {
                type: "ATTACKS",
                second: parseFloat(match[1]),
                endType: match[2].trim() as "END" | "LEN",
                value: parseFloat(match[3]),
                mods: match[4].trim(),
              }
            })
            .sort((a, b) => a.second - b.second)
        )
        return
      case "BGCHANGES":
      case "FGCHANGES":
        this.insertEvents(
          type,
          Array.from(
            data.matchAll(
              /(-?[\d.]+)=([^\n]+?)=(-?[\d.]+)=([01])=([01])=([01])=?([^\n=,]*)=?([^\n=,]*)=?([^\n=,]*)=?([^\n=,]*)=?([^\n=,]*)/g
            )
          )
            .map<BGChangeTimingEvent | FGChangeTimingEvent>(match => {
              return {
                type,
                beat: parseFloat(match[1]),
                file: match[2].trim(),
                updateRate: parseFloat(match[3]),
                crossFade: match[4].trim() == "1",
                stretchRewind: match[5].trim() == "1",
                stretchNoLoop: match[6].trim() == "1",
                effect: match[7].trim() ?? "",
                file2: match[8].trim() ?? "",
                transition: match[9].trim() ?? "",
                color1: match[10].trim() ?? "",
                color2: match[11].trim() ?? "",
              }
            })
            .sort((a, b) => a.beat - b.beat)
        )
    }
  }

  protected typeRequiresSSC(type: TimingEventType): boolean {
    switch (type) {
      case "BPMS":
      case "STOPS":
      case "ATTACKS":
      case "BGCHANGES":
      case "FGCHANGES":
      case "SPEEDS":
      case "SCROLLS":
        return false
      case "WARPS":
      case "DELAYS":
      case "LABELS":
      case "TICKCOUNTS":
      case "TIMESIGNATURES":
      case "COMBOS":
      case "FAKES":
        return !!this.columns[type] && this.columns[type].events.length > 0
    }
  }

  getDefaultEvent(type: TimingEventType, beat: number): Cached<TimingEvent> {
    switch (type) {
      case "BPMS":
        return {
          type,
          beat,
          value: 120,
          second: this.getSecondsFromBeat(beat),
        }
      case "STOPS":
      case "WARPS":
      case "FAKES":
        return {
          type,
          beat,
          value: 0,
          second: this.getSecondsFromBeat(beat),
        }
      case "DELAYS":
        return {
          type,
          beat,
          value: 0,
          second: this.getSecondsFromBeat(beat, "before"),
        }
      case "LABELS":
        return {
          type,
          beat,
          value: "",
          second: this.getSecondsFromBeat(beat),
        }
      case "SPEEDS":
        return {
          type,
          beat,
          value: 1,
          delay: 0,
          unit: "B",
          second: this.getSecondsFromBeat(beat),
        }
      case "SCROLLS":
        return {
          type,
          beat,
          value: 1,
          second: this.getSecondsFromBeat(beat),
        }
      case "TICKCOUNTS":
        return {
          type,
          beat,
          value: 4,
          second: this.getSecondsFromBeat(beat),
        }
      case "TIMESIGNATURES":
        return {
          type,
          beat,
          upper: 4,
          lower: 4,
          second: this.getSecondsFromBeat(beat),
        }
      case "COMBOS":
        return {
          type,
          beat,
          hitMult: 1,
          missMult: 1,
          second: this.getSecondsFromBeat(beat),
        }
      case "ATTACKS":
        return {
          type,
          beat,
          second: this.getSecondsFromBeat(beat),
          endType: "LEN",
          value: 1,
          mods: "",
        }
      case "BGCHANGES":
      case "FGCHANGES":
        return {
          type,
          beat,
          file: "",
          updateRate: 1,
          crossFade: false,
          stretchRewind: false,
          stretchNoLoop: false,
          effect: "",
          file2: "",
          transition: "",
          color1: "",
          color2: "",
          second: this.getSecondsFromBeat(beat),
        }
    }
  }

  getEventAtBeat<Type extends TimingEventType>(
    type: Type,
    beat: number,
    useDefault = true
  ): Cached<Extract<TimingEvent, { type: Type }>> | undefined {
    const column = this.getColumn(type)
    const event = column.events[bsearch(column.events, beat, a => a.beat)]
    if (!event) {
      switch (this.getColumnType(column.type)) {
        case "continuing":
          if (useDefault)
            return this.getDefaultEvent(column.type, 0) as Cached<
              Extract<TimingEvent, { type: Type }>
            >
          else return undefined
        case "instant":
          return undefined
      }
    }
    return event
  }

  protected updateEvents(type: TimingEventType) {
    const column = this.columns[type]
    if (!column) return
    switch (type) {
      case "DELAYS":
        column.events.forEach(
          event =>
            (event.second = this.getSecondsFromBeat(event.beat, "before"))
        )
        break
      case "ATTACKS":
        column.events.forEach(
          event => (event.beat = this.getBeatFromSeconds(event.second))
        )
        break
      case "BPMS":
      case "STOPS":
      case "WARPS":
      case "LABELS":
      case "SPEEDS":
      case "SCROLLS":
      case "TICKCOUNTS":
      case "TIMESIGNATURES":
      case "COMBOS":
      case "FAKES":
      case "BGCHANGES":
      case "FGCHANGES":
        column.events.forEach(
          event => (event.second = this.getSecondsFromBeat(event.beat))
        )
    }
  }

  // 1. insert the events
  // 2. remove errors
  // undo:
  // 1. insert errors
  // 2. insert insertConflicts
  // 3. remove events
  _insert(events: TimingEvent[]) {
    events = events.sort((a, b) => {
      if (a.type == "ATTACKS" && b.type == "ATTACKS") {
        return a.second - b.second
      }
      if (a.type != "ATTACKS" && b.type != "ATTACKS") {
        return a.beat - b.beat
      }
      return 0
    })
    const splitEvent = this.splitEvents(events)
    const insertConflicts: TimingEvent[] = []
    const errors: TimingEvent[] = []
    for (const [type, events] of splitEvent.entries()) {
      insertConflicts.push(...this.insertEvents(type, events))
      errors.push(...this.findConflictingEvents(type))
    }
    return {
      events,
      insertConflicts,
      errors,
    }
  }

  // 1. delete the events
  // 2. insert new events
  // 3. remove errors
  // undo:
  // 1. insert errors
  // 2. insert insertConflicts
  // 3. remove new events
  // 4. add old events
  _modify(events: [TimingEvent, TimingEvent][]) {
    const splitEventPairs = this.splitEventPairs(events)
    const insertConflicts: TimingEvent[] = []
    const errors: TimingEvent[] = []
    for (const [type, pair] of splitEventPairs.entries()) {
      this.deleteEvents(
        type,
        pair
          .map(pair => pair[0])
          .sort((a, b) => {
            if (a.type == "ATTACKS" && b.type == "ATTACKS") {
              return a.second - b.second
            }
            if (a.type != "ATTACKS" && b.type != "ATTACKS") {
              return a.beat - b.beat
            }
            return 0
          })
      )
      insertConflicts.push(
        ...this.insertEvents(
          type,
          pair
            .map(pair => pair[1])
            .sort((a, b) => {
              if (a.type == "ATTACKS" && b.type == "ATTACKS") {
                return a.second - b.second
              }
              if (a.type != "ATTACKS" && b.type != "ATTACKS") {
                return a.beat - b.beat
              }
              return 0
            })
        )
      )
      errors.push(...this.findConflictingEvents(type))
    }
    return {
      newEvents: events
        .map(pair => pair[1])
        .sort((a, b) => {
          if (a.type == "ATTACKS" && b.type == "ATTACKS") {
            return a.second - b.second
          }
          if (a.type != "ATTACKS" && b.type != "ATTACKS") {
            return a.beat - b.beat
          }
          return 0
        }),
      oldEvents: events
        .map(pair => pair[0])
        .sort((a, b) => {
          if (a.type == "ATTACKS" && b.type == "ATTACKS") {
            return a.second - b.second
          }
          if (a.type != "ATTACKS" && b.type != "ATTACKS") {
            return a.beat - b.beat
          }
          return 0
        }),
      insertConflicts,
      errors,
    }
  }

  // 1. delete the events
  // 2. remove errors
  // undo:
  // 1. insert errors
  // 2. insert events
  _delete(events: DeletableEvent[]) {
    events = events.sort((a, b) => {
      if (a.type == "ATTACKS" && b.type == "ATTACKS") {
        return a.second! - b.second!
      }
      if (a.type != "ATTACKS" && b.type != "ATTACKS") {
        return a.beat! - b.beat!
      }
      return 0
    })
    const splitEvent = this.splitEvents(events)
    const errors: TimingEvent[] = []
    const removedEvents: Cached<TimingEvent>[] = []
    for (const [type, events] of splitEvent.entries()) {
      removedEvents.push(...this.deleteEvents(type, events))
      errors.push(...this.findConflictingEvents(type))
    }
    return {
      removedEvents,
      errors,
    }
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

  findEvents(events: TimingEvent[]): Cached<TimingEvent>[] {
    const splitEvent = this.splitEvents(events)
    const foundEvents: Cached<TimingEvent>[] = []
    for (const [type, events] of splitEvent.entries()) {
      const column = this.columns[type]
      if (!column) continue
      let conflictIndex = 0
      let eventIndex = 0
      while (events[conflictIndex] && column.events[eventIndex]) {
        if (
          this.compareEvents(events[conflictIndex], column.events[eventIndex])
        ) {
          foundEvents.push(column.events[eventIndex])
          conflictIndex++
        } else {
          eventIndex++
        }
      }
    }
    return foundEvents
  }

  getBeatFromSeconds(seconds: number): number {
    if (!isFinite(seconds)) return 0
    if (this._cache.beatTiming == undefined) this.buildBeatTimingDataCache()
    if (seconds + this.getOffset() < 0) {
      return (
        ((seconds + this.getOffset()) * this._cache.beatTiming![0].bpm) / 60
      )
    }
    const cache = this._cache.beatTiming!
    const event = this.binarySearch(cache, "secondClamp", seconds)
    const timeElapsed = Math.max(0, seconds - event.secondAfter)
    return event.beat + (timeElapsed * event.bpm) / 60
  }

  getSecondsFromBeat(
    beat: number,
    option?: "noclamp" | "before" | "after" | ""
  ): number {
    option ||= ""
    if (!isFinite(beat)) return 0
    if (this._cache.beatTiming == undefined) this.buildBeatTimingDataCache()
    const flooredBeat = Math.floor(beat * 1000) / 1000
    if (beat <= 0) {
      const curbpm = this._cache.beatTiming![0].bpm
      return -this.getOffset() + (beat * 60) / curbpm
    }
    const cacheId = `${beat}-${option}`
    if (this._cache.beatsToSeconds.has(cacheId))
      return this._cache.beatsToSeconds.get(cacheId)!
    const cache = this._cache.beatTiming!
    const event = this.binarySearch(cache, "beat", flooredBeat)
    if (event.beat == flooredBeat) {
      if (option == "noclamp" || option == "") {
        this._cache.beatsToSeconds.set(cacheId, event.secondOf)
        return event.secondOf
      }
      if (option == "before") {
        this._cache.beatsToSeconds.set(cacheId, event.secondBefore)
        return event.secondBefore
      }
      if (option == "after") {
        this._cache.beatsToSeconds.set(cacheId, event.secondAfter)
        return event.secondAfter
      }
    }
    const beatsElapsed = beat - event.beat
    let timeElapsed = (beatsElapsed * 60) / event.bpm
    if (event.warped) timeElapsed = 0
    if (option == "noclamp") {
      this._cache.beatsToSeconds.set(cacheId, event.secondAfter + timeElapsed)
      return event.secondAfter + timeElapsed
    }
    this._cache.beatsToSeconds.set(
      cacheId,
      Math.max(event.secondClamp, event.secondAfter + timeElapsed)
    )
    return Math.max(event.secondClamp, event.secondAfter + timeElapsed)
  }

  isBeatWarped(beat: number): boolean {
    if (!isFinite(beat)) return false
    const flooredBeat = Math.floor(beat * 1000) / 1000
    if (this._cache.warpedBeats.has(flooredBeat))
      return this._cache.warpedBeats.get(flooredBeat)!
    if (this._cache.beatTiming == undefined) this.buildBeatTimingDataCache()
    const cache = this._cache.beatTiming!
    const event = this.binarySearch(cache, "beat", flooredBeat)
    const secondLimit =
      event.beat == flooredBeat
        ? event.secondClamp
        : Math.max(event.secondAfter, event.secondClamp)
    if (event.secondOf < event.secondAfter && event.beat == flooredBeat) {
      this._cache.warpedBeats.set(flooredBeat, false)
      return false
    }
    if (
      event.warped ||
      this.getSecondsFromBeat(beat, "noclamp") < secondLimit
    ) {
      this._cache.warpedBeats.set(flooredBeat, true)
      return true
    }
    this._cache.warpedBeats.set(flooredBeat, false)
    return false
  }

  isBeatFaked(beat: number): boolean {
    if (!isFinite(beat)) return false
    const flooredBeat = Math.floor(beat * 1000) / 1000
    const fakes = this.getTimingData("FAKES")
    if (fakes == undefined) return false
    for (const event of fakes) {
      if (flooredBeat >= event.beat && flooredBeat < event.beat + event.value)
        return true
    }
    return false
  }

  getMeasure(beat: number): number {
    if (!isFinite(beat)) return 0
    if (this._cache.measureTiming == undefined) this.buildMeasureTimingCache()
    const cache = this._cache.measureTiming!
    if (cache.length == 0) return Math.floor(beat / 4)
    const event = this.binarySearch(cache, "beat", beat)
    const deltaBeats = beat - event.beat
    return event.measure + deltaBeats / event.beatsPerMeasure
  }

  getDivisionLength(beat: number): number {
    if (!isFinite(beat)) return 1
    if (this._cache.measureTiming == undefined) this.buildMeasureTimingCache()
    const cache = this._cache.measureTiming!
    if (cache.length == 0) return 1
    const event = this.binarySearch(cache, "beat", beat)
    return event.divisionLength
  }

  getMeasureLength(beat: number): number {
    if (!isFinite(beat)) return 1
    if (this._cache.measureTiming == undefined) this.buildMeasureTimingCache()
    const cache = this._cache.measureTiming!
    if (cache.length == 0) return 1
    const event = this.binarySearch(cache, "beat", beat)
    return event.divisionLength * event.numDivisions
  }

  getBeatOfMeasure(beat: number): number {
    if (!isFinite(beat)) return 0
    if (this._cache.measureTiming == undefined) this.buildMeasureTimingCache()
    const cache = this._cache.measureTiming!
    if (cache.length == 0) return beat % 4
    const event = this.binarySearch(cache, "beat", beat)
    const deltaBeats = beat - event.beat
    return deltaBeats % event.beatsPerMeasure
  }

  getBeatFromMeasure(measure: number): number {
    if (!isFinite(measure)) return 0
    if (this._cache.measureTiming == undefined) this.buildMeasureTimingCache()
    const cache = this._cache.measureTiming!
    if (cache.length == 0) return measure * 4
    const event = this.binarySearch(cache, "measure", measure)
    const deltaMeasure = measure - event.measure
    return event.beat + deltaMeasure * event.beatsPerMeasure
  }

  getDivisionOfMeasure(beat: number): number {
    if (!isFinite(beat)) return 0
    return this.getBeatOfMeasure(beat) / this.getDivisionLength(beat)
  }

  *getMeasureBeats(
    firstBeat: number,
    lastBeat: number
  ): Generator<[number, boolean], void> {
    firstBeat = Math.max(0, firstBeat)
    const timeSigs = this.getTimingData("TIMESIGNATURES")
    let currentTimeSig = this.getEventAtBeat("TIMESIGNATURES", firstBeat)
    let timeSigIndex = currentTimeSig
      ? timeSigs.findIndex(t => t.beat == currentTimeSig!.beat)
      : -1
    let divisionLength = this.getDivisionLength(firstBeat)
    const beatsToNearestDivision =
      (this.getDivisionOfMeasure(firstBeat) % 1) * divisionLength

    // Find the nearest beat division
    let beat = Math.max(0, firstBeat - beatsToNearestDivision)
    if (beat < firstBeat) beat += divisionLength
    let divisionNumber = Math.round(this.getDivisionOfMeasure(beat))

    let divisionsPerMeasure = currentTimeSig?.upper ?? 4
    while (beat < lastBeat) {
      // Don't display warped beats
      if (!Options.chart.CMod || !this.isBeatWarped(beat)) {
        yield [beat, divisionNumber % divisionsPerMeasure == 0]
      }
      divisionNumber++
      divisionNumber %= divisionsPerMeasure
      // Go to the next division
      beat += divisionLength
      // Check if we have reached the next time signature
      if (beat >= timeSigs[timeSigIndex + 1]?.beat) {
        timeSigIndex++
        // Go to start of the new time signature
        currentTimeSig = timeSigs[timeSigIndex]
        beat = currentTimeSig.beat
        divisionLength = this.getDivisionLength(beat)
        divisionNumber = 0
        divisionsPerMeasure = currentTimeSig.upper
      }
    }
  }

  getEffectiveBeat(beat: number): number {
    if (!isFinite(beat)) return 0
    if (this._cache.effectiveBeatTiming == undefined)
      this.buildEffectiveBeatTimingDataCache()
    const cache = this._cache.effectiveBeatTiming!
    if (cache.length == 0) return beat
    const event = this.binarySearch(cache, "beat", beat)
    if (cache[0] == event && event.beat > beat && event.beat > 0) return beat
    let effBeat = event.effectiveBeat!
    const beats_left_over = beat - event.beat
    effBeat += beats_left_over * event.value
    return effBeat
  }

  getBeatFromEffectiveBeat(effBeat: number): number {
    if (!isFinite(effBeat)) return 0
    if (this._cache.effectiveBeatTiming == undefined)
      this.buildEffectiveBeatTimingDataCache()
    const cache = this._cache.effectiveBeatTiming!
    if (cache.length == 0) return effBeat
    let i = 0
    while (
      cache[i + 1] &&
      (cache[i].value <= 0 || cache[i + 1].effectiveBeat! <= effBeat)
    )
      i++
    const leftOverEffBeats = effBeat - cache[i].effectiveBeat!
    let additionalBeats = leftOverEffBeats / cache[i].value
    if (!isFinite(additionalBeats)) additionalBeats = 0
    return cache[i].beat + additionalBeats
  }

  getSpeedMult(beat: number, seconds: number): number {
    if (!isFinite(beat) || !isFinite(seconds)) return 0
    const cache = this.getColumn("SPEEDS").events
    if (cache.length == 0) return 1
    const i = this.binarySearchIndex(cache, "beat", beat)
    const event = cache[i]
    if (event == undefined) return 1
    let time = beat - event.beat
    if (event.unit == "T") time = seconds - event.second
    let progress = clamp(time / event.delay, 0, 1)
    if (event.delay == 0) progress = 1
    const prev = cache[i - 1]?.value ?? 1
    return progress * (event.value - prev) + prev
  }

  reloadCache(types: TimingType[] = []) {
    let reloadColumns = types
    if (
      types.length == 0 ||
      types.filter(x =>
        ["WARPS", "STOPS", "DELAYS", "BPMS", "OFFSET"].includes(x)
      ).length > 0
    ) {
      this.buildBeatTimingDataCache()
      reloadColumns = [...TIMING_EVENT_NAMES]
    }
    if (types.length == 0 || types.includes("SCROLLS"))
      this.buildEffectiveBeatTimingDataCache()
    if (types.length == 0 || types.includes("TIMESIGNATURES"))
      this.buildMeasureTimingCache()
    reloadColumns
      .filter(type => type != "OFFSET")
      .forEach(type => this.updateEvents(type as TimingEventType))
    this._cache.sortedEvents = this.mergeColumns(
      TIMING_EVENT_NAMES.map(type => this.getColumn(type).events)
    )
  }

  getBeatTiming(): BeatTimingCache[] {
    return [...this._cache.beatTiming!]
  }

  getTimingData(): Cached<TimingEvent>[]
  getTimingData<Type extends TimingEventType>(
    ...props: Type[]
  ): Cached<Extract<TimingEvent, { type: Type }>>[]
  getTimingData(...props: TimingEventType[]) {
    if (props.length == 0) return this._cache.sortedEvents!
    return this.mergeColumns(props.map(prop => this.getColumn(prop).events))
  }

  requiresSSC(): boolean {
    return TIMING_EVENT_NAMES.some(type => this.typeRequiresSSC(type))
  }
}
