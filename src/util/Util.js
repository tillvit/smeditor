import { app } from "../App.js";

const ROTS = [0,-90,90,180]
export function getRotFromArrow(col) {
  return ROTS[col]/180*Math.PI;
}

const QUANTS = [1, 1/2, 1/3, 1/4, 1/6, 1/8, 1/12, 1/16, 1/24]
export function getQuant(beat) {
  for (let i = 0; i < QUANTS.length; i++) {
    if (Math.abs(beat-Math.round(beat/QUANTS[i])*QUANTS[i]) < 0.01) {
      return i
    }
  }
  return 9
}

export function rgbtoHex(r, g, b) {
  return (r << 16) + (g << 8) + (b)
}


let fields = ["BPMS", "STOPS", "WARPS", "DELAYS"],
  order = {WARPS: 1, WARP_DEST: 2, STOPS: 3, DELAYS: 4, BPMS: 5, default: 6}
export function buildTimingEventCache(sm) {
  let events = []
  for (let i = 0; i < fields.length; i ++) {
    events.push(...sm[fields[i]].map(x => [...x,fields[i]]))
  }
  events.push(...sm["WARPS"].map(x => [x[0]+x[1],x[1],"WARP_DEST"]))
  events = events.sort((a, b) =>
    ((a[0]==b[0])?(order[a[2]] || order.default) - (order[b[2]] || order.default):a[0]-b[0])
  );
  sm._events = buildSecondsCache(events,sm)
  // events = events.map(x => [...x,getSeconds2(x[0],sm)])
  console.log(events)
  return events
}

function buildSecondsCache(events, sm) {
  let seconds = 0
  let lastbeat = 0
  let curbpm = sm["BPMS"][0][1]
  let warping = false
  for (let i = 0; i < events.length; i++) {
    let event = events[i]
    let time_to_event = (event[0] - lastbeat) * 60/curbpm
    lastbeat = event[0]
    if (!warping)
      seconds += time_to_event
    if (event[2] == "WARPS" ){
      warping = true
    }
    if (event[2] == "WARP_DEST" ){
      warping = false
    }
    if (event[2] == "BPMS") {
      curbpm = event[1]
    }
    
    events[i] = [...events[i],seconds - sm["OFFSET"]]
    if (event[2] == "STOPS" ){
      seconds += event[1]
    }
  }
}

export function getBeat(seconds, sm) {
  let i = 0
  while (i+1 < sm._events.length && seconds > sm._events[i+1][3]) {i++}
  if (i+1 < sm._events.length && seconds == sm._events[i+1][3]) i++
  i = Math.max(0,i)
  let beat = sm._events[i][0]
  let t = seconds - sm._events[i][3]
  let curbpm = getBPM(sm._events[i][0], sm)
  let event = sm._events[i]
  if (event[2] == "STOPS"){
    t -= event[1]
  }
  // if (event[2] == "WARPS"){
  //   beat += event[1]
  // }
  if (event[2] == "BPMS") {
    curbpm = event[1]
  }
  beat += Math.max(0,t) * curbpm/60
  return beat
  
}

export function getSeconds(beat, sm) {
  let i = -1
  while (i+1 < sm._events.length && beat > sm._events[i+1][0]) {i++}
  if (i+1 < sm._events.length && beat == sm._events[i+1][0]) i++
  i = Math.max(0,i)
  let seconds = sm._events[i][3]
  let beats = beat - sm._events[i][0]
  let curbpm = getBPM(sm._events[i][0], sm)
  let event = sm._events[i]
  if (event[2] == "STOPS"){
    if (beat > event[0]){
      seconds += Math.max(0,Math.max(0,beats * 60/curbpm) +event[1])
      beats = 0
    }else{
      beats = 0
    }
  }
  if (event[2] == "WARPS") {
    beats = 0
  }
  if (event[2] == "BPMS") {
    curbpm = event[1]
  }
  // seconds += Math.max(0,beats * 60/curbpm)
  seconds += beats * 60/curbpm
    // console.log(sm._events[i])
  i++
  return seconds
}
export function getSecondsNoTiming(beat, sm) {
  let i = 0
  while (i < sm._events.length && beat >= sm._events[i][0]) {i++}
  if (i == 0) {
    return 0
  }
  let seconds = sm._events[i-1][3]
  let beats = beat - sm._events[i-1][0]
  let curbpm = getBPM(sm._events[i-1][0], sm)
  let event = sm._events[i-1]
  if (event[2] == "BPMS") {
    curbpm = event[1]
  }
  seconds += Math.max(0,beats * 60/curbpm)
  return seconds 
}

export function getBeat2(seconds, sm) {
  let t = seconds + sm["OFFSET"]
  let beat = 0
  let curbpm = sm["BPMS"][0][1]
  for (let i = 0; i < sm._events.length; i++) {
    let event = sm._events[i]
    let time_to_event = (event[0] - beat) * 60/curbpm
    if (t >= time_to_event) {
      beat = event[0]
      t -= time_to_event
      if (event[2] == "STOPS"){
        t -= event[1]
      }
      if (event[2] == "BPMS") {
        curbpm = event[1]
      }
    }else{
      // console.log(t)
      beat += Math.max(0,(t) * curbpm/60)
      return beat
    }
  }
  beat += (t) * curbpm/60
  return beat
}

export function getSeconds2(beat, sm) { 
  let ti = Date.now()
  let seconds = 0
  let lastbeat = 0
  let curbpm = sm["BPMS"][0][1]
    
  for (let i = 0; i < sm._events.length; i++) {
    let event = sm._events[i]
    
    if (beat >= event[0]) {
        let time_to_event = (event[0] - lastbeat) * 60/curbpm
    
      seconds += time_to_event
      lastbeat = event[0]
      
      
      if (event[2] == "STOPS" &&  beat >= event[0]+event[1]){
        seconds += event[1]
      }
      if (event[2] == "BPMS") {
        curbpm = event[1]
      }
      
    }else{
      seconds += Math.max(0,(beat - lastbeat) * 60/curbpm)
      return seconds - sm["OFFSET"]
    }
  }
  seconds += Math.max(0,(beat - lastbeat) * 60/curbpm)
  return seconds - sm["OFFSET"]
}

export function isWarped(beat, sm) {
  for (let e of sm._events) {
    if (e[2] == "WARPS") {
      if (beat > e[0] && beat < e[0]+e[1]) return true
    }
    if (e[2] == "STOPS" && e[1] < 0) {
      let bpmatstop = getBPM(e[0], sm)
      if (beat > e[0] && beat < e[0]+e[1]*-1*bpmatstop/60) return true
    }
  }

  return false
}

export function getBPM(beat, sm) {
  let bpms = sm["BPMS"]
  for (let i = 0; i < bpms.length; i++) {
    if (beat < bpms[i][0]) {
      return bpms[i-1][1]
    }
  }
  return bpms[bpms.length-1][1]
}


// export function getSeconds(beat, bpms, offset) { 
//   let seconds = 0
    
//   for (let i = 0; i < bpms.length; i++) {
//     if (bpms[i+1] == undefined) {
//       seconds += (beat - bpms[i][0]) * 60/bpms[i][1]
//       break
//     }
//     if (beat > bpms[i+1][0]) {
//       seconds += (bpms[i+1][0] - bpms[i][0]) * 60/bpms[i][1]
//     }else{

//       seconds += (beat - bpms[i][0]) * 60/bpms[i][1]
//       break
//     }
//   }
  
//   return seconds - offset
// }

export function roundDigit(g, v) {
  if (typeof g != "number") return undefined
  return parseFloat(g.toFixed(v))
}

export function getFont() {
  return "Assistant, Helvetica, Arial"
}

let times = [1,2,3]
let fps = false
export function getFPS() {
  if (!fps) {
    fps = true
    app.ticker.add(()=>{
      times.push(Date.now())
      while (times.length > 0 && times[0] < Date.now() - 1000) {
        times.shift()
      }
    })
  }
  return times.length

}

export function clamp(val, low, high) {
  return Math.max(low,Math.min(high, val))
} 

window.getBPM = getBPM
window.getBeat = getBeat
window.getSeconds = getSeconds
window.getSecondsNoTiming = getSecondsNoTiming

export function getBrowser() {
  const { userAgent } = navigator
  let match = userAgent.match(/(opera|chrome|safari|firefox|msie|trident(?=\/))\/?\s*(\d+)/i) || []
  let temp

  if (/trident/i.test(match[1])) {
    temp = /\brv[ :]+(\d+)/g.exec(userAgent) || []

    return `IE ${temp[1] || ''}`
  }

  if (match[1] === 'Chrome') {
    temp = userAgent.match(/\b(OPR|Edge)\/(\d+)/)

    if (temp !== null) {
      return temp.slice(1).join(' ').replace('OPR', 'Opera')
    }

    temp = userAgent.match(/\b(Edg)\/(\d+)/)

    if (temp !== null) {
      return temp.slice(1).join(' ').replace('Edg', 'Edge (Chromium)')
    }
  }

  match = match[2] ? [ match[1], match[2] ] : [ navigator.appName, navigator.appVersion, '-?' ]
  temp = userAgent.match(/version\/(\d+)/i)

  if (temp !== null) {
    match.splice(1, 1, temp[1])
  }

  return match.join(' ')
}