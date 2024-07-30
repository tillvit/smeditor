export type Notedata = NotedataEntry[]

export type PartialNotedata = PartialNotedataEntry[]

export const HOLD_NOTE_TYPES = ["Hold", "Roll"] as const
export const TAP_NOTE_TYPES = ["Tap", "Mine", "Lift", "Fake"] as const

export type NoteType = TapNoteType | HoldNoteType
export type HoldNoteType = (typeof HOLD_NOTE_TYPES)[number]
export type TapNoteType = (typeof TAP_NOTE_TYPES)[number]

export interface PartialBaseNotedata {
  beat: number
  col: number
  notemods?: string
  keysounds?: string
}

export interface PartialTapNotedataEntry extends PartialBaseNotedata {
  type: TapNoteType
}

export interface PartialHoldNotedataEntry extends PartialBaseNotedata {
  hold: number
  type: HoldNoteType
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
      lastHoldActivation?: number
      droppedHoldBeat?: number
    }
  }
export type NotedataEntry = TapNotedataEntry | HoldNotedataEntry

export function isTapNote<T extends PartialNotedataEntry>(
  note: T
): note is Exclude<T, { hold: number }> {
  return !HOLD_NOTE_TYPES.includes(note.type as HoldNoteType)
}

export function isHoldNote<T extends PartialNotedataEntry>(
  note: T
): note is Extract<T, { hold: number }> {
  return HOLD_NOTE_TYPES.includes(note.type as HoldNoteType)
}
