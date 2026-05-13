import { Chart } from "../../chart/sm/Chart"
import {
  isHoldNote as _isHoldNote,
  isTapNote as _isTapNote,
  NotedataEntry,
  PartialHoldNotedataEntry,
  PartialNotedataEntry,
} from "../../chart/sm/NoteTypes"
import { Simfile } from "../../chart/sm/Simfile"
import {
  TIMING_EVENT_NAMES as _TIMING_EVENT_NAMES,
  TimingEvent,
} from "../../chart/sm/TimingTypes"
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
    delete (self as any)[key]
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

const isHoldNote = _isHoldNote
const isTapNote = _isTapNote
const TIMING_EVENT_NAMES = _TIMING_EVENT_NAMES
const Foot = _Foot

function BPMEvent(beat: number, bpm: number) {
  return { type: "BPMS", beat, value: bpm }
}
function StopEvent(beat: number, seconds: number) {
  return { type: "STOPS", beat, value: seconds }
}
function WarpEvent(beat: number, beats: number) {
  return { type: "WARPS", beat, value: beats }
}
function DelayEvent(beat: number, seconds: number) {
  return { type: "DELAYS", beat, value: seconds }
}
function ScrollEvent(beat: number, factor: number) {
  return { type: "SCROLLS", beat, value: factor }
}
function TickCountEvent(beat: number, ticks: number) {
  return { type: "TICKCOUNTS", beat, value: ticks }
}
function FakeEvent(beat: number, beats: number) {
  return { type: "FAKES", beat, value: beats }
}
function LabelEvent(beat: number, label: string) {
  return { type: "LABELS", beat, value: label }
}
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
function TimeSignatureEvent(beat: number, upper: number, lower: number) {
  return { type: "TIMESIGNATURES", beat, upper, lower }
}
function ComboEvent(beat: number, hitMult: number, missMult: number) {
  return { type: "COMBOS", beat, hitMult, missMult }
}
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

function TapNote(beat: number, col: number): PartialNotedataEntry {
  return { type: "Tap", beat, col }
}
function HoldNote(
  beat: number,
  col: number,
  length: number
): PartialHoldNotedataEntry {
  return { type: "Hold", beat, col, hold: length }
}
function RollNote(
  beat: number,
  col: number,
  length: number
): PartialHoldNotedataEntry {
  return { type: "Roll", beat, col, hold: length }
}
function MineNote(beat: number, col: number): PartialNotedataEntry {
  return { type: "Mine", beat, col }
}
function LiftNote(beat: number, col: number): PartialNotedataEntry {
  return { type: "Lift", beat, col }
}
function FakeNote(beat: number, col: number): PartialNotedataEntry {
  return { type: "Fake", beat, col }
}

// define all functions in scope
{
  const props = [
    ["isHoldNote", isHoldNote],
    ["isTapNote", isTapNote],
    ["TIMING_EVENT_NAMES", TIMING_EVENT_NAMES],
    ["Foot", Foot],
    ["BPMEvent", BPMEvent],
    ["StopEvent", StopEvent],
    ["WarpEvent", WarpEvent],
    ["DelayEvent", DelayEvent],
    ["ScrollEvent", ScrollEvent],
    ["TickCountEvent", TickCountEvent],
    ["FakeEvent", FakeEvent],
    ["LabelEvent", LabelEvent],
    ["SpeedEvent", SpeedEvent],
    ["TimeSignatureEvent", TimeSignatureEvent],
    ["ComboEvent", ComboEvent],
    ["AttackEvent", AttackEvent],
    ["BGChangeEvent", BGChangeEvent],
    ["FGChangeEvent", FGChangeEvent],
    ["TapNote", TapNote],
    ["HoldNote", HoldNote],
    ["RollNote", RollNote],
    ["MineNote", MineNote],
    ["LiftNote", LiftNote],
    ["FakeNote", FakeNote],
  ]
  for (const [name, value] of props) {
    // @ts-expect-error no-explicit-any
    self[name] = value
  }
}

type RangeData = {
  /** The start of the selection range in both beats and seconds. */
  start: { beat: number; second: number }
  /** The end of the selection range in both beats and seconds. */
  end: { beat: number; second: number }
}

type SelectionData =
  | {
      /** The type of the current selection. "notes" if the selection is of notes, "timing" if the selection is of timing events */
      type: "notes"
      /** The array of selected objects. This will be a list of note objects or timing events. */
      selection: NotedataEntry[]
      /** The range of the selection in both beats and seconds. */
      range: RangeData
    }
  | {
      /** The type of the current selection. "notes" if the selection is of notes, "timing" if the selection is of timing events */
      type: "timing"
      /** The array of selected objects. This will be a list of note objects or timing events. */
      selection: TimingEvent[]
      /** The range of the selection in both beats and seconds. */
      range: RangeData
    }

interface WorkerArgs {
  ARGS: (string | number | boolean)[]
  SM: Simfile
  CHART: Chart
  SELECTION: SelectionData | null
}

type ArgWindow = WorkerArgs & typeof globalThis & Window

self.onmessage = async (event: MessageEvent<CustomScriptWorkerArgs>) => {
  const { smPayload, codePayload, chartId, selection, args } = event.data
  new EventHandler()
  new ActionHistory()

  {
    const win = self as ArgWindow
    win.ARGS = args
    win.SM = await createSMFromPayload(smPayload)
    win.CHART = win.SM.charts[chartId]
    if (selection) {
      if (selection.type === "notes") {
        const obj = win.CHART.getNotedata()
        win.SELECTION = {
          type: selection.type,
          selection: selection.indices.map(i => obj[i]),
          range: selection.range,
        }
      } else {
        const obj = win.CHART.timingData.getTimingData()
        win.SELECTION = {
          type: selection.type,
          selection: selection.indices.map(i => obj[i]),
          range: selection.range,
        }
      }
    } else {
      win.SELECTION = null
    }
  }

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
  self.postMessage({
    type: "payload",
    payload: createSMPayload((self as ArgWindow).SM),
  })
}
