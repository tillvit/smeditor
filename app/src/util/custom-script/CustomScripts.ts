import { KEYBIND_DATA } from "../../data/KeybindData"
import { MENUBAR_DATA, MenuOption } from "../../data/MenubarData"
import { WaterfallManager } from "../../gui/element/WaterfallManager"
import { CustomScriptRunner } from "./CustomScriptRunner"
import { CustomScript, CustomScriptSchema } from "./CustomScriptTypes"

const DEFAULT_SCRIPTS: CustomScript[] = [
  {
    name: "Normalize BPMs",
    description:
      "Adds scrolls to every BPM change to maintain a constant scroll speed. Uses the maximum BPM to determine the scroll speed.",
    tsCode: `const bpms = CHART.timingData.getTimingData("BPMS")
let maxBPM = 0
for (const bpm of bpms) {
    if (bpm.value <= 0) continue
    maxBPM = Math.max(maxBPM, bpm.value)
}
const scrolls = bpms.map(bpm => ScrollEvent(bpm.beat, maxBPM / Math.abs(bpm.value)))
CHART.timingData.insertColumnEvents(scrolls)
`,
    jsCode: `const bpms = CHART.timingData.getTimingData("BPMS");
let maxBPM = 0;
for (const bpm of bpms) {
    if (bpm.value <= 0)
        continue;
    maxBPM = Math.max(maxBPM, bpm.value);
}
const scrolls = bpms.map(bpm => ScrollEvent(bpm.beat, maxBPM / Math.abs(bpm.value)));
CHART.timingData.insertColumnEvents(scrolls);
`,
    arguments: [
      {
        type: "checkbox",
        name: "Example Argument",
        description: "This is an example argument",
        default: true,
      },
      {
        type: "text",
        name: "Another Argument",
        description: "This is another argument",
        default: "Hello World",
      },
      {
        type: "number",
        name: "Yet Another Argument",
        description: "This is yet another argument",
        default: 42,
        min: 0,
        max: 100,
        step: 1,
        precision: 0,
      },
      {
        type: "slider",
        name: "Final Argument",
        description: "This is the final argument",
        default: 0,
        min: 0,
        max: 100,
      },
      {
        type: "dropdown",
        name: "Dropdown Argument",
        description: "This is a dropdown argument",
        values: ["Option 1", "Option 2", "Option 3"],
        default: "Option 1",
      },
      {
        type: "color",
        name: "Final Argument",
        description: "This is the final argument",
        default: "#ffffff",
      },
    ],
  },
]

export class CustomScripts {
  static usedKeybindIds: string[] = []
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
          scripts.push(CustomScriptSchema.parse(script))
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
    this.installScripts()
  }

  static installScripts() {
    this.usedKeybindIds.forEach(id => {
      delete KEYBIND_DATA[id]
    })
    this.usedKeybindIds = []
    for (let i = 0; i < this.scripts.length; i++) {
      const script = this.scripts[i]
      let keybindId =
        "customScript-" + Math.random().toString(36).substring(2, 15)
      while (this.usedKeybindIds.includes(keybindId)) {
        keybindId =
          "customScript-" + Math.random().toString(36).substring(2, 15)
      }
      KEYBIND_DATA[keybindId] = {
        label: script.name,
        disabled: app =>
          !app.chartManager.loadedSM || !app.chartManager.loadedChart,
        combos: [],
        callback: app => {
          WaterfallManager.create(`Running custom script: ${script.name}`)
          CustomScriptRunner.runPrompt(app, script, undefined, () => {
            WaterfallManager.create(
              `Finished running custom script: ${script.name}`
            )
          })
        },
      }
      this.usedKeybindIds[i] = keybindId
    }

    if (this.usedKeybindIds.length > 0) {
      MENUBAR_DATA.scripts.options = this.usedKeybindIds
        .map(
          id =>
            ({
              type: "selection",
              id,
            }) as MenuOption
        )
        .concat([
          {
            type: "separator",
          },
          {
            type: "selection",
            id: "editCustomScripts",
          },
          {
            type: "selection",
            id: "stopAllScripts",
          },
        ])
    } else {
      MENUBAR_DATA.scripts.options = [
        {
          type: "selection",
          id: "editCustomScripts",
        },
        {
          type: "selection",
          id: "stopAllScripts",
        },
      ]
    }
  }

  static saveCustomScripts() {
    localStorage.setItem("customScripts", JSON.stringify(this.scripts))
    this.installScripts()
  }
}
