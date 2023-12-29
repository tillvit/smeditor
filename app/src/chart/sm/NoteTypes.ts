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
  notemods?: string
  keysounds?: string
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
  quant: number
  gameplay?: {
    hideNote: boolean
    hasHit: boolean
  }
  parity?: string
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
  return note.type != "Hold" && note.type != "Roll"
}

export function isHoldNote<T extends PartialNotedataEntry>(
  note: T
): note is Extract<T, { hold: number }> {
  return note.type == "Hold" || note.type == "Roll"
}
