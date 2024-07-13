import { Parser } from "expr-eval"
import {
  DisplayObject,
  FederatedMouseEvent,
  Geometry,
  Rectangle,
  Texture,
} from "pixi.js"
import { PartialNotedataEntry, isHoldNote } from "../chart/sm/NoteTypes"
import { IS_OSX } from "../data/KeybindData"

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

export function getNoteEnd(note: PartialNotedataEntry) {
  return note.beat + (isHoldNote(note) ? note.hold : 0)
}

export function getDivision(beat: number) {
  return 4 / QUANTS[getQuantIndex(beat)]
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

export function bsearchEarliest<T>(
  arr: T[],
  value: number,
  property?: (a: T) => number
) {
  property = property ?? (a => a as number)
  if (arr.length == 0) return -1
  let idx = bsearch(arr, value, property)
  while (arr[idx - 1] && property(arr[idx - 1]) == value) {
    idx--
  }
  return idx
}

export function compareObjects(a: any, b: any) {
  if (Object.keys(a).some(key => a[key] != b[key])) return false
  if (Object.keys(b).some(key => a[key] != b[key])) return false
  return true
}

export function parseString(expr: string) {
  try {
    return Parser.evaluate(expr)
  } catch {
    return null
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

export function capitalize(str: string): string {
  if (str == "") return ""
  return str.slice(0, 1).toUpperCase() + str.slice(1).toLowerCase()
}

export function isRightClick(event: FederatedMouseEvent) {
  return event.button == 2 || (event.getModifierState("Control") && IS_OSX)
}

export function isIFrame() {
  try {
    return window.self !== window.top
  } catch (e) {
    return true
  }
}

export function splitTex(texture: Texture, xFrames: number, yFrames: number) {
  const frames = []
  const xWidth = texture.width / xFrames
  const yWidth = texture.height / yFrames
  for (let y = 0; y < yFrames; y++) {
    const row = []
    for (let x = 0; x < xFrames; x++) {
      row.push(
        new Texture(
          texture.baseTexture,
          new Rectangle(xWidth * x, yWidth * y, xWidth, yWidth)
        )
      )
    }
    frames.push(row)
  }
  return frames
}

export async function loadGeometry(data: string): Promise<Geometry> {
  const lines = data.split("\n")
  const numVertices = parseInt(lines[0])
  const numTriangles = parseInt(lines[numVertices + 1])
  const vPos = []
  const vUvs = []
  const vIndex = []
  for (let i = 0; i < numVertices; i++) {
    const match = /(-?[0-9.]+)\s+(-?[0-9.]+)\s+(-?[0-9.]+)\s+(-?[0-9.]+)/.exec(
      lines[i + 1]
    )
    if (match) {
      vPos.push(parseFloat(match[1]))
      vPos.push(parseFloat(match[2]))
      vUvs.push(parseFloat(match[3]))
      vUvs.push(parseFloat(match[4]))
    } else {
      console.error("Failed to load vertex " + lines[i + 1])
      return new Geometry()
    }
  }
  for (let i = 0; i < numTriangles; i++) {
    const match = /(-?[0-9.]+)\s+(-?[0-9.]+)\s+(-?[0-9.]+)/.exec(
      lines[i + 2 + numVertices]
    )
    if (match) {
      vIndex.push(parseFloat(match[1]))
      vIndex.push(parseFloat(match[2]))
      vIndex.push(parseFloat(match[3]))
    } else {
      console.error("Failed to load triangle " + lines[i + 2 + numVertices])
      return new Geometry()
    }
  }
  return new Geometry()
    .addAttribute("aVertexPosition", vPos, 2)
    .addAttribute("aUvs", vUvs, 2)
    .addIndex(vIndex)
}
