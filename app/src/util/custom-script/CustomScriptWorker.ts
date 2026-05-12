import {
  isHoldNote as _isHoldNote,
  isTapNote as _isTapNote,
  PartialHoldNotedataEntry,
  PartialNotedataEntry,
} from "../../chart/sm/NoteTypes"
import { TIMING_EVENT_NAMES as _TIMING_EVENT_NAMES } from "../../chart/sm/TimingTypes"
import { Foot as _Foot } from "../../chart/stats/parity/ParityDataTypes"
import { ActionHistory } from "../ActionHistory"
import { EventHandler } from "../EventHandler"
import { CustomScriptWorkerArgs } from "./CustomScriptTypes"
import {
  createSMFromPayload,
  createSMPayload,
  WorkerWhitelist,
  WorkerWhitelistProperties,
} from "./CustomScriptUtils"

// whitelist globals
for (const key of Object.getOwnPropertyNames(self)) {
  if (!WorkerWhitelist.includes(key as WorkerWhitelistProperties)) {
    // @ts-expect-error no-explicit-any
    self[key] = undefined
  }
}

const oldConsole = self.console

function toSerializable(obj: any): any {
  try {
    return structuredClone(obj)
  } catch {
    return obj.toString()
  }
}

self.console = {
  ...console,
  log: (...args: any[]) => {
    oldConsole.log(...args)
    // forward logs to main thread
    self.postMessage({ type: "log", args: args.map(toSerializable) })
  },
  error: (...args: any[]) => {
    oldConsole.error(...args)
    self.postMessage({ type: "error", args: args.map(toSerializable) })
  },
  warn: (...args: any[]) => {
    oldConsole.warn(...args)
    self.postMessage({ type: "warn", args: args.map(toSerializable) })
  },
}

// @ts-expect-error no-unused-vars
const isHoldNote = _isHoldNote
// @ts-expect-error no-unused-vars
const isTapNote = _isTapNote
// @ts-expect-error no-unused-vars
const TIMING_EVENT_NAMES = _TIMING_EVENT_NAMES
// @ts-expect-error no-unused-vars
const Foot = _Foot

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
  const { smPayload, codePayload, chartId, selection, args } = event.data
  new EventHandler()
  new ActionHistory()

  // @ts-expect-error no-unused-vars
  const ARGS = args
  const SM = await createSMFromPayload(smPayload)
  const CHART = SM.charts[chartId]
  // @ts-expect-error no-unused-vars
  const SELECTION = selection
    ? {
        type: selection.type,
        selection: selection.indices.map(i => {
          if (selection.type === "notes") {
            return CHART.getNotedata()[i]
          } else {
            return CHART.timingData.getTimingData()[i]
          }
        }),
        range: selection.range,
      }
    : null

  try {
    eval(codePayload)
  } catch (err) {
    const error = err as Error

    // format stack trace
    if (error.stack) {
      let stack = error.stack
        .replaceAll(/eval at [^]+?, <anonymous>/g, "main.js")
        .split("\n")
        .slice(0, -1)
        .join("\n")
      stack = stack.replaceAll(/eval \(([^]+)\)/g, (_, content) => {
        return `${content}`
      })
      self.postMessage({
        type: "error",
        args: [stack],
      })
    } else {
      self.postMessage({
        type: "error",
        args: [error.message],
      })
    }
    self.postMessage({ type: "close" })
    return
  }
  self.postMessage({ type: "payload", payload: createSMPayload(SM) })
}
