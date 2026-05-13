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
    arguments: [],
  },

  {
    name: "Gradual tempo ramp",
    description:
      "Adds BPMs to approximate gradually increasing tempos. Use this for tempos that increase continuously and not for stepwise changes.",
    arguments: [
      {
        name: "Starting BPM",
        description: "",
        type: "number",
        default: 120,
        min: 0,
        max: 10000,
        step: 1,
        precision: 3,
      },
      {
        name: "Ending BPM",
        description: "",
        type: "number",
        default: 160,
        min: 0,
        max: 10000,
        step: 1,
        precision: 3,
      },
      {
        name: "Interval",
        description:
          "The frequency in beats to place BPM events. Smaller values result in more accurate timing, but may be unnecessary.",
        type: "number",
        default: 0.25,
        min: 0.005,
        max: 100,
        step: 0.05,
        precision: 3,
      },
    ],
    tsCode: `function run() {
    if (!SELECTION) {
        console.error("No selection present!")
        return
    }

    let [startBPM, endBPM, interval] = ARGS as [number, number, number]
    let startBeat = SELECTION.range.start.beat
    let endBeat = SELECTION.range.end.beat

    const bpms: BPMTimingEvent[] = []
    const deltaBPM = endBPM - startBPM
    const duration = endBeat - startBeat
    let beatsToSeconds = (beat) => {
        // get the second at a beat
        return 60 * duration / (deltaBPM) * Math.log(deltaBPM * beat / (startBPM * duration) + 1)
    }
    for (let b = 0; b < endBeat - startBeat; b += interval) {
        let timePassed = beatsToSeconds(b + interval) - beatsToSeconds(b)
        bpms.push(BPMEvent(b + startBeat, interval / timePassed * 60))
    }
    if (bpms.at(-1)?.beat != endBeat) {
        bpms.push(BPMEvent(endBeat, endBPM))
    }
    CHART.timingData.insertColumnEvents(bpms)
}

run()`,
    jsCode: `function run() {
    if (!SELECTION) {
        console.error("No selection present!");
        return;
    }
    let [startBPM, endBPM, interval] = ARGS;
    let startBeat = SELECTION.range.start.beat;
    let endBeat = SELECTION.range.end.beat;
    const bpms = [];
    const deltaBPM = endBPM - startBPM;
    const duration = endBeat - startBeat;
    let beatsToSeconds = (beat) => {
        // get the second at a beat
        return 60 * duration / (deltaBPM) * Math.log(deltaBPM * beat / (startBPM * duration) + 1);
    };
    for (let b = 0; b < endBeat - startBeat; b += interval) {
        let timePassed = beatsToSeconds(b + interval) - beatsToSeconds(b);
        bpms.push(BPMEvent(b + startBeat, interval / timePassed * 60));
    }
    if (bpms.at(-1)?.beat != endBeat) {
        bpms.push(BPMEvent(endBeat, endBPM));
    }
    CHART.timingData.insertColumnEvents(bpms);
}
run();`,
  },
  {
    name: "Stepping tempo ramp",
    description:
      "Adds BPM events that change the tempo by a specified amount over a range",
    arguments: [
      {
        type: "number",
        name: "Starting BPM",
        description: "",
        default: 120,
        min: 0,
        max: 10000,
        step: 1,
        precision: 3,
      },
      {
        type: "number",
        name: "Change",
        description: "The BPM delta that is applied every interval",
        default: 1,
        min: -100,
        max: 100,
        step: 1,
        precision: 3,
      },
      {
        type: "number",
        name: "Interval",
        description: "The frequency in beats to change the BPM.",
        default: 1,
        min: 0.005,
        max: 100,
        step: 0.25,
        precision: 3,
      },
    ],
    tsCode: `function run() {
    if (!SELECTION) {
        console.error("No selection present!")
        return
    }

    let [startBPM, delta, interval] = ARGS as [number, number, number]
    let startBeat = SELECTION.range.start.beat
    let endBeat = SELECTION.range.end.beat

    const bpms = []
    let currentBPM = startBPM
    for (let b = 0; b < endBeat - startBeat; b += interval) {
        bpms.push(BPMEvent(b + startBeat, currentBPM))
        currentBPM += delta
    }
    CHART.timingData.insertColumnEvents(bpms)
}

run()`,
    jsCode: `function run() {
    if (!SELECTION) {
        console.error("No selection present!");
        return;
    }
    let [startBPM, delta, interval] = ARGS;
    let startBeat = SELECTION.range.start.beat;
    let endBeat = SELECTION.range.end.beat;
    const bpms = [];
    let currentBPM = startBPM;
    for (let b = 0; b < endBeat - startBeat; b += interval) {
        bpms.push(BPMEvent(b + startBeat, currentBPM));
        currentBPM += delta;
    }
    CHART.timingData.insertColumnEvents(bpms);
}
run();`,
  },
  {
    name: "Add fakes to mines",
    description:
      "Adds fake segments to all mines in the chart. If there is a region selected, this only applies to the region.",
    arguments: [],
    jsCode: `let startBeat = SELECTION?.range.start.beat ?? 0;
let endBeat = SELECTION?.range.end.beat ?? CHART.getLastBeat();
const fakes = [];
for (const row of CHART.getRowsInRange(startBeat, endBeat)) {
    if (row.warped || row.faked)
        continue;
    if (row.notes.some(note => note.type == "Mine")) {
        if (row.notes.some(note => note.type != "Fake" && note.type != "Mine")) {
            console.warn("A mine could not be faked due to another note at beat " + row.beat);
        }
        else {
            fakes.push(FakeEvent(row.beat, 1 / 48));
        }
    }
}
console.log(\`Applied \${fakes.length} fakes\`);
CHART.timingData.insertColumnEvents(fakes);`,
    tsCode:
      'let startBeat = SELECTION?.range.start.beat ?? 0\nlet endBeat = SELECTION?.range.end.beat ?? CHART.getLastBeat()\n\nconst fakes = []\nfor (const row of CHART.getRowsInRange(startBeat, endBeat)) {\n    if (row.warped || row.faked) continue\n    if (row.notes.some(note => note.type == "Mine")) {\n        if (row.notes.some(note => note.type != "Fake" && note.type != "Mine")) {\n            console.warn("A mine could not be faked due to another note at beat " + row.beat)\n        } else {\n            fakes.push(FakeEvent(row.beat, 1/48))\n        }\n    }\n}\nconsole.log(`Applied ${fakes.length} fakes`)\nCHART.timingData.insertColumnEvents(fakes)',
  },
  {
    name: "Stutter gimmick",
    description: "Uses scrolls to create a stutter gimmick",
    arguments: [
      {
        name: "Stutter Factor",
        description:
          "How strong the stutter is. A higher factor means each pause will last longer",
        type: "number",
        default: 2,
        min: 1.1,
        max: 100,
        step: 1,
        precision: 1,
      },
      {
        type: "checkbox",
        name: "Apply to other types",
        description: "Whether to apply the stutter to fakes and mines",
        default: false,
      },
    ],
    jsCode: `function run() {
    if (!SELECTION) {
        console.error("No selection present!");
        return;
    }
    let factor = ARGS[0];
    let applyAll = ARGS[1];
    let startBeat = SELECTION.range.start.beat;
    let endBeat = SELECTION.range.end.beat;
    const scrolls = [];
    let notes = CHART.getNotedataInRange(startBeat, endBeat);
    if (!applyAll) {
        notes = notes.filter(note => note.type != "Fake" && note.type != "Mine");
    }
    if (notes.length < 2) {
        console.warn("Not enough notes!");
        return;
    }
    for (let i = 0; i < notes.length - 1; i++) {
        const firstNote = notes[i];
        const nextNote = notes[i + 1];
        let swapPoint = (nextNote.beat - firstNote.beat) * (1 - 1 / factor) + firstNote.beat;
        // snap to nearest 192nd
        swapPoint = Math.round(swapPoint * 48) / 48;
        const actualFactor = (nextNote.beat - firstNote.beat) / (nextNote.beat - swapPoint);
        scrolls.push(ScrollEvent(firstNote.beat, 0));
        scrolls.push(ScrollEvent(swapPoint, actualFactor));
    }
    scrolls.push(ScrollEvent(notes.at(-1).beat, 1));
    CHART.timingData.insertColumnEvents(scrolls);
}
run();`,
    tsCode: `function run() {
    if (!SELECTION) {
        console.error("No selection present!")
        return
    }

    let factor = ARGS[0] as number
    let applyAll = ARGS[1] as boolean
    let startBeat = SELECTION.range.start.beat
    let endBeat = SELECTION.range.end.beat

    const scrolls = []

    let notes = CHART.getNotedataInRange(startBeat, endBeat)
    if (!applyAll) {
        notes = notes.filter(note => note.type != "Fake" && note.type != "Mine")
    }
    if (notes.length < 2) {
        console.warn("Not enough notes!")
        return
    }

    for (let i = 0; i < notes.length - 1; i++) {
        const firstNote = notes[i]
        const nextNote = notes[i+1]
        let swapPoint = (nextNote.beat - firstNote.beat) * (1 - 1 / factor) + firstNote.beat
        // snap to nearest 192nd
        swapPoint = Math.round(swapPoint * 48) / 48
        const actualFactor = (nextNote.beat - firstNote.beat) / (nextNote.beat - swapPoint)
        scrolls.push(ScrollEvent(firstNote.beat, 0))
        scrolls.push(ScrollEvent(swapPoint, actualFactor))
    }
    scrolls.push(ScrollEvent(notes.at(-1)!.beat, 1))

    CHART.timingData.insertColumnEvents(scrolls)
}

run()`,
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
          CustomScriptRunner.runPrompt(
            app,
            script,
            (type, data) => {
              if (type === "error" || type === "warn") {
                WaterfallManager.createFormatted(data.toString(), type)
              }
            },
            () => {
              WaterfallManager.create(
                `Finished running custom script: ${script.name}`
              )
            }
          )
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
