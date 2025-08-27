import * as monaco from "monaco-editor"

import editorWorker from "monaco-editor/esm/vs/editor/editor.worker?worker"
import cssWorker from "monaco-editor/esm/vs/language/css/css.worker?worker"
import htmlWorker from "monaco-editor/esm/vs/language/html/html.worker?worker"
import jsonWorker from "monaco-editor/esm/vs/language/json/json.worker?worker"
import tsWorker from "monaco-editor/esm/vs/language/typescript/ts.worker?worker"

import smeLib from "./smlib.d.ts?raw"

self.MonacoEnvironment = {
  getWorker(_, label) {
    if (label === "json") {
      return new jsonWorker()
    }
    if (label === "css" || label === "scss" || label === "less") {
      return new cssWorker()
    }
    if (label === "html" || label === "handlebars" || label === "razor") {
      return new htmlWorker()
    }
    if (label === "typescript" || label === "javascript") {
      return new tsWorker()
    }
    return new editorWorker()
  },
}

let initialized = false

function initializeMonaco() {
  initialized = true
  monaco.languages.typescript.typescriptDefaults.addExtraLib(
    smeLib,
    "file:///SMEditorLib.d.ts"
  )
  monaco.languages.typescript.typescriptDefaults.addExtraLib(
    `
    import { Chart } from "app/src/chart/sm/Chart"
    import { Simfile } from "app/src/chart/sm/Simfile"
    import { NotedataEntry, PartialNotedataEntry, PartialHoldNotedataEntry } from "app/src/chart/sm/NoteTypes"
    import { BPMTimingEvent, StopTimingEvent, WarpTimingEvent, DelayTimingEvent, ScrollTimingEvent, TickcountTimingEvent, FakeTimingEvent, LabelTimingEvent, SpeedTimingEvent, TimeSignatureTimingEvent, ComboTimingEvent, AttackTimingEvent, FGChangeTimingEvent, BGChangeTimingEvent } from "app/src/chart/sm/TimingTypes"
    declare global {
      /**
       * The current chart being edited.
       */
      const chart: Chart;
      /**
       * The current simfile being edited.
       */
      const sm: Simfile;
      /**
       * The currently selected notes in the editor. Returns [] if no notes are selected.
       */
      const selection: NotedataEntry[];
      /**
       * The arguments passed to the script.
       */
      const args: any;
      /**
       * Create a new BPM timing event. A BPM timing event changes the song's tempo.
       *
       * @param {number} beat The beat at which to place the BPM event.
       * @param {number} bpm The tempo in beats per minute.
       * @return BPMTimingEvent
       */
      function BPMEvent(beat: number, bpm: number): BPMTimingEvent
      /**
       * Create a new Stop timing event. A Stop timing event pauses the chart for a specified duration.
       * Notes placed on the same beat as a Stop timing event will be hit *before* the Stop.
       *
       * @param {number} beat The beat at which to place the Stop event.
       * @param {number} seconds The duration of the Stop event in seconds.
       * @return StopTimingEvent
       */
      function StopEvent(beat: number, seconds: number): StopTimingEvent
      /**
       * Create a new Warp timing event. A Warp timing event skips a specified number of beats.
       *
       * @param {number} beat The beat at which to place the Warp event.
       * @param {number} beats The number of beats to warp over.
       * @return WarpTimingEvent
       */
      function WarpEvent(beat: number, beats: number): WarpTimingEvent
      /**
       * Create a new Delay timing event. A Delay timing event delays the chart for a specified duration.
       * Notes placed on the same beat as a Delay timing event will be hit *after* the Delay.
       *
       * @param {number} beat The beat at which to place the Delay event.
       * @param {number} seconds The duration of the Delay event in seconds.
       * @return DelayTimingEvent
       */
      function DelayEvent(beat: number, seconds: number): DelayTimingEvent
      /**
       * Create a new Scroll timing event. A Scroll timing event changes the scroll speed of a part of the chart.
       *
       * @param {number} beat The beat at which to place the Scroll event.
       * @param {number} factor The scroll speed factor. A value of 1.0 is normal speed, 2.0 is double speed, and 0.5 is half speed.
       * @return ScrollTimingEvent
       */
      function ScrollEvent(beat: number, factor: number): ScrollTimingEvent
      /**
       * Create a new TickCount timing event. A TickCount timing event changes the number of hold ticks per beat for game modes that give combo on holds.
       *
       * @param {number} beat The beat at which to place the TickCount event.
       * @param {number} ticks The number of ticks per beat.
       * @return TickCountTimingEvent
       */
      function TickCountEvent(beat: number, ticks: number): TickCountTimingEvent
      /**
       * Create a new Fake timing event. A Fake timing event creates a section of the chart that is not played.
       *
       * @param {number} beat The beat at which to place the Fake event.
       * @param {number} beats The number of beats to fake.
       * @return FakeTimingEvent
       */
      function FakeEvent(beat: number, beats: number): FakeTimingEvent
      /**
       * Create a new Label timing event.
       *
       * @param {number}  beat The beat at which to place the Label event.
       * @param {string} label The text of the label.
       * @return LabelTimingEvent
       */
      function LabelEvent(beat: number, label: string): LabelTimingEvent
      /**
       * Create a new Speed timing event. A Speed timing event changes the scroll speed of the notefield.
       *
       * @param {number} beat The beat at which to place the Speed event.
       * @param {number} factor The scroll speed factor. A value of 1.0 is normal speed, 2.0 is double speed, and 0.5 is half speed.
       * @param {number} delay The number of beats or seconds that the change takes to occur.
       * @param {"Beats" | "Seconds"} unit The unit of the delay. "Beats" means the delay is in beats, "Seconds" means the delay is in seconds.
       * @return SpeedTimingEvent
       */
      function SpeedEvent(beat: number, factor: number, delay: number, unit: "Beats" | "Seconds"): SpeedTimingEvent
      /**
       * Create a new TimeSignature timing event.
       *
       * @param {number} beat The beat at which to place the TimeSignature event.
       * @param {number} upper The upper number of the time signature.
       * @param {number} lower The lower number of the time signature.
       * @return TimeSignatureTimingEvent
       */
      function TimeSignatureEvent(beat: number, upper: number, lower: number): TimeSignatureTimingEvent
      /**
       * Create a new Combo timing event. A Combo timing event changes the combo multiplier for hits and misses.
       *
       * @param {number} beat The beat at which to place the Combo event.
       * @param {number} hitMult The combo multiplier for hits.
       * @param {number} missMult The combo multiplier for misses.
       * @return ComboTimingEvent
       */
      function ComboEvent(beat: number, hitMult: number, missMult: number): ComboTimingEvent
      /**
       * Create a new Attack timing event. An Attack timing event applies modifiers to the notefield.
       *
       * @param {number} second The second at which to place the Attack event.
       * @param {"Length" | "End"} endType Whether the value is a length in seconds or an end time in seconds.
       * @param {number} value The length or end time of the Attack event in seconds.
       * @param {string} mods The modifiers to apply to the notefield.
       * @return AttackTimingEvent
       */
      function AttackEvent(second: number, endType: "Length" | "End", value: number, mods: string): AttackTimingEvent
      function BGChangeEvent(beat: number, file: string, updateRate: number, crossFade: boolean, stretchRewind: boolean, stretchNoLoop: boolean, effect: string, file2: string, transition: string, color1: string, color2: string): BGChangeTimingEvent
      function FGChangeEvent(beat: number, file: string, updateRate: number, crossFade: boolean, stretchRewind: boolean, stretchNoLoop: boolean, effect: string, file2: string, transition: string, color1: string, color2: string): FGChangeTimingEvent

      /**
       * Creates a tap note.
       *
       * @param {number} beat The beat at which to place the tap note.
       * @param {number} col The column of the tap note.
       * @return PartialNotedataEntry
       */
      function TapNote(beat: number, col: number): PartialNotedataEntry
      /**
       * Creates a hold note.
       *
       * @param {number} beat The beat at which to place the hold note.
       * @param {number} col The column of the hold note.
       * @param {number} length The length of the hold note in beats.
       * @return PartialHoldNotedataEntry
       */
      function HoldNote(beat: number, col: number, length: number): PartialHoldNotedataEntry
      /**
       * Creates a roll note.
       *
       * @param {number} beat The beat at which to place the roll note.
       * @param {number} col The column of the roll note.
       * @param {number} length The length of the roll note in beats.
       * @return PartialHoldNotedataEntry
       */
      function RollNote(beat: number, col: number, length: number): PartialHoldNotedataEntry
      /**
       * Creates a mine note.
       *
       * @param {number} beat The beat at which to place the mine note.
       * @param {number} col The column of the mine note.
       * @return PartialNotedataEntry
       */
      function MineNote(beat: number, col: number): PartialNotedataEntry
      /**
       * Creates a lift note.
       *
       * @param {number} beat The beat at which to place the lift note.
       * @param {number} col The column of the lift note.
       * @return PartialNotedataEntry
       */
      function LiftNote(beat: number, col: number): PartialNotedataEntry
      /**
       * Creates a fake note.
       *
       * @param {number} beat The beat at which to place the fake note.
       * @param {number} col The column of the fake note.
       * @return PartialNotedataEntry
       */
      function FakeNote(beat: number, col: number): PartialNotedataEntry
    }

    export {}
  `,
    "file:///ScriptUtils.d.ts"
  )
  monaco.languages.typescript.typescriptDefaults.setDiagnosticsOptions({
    ...monaco.languages.typescript.typescriptDefaults.getDiagnosticsOptions(),
    noSemanticValidation: false,
    noSuggestionDiagnostics: false,
    noSyntaxValidation: false,
  })

  monaco.languages.typescript.typescriptDefaults.setCompilerOptions({
    ...monaco.languages.typescript.typescriptDefaults.getCompilerOptions(),
    lib: ["es2020"],
  })

  const legend = {
    tokenTypes: ["variable"],
    tokenModifiers: ["readonly"],
  }
  const globals = ["sm", "chart", "selection", "args"]

  monaco.languages.registerDocumentSemanticTokensProvider("typescript", {
    getLegend: function () {
      return legend
    },
    provideDocumentSemanticTokens: function (model, _lastResultId, _token) {
      const lines = model.getLinesContent()

      const data = []

      let prevLine = 0
      let prevChar = 0

      for (let i = 0; i < lines.length; i++) {
        const line = lines[i]

        const matches = line.matchAll(/(?:[^.\w]?)(\w+)/g)

        for (const match of matches) {
          if (!globals.includes(match[1])) {
            continue
          }
          data.push(
            i - prevLine,
            prevLine === i ? match.index - prevChar : match.index,
            match[0].length,
            0,
            1
          )
          prevLine = i
          prevChar = match.index
        }
      }
      return {
        data: new Uint32Array(data),
      }
    },
    releaseDocumentSemanticTokens: () => {},
  })

  monaco.editor.defineTheme("dark", {
    base: "vs-dark",
    inherit: true,
    colors: {},
    rules: [
      {
        token: "variable.readonly",
        foreground: "#56ddffff",
      },
    ],
  })

  monaco.editor.defineTheme("light", {
    base: "vs",
    inherit: true,
    colors: {},
    rules: [
      {
        token: "variable.readonly",
        foreground: "#006bb3",
      },
    ],
  })
}

export type CustomEditor = ReturnType<typeof createEditor>

export function createEditor(
  parent: HTMLElement,
  value: string,
  theme: "light" | "dark"
) {
  if (!initialized) initializeMonaco()
  const model = monaco.editor.createModel(
    value,
    "typescript",
    monaco.Uri.parse(`file:///main.ts`)
  )

  const editor = monaco.editor.create(parent, {
    model,
    automaticLayout: true,
    theme,
    minimap: { enabled: false },
    "semanticHighlighting.enabled": true,
  })

  return {
    transpile: async () => {
      const client = await monaco.languages.typescript
        .getTypeScriptWorker()
        .then(worker => worker())
      const result = await client.getEmitOutput("file:///main.ts")
      return result.outputFiles[0].text
    },
    getTS: () => {
      return model.getValue()
    },
    setJS: (code: string) => {
      model.setValue(code)
    },
    swapTheme(theme: "light" | "dark") {
      monaco.editor.setTheme(theme)
    },
    destroy: () => {
      model.dispose()
      editor.dispose()
    },
  }
}
