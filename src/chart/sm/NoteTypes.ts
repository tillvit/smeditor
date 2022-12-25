

export const NOTE_TYPES = ["Tap", "Hold", "Roll", "Mine", "Fake", "Lift"] as const

export type NoteType = typeof NOTE_TYPES[number];

export const NOTE_TYPE_LOOKUP: Record<string, NoteType> = {
  "1": "Tap",
  "2": "Hold",
  "4": "Roll",
  "M": "Mine",
  "F": "Fake",
  "L": "Lift",
} 

export type Notedata = NotedataEntry[]

export interface PartialNotedataEntry {
  beat: number,
  col: number, 
  type: NoteType,
  hold?: number
}

export interface NotedataEntry extends PartialNotedataEntry {
  warped: boolean,
  fake: boolean,
  second: number,
  hide?: boolean,
  hit?: boolean,
  judged?: boolean,
  lastActivation?: number,
}

export interface NotedataCount {
  peakNps: number,
  taps: number,
  jumps: number,
  hands: number,
  holds: number,
  rolls: number,
  mines: number,
  fakes: number,
  lifts: number
}