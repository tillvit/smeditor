import { Color } from "pixi.js"
import { ThemeEditorWindow } from "../gui/window/ThemeEditorWindow"

export const THEME_VAR_WHITELIST = [
  "accent-color",
  "editor-bg",
  "widget-bg",
  "editable-overlay-hover",
  "editable-overlay-active",
  "text-color",
  "text-color-secondary",
  "text-color-detail",
  "text-color-disabled",
  "primary-bg",
  "primary-border",
  "primary-bg-active",
  "primary-bg-hover",
  "secondary-bg",
  "secondary-border",
  "secondary-bg-active",
  "secondary-bg-hover",
  "tooltip-bg",
  "input-bg",
  "input-bg-active",
  "input-bg-hover",
  "input-border",
  "navbar-bg",
  "navbar-bg-inactive",
  "window-bg",
  "window-border",
] as const

export type ThemeProperty = (typeof THEME_VAR_WHITELIST)[number]

export type ThemeString = {
  [key in ThemeProperty]: string
}

export type Theme = {
  [key in ThemeProperty]: Color
}

export type ThemeGroup = {
  name: string
  ids: {
    id: ThemeProperty
    label: string
  }[]
}

export const THEME_GRID_PROPS: ThemeProperty[] = [
  "primary-bg",
  "secondary-bg",
  "text-color",
  "accent-color",
  "widget-bg",
  "editor-bg",
  "editable-overlay-active",
  "input-bg",
  "window-bg",
]

export const THEME_GROUPS: ThemeGroup[] = [
  {
    name: "primary-bg",
    ids: [
      {
        id: "primary-bg",
        label: "base",
      },
      {
        id: "primary-bg-active",
        label: "active",
      },
      {
        id: "primary-bg-hover",
        label: "hover",
      },
      {
        id: "primary-border",
        label: "border",
      },
    ],
  },
  {
    name: "secondary-bg",
    ids: [
      {
        id: "secondary-bg",
        label: "base",
      },
      {
        id: "secondary-bg-active",
        label: "active",
      },
      {
        id: "secondary-bg-hover",
        label: "hover",
      },
      {
        id: "secondary-border",
        label: "border",
      },
    ],
  },
  {
    name: "text-color",
    ids: [
      {
        id: "text-color",
        label: "primary",
      },
      {
        id: "text-color-secondary",
        label: "secondary",
      },
      {
        id: "text-color-detail",
        label: "detail",
      },
      {
        id: "text-color-disabled",
        label: "disabled",
      },
    ],
  },
  {
    name: "other",
    ids: [
      {
        id: "accent-color",
        label: "accent-color",
      },
      {
        id: "widget-bg",
        label: "widget-bg",
      },
      {
        id: "tooltip-bg",
        label: "tooltip-bg",
      },
      {
        id: "editor-bg",
        label: "editor-bg",
      },
    ],
  },
  {
    name: "editable-overlay",
    ids: [
      {
        id: "editable-overlay-hover",
        label: "hover",
      },
      {
        id: "editable-overlay-active",
        label: "active",
      },
    ],
  },
  {
    name: "input",
    ids: [
      {
        id: "input-bg",
        label: "background",
      },
      {
        id: "input-bg-active",
        label: "active",
      },
      {
        id: "input-bg-hover",
        label: "hover",
      },
      {
        id: "input-border",
        label: "border",
      },
    ],
  },
  {
    name: "window",
    ids: [
      {
        id: "window-bg",
        label: "background",
      },
      {
        id: "window-border",
        label: "border",
      },
    ],
  },
  {
    name: "window-navbar",
    ids: [
      {
        id: "navbar-bg",
        label: "active",
      },
      {
        id: "navbar-bg-inactive",
        label: "inactive",
      },
    ],
  },
]

export const THEME_PROPERTY_DESCRIPTIONS: {
  [key in ThemeProperty]: string
} = {
  "accent-color": "Color used for focus input rings, confirm buttons",
  "text-color": "Base text color",
  "text-color-secondary":
    "Secondary text color, used for text in recent files, menubar keybinds",
  "text-color-detail": "Detail text color, used for text in timing event boxes",
  "text-color-disabled":
    "Used for texts relating to empty/disabled things (ex. no files in directory picker)",
  "primary-bg": "Primary background, used for menubar, context/dropdown menus",
  "primary-border": "",
  "primary-bg-active": "",
  "primary-bg-hover": "",
  "navbar-bg": "Window navbar background",
  "navbar-bg-inactive": "",
  "window-bg": "Window background",
  "window-border": "",
  "secondary-bg": "Secondary background, used for subareas in menus",
  "secondary-border": "",
  "secondary-bg-active": "",
  "secondary-bg-hover": "",
  "editable-overlay-hover":
    "Overlay on top of editable items (status widget buttons, playback option toggles, textareas)",
  "editable-overlay-active": "",
  "input-bg": "Background color for input",
  "input-bg-active": "",
  "input-bg-hover": "",
  "input-border": "",
  "widget-bg": "Widget background",
  "tooltip-bg": "Color of these tooltips",
  "editor-bg": "Editor background",
}

export type ThemeColorLinks = {
  [key in ThemeProperty]?: (this: ThemeEditorWindow, c: Color) => Color
}

export const THEME_GENERATOR_LINKS: {
  [key in ThemeProperty]?: ThemeColorLinks
} = {
  "primary-bg": {
    "primary-border": function (c) {
      return this.lighten(c, 10).setAlpha(0xbb / 0xff)
    },
    "primary-bg-active": function (c) {
      return this.lighten(c, 10)
    },
    "primary-bg-hover": function (c) {
      return this.lighten(c, 30)
    },
    "widget-bg": function (c) {
      return this.add(c, -50).setAlpha(0x88 / 0xff)
    },
    "window-bg": function (c) {
      return this.lighten(c, -10)
    },
    "text-color": function (c) {
      return this.average(c) > 0.5 ? new Color("#000") : new Color("#fff")
    },
    "input-bg": function (c) {
      return this.average(c) < 0.5 ? new Color("#000") : new Color("#fff")
    },
    "input-border": function (c) {
      return this.average(c) > 0.5
        ? this.add(c, -30).setAlpha(0x77 / 0xff)
        : this.add(c, +30).setAlpha(0x77 / 0xff)
    },
    "tooltip-bg": function (c) {
      return this.lighten(c, -10).setAlpha(0xee / 0xff)
    },
    "secondary-bg": function (c) {
      return this.lighten(c, -20)
    },
    "editor-bg": function (c) {
      return this.lighten(c, -60)
    },
  },
  "window-bg": {
    "navbar-bg": function (c) {
      return new Color(c)
    },
  },
  "secondary-bg": {
    "secondary-border": function (c) {
      return this.lighten(c, 10).setAlpha(0xbb / 0xff)
    },
    "secondary-bg-active": function (c) {
      return this.lighten(c, 50)
    },
    "secondary-bg-hover": function (c) {
      return this.lighten(c, 30)
    },
  },
  "navbar-bg": {
    "navbar-bg-inactive": function (c) {
      return this.lighten(c, -33)
    },
  },
  "text-color": {
    "text-color-secondary": function (c) {
      return new Color(c).setAlpha(0x77 / 0xff)
    },
    "text-color-detail": function (c) {
      return new Color(c).setAlpha(0x44 / 0xff)
    },
    "text-color-disabled": function (c) {
      return new Color(c).setAlpha(0x88 / 0xff)
    },
  },
  "input-bg": {
    "input-border": function (c) {
      return this.lighten(c, 10).setAlpha(0xbb / 0xff)
    },
    "input-bg-active": function (c) {
      return this.lighten(c, 50)
    },
    "input-bg-hover": function (c) {
      return this.lighten(c, 30)
    },
  },
}

export const DEFAULT_THEMES: Record<string, Theme> = {
  default: {
    "accent-color": new Color("rgb(23, 131, 208)"),
    "text-color": new Color("#fff"),
    "text-color-secondary": new Color("#888"),
    "text-color-detail": new Color("#757a89"),
    "text-color-disabled": new Color("#888"),
    "primary-bg": new Color("#555"),
    "primary-border": new Color("#444"),
    "primary-bg-active": new Color("#575757"),
    "primary-bg-hover": new Color("#666"),
    "navbar-bg": new Color("#3d3d3d"),
    "navbar-bg-inactive": new Color("#626262"),
    "window-bg": new Color("#3d3d3d"),
    "window-border": new Color("#00000000"),
    "secondary-bg": new Color("#373737"),
    "secondary-border": new Color("#333"),
    "secondary-bg-active": new Color("#555"),
    "secondary-bg-hover": new Color("#454545"),
    "editable-overlay-hover": new Color("rgb(255, 255, 255, 0.1)"),
    "editable-overlay-active": new Color("rgb(255, 255, 255, 0.2)"),
    "input-bg": new Color("rgba(35, 35, 35, 0.309)"),
    "input-bg-active": new Color("rgba(50, 50, 50, 0.309)"),
    "input-bg-hover": new Color("rgba(79, 79, 79, 0.309)"),
    "input-border": new Color("rgba(0, 0, 0, 0.3)"),
    "widget-bg": new Color("rgba(0, 0, 0, 0.5)"),
    "tooltip-bg": new Color("rgba(20, 20, 20, 0.95)"),
    "editor-bg": new Color("#18191c"),
  },
  dusk: {
    "accent-color": new Color("#b34e97ff"),
    "text-color": new Color("#ffffffff"),
    "text-color-secondary": new Color("#ffffff77"),
    "text-color-detail": new Color("#ffffff44"),
    "text-color-disabled": new Color("#ffffff88"),
    "primary-bg": new Color("#1b0131ff"),
    "primary-border": new Color("#1e0136bb"),
    "primary-bg-active": new Color("#2f0057ff"),
    "primary-bg-hover": new Color("#230140ff"),
    "navbar-bg": new Color("#18012cff"),
    "navbar-bg-inactive": new Color("#10011dff"),
    "window-bg": new Color("#18012cff"),
    "window-border": new Color("#00000000"),
    "secondary-bg": new Color("#160127ff"),
    "secondary-border": new Color("#18012bbb"),
    "secondary-bg-active": new Color("#310a52ff"),
    "secondary-bg-hover": new Color("#25033fff"),
    "editable-overlay-hover": new Color("#e79dff1a"),
    "editable-overlay-active": new Color("#e79dff33"),
    "input-bg": new Color("#000000ff"),
    "input-bg-active": new Color("#000000ff"),
    "input-bg-hover": new Color("#000000ff"),
    "input-border": new Color("#391f4f77"),
    "widget-bg": new Color("#00000088"),
    "tooltip-bg": new Color("#18012cee"),
    "editor-bg": new Color("#0b0014ff"),
  },
  nord: {
    "accent-color": new Color("#1783d0ff"),
    "text-color": new Color("#d9dee8ff"),
    "text-color-secondary": new Color("#d9dee878"),
    "text-color-detail": new Color("#d9dee845"),
    "text-color-disabled": new Color("#d9dee887"),
    "primary-bg": new Color("#2e3440ff"),
    "primary-border": new Color("#323946ba"),
    "primary-bg-active": new Color("#636d83ff"),
    "primary-bg-hover": new Color("#485061ff"),
    "navbar-bg": new Color("#292e39ff"),
    "navbar-bg-inactive": new Color("#2f333cff"),
    "window-bg": new Color("#292e39ff"),
    "window-border": new Color("#00000000"),
    "secondary-bg": new Color("#242933ff"),
    "secondary-border": new Color("#272d38ba"),
    "secondary-bg-active": new Color("#444d5fff"),
    "secondary-bg-hover": new Color("#3f4755ff"),
    "editable-overlay-hover": new Color("#ffffff1a"),
    "editable-overlay-active": new Color("#ffffff33"),
    "input-bg": new Color("#1212124f"),
    "input-bg-active": new Color("#141414ff"),
    "input-bg-hover": new Color("#171717ff"),
    "input-border": new Color("#121212ff"),
    "widget-bg": new Color("#00020e87"),
    "tooltip-bg": new Color("#292e39ed"),
    "editor-bg": new Color("#18191cff"),
  },
  light: {
    "accent-color": new Color("#ff594cff"),
    "text-color": new Color("#000000ff"),
    "text-color-secondary": new Color("#00000078"),
    "text-color-detail": new Color("#00000045"),
    "text-color-disabled": new Color("#00000087"),
    "primary-bg": new Color("#ffffffff"),
    "primary-border": new Color("#b5b5b5ff"),
    "primary-bg-active": new Color("#ebebebff"),
    "primary-bg-hover": new Color("#ffd4d1ff"),
    "navbar-bg": new Color("#edededff"),
    "navbar-bg-inactive": new Color("#d1d1d1ff"),
    "window-bg": new Color("#edededff"),
    "window-border": new Color("#00000000"),
    "secondary-bg": new Color("#d9d9d9ff"),
    "secondary-border": new Color("#c7c7c7ff"),
    "secondary-bg-active": new Color("#f0f0f0ff"),
    "secondary-bg-hover": new Color("#e3e3e3ff"),
    "editable-overlay-hover": new Color("#ff594c3d"),
    "editable-overlay-active": new Color("#ff594c73"),
    "input-bg": new Color("#ebebebff"),
    "input-bg-active": new Color("#e0e0e0ff"),
    "input-bg-hover": new Color("#ffffffff"),
    "input-border": new Color("#9e9e9eff"),
    "widget-bg": new Color("#f7f7f7e5"),
    "tooltip-bg": new Color("#ffffffff"),
    "editor-bg": new Color("#cfcfcfff"),
  },
  rust: {
    "accent-color": new Color("#b37100ff"),
    "text-color": new Color("#ffd7bdf2"),
    "text-color-secondary": new Color("#ffd7bd78"),
    "text-color-detail": new Color("#ffd7bd45"),
    "text-color-disabled": new Color("#ffd7bd87"),
    "primary-bg": new Color("#3c2e2aff"),
    "primary-border": new Color("#42332eff"),
    "primary-bg-active": new Color("#68524bff"),
    "primary-bg-hover": new Color("#4e3c37ff"),
    "navbar-bg": new Color("#362926ff"),
    "navbar-bg-inactive": new Color("#241b19ff"),
    "window-bg": new Color("#58413cff"),
    "window-border": new Color("#00000000"),
    "secondary-bg": new Color("#40302ba1"),
    "secondary-border": new Color("#46352fff"),
    "secondary-bg-active": new Color("#614a42ff"),
    "secondary-bg-hover": new Color("#533e38ff"),
    "editable-overlay-hover": new Color("#fff8e01a"),
    "editable-overlay-active": new Color("#fff8e033"),
    "input-bg": new Color("#231515ff"),
    "input-bg-active": new Color("#271717ff"),
    "input-bg-hover": new Color("#2e1b1bff"),
    "input-border": new Color("#4b413fff"),
    "widget-bg": new Color("#311e1cdd"),
    "tooltip-bg": new Color("#362926ff"),
    "editor-bg": new Color("#181211ff"),
  },
  tron: {
    "accent-color": new Color("#00ccffff"),
    "text-color": new Color("#ffffffff"),
    "text-color-secondary": new Color("#ffffffe4"),
    "text-color-detail": new Color("#ffffff5b"),
    "text-color-disabled": new Color("#ffffff88"),
    "primary-bg": new Color("#000000ff"),
    "primary-border": new Color("#ff7b00c9"),
    "primary-bg-active": new Color("#00e1ff98"),
    "primary-bg-hover": new Color("#ff751a5a"),
    "navbar-bg": new Color("#000000ff"),
    "navbar-bg-inactive": new Color("#000000ff"),
    "window-bg": new Color("#000000ff"),
    "window-border": new Color("#ff880085"),
    "secondary-bg": new Color("#121212ff"),
    "secondary-border": new Color("#ff8800aa"),
    "secondary-bg-active": new Color("#00e1ffa3"),
    "secondary-bg-hover": new Color("#ff7e145a"),
    "editable-overlay-hover": new Color("#ffffff1a"),
    "editable-overlay-active": new Color("#ffffff33"),
    "input-bg": new Color("#000000ff"),
    "input-bg-active": new Color("#000000ff"),
    "input-bg-hover": new Color("#000000ff"),
    "input-border": new Color("#1e1e1eff"),
    "widget-bg": new Color("#000000ad"),
    "tooltip-bg": new Color("#000000ff"),
    "editor-bg": new Color("#000000ff"),
  },
  gilded: {
    "accent-color": new Color("#ffc014ff"),
    "text-color": new Color("#e6e6e6ff"),
    "text-color-secondary": new Color("#ffffff6b"),
    "text-color-detail": new Color("#e6e6e645"),
    "text-color-disabled": new Color("#e6e6e687"),
    "primary-bg": new Color("#232325ff"),
    "primary-border": new Color("#272729ff"),
    "primary-bg-active": new Color("#ffc0145b"),
    "primary-bg-hover": new Color("#ffc01421"),
    "navbar-bg": new Color("#202021ff"),
    "navbar-bg-inactive": new Color("#151516ff"),
    "window-bg": new Color("#202021ff"),
    "window-border": new Color("#00000000"),
    "secondary-bg": new Color("#1c1c1eff"),
    "secondary-border": new Color("#1f1f21ff"),
    "secondary-bg-active": new Color("#1f1f21ff"),
    "secondary-bg-hover": new Color("#242427ff"),
    "editable-overlay-hover": new Color("#ffffff1a"),
    "editable-overlay-active": new Color("#ffffff33"),
    "input-bg": new Color("#0d0d0dff"),
    "input-bg-active": new Color("#0e0e0eff"),
    "input-bg-hover": new Color("#111111ff"),
    "input-border": new Color("#0e0e0eff"),
    "widget-bg": new Color("#171717db"),
    "tooltip-bg": new Color("#202021ff"),
    "editor-bg": new Color("#0e0e0fff"),
  },
}
