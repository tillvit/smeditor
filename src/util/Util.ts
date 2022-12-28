import { App } from "../App"

const ROTS = [0,-90,90,180]
export function getRotFromArrow(col: number): number {
  return ROTS[col]/180*Math.PI;
}

const QUANTS = [1, 1/2, 1/3, 1/4, 1/6, 1/8, 1/12, 1/16, 1/24]
export function getQuant(beat: number) {
  for (let i = 0; i < QUANTS.length; i++) {
    if (Math.abs(beat-Math.round(beat/QUANTS[i])*QUANTS[i]) < 0.01) {
      return i
    }
  }
  return 9
}

export function rgbtoHex(r: number, g: number, b: number): number {
  return (r << 16) + (g << 8) + (b)
}


export function roundDigit(num: number, scale: number): number {
  return parseFloat(num.toFixed(scale));
}

export function getFont() {
  return "Assistant, Helvetica, Arial"
}

let fpsTimes: number[] = []
let fps = false
export function getFPS(app: App) {
  if (!fps) {
    fps = true
    app.ticker.add(()=>{
      fpsTimes.push(Date.now())
      while (fpsTimes.length > 0 && fpsTimes[0] < Date.now() - 1000) {
        fpsTimes.shift()
      }
    })
  }
  return fpsTimes.length
}

let tpsTimes: number[] = []
export function getTPS() {
  return tpsTimes.length
}

export function tpsUpdate() {
  tpsTimes.push(Date.now())
  while (tpsTimes.length > 0 && tpsTimes[0] < Date.now() - 1000) {
    tpsTimes.shift()
  }
}

export function clamp(val: number, low: number, high: number): number {
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

export function bsearch<T>(arr: T[], value: number, property?: (a: T) => number): number {
  property = property ?? (a => (a as number))
  if (arr.length == 0) return -1
  if (value >= property(arr[arr.length-1])) {
    let mid = arr.length - 1
    while (mid > 0 && property(arr[mid-1]) == value) mid--
    return mid
  }
  let low = 0, high = arr.length;
  while (low <= high) {
    let mid = (low + high) >>> 1;
    if (property(arr[mid]) == value) {
      while (mid > 0 && property(arr[mid-1]) == value) mid--
      return mid
    }
    if (property(arr[mid]) < value) low = mid + 1;
    if (property(arr[mid]) > value) high = mid - 1;
  }
  return Math.max(0,high)
}

