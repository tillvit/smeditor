import { clamp } from "./Util.js";

export const TIMING_PROPS = [
  "OFFSET", "BPMS", "STOPS", "WARPS", "DELAYS", "LABELS",
  "SPEEDS", "SCROLLS", "TICKCOUNTS", "TIMESIGNATURES", "COMBOS", "FAKES",
  "ATTACKS", "BGCHANGES", "FGCHANGES"
]

export const BEAT_TIMING_PROPS = [
  "BPMS", "STOPS", "WARPS", "DELAYS"
]

export const BEAT_TIMING_PRIORITY = {WARPS: 1, WARP_DEST: 2, STOPS: 3, DELAYS: 4, BPMS: 5, default: 6}

export class TimingData {
  _fallback;
  _cache = {}
  constructor(fallbackTimingData) {
    this._fallback = fallbackTimingData
    for (let prop of TIMING_PROPS) {
      this[prop] = undefined
    }
  }

  parse(prop, data) {
    if (!TIMING_PROPS.includes(prop)) {
      console.log("Unknown TimingData Prop " + prop)
      return
    }
    if (prop == "OFFSET") {
      this.OFFSET = parseFloat(data);
      return;
    }
    if (this[prop] == undefined) {
      this[prop] = []
    }
    let entries = data.replaceAll(/[\n\r\t]/g,"").split(",")
    if (prop == "ATTACKS") entries = [data.replaceAll(/[\n\r\t]/g,"")]
    for (let str of entries) {
      if (prop == "ATTACKS"){
        let match;
        let regex = /TIME=([\d.]+):(END|LEN)=([\d.]+):MODS=([^:]+):/g
        while ((match = regex.exec(str)) != null) {
          let event = {
            type: "ATTACKS",
            second: parseFloat(match[1]),
            endType: match[2],
            value: parseFloat(match[3]),
            mods: match[4]
          }
          this.insert("ATTACKS", event, false)
        }
        return
      }
      let temp = str.split("=")
      if (temp.length < 2)
        continue
      let event = {
        type: prop,
        beat: parseFloat(temp[0]),
        value: parseFloat(temp[1])
      }
      if (prop == "SPEEDS") {
        event.delay = parseFloat(temp[2])
        if (temp[3] == "0") {
          event.unit = "B"
        }else{
          event.unit = "T"
        }
      }
      if (prop == "TIMESIGNATURES") {
        event.upper = parseInt(temp[1])
        event.lower = parseInt(temp[2])
        delete event.value
      }
      if (prop == "COMBOS") {
        event.hitMult = parseInt(temp[1])
        event.missMult = parseInt(temp[2] ?? temp[1])
        delete event.value
      }
      if (prop == "LABELS") {
        event.value = temp[1]
      }
      if (prop == "BGCHANGES" || prop == "FGCHANGES") {
        event.value = temp[1]
        event.updateRate = parseFloat(temp[2])
        event.crossFade = temp[3] == "1"
        event.stretchRewind = temp[4] == "1"
        event.stretchNoLoop = temp[5] == "1"
        event.effect = temp[6]
        event.file2 = temp[7]
        event.transition = temp[8]
        event.color1 = temp[9]
        event.color2 = temp[10]
      }
      this.insert(prop, event, false)
    }
  }

  insert(prop, event, doCache) {
    if (!TIMING_PROPS.includes(prop)) {
      console.log("Unknown TimingData Prop " + prop)
      return
    }
    if (prop == "OFFSET") return
    if (event.type == undefined) event.type = prop
    this.binsert(prop, event)
    if (doCache ?? true) this.reloadCache(prop)
  }

  delete(prop, event, doCache) {
    if (!TIMING_PROPS.includes(prop)) {
      console.log("Unknown TimingData Prop " + prop)
      return
    }
    if (prop == "OFFSET") return
    if (event.type == undefined) event.type = prop
    let i = this.bindex(prop, event)
    if (i > -1) {
      this[prop].splice(i, 1)
      if (doCache ?? true) this.reloadCache(prop)
    }
  }

  update(prop, event, doCache) {
    if (!TIMING_PROPS.includes(prop)) {
      console.log("Unknown TimingData Prop " + prop)
      return
    }
    if (prop == "OFFSET") {
      this.OFFSET = event
      this.reloadCache("OFFSET")
      return
    }
    if (event.type == undefined) event.type = prop
    let i = this.bindex(prop, event)
    if (i > -1) {
      this[prop][i] = event
      if (doCache ?? true) this.reloadCache(prop)
    }
  }


  buildBeatTimingDataCache() {
    let cache = this.getTimingData(...BEAT_TIMING_PROPS)
    cache.push(...this.getTimingData("WARPS").map(e => ({
      type: "WARP_DEST", 
      beat: e.beat + e.value, 
      value: e.value
    })))
    cache = cache.sort((a, b) => {
      if (a.beat == b.beat) return (BEAT_TIMING_PRIORITY[a.type] ?? 6) - (BEAT_TIMING_PRIORITY[b.type] ?? 6)
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
      if (event.type == "STOPS" || event.type == "DELAY") seconds += event.value;
    }
    
    this._cache.beatTiming = cache

    this._cache.stopBeats = {}
    this.getTimingData("STOPS").forEach(x => {
      this._cache.stopBeats[x.beat] = x
    });
  }

  buildEffectiveBeatTimingDataCache() {
    let cache = this.getTimingData("SCROLLS")
    let effBeat = 0
    for (let i = 0; i < cache.length-1; i++) {
      let event = cache[i]
      let beats = (cache[i+1].beat - event.beat)
      event.effBeat = effBeat 
      effBeat += event.value * beats
    }
    cache[cache.length-1].effBeat = effBeat
    this._cache.effBeatTiming = cache
  }

  buildSpeedsTimingDataCache() {
    let cache = this.getTimingData("SPEEDS").map(e => ({
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
    this._cache.events = TIMING_PROPS.slice(1).reduce((data, p) => data.concat(this[p] ?? this._fallback?.[p] ?? []),[])
    for (let event of this._cache.events) {
      if (!TIMING_PROPS.includes(event.type)) event.second = this.getSeconds(event.beat)
      if (event.type == "ATTACKS") event.beat = this.getBeat(event.second)
    }
    this._cache.events.sort((a,b)=>a.beat-b.beat)
  }

  getBeat(seconds) {
    if (this._cache.beatTiming == undefined) this.buildBeatTimingDataCache()
    let cache = this._cache.beatTiming
    let i = 0
    while (i+1 < cache.length && seconds > cache[i+1].second) i++
    if (i+1 < cache.length && seconds == cache[i+1].second) i++
    i = Math.max(0,i)
    let event = cache[i]
    let beat = event.beat
    let time_left_over = seconds - event.second
    let curbpm = this.getBPM(event.beat)
    if (event.type == "STOPS"|| event.type == "DELAYS") time_left_over -= event.value
    if (event.type == "BPMS") curbpm = event.value
    beat += Math.max(0,time_left_over) * curbpm/60
    return beat
  }

  getSeconds(beat) {
    if (this._cache.beatTiming == undefined) this.buildBeatTimingDataCache()
    let cache = this._cache.beatTiming
    let i = -1
    while (i+1 < cache.length && beat > cache[i+1].beat) i++
    if (i+1 < cache.length && beat == cache[i+1].beat) i++
    i = Math.max(0,i)
    let event = cache[i]
    let seconds = event.second
    let beats_left_over = beat - event.beat
    let curbpm = this.getBPM(event.beat)
    if (event.type == "STOPS" && beat > event.beat || event.type == "DELAYS") return seconds + Math.max(0,Math.max(0,beats_left_over * 60/curbpm) + event.value)
    if (event.type == "WARPS") return seconds
    if (event.type == "BPMS") curbpm = event.value
    seconds += beats_left_over * 60/curbpm
    return seconds
  }

  isBeatWarped(beat) {
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

  isBeatFaked(beat) {
    if (this.isBeatWarped(beat)) return true
    let fakes = this.getTimingData("FAKES")
    if (fakes == undefined) return false
    for (let event of fakes) {
      if (beat >= event.beat && beat < event.beat+event.value) return true
    }
    return false
  }

  getEffectiveBeat(beat) {
    if (this._cache.effBeatTiming == undefined) this.buildEffectiveBeatTimingDataCache()
    let cache = this._cache.effBeatTiming
    if (cache.length == 0) return beat
    let i = 0
    while (i+1 < cache.length && beat > cache[i+1].beat) i++
    let event = cache[i]
    let effBeat = event.effBeat
    let beats_left_over = beat - event.beat
    effBeat += beats_left_over * event.value
    return effBeat 
  }

  getSpeedMult(beat, seconds) {
    if (this._cache.speeds == undefined) this.buildSpeedsTimingDataCache()
    let cache = this._cache.speeds
    if (cache.length == 0) return beat
    let i = 0
    while (i+1 < cache.length && beat > cache[i+1].beat) i++
    let event = cache[i]
    if (event == undefined) return 1
    let time = beat - event.beat
    if (event.unit == "T") time = seconds - event.second
    let progress = clamp(time/event.delay,0,1)
    if (event.delay == 0) progress = 1
    let prev = cache[i-1]?.value ?? 1
    return progress * (event.value - prev) + prev 
  }

  getBPM(beat) {
    if (this._cache.stopBeats == undefined) this.buildBeatTimingDataCache()
    let bpms = this.getTimingData("BPMS")
    for (let i = 0; i < bpms.length; i++) {
      if (beat < bpms[i].beat) {
        // console.log(bpms[i-1])
        if (beat == bpms[i-1].beat && this._cache.stopBeats[bpms[i-1].beat]) i = Math.max(1,i-1)
        return bpms[i-1].value
      }
    }
    return bpms[bpms.length-1].value
  }

  getTimingEventAtBeat(prop, beat) {
    let entries = this.getTimingData(prop)
    if (!Array.isArray(entries)) return {}
    for (let i = 0; i < entries.length; i++) {
      if (beat < entries[i].beat) {
        return entries[i-1]
      }
    }
    return entries[entries.length-1]
  }

  reloadCache(prop) {
    if (prop == undefined || prop == "OFFSET" || BEAT_TIMING_PROPS.includes(prop)) this.buildBeatTimingDataCache()
    if (prop == "SCROLLS") this.buildEffectiveBeatTimingDataCache()
    if (prop == "SPEEDS") this.buildSpeedsTimingDataCache()
    this.buildTimingDataCache()
  }

  binsert(prop, item) {
    if (this[prop] == undefined) this[prop] = []
    let low = 0, high = this[prop].length;

    while (low < high) {
      let mid = (low + high) >>> 1;
      if (item.beat == undefined ? this[prop][mid].second < item.second : this[prop][mid].beat < item.beat) low = mid + 1;
      else high = mid;
    }
    this[prop].splice(low, 0, item);
  }

  bindex(prop, item) {
    if (this[prop] == undefined) return -1
    let low = 0, high = array.length;
    while (low <= high ){
      let mid = (low + high) >>> 1;
      if (item.beat == undefined) {
        if (this[prop][mid].beat == item.beat) return mid
        if (this[prop][mid].beat < item.beat) low = mid + 1;
        if (this[prop][mid].beat < item.beat) high = mid - 1;
      } else {
        if (this[prop][mid].second == item.second) return mid
        if (this[prop][mid].second < item.second) low = mid + 1;
        if (this[prop][mid].second < item.second) high = mid - 1;
      }
    }
    return -1
  }

  getTimingData(...props) {
    if (props.length == 0) return this._cache.events
    if (props.includes("OFFSET")) return this.OFFSET ?? this._fallback?.OFFSET ?? 0
    if (this._cache.events == undefined) this.buildTimingDataCache()
    return this._cache.events.filter(x=>props.includes(x.type))
  }
}