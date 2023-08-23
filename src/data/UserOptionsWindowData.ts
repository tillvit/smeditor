import { TimingWindowCollection } from "../chart/play/TimingWindowCollection"

export type UserOption = UserOptionGroup | UserOptionSubgroup | UserOptionItem

export interface UserOptionGroup {
  type: "group"
  id: string
  label: string
  children: UserOption[]
}

interface UserOptionSubgroup {
  type: "subgroup"
  label?: string
  children: UserOption[]
}

interface UserOptionItem {
  type: "item"
  id: string
  label: string
  tooltip?: string
  input: UserOptionInput<any>
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

export const USER_OPTIONS_WINDOW_DATA: UserOption[] = [
  {
    type: "group",
    id: "general",
    label: "General",
    children: [
      {
        type: "subgroup",
        children: [
          {
            type: "item",
            label: "Smooth Animations",
            id: "general.smoothAnimations",
            input: {
              type: "checkbox",
              onChange: (value: boolean) => {
                if (value) document.body.classList.add("animated")
                else document.body.classList.remove("animated")
              },
            },
          },
        ],
      },
      {
        type: "subgroup",
        label: "Scrolling",
        children: [
          {
            type: "item",
            label: "Scroll sensitivity",
            id: "general.scrollSensitivity",
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

          {
            type: "item",
            label: "Snap every scroll",
            id: "general.scrollSnapEveryScroll",
            input: {
              type: "checkbox",
            },
          },
        ],
      },
    ],
  },
  {
    type: "group",
    id: "chart",
    label: "Chart",
    children: [
      {
        type: "subgroup",
        label: "Playfield",
        children: [
          {
            type: "subgroup",
            children: [
              {
                type: "item",
                label: "Zoom",
                id: "chart.zoom",
                input: {
                  type: "slider",
                  min: 50,
                  step: 1,
                  max: 200,
                  hardMax: 2 ** 31 - 1,
                  transformers: {
                    serialize: value => value * 100,
                    deserialize: value => value / 100,
                  },
                },
              },
              {
                type: "item",
                label: "Reverse playfield",
                id: "chart.reverse",
                input: {
                  type: "checkbox",
                },
              },
            ],
          },
          {
            type: "subgroup",
            children: [
              {
                type: "item",
                label: "Y position",
                id: "chart.receptorYPos",
                input: {
                  type: "slider",
                  min: -400,
                  max: 0,
                  hardMin: -(2 ** 31 - 1),
                  hardMax: 2 ** 31 - 1,
                },
              },
              {
                type: "item",
                label: "Draw length",
                id: "chart.maxDrawBeats",
                input: {
                  type: "slider",
                  min: 0,
                  max: 30,
                  hardMax: 2 ** 31 - 1,
                },
              },
              {
                type: "item",
                label: "Draw length past receptors",
                id: "chart.maxDrawBeatsBack",
                input: {
                  type: "slider",
                  min: 0,
                  max: 30,
                  hardMax: 2 ** 31 - 1,
                },
              },
            ],
          },

          {
            type: "subgroup",
            children: [
              {
                type: "item",
                label: "Draw noteflashes",
                id: "chart.drawNoteFlash",
                input: {
                  type: "checkbox",
                },
              },
            ],
          },
        ],
      },
      {
        type: "subgroup",
        label: "Waveform",
        children: [
          {
            type: "item",
            label: "Draw waveform",
            id: "chart.waveform.enabled",
            input: {
              type: "checkbox",
            },
          },

          {
            type: "item",
            label: "Opacity",
            id: "chart.waveform.opacity",
            input: {
              type: "slider",
              min: 0,
              max: 1,
              step: 0.01,
            },
          },
          {
            type: "item",
            label: "Line height",
            id: "chart.waveform.lineHeight",
            input: {
              type: "slider",
              min: 1,
              max: 3,
              step: 0.1,
              hardMax: 100,
            },
          },
        ],
      },
    ],
  },
  {
    type: "group",
    id: "audio",
    label: "Audio",
    children: [
      {
        type: "subgroup",
        children: [
          {
            type: "item",
            label: "Song volume",
            id: "audio.songVolume",
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
          {
            type: "item",
            label: "Sound effect volume",
            id: "audio.soundEffectVolume",
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
        ],
      },
      {
        type: "subgroup",
        children: [
          {
            type: "item",
            label: "Enable assist tick",
            id: "audio.assistTick",
            input: {
              type: "checkbox",
            },
          },
          {
            type: "item",
            label: "Enable metronome",
            id: "audio.metronome",
            input: {
              type: "checkbox",
            },
          },
        ],
      },
    ],
  },
  {
    type: "group",
    id: "play",
    label: "Play mode",
    children: [
      {
        type: "subgroup",
        label: "Calibration",
        children: [
          {
            type: "item",
            label: "Global offset",
            id: "play.offset",
            input: {
              type: "slider",
              min: -1,
              step: 0.001,
              max: 1,
              hardMin: -(2 ** 31 - 1),
              hardMax: 2 ** 31 - 1,
            },
          },
          {
            type: "item",
            label: "Sound effect offset",
            id: "play.effectOffset",
            input: {
              type: "slider",
              min: -1,
              step: 0.001,
              max: 1,
              hardMin: -(2 ** 31 - 1),
              hardMax: 2 ** 31 - 1,
            },
          },
          {
            type: "item",
            label: "Visual offset",
            id: "play.visualOffset",
            input: {
              type: "slider",
              min: -1,
              step: 0.001,
              max: 1,
              hardMin: -(2 ** 31 - 1),
              hardMax: 2 ** 31 - 1,
            },
          },
          {
            type: "item",
            label: "Sound effect volume",
            id: "audio.soundEffectVolume",
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
        ],
      },
      {
        type: "subgroup",
        children: [
          {
            type: "item",
            label: "Judgment tilt",
            id: "audio.judgmentTilt",
            input: {
              type: "checkbox",
            },
          },
          {
            type: "item",
            label: "Hide barlines during play",
            id: "audio.hideBarlines",
            input: {
              type: "checkbox",
            },
          },
        ],
      },
      {
        type: "subgroup",
        label: "Timing windows",
        children: [
          {
            type: "item",
            id: "play.timingCollection",
            label: "Timing window collection",
            input: {
              type: "dropdown",
              advanced: false,
              get items(): string[] {
                return Object.keys(TimingWindowCollection.getCollections())
              },
            },
          },
          {
            type: "item",
            id: "play.timingWindowScale",
            label: "Timing window scale",
            input: {
              type: "slider",
              min: 0,
              step: 0.001,
              max: 2,
              hardMax: 2 ** 31 - 1,
            },
          },
          {
            type: "item",
            id: "play.timingWindowAdd",
            label: "Timing window add",
            input: {
              type: "slider",
              min: 0,
              step: 0.001,
              max: 1,
              hardMax: 2 ** 31 - 1,
            },
          },
        ],
      },
    ],
  },
  {
    type: "group",
    id: "performance",
    label: "Performance",
    children: [
      {
        type: "item",

        label: "Antialiasing",
        id: "performance.antialiasing",
        input: {
          type: "checkbox",
        },
      },
      {
        type: "item",
        label: "Resolution",
        id: "performance.resolution",
        input: {
          type: "slider",
          min: 1,
          step: 1,
          max: 4,
          hardMin: 0,
          hardMax: 2 ** 31 - 1,
        },
      },
    ],
  },
  {
    type: "group",
    id: "debug",
    label: "Debug",
    children: [
      {
        type: "item",

        label: "Show rendering stats",
        id: "debug.renderingStats",
        input: {
          type: "checkbox",
        },
      },
      {
        type: "item",

        label: "Show rendering timers",
        id: "debug.showTimers",
        input: {
          type: "checkbox",
        },
      },
      {
        type: "item",

        label: "Show rendering stats",
        id: "debug.renderingStats",
        input: {
          type: "checkbox",
        },
      },
    ],
  },
]

// "chart.renderTimingEvent": {
//   label: "Show timing event boxes",
// },
