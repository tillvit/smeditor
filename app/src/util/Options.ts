import { TimingEventType } from "../chart/sm/TimingTypes"

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
    spinnerStep: 1,
    smoothAnimations: true,
    warnBeforeExit: true,
    showPlaybackOptions: true,
    backgroundColor: 0x18191c,
  }
  static chart = {
    CMod: false,
    reverse: false,
    mousePlacement: false,
    zoom: 1,
    speed: 250,
    snap: 1,
    hideWarpedArrows: false,
    hideFakedArrows: false,
    doSpeedChanges: true,
    drawNoteFlash: true,
    drawIcons: true,
    receptorYPos: -200,
    receptorXPos: 0,
    maxDrawBeats: 20,
    maxDrawBeatsBack: 10,
    scroll: {
      scrollSensitivity: 1,
      scrollSnapEveryScroll: !navigator.userAgent.includes("Mac"),
      invertZoomScroll: false,
      invertReverseScroll: true,
    },
    waveform: {
      enabled: true,
      antialiasing: true,
      color: 0x606172,
      opacity: 0.5,
      allowFilter: true,
      filteredColor: 0x1e523e,
      filteredOpacity: 0.5,
      lineHeight: 1,
      speedChanges: true,
    },
    noteLayout: {
      enabled: true,
    },
    npsGraph: {
      enabled: false,
      color1: 0x4aa7bc,
      color2: 0x423c7a,
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
    defaultTimingCollection: {
      "dance-single": "ITG",
      "dance-double": "ITG",
      "dance-threepanel": "ITG",
      "dance-threedouble": "ITG",
      "dance-solo": "ITG",
      "dance-solodouble": "ITG",
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
  }
  static experimental = {}
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

const obj: { [key: string]: any } = {}
for (const e of Object.entries(DefaultOptions)) {
  obj[e[0]] = JSON.parse(JSON.stringify(e[1]))
}
Object.assign(Options, obj)
