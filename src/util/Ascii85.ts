import { NoteType, PartialNotedata, isHoldNote } from "../chart/sm/NoteTypes"
import { TimingEvent, TimingEventProperty } from "../chart/sm/TimingTypes"
import { roundDigit } from "./Math"

const _a85chars = Array(85)
  .fill(undefined)
  .map((_, index) => 33 + index)
const _a85chars2: number[][] = []
for (const a of _a85chars) for (const b of _a85chars) _a85chars2.push([a, b])
const _A85START = "<~".split("").map(char => char.charCodeAt(0))
const _A85END = "~>".split("").map(char => char.charCodeAt(0))

function _85encode(
  data: string | ArrayBuffer | number[],
  chars: number[],
  chars2: number[][],
  pad = false,
  foldnuls = false,
  foldspaces = false
) {
  let bytes = []
  if (typeof data == "string")
    bytes = data.split("").map(char => char.charCodeAt(0))
  else bytes = [...new Uint8Array(data)]

  const padding = 4 - (bytes.length % 4)
  for (let i = 0; i < padding; i++) bytes.push(0)

  const arr = new Uint8Array(bytes)
  const dataView = new DataView(arr.buffer)

  let chunks: number[] = []
  for (let i = 0; i < bytes.length; i += 4) {
    const word = dataView.getUint32(i)
    // do whatever
    if (foldnuls && !word) {
      chunks.push("z".charCodeAt(0))
    } else if (foldspaces && word == 0x20202020) {
      chunks.push("y".charCodeAt(0))
    } else {
      chunks = chunks.concat(
        chars2[Math.floor(word / 614125)],
        chars2[Math.floor(word / 85) % 7225]
      )
      chunks.push(chars[word % 85])
    }
  }

  if (padding && !pad) {
    if (chunks.at(-1) == "z".charCodeAt(0)) {
      chunks.pop()
      for (let i = 0; i < 5; i++) chunks.push(chunks[0])
    }
    for (let i = 0; i < padding; i++) chunks.pop()
  }

  return chunks
}

export function a85encode(
  data: string | ArrayBuffer | number[],
  foldspaces = false,
  pad = false,
  adobe = false
) {
  let result = _85encode(data, _a85chars, _a85chars2, pad, true, foldspaces)

  if (adobe) result = _A85START.concat(result).concat(_A85END)

  return result
}

export function a85decode(
  data: string | ArrayBuffer,
  adobe = false,
  ignorechars = " \t\n\r\v"
) {
  let bytes = []
  if (typeof data == "string")
    bytes = data.split("").map(char => char.charCodeAt(0))
  else bytes = [...new Uint8Array(data)]
  if (adobe) {
    if (bytes.at(-1) != _A85END.at(-1) || bytes.at(-2) != _A85END.at(-2))
      return false
    if (bytes.at(0) == _A85START.at(0) && bytes.at(1) == _A85START.at(1))
      bytes = bytes.slice(2, -2)
    else bytes = bytes.slice(undefined, -2)
  }
  for (let i = 0; i < 4; i++) bytes.push("u".charCodeAt(0))
  let decoded = []
  let curr = []
  for (const byte of bytes) {
    if (byte >= 33 && 117 >= byte) {
      curr.push(byte)
      if (curr.length == 5) {
        let acc = 0
        for (const b of curr) acc = 85 * acc + (b - 33)
        if (acc > 2 ** 32 - 1) return false
        decoded.push((acc >> 24) & 0xff)
        decoded.push((acc >> 16) & 0xff)
        decoded.push((acc >> 8) & 0xff)
        decoded.push(acc & 0xff)
        curr = []
      }
    } else if (byte == 122) {
      if (curr.length != 0) return false
      decoded.push(0)
      decoded.push(0)
      decoded.push(0)
      decoded.push(0)
    } else if (byte == 121) {
      if (curr.length != 0) return false
      decoded.push(0x20)
      decoded.push(0x20)
      decoded.push(0x20)
      decoded.push(0x20)
    } else if (ignorechars.includes(String.fromCharCode(byte))) {
      continue
    } else {
      return false
    }
  }
  const padding = 4 - curr.length
  if (padding) decoded = decoded.slice(undefined, -padding)
  return decoded
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

const noteTypeOrder: NoteType[] = ["Hold", "Mine", "Roll", "Lift", "Fake"]

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
          const noteType = noteTypeOrder[type]
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
