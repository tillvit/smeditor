import { App } from "../App"
import { ChartListWindow } from "../window/ChartListWindow"
import { DirectoryWindow } from "../window/DirectoryWindow"
import { EQWindow } from "../window/EQWindow"

export interface Keybind {
  label: string,
  keybind: string,
  mods: Modifier[],
  disabled: boolean | ((app: App) => boolean),
  callback: (app: App) => void
}

export enum Modifier {
  SHIFT = 'Shift',
  CTRL = 'Ctrl',
  ALT = 'Alt', 
  META = 'Command',
}

export const IS_OSX: boolean = navigator.userAgent.indexOf('Mac OS X') > -1
export const DEF_MOD: Modifier = IS_OSX ? Modifier.META : Modifier.CTRL

export const SPECIAL_KEYS: {[key: string]: string} = {
  "ArrowLeft": "Left",
  "ArrowUp": "Up",
  "ArrowRight": "Right",
  "ArrowDown": "Down",

  "BracketLeft": "[",
  "BracketRight": "]",
  "Semicolon": ";",
  "Quote": "'",
  "Backslash": "\\",
  "Slash": "/",
  "Period": ".",
  "Comma": ",",
  "Backquote": "`",
  "Minus": "-",
  "Equal": "=",
};

export const KEYBINDS: {[key: string]: Keybind} = {
  playback: {
    label: "Play/Pause",
    keybind: "Space",
    mods: [],
    disabled: (app) => !app.chartManager.chartView,
    callback: (app) => app.chartManager.playPause()
  },
  decreaseSnap: {
    label: "Decrease snap",
    keybind: "Left",
    mods: [],
    disabled: (app) => !app.chartManager.chartView,
    callback: (app) => app.chartManager.previousSnap()
  },
  increaseSnap: {
    label: "Increase snap",
    keybind: "Right",
    mods: [],
    disabled: (app) => !app.chartManager.chartView,
    callback: (app) => app.chartManager.nextSnap()
  },
  cursorUp: {
    label: "Move cursor up",
    keybind: "Up",
    mods: [],
    disabled: (app) => !app.chartManager.chartView,
    callback: (app) => app.chartManager.setAndSnapBeat(app.chartManager.getBeat()-Math.max(0.001,app.options.chart.snap))
  },
  cursorDown: {
    label: "Move cursor down",
    keybind: "Down",
    mods: [],
    disabled: (app) => !app.chartManager.chartView,
    callback: (app) => app.chartManager.setAndSnapBeat(app.chartManager.getBeat()+Math.max(0.001,app.options.chart.snap))
  },
  increaseScrollSpeed: {
    label: "Increase scroll speed",
    keybind: "Up",
    mods: [DEF_MOD],
    disabled: (app) => !app.chartManager.chartView,
    callback: (app) => app.options.chart.speed = Math.max(10,app.options.chart.speed*Math.pow(1.01,30))
  },
  decreaseScrollSpeed: {
    label: "Decrease scroll speed",
    keybind: "Down",
    mods: [DEF_MOD],
    disabled: (app) => !app.chartManager.chartView,
    callback: (app) => app.options.chart.speed = Math.max(10,app.options.chart.speed*Math.pow(1.01,-30))
  },
  newSong: {
    label: "New Song...",
    keybind: "N",
    mods: [DEF_MOD],
    disabled: true,
    callback: () => 0
  },
  openSong: {
    label: "Open Song...",
    keybind: "O",
    mods: [DEF_MOD],
    disabled: (app) => !app.chartManager.sm,
    callback: (app)=> {
      app.windowManager.openWindow(new DirectoryWindow(app, {
        title: "Select an sm/ssc file...",
        accepted_file_types: ["sm","ssc"],
        disableClose: true,
        callback: (path: string) => {
          app.chartManager.loadSM(path)
        }
      }))
    }
  },
  save: {
    label: "Save...",
    keybind: "S",
    mods: [DEF_MOD],
    disabled: true,
    callback: () => 0
  },
  newChart: {
    label: "New Chart...",
    keybind: "N",
    mods: [DEF_MOD, Modifier.SHIFT],
    disabled: true,
    callback: () => 0
  },
  openChart: {
    label: "Open Chart...",
    keybind: "O",
    mods: [DEF_MOD, Modifier.SHIFT],
    disabled: false,
    callback: (app) => app.windowManager.openWindow(new ChartListWindow(app))
  },
  chartProperties: {
    label: "Chart Properties...",
    keybind: "P",
    mods: [Modifier.SHIFT, Modifier.ALT],
    disabled: true,
    callback: () => 0
  },
  adjustSync: {
    label: "Adjust Sync...",
    keybind: "S",
    mods: [Modifier.SHIFT, Modifier.ALT],
    disabled: true,
    callback: () => 0
  },
  adjustTiming: {
    label: "Adjust Timing Changes...",
    keybind: "T",
    mods: [Modifier.SHIFT, Modifier.ALT],
    disabled: true,
    callback: () => 0
  },
  selectRegion: {
    label: "Select Region",
    keybind: "Tab",
    mods: [],
    disabled: true,
    callback: () => 0
  },
  volumeUp: {
    label: "Increase volume",
    keybind: "Up",
    mods: [Modifier.SHIFT],
    disabled: false,
    callback: (app) => app.chartManager.setVolume(Math.min(app.options.audio.songVolume+0.05,1))
  },
  volumeDown: {
    label: "Decrease volume",
    keybind: "Down",
    mods: [Modifier.SHIFT],
    disabled: false,
    callback: (app) => app.chartManager.setVolume(Math.max(app.options.audio.songVolume-0.05,0))
  },
  effectvolumeUp: {
    label: "Increase sound effect volume",
    keybind: "Up",
    mods: [Modifier.SHIFT, Modifier.ALT],
    disabled: false,
    callback: (app) => app.chartManager.setEffectVolume(Math.min(app.options.audio.soundEffectVolume+0.05,1))
  },
  effectvolumeDown: {
    label: "Decrease sound effect volume",
    keybind: "Down",
    mods: [Modifier.SHIFT, Modifier.ALT],
    disabled: false,
    callback: (app) => app.chartManager.setEffectVolume(Math.max(app.options.audio.soundEffectVolume-0.05,0))
  },
  rateUp: {
    label: "Increase playback rate",
    keybind: "Right",
    mods: [Modifier.SHIFT],
    disabled: false,
    callback: (app) => app.chartManager.setRate(app.options.audio.rate += 0.05)
  },
  rateDown: {
    label: "Decrease playback rate",
    keybind: "Left",
    mods: [Modifier.SHIFT],
    disabled: false,
    callback: (app) => app.chartManager.setRate(Math.max(app.options.audio.rate-0.05,0.1))
  },
  rateDefault: {
    label: "Reset playback rate",
    keybind: "",
    mods: [],
    disabled: false,
    callback: (app) => app.chartManager.setRate(1)
  },
  previousMeasure: {
    label: "Previous measure",
    keybind: ";",
    mods: [],
    disabled: (app) => !app.chartManager.chartView,
    callback: (app) => app.chartManager.setBeat(Math.max(0,app.chartManager.getBeat() - 4))
  },
  nextMeasure: {
    label: "Next measure",
    keybind: "'",
    mods: [],
    disabled: (app) => !app.chartManager.chartView,
    callback: (app) => app.chartManager.setBeat(app.chartManager.getBeat() + 4)
  },
  assistTick: {
    label: "Assist Tick",
    keybind: "F7",
    mods: [],
    disabled: false,
    callback: (app) => app.options.audio.assistTick = !app.options.audio.assistTick
  },
  metronome: {
    label: "Metronome",
    keybind: "F7",
    mods: [Modifier.ALT],
    disabled: false,
    callback: (app) => app.options.audio.metronome = !app.options.audio.metronome
  },
  renderWaveform: {
    label: "Render waveform",
    keybind: "W",
    mods: [Modifier.SHIFT, Modifier.ALT],
    disabled: false,
    callback: (app) => app.options.waveform.enabled = !app.options.waveform.enabled
  },
  waveformOptions: {
    label: "Waveform options...",
    keybind: "",
    mods: [],
    disabled: true,
    callback: () => 0
  },
  XMod: {
    label: "XMod (Beat-based)",
    keybind: "X",
    mods: [Modifier.SHIFT],
    disabled: false,
    callback: (app) => app.options.chart.CMod = false
  },
  CMod: {
    label: "CMod (Time-based)",
    keybind: "C",
    mods: [Modifier.SHIFT],
    disabled: false,
    callback: (app) => app.options.chart.CMod = true
  },
  hideWarpedArrows: {
    label: "Hide warped arrows (CMod only)",
    keybind: "W",
    mods: [Modifier.SHIFT],
    disabled: false,
    callback: (app) => app.options.chart.hideWarpedArrows = !app.options.chart.hideWarpedArrows
  },
  doSpeedChanges: {
    label: "Do speed changes (XMod only)",
    keybind: "S",
    mods: [Modifier.SHIFT],
    disabled: false,
    callback: (app) => app.options.chart.doSpeedChanges = !app.options.chart.doSpeedChanges
  },
  jumpBeat: {
    label: "Jump to beat...",
    keybind: "",
    mods: [],
    disabled: true,
    callback: () => {}
  },
  showEq: {
    label: "Equalizer",
    keybind: "E",
    mods: [Modifier.SHIFT, Modifier.ALT],
    disabled: (app) => !app.chartManager.songAudio,
    callback: (app) => app.windowManager.openWindow(new EQWindow(app))
  },
}