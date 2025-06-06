import { ValueInput } from "../gui/element/ValueInput"
import { CaptureOptions } from "../util/Capture"

export type CaptureWindowOptions<T> = {
  label: string
  tooltip?: string
  input: ValueInput<T>
}

export const CAPTURE_WINDOW_VIDEO_OPTIONS: {
  [k in keyof CaptureOptions]?: CaptureWindowOptions<any>
} = {
  videoHeight: {
    label: "Video Height",
    input: {
      type: "dropdown",
      items: ["360p", "480p", "720p", "1080p"],
      advanced: true,
      transformers: {
        serialize: value => {
          return `${value}p`
        },
        deserialize: value => {
          return parseInt(value.slice(0, -1))
        },
      },
    },
  },
  fps: {
    label: "FPS",
    input: {
      type: "dropdown",
      items: [24, 30, 60],
      advanced: false,
    },
  },
  bitrate: {
    label: "Bitrate",
    input: {
      type: "display-slider",
      transformers: {
        serialize: (value: number) => {
          return Math.log(value)
        },
        deserialize: (value: number) => {
          return Math.round(Math.exp(value) / 1000) * 1000
        },
        display: (value: number) => {
          return Math.round(Math.exp(value) / 1000) + " kbps"
        },
      },
      min: Math.log(1e6),
      max: Math.log(2e7),
      step: 0.00001,
      displayWidth: 80,
      width: 80,
    },
  },
  aspectRatio: {
    label: "Aspect Ratio",
    input: {
      type: "dropdown",
      items: ["4 / 3", "16 / 9", "16 / 10"],
      advanced: true,
      transformers: {
        serialize: value => {
          const map: Record<string, number> = {
            "4 / 3": 4 / 3,
            "16 / 9": 16 / 9,
            "16 / 10": 16 / 10,
          }
          return Object.keys(map).find(key => {
            if (Math.abs(map[key] - (value as number)) < 0.0001) {
              return true
            }
          })
        },
        deserialize: value => {
          const map: Record<string, number> = {
            "4 / 3": 4 / 3,
            "16 / 9": 16 / 9,
            "16 / 10": 16 / 10,
          }
          return map[value]
        },
      },
    },
  },
}

export const CAPTURE_WINDOW_VIEW_OPTIONS: {
  [k in keyof CaptureOptions]?: CaptureWindowOptions<any>
} = {
  hideBarlines: {
    label: "Hide barlines and events",
    input: {
      type: "checkbox",
    },
  },
  playbackRate: {
    label: "Playback Rate",
    input: {
      type: "number",
      min: 10,
      max: 300,
      step: 10,
      precision: 3,
      minPrecision: 0,
      transformers: {
        serialize: value => value * 100,
        deserialize: value => value / 100,
      },
    },
  },
  assistTick: {
    label: "Assist Tick",
    input: {
      type: "checkbox",
    },
  },
  metronome: {
    label: "Metronome",
    input: {
      type: "checkbox",
    },
  },
}
