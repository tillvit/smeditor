import { App } from "../App"
import { ChartListWindow } from "../window/ChartListWindow"
import { DirectoryWindow } from "../window/DirectoryWindow"
import { EQWindow } from "../window/EQWindow"

export interface Keybind {
  label: string,
  keybinds: KeyCombo[],
  disabled: boolean | ((app: App) => boolean),
  callback: (app: App) => void
}

export interface KeyCombo {
  key: string,
  mods: Modifier[],
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
    keybinds: [
      {key: "Space", mods: []}
    ],
    disabled: (app) => !app.chartManager.chartView,
    callback: (app) => app.chartManager.playPause()
  },
  decreaseSnap: {
    label: "Decrease snap",
    keybinds: [
			{key: "Left", mods: []}
		],
    disabled: (app) => !app.chartManager.chartView,
    callback: (app) => app.chartManager.previousSnap()
  },
  increaseSnap: {
    label: "Increase snap",
    keybinds: [
			{key: "Right", mods: []}
		],
    disabled: (app) => !app.chartManager.chartView,
    callback: (app) => app.chartManager.nextSnap()
  },
  cursorUp: {
    label: "Move cursor up",
    keybinds: [
			{key: "Up", mods: []}
		],
    disabled: (app) => !app.chartManager.chartView,
    callback: (app) => app.chartManager.setAndSnapBeat(app.chartManager.getBeat()-Math.max(0.001,app.options.chart.snap))
  },
  cursorDown: {
    label: "Move cursor down",
    keybinds: [
			{key: "Down", mods: []}
		],
    disabled: (app) => !app.chartManager.chartView,
    callback: (app) => app.chartManager.setAndSnapBeat(app.chartManager.getBeat()+Math.max(0.001,app.options.chart.snap))
  },
  increaseScrollSpeed: {
    label: "Increase scroll speed",
    keybinds: [
			{key: "Up", mods: [DEF_MOD]}
		],
    disabled: (app) => !app.chartManager.chartView,
    callback: (app) => app.options.chart.speed = Math.max(10,app.options.chart.speed*Math.pow(1.01,30))
  },
  decreaseScrollSpeed: {
    label: "Decrease scroll speed",
    keybinds: [
			{key: "Down", mods: [DEF_MOD]}
		],
    disabled: (app) => !app.chartManager.chartView,
    callback: (app) => app.options.chart.speed = Math.max(10,app.options.chart.speed*Math.pow(1.01,-30))
  },
  newSong: {
    label: "New Song...",
    keybinds: [
			{key: "N", mods: [DEF_MOD]}
		],
    disabled: true,
    callback: () => 0
  },
  openSong: {
    label: "Open Song...",
    keybinds: [
			{key: "O", mods: [DEF_MOD]}
		],
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
    keybinds: [
			{key: "S", mods: [DEF_MOD]}
		],
    disabled: true,
    callback: () => 0
  },
  newChart: {
    label: "New Chart...",
    keybinds: [
			{key: "N", mods: [DEF_MOD, Modifier.SHIFT]}
		],
    disabled: true,
    callback: () => 0
  },
  openChart: {
    label: "Open Chart...",
    keybinds: [
			{key: "O", mods: [DEF_MOD, Modifier.SHIFT]}
		],
    disabled: false,
    callback: (app) => app.windowManager.openWindow(new ChartListWindow(app))
  },
  chartProperties: {
    label: "Chart Properties...",
    keybinds: [
			{key: "P", mods: [Modifier.SHIFT, Modifier.ALT]}
		],
    disabled: true,
    callback: () => 0
  },
  adjustSync: {
    label: "Adjust Sync...",
    keybinds: [
			{key: "S", mods: [Modifier.SHIFT, Modifier.ALT]}
		],
    disabled: true,
    callback: () => 0
  },
  adjustTiming: {
    label: "Adjust Timing Changes...",
    keybinds: [
			{key: "T", mods: [Modifier.SHIFT, Modifier.ALT]}
		],
    disabled: true,
    callback: () => 0
  },
  selectRegion: {
    label: "Select Region",
    keybinds: [
			{key: "Tab", mods: []}
		],
    disabled: true,
    callback: () => 0
  },
  volumeUp: {
    label: "Increase volume",
    keybinds: [
			{key: "Up", mods: [Modifier.SHIFT]}
		],
    disabled: false,
    callback: (app) => app.chartManager.setVolume(Math.min(app.options.audio.songVolume+0.05,1))
  },
  volumeDown: {
    label: "Decrease volume",
    keybinds: [
			{key: "Down", mods: [Modifier.SHIFT]}
		],
    disabled: false,
    callback: (app) => app.chartManager.setVolume(Math.max(app.options.audio.songVolume-0.05,0))
  },
  effectvolumeUp: {
    label: "Increase sound effect volume",
    keybinds: [
			{key: "Up", mods: [Modifier.SHIFT, Modifier.ALT]}
		],
    disabled: false,
    callback: (app) => app.chartManager.setEffectVolume(Math.min(app.options.audio.soundEffectVolume+0.05,1))
  },
  effectvolumeDown: {
    label: "Decrease sound effect volume",
    keybinds: [
			{key: "Down", mods: [Modifier.SHIFT, Modifier.ALT]}
		],
    disabled: false,
    callback: (app) => app.chartManager.setEffectVolume(Math.max(app.options.audio.soundEffectVolume-0.05,0))
  },
  rateUp: {
    label: "Increase playback rate",
    keybinds: [
			{key: "Right", mods: [Modifier.SHIFT]}
		],
    disabled: false,
    callback: (app) => app.chartManager.setRate(app.options.audio.rate += 0.05)
  },
  rateDown: {
    label: "Decrease playback rate",
    keybinds: [
			{key: "Left", mods: [Modifier.SHIFT]}
		],
    disabled: false,
    callback: (app) => app.chartManager.setRate(Math.max(app.options.audio.rate-0.05,0.1))
  },
  rateDefault: {
    label: "Reset playback rate",
    keybinds: [],
    disabled: false,
    callback: (app) => app.chartManager.setRate(1)
  },
  previousMeasure: {
    label: "Previous measure",
    keybinds: [
      {key: "PageUp", mods: []},
			{key: ";", mods: []}
		],
    disabled: (app) => !app.chartManager.chartView,
    callback: (app) => {
      let beat = app.chartManager.getBeat()
      let snapped = Math.floor(beat/4)*4
      if (beat == snapped) snapped -= 4
      app.chartManager.setBeat(Math.max(0,snapped))
    }
  },
  nextMeasure: {
    label: "Next measure",
    keybinds: [
      {key: "PageDown", mods: []},
			{key: "'", mods: []}
		],
    disabled: (app) => !app.chartManager.chartView,
    callback: (app) =>  {
      let beat = app.chartManager.getBeat()
      let snapped = Math.floor(beat/4)*4 + 4
      app.chartManager.setBeat(Math.max(0,snapped))
    }
  },
  previousNote: {
    label: "Previous note",
    keybinds: [
			{key: ",", mods: []}
		],
    disabled: (app) => !app.chartManager.chartView,
    callback: (app) => app.chartManager.previousNote()
  },
  nextNote: {
    label: "Next note",
    keybinds: [
			{key: ".", mods: []}
		],
    disabled: (app) => !app.chartManager.chartView,
    callback: (app) => app.chartManager.nextNote()
  },
  jumpChartStart: {
    label: "Jump to first note",
    keybinds: [
			{key: "Home", mods: []}
		],
    disabled: (app) => !app.chartManager.chartView,
    callback: (app) => app.chartManager.firstNote()
  },
  jumpChartEnd: {
    label: "Jump to last note",
    keybinds: [
			{key: "End", mods: []}
		],
    disabled: (app) => !app.chartManager.chartView,
    callback: (app) => app.chartManager.lastNote()
  },
  jumpSongStart: {
    label: "Jump to song start",
    keybinds: [
			{key: "Home", mods: [Modifier.SHIFT]}
		],
    disabled: (app) => !app.chartManager.chartView,
    callback: (app) => app.chartManager.setBeat(app.chartManager.chart!.getBeat(0))
  },
  jumpSongEnd: {
    label: "Jump to song end",
    keybinds: [
			{key: "End", mods: [Modifier.SHIFT]}
		],
    disabled: (app) => !app.chartManager.chartView,
    callback: (app) => app.chartManager.setBeat(app.chartManager.chart!.getBeat(app.chartManager.songAudio.getSongLength()))
  },
  assistTick: {
    label: "Assist Tick",
    keybinds: [
			{key: "F7", mods: []}
		],
    disabled: false,
    callback: (app) => app.options.audio.assistTick = !app.options.audio.assistTick
  },
  metronome: {
    label: "Metronome",
    keybinds: [
			{key: "F7", mods: [Modifier.ALT]}
		],
    disabled: false,
    callback: (app) => app.options.audio.metronome = !app.options.audio.metronome
  },
  renderWaveform: {
    label: "Render waveform",
    keybinds: [
			{key: "W", mods: [Modifier.SHIFT, Modifier.ALT]}
		],
    disabled: false,
    callback: (app) => app.options.waveform.enabled = !app.options.waveform.enabled
  },
  waveformOptions: {
    label: "Waveform options...",
    keybinds: [],
    disabled: true,
    callback: () => 0
  },
  XMod: {
    label: "XMod (Beat-based)",
    keybinds: [
			{key: "X", mods: [Modifier.SHIFT]}
		],
    disabled: false,
    callback: (app) => app.options.chart.CMod = false
  },
  CMod: {
    label: "CMod (Time-based)",
    keybinds: [
			{key: "C", mods: [Modifier.SHIFT]}
		],
    disabled: false,
    callback: (app) => app.options.chart.CMod = true
  },
  hideWarpedArrows: {
    label: "Hide warped arrows (CMod only)",
    keybinds: [
			{key: "W", mods: [Modifier.SHIFT]}
		],
    disabled: false,
    callback: (app) => app.options.chart.hideWarpedArrows = !app.options.chart.hideWarpedArrows
  },
  doSpeedChanges: {
    label: "Do speed changes (XMod only)",
    keybinds: [
			{key: "S", mods: [Modifier.SHIFT]}
		],
    disabled: false,
    callback: (app) => app.options.chart.doSpeedChanges = !app.options.chart.doSpeedChanges
  },
  jumpBeat: {
    label: "Jump to beat...",
    keybinds: [],
    disabled: true,
    callback: () => {}
  },
  showEq: {
    label: "Equalizer",
    keybinds: [
			{key: "E", mods: [Modifier.SHIFT, Modifier.ALT]}
		],
    disabled: (app) => !app.chartManager.songAudio,
    callback: (app) => app.windowManager.openWindow(new EQWindow(app))
  },
  previousNoteType: {
    label: "Previous note type",
    keybinds: [
			{key: "N", mods: []}
		],
    disabled: (app) => !app.chartManager.chartView,
    callback: (app) => app.chartManager.previousNoteType()
  },
  nextNoteType: {
    label: "Next Note Type",
    keybinds: [
			{key: "M", mods: []}
		],
    disabled: (app) => !app.chartManager.chartView,
    callback: (app) => app.chartManager.nextNoteType()
  },
}