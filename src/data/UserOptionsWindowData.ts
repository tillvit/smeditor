import { TimingWindowCollection } from "../chart/play/TimingWindowCollection"

interface UserOption<T> {
  label: string
  tooltip?: string
  input: UserOptionInput<T>
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
        hardMax: Number.MAX_VALUE,
      },
    },
    "chart.receptorYPos": {
      label: "Receptor Y position",
      input: {
        type: "slider",
        min: -400,
        max: 0,
        hardMin: -Number.MAX_VALUE,
        hardMax: Number.MAX_VALUE,
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
        hardMax: Number.MAX_VALUE,
      },
    },
    "chart.maxDrawBeatsBack": {
      label: "Draw length past receptors (beats)",
      input: {
        type: "slider",
        min: 0,
        max: 30,
        hardMax: Number.MAX_VALUE,
      },
    },
    "chart.zoom": {
      label: "Playfield zoom",
      input: {
        type: "slider",
        min: 0,
        step: 1,
        max: 200,
        hardMax: Number.MAX_VALUE,
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
        hardMax: Number.MAX_VALUE,
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
        hardMax: Number.MAX_VALUE,
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
        hardMax: Number.MAX_VALUE,
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
        hardMin: -Number.MAX_VALUE,
        hardMax: Number.MAX_VALUE,
      },
    },
    "play.offset": {
      label: "Global offset",
      input: {
        type: "slider",
        min: -1,
        step: 0.001,
        max: 1,
        hardMin: -Number.MAX_VALUE,
        hardMax: Number.MAX_VALUE,
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
        hardMax: Number.MAX_VALUE,
      },
    },

    "play.timingWindowAdd": {
      label: "Timing window add",
      input: {
        type: "slider",
        min: 0,
        step: 0.001,
        max: 1,
        hardMax: Number.MAX_VALUE,
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
        hardMax: Number.MAX_VALUE,
      },
      margin: true,
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
  }
