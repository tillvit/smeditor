

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

export type NotedataEntry = {
  beat: number,
  col: number, 
  type: NoteType,
  warped: boolean,
  fake: boolean,
  second: number,
  hold?: number
}