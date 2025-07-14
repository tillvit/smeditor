import { Color } from "pixi.js"
import { App } from "../App"
import { TimingWindowCollection } from "../chart/play/TimingWindowCollection"
import { Options } from "../util/Options"

export type UserOption = UserOptionGroup | UserOptionSubgroup | UserOptionItem

export interface UserOptionGroup {
  type: "group"
  id: string
  label: string
  children: UserOption[]
  disable?: (app: App) => boolean
}

interface UserOptionSubgroup {
  type: "subgroup"
  label?: string
  children: UserOption[]
  disable?: (app: App) => boolean
}

interface UserOptionItem {
  type: "item"
  id: string
  label: string
  tooltip?: string
  input: UserOptionInput<any>
  disable?: (app: App) => boolean
}

interface UserOptionTextInput {
  type: "text"
  transformers?: {
    serialize: (value: string) => string
    deserialize: (value: string) => string
  }
  onChange?: (app: App, value: string) => void
}

type UserOptionDropdownInput<T> =
  | {
      type: "dropdown"
      items: readonly string[]
      advanced: false
      onChange?: (app: App, value: string | number) => void
    }
  | {
      type: "dropdown"
      items: readonly number[]
      advanced: false
      onChange?: (app: App, value: string | number) => void
    }
  | {
      type: "dropdown"
      items: T[]
      advanced: true
      transformers: {
        serialize: (value: string | number | boolean) => T
        deserialize: (value: T) => string | number | boolean
      }
      onChange?: (app: App, value: string | number | boolean) => void
    }

interface UserOptionNumberInput {
  type: "number"
  step: number
  precision?: number
  minPrecision?: number
  min?: number
  max?: number
  transformers?: {
    serialize: (value: number) => number
    deserialize: (value: number) => number
  }
  onChange?: (app: App, value: number) => void
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
  onChange?: (app: App, value: number) => void
}

interface UserOptionCheckboxInput {
  type: "checkbox"
  onChange?: (app: App, value: boolean) => void
}

interface UserOptionColorInput {
  type: "color"
  onChange?: (app: App, value: Color) => void
}

type UserOptionInput<T> =
  | UserOptionTextInput
  | UserOptionDropdownInput<T>
  | UserOptionNumberInput
  | UserOptionCheckboxInput
  | UserOptionSliderInput
  | UserOptionColorInput

export const USER_OPTIONS_WINDOW_DATA: UserOption[] = [
  {
    type: "group",
    id: "app",
    label: "App",
    disable: () => window.nw === undefined,
    children: [
      {
        type: "subgroup",
        children: [
          {
            type: "item",
            label: "Window Width",
            id: "app.width",
            input: {
              type: "number",
              step: 50,
              min: 300,
              precision: 0,
              onChange: (_, value) => {
                const win = nw.Window.get()
                if (!win.isFullscreen) {
                  win.width = value
                }
              },
            },
          },
          {
            type: "item",
            label: "Window Height",
            id: "app.height",
            input: {
              type: "number",
              step: 50,
              min: 300,
              precision: 0,
              onChange: (_, value) => {
                const win = nw.Window.get()
                if (!win.isFullscreen) {
                  win.height = value
                }
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
            label: "Fullscreen",
            id: "app.fullscreen",
            input: {
              type: "checkbox",
              onChange: (_, value) => {
                const win = nw.Window.get()
                if (value) {
                  nw.Window.get().enterFullscreen()
                } else {
                  win.hide()
                  nw.Window.get().leaveFullscreen()
                  win.show()
                }
              },
            },
          },
        ],
      },
    ],
  },
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
            label: "UI Scale",
            id: "general.uiScale",
            input: {
              type: "number",
              min: 30,
              step: 10,
              precision: 0,
              max: 200,
              transformers: {
                serialize: value => value * 100,
                deserialize: value => value / 100,
              },
              onChange: (_, value: number) => {
                document.body.parentElement!.style.fontSize = value * 100 + "%"
              },
            },
          },
          {
            type: "item",
            label: "Smooth Animations",
            id: "general.smoothAnimations",
            input: {
              type: "checkbox",
              onChange: (_, value: boolean) => {
                if (value) document.body.classList.add("animated")
                else document.body.classList.remove("animated")
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
            label: "Auto-load SSC files",
            id: "general.loadSSC",
            input: {
              type: "dropdown",
              items: ["Prompt", "Always", "Never"],
              advanced: false,
            },
            tooltip:
              "Automatically select .ssc files instead of .sm files when available.",
          },
          {
            type: "item",
            label: "Autosave interval",
            id: "general.autosaveInterval",
            input: {
              type: "slider",
              min: 30,
              step: 5,
              max: 600,
              hardMin: 15,
              hardMax: 2 ** 31 - 1,
            },
            tooltip: "Interval in seconds between autosaves",
          },
          {
            type: "item",
            label: "Warn before exit",
            id: "general.warnBeforeExit",
            input: {
              type: "checkbox",
            },
            tooltip:
              "Warn before exiting the editor if you have unsaved changes.",
          },
        ],
      },
      {
        type: "subgroup",
        children: [
          {
            type: "item",
            label: "Spinner step",
            id: "general.spinnerStep",
            input: {
              type: "slider",
              min: 0,
              step: 0.1,
              max: 5,
              hardMin: 0,
              hardMax: 2 ** 31 - 1,
            },
            tooltip: "The default increment for all number spinners.",
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
        label: "Note Placement",
        children: [
          {
            type: "subgroup",
            children: [
              {
                type: "item",
                label: "Enable mouse placement",
                id: "chart.mousePlacement",
                input: {
                  type: "checkbox",
                },
              },
              {
                type: "item",
                label: "Directional hold placement behavior",
                id: "chart.defaultHoldPlacement",
                input: {
                  type: "checkbox",
                },
                tooltip:
                  "Changes the hold placement behavior. By default, holds can only be extended in one direction when placed. Turn this off to mimic the behavior of AV/Stepmania.",
              },
              {
                type: "item",
                label: "Force snap notes",
                id: "chart.forceSnapNotes",
                input: {
                  type: "checkbox",
                },
                tooltip:
                  "Placing a note when not on a snap will force the note to be placed on the next snap. Useful for placing notes when playing.",
              },
            ],
          },
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
                label: "Allow receptor dragging",
                id: "chart.allowReceptorDrag",
                input: {
                  type: "checkbox",
                },
                tooltip:
                  "Allows the receptors to be dragged to move the playfield.",
              },
              {
                type: "item",
                label: "X position",
                id: "chart.receptorXPos",
                input: {
                  type: "slider",
                  min: -400,
                  max: 400,
                  hardMin: -(2 ** 31 - 1),
                  hardMax: 2 ** 31 - 1,
                },
              },
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
            ],
          },
          {
            type: "subgroup",
            children: [
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
                tooltip:
                  "Maximum number of beats to draw notes. Increasing this works well for songs with high bpm but can affect performance. Only applies to XMod.",
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
                tooltip:
                  "Maximum number of beats to draw notes past the receptors. Increasing this can affect performance. Only applies to XMod.",
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
              {
                type: "item",
                label: "Draw note icons",
                id: "chart.drawIcons",
                input: {
                  type: "checkbox",
                },
                tooltip:
                  "Draw indicators above notes that some noteskins may not differentiate, like Fakes and Lifts.",
              },
            ],
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
            id: "chart.scroll.scrollSensitivity",
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
            tooltip:
              "Adjust the scroll sensitivity when scrolling through the chart.",
          },
          {
            type: "item",
            label: "Snap every scroll",
            id: "chart.scroll.scrollSnapEveryScroll",
            input: {
              type: "checkbox",
            },
            tooltip:
              "Whether each scroll movement corresponds to moving one snap unit when scrolling. Turning this on will have the same behavior as ArrowVortex. Recommended on for those using a mouse, off for those using trackpad.",
          },
          {
            type: "item",
            label: "Invert scroll direction",
            id: "chart.scroll.invertScroll",
            input: {
              type: "checkbox",
            },
          },
          {
            type: "item",
            label: "Invert zoom in/out",
            id: "chart.scroll.invertZoomScroll",
            input: {
              type: "checkbox",
            },
            tooltip: "Inverts the zoom in/out control when scrolling.",
          },
          {
            type: "item",
            label: "Invert scroll direction when in reverse",
            id: "chart.scroll.invertReverseScroll",
            input: {
              type: "checkbox",
            },
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
            type: "subgroup",
            children: [
              {
                type: "item",
                label: "Color",
                id: "chart.waveform.color",
                input: {
                  type: "color",
                },
              },
            ],
          },
          {
            type: "subgroup",
            children: [
              {
                type: "item",
                label: "Draw filtered waveform",
                id: "chart.waveform.allowFilter",
                input: {
                  type: "checkbox",
                },
              },
              {
                type: "item",
                label: "Filtered color",
                id: "chart.waveform.filteredColor",
                input: {
                  type: "color",
                },
              },
            ],
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
            tooltip:
              "The height of each line of the waveform. Increasing this can help performance.",
          },
          {
            type: "item",
            label: "Antialiasing",
            id: "chart.waveform.antialiasing",
            input: {
              type: "checkbox",
            },
          },
          {
            type: "item",
            label: "Allow speed changes",
            id: "chart.waveform.speedChanges",
            input: {
              type: "checkbox",
            },
            tooltip:
              "Allows the waveform to be affected by SPEEDS and SCROLLS.",
          },
        ],
      },
    ],
  },
  {
    type: "group",
    id: "timelines",
    label: "Timelines",
    children: [
      {
        type: "item",
        label: "Follow current position",
        id: "chart.layoutFollowPosition",
        input: {
          type: "checkbox",
        },
        tooltip:
          "Change whether layouts show the entire song or range around the cursor.",
      },
      {
        type: "subgroup",
        label: "Notes",
        children: [
          {
            type: "item",
            label: "Enabled",
            id: "chart.noteLayout.enabled",
            input: {
              type: "checkbox",
            },
          },
        ],
      },
      {
        type: "subgroup",
        label: "Player Direction",
        children: [
          {
            type: "item",
            label: "Enabled",
            id: "chart.facingLayout.enabled",
            input: {
              type: "checkbox",
            },
          },
        ],
      },
      {
        type: "subgroup",
        label: "Density",
        children: [
          {
            type: "item",
            label: "Enabled",
            id: "chart.npsGraph.enabled",
            input: {
              type: "checkbox",
            },
          },
          {
            type: "subgroup",
            children: [
              {
                type: "item",
                label: "Start Color",
                id: "chart.npsGraph.color1",
                input: {
                  type: "color",
                },
              },
              {
                type: "item",
                label: "End Color",
                id: "chart.npsGraph.color2",
                input: {
                  type: "color",
                },
              },
            ],
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
            label: "Master volume",
            id: "audio.masterVolume",
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
            tooltip: "Plays a sound when a note passes the receptors",
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
      {
        type: "subgroup",
        children: [
          {
            type: "item",
            label: "Allow filters to affect audio",
            id: "audio.allowFilter",
            input: {
              type: "checkbox",
              onChange: app => {
                app.chartManager.chartAudio.reload()
              },
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
            tooltip:
              "Offset in seconds when playing a chart. Set to positive if you are hitting early and negative if you are hitting late.",
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
            tooltip:
              "Offset in seconds when playing sound effects like assist tick and metronome.",
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
            tooltip: "Offset in seconds when displaying notes.",
          },
        ],
      },
      {
        type: "subgroup",
        children: [
          {
            type: "item",
            label: "Judgement tilt",
            id: "play.judgementTilt",
            input: {
              type: "checkbox",
            },
            tooltip:
              "Tilts the judgement text left if you are hitting early and right if you are hitting late.",
          },
          {
            type: "item",
            label: "Hide barlines during play",
            id: "play.hideBarlines",
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
              onChange(app, value) {
                // change the default timing collection for all matching gameTypes
                const gameType = app.chartManager.loadedChart?.gameType.id
                if (!gameType) return
                for (const key of Object.keys(
                  Options.play.defaultTimingCollections
                )) {
                  if (gameType.startsWith(key)) {
                    Options.play.defaultTimingCollections[key] = value as string
                  }
                }
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
            tooltip: "Scales all timing windows by the given amount.",
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
            tooltip: "Adds this value (in seconds) to all timing windows.",
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
        tooltip: "Requires a reload.",
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
        label: "Show FPS",
        id: "debug.showFPS",
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
        label: "Show noteskin errors",
        id: "debug.showNoteskinErrors",
        input: {
          type: "checkbox",
        },
      },
      {
        type: "item",
        label: "Show scrolls/speeds debug visual",
        id: "debug.showScroll",
        input: {
          type: "checkbox",
        },
      },
    ],
  },
  {
    type: "group",
    id: "experimental",
    label: "Experimental",
    children: [
      {
        type: "subgroup",
        label: "Parity",
        children: [
          {
            type: "item",
            label: "Enabled",
            id: "experimental.parity.enabled",
            input: {
              type: "checkbox",
            },
          },
          {
            type: "item",
            label: "Show debug stats",
            id: "experimental.parity.showDebug",
            input: {
              type: "checkbox",
            },
          },
          {
            type: "item",
            label: "Show parity graph",
            id: "experimental.parity.showGraph",
            input: {
              type: "checkbox",
            },
          },
          {
            type: "item",
            label: "Limit graph nodes",
            tooltip:
              "Limits the number of nodes in each row of the parity graph to 16.",
            id: "experimental.parity.limitGraph",
            input: {
              type: "checkbox",
            },
          },
          {
            type: "item",
            label: "Show dancing bot",
            id: "experimental.parity.showDancingBot",
            input: {
              type: "checkbox",
            },
          },
        ],
      },
    ],
  },
]
