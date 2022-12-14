import { Parser } from "expr-eval"
import { DisplayObject } from "pixi.js"
import { App } from "../App"

const QUANTS = [1, 1 / 2, 1 / 3, 1 / 4, 1 / 6, 1 / 8, 1 / 12, 1 / 16, 1 / 24]
export function getQuant(beat: number) {
  for (let i = 0; i < QUANTS.length; i++) {
    if (Math.abs(beat - Math.round(beat / QUANTS[i]) * QUANTS[i]) < 0.01) {
      return i
    }
  }
  return 9
}

export function lerp(v0: number, v1: number, t: number): number {
  return v0 * (1 - t) + v1 * t
}

export function unlerp(min: number, max: number, value: number) {
  return (value - min) / (max - min)
}

export function rgbtoHex(r: number, g: number, b: number): number {
  return (r << 16) + (g << 8) + b
}

export function roundDigit(num: number, scale: number): number {
  return Math.round(num * Math.pow(10, scale)) / Math.pow(10, scale)
}

export function getFont() {
  return "Assistant, Helvetica, Arial"
}

const fpsTimes: number[] = []
let fps = false
export function getFPS(app: App) {
  if (!fps) {
    fps = true
    app.ticker.add(() => {
      fpsTimes.push(Date.now())
      while (fpsTimes.length > 0 && fpsTimes[0] < Date.now() - 1000) {
        fpsTimes.shift()
      }
    })
  }
  return fpsTimes.length
}

const tpsTimes: number[] = []
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
  return Math.max(low, Math.min(high, val))
}

export function getBrowser() {
  const { userAgent } = navigator
  let match =
    userAgent.match(
      /(opera|chrome|safari|firefox|msie|trident(?=\/))\/?\s*(\d+)/i
    ) || []
  let temp

  if (/trident/i.test(match[1])) {
    temp = /\brv[ :]+(\d+)/g.exec(userAgent) || []

    return `IE ${temp[1] || ""}`
  }

  if (match[1] === "Chrome") {
    temp = userAgent.match(/\b(OPR|Edge)\/(\d+)/)

    if (temp !== null) {
      return temp.slice(1).join(" ").replace("OPR", "Opera")
    }

    temp = userAgent.match(/\b(Edg)\/(\d+)/)

    if (temp !== null) {
      return temp.slice(1).join(" ").replace("Edg", "Edge (Chromium)")
    }
  }

  match = match[2]
    ? [match[1], match[2]]
    : [navigator.appName, navigator.appVersion, "-?"]
  temp = userAgent.match(/version\/(\d+)/i)

  if (temp !== null) {
    match.splice(1, 1, temp[1])
  }

  return match.join(" ")
}

export function bsearch<T>(
  arr: T[],
  value: number,
  property?: (a: T) => number
): number {
  property = property ?? (a => a as number)
  if (arr.length == 0) return -1
  if (value >= property(arr[arr.length - 1])) {
    let mid = arr.length - 1
    while (mid > 0 && property(arr[mid - 1]) == value) mid--
    return mid
  }
  let low = 0,
    high = arr.length
  while (low <= high) {
    let mid = (low + high) >>> 1
    if (property(arr[mid]) == value) {
      while (mid > 0 && property(arr[mid - 1]) == value) mid--
      return mid
    }
    if (property(arr[mid]) < value) low = mid + 1
    if (property(arr[mid]) > value) high = mid - 1
  }
  return Math.max(0, high)
}

export function isStringNumeric(str: unknown): str is number {
  return typeof str == "string" && !isNaN(Number(str))
}

export function isStringBoolean(str: unknown): str is boolean {
  return str == "false" || str == "true"
}

export function safeParse(expr: string): number {
  try {
    return Parser.evaluate(expr)
  } catch {
    return 0
  }
}

export function destroyChildIf<Child extends DisplayObject>(
  children: Child[],
  predicate: (child: Child, index: number) => boolean
) {
  let i = children.length
  if (children.length == 0) return
  while (i--) {
    if (predicate(children[i], i)) {
      children[i].destroy()
    }
  }
}

export function stdDev(array: number[]): number {
  if (array.length == 0) return 0
  const n = array.length
  const mean = array.reduce((a, b) => a + b) / n
  return Math.sqrt(
    array.map(x => Math.pow(x - mean, 2)).reduce((a, b) => a + b) / n
  )
}

export function median(array: number[]): number {
  if (array.length == 0) return 0
  array = [...array]
  array.sort((a, b) => a - b)
  const half = Math.floor(array.length / 2)
  if (array.length % 2) return array[half]
  return (array[half - 1] + array[half]) / 2.0
}

export function mean(array: number[]): number {
  if (array.length == 0) return 0
  return array.reduce((a, b) => a + b) / array.length
}
