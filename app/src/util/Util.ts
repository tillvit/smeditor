/// <reference lib="webworker" />

import { Parser } from "expr-eval"
import { PartialNotedataEntry, isHoldNote } from "../chart/sm/NoteTypes"

export const IS_OSX: boolean = navigator.userAgent.indexOf("Mac OS X") > -1

export const QUANTS = [
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
export const QUANT_NAMES = [
  "4th",
  "8th",
  "12th",
  "16th",
  "24th",
  "32nd",
  "48th",
  "64th",
  "96th",
  "192nd",
]
export const QUANT_NUM = [4, 8, 12, 16, 24, 32, 48, 64, 96, 192]

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

export function isSameRow(beat1: number, beat2: number) {
  return Math.abs(beat1 - beat2) < 1 / 96
}

export function toRowIndex(beat: number) {
  return Math.round(beat * 48)
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

export function previousInSorted(
  arr: number[],
  value: number,
  lambda = 0.001
): number | null {
  if (arr.length == 0) return null
  if (arr[0] > value) return null
  const idx = bsearch(arr, value)
  if (Math.abs(value - arr[idx]) <= lambda) {
    if (idx - 1 >= 0) {
      return arr[idx - 1]
    } else {
      return arr[idx]
    }
  } else return arr[idx]
}

export function nextInSorted(
  arr: number[],
  value: number,
  lambda = 0.001
): number | null {
  if (arr.length == 0) return null
  if (arr.at(-1)! < value) return null
  const idx = bsearch(arr, value)
  if (idx == 0 && value < arr[idx]) {
    return arr[idx]
  }
  if (Math.abs(value - arr[idx]) <= lambda) {
    if (idx + 1 < arr.length) {
      return arr[idx + 1]
    } else {
      return null
    }
  } else return arr[idx + 1]
}

export function countOfItem<T>(array: T[], item: T): number {
  return array.filter(a => a == item).length
}

export function arraysAreEqual<T>(array1: T[], array2: T[]): boolean {
  if (array1.length !== array2.length) {
    return false
  }

  for (let i = 0; i < array1.length; i++) {
    if (array1[i] !== array2[i]) {
      return false
    }
  }

  return true
}

/**
 * Returns the start and end indices of the elements within the
 * given range in a sorted array.
 *
 * @export
 * @template T
 * @param {T[]} array The array to search in.
 * @param {number} start The start of the range.
 * @param {number} end The end of the range.
 * @param {(obj: T) => number} index A function that returns the index of the object.
 * @return {[number, number]} The start and end indices of the elements within the range. The start index is inclusive and the end index is exclusive.
 */
export function getRangeInSortedArray<T>(
  array: T[],
  start: number,
  end: number,
  index: (obj: T) => number
) {
  if (array.length == 0) return [0, 0]
  let startIdx = bsearch(array, start, index)
  if (index(array[startIdx]) < start) startIdx++
  while (array[startIdx - 1] && index(array[startIdx - 1]) == start) {
    startIdx--
  }

  let endIdx = bsearch(array, end, index)
  if (index(array[endIdx]) > end) endIdx--
  while (array[endIdx + 1] && index(array[endIdx + 1]) == end) {
    endIdx++
  }

  return [startIdx, endIdx + 1]
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

export function capitalize(str: string): string {
  if (str == "") return ""
  return str.slice(0, 1).toUpperCase() + str.slice(1).toLowerCase()
}

export function formatSeconds(seconds: number): string {
  const parts: [number, string][] = [
    [Math.floor(seconds / 3600), "h"],
    [Math.floor((seconds % 3600) / 60), "m"],
    [Math.floor(seconds % 60), "s"],
  ]
  return parts
    .filter(part => part[0] > 0)
    .map(part => part[0] + part[1])
    .join(" ")
    .trim()
}

export function formatBytes(bytes: number): string {
  const units = ["B", "KB", "MB", "GB", "TB"]
  let unitIndex = 0
  while (bytes >= 1024 && unitIndex < units.length - 1) {
    bytes /= 1024
    unitIndex++
  }
  return bytes.toFixed(2) + " " + units[unitIndex]
}

export function isIFrame() {
  try {
    return window.self !== window.top
  } catch (e) {
    return true
  }
}

export function isWorker() {
  return (
    typeof WorkerGlobalScope !== "undefined" &&
    self instanceof WorkerGlobalScope
  )
}
