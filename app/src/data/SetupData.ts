import avPreview from "../../assets/setup/av.png"
import defaultPreview from "../../assets/setup/default.png"
import { KeyCombo, Modifier } from "./KeybindData"

export interface SetupPreset {
  img: string
  title: string
  subtitle?: string
  options: ([string] | [string, any])[]
  keybinds: ([string] | [string, KeyCombo[]])[]
}

export const SETUP_PRESETS: Record<string, SetupPreset> = {
  default: {
    img: defaultPreview,
    title: "Default",
    subtitle: "similar to the in game editor",
    options: [["chart.forceSnapNotes"], ["chart.defaultHoldPlacement"]],
    keybinds: [
      ["increaseScrollSpeed"],
      ["decreaseScrollSpeed"],
      ["volumeUp"],
      ["volumeDown"],
      ["openChart"],
      ["songProperties"],
      ["detectSync"],
      ["playModeStart"],
    ],
  },
  arrowvortex: {
    img: avPreview,
    title: "ArrowVortex",
    options: [
      ["chart.forceSnapNotes", true],
      ["chart.defaultHoldPlacement", false],
    ],
    keybinds: [
      ["increaseScrollSpeed", [{ key: "NumpadAdd", mods: [] }]],
      ["decreaseScrollSpeed", [{ key: "NumpadSubtract", mods: [] }]],
      ["volumeUp", [{ key: "Up", mods: [Modifier.SHIFT] }]],
      ["volumeDown", [{ key: "Down", mods: [Modifier.SHIFT] }]],
      [
        "openChart",
        [
          { key: "L", mods: [Modifier.SHIFT] },
          { key: "C", mods: [Modifier.SHIFT] },
        ],
      ],
      ["songProperties", [{ key: "P", mods: [Modifier.SHIFT] }]],
      ["detectSync", [{ key: "K", mods: [Modifier.SHIFT] }]],
      ["playModeStart", [{ key: "P", mods: [Modifier.ALT] }]],
    ],
  },
}

export const SETUP_OPTIONS = [
  {
    name: "Reverse Scroll",
    description: "Choose the direction that the playfield scrolls.",
    option: "chart.reverse",
    values: [
      { label: "Upscroll", value: false },
      { label: "Downscroll", value: true },
    ],
  },
  {
    name: "Enable mouse note placement",
    description:
      "Allow placing notes with the mouse in the editor. Togglable using Shift + M.",
    option: "chart.mousePlacement",
    values: [
      { label: "Enabled", value: true },
      { label: "Disabled", value: false },
    ],
  },
  {
    name: "Enable parity checking",
    description:
      "When turned on, will display flow errors, left/right foot placements, candles, and the dancing bot. Useful for charts meant to be played on pad. Togglable using E.",
    option: "chart.parity.enabled",
    values: [
      { label: "Enabled", value: true },
      { label: "Disabled", value: false },
    ],
  },
  {
    name: "Smooth animations",
    description: "Enable smooth animations throughout the editor UI.",
    option: "general.smoothAnimations",
    values: [
      { label: "Enabled", value: true },
      { label: "Disabled", value: false },
    ],
  },
]
