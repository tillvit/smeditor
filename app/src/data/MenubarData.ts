import { App } from "../App"
import { Flags } from "../util/Flags"
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

export interface MenuSeparator {
  type: "separator"
}

export type MenuOption =
  | MenuSelection
  | MenuCheckbox
  | MenuMain
  | MenuDropdown
  | MenuSeparator

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
        type: "selection",
        id: "newWindow",
      },
      {
        type: "separator",
      },
      {
        type: "selection",
        id: "previousSong",
      },
      {
        type: "selection",
        id: "nextSong",
      },
      {
        type: "separator",
      },
      {
        type: "selection",
        id: "save",
      },
      {
        type: "selection",
        id: "export",
      },
      {
        type: "separator",
      },
      {
        type: "selection",
        id: "capture",
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
        type: "selection",
        id: "pasteReplace",
      },
      {
        type: "separator",
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
        type: "separator",
      },
      {
        type: "checkbox",
        id: "mousePlacement",
        checked: () => Options.chart.mousePlacement,
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
            type: "separator",
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
            type: "separator",
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
            type: "separator",
          },
          {
            type: "selection",
            id: "previousStream",
          },
          {
            type: "selection",
            id: "nextStream",
          },
          {
            type: "separator",
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
            type: "separator",
          },
          {
            type: "selection",
            id: "jumpSongStart",
          },
          {
            type: "selection",
            id: "jumpSongEnd",
          },
          {
            type: "separator",
          },
          {
            type: "selection",
            id: "jumpPreviousCandle",
          },
          {
            type: "selection",
            id: "jumpNextCandle",
          },
          {
            type: "separator",
          },
          {
            type: "selection",
            id: "jumpPreviousError",
          },
          {
            type: "selection",
            id: "jumpNextError",
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
            type: "separator",
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
            type: "separator",
          },
          {
            type: "selection",
            id: "zoomDefault",
          },
        ],
      },
      {
        type: "separator",
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
        type: "separator",
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
        type: "separator",
      },
      {
        type: "checkbox",
        id: "reverse",
        checked: () => Options.chart.reverse,
      },
      {
        type: "checkbox",
        id: "hideWarpedArrows",
        checked: () => Options.chart.hideWarpedArrows,
      },
      {
        type: "checkbox",
        id: "hideFakedArrows",
        checked: () => Options.chart.hideFakedArrows,
      },
      {
        type: "checkbox",
        id: "doSpeedChanges",
        checked: () => Options.chart.doSpeedChanges,
      },
      {
        type: "separator",
      },
      {
        type: "dropdown",
        title: "Parity",
        options: [
          {
            type: "checkbox",
            id: "enableParity",
            checked: () => Options.chart.parity.enabled,
          },
          {
            type: "separator",
          },
          {
            type: "checkbox",
            id: "showTechNotation",
            checked: () => Options.chart.parity.showTech,
          },
          {
            type: "checkbox",
            id: "showTechErrors",
            checked: () => Options.chart.parity.showErrors,
          },
          {
            type: "checkbox",
            id: "showFootHighlights",
            checked: () => Options.chart.parity.showHighlights,
          },
          {
            type: "checkbox",
            id: "showCandles",
            checked: () => Options.chart.parity.showCandles,
          },
          {
            type: "checkbox",
            id: "showDancingBot",
            checked: () => Options.chart.parity.showDancingBot,
          },
        ],
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
        type: "separator",
      },
      {
        type: "selection",
        id: "previousChart",
      },
      {
        type: "selection",
        id: "nextChart",
      },
      {
        type: "separator",
      },
      {
        type: "selection",
        id: "songProperties",
      },
      {
        type: "separator",
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
            id: "convertRollsHolds",
          },
          {
            type: "selection",
            id: "swapHoldsRolls",
          },
          {
            type: "separator",
          },
          {
            type: "selection",
            id: "convertHoldsTaps",
          },
          {
            type: "selection",
            id: "convertTapsMines",
          },
          {
            type: "selection",
            id: "convertTapsLifts",
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
            type: "separator",
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
        type: "dropdown",
        title: "Shift",
        options: [
          {
            type: "dropdown",
            title: "Up",
            options: [
              {
                type: "selection",
                id: "shiftUp4m",
              },
              {
                type: "selection",
                id: "shiftUp2m",
              },
              {
                type: "selection",
                id: "shiftUp1m",
              },
              {
                type: "selection",
                id: "shiftUp4th",
              },
              {
                type: "selection",
                id: "shiftUp8th",
              },
              {
                type: "selection",
                id: "shiftUp12th",
              },
              {
                type: "selection",
                id: "shiftUp16th",
              },
              {
                type: "selection",
                id: "shiftUp24th",
              },
              {
                type: "selection",
                id: "shiftUp32nd",
              },
              {
                type: "selection",
                id: "shiftUp48th",
              },
              {
                type: "selection",
                id: "shiftUp64th",
              },
              {
                type: "selection",
                id: "shiftUp96th",
              },
              {
                type: "selection",
                id: "shiftUp192nd",
              },
            ],
          },
          {
            type: "dropdown",
            title: "Down",
            options: [
              {
                type: "selection",
                id: "shiftDown4m",
              },
              {
                type: "selection",
                id: "shiftDown2m",
              },
              {
                type: "selection",
                id: "shiftDown1m",
              },
              {
                type: "selection",
                id: "shiftDown4th",
              },
              {
                type: "selection",
                id: "shiftDown8th",
              },
              {
                type: "selection",
                id: "shiftDown12th",
              },
              {
                type: "selection",
                id: "shiftDown16th",
              },
              {
                type: "selection",
                id: "shiftDown24th",
              },
              {
                type: "selection",
                id: "shiftDown32nd",
              },
              {
                type: "selection",
                id: "shiftDown48th",
              },
              {
                type: "selection",
                id: "shiftDown64th",
              },
              {
                type: "selection",
                id: "shiftDown96th",
              },
              {
                type: "selection",
                id: "shiftDown192nd",
              },
            ],
          },
        ],
      },
      {
        type: "dropdown",
        title: "Quantize",
        options: [
          {
            type: "selection",
            id: "quantize4th",
          },
          {
            type: "selection",
            id: "quantize8th",
          },
          {
            type: "selection",
            id: "quantize12th",
          },
          {
            type: "selection",
            id: "quantize16th",
          },
          {
            type: "selection",
            id: "quantize24th",
          },
          {
            type: "selection",
            id: "quantize32nd",
          },
          {
            type: "selection",
            id: "quantize48th",
          },
          {
            type: "selection",
            id: "quantize64th",
          },
          {
            type: "selection",
            id: "quantize96th",
          },
        ],
      },
      {
        type: "dropdown",
        title: "Timing",
        options: [
          {
            type: "selection",
            id: "convertSTOPS",
          },
          {
            type: "selection",
            id: "convertWARPS",
          },
          {
            type: "selection",
            id: "convertFAKES",
          },
          {
            type: "selection",
            id: "convertDELAYS",
          },
        ],
      },
      {
        type: "dropdown",
        title: "Parity",
        options: [
          {
            type: "selection",
            id: "parityNone",
          },
          {
            type: "selection",
            id: "parityLeft",
          },
          {
            type: "selection",
            id: "parityRight",
          },
          {
            type: "separator",
          },
          {
            type: "selection",
            id: "parityL",
          },
          {
            type: "selection",
            id: "parityl",
          },
          {
            type: "selection",
            id: "parityR",
          },
          {
            type: "selection",
            id: "parityr",
          },
        ],
      },
      {
        type: "separator",
      },
      {
        type: "selection",
        id: "setSongPreview",
      },
      {
        type: "separator",
      },
      {
        type: "selection",
        id: "exportNotedata",
      },
      {
        type: "separator",
      },
      {
        type: "selection",
        id: "selectBeforeCursor",
      },
      {
        type: "selection",
        id: "selectAfterCursor",
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
        id: "detectSync",
      },
      {
        type: "separator",
      },
      {
        type: "checkbox",
        id: "assistTick",
        checked: () => Options.audio.assistTick && Flags.assist,
      },
      {
        type: "checkbox",
        id: "metronome",
        checked: () => Options.audio.metronome && Flags.assist,
      },
      {
        type: "separator",
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
            type: "separator",
          },
          {
            type: "selection",
            id: "rateDefault",
          },
        ],
      },
      {
        type: "separator",
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
        id: "themes",
      },
      {
        type: "selection",
        id: "keybinds",
      },
      {
        type: "selection",
        id: "gameplayKeybinds",
      },
      {
        type: "selection",
        id: "noteskinWindow",
      },
    ],
  },
  help: {
    type: "menu",
    title: "Help",
    options: [
      {
        type: "selection",
        id: "about",
      },
      {
        type: "selection",
        id: "openGuide",
      },
      {
        type: "selection",
        id: "openChangelog",
      },
    ],
  },
}
