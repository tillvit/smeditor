
import { clamp } from "../../util/Util"
import { TimingEvent, WarpTimingEvent, StopTimingEvent, AttackTimingEvent, TIMING_EVENT_NAMES, BeatCacheTimingEvent, SpeedTimingEvent, TimingProperty, TimingEventProperty, TimingEventBase, ScrollCacheTimingEvent } from "./TimingTypes"


type TimingPropertyCollection = {
  [key in TimingEvent["type"]]?: Extract<TimingEvent, {type: key}>[]
}

type TimingCache = {
  events: TimingPropertyCollection
  beatTiming: BeatCacheTimingEvent[]
  effectiveBeatTiming: ScrollCacheTimingEvent[]
  speeds: SpeedTimingEvent[]
  stopBeats: {[key: number]: StopTimingEvent}
  sortedEvents?: TimingEvent[]
}

const BEAT_TIMING_PRIORITY = ["WARPS", "WARP_DEST", "STOPS", "DELAYS", "BPMS"] as const

export class TimingData {

  _fallback?: TimingData
  _cache: TimingCache = {
    events: {},
    beatTiming: [],
    effectiveBeatTiming: [],
    speeds: [],
    stopBeats: {},
  }
  events: TimingPropertyCollection = {}
  offset?: number

  constructor(fallbackTimingData?: TimingData) {
    this._fallback = fallbackTimingData
  }

  parse(type: TimingProperty, data: string) {
    if (type == "OFFSET") {
      this.offset = parseFloat(data);
      return;
    }

    this.events[type] ||= []

    let entries = data.replaceAll(/[\n\r\t]/g,"").split(",")
    if (type == "ATTACKS") entries = [data.replaceAll(/[\n\r\t]/g,"")]
    for (let str of entries) {
      if (type == "ATTACKS"){
        let match;
        let regex = /TIME=([\d.]+):(END|LEN)=([\d.]+):MODS=([^:]+):/g
        while ((match = regex.exec(str)) != null) {
          let event: AttackTimingEvent = {
            type: "ATTACKS",
            second: parseFloat(match[1]),
            endType: match[2] as "END"|"LEN",
            value: parseFloat(match[3]),
            mods: match[4]
          }
          this.insert("ATTACKS", event, false)
        }
        return
      }
      let temp = str.split("=")
      if (temp.length < 2) continue
      
      let event: TimingEvent | undefined
      switch(type) {
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
            value: parseFloat(temp[1])
          }
          break
        case "LABELS":
          event = {
            type: type,
            beat: parseFloat(temp[0]),
            value: temp[1]
          }
          break
        case "SPEEDS":
          event = {
            type: type,
            beat: parseFloat(temp[0]),
            value: parseFloat(temp[1]),
            delay: parseFloat(temp[2]),
            unit: temp[3] == "0" ? "B" : "T"
          }
          break
        case "TIMESIGNATURES":
          event = {
            type: type,
            beat: parseFloat(temp[0]),
            upper: parseInt(temp[1]),
            lower: parseInt(temp[2])
          }
          break
        case "COMBOS":
          event = {
            type: type,
            beat: parseFloat(temp[0]),
            hitMult: parseInt(temp[1]),
            missMult: parseInt(temp[2] ?? temp[1])
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
            color2: temp[10]
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
    let i = this.bindex(type, event)
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
    let i = this.bindex(type, event as TimingEvent)
    if (i > -1) {
      (this.events[type]!)[i] = event as TimingEvent
      if (doCache ?? true) this.reloadCache(type)
    }
  }

  buildBeatTimingDataCache() {
    let cache: BeatCacheTimingEvent[] = this.getTimingData("BPMS", "STOPS", "WARPS", "DELAYS")
    cache = cache.concat(this.getTimingData("WARPS").map((event: WarpTimingEvent) => ({
      type: "WARP_DEST", 
      beat: event.beat + event.value, 
      value: event.value
    })))
    cache = cache.sort((a, b) => {
      if (a.beat == b.beat) return (BEAT_TIMING_PRIORITY.indexOf(a.type) ?? 6) - (BEAT_TIMING_PRIORITY.indexOf(a.type) ?? 6)
      return (a.beat-b.beat)
    })
    let seconds = 0
    let lastbeat = 0
    let curbpm = this.getTimingData("BPMS")[0].value
    let warping = false
    let offset = this.getTimingData("OFFSET")
    for (let i = 0; i < cache.length; i++) {
      let event = cache[i]
      let time_to_event = (event.beat - lastbeat) * 60/curbpm
      lastbeat = event.beat
      if (!warping) seconds += time_to_event
      if (event.type == "WARPS") warping = true
      if (event.type == "WARP_DEST") warping = false
      if (event.type == "BPMS") curbpm = event.value
      cache[i].second = seconds - offset
      if (event.type == "STOPS" || event.type == "DELAYS") seconds += event.value;
    }
    
    this._cache.beatTiming = cache

    this._cache.stopBeats = {}
    this.getTimingData("STOPS").forEach(x => {
      this._cache.stopBeats![x.beat] = x
    });
  }

  buildEffectiveBeatTimingDataCache() {
    let cache: ScrollCacheTimingEvent[] = this.getTimingData("SCROLLS")
    let effBeat = 0
    if (cache.length == 0) {
      this._cache.effectiveBeatTiming = []
      return
    }
    for (let i = 0; i < cache.length-1; i++) {
      let event = cache[i]
      let beats = (cache[i+1].beat - event.beat)
      event.effectiveBeat = effBeat 
      effBeat += event.value * beats
    }
    cache[cache.length-1].effectiveBeat = effBeat
    this._cache.effectiveBeatTiming = cache
  }

  buildSpeedsTimingDataCache() {
    let cache: SpeedTimingEvent[] = this.getTimingData("SPEEDS").map(e => ({
      type: e.type,
      beat: e.beat, 
      value: e.value,
      delay: e.delay,
      unit: e.unit,
      second: this.getSeconds(e.beat)
    }))
    this._cache.speeds = cache
  }

  buildTimingDataCache() {
    this._cache.sortedEvents = TIMING_EVENT_NAMES.reduce((data, type) => data.concat(this.events[type] ?? this._fallback?.events[type] ?? []),[] as any)
    for (let event of this._cache.sortedEvents!) {
      if (!TIMING_EVENT_NAMES.includes(event.type)) event.second = this.getSeconds(event.beat!)
      if (event.type == "ATTACKS") event.beat = this.getBeat(event.second)
    }
    this._cache.sortedEvents!.sort((a,b)=>a.beat!-b.beat!)
    for (let type of TIMING_EVENT_NAMES) {
      this._cache.events[type] = this.getTimingData(type) as any
    }
    console.log(JSON.parse(JSON.stringify(this._cache)))
  }

  searchCache<Type, Prop extends keyof Type>(cache: Type[], property: Prop, value: number) {
    if (!isFinite(value)) return 0
    if (cache == undefined) return -1
    if (cache.length == 0) return -1
    if (value >= cache[cache.length-1][property]) {
      let mid = cache.length - 1
      while (mid > 0 && cache[mid-1][property] == value) mid--
      return mid
    }
    let low = 0, high = cache.length;
    while (low <= high) {
      let mid = (low + high) >>> 1;
      if (cache[mid][property] == value) {
        while (mid > 0 && cache[mid-1][property] == value) mid--
        return mid
      }
      if (cache[mid][property] < value) low = mid + 1;
      if (cache[mid][property] > value) high = mid - 1;
    }
    return Math.max(0,high)
  }

  getBeat(seconds: number): number {
    if (this._cache.beatTiming == undefined) this.buildBeatTimingDataCache()
    let cache = this._cache.beatTiming
    let i = this.searchCache(cache, "second", seconds)
    let event = cache[i]
    let beat = event.beat
    let time_left_over = seconds - event.second!
    let curbpm = this.getBPM(event.beat)
    if (event.type == "STOPS"|| event.type == "DELAYS") time_left_over -= event.value
    if (event.type == "BPMS") curbpm = event.value
    beat += Math.max(0,time_left_over) * curbpm/60
    return beat
  }

  getSeconds(beat: number): number {
    if (!isFinite(beat)) return 0
    if (this._cache.beatTiming == undefined) this.buildBeatTimingDataCache()
    let cache = this._cache.beatTiming
    let i = this.searchCache(cache, "beat", beat)
    let event = cache[i]
    let seconds = event.second!
    let beats_left_over = beat - event.beat
    let curbpm = this.getBPM(event.beat)
    if (event.type == "STOPS" && beat > event.beat || event.type == "DELAYS") return seconds + Math.max(0,Math.max(0,beats_left_over * 60/curbpm) + event.value)
    if (event.type == "WARPS") return seconds
    if (event.type == "BPMS") curbpm = event.value
    seconds += beats_left_over * 60/curbpm
    return seconds
  }

  isBeatWarped(beat: number): boolean {
    if (!isFinite(beat)) return false
    if (this._cache.beatTiming == undefined) this.buildBeatTimingDataCache()
    for (let event of this._cache.beatTiming) {
      if (beat < event.beat) continue
      if (event.type == "WARPS" && beat < event.beat+event.value) return true
      if ((event.type == "STOPS" || event.type == "DELAYS") && (event.value < 0)) {
        let bpmatstop = this.getBPM(event.beat)
        if (beat < event.beat+event.value*-1*bpmatstop/60) return true
      }
    }
    return false
  }

  isBeatFaked(beat: number): boolean {
    if (!isFinite(beat)) return false
    if (this.isBeatWarped(beat)) return true
    let fakes = this.getTimingData("FAKES")
    if (fakes == undefined) return false
    for (let event of fakes) {
      if (beat >= event.beat && beat < event.beat+event.value) return true
    }
    return false
  }

  getEffectiveBeat(beat: number): number {
    if (!isFinite(beat)) return 0
    if (this._cache.effectiveBeatTiming == undefined) this.buildEffectiveBeatTimingDataCache()
    let cache = this._cache.effectiveBeatTiming
    if (cache.length == 0) return beat
    let i = this.searchCache(cache, "beat", beat)
    let event = cache[i]
    let effBeat = event.effectiveBeat!
    let beats_left_over = beat - event.beat
    effBeat += beats_left_over * event.value
    return effBeat 
  }

  getSpeedMult(beat: number, seconds: number): number {
    if (!isFinite(beat) || !isFinite(seconds)) return 0
    if (this._cache.speeds == undefined) this.buildSpeedsTimingDataCache()
    let cache = this._cache.speeds
    if (cache.length == 0) return 1
    let i = this.searchCache(cache, "beat", beat)
    let event = cache[i]
    if (event == undefined) return 1
    let time = beat - event.beat
    if (event.unit == "T") time = seconds - event.second!
    let progress = clamp(time/event.delay,0,1)
    if (event.delay == 0) progress = 1
    let prev = cache[i-1]?.value ?? 1
    return progress * (event.value - prev) + prev 
  }

  getBPM(beat: number): number {
    if (!isFinite(beat)) return 1
    if (this._cache.stopBeats == undefined) this.buildBeatTimingDataCache()
    let bpms = this.getTimingData("BPMS")
    for (let i = 0; i < bpms.length; i++) {
      if (beat < bpms[i].beat) {
        if (beat == bpms[i-1].beat && this._cache.stopBeats[bpms[i-1].beat]) i = Math.max(1,i-1)
        return bpms[i-1].value
      }
    }
    return bpms[bpms.length-1].value
  }

  getTimingEventAtBeat<Type extends TimingEventProperty>(prop: Type, beat: number): Extract<TimingEvent, {type: Type}> | undefined {
    let entries = this.getTimingData(prop)
    if (!Array.isArray(entries)) return undefined
    return entries[this.searchCache(entries, "beat", beat)]
  }

  reloadCache(prop?: TimingProperty) {
    if (prop == undefined || prop == "OFFSET" || BEAT_TIMING_PRIORITY.includes(prop as any)) this.buildBeatTimingDataCache()
    if (prop == undefined || prop == "SCROLLS") this.buildEffectiveBeatTimingDataCache()
    if (prop == undefined || prop == "SPEEDS") this.buildSpeedsTimingDataCache()
    if (prop == undefined) this.buildTimingDataCache()
  }

  binsert<Type extends TimingEventProperty>(type: Type, event: Extract<TimingEvent, {type: Type}>) {
    let key = "beat" as keyof TimingEventBase;
    let arr = this.events[type]!
    if (type == "ATTACKS") key = "seconds" as keyof TimingEventBase;
    let low = 0, high = arr.length;
    while (low < high) {
      let mid = (low + high) >>> 1;
      if (arr[mid][key]! < event[key]!) low = mid + 1;
      else high = mid;
    }
    arr.splice(low, 0, event);
  }

  bindex(type: TimingEventProperty, event: TimingEventBase): number {
    let key = "beat" as keyof TimingEventBase;
    let arr = this.events[type]!
    if (type == "ATTACKS") key = "seconds" as keyof TimingEventBase;
    let low = 0, high = arr.length;
    while (low <= high ){
      let mid = (low + high) >>> 1;
      if (arr[mid][key] == event[key]) return mid
      if (arr[mid][key]! < event[key]!) low = mid + 1;
      if (arr[mid][key]! > event[key]!) high = mid - 1;
    }
    return -1
  }

  getTimingData(): TimingEvent[]
  getTimingData(...props: ["OFFSET"]): number
  getTimingData<Type extends TimingProperty>(...props: Type[]): Extract<TimingEvent, {type: Type}>[]
  getTimingData(...props: TimingProperty[]) {
    if (props.length == 0) return this._cache.sortedEvents
    if (props.includes("OFFSET")) return this.offset ?? this._fallback?.offset ?? 0
    if (props.length == 1 && props[0] in this._cache.events) return this._cache.events[props[0] as TimingEventProperty]
    if (this._cache.sortedEvents == undefined) this.buildTimingDataCache()
    let events = this._cache.sortedEvents!.filter((event) => props.includes(event.type))
    return events
  }
}
