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


export function roundDigit(num, scale) {
  if (typeof num != "number") return undefined
  if(!("" + num).includes("e")) {
    return +(Math.round(num + "e+" + scale)  + "e-" + scale);
  } else {
    var arr = ("" + num).split("e");
    var sig = ""
    if(+arr[1] + scale > 0) {
      sig = "+";
    }
    return +(Math.round(+arr[0] + "e" + sig + (+arr[1] + scale)) + "e-" + scale);
  }
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