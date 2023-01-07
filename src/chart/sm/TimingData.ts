import { bsearch, clamp, roundDigit } from "../../util/Util"
import { Chart } from "./Chart"
import {
  TimingEvent,
  WarpTimingEvent,
  StopTimingEvent,
  AttackTimingEvent,
  TIMING_EVENT_NAMES,
  BeatCacheTimingEvent,
  SpeedTimingEvent,
  TimingProperty,
  TimingEventProperty,
  TimingEventBase,
  ScrollCacheTimingEvent,
  BPMTimingEvent,
} from "./TimingTypes"

type TimingPropertyCollection = {
  [key in TimingEvent["type"]]?: Extract<TimingEvent, { type: key }>[]
}

type TimingCache = {
  events: TimingPropertyCollection
  beatTiming?: BeatCacheTimingEvent[]
  effectiveBeatTiming?: ScrollCacheTimingEvent[]
  speeds?: SpeedTimingEvent[]
  stopBeats?: { [key: number]: StopTimingEvent }
  sortedEvents?: TimingEvent[]
  warpedBeats: Record<number, boolean>
}

const BEAT_TIMING_PRIORITY = [
  "WARPS",
  "WARP_DEST",
  "STOPS",
  "DELAYS",
  "BPMS",
] as const

export class TimingData {
  private _fallback?: TimingData
  private _cache: TimingCache = {
    events: {},
    warpedBeats: {},
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

    this.events[type] ||= []

    let entries = data.replaceAll(/[\n\r\t]/g, "").split(",")
    if (type == "ATTACKS") entries = [data.replaceAll(/[\n\r\t]/g, "")]
    for (const str of entries) {
      if (type == "ATTACKS") {
        let match
        const regex = /TIME=([\d.]+):(END|LEN)=([\d.]+):MODS=([^:]+):/g
        while ((match = regex.exec(str)) != null) {
          const event: AttackTimingEvent = {
            type: "ATTACKS",
            second: parseFloat(match[1]),
            endType: match[2] as "END" | "LEN",
            value: parseFloat(match[3]),
            mods: match[4],
          }
          this.insert("ATTACKS", event, false)
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
            effect: temp[6],
            file2: temp[7],
            transition: temp[8],
            color1: temp[9],
            color2: temp[10],
          }
      }
      this.insert(type, event!, false)
    }
  }

  insert(type: TimingEventProperty, event: TimingEvent, doCache?: boolean) {
    this.binsert(type, event)
    if (doCache ?? true) this.reloadCache(type)
  }

  delete(type: TimingEventProperty, event: TimingEvent, doCache?: boolean) {
    if (!this.events[type]) return
    const i = this.bindex(type, event)
    if (i > -1) {
      this.events[type]!.splice(i, 1)
      if (doCache ?? true) this.reloadCache(type)
    }
  }

  update(type: TimingEventProperty, event: TimingEvent, doCache?: boolean): void
  update(type: "OFFSET", event: number, doCache?: boolean): void
  update(type: TimingProperty, event: TimingEvent | number, doCache?: boolean) {
    if (type == "OFFSET") {
      this.offset = event as number
      if (doCache ?? true) this.reloadCache("OFFSET")
      return
    }
    if (!this.events[type]) return
    const i = this.bindex(type, event as TimingEvent)
    if (i > -1) {
      this.events[type]![i] = event as TimingEvent
      if (doCache ?? true) this.reloadCache(type)
    }
  }

  private buildBeatTimingDataCache() {
    let cache: BeatCacheTimingEvent[] = this.getTimingData(
      "BPMS",
      "STOPS",
      "WARPS",
      "DELAYS"
    )
    cache = cache.concat(
      this.getTimingData("WARPS").map((event: WarpTimingEvent) => ({
        type: "WARP_DEST",
        beat: event.beat + event.value,
        value: event.value,
      }))
    )
    cache = cache.sort((a, b) => {
      if (a.beat == b.beat)
        return (
          (BEAT_TIMING_PRIORITY.indexOf(a.type) ?? 6) -
          (BEAT_TIMING_PRIORITY.indexOf(b.type) ?? 6)
        )
      return a.beat - b.beat
    })
    let seconds = 0
    let lastbeat = 0
    let curbpm = this.getTimingData("BPMS")[0]?.value ?? 120
    let warping = false
    const offset = this.getTimingData("OFFSET")
    for (let i = 0; i < cache.length; i++) {
      const event = cache[i]
      const time_to_event = ((event.beat - lastbeat) * 60) / curbpm
      lastbeat = event.beat
      if (!warping) seconds += time_to_event
      if (event.type == "WARPS") warping = true
      if (event.type == "WARP_DEST") warping = false
      if (event.type == "BPMS") curbpm = event.value
      cache[i].warped = warping
      cache[i].searchSecond = Math.max(
        cache[i - 1]?.second ?? -9999999999,
        seconds - offset
      )
      cache[i].second = seconds - offset
      if (event.type == "STOPS" || event.type == "DELAYS")
        seconds += event.value
    }

    this._cache.beatTiming = cache

    this._cache.stopBeats = {}
    this._cache.warpedBeats = {}
    this.getTimingData("STOPS").forEach(x => {
      this._cache.stopBeats![x.beat] = x
    })
  }

  private buildEffectiveBeatTimingDataCache() {
    const cache: ScrollCacheTimingEvent[] = this.getTimingData("SCROLLS")
    let effBeat = 0
    if (cache.length == 0) {
      this._cache.effectiveBeatTiming = []
      return
    }
    for (let i = 0; i < cache.length - 1; i++) {
      const event = cache[i]
      const beats = cache[i + 1].beat - event.beat
      event.effectiveBeat = effBeat
      effBeat += event.value * beats
    }
    cache[cache.length - 1].effectiveBeat = effBeat
    this._cache.effectiveBeatTiming = cache
  }

  private buildSpeedsTimingDataCache() {
    const cache: SpeedTimingEvent[] = this.getTimingData("SPEEDS").map(e => ({
      type: e.type,
      beat: e.beat,
      value: e.value,
      delay: e.delay,
      unit: e.unit,
      second: this.getSeconds(e.beat),
    }))
    this._cache.speeds = cache
  }

  private buildTimingDataCache() {
    this._cache.sortedEvents = TIMING_EVENT_NAMES.reduce(
      (data, type) =>
        data.concat(this.events[type] ?? this._fallback?.events[type] ?? []),
      [] as any
    )
    for (const event of this._cache.sortedEvents!) {
      if (!TIMING_EVENT_NAMES.includes(event.type))
        event.second = this.getSeconds(event.beat!)
      if (event.type == "ATTACKS") event.beat = this.getBeat(event.second)
    }
    this._cache.sortedEvents!.sort((a, b) => a.beat! - b.beat!)
    for (const type of TIMING_EVENT_NAMES) {
      this._cache.events[type] = this.getTimingData(type) as any
    }
  }

  private searchCache<Type, Prop extends keyof Type>(
    cache: Type[],
    property: Prop,
    value: number
  ) {
    return bsearch(cache, value, a => a[property] as number)
  }

  getBeat(seconds: number): number {
    if (this._cache.beatTiming == undefined) this.buildBeatTimingDataCache()
    const cache = this._cache.beatTiming!
    const i = this.searchCache(cache, "searchSecond", seconds)
    const event = cache[i]
    let beat = event.beat
    let time_left_over = seconds - event.second!
    let curbpm = this.getBPM(roundDigit(event.beat, 3))
    if (event.type == "STOPS" || event.type == "DELAYS")
      time_left_over = Math.max(0, time_left_over - event.value)
    if (event.type == "BPMS") curbpm = event.value
    beat += (time_left_over * curbpm) / 60
    return beat
  }

  getSeconds(beat: number): number {
    if (!isFinite(beat)) return 0
    const [seconds, clamp] = this.getSecondsNoClamp(beat)
    return Math.max(seconds, clamp)
  }

  private getSecondsNoClamp(beat: number): [number, number] {
    if (!isFinite(beat)) return [0, 0]
    if (this._cache.beatTiming == undefined) this.buildBeatTimingDataCache()
    const cache = this._cache.beatTiming!
    // Get the latest timing event at that beat
    let i = this.searchCache(cache, "beat", roundDigit(beat, 3) - 0.0001)
    while (cache[i + 1] && cache[i + 1].beat == cache[i].beat) i++
    const event = cache[i]
    const clamp = event.searchSecond!
    let seconds = event.second!
    let beats_left_over = beat - event.beat
    if (beat - event.beat < 0.001) beats_left_over = 0
    let curbpm = this.getBPM(roundDigit(event.beat, 3))
    if (
      (event.type == "STOPS" && roundDigit(beat, 3) > event.beat) ||
      event.type == "DELAYS"
    )
      seconds += event.value
    if (event.warped) beats_left_over = 0
    if (event.type == "BPMS" && roundDigit(beat, 3) > event.beat)
      curbpm = event.value
    seconds += (beats_left_over * 60) / curbpm
    return [seconds, clamp]
  }

  isBeatWarped(beat: number): boolean {
    if (!isFinite(beat)) return false
    if (this._cache.warpedBeats[beat]) return this._cache.warpedBeats[beat]
    if (this._cache.beatTiming == undefined) this.buildBeatTimingDataCache()
    const bpmEv = this.getBPMEvent(beat)
    if (
      bpmEv &&
      (bpmEv.value < 0 || bpmEv.searchSecond! > this.getSecondsNoClamp(beat)[0])
    ) {
      this._cache.warpedBeats[beat] = true
      return true
    }
    for (const event of this._cache.beatTiming!) {
      if (beat < event.beat) continue
      if (event.type == "WARPS" && beat < event.beat + event.value) {
        this._cache.warpedBeats[beat] = true
        return true
      }
      if (
        (event.type == "STOPS" || event.type == "DELAYS") &&
        event.value < 0
      ) {
        const bpmatstop = this.getBPM(event.beat)
        if (beat < event.beat + (event.value * -1 * bpmatstop) / 60) {
          this._cache.warpedBeats[beat] = true
          return true
        }
      }
    }
    this._cache.warpedBeats[beat] = false
    return false
  }

  isBeatFaked(beat: number): boolean {
    if (!isFinite(beat)) return false
    if (this.isBeatWarped(beat)) return true
    const fakes = this.getTimingData("FAKES")
    if (fakes == undefined) return false
    for (const event of fakes) {
      if (beat >= event.beat && beat < event.beat + event.value) return true
    }
    return false
  }

  getEffectiveBeat(beat: number): number {
    if (!isFinite(beat)) return 0
    if (this._cache.effectiveBeatTiming == undefined)
      this.buildEffectiveBeatTimingDataCache()
    const cache = this._cache.effectiveBeatTiming!
    if (cache.length == 0) return beat
    const i = this.searchCache(cache, "beat", beat)
    const event = cache[i]
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
    if (this._cache.stopBeats == undefined) this.buildBeatTimingDataCache()
    const bpms = this.getTimingData("BPMS")
    if (bpms.length == 0) return
    for (let i = 0; i < bpms.length; i++) {
      if (roundDigit(beat, 3) <= bpms[i].beat) {
        if (i == 0) return bpms[i]
        return bpms[i - 1]
      }
    }
    return bpms[bpms.length - 1]
  }

  getTimingEventAtBeat<Type extends TimingEventProperty>(
    prop: Type,
    beat: number
  ): Extract<TimingEvent, { type: Type }> | undefined {
    const entries = this.getTimingData(prop)
    if (!Array.isArray(entries)) return undefined
    const entry = entries[this.searchCache(entries, "beat", beat)]
    if (entry && entry.beat && entry.beat > beat) return undefined
    return entry
  }

  reloadCache(prop?: TimingProperty) {
    if (
      prop == undefined ||
      prop == "OFFSET" ||
      BEAT_TIMING_PRIORITY.includes(prop as any)
    )
      this.buildBeatTimingDataCache()
    if (prop == undefined || prop == "SCROLLS")
      this.buildEffectiveBeatTimingDataCache()
    if (prop == undefined || prop == "SPEEDS") this.buildSpeedsTimingDataCache()
    if (prop == undefined) this.buildTimingDataCache()
    this._chart?.recalculateNotes()
  }

  private binsert<Type extends TimingEventProperty>(
    type: Type,
    event: Extract<TimingEvent, { type: Type }>
  ) {
    let key = "beat" as keyof TimingEventBase
    const arr = this.events[type]!
    if (type == "ATTACKS") key = "seconds" as keyof TimingEventBase
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
    if (type == "ATTACKS") key = "seconds" as keyof TimingEventBase
    let low = 0,
      high = arr.length
    while (low <= high) {
      const mid = (low + high) >>> 1
      if (arr[mid][key] == event[key]) return mid
      if (arr[mid][key]! < event[key]!) low = mid + 1
      if (arr[mid][key]! > event[key]!) high = mid - 1
    }
    return -1
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
}
