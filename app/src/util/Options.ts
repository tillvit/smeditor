import { TimingEventType } from "../chart/sm/TimingTypes"
import { EventHandler } from "./EventHandler"

const SAVE_BLACKLIST = [
  "audio.rate",
  "chart.snap",
  "chart.CMod",
  "play.timingCollection",
]

export class DefaultOptions {
  static app = {
    width: 800,
    height: 600,
    fullscreen: false,
  }
  static general = {
    uiScale: 1,
    spinnerStep: 1,
    smoothAnimations: true,
    autosaveInterval: 120,
    warnBeforeExit: true,
    showPlaybackOptions: true,
    loadSSC: "Prompt",
    theme: "default",
  }
  static chart = {
    CMod: false,
    reverse: false,
    mousePlacement: false,
    defaultHoldPlacement: true,
    zoom: 1,
    speed: 250,
    snap: 1,
    hideWarpedArrows: false,
    hideFakedArrows: false,
    forceSnapNotes: false,
    doSpeedChanges: true,
    drawNoteFlash: true,
    drawIcons: true,
    allowReceptorDrag: true,
    receptorYPos: -250,
    receptorXPos: 0,
    maxDrawBeats: 20,
    maxDrawBeatsBack: 10,
    scroll: {
      scrollSensitivity: 1,
      scrollSnapEveryScroll: !navigator.userAgent.includes("Mac"),
      invertScroll: false,
      invertZoomScroll: false,
      invertReverseScroll: true,
    },
    parity: {
      enabled: false,
      showHighlights: false,
      showTech: true,
      showCandles: true,
      showErrors: true,
      showDancingBot: true,
    },
    waveform: {
      enabled: true,
      antialiasing: true,
      color: "#60617288",
      allowFilter: true,
      filteredColor: "#1e523e88",
      lineHeight: 1,
      speedChanges: true,
    },
    layoutFollowPosition: false,
    noteLayout: {
      enabled: true,
    },
    npsGraph: {
      enabled: false,
      color1: "#4aa7bcff",
      color2: "#423c7aff",
    },
    facingLayout: {
      enabled: true,
    },
    timingEventOrder: {
      left: [
        "LABELS",
        "FAKES",
        "TIMESIGNATURES",
        "DELAYS",
        "WARPS",
        "STOPS",
        "BPMS",
      ],
      right: [
        "SPEEDS",
        "SCROLLS",
        "TICKCOUNTS",
        "COMBOS",
        "ATTACKS",
        "BGCHANGES",
        "FGCHANGES",
      ],
    },
    renderTimingEvent: {
      BPMS: true,
      STOPS: true,
      DELAYS: true,
      WARPS: true,
      FAKES: true,
      COMBOS: true,
      SPEEDS: true,
      LABELS: true,
      SCROLLS: true,
      TIMESIGNATURES: true,
      TICKCOUNTS: true,
      BGCHANGES: true,
      FGCHANGES: true,
      ATTACKS: true,
    } as { [key in TimingEventType]: boolean },
    noteskin: {
      type: "dance-single",
      name: "default",
    },
    lastNoteskins: {
      "dance-single": "default",
      "dance-double": "default",
      "dance-couple": "default",
      "dance-solo": "default",
      "dance-solodouble": "default",
      "dance-threepanel": "default",
      "dance-threedouble": "default",
      "pump-single": "default",
      "pump-double": "default",
      "pump-versus": "default",
      "pump-couple": "default",
      "pump-halfdouble": "default",
    } as Record<string, string>,
  }
  static audio = {
    assistTick: false,
    metronome: false,
    rate: 1,
    masterVolume: 1,
    songVolume: 0.2,
    soundEffectVolume: 0.5,
    allowFilter: true,
  }
  static play = {
    offset: 0,
    effectOffset: 0,
    visualOffset: 0,
    hideBarlines: false,
    judgementTilt: true,
    timingCollection: "ITG",
    timingWindowScale: 1,
    timingWindowAdd: 0,
    defaultTimingCollections: {
      "dance-": "ITG",
      "pump-": "PUMP",
    } as { [key: string]: string },
  }
  static performance = {
    antialiasing: false,
    resolution: window.devicePixelRatio,
  }
  static debug = {
    showFPS: false,
    showTimers: false,
    showScroll: false,
    showNoteskinErrors: false,
    showDebugVariables: false,
    parity: {
      showGraph: false,
      limitGraph: true,
      showDebug: false,
    },
  }
}

export type OptionsObject = {
  [key: string]: any
}

export class Options extends DefaultOptions {
  private static extractOptions(
    obj: { [key: string]: any },
    prefix?: string
  ): [string, any][] {
    return Object.entries(obj).reduce(
      (options, entry) => {
        const p = prefix ? prefix + "." : ""
        if (typeof entry[1] == "object" && !Array.isArray(entry[1])) {
          options = options.concat(
            this.extractOptions(
              entry[1] as { [key: string]: any },
              p + entry[0]
            )
          )
        } else {
          entry[0] = p + entry[0]
          options.push([entry[0], entry[1]])
        }
        return options
      },
      [] as [string, any][]
    )
  }
  static applyOption(option: [string, any]) {
    if (typeof this.getDefaultOption(option[0]) != typeof option[1]) {
      return console.warn(
        "Couldn't load option " +
          option[0] +
          ": the value " +
          option[1] +
          " (" +
          typeof option[1] +
          ") " +
          " does not match the type " +
          typeof this.getDefaultOption(option[0])
      )
    }
    const path = option[0].split(".")
    const name = path.pop()!
    let obj: OptionsObject = this as unknown as OptionsObject
    for (const part of path) {
      if (part in obj) obj = obj[part] as OptionsObject
      else
        return console.warn(
          "Couldn't load option " + option[0] + ": the id doesn't exist"
        )
    }
    obj[name] = option[1]
  }
  static getDefaultOption(id: string): any {
    const path = id.split(".")
    let obj: OptionsObject = DefaultOptions as unknown as OptionsObject
    for (const part of path) {
      if (part in obj) obj = obj[part] as OptionsObject
      else return
    }
    if (typeof obj == "object" && !Array.isArray(obj)) return
    return obj as any
  }
  static getOption(id: string): any {
    const path = id.split(".")
    let obj: OptionsObject = this as unknown as OptionsObject
    for (const part of path) {
      if (part in obj) obj = obj[part] as OptionsObject
      else return
    }
    if (typeof obj == "object" && !Array.isArray(obj)) return
    return obj as any
  }
  static saveOptions() {
    const obj: { [key: string]: any } = {}
    for (const option of this.extractOptions(this)) {
      if (SAVE_BLACKLIST.includes(option[0])) continue
      const defaultOption = this.getDefaultOption(option[0])
      if (defaultOption == undefined) {
        console.warn(
          "Couldn't save option " + option[0] + ": the id doesn't exist"
        )
        continue
      }
      if (typeof defaultOption != typeof option[1]) {
        console.warn(
          "Couldn't save option " +
            option[0] +
            ": the value " +
            option[1] +
            " does not match the type " +
            typeof this.getDefaultOption(option[0])
        )
        obj[option[0]] = defaultOption
      } else {
        obj[option[0]] = option[1]
      }
    }
    localStorage.setItem("options", JSON.stringify(obj))
  }
  static loadOptions() {
    const data = localStorage.getItem("options")
    if (!data) return
    const items = JSON.parse(data) as {
      [key: string]: any
    }
    if (typeof items != "object")
      return console.error("Couldn't load options from storage")
    for (const item of Object.entries(items)) {
      if (SAVE_BLACKLIST.includes(item[0])) continue
      this.applyOption(item)
    }
  }
  static clearSave() {
    localStorage.removeItem("options")
  }
}

function hookObject(object: any, copy: any, key = "") {
  for (const [k, v] of Object.entries(copy)) {
    if (typeof v == "object" && !Array.isArray(v)) {
      object[k] = {}
      hookObject(object[k], v, key == "" ? k : key + "." + k)
    } else {
      let internalValue = structuredClone(v)
      const id = key + "." + k
      Object.defineProperty(object, k, {
        get: function () {
          return internalValue
        },
        set: function (value) {
          internalValue = value
          EventHandler.emit("userOptionUpdated", id)
        },
        enumerable: true,
      })
    }
  }
}
hookObject(Options, DefaultOptions)
