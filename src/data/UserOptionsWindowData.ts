import { TimingWindowCollection } from "../chart/play/TimingWindowCollection"

interface UserOption<T> {
  label: string
  tooltip?: string
  input?: UserOptionInput<T>
  margin?: boolean
}

interface UserOptionTextInput {
  type: "text"
  transformers?: {
    serialize: (value: string) => string
    deserialize: (value: string) => string
  }
  onChange?: (value: string) => void
}

type UserOptionDropdownInput<T> =
  | {
      type: "dropdown"
      items: readonly string[]
      advanced: false
      onChange?: (value: string | number) => void
    }
  | {
      type: "dropdown"
      items: readonly number[]
      advanced: false
      onChange?: (value: string | number) => void
    }
  | {
      type: "dropdown"
      items: T[]
      advanced: true
      transformers: {
        serialize: (value: string | number | boolean) => T
        deserialize: (value: T) => string | number | boolean
      }
      onChange?: (value: string | number | boolean) => void
    }

interface UserOptionNumberInput {
  type: "number"
  step: number
  precision?: number
  min?: number
  max?: number
  transformers?: {
    serialize: (value: number) => number
    deserialize: (value: number) => number
  }
  onChange?: (value: number) => void
}

interface UserOptionSliderInput {
  type: "slider"
  step?: number
  min?: number
  max?: number
  hardMax?: number
  hardMin?: number
  transformers?: {
    serialize: (value: number) => number
    deserialize: (value: number) => number
  }
  onChange?: (value: number) => void
}

interface UserOptionCheckboxInput {
  type: "checkbox"
  onChange?: (value: boolean) => void
}

type UserOptionInput<T> =
  | UserOptionTextInput
  | UserOptionDropdownInput<T>
  | UserOptionNumberInput
  | UserOptionCheckboxInput
  | UserOptionSliderInput

export const USER_OPTIONS_WINDOW_DATA: { [key: string]: UserOption<unknown> } =
  {
    "chart.CMod": {
      label: "Toggle CMod",
      input: {
        type: "checkbox",
      },
      margin: true,
    },
    "chart.reverse": {
      label: "Reverse playfield",
      input: {
        type: "checkbox",
      },
    },
    "chart.hideWarpedArrows": {
      label: "Hide warped arrows",
      input: {
        type: "checkbox",
      },
    },
    "chart.doSpeedChanges": {
      label: "Do speed changes",
      input: {
        type: "checkbox",
      },
      margin: true,
    },
    "chart.speed": {
      label: "Scroll speed",
      input: {
        type: "slider",
        min: 0,
        max: 750,
        hardMax: 2 ** 31 - 1,
      },
    },
    "chart.receptorYPos": {
      label: "Receptor Y position",
      input: {
        type: "slider",
        min: -400,
        max: 0,
        hardMin: -(2 ** 31 - 1),
        hardMax: 2 ** 31 - 1,
      },
    },
    "chart.snap": {
      label: "Cursor snap",
      input: {
        type: "number",
        step: 1,
        min: 1,
        transformers: {
          serialize: value => 4 / value,
          deserialize: value => 4 / value,
        },
      },
      margin: true,
    },
    "chart.maxDrawBeats": {
      label: "Draw length (beats)",
      input: {
        type: "slider",
        min: 0,
        max: 30,
        hardMax: 2 ** 31 - 1,
      },
    },
    "chart.maxDrawBeatsBack": {
      label: "Draw length past receptors (beats)",
      input: {
        type: "slider",
        min: 0,
        max: 30,
        hardMax: 2 ** 31 - 1,
      },
    },
    "chart.zoom": {
      label: "Playfield zoom",
      input: {
        type: "slider",
        min: 0,
        step: 1,
        max: 200,
        hardMax: 2 ** 31 - 1,
        transformers: {
          serialize: value => value * 100,
          deserialize: value => value / 100,
        },
      },
    },
    "chart.drawNoteFlash": {
      label: "Toggle noteflashes",
      input: {
        type: "checkbox",
      },
      margin: true,
    },

    "audio.assistTick": {
      label: "Assist tick",
      input: {
        type: "checkbox",
      },
    },
    "audio.metronome": {
      label: "Metronome",
      input: {
        type: "checkbox",
      },
      margin: true,
    },
    "audio.rate": {
      label: "Playback rate",
      input: {
        type: "slider",
        min: 0,
        step: 1,
        max: 100,
        hardMax: 2 ** 31 - 1,
        transformers: {
          serialize: value => value * 100,
          deserialize: value => value / 100,
        },
      },
    },
    "audio.songVolume": {
      label: "Song Volume",
      input: {
        type: "slider",
        min: 0,
        step: 1,
        max: 100,
        hardMax: 2 ** 31 - 1,
        transformers: {
          serialize: value => value * 100,
          deserialize: value => value / 100,
        },
      },
    },
    "audio.soundEffectVolume": {
      label: "Sound effect volume",
      input: {
        type: "slider",
        min: 0,
        step: 1,
        max: 100,
        hardMax: 2 ** 31 - 1,
        transformers: {
          serialize: value => value * 100,
          deserialize: value => value / 100,
        },
      },
      margin: true,
    },
    "audio.effectOffset": {
      label: "Sound effect offset",
      input: {
        type: "slider",
        min: -1,
        step: 0.001,
        max: 1,
        hardMin: -(2 ** 31 - 1),
        hardMax: 2 ** 31 - 1,
      },
    },
    "play.offset": {
      label: "Global offset",
      input: {
        type: "slider",
        min: -1,
        step: 0.001,
        max: 1,
        hardMin: -(2 ** 31 - 1),
        hardMax: 2 ** 31 - 1,
      },
      margin: true,
    },
    "play.hideBarlines": {
      label: "Hide barlines during play",
      input: {
        type: "checkbox",
      },
    },
    "play.judgmentTilt": {
      label: "Judgment tilt",
      input: {
        type: "checkbox",
      },
      margin: true,
    },

    "play.timingCollection": {
      label: "Timing windows",
      input: {
        type: "dropdown",
        advanced: false,
        get items(): string[] {
          return Object.keys(TimingWindowCollection.getCollections())
        },
      },
    },

    "play.timingWindowScale": {
      label: "Timing window scale",
      input: {
        type: "slider",
        min: 0,
        step: 0.001,
        max: 2,
        hardMax: 2 ** 31 - 1,
      },
    },

    "play.timingWindowAdd": {
      label: "Timing window add",
      input: {
        type: "slider",
        min: 0,
        step: 0.001,
        max: 1,
        hardMax: 2 ** 31 - 1,
      },
    },

    "performance.antialiasing": {
      label: "Antialiasing",
      input: {
        type: "checkbox",
      },
    },

    "performance.resolution": {
      label: "Resolution",
      input: {
        type: "slider",
        min: 1,
        step: 1,
        max: 4,
        hardMin: 0,
        hardMax: 2 ** 31 - 1,
      },
    },

    "general.smoothAnimations": {
      label: "Smooth Animations",
      input: {
        type: "checkbox",
        onChange: (value: boolean) => {
          if (value) document.body.classList.add("animated")
          else document.body.classList.remove("animated")
        },
      },
    },

    "debug.renderingStats": {
      label: "Show rendering stats",
      input: {
        type: "checkbox",
      },
    },

    "debug.showTimers": {
      label: "Show rendering timers",
      input: {
        type: "checkbox",
      },
    },

    "experimental.speedChangeWaveform": {
      label: "Allow waveform speed changes",
      input: {
        type: "checkbox",
      },
    },

    "chart.renderTimingEvent": {
      label: "Show timing event boxes",
    },

    "chart.waveform": {
      label: "Waveform",
    },

    "chart.waveform.enabled": {
      label: "Enable waveform",
      input: {
        type: "checkbox",
      },
    },

    "chart.waveform.opacity": {
      label: "Opacity",
      input: {
        type: "slider",
        min: 0,
        max: 1,
        step: 0.01,
      },
    },

    "chart.waveform.lineHeight": {
      label: "Line height",
      input: {
        type: "slider",
        min: 1,
        max: 3,
        step: 0.1,
        hardMax: 100,
      },
    },

    "general.scrollSensitivity": {
      label: "Scroll sensitivity",
      input: {
        type: "slider",
        min: 0,
        step: 1,
        max: 100,
        hardMax: 2 ** 31 - 1,
        transformers: {
          serialize: value => value * 100,
          deserialize: value => value / 100,
        },
      },
      margin: true,
    },

    "general.mousePlacement": {
      label: "Mouse note placement",
      input: {
        type: "checkbox",
      },
      margin: true,
    },

    general: {
      label: "General",
    },

    chart: {
      label: "Chart",
    },

    audio: {
      label: "Audio",
    },

    play: {
      label: "Play Mode",
    },

    performance: {
      label: "Performance",
    },

    debug: {
      label: "Debug",
    },

    experimental: {
      label: "Experimental",
    },
  }
