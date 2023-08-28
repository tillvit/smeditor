import { App } from "../App"
import { Options } from "../util/Options"

export interface MenuSelection {
  type: "selection"
  id: string
}

export interface MenuCheckbox {
  type: "checkbox"
  id: string
  checked: boolean | ((app: App) => boolean)
}

export interface MenuMain {
  type: "menu"
  title: string
  options: MenuOption[]
}

export interface MenuDropdown {
  type: "dropdown"
  title: string | ((app: App) => string)
  options: MenuOption[]
}

export interface MenuSeperator {
  type: "seperator"
}

export type MenuOption =
  | MenuSelection
  | MenuCheckbox
  | MenuMain
  | MenuDropdown
  | MenuSeperator

export const MENUBAR_DATA: { [key: string]: MenuMain } = {
  file: {
    type: "menu",
    title: "File",
    options: [
      {
        type: "selection",
        id: "newSong",
      },
      {
        type: "selection",
        id: "openSong",
      },
      {
        type: "seperator",
      },
      {
        type: "selection",
        id: "save",
      },
      {
        type: "selection",
        id: "export",
      },
    ],
  },
  edit: {
    type: "menu",
    title: "Edit",
    options: [
      {
        type: "selection",
        id: "cut",
      },
      {
        type: "selection",
        id: "copy",
      },
      {
        type: "selection",
        id: "paste",
      },
      {
        type: "seperator",
      },
      {
        type: "selection",
        id: "undo",
      },
      {
        type: "selection",
        id: "redo",
      },
      {
        type: "seperator",
      },
      {
        type: "checkbox",
        id: "mousePlacement",
        checked: () => Options.general.mousePlacement,
      },
    ],
  },
  view: {
    type: "menu",
    title: "View",
    options: [
      {
        type: "dropdown",
        title: "Cursor",
        options: [
          {
            type: "selection",
            id: "cursorUp",
          },
          {
            type: "selection",
            id: "cursorDown",
          },
          {
            type: "seperator",
          },
          {
            type: "selection",
            id: "previousNote",
          },
          {
            type: "selection",
            id: "nextNote",
          },
          {
            type: "seperator",
          },
          {
            type: "selection",
            id: "previousMeasure",
          },
          {
            type: "selection",
            id: "nextMeasure",
          },
          {
            type: "seperator",
          },
          {
            type: "selection",
            id: "jumpChartStart",
          },
          {
            type: "selection",
            id: "jumpChartEnd",
          },
          {
            type: "seperator",
          },
          {
            type: "selection",
            id: "jumpSongStart",
          },
          {
            type: "selection",
            id: "jumpSongEnd",
          },
        ],
      },
      {
        type: "dropdown",
        title: "Snap",
        options: [
          {
            type: "selection",
            id: "decreaseSnap",
          },
          {
            type: "selection",
            id: "increaseSnap",
          },
        ],
      },
      {
        type: "dropdown",
        title: "Scroll",
        options: [
          {
            type: "checkbox",
            id: "XMod",
            checked: () => !Options.chart.CMod,
          },
          {
            type: "checkbox",
            id: "CMod",
            checked: () => Options.chart.CMod,
          },
          {
            type: "seperator",
          },
          {
            type: "selection",
            id: "increaseScrollSpeed",
          },
          {
            type: "selection",
            id: "decreaseScrollSpeed",
          },
        ],
      },
      {
        type: "dropdown",
        title: "Zoom",
        options: [
          {
            type: "selection",
            id: "zoomIn",
          },
          {
            type: "selection",
            id: "zoomOut",
          },
          {
            type: "seperator",
          },
          {
            type: "selection",
            id: "zoomDefault",
          },
        ],
      },
      {
        type: "dropdown",
        title: "Waveform",
        options: [
          {
            type: "checkbox",
            id: "renderWaveform",
            checked: () => Options.chart.waveform.enabled,
          },
          {
            type: "selection",
            id: "waveformOptions",
          },
        ],
      },
      {
        type: "seperator",
      },
      {
        type: "selection",
        id: "playMode",
      },
      {
        type: "selection",
        id: "playModeStart",
      },
      {
        type: "seperator",
      },
      {
        type: "selection",
        id: "recordMode",
      },
      {
        type: "selection",
        id: "recordModeStart",
      },
      {
        type: "seperator",
      },
      {
        type: "checkbox",
        id: "hideWarpedArrows",
        checked: () => Options.chart.hideWarpedArrows,
      },
      {
        type: "checkbox",
        id: "doSpeedChanges",
        checked: () => Options.chart.doSpeedChanges,
      },
    ],
  },
  chart: {
    type: "menu",
    title: "Chart",
    options: [
      {
        type: "selection",
        id: "openChart",
      },
      {
        type: "seperator",
      },
      {
        type: "selection",
        id: "songProperties",
      },
      {
        type: "seperator",
      },
      {
        type: "selection",
        id: "timingDataRow",
      },
    ],
  },
  selection: {
    type: "menu",
    title: "Selection",
    options: [
      {
        type: "dropdown",
        title: "Convert",
        options: [
          {
            type: "selection",
            id: "convertHoldsRolls",
          },
          {
            type: "selection",
            id: "convertHoldsTaps",
          },
          {
            type: "selection",
            id: "convertNotesMines",
          },
          {
            type: "selection",
            id: "convertTapsFakes",
          },
        ],
      },
      {
        type: "dropdown",
        title: "Mirror",
        options: [
          {
            type: "selection",
            id: "mirrorHorizontally",
          },
          {
            type: "selection",
            id: "mirrorVertically",
          },
          {
            type: "selection",
            id: "mirrorBoth",
          },
        ],
      },
      {
        type: "dropdown",
        title: "Stretch",
        options: [
          {
            type: "selection",
            id: "expand2to1",
          },
          {
            type: "selection",
            id: "expand3to2",
          },
          {
            type: "selection",
            id: "expand4to3",
          },
          {
            type: "seperator",
          },
          {
            type: "selection",
            id: "compress1to2",
          },
          {
            type: "selection",
            id: "compress2to3",
          },
          {
            type: "selection",
            id: "compress3to4",
          },
        ],
      },
      {
        type: "seperator",
      },
      {
        type: "selection",
        id: "setSongPreview",
      },
      {
        type: "seperator",
      },
      {
        type: "selection",
        id: "exportNotedata",
      },
      {
        type: "seperator",
      },
      {
        type: "selection",
        id: "selectAll",
      },
    ],
  },
  audio: {
    type: "menu",
    title: "Audio",
    options: [
      {
        type: "selection",
        id: "adjustOffset",
      },
      {
        type: "checkbox",
        id: "assistTick",
        checked: () => Options.audio.assistTick,
      },
      {
        type: "checkbox",
        id: "metronome",
        checked: () => Options.audio.metronome,
      },
      {
        type: "seperator",
      },
      {
        type: "dropdown",
        title: () =>
          "Master Volume (" +
          Math.round(Options.audio.masterVolume * 100) +
          "%)",
        options: [
          {
            type: "selection",
            id: "volumeUp",
          },
          {
            type: "selection",
            id: "volumeDown",
          },
        ],
      },
      {
        type: "dropdown",
        title: () =>
          "Song Volume (" + Math.round(Options.audio.songVolume * 100) + "%)",
        options: [
          {
            type: "selection",
            id: "songVolumeUp",
          },
          {
            type: "selection",
            id: "songVolumeDown",
          },
        ],
      },
      {
        type: "dropdown",
        title: () =>
          "Effect Volume (" +
          Math.round(Options.audio.soundEffectVolume * 100) +
          "%)",
        options: [
          {
            type: "selection",
            id: "effectvolumeUp",
          },
          {
            type: "selection",
            id: "effectvolumeDown",
          },
        ],
      },
      {
        type: "dropdown",
        title: () =>
          "Playback rate (" + Math.round(Options.audio.rate * 100) + "%)",
        options: [
          {
            type: "selection",
            id: "rateUp",
          },
          {
            type: "selection",
            id: "rateDown",
          },
          {
            type: "seperator",
          },
          {
            type: "selection",
            id: "rateDefault",
          },
        ],
      },
      {
        type: "seperator",
      },
      {
        type: "selection",
        id: "showEq",
      },
    ],
  },
  preferences: {
    type: "menu",
    title: "Preferences",
    options: [
      {
        type: "selection",
        id: "options",
      },
      {
        type: "selection",
        id: "keybinds",
      },
      {
        type: "selection",
        id: "gameplayKeybinds",
      },
    ],
  },
}
