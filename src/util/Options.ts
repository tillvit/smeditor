import { TimingEventProperty } from "../chart/sm/TimingTypes"

const SAVE_BLACKLIST = [
  "audio.rate",
  "chart.snap",
  "chart.CMod",
  "play.timingCollection",
]

export const VIEW_BLACKLIST: string[] = []

class DefaultOptions {
  static general = {
    scrollSensitivity: 1,
    mousePlacement: false,
    smoothAnimations: true,
  }
  static chart = {
    CMod: false,
    reverse: false,
    zoom: 1,
    speed: 250,
    snap: 1,
    hideWarpedArrows: false,
    doSpeedChanges: true,
    drawNoteFlash: true,
    receptorYPos: -200,
    maxDrawBeats: 20,
    maxDrawBeatsBack: 10,
    waveform: {
      enabled: true,
      color: 0x606172,
      opacity: 0.5,
      lineHeight: 1,
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
    } as { [key in TimingEventProperty]: boolean },
  }
  static audio = {
    assistTick: false,
    metronome: false,
    rate: 1,
    songVolume: 0.2,
    soundEffectVolume: 0.5,
    effectOffset: 0,
  }
  static play = {
    offset: 0,
    hideBarlines: false,
    judgmentTilt: true,
    timingCollection: "ITG",
    timingWindowScale: 1,
    timingWindowAdd: 0,
    defaultTimingCollection: {
      "dance-single": "ITG",
      "dance-double": "ITG",
      "dance-3panel": "ITG",
      "dance-solo": "ITG",
      "dance-solodouble": "ITG",
    } as { [key: string]: string },
  }
  static performance = {
    antialiasing: false,
    resolution: window.devicePixelRatio,
  }
  static debug = {
    renderingStats: false,
    showTimers: false,
  }
  static experimental = {
    speedChangeWaveform: true,
  }
}

export type OptionsObject = {
  [key: string]: string | number | boolean | OptionsObject
}

export class Options extends DefaultOptions {
  private static extractOptions(
    obj: { [key: string]: any },
    prefix?: string
  ): [string, string | number | boolean][] {
    return Object.entries(obj).reduce((options, entry) => {
      const p = prefix ? prefix + "." : ""
      if (typeof entry[1] == "object") {
        options = options.concat(
          this.extractOptions(entry[1] as { [key: string]: any }, p + entry[0])
        )
      } else {
        entry[0] = p + entry[0]
        options.push([entry[0], entry[1] as string | number | boolean])
      }
      return options
    }, [] as [string, string | number | boolean][])
  }
  static applyOption(option: [string, string | number | boolean]) {
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
  static getDefaultOption(id: string): string | number | boolean | undefined {
    const path = id.split(".")
    let obj: OptionsObject = DefaultOptions as unknown as OptionsObject
    for (const part of path) {
      if (part in obj) obj = obj[part] as OptionsObject
      else return
    }
    if (
      typeof obj != "string" &&
      typeof obj != "number" &&
      typeof obj != "boolean"
    )
      return
    return obj
  }
  static getOption(id: string): string | number | boolean | undefined {
    const path = id.split(".")
    let obj: OptionsObject = this as unknown as OptionsObject
    for (const part of path) {
      if (part in obj) obj = obj[part] as OptionsObject
      else return
    }
    if (
      typeof obj != "string" &&
      typeof obj != "number" &&
      typeof obj != "boolean"
    )
      return
    return obj
  }
  static saveOptions() {
    const obj: { [key: string]: string | number | boolean } = {}
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
      [key: string]: string | number | boolean
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

const obj: { [key: string]: any } = {}
for (const e of Object.entries(DefaultOptions)) {
  obj[e[0]] = JSON.parse(JSON.stringify(e[1]))
}
Object.assign(Options, obj)
