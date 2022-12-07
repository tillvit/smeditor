import { App } from "../App"

export interface MenuSelection {
  type: "selection",
  id: string
}

export interface MenuCheckbox {
  type: "checkbox",
  id: string,
  checked: boolean | ((app: App) => boolean)
}

export interface MenuMain {
  type: "menu",
  title: string,
  options: MenuOption[]
}

export interface MenuDropdown {
  type: "dropdown",
  title: string,
  options: MenuOption[]
}

export interface MenuSeperator {
  type: "seperator",
}

export type MenuOption = MenuSelection | MenuCheckbox | MenuMain | MenuDropdown | MenuSeperator

export const MENUBAR_DATA: {[key: string]: MenuMain} = {
  file: {
    type: "menu",
    title: "File",
    options: [{
      type: "selection",
      id: "newSong",
    },
    {
      type: "selection",
      id: "openSong",
    },{
      type: "seperator",
    },{
      type: "selection",
      id: "save",
    }]
  },
  chart: {
    type: "menu",
    title: "Chart",
    options: [{
      type: "selection",
      id: "newChart",
    },{
      type: "selection",
      id: "openChart",
    },{
      type: "seperator",
    },{
      type: "selection",
      id: "chartProperties",
    }]
  },
  audio: {
    type: "menu",
    title: "Audio",
    options: [{
      type: "checkbox",
      id: "assistTick",
      checked: (app) => app.options.audio.assistTick,
    },{
      type: "checkbox",
      id: "metronome",
      checked: (app) => app.options.audio.metronome,
    },{
      type: "seperator",
    },{
      type: "dropdown",
      title: "Volume",
      options: [{
        type: "selection",
        id: "volumeUp",
      },
      {
        type: "selection",
        id: "volumeDown",
      }]
    },{
      type: "dropdown",
      title: "Effect Volume",
      options: [{
        type: "selection",
        id: "effectvolumeUp",
      },
      {
        type: "selection",
        id: "effectvolumeDown",
      }]
    },{
      type: "dropdown",
      title: "Rate",
      options: [{
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
      }]
    },{
      type: "seperator",
    },{
      type: "selection",
      id: "showEq",
    }]
  },
  view: {
    type: "menu",
    title: "View",
    options: [{
      type: "dropdown",
      title: "Cursor",
      options: [{
        type: "selection",
        id: "cursorUp",
      },
      {
        type: "selection",
        id: "cursorDown",
      },{
        type: "seperator",
      },{
        type: "selection",
        id: "previousMeasure",
      },{
        type: "selection",
        id: "nextMeasure",
      },{
        type: "seperator",
      },{
        type: "selection",
        id: "jumpBeat",
      }]
    },{
      type: "dropdown",
      title: "Snap",
      options: [{
        type: "selection",
        id: "decreaseSnap",
      },
      {
        type: "selection",
        id: "increaseSnap",
      }]
    },{
      type: "dropdown",
      title: "Scroll",
      options: [{
        type: "checkbox",
        id: "XMod",
        checked: (app) => !app.options.chart.CMod,
      },
      {
        type: "checkbox",
        id: "CMod",
        checked: (app) => app.options.chart.CMod
      },{
        type: "seperator",
      },{
        type: "selection",
        id: "increaseScrollSpeed",
      },
      {
        type: "selection",
        id: "decreaseScrollSpeed",
      }]
    },{
      type: "dropdown",
      title: "Waveform",
      options: [{
        type: "checkbox",
        id: "renderWaveform",
        checked: (app) => app.options.waveform.enabled
      },{
        type: "selection",
        id: "waveformOptions",
      }]
    },{
      type: "seperator",
    },{
      type: "checkbox",
      id: "hideWarpedArrows",
      checked: (app) => app.options.chart.hideWarpedArrows
    },
    {
      type: "checkbox",
      id: "doSpeedChanges",
      checked: (app) => app.options.chart.doSpeedChanges
    }]
  }
}
