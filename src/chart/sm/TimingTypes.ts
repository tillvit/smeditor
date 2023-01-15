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

export type TimingEventProperty = typeof TIMING_EVENT_NAMES[number]
export type TimingProperty = "OFFSET" | TimingEventProperty

export const BEAT_TIMING_EVENT_NAMES = [
  "BPMS",
  "STOPS",
  "WARPS",
  "DELAYS",
  "WARP_DEST",
] as const

export type BeatTimingEventProperty = typeof BEAT_TIMING_EVENT_NAMES[number]

export interface TimingEventBase {
  type: TimingEventProperty
  beat?: number
  second?: number
}
export type BeatCacheTimingEventBase = {
  type: BeatTimingEventProperty
  beat?: number
  second?: number
  secondNoStop?: number
  searchSecond?: number
  warped?: boolean
}
export interface ScrollCacheTimingEvent extends ScrollTimingEvent {
  effectiveBeat?: number
}
export interface BPMTimingEvent
  extends TimingEventBase,
    BeatCacheTimingEventBase {
  type: "BPMS"
  beat: number
  value: number
}
export interface StopTimingEvent
  extends TimingEventBase,
    BeatCacheTimingEventBase {
  type: "STOPS"
  beat: number
  value: number
}
export interface WarpTimingEvent
  extends TimingEventBase,
    BeatCacheTimingEventBase {
  type: "WARPS"
  beat: number
  value: number
}
export interface WarpDestTimingEvent extends BeatCacheTimingEventBase {
  type: "WARP_DEST"
  beat: number
  value: number
}
export interface DelayTimingEvent
  extends TimingEventBase,
    BeatCacheTimingEventBase {
  type: "DELAYS"
  beat: number
  value: number
}
export interface ScrollTimingEvent extends TimingEventBase {
  type: "SCROLLS"
  beat: number
  value: number
}
export interface TickCountTimingEvent extends TimingEventBase {
  type: "TICKCOUNTS"
  beat: number
  value: number
}
export interface FakeTimingEvent extends TimingEventBase {
  type: "FAKES"
  beat: number
  value: number
}
export interface LabelTimingEvent extends TimingEventBase {
  type: "LABELS"
  beat: number
  value: string
}
export interface SpeedTimingEvent extends TimingEventBase {
  type: "SPEEDS"
  beat: number
  value: number
  delay: number
  unit: "B" | "T"
}
export interface TimeSignatureTimingEvent extends TimingEventBase {
  type: "TIMESIGNATURES"
  beat: number
  upper: number
  lower: number
}
export interface ComboTimingEvent extends TimingEventBase {
  type: "COMBOS"
  beat: number
  hitMult: number
  missMult: number
}
export interface AttackTimingEvent extends TimingEventBase {
  type: "ATTACKS"
  second: number
  endType: "LEN" | "END"
  value: number
  mods: string
}
export interface BGChangeTimingEvent extends TimingEventBase {
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
export interface FGChangeTimingEvent extends TimingEventBase {
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

export type BeatCacheTimingEvent =
  | BPMTimingEvent
  | StopTimingEvent
  | WarpTimingEvent
  | DelayTimingEvent
  | WarpDestTimingEvent
