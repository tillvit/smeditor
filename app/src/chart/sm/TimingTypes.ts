export const TIMING_EVENT_NAMES = [
  "BPMS",
  "STOPS",
  "WARPS",
  "DELAYS",
  "LABELS",
  "SPEEDS",
  "SCROLLS",
  "TICKCOUNTS",
  "TIMESIGNATURES",
  "COMBOS",
  "FAKES",
  "ATTACKS",
  "BGCHANGES",
  "FGCHANGES",
] as const

export type TimingEventType = (typeof TIMING_EVENT_NAMES)[number]
export type TimingType = "OFFSET" | TimingEventType

export const BEAT_TIMING_EVENT_NAMES = [
  "BPMS",
  "STOPS",
  "WARPS",
  "DELAYS",
  "WARP_DEST",
] as const

export type BeatTimingEventType = (typeof BEAT_TIMING_EVENT_NAMES)[number]

export interface BeatTimingCache {
  beat: number
  secondBefore: number
  secondOf: number
  secondAfter: number
  secondClamp: number
  bpm: number
  warped: boolean
}

export interface MeasureTimingCache {
  beat: number
  measure: number
  beatsPerMeasure: number
  divisionLength: number
  numDivisions: number
}

export interface ScrollCacheTimingEvent extends ScrollTimingEvent {
  effectiveBeat?: number
}
export interface BPMTimingEvent {
  type: "BPMS"
  beat: number
  value: number
}
export interface StopTimingEvent {
  type: "STOPS"
  beat: number
  value: number
}
export interface WarpTimingEvent {
  type: "WARPS"
  beat: number
  value: number
}
export interface WarpDestTimingEvent {
  type: "WARP_DEST"
  beat: number
  value: number
}
export interface DelayTimingEvent {
  type: "DELAYS"
  beat: number
  value: number
}
export interface ScrollTimingEvent {
  type: "SCROLLS"
  beat: number
  value: number
}
export interface TickCountTimingEvent {
  type: "TICKCOUNTS"
  beat: number
  value: number
}
export interface FakeTimingEvent {
  type: "FAKES"
  beat: number
  value: number
}
export interface LabelTimingEvent {
  type: "LABELS"
  beat: number
  value: string
}
export interface SpeedTimingEvent {
  type: "SPEEDS"
  beat: number
  value: number
  delay: number
  unit: "B" | "T"
}
export interface TimeSignatureTimingEvent {
  type: "TIMESIGNATURES"
  beat: number
  upper: number
  lower: number
}
export interface ComboTimingEvent {
  type: "COMBOS"
  beat: number
  hitMult: number
  missMult: number
}
export interface AttackTimingEvent {
  type: "ATTACKS"
  second: number
  endType: "LEN" | "END"
  value: number
  mods: string
}
export interface BGChangeTimingEvent {
  type: "BGCHANGES"
  beat: number
  file: string
  updateRate: number
  crossFade: boolean
  stretchRewind: boolean
  stretchNoLoop: boolean
  effect: string
  file2: string
  transition: string
  color1: string
  color2: string
}
export interface FGChangeTimingEvent {
  type: "FGCHANGES"
  beat: number
  file: string
  updateRate: number
  crossFade: boolean
  stretchRewind: boolean
  stretchNoLoop: boolean
  effect: string
  file2: string
  transition: string
  color1: string
  color2: string
}

export type TimingEvent =
  | BPMTimingEvent
  | StopTimingEvent
  | WarpTimingEvent
  | DelayTimingEvent
  | ScrollTimingEvent
  | TickCountTimingEvent
  | FakeTimingEvent
  | LabelTimingEvent
  | SpeedTimingEvent
  | TimeSignatureTimingEvent
  | ComboTimingEvent
  | AttackTimingEvent
  | BGChangeTimingEvent
  | FGChangeTimingEvent

export type Cached<T extends TimingEvent> = T & {
  beat: number
  second: number
  isChartTiming: boolean
}

export type BeatTimingEvent =
  | BPMTimingEvent
  | StopTimingEvent
  | WarpTimingEvent
  | WarpDestTimingEvent
  | DelayTimingEvent

export type TimingCache = {
  beatTiming?: BeatTimingCache[]
  effectiveBeatTiming?: ScrollCacheTimingEvent[]
  measureTiming?: MeasureTimingCache[]
  sortedEvents?: Cached<TimingEvent>[]
  warpedBeats: Map<number, boolean>
  beatsToSeconds: Map<string, number>
}

export type DeletableEvent = Partial<Cached<TimingEvent>> &
  Pick<TimingEvent, "type">

export type ColumnType = "continuing" | "instant"

export interface TimingColumn<Event extends TimingEvent> {
  type: TimingEventType
  events: Cached<Event>[]
}
