import { decode, encode } from "base85"
import { Buffer } from "buffer"
import { Parser } from "expr-eval"
import { DisplayObject } from "pixi.js"
import { isHoldNote, PartialNotedata } from "../chart/sm/NoteTypes"

declare global {
  interface Performance {
    memory?: {
      /** The maximum size of the heap, in bytes, that is available to the context. */
      jsHeapSizeLimit: number
      /** The total allocated heap size, in bytes. */
      totalJSHeapSize: number
      /** The currently active segment of JS heap, in bytes. */
      usedJSHeapSize: number
    }
  }
}

const QUANTS = [
  1,
  1 / 2,
  1 / 3,
  1 / 4,
  1 / 6,
  1 / 8,
  1 / 12,
  1 / 16,
  1 / 24,
  1 / 48,
]
export function getQuantIndex(beat: number) {
  for (let i = 0; i < QUANTS.length; i++) {
    if (Math.abs(beat - Math.round(beat / QUANTS[i]) * QUANTS[i]) < 0.01) {
      return i
    }
  }
  return 9
}

export function getDivision(beat: number) {
  return 4 / QUANTS[getQuantIndex(beat)]
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

export function lighten(col: number, gamma: number): number {
  let r = col >> 16
  let g = (col >> 8) & 0xff
  let b = col & 0xff
  r = clamp(r * gamma, 0, 255)
  g = clamp(g * gamma, 0, 255)
  b = clamp(b * gamma, 0, 255)
  return rgbtoHex(r, g, b)
}

export function roundDigit(num: number, scale: number): number {
  return Math.round(num * Math.pow(10, scale)) / Math.pow(10, scale)
}

export function getFont() {
  return "Assistant, Helvetica, Arial"
}

const fpsTimes: number[] = []
export function getFPS() {
  return fpsTimes.length
}

export function fpsUpdate() {
  fpsTimes.push(Date.now())
  while (fpsTimes.length > 0 && fpsTimes[0] < Date.now() - 1000) {
    fpsTimes.shift()
  }
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

export function getMemoryString(): string {
  if (!performance?.memory) return "- MB"
  return Math.round(performance.memory.usedJSHeapSize / 1048576) + " MB"
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
  while (low <= high && low < arr.length) {
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

export function capitalize(str: string): string {
  if (str == "") return ""
  return str.slice(0, 1).toUpperCase() + str.slice(1).toLowerCase()
}

export function gcd2(a: number, b: number): number {
  if (!b) return b === 0 ? a : NaN
  return gcd2(b, a % b)
}
export function gcd(array: number[]) {
  let n = 0
  for (let i = 0; i < array.length; ++i) n = gcd2(array[i], n)
  return n
}
export function lcm2(a: number, b: number): number {
  return (a * b) / gcd2(a, b)
}
export function lcm(array: number[]): number {
  let n = 1
  for (let i = 0; i < array.length; ++i) n = lcm2(array[i], n)
  return n
}

export function getErrorMessage(error: unknown) {
  if (error instanceof Error) return error.message
  return String(error)
}

export function isNumericKeyPress(event: KeyboardEvent) {
  if (
    ![
      "Backspace",
      "Tab",
      "Escape",
      "Enter",
      "1",
      "2",
      "3",
      "4",
      "5",
      "6",
      "7",
      "8",
      "9",
      "0",
      "+",
      "-",
      "*",
      "/",
      ".",
      "ArrowLeft",
      "ArrowRight",
      "ArrowUp",
      "ArrowDown",
      "Delete",
      "x",
      "c",
      "a",
      "A",
      "C",
      "X",
    ].includes(event.key)
  )
    return false
  if (
    ["X", "C", "A", "a", "c", "x"].includes(event.key) &&
    !event.metaKey &&
    !event.ctrlKey
  )
    return false
  return true
}

export function basename(path: string, ext?: string) {
  let f = posixSplitPath(path)[2]
  if (ext && f.slice(-1 * ext.length) === ext) {
    f = f.slice(0, f.length - ext.length)
  }
  return f
}

export function dirname(path: string) {
  const result = posixSplitPath(path)
  const root = result[0]
  let dir = result[1]

  if (!root && !dir) return ""

  if (dir) dir = dir.slice(0, dir.length - 1)

  return root + dir
}

export function extname(path: string) {
  return posixSplitPath(path)[3]
}

const splitPathRe = /^(\/?|)([\s\S]*?)((?:\.{1,2}|[^/]+?|)(\.[^./]*|))(?:[/]*)$/

function posixSplitPath(filename: string) {
  return splitPathRe.exec(filename)!.slice(1)
}

export function unpackValue(bytes: number[]): number {
  let total = 0
  let numBytes = 0
  let curByte = 129
  while ((curByte & 0x80) != 0) {
    const byte = bytes.shift()
    if (!byte) break
    total = total | ((byte & 0x7f) << (7 * numBytes++))
    curByte = byte
  }
  return total
}

export function packValue(value: number): number[] {
  const bytes = []
  let finished = false
  while (!finished) {
    let byte = value & 0x7f
    value = value >> 7
    finished = value == 0
    if (!finished) byte = byte | 0x80
    bytes.push(byte)
  }
  return bytes
}

export function decodeNotes(data: string): PartialNotedata | undefined {
  if (data.startsWith("ArrowVortex:notes:")) {
    const decoded = decode("<~" + data.slice(18) + "~>", "ascii85")
    if (decoded !== false) {
      const data_arr = [...new Uint8Array(decoded.buffer)]
      const pad = (4 - (data_arr.length % 4)) % 4
      data_arr.push(...new Array(pad).fill(0))
      if (data_arr.shift() != 0) return
      const noteCount = unpackValue(data_arr)
      const noteList: PartialNotedata = []
      for (let i = 0; i < noteCount; i++) {
        const header = data_arr.shift()
        if (header == undefined) return
        const col = header & 0x7f
        if ((header & 0x80) != 0) {
          const start = unpackValue(data_arr)
          const end = unpackValue(data_arr)
          const type = data_arr.shift()

          if (type == undefined || type > 4) continue
          const noteType = ["Hold", "Mine", "Roll", "Lift", "Fake"][type]
          if (start == end) {
            if (noteType == "Hold" || noteType == "Roll") continue
            noteList.push({
              type: noteType,
              beat: start / 48,
              col,
            })
          } else {
            if (noteType == "Mine" || noteType == "Fake" || noteType == "Lift")
              continue
            noteList.push({
              type: noteType,
              beat: start / 48,
              hold: (end - start) / 48,
              col,
            })
          }
        } else {
          noteList.push({
            type: "Tap",
            beat: unpackValue(data_arr) / 48,
            col,
          })
        }
      }
      return noteList
    }
  }
}

export function encodeNotes(notes: PartialNotedata): string {
  const bytes = [0]
  bytes.push(...packValue(notes.length))
  for (const note of notes) {
    if (note.type == "Tap") {
      const start = Math.round(note.beat * 48)
      bytes.push(note.col)
      bytes.push(...packValue(start))
    } else {
      bytes.push(note.col + 0x80)
      const start = Math.round(note.beat * 48)
      let hold = 0
      if (isHoldNote(note)) hold = note.hold
      const end = Math.round(hold * 48) + start
      bytes.push(...packValue(start))
      bytes.push(...packValue(end))
      bytes.push(["Hold", "Mine", "Roll", "Lift", "Fake"].indexOf(note.type))
    }
  }
  return (
    "ArrowVortex:notes:" + encode(Buffer.from(bytes), "ascii85").slice(2, -2)
  )
}
