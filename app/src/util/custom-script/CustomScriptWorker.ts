import {
  PartialHoldNotedataEntry,
  PartialNotedataEntry,
} from "../../chart/sm/NoteTypes"
import { ActionHistory } from "../ActionHistory"
import { EventHandler } from "../EventHandler"
import { CustomScriptWorkerArgs } from "./CustomScriptTypes"
import { createSMFromPayload, createSMPayload } from "./CustomScriptUtils"

self.console = {
  ...console,
  log: (...args: any[]) => {
    // forward logs to main thread
    self.postMessage({ type: "log", args })
  },
  error: (...args: any[]) => {
    self.postMessage({ type: "error", args })
  },
  warn: (...args: any[]) => {
    self.postMessage({ type: "warn", args })
  },
  info: (...args: any[]) => {
    self.postMessage({ type: "info", args })
  },
}

// @ts-expect-error no-unused-vars
function BPMEvent(beat: number, bpm: number) {
  return { type: "BPMS", beat, value: bpm }
}
// @ts-expect-error no-unused-vars
function StopEvent(beat: number, seconds: number) {
  return { type: "STOPS", beat, value: seconds }
}
// @ts-expect-error no-unused-vars
function WarpEvent(beat: number, beats: number) {
  return { type: "WARPS", beat, value: beats }
}
// @ts-expect-error no-unused-vars
function DelayEvent(beat: number, seconds: number) {
  return { type: "DELAYS", beat, value: seconds }
}
// @ts-expect-error no-unused-vars
function ScrollEvent(beat: number, factor: number) {
  return { type: "SCROLLS", beat, value: factor }
}
// @ts-expect-error no-unused-vars
function TickCountEvent(beat: number, ticks: number) {
  return { type: "TICKCOUNTS", beat, value: ticks }
}
// @ts-expect-error no-unused-vars
function FakeEvent(beat: number, beats: number) {
  return { type: "FAKES", beat, value: beats }
}
// @ts-expect-error no-unused-vars
function LabelEvent(beat: number, label: string) {
  return { type: "LABELS", beat, value: label }
}
// @ts-expect-error no-unused-vars
function SpeedEvent(
  beat: number,
  factor: number,
  delay: number,
  unit: "Beats" | "Seconds"
) {
  return {
    type: "SPEEDS",
    beat,
    value: factor,
    delay,
    unit: unit == "Beats" ? "B" : "T",
  }
}
// @ts-expect-error no-unused-vars
function TimeSignatureEvent(beat: number, upper: number, lower: number) {
  return { type: "TIMESIGNATURES", beat, upper, lower }
}
// @ts-expect-error no-unused-vars
function ComboEvent(beat: number, hitMult: number, missMult: number) {
  return { type: "COMBOS", beat, hitMult, missMult }
}
// @ts-expect-error no-unused-vars
function AttackEvent(
  second: number,
  endType: "Length" | "End",
  value: number,
  mods: string
) {
  return {
    type: "ATTACKS",
    second,
    endType: endType == "Length" ? "LEN" : "END",
    value,
    mods,
  }
}
// @ts-expect-error no-unused-vars
function BGChangeEvent(
  beat: number,
  file: string,
  updateRate: number,
  crossFade: boolean,
  stretchRewind: boolean,
  stretchNoLoop: boolean,
  effect: string,
  file2: string,
  transition: string,
  color1: string,
  color2: string
) {
  return {
    type: "BGCHANGES",
    beat,
    file,
    updateRate,
    crossFade,
    stretchRewind,
    stretchNoLoop,
    effect,
    file2,
    transition,
    color1,
    color2,
  }
}
// @ts-expect-error no-unused-vars
function FGChangeEvent(
  beat: number,
  file: string,
  updateRate: number,
  crossFade: boolean,
  stretchRewind: boolean,
  stretchNoLoop: boolean,
  effect: string,
  file2: string,
  transition: string,
  color1: string,
  color2: string
) {
  return {
    type: "FGCHANGES",
    beat,
    file,
    updateRate,
    crossFade,
    stretchRewind,
    stretchNoLoop,
    effect,
    file2,
    transition,
    color1,
    color2,
  }
}

// @ts-expect-error no-unused-vars
function TapNote(beat: number, col: number): PartialNotedataEntry {
  return { type: "Tap", beat, col }
}
// @ts-expect-error no-unused-vars
function HoldNote(
  beat: number,
  col: number,
  length: number
): PartialHoldNotedataEntry {
  return { type: "Hold", beat, col, hold: length }
}
// @ts-expect-error no-unused-vars
function RollNote(
  beat: number,
  col: number,
  length: number
): PartialHoldNotedataEntry {
  return { type: "Roll", beat, col, hold: length }
}
// @ts-expect-error no-unused-vars
function MineNote(beat: number, col: number): PartialNotedataEntry {
  return { type: "Mine", beat, col }
}
// @ts-expect-error no-unused-vars
function LiftNote(beat: number, col: number): PartialNotedataEntry {
  return { type: "Lift", beat, col }
}
// @ts-expect-error no-unused-vars
function FakeNote(beat: number, col: number): PartialNotedataEntry {
  return { type: "Fake", beat, col }
}

self.onmessage = async (event: MessageEvent<CustomScriptWorkerArgs>) => {
  // @ts-expect-error no-unused-vars
  const { smPayload, codePayload, chartId, selectionNoteIndices, args } =
    event.data
  new EventHandler()
  new ActionHistory()

  const sm = await createSMFromPayload(smPayload)
  const chart = sm.charts[chartId]
  // @ts-expect-error no-unused-vars
  const selection = selectionNoteIndices.map(i => chart.getNotedata()[i])

  eval(codePayload)
  self.postMessage({ type: "payload", payload: createSMPayload(sm) })
}
