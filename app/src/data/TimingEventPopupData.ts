import { TIMING_DATA_PRECISION } from "../chart/sm/TimingData"
import { TimingEventType } from "../chart/sm/TimingTypes"

interface Popup {
  rows: PopupRow[]
  title: string
  description?: string
  width?: number
}
export interface PopupRow {
  label: string
  key: string
  input: PopupInput
}

type PopupInput =
  | PopupInputSpinner
  | PopupInputText
  | PopupInputDropdown
  | PopupInputCheckbox

interface PopupInputSpinner {
  type: "spinner"
  step?: number
  precision?: number
  min?: number
  max?: number
}
interface PopupInputText {
  type: "text"
}
interface PopupInputDropdown {
  type: "dropdown"
  items: string[]
  transformers?: {
    serialize: (value: string) => string
    deserialize: (value: string) => string
  }
}
interface PopupInputCheckbox {
  type: "checkbox"
}
export const POPUP_ROWS: { [key in TimingEventType]: Popup } = {
  BPMS: {
    title: "BPM Event",
    rows: [
      {
        label: "Tempo",
        key: "value",
        input: {
          type: "spinner",
          precision: TIMING_DATA_PRECISION,
        },
      },
    ],
  },
  STOPS: {
    title: "Stop Event",
    description:
      "Stops for a number of seconds. Notes on this beat are hit before the stop occurs.",
    rows: [
      {
        label: "Seconds",
        key: "value",
        input: {
          type: "spinner",
          precision: TIMING_DATA_PRECISION,
        },
      },
    ],
  },
  WARPS: {
    title: "Warp Event",
    description:
      "Warps ahead a number of beats. Warped notes do not count towards score.",
    rows: [
      {
        label: "Beats",
        key: "value",
        input: {
          type: "spinner",
          precision: TIMING_DATA_PRECISION,
          min: 0,
        },
      },
    ],
  },
  DELAYS: {
    title: "Delay Event",
    description:
      "Stops for a number of seconds. Notes on this beat are hit after the delay occurs.",
    rows: [
      {
        label: "Seconds",
        key: "value",
        input: {
          type: "spinner",
          precision: TIMING_DATA_PRECISION,
        },
      },
    ],
  },
  SCROLLS: {
    title: "Scroll Event",
    description: "Notes after this event will scroll at the specified speed.",
    rows: [
      {
        label: "Multiplier",
        key: "value",
        input: {
          type: "spinner",
          precision: TIMING_DATA_PRECISION,
        },
      },
    ],
  },
  TICKCOUNTS: {
    title: "Tickcount Event",
    description:
      "Number of ticks per beat in a hold. Only applies to pump gamemodes.",
    rows: [
      {
        label: "Ticks",
        key: "value",
        input: {
          type: "spinner",
          step: 1,
          precision: 0,
          min: 0,
        },
      },
    ],
  },
  FAKES: {
    title: "Fake Event",
    description:
      "Creates an area of notes that cannot be hit and do not count towards score.",
    rows: [
      {
        label: "Beats",
        key: "value",
        input: {
          type: "spinner",
          precision: TIMING_DATA_PRECISION,
          min: 0,
        },
      },
    ],
  },
  LABELS: {
    title: "Label Event",
    rows: [
      {
        label: "Label",
        key: "value",
        input: {
          type: "text",
        },
      },
    ],
  },
  SPEEDS: {
    title: "Speed Event",
    width: 200,
    description:
      "The entire playfield scrolls at the specified speed. Can slowly ease over a certain amount of time.",
    rows: [
      {
        label: "Multiplier",
        key: "value",
        input: {
          type: "spinner",
          precision: TIMING_DATA_PRECISION,
        },
      },
      {
        label: "Ease time",
        key: "delay",
        input: {
          type: "spinner",
          precision: TIMING_DATA_PRECISION,
          min: 0,
        },
      },
      {
        label: "Ease unit",
        key: "unit",
        input: {
          type: "dropdown",
          items: ["Beats", "Seconds"],
          transformers: {
            serialize: (value: string) => (value == "B" ? "Beats" : "Seconds"),
            deserialize: (value: string) => (value == "Beats" ? "B" : "T"),
          },
        },
      },
    ],
  },
  TIMESIGNATURES: {
    title: "Time Signature Event",
    width: 200,
    rows: [
      {
        label: "Upper",
        key: "upper",
        input: {
          type: "spinner",
          step: 1,
          precision: 0,
          min: 1,
        },
      },
      {
        label: "Lower",
        key: "lower",
        input: {
          type: "spinner",
          step: 1,
          precision: 0,
          min: 1,
        },
      },
    ],
  },
  COMBOS: {
    title: "Combo Event",
    width: 200,
    description:
      "Multiplies the combo gained from hitting/missing notes after this event.",
    rows: [
      {
        label: "Hit multiplier",
        key: "hitMult",
        input: {
          type: "spinner",
          step: 1,
          precision: 0,
          min: 0,
        },
      },
      {
        label: "Miss multiplier",
        key: "missMult",
        input: {
          type: "spinner",
          step: 1,
          precision: 0,
          min: 0,
        },
      },
    ],
  },
  ATTACKS: {
    title: "Attack Event",
    width: 200,
    description:
      "Applies a modifier to the playfield. Can specify the length of the applied attack in seconds or the end time of the attack.",
    rows: [
      {
        label: "Timing type",
        key: "endType",
        input: {
          type: "dropdown",
          items: ["Length", "End"],
          transformers: {
            serialize: (value: string) => (value == "LEN" ? "Length" : "End"),
            deserialize: (value: string) => (value == "Length" ? "LEN" : "END"),
          },
        },
      },
      {
        label: "Seconds",
        key: "value",
        input: {
          type: "spinner",
          precision: TIMING_DATA_PRECISION,
        },
      },
      {
        label: "Mods",
        key: "mods",
        input: {
          type: "text",
        },
      },
    ],
  },
  BGCHANGES: {
    title: "BG Change Event",
    width: 250,
    rows: [
      {
        label: "File",
        key: "file",
        input: {
          type: "text",
        },
      },
      {
        label: "Update rate",
        key: "updateRate",
        input: {
          type: "spinner",
          precision: 3,
          min: 0,
        },
      },
      {
        label: "Crossfade",
        key: "crossfade",
        input: {
          type: "checkbox",
        },
      },
      {
        label: "StretchRewind",
        key: "stretchRewind",
        input: {
          type: "checkbox",
        },
      },
      {
        label: "StretchNoLoop",
        key: "StretchNoLoop",
        input: {
          type: "checkbox",
        },
      },
      {
        label: "Effect",
        key: "effect",
        input: {
          type: "text",
        },
      },
      {
        label: "File2",
        key: "file2",
        input: {
          type: "text",
        },
      },
      {
        label: "Transition",
        key: "transition",
        input: {
          type: "text",
        },
      },
      {
        label: "Color1",
        key: "color1",
        input: {
          type: "text",
        },
      },
      {
        label: "Color2",
        key: "color2",
        input: {
          type: "text",
        },
      },
    ],
  },
  FGCHANGES: {
    title: "FG Change Event",
    width: 250,
    rows: [
      {
        label: "File",
        key: "file",
        input: {
          type: "text",
        },
      },
      {
        label: "Update rate",
        key: "updateRate",
        input: {
          type: "spinner",
          precision: 3,
          min: 0,
        },
      },
      {
        label: "Crossfade",
        key: "crossfade",
        input: {
          type: "checkbox",
        },
      },
      {
        label: "StretchRewind",
        key: "stretchRewind",
        input: {
          type: "checkbox",
        },
      },
      {
        label: "StretchNoLoop",
        key: "StretchNoLoop",
        input: {
          type: "checkbox",
        },
      },
      {
        label: "Effect",
        key: "effect",
        input: {
          type: "text",
        },
      },
      {
        label: "File2",
        key: "file2",
        input: {
          type: "text",
        },
      },
      {
        label: "Transition",
        key: "transition",
        input: {
          type: "text",
        },
      },
      {
        label: "Color1",
        key: "color1",
        input: {
          type: "text",
        },
      },
      {
        label: "Color2",
        key: "color2",
        input: {
          type: "text",
        },
      },
    ],
  },
}
