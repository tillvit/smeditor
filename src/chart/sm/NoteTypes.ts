export type Notedata = NotedataEntry[]

export type PartialNotedata = PartialNotedataEntry[]

export const NOTE_TYPES = [
  "Tap",
  "Hold",
  "Roll",
  "Mine",
  "Lift",
  "Fake",
] as const

export type NoteType = (typeof NOTE_TYPES)[number]

export interface PartialTapNotedataEntry {
  beat: number
  col: number
  type: NoteType
}

export interface PartialHoldNotedataEntry extends PartialTapNotedataEntry {
  hold: number
}

export type PartialNotedataEntry =
  | PartialTapNotedataEntry
  | PartialHoldNotedataEntry

interface ExtraNotedata {
  warped: boolean
  fake: boolean
  second: number
  gameplay?: {
    hideNote: boolean
    hasHit: boolean
  }
}

export type TapNotedataEntry = PartialTapNotedataEntry & ExtraNotedata
export type HoldNotedataEntry = PartialHoldNotedataEntry &
  ExtraNotedata & {
    gameplay?: {
      lastHoldActivation: number
      droppedHoldBeat: number
    }
  }
export type NotedataEntry = TapNotedataEntry | HoldNotedataEntry

export function isTapNote<T extends PartialNotedataEntry>(
  note: T
): note is Exclude<T, { hold: number }> {
  return (note as Extract<T, { hold: number }>).hold == undefined
}

export function isHoldNote<T>(note: T): note is Extract<T, { hold: number }> {
  return (note as Extract<T, { hold: number }>).hold != undefined
}

export interface NotedataStats {
  npsGraph: number[]
  counts: Record<string, number>
}
