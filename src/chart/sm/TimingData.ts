import { ActionHistory } from "../../util/ActionHistory"
import { EventHandler } from "../../util/EventHandler"
import { clamp, roundDigit } from "../../util/Math"
import { bsearch } from "../../util/Util"
import { Chart } from "./Chart"
import {
  AttackTimingEvent,
  BPMTimingEvent,
  BeatTimingCache,
  BeatTimingEvent,
  BeatTimingEventProperty,
  MeasureTimingCache,
  ScrollCacheTimingEvent,
  SpeedTimingEvent,
  StopTimingEvent,
  TIMING_EVENT_NAMES,
  TimingEvent,
  TimingEventBase,
  TimingEventProperty,
  TimingProperty,
  WarpTimingEvent,
} from "./TimingTypes"

type TimingPropertyCollection = {
  [key in TimingEvent["type"]]?: Extract<TimingEvent, { type: key }>[]
}

type TimingCache = {
  events: TimingPropertyCollection
  beatTiming?: BeatTimingCache[]
  effectiveBeatTiming?: ScrollCacheTimingEvent[]
  measureTiming?: MeasureTimingCache[]
  speeds?: SpeedTimingEvent[]
  sortedEvents?: TimingEvent[]
  warpedBeats: Map<number, boolean>
  beatsToSeconds: Map<string, number>
}

export class TimingData {
  private _fallback?: TimingData
  private _cache: TimingCache = {
    events: {},
    warpedBeats: new Map(),
    beatsToSeconds: new Map(),
  }
  private _chart?: Chart
  events: TimingPropertyCollection = {}
  offset?: number

  constructor(fallbackTimingData?: TimingData, chart?: Chart) {
    this._fallback = fallbackTimingData
    this._chart = chart
  }

  parse(type: TimingProperty, data: string) {
    if (type == "OFFSET") {
      this.offset = parseFloat(data)
      return
    }

    // detect seperator
    let entries = data
      .split("\n")
      .map(line => line.trim())
      .filter(line => line !== "")
    if (!entries.slice(0, -1).some(line => !line.endsWith(","))) {
      // All lines ends with comma, split by comma
      entries = entries.map(line => line.slice(0, -1))
    }
    this.events[type] ||= []

    if (type == "ATTACKS") entries = [data.replaceAll(/[\n\r\t]/g, "")]
    for (const str of entries) {
      if (type == "ATTACKS") {
        let match
        const regex = /TIME=([\d.]+):(END|LEN)=([\d.]+):MODS=([^:]+)/g
        while ((match = regex.exec(str)) != null) {
          const event: AttackTimingEvent = {
            type: "ATTACKS",
            second: parseFloat(match[1]),
            endType: match[2] as "END" | "LEN",
            value: parseFloat(match[3]),
            mods: match[4],
          }
          this._insert("ATTACKS", event, false)
        }
        return
      }
      const temp = str.split("=")
      if (temp.length < 2) continue

      let event: TimingEvent | undefined
      switch (type) {
        case "BPMS":
        case "STOPS":
        case "WARPS":
        case "DELAYS":
        case "SCROLLS":
        case "TICKCOUNTS":
        case "FAKES":
          event = {
            type: type,
            beat: parseFloat(temp[0]),
            value: parseFloat(temp[1]),
          }
          break
        case "LABELS":
          event = {
            type: type,
            beat: parseFloat(temp[0]),
            value: temp[1],
          }
          break
        case "SPEEDS":
          event = {
            type: type,
            beat: parseFloat(temp[0]),
            value: parseFloat(temp[1]),
            delay: parseFloat(temp[2]),
            unit: temp[3] == "0" ? "B" : "T",
          }
          break
        case "TIMESIGNATURES":
          event = {
            type: type,
            beat: parseFloat(temp[0]),
            upper: parseInt(temp[1]),
            lower: parseInt(temp[2]),
          }
          break
        case "COMBOS":
          event = {
            type: type,
            beat: parseFloat(temp[0]),
            hitMult: parseInt(temp[1]),
            missMult: parseInt(temp[2] ?? temp[1]),
          }
          break
        case "BGCHANGES":
        case "FGCHANGES":
          event = {
            type: type,
            beat: parseFloat(temp[0]),
            file: temp[1],
            updateRate: parseFloat(temp[2]),
            crossFade: temp[3] == "1",
            stretchRewind: temp[4] == "1",
            stretchNoLoop: temp[5] == "1",
            effect: temp[6] ?? "",
            file2: temp[7] ?? "",
            transition: temp[8] ?? "",
            color1: temp[9] ?? "",
            color2: temp[10] ?? "",
          }
      }
      this._insert(type, event!, false)
    }
  }

  private _insert(
    type: TimingEventProperty,
    event: TimingEvent,
    doCache?: boolean
  ) {
    this.binsert(type, event)
    if (doCache ?? true) this.reloadCache(type)
  }

  delete(songTiming: boolean, type: TimingEventProperty, time: number) {
    const target = songTiming ? this : this._fallback!
    if (!target.events[type]) return
    time = roundDigit(time, 3)
    const i = target.bindex(type, { type, beat: time, second: time })
    if (i == -1) return
    if (i == 0 && type == "BPMS") return
    const event = target.events[type]![i]
    ActionHistory.instance.run({
      action: () => {
        target._delete(event)
        target.reloadCache(type)
        if (this != target) this.reloadCache(type)
        EventHandler.emit("timingModified")
      },
      undo: () => {
        target._insert(event.type, event)
        target.reloadCache(type)
        if (this != target) this.reloadCache(type)
        EventHandler.emit("timingModified")
      },
    })
  }

  private _delete(event: TimingEvent, doCache?: boolean) {
    if (!this.events[event.type]) return
    const events = this.events[event.type]!
    let i = this.bindex(event.type, event)
    if (i == -1) return
    // rewind to start of events that share the same beat
    while (events[i - 1]?.beat == event.beat) i--

    // search for the event
    while (events[i].beat == event.beat && !this.isEqual(events[i], event)) i++
    if (events[i].beat == event.beat) {
      this.events[event.type]!.splice(i, 1)
      if (doCache ?? true) this.reloadCache(event.type)
    }
  }

  private isDuplicate<Event extends TimingEvent>(
    event: Event,
    properties: Event
  ): boolean {
    if (
      ["STOPS", "WARPS", "DELAYS", "FAKES", "BGCHANGES", "FGCHANGES"].includes(
        event.type
      )
    )
      return false
    if (properties.type != event.type) return false
    switch (event.type) {
      case "BPMS":
      case "SCROLLS":
      case "TICKCOUNTS":
      case "LABELS":
        return properties.type == event.type && event.value == properties.value
      case "SPEEDS":
        return (
          properties.type == event.type &&
          event.value == properties.value &&
          event.delay == properties.delay &&
          event.unit == properties.unit
        )
      case "TIMESIGNATURES":
        return (
          properties.type == event.type &&
          event.upper == properties.upper &&
          event.lower == properties.lower
        )
      case "COMBOS":
        return (
          properties.type == event.type &&
          event.hitMult == properties.hitMult &&
          event.missMult == properties.missMult
        )
      default:
        return false
    }
  }

  private isEqual<Event extends TimingEvent>(a: Event, b: Event): boolean {
    for (const key of Object.keys(a)) {
      if (b[key as keyof Event] != a[key as keyof Event]) return false
    }
    return true
  }

  private isSimilar<Event extends TimingEvent>(
    eventA: Event,
    eventB: Event
  ): boolean {
    if (
      ["STOPS", "WARPS", "DELAYS", "FAKES", "BGCHANGES", "FGCHANGES"].includes(
        eventA.type
      )
    )
      return false
    if (eventB.type != eventA.type) return false
    switch (eventA.type) {
      case "BPMS":
      case "SCROLLS":
      case "TICKCOUNTS":
      case "SPEEDS":
      case "LABELS":
        return eventB.type == eventA.type && eventA.value == eventB.value
      case "TIMESIGNATURES":
        return (
          eventB.type == eventA.type &&
          eventA.upper == eventB.upper &&
          eventA.lower == eventB.lower
        )
      case "COMBOS":
        return (
          eventB.type == eventA.type &&
          eventA.hitMult == eventB.hitMult &&
          eventA.missMult == eventB.missMult
        )
      default:
        return false
    }
  }

  private isNullEvent<Event extends TimingEvent>(event: Event): boolean {
    switch (event.type) {
      case "BPMS":
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
      case "ATTACKS":
        return event.value == ""
      case "SPEEDS":
      case "SCROLLS":
        return false
      case "FGCHANGES":
      case "BGCHANGES":
        return event.file == "" && event.file2 == ""
    }
  }

  insert<Type extends TimingEventProperty>(
    songTiming: boolean,
    type: Type | "OFFSET",
    properties: Partial<Extract<TimingEvent, { type: Type }>> | number,
    beat?: number
  ) {
    const target = songTiming ? this : this._fallback!
    if (type == "OFFSET") {
      target.offset = properties as number
      this.reloadCache("OFFSET")
      return
    }
    if (Object.keys(properties).length == 0) return
    if (!target.events[type satisfies TimingEventProperty]) {
      if (songTiming) {
        target.events[type satisfies TimingEventProperty] = JSON.parse(
          JSON.stringify(
            this._fallback!.events[type satisfies TimingEventProperty]
          )
        )
      } else {
        target.events[type satisfies TimingEventProperty] = []
      }
    }

    beat = roundDigit(beat!, 3)
    const eventOnBeat = target.getTimingEventAtBeat(type, beat)
    const newEvent: Partial<TimingEvent> = { type: type, beat: beat }
    const toDelete: TimingEvent[] = []
    const toAdd: TimingEvent[] = []
    Object.assign(newEvent, properties)
    // Don't do anything if the event isn't changed
    if (eventOnBeat && this.isDuplicate(newEvent as TimingEvent, eventOnBeat))
      return

    if (eventOnBeat?.beat == beat) {
      // Remove old event if same beat
      toDelete.push(eventOnBeat)
    }
    //Add new event if it doesn't match the previous one
    const previousEvent = target.getTimingEventAtBeat(type, beat - 0.001)

    if (this.isNullEvent(newEvent as TimingEvent)) return
    if (
      !previousEvent ||
      !this.isSimilar(previousEvent, newEvent as TimingEvent) ||
      (eventOnBeat && this.isDuplicate(previousEvent, eventOnBeat))
    ) {
      toAdd.push(newEvent as TimingEvent)
    }

    //Remove the next event if it matches the new event
    const events = this.getTimingData(type)
    const nextEvent = events[target.searchCache(events, "beat", beat) + 1]
    if (nextEvent) {
      if (this.isDuplicate(newEvent as TimingEvent, nextEvent)) {
        toDelete.push(nextEvent)
      }
    }

    if (toDelete.length || toAdd.length) {
      ActionHistory.instance.run({
        action: () => {
          for (const event of toDelete) {
            target._delete(event)
          }
          for (const event of toAdd) {
            target._insert(type, event)
          }
          this.reloadCache(type)
          EventHandler.emit("timingModified")
          EventHandler.emit("chartModified")
          if (type == "TIMESIGNATURES") {
            EventHandler.emit("timeSigChanged")
          }
        },
        undo: () => {
          for (const event of toAdd) {
            target._delete(event)
          }
          for (const event of toDelete) {
            target._insert(type, event)
          }
          this.reloadCache(type)
          EventHandler.emit("timingModified")
          EventHandler.emit("chartModified")
          if (type == "TIMESIGNATURES") {
            EventHandler.emit("timeSigChanged")
          }
        },
      })
    }
  }

  rawDeleteMultiple(events: TimingEvent[]) {
    for (const event of events) {
      const songTiming = this.events[event.type]
      const target = songTiming ? this : this._fallback!
      event.beat = roundDigit(event.beat!, 3)
      target._delete(event, false)
    }
    this.reloadCache()
  }

  rawInsertMultiple(events: TimingEvent[]) {
    for (const event of events) {
      const songTiming = this.events[event.type]
      const target = songTiming ? this : this._fallback!
      if (!target.events[event.type]) {
        if (songTiming) {
          target.events[event.type] = JSON.parse(
            JSON.stringify(this._fallback!.events[event.type])
          )
        } else {
          target.events[event.type] = []
        }
      }
      event.beat = roundDigit(event.beat!, 3)
      target._insert(event.type, event, false)
    }
    this.reloadCache()
  }

  findConflicts(exclude: TimingEvent[] = []) {
    const conflicts = []
    for (const type of TIMING_EVENT_NAMES) {
      const events = this.getTimingData(type)
      if (events.length < 2) continue
      let lastEvent = events[0]
      for (let i = 1; i < events.length; i++) {
        if (
          lastEvent.beat == events[i].beat ||
          this.isSimilar(lastEvent, events[i])
        ) {
          if (exclude.includes(events[i])) {
            conflicts.push(lastEvent)
          } else {
            conflicts.push(events[i])
          }
        } else {
          lastEvent = events[i]
        }
      }
    }
    return conflicts
  }

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

    const offset = this.getTimingData("OFFSET")

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
        value: 1,
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
    const timeSigs = [...this.getTimingData("TIMESIGNATURES")]
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

  private buildSpeedsTimingDataCache() {
    const cache: SpeedTimingEvent[] = this.getTimingData("SPEEDS").map(e => ({
      type: e.type,
      beat: e.beat,
      value: e.value,
      delay: e.delay,
      unit: e.unit,
      second: this.getSecondsFromBeat(e.beat),
    }))
    this._cache.speeds = cache
  }

  private buildTimingDataCache() {
    TIMING_EVENT_NAMES.forEach(type => {
      this._cache.events[type] = (this.events[type] ??
        this._fallback?.events[type] ??
        []) as any
    })
    this._cache.sortedEvents = TIMING_EVENT_NAMES.map(
      type => this._cache.events[type]!
    )
      .flat()
      .sort((a, b) => a.beat! - b.beat!)
    for (const event of this._cache.sortedEvents) {
      if (event.type == "DELAYS")
        event.second = this.getSecondsFromBeat(event.beat, "before")
      else if (event.type == "ATTACKS") {
        event.beat = this.getBeatFromSeconds(event.second)
      } else {
        event.second = this.getSecondsFromBeat(event.beat)
      }
    }

    this._cache.sortedEvents.sort((a, b) => a.beat! - b.beat!)
  }

  private searchCache<Type, Prop extends keyof Type>(
    cache: Type[],
    property: Prop,
    value: number
  ) {
    return bsearch(cache, value, a => a[property] as number)
  }

  getBeatFromSeconds(seconds: number): number {
    if (!isFinite(seconds)) return 0
    if (this._cache.beatTiming == undefined) this.buildBeatTimingDataCache()
    if (seconds + this.getTimingData("OFFSET") < 0) {
      return (
        ((seconds + this.getTimingData("OFFSET")) *
          this._cache.beatTiming![0].bpm) /
        60
      )
    }
    const cache = this._cache.beatTiming!
    const i = this.searchCache(cache, "secondClamp", seconds)
    const event = cache[i]
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
      return -this.getTimingData("OFFSET") + (beat * 60) / curbpm
    }
    const cacheId = `${beat}-${option}`
    if (this._cache.beatsToSeconds.has(cacheId))
      return this._cache.beatsToSeconds.get(cacheId)!
    const cache = this._cache.beatTiming!
    const i = this.searchCache(cache, "beat", flooredBeat)
    const event = cache[i]
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
    const i = this.searchCache(cache, "beat", flooredBeat)
    const event = cache[i]
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
    if (this.isBeatWarped(beat)) return true
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
    const i = this.searchCache(cache, "beat", beat)
    const event = cache[i]
    const deltaBeats = beat - event.beat
    return event.measure + deltaBeats / event.beatsPerMeasure
  }

  getDivisionLength(beat: number): number {
    if (!isFinite(beat)) return 1
    if (this._cache.measureTiming == undefined) this.buildMeasureTimingCache()
    const cache = this._cache.measureTiming!
    if (cache.length == 0) return 1
    const i = this.searchCache(cache, "beat", beat)
    const event = cache[i]
    return event.divisionLength
  }

  getMeasureLength(beat: number): number {
    if (!isFinite(beat)) return 1
    if (this._cache.measureTiming == undefined) this.buildMeasureTimingCache()
    const cache = this._cache.measureTiming!
    if (cache.length == 0) return 1
    const i = this.searchCache(cache, "beat", beat)
    const event = cache[i]
    return event.divisionLength * event.numDivisions
  }

  getBeatOfMeasure(beat: number): number {
    if (!isFinite(beat)) return 0
    if (this._cache.measureTiming == undefined) this.buildMeasureTimingCache()
    const cache = this._cache.measureTiming!
    if (cache.length == 0) return beat % 4
    const i = this.searchCache(cache, "beat", beat)
    const event = cache[i]
    const deltaBeats = beat - event.beat
    return deltaBeats % event.beatsPerMeasure
  }

  getBeatFromMeasure(measure: number): number {
    if (!isFinite(measure)) return 0
    if (this._cache.measureTiming == undefined) this.buildMeasureTimingCache()
    const cache = this._cache.measureTiming!
    if (cache.length == 0) return measure * 4
    const i = this.searchCache(cache, "measure", measure)
    const event = cache[i]
    const deltaMeasure = measure - event.measure
    return event.beat + deltaMeasure * event.beatsPerMeasure
  }

  getDivisionOfMeasure(beat: number): number {
    if (!isFinite(beat)) return 0
    return this.getBeatOfMeasure(beat) / this.getDivisionLength(beat)
  }

  getEffectiveBeat(beat: number): number {
    if (!isFinite(beat)) return 0
    if (this._cache.effectiveBeatTiming == undefined)
      this.buildEffectiveBeatTimingDataCache()
    const cache = this._cache.effectiveBeatTiming!
    if (cache.length == 0) return beat
    const i = this.searchCache(cache, "beat", beat)
    const event = cache[i]
    if (i == 0 && event.beat > beat && event.beat > 0) return beat
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
    if (this._cache.speeds == undefined) this.buildSpeedsTimingDataCache()
    const cache = this._cache.speeds!
    if (cache.length == 0) return 1
    const i = this.searchCache(cache, "beat", beat)
    const event = cache[i]
    if (event == undefined) return 1
    let time = beat - event.beat
    if (event.unit == "T") time = seconds - event.second!
    let progress = clamp(time / event.delay, 0, 1)
    if (event.delay == 0) progress = 1
    const prev = cache[i - 1]?.value ?? 1
    return progress * (event.value - prev) + prev
  }

  getBPM(beat: number): number {
    return this.getBPMEvent(beat)?.value ?? 120
  }

  getBPMEvent(beat: number): BPMTimingEvent | undefined {
    if (!isFinite(beat)) return
    if (this._cache.beatTiming == undefined) this.buildBeatTimingDataCache()
    const bpms = this.getTimingData("BPMS")
    if (bpms.length == 0) return
    return bpms[this.searchCache(bpms, "beat", beat)]
  }

  getTimingEventAtBeat<Type extends TimingEventProperty>(
    prop: Type,
    beat: number
  ): Extract<TimingEvent, { type: Type }> | undefined {
    const entries = this.getTimingData(prop)
    if (!Array.isArray(entries)) return undefined
    const entry = entries[this.searchCache(entries, "beat", beat)]
    if (entry?.beat && entry.beat > beat) return undefined
    return entry
  }

  reloadCache(prop?: TimingProperty) {
    this.buildTimingDataCache()
    if (
      prop == undefined ||
      prop == "OFFSET" ||
      ["WARPS", "STOPS", "DELAYS", "BPMS"].includes(
        prop as BeatTimingEventProperty
      )
    )
      this.buildBeatTimingDataCache()
    if (prop == undefined || prop == "SCROLLS")
      this.buildEffectiveBeatTimingDataCache()
    if (prop == undefined || prop == "TIMESIGNATURES")
      this.buildMeasureTimingCache()
    if (prop == undefined || prop == "SPEEDS") this.buildSpeedsTimingDataCache()
    this._chart?.recalculateNotes()
  }

  private binsert<Type extends TimingEventProperty>(
    type: Type,
    event: Extract<TimingEvent, { type: Type }>
  ) {
    let key = "beat" as keyof TimingEventBase
    const arr = this.events[type]!
    if (type == "ATTACKS") key = "second" as keyof TimingEventBase
    let low = 0,
      high = arr.length
    while (low < high) {
      const mid = (low + high) >>> 1
      if (arr[mid][key]! < event[key]!) low = mid + 1
      else high = mid
    }
    arr.splice(low, 0, event)
  }

  private bindex(type: TimingEventProperty, event: TimingEventBase): number {
    let key = "beat" as keyof TimingEventBase
    const arr = this.events[type]!
    if (type == "ATTACKS") key = "second" as keyof TimingEventBase
    let low = 0,
      high = arr.length
    while (low <= high && low < arr.length) {
      const mid = (low + high) >>> 1
      if (arr[mid][key] == event[key]) return mid
      if (arr[mid][key]! < event[key]!) low = mid + 1
      if (arr[mid][key]! > event[key]!) high = mid - 1
    }
    return -1
  }

  getBeatTiming(): BeatTimingCache[] {
    return [...this._cache.beatTiming!]
  }

  getTimingData(): TimingEvent[]
  getTimingData(...props: ["OFFSET"]): number
  getTimingData<Type extends TimingProperty>(
    ...props: Type[]
  ): Extract<TimingEvent, { type: Type }>[]
  getTimingData(...props: TimingProperty[]) {
    if (props.length == 0) return this._cache.sortedEvents
    if (props.includes("OFFSET"))
      return this.offset ?? this._fallback?.offset ?? 0
    if (props.length == 1 && props[0] in this._cache.events)
      return this._cache.events[props[0] as TimingEventProperty]

    if (this._cache.sortedEvents == undefined) this.buildTimingDataCache()
    const events = this._cache.sortedEvents!.filter(event =>
      props.includes(event.type)
    )
    return events
  }

  isEmpty(): boolean {
    for (const value of Object.values(this.events)) {
      if (value) return false
    }
    return true
  }

  isTypeChartSpecific(type: TimingEventProperty): boolean {
    return !!this.events[type]
  }

  requiresSSC(): boolean {
    return (
      this.getTimingData(
        "WARPS",
        "DELAYS",
        "SCROLLS",
        "TICKCOUNTS",
        "FAKES",
        "LABELS",
        "SPEEDS",
        "TIMESIGNATURES",
        "COMBOS"
      ).length != 0
    )
  }

  serialize(type: "sm" | "ssc"): string {
    let str = ""
    if (this.offset) str += "#OFFSET:" + this.offset + ";\n"
    let props = [
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
    ] satisfies TimingEventProperty[]
    if (type == "sm") {
      props = [
        "BPMS",
        "STOPS",
        "TIMESIGNATURES",
        "BGCHANGES",
        "FGCHANGES",
        "ATTACKS",
      ]
    }
    for (const prop of props) {
      str += this.formatProperty(type, prop)
    }
    return str
  }

  private formatProperty(
    type: "sm" | "ssc",
    prop: TimingEventProperty
  ): string {
    const precision = 3
    if (!this._fallback && !this.events[prop]) return ""
    let str = ""
    switch (prop) {
      case "ATTACKS": {
        const events = this.getTimingData(prop)
        str = events
          .map(
            event =>
              `TIME=${event.second}${event.endType}=${event.value}:MODS=${event.mods}`
          )
          .join(":\n")
        break
      }
      case "BGCHANGES":
      case "FGCHANGES": {
        const events = this.getTimingData(prop)
        str = events
          .map(
            event =>
              `${event.beat}=${event.file}=${roundDigit(
                event.updateRate,
                precision
              ).toFixed(precision)}=${Number(event.crossFade)}=${Number(
                event.stretchRewind
              )}=${Number(event.stretchNoLoop)}=${event.effect}=${
                event.file2
              }=${event.transition}=${event.color1}=${event.color2}`
          )
          .join(",\n")
        break
      }
      case "BPMS":
      case "DELAYS":
      case "FAKES":
      case "SCROLLS":
      case "WARPS": {
        const events = this.getTimingData(prop)
        str = events
          .map(
            event =>
              `${roundDigit(event.beat, precision).toFixed(
                precision
              )}=${roundDigit(event.value, precision).toFixed(precision)}`
          )
          .join(",\n")
        break
      }
      case "STOPS": {
        let events = this.getTimingData(prop)
        if (type == "sm") {
          const warps = this.getTimingData("WARPS")
          const stopWarps: StopTimingEvent[] = warps.map(warp => {
            const bpm = this.getBPM(warp.beat)
            return {
              type: "STOPS",
              beat: warp.beat,
              value: (-60 / bpm) * warp.value,
            }
          })
          events = events.concat(stopWarps)
        }
        str = events
          .map(
            event =>
              `${roundDigit(event.beat, precision).toFixed(
                precision
              )}=${roundDigit(event.value, precision).toFixed(precision)}`
          )
          .join(",\n")
        break
      }
      case "COMBOS": {
        const events = this.getTimingData(prop)
        str = events
          .map(event => {
            if (event.hitMult == event.missMult) {
              return `${roundDigit(event.beat, precision).toFixed(precision)}=${
                event.hitMult
              }`
            }
            return `${roundDigit(event.beat, precision).toFixed(precision)}=${
              event.hitMult
            }=${event.missMult}`
          })
          .join(",\n")
        break
      }
      case "LABELS":
      case "TICKCOUNTS": {
        const events = this.getTimingData(prop)
        str = events
          .map(
            event =>
              `${roundDigit(event.beat, precision).toFixed(precision)}=${
                event.value
              }`
          )
          .join(",\n")
        break
      }
      case "SPEEDS": {
        const events = this.getTimingData(prop)
        str = events
          .map(
            event =>
              `${roundDigit(event.beat, precision).toFixed(
                precision
              )}=${roundDigit(event.value, precision).toFixed(
                precision
              )}=${roundDigit(event.delay, precision).toFixed(precision)}=${
                event.unit == "B" ? 0 : 1
              }`
          )
          .join(",\n")
        break
      }
      case "TIMESIGNATURES": {
        const events = this.getTimingData(prop)
        str = events
          .map(
            event =>
              `${roundDigit(event.beat, precision).toFixed(precision)}=${
                event.upper
              }=${event.lower}`
          )
          .join(",\n")
        break
      }
    }
    if (str.includes(",")) str += "\n"
    return "#" + prop + ":" + str + ";\n"
  }

  getDefaultEvent(type: TimingEventProperty, beat: number): TimingEvent {
    switch (type) {
      case "BPMS":
        return {
          type,
          beat,
          value: 120,
        }
      case "STOPS":
      case "WARPS":
      case "DELAYS":
      case "FAKES":
        return {
          type,
          beat,
          value: 0,
        }
      case "LABELS":
        return {
          type,
          beat,
          value: "",
        }
      case "SPEEDS":
        return {
          type,
          beat,
          value: 1,
          delay: 0,
          unit: "B",
        }
      case "SCROLLS":
        return {
          type,
          beat,
          value: 1,
        }
      case "TICKCOUNTS":
        return {
          type,
          beat,
          value: 4,
        }
      case "TIMESIGNATURES":
        return {
          type,
          beat,
          upper: 4,
          lower: 4,
        }
      case "COMBOS":
        return {
          type,
          beat,
          hitMult: 1,
          missMult: 1,
        }
      case "ATTACKS":
        return {
          type,
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
        }
    }
  }
}
