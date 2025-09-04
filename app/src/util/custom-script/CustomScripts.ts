import { WaterfallManager } from "../../gui/element/WaterfallManager"
import { CustomScript } from "./CustomScriptTypes"

const DEFAULT_SCRIPTS: CustomScript[] = [
  {
    name: "Normalize BPMs",
    description:
      "Adds scrolls to every BPM change to maintain a constant scroll speed. Uses the maximum BPM to determine the scroll speed.",
    tsCode: `const bpms = chart.timingData.getTimingData("BPMS")
let maxBPM = 0
for (const bpm of bpms) {
    if (bpm.value <= 0) continue
    maxBPM = Math.max(maxBPM, bpm.value)
}
const scrolls = bpms.map(bpm => ScrollEvent(bpm.beat, maxBPM / Math.abs(bpm.value)))
chart.timingData.insertColumnEvents(scrolls)
`,
    jsCode: `const bpms = chart.timingData.getTimingData("BPMS");
let maxBPM = 0;
for (const bpm of bpms) {
    if (bpm.value <= 0)
        continue;
    maxBPM = Math.max(maxBPM, bpm.value);
}
const scrolls = bpms.map(bpm => ScrollEvent(bpm.beat, maxBPM / Math.abs(bpm.value)));
chart.timingData.insertColumnEvents(scrolls);
`,
    arguments: [],
    keybinds: [],
  },
]

export class CustomScripts {
  static _scripts: CustomScript[]
  static get scripts() {
    if (!this._scripts) {
      this._scripts = []
      this.loadCustomScripts()
    }
    return this._scripts
  }
  static loadCustomScripts() {
    const data = localStorage.getItem("customScripts")
    if (!data) {
      this._scripts = DEFAULT_SCRIPTS
      return
    }
    try {
      const parsed: CustomScript[] = JSON.parse(data)
      const scripts: CustomScript[] = []
      if (!Array.isArray(parsed)) {
        this._scripts = DEFAULT_SCRIPTS
        return
      }
      for (const script of parsed) {
        try {
          if (
            typeof script.name !== "string" ||
            typeof script.jsCode !== "string" ||
            typeof script.tsCode !== "string" ||
            typeof script.description !== "string" ||
            !Array.isArray(script.arguments) ||
            !Array.isArray(script.keybinds)
          ) {
            throw new Error("Invalid script format")
          }
          for (const arg of script.arguments) {
            if (
              !(
                [
                  "number",
                  "checkbox",
                  "color",
                  "text",
                  "dropdown",
                  "slider",
                ] as const
              ).includes(arg.type)
            ) {
              throw new Error("Invalid argument type: " + arg.type)
            }
            if (
              typeof arg.name !== "string" ||
              typeof arg.description !== "string"
            ) {
              throw new Error("Invalid argument format")
            }
          }
          for (const kbd of script.keybinds) {
            if (typeof kbd.key !== "string" || !Array.isArray(kbd.mods)) {
              throw new Error("Invalid keybind format")
            }
          }
          scripts.push(script)
        } catch (error) {
          WaterfallManager.createFormatted(
            "Failed to load custom script: " + error,
            "error"
          )
        }
      }
      this._scripts = scripts
    } catch (error) {
      WaterfallManager.createFormatted(
        "Couldn't parse custom scripts: " + error,
        "error"
      )
    }
  }

  static saveCustomScripts() {
    localStorage.setItem("customScripts", JSON.stringify(this.scripts))
  }
}
