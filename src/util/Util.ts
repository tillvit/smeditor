import { Parser } from "expr-eval"
import { DisplayObject } from "pixi.js"
import { PartialNotedata, isHoldNote } from "../chart/sm/NoteTypes"
import { TimingEvent, TimingEventProperty } from "../chart/sm/TimingTypes"
import { a85decode, a85encode } from "./Ascii85"

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

export function blendColors(colorA: string, colorB: string, amount: number) {
  const [rA, gA, bA] = colorA.match(/\w\w/g)!.map(c => parseInt(c, 16))
  const [rB, gB, bB] = colorB.match(/\w\w/g)!.map(c => parseInt(c, 16))
  const r = Math.round(rA + (rB - rA) * amount)
    .toString(16)
    .padStart(2, "0")
  const g = Math.round(gA + (gB - gA) * amount)
    .toString(16)
    .padStart(2, "0")
  const b = Math.round(bA + (bB - bA) * amount)
    .toString(16)
    .padStart(2, "0")
  return "#" + r + g + b
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
    const decoded = a85decode(data.slice(18))
    if (decoded !== false) {
      const data_arr = Array.from(decoded)
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
    "ArrowVortex:notes:" +
    a85encode(bytes)
      .map(byte => String.fromCharCode(byte))
      .join("")
  )
}

const eventTypeNumbers: TimingEventProperty[] = [
  "BPMS",
  "STOPS",
  "DELAYS",
  "WARPS",
  "TIMESIGNATURES",
  "TICKCOUNTS",
  "COMBOS",
  "SPEEDS",
  "SCROLLS",
  "FAKES",
  "LABELS",
  "ATTACKS",
  "BGCHANGES",
  "FGCHANGES",
]

function packUint32(x: number): number[] {
  const buffer = new ArrayBuffer(4)
  const dataView = new DataView(buffer)
  dataView.setUint32(0, x, true)
  return Array.from(new Uint8Array(buffer))
}

function unpackUint32(bytes: number[]): number {
  const arr = new Uint8Array(bytes.splice(0, 4))
  const dataView = new DataView(arr.buffer)
  return dataView.getUint32(0, true)
}

function packFloat64(x: number): number[] {
  const buffer = new ArrayBuffer(8)
  const dataView = new DataView(buffer)
  dataView.setFloat64(0, x, true)
  return Array.from(new Uint8Array(buffer))
}

function unpackFloat64(bytes: number[]): number {
  const arr = new Uint8Array(bytes.splice(0, 8))
  const dataView = new DataView(arr.buffer)
  return roundDigit(dataView.getFloat64(0, true), 3)
}

function packString(x: string): number[] {
  return [x.length, ...x.split("").map(char => char.charCodeAt(0))]
}

function unpackString(bytes: number[]): string {
  const len = bytes.shift()
  if (!len) return ""
  let ret = ""
  for (let i = 0; i < len; i++) ret += String.fromCharCode(bytes.shift()!)
  return ret
}

function packVString(x: string): number[] {
  return packValue(x.length).concat(x.split("").map(char => char.charCodeAt(0)))
}

function unpackVString(bytes: number[]): string {
  const len = unpackValue(bytes)
  if (!len) return ""
  let ret = ""
  for (let i = 0; i < len; i++) ret += String.fromCharCode(bytes.shift()!)
  return ret
}

export function encodeTempo(events: TimingEvent[]): string {
  if (
    events.some(event => {
      if (
        event.type == "ATTACKS" ||
        event.type == "BGCHANGES" ||
        event.type == "FGCHANGES"
      )
        return true
      // find the closest tick
      const nearestTick = Math.round(event.beat * 48) / 48
      if (Math.abs(nearestTick - event.beat) > 0.0005) return true
      if (event.type == "FAKES" || event.type == "WARPS") {
        const nearestLengthTick = Math.round(event.value * 48) / 48
        if (Math.abs(nearestLengthTick - event.value) > 0.0005) return true
      }
      if (event.type == "LABELS" && event.value.length > 255) return true
      if (
        event.type == "TIMESIGNATURES" &&
        (event.upper > 2 ** 32 - 1 || event.lower > 2 ** 32 - 1)
      )
        return true
      if (
        event.type == "COMBOS" &&
        (event.hitMult > 2 ** 32 - 1 || event.missMult > 2 ** 32 - 1)
      )
        return true
      if (event.type == "TICKCOUNTS" && event.value > 2 ** 32 - 1) return true
      return false
    })
  )
    return encodeSMETempo(events)
  return encodeAVTempo(events)
}

// Seperate functions
// ArrowVortex only supports events on 1/192 intervals and cannot encode attacks/bgchanges/fgchanges
export function encodeAVTempo(events: TimingEvent[]): string {
  const bytes: number[] = []
  const eventMap = new Map<TimingEventProperty, TimingEvent[]>()
  events.forEach(event => {
    if (!eventMap.has(event.type)) eventMap.set(event.type, [])
    eventMap.get(event.type)?.push(event)
  })
  for (const [type, events] of eventMap.entries()) {
    if (type == "ATTACKS" || type == "BGCHANGES" || type == "FGCHANGES")
      continue
    bytes.push(events.length)
    bytes.push(eventTypeNumbers.indexOf(type))
    for (const event of events) {
      bytes.push(...packUint32(Math.round(event.beat! * 48)))
      switch (event.type) {
        case "BPMS":
        case "STOPS":
        case "DELAYS":
        case "SCROLLS":
          bytes.push(...packFloat64(event.value))
          break
        case "FAKES":
        case "WARPS":
          bytes.push(...packUint32(Math.round(event.value * 48)))
          break
        case "TIMESIGNATURES":
          bytes.push(...packUint32(Math.round(event.upper)))
          bytes.push(...packUint32(Math.round(event.lower)))
          break
        case "COMBOS":
          bytes.push(...packUint32(Math.round(event.hitMult)))
          bytes.push(...packUint32(Math.round(event.missMult)))
          break
        case "TICKCOUNTS":
          bytes.push(...packUint32(Math.round(event.value)))
          break
        case "SPEEDS":
          bytes.push(...packFloat64(event.value))
          bytes.push(...packFloat64(event.delay))
          bytes.push(...packUint32(event.unit == "B" ? 0 : 1))
          break
        case "LABELS":
          bytes.push(...packString(event.value))
      }
    }
  }
  bytes.push(0)
  return (
    "ArrowVortex:tempo:" +
    a85encode(bytes)
      .map(byte => String.fromCharCode(byte))
      .join("")
  )
}

export function encodeSMETempo(events: TimingEvent[]): string {
  const bytes = []
  // split into different types
  const eventMap = new Map<TimingEventProperty, TimingEvent[]>()
  events.forEach(event => {
    if (!eventMap.has(event.type)) eventMap.set(event.type, [])
    eventMap.get(event.type)?.push(event)
  })
  for (const [type, events] of eventMap.entries()) {
    bytes.push(...packValue(events.length))
    bytes.push(eventTypeNumbers.indexOf(type))
    for (const event of events) {
      bytes.push(
        ...packValue(
          Math.round(
            (event.type == "ATTACKS" ? event.second : event.beat) * 1000
          )
        )
      )
      switch (event.type) {
        case "BPMS":
        case "STOPS":
        case "DELAYS":
        case "SCROLLS":
        case "FAKES":
        case "WARPS":
          bytes.push(...packFloat64(event.value))
          break
        case "TIMESIGNATURES":
          bytes.push(...packValue(Math.round(event.upper)))
          bytes.push(...packValue(Math.round(event.lower)))
          break
        case "COMBOS":
          bytes.push(...packValue(Math.round(event.hitMult)))
          bytes.push(...packValue(Math.round(event.missMult)))
          break
        case "TICKCOUNTS":
          bytes.push(...packValue(Math.round(event.value)))
          break
        case "SPEEDS":
          bytes.push(...packFloat64(event.value))
          bytes.push(...packFloat64(event.delay))
          bytes.push(event.unit == "B" ? 0 : 1)
          break
        case "LABELS":
          bytes.push(...packVString(event.value))
          break
        case "ATTACKS":
          bytes.push(...packFloat64(event.value))
          bytes.push(event.endType == "LEN" ? 0 : 1)
          bytes.push(...packVString(event.mods))
          break
        case "BGCHANGES":
        case "FGCHANGES":
          bytes.push(
            (event.crossFade ? 1 : 0) +
              ((event.stretchRewind ? 1 : 0) << 1) +
              ((event.stretchNoLoop ? 1 : 0) << 2)
          )
          bytes.push(...packVString(event.file))
          bytes.push(...packFloat64(event.updateRate))
          bytes.push(...packVString(event.effect))
          bytes.push(...packVString(event.file2))
          bytes.push(...packVString(event.transition))
          bytes.push(...packVString(event.color1))
          bytes.push(...packVString(event.color2))
      }
    }
  }
  return (
    "SMEditor:tempo:" +
    a85encode(bytes)
      .map(byte => String.fromCharCode(byte))
      .join("")
  )
}

export function decodeTempo(data: string): TimingEvent[] | undefined {
  if (data.startsWith("SMEditor:tempo:")) return decodeSMETempo(data)
  if (data.startsWith("ArrowVortex:tempo:")) return decodeAVTempo(data)
}

export function decodeAVTempo(data: string): TimingEvent[] | undefined {
  if (!data.startsWith("ArrowVortex:tempo:")) return
  const decoded = a85decode(data.slice(18))
  const eventList: TimingEvent[] = []
  if (decoded === false) return
  const bytes = Array.from(decoded)
  try {
    while (true) {
      const count = bytes.shift()
      if (count === undefined) return
      if (count == 0) break
      const typeIndex = bytes.shift()
      if (typeIndex === undefined) return
      const type = eventTypeNumbers[typeIndex]
      for (let i = 0; i < count; i++) {
        const beat = unpackUint32(bytes) / 48
        switch (type) {
          case "BPMS":
          case "STOPS":
          case "DELAYS":
          case "SCROLLS":
            eventList.push({
              type,
              beat,
              value: unpackFloat64(bytes),
            })
            break
          case "FAKES":
          case "WARPS":
            eventList.push({
              type,
              beat,
              value: unpackUint32(bytes) / 48,
            })
            break
          case "TIMESIGNATURES":
            eventList.push({
              type,
              beat,
              upper: unpackUint32(bytes),
              lower: unpackUint32(bytes),
            })
            break
          case "COMBOS":
            eventList.push({
              type,
              beat,
              hitMult: unpackUint32(bytes),
              missMult: unpackUint32(bytes),
            })
            break
          case "TICKCOUNTS":
            eventList.push({
              type,
              beat,
              value: unpackUint32(bytes),
            })
            break
          case "SPEEDS":
            eventList.push({
              type,
              beat,
              value: unpackFloat64(bytes),
              delay: unpackFloat64(bytes),
              unit: unpackUint32(bytes) == 1 ? "T" : "B",
            })
            break
          case "LABELS":
            eventList.push({ type, beat, value: unpackString(bytes) })
        }
      }
    }
  } catch (e) {
    return
  }
  return eventList
}

export function decodeSMETempo(data: string): TimingEvent[] | undefined {
  if (!data.startsWith("SMEditor:tempo:")) return
  const decoded = a85decode(data.slice(15))
  const eventList: TimingEvent[] = []
  if (decoded === false) return
  const bytes = Array.from(decoded)
  try {
    while (true) {
      const count = unpackValue(bytes)
      if (count === undefined) return
      if (count == 0) break
      const typeIndex = bytes.shift()
      if (typeIndex === undefined) return
      const type = eventTypeNumbers[typeIndex]
      for (let i = 0; i < count; i++) {
        const tick = unpackValue(bytes) / 1000
        switch (type) {
          case "BPMS":
          case "STOPS":
          case "DELAYS":
          case "SCROLLS":
          case "FAKES":
          case "WARPS":
            eventList.push({
              type,
              beat: tick,
              value: unpackFloat64(bytes),
            })
            break
          case "TIMESIGNATURES":
            eventList.push({
              type,
              beat: tick,
              upper: unpackValue(bytes),
              lower: unpackValue(bytes),
            })
            break
          case "COMBOS":
            eventList.push({
              type,
              beat: tick,
              hitMult: unpackValue(bytes),
              missMult: unpackValue(bytes),
            })
            break
          case "TICKCOUNTS":
            eventList.push({
              type,
              beat: tick,
              value: unpackValue(bytes),
            })
            break
          case "SPEEDS":
            eventList.push({
              type,
              beat: tick,
              value: unpackFloat64(bytes),
              delay: unpackFloat64(bytes),
              unit: bytes.shift()! == 0 ? "B" : "T",
            })
            break
          case "LABELS":
            eventList.push({
              type,
              beat: tick,
              value: unpackVString(bytes),
            })
            break
          case "ATTACKS":
            eventList.push({
              type,
              second: tick,
              value: unpackFloat64(bytes),
              endType: bytes.shift()! == 0 ? "LEN" : "END",
              mods: unpackVString(bytes),
            })
            break
          case "BGCHANGES":
          case "FGCHANGES": {
            const bools = bytes.shift()!
            eventList.push({
              type,
              beat: tick,
              file: unpackVString(bytes),
              updateRate: unpackFloat64(bytes),
              crossFade: (bools & 1) > 0,
              stretchRewind: (bools & 2) > 0,
              stretchNoLoop: (bools & 4) > 0,
              effect: unpackVString(bytes),
              file2: unpackVString(bytes),
              transition: unpackVString(bytes),
              color1: unpackVString(bytes),
              color2: unpackVString(bytes),
            })
          }
        }
      }
    }
  } catch (e) {
    return
  }
  return eventList
}
