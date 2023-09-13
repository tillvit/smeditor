import { App } from "../App"
import { EditMode } from "../chart/ChartManager"
import { isHoldNote } from "../chart/sm/NoteTypes"
import { WaterfallManager } from "../gui/element/WaterfallManager"
import { ChartListWindow } from "../gui/window/ChartListWindow"
import { DirectoryWindow } from "../gui/window/DirectoryWindow"
import { EQWindow } from "../gui/window/EQWindow"
import { ExportNotedataWindow } from "../gui/window/ExportNotedataWindow"
import { GameplayKeybindWindow } from "../gui/window/GameplayKeybindWindow"
import { KeybindWindow } from "../gui/window/KeybindWindow"
import { NewSongWindow } from "../gui/window/NewSongWindow"
import { OffsetWindow } from "../gui/window/OffsetWindow"
import { SMPropertiesWindow } from "../gui/window/SMPropertiesWindow"
import { TimingDataWindow } from "../gui/window/TimingDataWindow"
import { UserOptionsWindow } from "../gui/window/UserOptionsWindow"
import { ActionHistory } from "../util/ActionHistory"
import { FileHandler } from "../util/file-handler/FileHandler"
import { WebFileHandler } from "../util/file-handler/WebFileHandler"
import { roundDigit } from "../util/Math"
import { Options } from "../util/Options"

export interface Keybind {
  label: string
  bindLabel?: string
  combos: KeyCombo[]
  disabled: boolean | ((app: App) => boolean)
  disableRepeat?: boolean
  preventDefault?: boolean
  callback: (app: App) => void
  callbackKeyUp?: (app: App) => void
}

export interface KeyCombo {
  key: string
  mods: Modifier[]
}

export enum Modifier {
  SHIFT = "Shift",
  CTRL = "Ctrl",
  ALT = "Alt",
  META = "Command",
}

export const IS_OSX: boolean = navigator.userAgent.indexOf("Mac OS X") > -1
export const DEF_MOD: Modifier = IS_OSX ? Modifier.META : Modifier.CTRL

export const MODIFIER_ASCII: { [key: string]: string } = {
  Shift: IS_OSX ? "⇧" : "Shift",
  Ctrl: IS_OSX ? "⌃" : "Ctrl",
  Alt: IS_OSX ? "⌥" : "Alt",
  Command: "⌘",
}

export const SPECIAL_KEYS: { [key: string]: string } = {
  ArrowLeft: "Left",
  ArrowUp: "Up",
  ArrowRight: "Right",
  ArrowDown: "Down",

  BracketLeft: "[",
  BracketRight: "]",
  Semicolon: ";",
  Quote: "'",
  Backslash: "\\",
  Slash: "/",
  Period: ".",
  Comma: ",",
  Backquote: "`",
  Minus: "-",
  Equal: "+",
}

export const MODPROPS: ["ctrlKey", "altKey", "shiftKey", "metaKey"] = [
  "ctrlKey",
  "altKey",
  "shiftKey",
  "metaKey",
]
export const MODORDER = [
  Modifier.CTRL,
  Modifier.ALT,
  Modifier.SHIFT,
  Modifier.META,
]

export const KEYBIND_DATA: { [key: string]: Keybind } = {
  playback: {
    label: "Play/Pause",
    combos: [{ key: "Space", mods: [] }],
    disabled: app =>
      !app.chartManager.chartView ||
      app.chartManager.getMode() == EditMode.Play ||
      app.chartManager.getMode() == EditMode.Record,
    callback: app => app.chartManager.playPause(),
  },
  decreaseSnap: {
    label: "Decrease snap",
    combos: [{ key: "Left", mods: [] }],
    disabled: app =>
      !app.chartManager.chartView ||
      app.chartManager.getMode() == EditMode.Play ||
      app.chartManager.getMode() == EditMode.Record,
    callback: app => app.chartManager.previousSnap(),
  },
  increaseSnap: {
    label: "Increase snap",
    combos: [{ key: "Right", mods: [] }],
    disabled: app =>
      !app.chartManager.chartView ||
      app.chartManager.getMode() == EditMode.Play ||
      app.chartManager.getMode() == EditMode.Record,
    callback: app => app.chartManager.nextSnap(),
  },
  cursorUp: {
    label: "Move cursor up",
    combos: [{ key: "Up", mods: [] }],
    disabled: app =>
      !app.chartManager.chartView ||
      app.chartManager.getMode() == EditMode.Play ||
      app.chartManager.getMode() == EditMode.Record,
    callback: app => {
      const snap = Math.max(0.001, Options.chart.snap)
      const closestTick = Math.round(app.chartManager.getBeat() / snap) * snap
      const change =
        Math.abs(closestTick - app.chartManager.getBeat()) < 0.0005
          ? snap
          : snap / 2
      app.chartManager.setAndSnapBeat(app.chartManager.getBeat() - change)
    },
  },
  cursorDown: {
    label: "Move cursor down",
    combos: [{ key: "Down", mods: [] }],
    disabled: app =>
      !app.chartManager.chartView ||
      app.chartManager.getMode() == EditMode.Play ||
      app.chartManager.getMode() == EditMode.Record,
    callback: app => {
      const snap = Math.max(0.001, Options.chart.snap)
      const closestTick = Math.round(app.chartManager.getBeat() / snap) * snap
      const change =
        Math.abs(closestTick - app.chartManager.getBeat()) < 0.0005
          ? snap
          : snap / 2
      app.chartManager.setAndSnapBeat(app.chartManager.getBeat() + change)
    },
  },
  increaseScrollSpeed: {
    label: "Increase scroll speed",
    combos: [{ key: "Up", mods: [DEF_MOD] }],
    disabled: app => !app.chartManager.chartView,
    callback: () =>
      (Options.chart.speed = Math.max(
        10,
        Options.chart.speed * Math.pow(1.01, 30)
      )),
  },
  decreaseScrollSpeed: {
    label: "Decrease scroll speed",
    combos: [{ key: "Down", mods: [DEF_MOD] }],
    disabled: app => !app.chartManager.chartView,
    callback: () =>
      (Options.chart.speed = Math.max(
        10,
        Options.chart.speed * Math.pow(1.01, -30)
      )),
  },
  zoomIn: {
    label: "Zoom in",
    combos: [{ key: "+", mods: [DEF_MOD] }],
    disabled: app => !app.chartManager.chartView,
    callback: () => {
      Options.chart.zoom += 0.1
      WaterfallManager.create(
        "Zoom: " + Math.round(Options.chart.zoom * 100) + "%"
      )
    },
  },
  zoomOut: {
    label: "Zoom out",
    combos: [{ key: "-", mods: [DEF_MOD] }],
    disabled: app => !app.chartManager.chartView,
    callback: () => {
      Options.chart.zoom = Math.max(0.1, Options.chart.zoom - 0.1)
      WaterfallManager.create(
        "Zoom: " + Math.round(Options.chart.zoom * 100) + "%"
      )
    },
  },
  zoomDefault: {
    label: "Reset zoom",
    combos: [{ key: "0", mods: [DEF_MOD] }],
    disabled: app => !app.chartManager.chartView,
    callback: () => {
      Options.chart.zoom = 1
      WaterfallManager.create(
        "Zoom: " + Math.round(Options.chart.zoom * 100) + "%"
      )
    },
  },
  newSong: {
    label: "New song...",
    bindLabel: "New song",
    combos: [{ key: "N", mods: [DEF_MOD] }],
    disabled: app => !app.chartManager.loadedSM,
    callback: app => {
      app.windowManager.openWindow(new NewSongWindow(app))
    },
  },
  openSong: {
    label: "Open song...",
    bindLabel: "Open song",
    combos: [{ key: "O", mods: [DEF_MOD] }],
    disabled: app => !app.chartManager.loadedSM,
    callback: app => {
      if (window.nw) {
        const fileSelector = document.createElement("input")
        fileSelector.type = "file"
        fileSelector.accept = ".sm,.ssc"
        fileSelector.onchange = () => {
          app.chartManager.loadSM(fileSelector.value)
        }
        fileSelector.click()
      } else {
        app.windowManager.openWindow(
          new DirectoryWindow(app, {
            title: "Select an sm/ssc file...",
            accepted_file_types: [".sm", ".ssc"],
            disableClose: true,
            callback: (path: string) => {
              app.chartManager.loadSM(path)
            },
          })
        )
      }
    },
  },
  songProperties: {
    label: "Song properties...",
    bindLabel: "Open song properties",
    combos: [{ key: "O", mods: [Modifier.SHIFT] }],
    disabled: app => !app.chartManager.loadedSM,
    callback: app => app.windowManager.openWindow(new SMPropertiesWindow(app)),
  },
  save: {
    label: "Save...",
    bindLabel: "Save",
    combos: [{ key: "S", mods: [DEF_MOD] }],
    disabled: app => !app.chartManager.loadedSM,
    callback: app => app.chartManager.save(),
  },
  export: {
    label: "Save and export current song",
    combos: [{ key: "E", mods: [DEF_MOD] }],
    disabled: app => !!window.nw || !app.chartManager.loadedSM,
    callback: app => {
      app.chartManager.save()
      ;(FileHandler as WebFileHandler).saveDirectory(app.chartManager.smPath)
    },
  },
  exportNotedata: {
    label: "Export to notedata...",
    bindLabel: "Export to notedata",
    combos: [{ key: "E", mods: [DEF_MOD, Modifier.SHIFT] }],
    disabled: app => !!window.nw || !app.chartManager.loadedSM,
    callback: app =>
      app.windowManager.openWindow(
        new ExportNotedataWindow(app, app.chartManager.selection.notes)
      ),
  },
  openChart: {
    label: "Chart list",
    bindLabel: "Open chart list",
    combos: [{ key: "O", mods: [DEF_MOD, Modifier.SHIFT] }],
    disabled: app => !app.chartManager.loadedSM,
    callback: app => app.windowManager.openWindow(new ChartListWindow(app)),
  },
  timingDataRow: {
    label: "Edit timing data at row",
    combos: [{ key: "T", mods: [Modifier.SHIFT] }],
    disabled: app => !app.chartManager.chartView,
    callback: app => app.windowManager.openWindow(new TimingDataWindow(app)),
  },
  selectRegion: {
    label: "Select region",
    combos: [{ key: "Tab", mods: [] }],
    disabled: app => !app.chartManager.loadedChart,
    callback: app => app.chartManager.selectRegion(),
  },
  volumeUp: {
    label: "Increase master volume",
    combos: [{ key: "Up", mods: [Modifier.SHIFT] }],
    disabled: false,
    callback: () => {
      Options.audio.masterVolume = Math.min(
        Options.audio.masterVolume + 0.05,
        1
      )
      WaterfallManager.create(
        "Master volume: " + Math.round(Options.audio.masterVolume * 100) + "%"
      )
    },
  },
  volumeDown: {
    label: "Decrease master volume",
    combos: [{ key: "Down", mods: [Modifier.SHIFT] }],
    disabled: false,
    callback: () => {
      Options.audio.masterVolume = Math.max(
        Options.audio.masterVolume - 0.05,
        0
      )
      WaterfallManager.create(
        "Master volume: " + Math.round(Options.audio.masterVolume * 100) + "%"
      )
    },
  },
  songVolumeUp: {
    label: "Increase song volume",
    combos: [{ key: "Up", mods: [Modifier.SHIFT, DEF_MOD] }],
    disabled: false,
    callback: () => {
      Options.audio.songVolume = Math.min(Options.audio.songVolume + 0.05, 1)
      WaterfallManager.create(
        "Song volume: " + Math.round(Options.audio.songVolume * 100) + "%"
      )
    },
  },
  songVolumeDown: {
    label: "Decrease song volume",
    combos: [{ key: "Down", mods: [Modifier.SHIFT, DEF_MOD] }],
    disabled: false,
    callback: () => {
      Options.audio.songVolume = Math.max(Options.audio.songVolume - 0.05, 0)
      WaterfallManager.create(
        "Song volume: " + Math.round(Options.audio.songVolume * 100) + "%"
      )
    },
  },
  effectvolumeUp: {
    label: "Increase tick/metronome volume",
    combos: [{ key: "Up", mods: [Modifier.SHIFT, DEF_MOD, Modifier.ALT] }],
    disabled: false,
    callback: () => {
      Options.audio.soundEffectVolume = Math.min(
        Options.audio.soundEffectVolume + 0.05,
        1
      )
      WaterfallManager.create(
        "Effect volume: " +
          Math.round(Options.audio.soundEffectVolume * 100) +
          "%"
      )
    },
  },
  effectvolumeDown: {
    label: "Decrease tick/metronome volume",
    combos: [{ key: "Down", mods: [Modifier.SHIFT, DEF_MOD, Modifier.ALT] }],
    disabled: false,
    callback: () => {
      Options.audio.soundEffectVolume = Math.max(
        Options.audio.soundEffectVolume - 0.05,
        0
      )
      WaterfallManager.create(
        "Effect Volume: " +
          Math.round(Options.audio.soundEffectVolume * 100) +
          "%"
      )
    },
  },
  rateUp: {
    label: "Increase playback rate",
    combos: [{ key: "Right", mods: [Modifier.SHIFT] }],
    disabled: app =>
      app.chartManager.getMode() == EditMode.Play ||
      app.chartManager.getMode() == EditMode.Record,
    callback: () => {
      Options.audio.rate += 0.05
      WaterfallManager.create(
        "Playback Rate: " + Math.round(Options.audio.rate * 100) + "%"
      )
    },
  },
  rateDown: {
    label: "Decrease playback rate",
    combos: [{ key: "Left", mods: [Modifier.SHIFT] }],
    disabled: app =>
      app.chartManager.getMode() == EditMode.Play ||
      app.chartManager.getMode() == EditMode.Record,
    callback: () => {
      Options.audio.rate = Math.max(Options.audio.rate - 0.05, 0.1)
      WaterfallManager.create(
        "Playback Rate: " + Math.round(Options.audio.rate * 100) + "%"
      )
    },
  },
  rateDefault: {
    label: "Reset playback rate",
    combos: [],
    disabled: false,
    callback: () => {
      Options.audio.rate = 1
      WaterfallManager.create(
        "Playback Rate: " + Math.round(Options.audio.rate) + "%"
      )
    },
  },
  previousMeasure: {
    label: "Previous measure",
    combos: [
      { key: "PageUp", mods: [] },
      { key: ";", mods: [] },
    ],
    disabled: app =>
      !app.chartManager.chartView ||
      app.chartManager.getMode() == EditMode.Play ||
      app.chartManager.getMode() == EditMode.Record,
    callback: app => {
      const beat = app.chartManager.getBeat()
      const measureLength =
        app.chartManager.loadedChart!.timingData.getMeasureLength(beat - 0.001)
      app.chartManager.setAndSnapBeat(Math.max(0, beat - measureLength))
    },
  },
  nextMeasure: {
    label: "Next measure",
    combos: [
      { key: "PageDown", mods: [] },
      { key: "'", mods: [] },
    ],
    disabled: app =>
      !app.chartManager.chartView ||
      app.chartManager.getMode() == EditMode.Play ||
      app.chartManager.getMode() == EditMode.Record,
    callback: app => {
      const beat = app.chartManager.getBeat()
      const measureLength =
        app.chartManager.loadedChart!.timingData.getMeasureLength(beat)
      app.chartManager.setAndSnapBeat(Math.max(0, beat + measureLength))
    },
  },
  previousNote: {
    label: "Previous note",
    combos: [{ key: ",", mods: [] }],
    disabled: app =>
      !app.chartManager.chartView ||
      app.chartManager.getMode() == EditMode.Play ||
      app.chartManager.getMode() == EditMode.Record,
    callback: app => app.chartManager.previousNote(),
  },
  nextNote: {
    label: "Next note",
    combos: [{ key: ".", mods: [] }],
    disabled: app =>
      !app.chartManager.chartView ||
      app.chartManager.getMode() == EditMode.Play ||
      app.chartManager.getMode() == EditMode.Record,
    callback: app => app.chartManager.nextNote(),
  },
  jumpChartStart: {
    label: "Jump to first note",
    combos: [{ key: "Home", mods: [] }],
    disabled: app =>
      !app.chartManager.chartView ||
      app.chartManager.getMode() == EditMode.Play ||
      app.chartManager.getMode() == EditMode.Record,
    callback: app => app.chartManager.firstNote(),
  },
  jumpChartEnd: {
    label: "Jump to last note",
    combos: [{ key: "End", mods: [] }],
    disabled: app =>
      !app.chartManager.chartView ||
      app.chartManager.getMode() == EditMode.Play ||
      app.chartManager.getMode() == EditMode.Record,
    callback: app => app.chartManager.lastNote(),
  },
  jumpSongStart: {
    label: "Jump to song start",
    combos: [{ key: "Home", mods: [Modifier.SHIFT] }],
    disabled: app =>
      !app.chartManager.chartView ||
      app.chartManager.getMode() == EditMode.Play ||
      app.chartManager.getMode() == EditMode.Record,
    callback: app =>
      app.chartManager.setBeat(
        Math.max(0, app.chartManager.loadedChart!.getBeatFromSeconds(0))
      ),
  },
  jumpSongEnd: {
    label: "Jump to song end",
    combos: [{ key: "End", mods: [Modifier.SHIFT] }],
    disabled: app =>
      !app.chartManager.chartView ||
      app.chartManager.getMode() == EditMode.Play ||
      app.chartManager.getMode() == EditMode.Record,
    callback: app =>
      app.chartManager.setBeat(
        app.chartManager.loadedChart!.getBeatFromSeconds(
          app.chartManager.chartAudio.getSongLength()
        )
      ),
  },
  assistTick: {
    label: "Assist tick",
    combos: [{ key: "F7", mods: [] }],
    disabled: false,
    callback: () => {
      Options.audio.assistTick = !Options.audio.assistTick
      WaterfallManager.create(
        "Assist Tick: " + (Options.audio.assistTick ? "on" : "off")
      )
    },
  },
  metronome: {
    label: "Metronome",
    combos: [{ key: "F7", mods: [Modifier.ALT] }],
    disabled: false,
    callback: () => {
      Options.audio.metronome = !Options.audio.metronome
      WaterfallManager.create(
        "Metronome: " + (Options.audio.metronome ? "on" : "off")
      )
    },
  },
  renderWaveform: {
    label: "Render waveform",
    combos: [],
    disabled: false,
    callback: () => {
      Options.chart.waveform.enabled = !Options.chart.waveform.enabled
      WaterfallManager.create(
        "Waveform: " + (Options.chart.waveform.enabled ? "on" : "off")
      )
    },
  },
  waveformOptions: {
    label: "Waveform options...",
    bindLabel: "Waveform options",
    combos: [],
    disabled: true,
    callback: () => 0,
  },
  XMod: {
    label: "XMod (Beat-based)",
    combos: [{ key: "X", mods: [Modifier.SHIFT] }],
    disabled: false,
    callback: () => {
      Options.chart.CMod = false
      WaterfallManager.create("Switched to XMod")
    },
  },
  CMod: {
    label: "CMod (Time-based)",
    combos: [{ key: "C", mods: [Modifier.SHIFT] }],
    disabled: false,
    callback: () => {
      Options.chart.CMod = true
      WaterfallManager.create("Switched to CMod")
    },
  },
  hideWarpedArrows: {
    label: "Hide warped arrows (CMod only)",
    combos: [{ key: "W", mods: [Modifier.SHIFT] }],
    disabled: false,
    callback: () => {
      Options.chart.hideWarpedArrows = !Options.chart.hideWarpedArrows
      WaterfallManager.create(
        "Hide Warped Arrows: " + (Options.chart.hideWarpedArrows ? "on" : "off")
      )
    },
  },
  doSpeedChanges: {
    label: "Do speed changes (XMod only)",
    combos: [{ key: "S", mods: [Modifier.SHIFT] }],
    disabled: false,
    callback: () => {
      Options.chart.doSpeedChanges = !Options.chart.doSpeedChanges
      WaterfallManager.create(
        "Speed Changes: " + (Options.chart.doSpeedChanges ? "on" : "off")
      )
    },
  },
  showEq: {
    label: "Equalizer",
    combos: [{ key: "E", mods: [Modifier.SHIFT] }],
    disabled: app => !app.chartManager.chartAudio,
    callback: app => app.windowManager.openWindow(new EQWindow(app)),
  },
  previousNoteType: {
    label: "Previous note type",
    combos: [{ key: "N", mods: [] }],
    disabled: app =>
      !app.chartManager.chartView ||
      app.chartManager.getMode() == EditMode.Play ||
      app.chartManager.getMode() == EditMode.Record,
    callback: app => app.chartManager.previousNoteType(),
  },
  nextNoteType: {
    label: "Next note type",
    combos: [{ key: "M", mods: [] }],
    disabled: app =>
      !app.chartManager.chartView ||
      app.chartManager.getMode() == EditMode.Play ||
      app.chartManager.getMode() == EditMode.Record,
    callback: app => app.chartManager.nextNoteType(),
  },
  undo: {
    label: "Undo",
    combos: [{ key: "Z", mods: [DEF_MOD] }],
    disabled: app =>
      !app.actionHistory.canUndo() ||
      app.chartManager.getMode() != EditMode.Edit,
    callback: app => app.actionHistory.undo(),
  },
  redo: {
    label: "Redo",
    combos: [{ key: "Y", mods: [DEF_MOD] }],
    disabled: app =>
      !app.actionHistory.canRedo() ||
      app.chartManager.getMode() != EditMode.Edit,
    callback: app => app.actionHistory.redo(),
  },
  mousePlacement: {
    label: "Enable Mouse Note Placement",
    combos: [{ key: "M", mods: [Modifier.SHIFT] }],
    disabled: false,
    callback: () => {
      Options.general.mousePlacement = !Options.general.mousePlacement
      WaterfallManager.create(
        "Mouse Note Placement: " +
          (Options.general.mousePlacement ? "on" : "off")
      )
    },
  },
  playMode: {
    label: "Enter/Exit Play Mode",
    combos: [{ key: "P", mods: [] }],
    disabled: app =>
      !app.chartManager.chartView ||
      app.chartManager.getMode() == EditMode.Record,
    callback: app => app.chartManager.setMode(EditMode.Play),
  },
  recordMode: {
    label: "Enter/Exit Record Mode",
    combos: [{ key: "R", mods: [] }],
    disabled: app =>
      !app.chartManager.chartView ||
      app.chartManager.getMode() == EditMode.Play,
    callback: app => app.chartManager.setMode(EditMode.Record),
  },
  playModeStart: {
    label: "Play from start",
    combos: [{ key: "P", mods: [Modifier.SHIFT] }],
    disabled: app =>
      !app.chartManager.chartView ||
      app.chartManager.getMode() == EditMode.Record,
    callback: app => {
      app.chartManager.setBeat(0)
      app.chartManager.setMode(EditMode.Play)
    },
  },
  recordModeStart: {
    label: "Record from start",
    combos: [{ key: "R", mods: [Modifier.SHIFT] }],
    disabled: app =>
      !app.chartManager.chartView ||
      app.chartManager.getMode() == EditMode.Play,
    callback: app => app.chartManager.setMode(EditMode.Record),
  },
  options: {
    label: "Options...",
    bindLabel: "Edit options",
    combos: [{ key: ",", mods: [DEF_MOD] }],
    disabled: false,
    callback: app => {
      app.windowManager.openWindow(new UserOptionsWindow(app))
    },
  },
  keybinds: {
    label: "Keybinds...",
    bindLabel: "Edit keybinds",
    combos: [],
    disabled: false,
    callback: app => {
      app.windowManager.openWindow(new KeybindWindow(app))
    },
  },
  gameplayKeybinds: {
    label: "Gameplay keybinds...",
    bindLabel: "Edit gameplay keybinds",
    combos: [],
    disabled: false,
    callback: app => {
      app.windowManager.openWindow(new GameplayKeybindWindow(app))
    },
  },
  convertHoldsRolls: {
    label: "Holds to rolls",
    bindLabel: "Convert holds to rolls",
    combos: [],
    disabled: app =>
      app.chartManager.selection.notes.length == 0 ||
      app.chartManager.getMode() != EditMode.Edit,
    callback: app => {
      app.chartManager.modifySelection(note => {
        if (note.type == "Hold") note.type = "Roll"
        return note
      })
    },
  },
  convertHoldsTaps: {
    label: "Holds/rolls to taps",
    bindLabel: "Convert holds/rolls to taps",
    combos: [],
    disabled: app =>
      app.chartManager.selection.notes.length == 0 ||
      app.chartManager.getMode() != EditMode.Edit,
    callback: app => {
      app.chartManager.modifySelection(note => {
        if (note.type == "Hold" || note.type == "Roll") note.type = "Tap"
        return note
      })
    },
  },
  convertNotesMines: {
    label: "Notes to mines",
    bindLabel: "Convert notes to mines",
    combos: [],
    disabled: app =>
      app.chartManager.selection.notes.length == 0 ||
      app.chartManager.getMode() != EditMode.Edit,
    callback: app => {
      app.chartManager.modifySelection(note => {
        note.type = "Mine"
        return note
      })
    },
  },
  convertTapsFakes: {
    label: "Taps to fakes",
    bindLabel: "Convert taps to fakes",
    combos: [],
    disabled: app =>
      app.chartManager.selection.notes.length == 0 ||
      app.chartManager.getMode() != EditMode.Edit,
    callback: app => {
      app.chartManager.modifySelection(note => {
        if (note.type == "Tap") note.type = "Fake"
        return note
      })
    },
  },
  mirrorHorizontally: {
    label: "Horizontally",
    bindLabel: "Mirror horizontally",
    combos: [],
    disabled: app =>
      app.chartManager.selection.notes.length == 0 ||
      app.chartManager.getMode() != EditMode.Edit,
    callback: app => {
      app.chartManager.modifySelection(note => {
        note.col =
          app.chartManager.loadedChart!.gameType.flipColumns.horizontal[
            note.col
          ]
        return note
      })
    },
  },
  mirrorVertically: {
    label: "Vertically",
    bindLabel: "Mirror vertically",
    combos: [],
    disabled: app =>
      app.chartManager.selection.notes.length == 0 ||
      app.chartManager.getMode() != EditMode.Edit,
    callback: app => {
      app.chartManager.modifySelection(note => {
        note.col =
          app.chartManager.loadedChart!.gameType.flipColumns.vertical[note.col]
        return note
      })
    },
  },
  mirrorBoth: {
    label: "Both",
    bindLabel: "Mirror both",
    combos: [],
    disabled: app =>
      app.chartManager.selection.notes.length == 0 ||
      app.chartManager.getMode() != EditMode.Edit,
    callback: app => {
      app.chartManager.modifySelection(note => {
        note.col =
          app.chartManager.loadedChart!.gameType.flipColumns.horizontal[
            note.col
          ]
        note.col =
          app.chartManager.loadedChart!.gameType.flipColumns.vertical[note.col]
        return note
      })
    },
  },
  selectAll: {
    label: "Select all",
    combos: [{ key: "A", mods: [DEF_MOD] }],
    disabled: app => !app.chartManager.loadedChart,
    callback: app => {
      app.chartManager.selection.notes = [
        ...app.chartManager.loadedChart!.getNotedata(),
      ]
    },
  },
  expand2to1: {
    label: "Expand 2:1 (8th to 4th)",
    combos: [],
    disabled: app =>
      app.chartManager.selection.notes.length < 2 ||
      app.chartManager.getMode() != EditMode.Edit,
    callback: app => {
      const baseBeat = Math.min(
        ...app.chartManager.selection.notes.map(note => note.beat)
      )
      app.chartManager.modifySelection(note => {
        note.beat = (note.beat - baseBeat) * 2 + baseBeat
        note.beat = Math.round(note.beat * 48) / 48
        if (isHoldNote(note)) {
          note.hold *= 2
          note.hold = Math.round(note.hold * 48) / 48
        }
        return note
      })
    },
  },
  expand3to2: {
    label: "Expand 3:2 (12th to 8th)",
    combos: [],
    disabled: app =>
      app.chartManager.selection.notes.length < 2 ||
      app.chartManager.getMode() != EditMode.Edit,
    callback: app => {
      const baseBeat = Math.min(
        ...app.chartManager.selection.notes.map(note => note.beat)
      )
      app.chartManager.modifySelection(note => {
        note.beat = (note.beat - baseBeat) * 1.5 + baseBeat
        note.beat = Math.round(note.beat * 48) / 48
        if (isHoldNote(note)) {
          note.hold *= 1.5
          note.hold = Math.round(note.hold * 48) / 48
        }
        return note
      })
    },
  },
  expand4to3: {
    label: "Expand 4:3 (16th to 2th)",
    combos: [],
    disabled: app =>
      app.chartManager.selection.notes.length < 2 ||
      app.chartManager.getMode() != EditMode.Edit,
    callback: app => {
      const baseBeat = Math.min(
        ...app.chartManager.selection.notes.map(note => note.beat)
      )
      app.chartManager.modifySelection(note => {
        note.beat = ((note.beat - baseBeat) * 4) / 3 + baseBeat
        note.beat = Math.round(note.beat * 48) / 48
        if (isHoldNote(note)) {
          note.hold *= 4 / 3
          note.hold = Math.round(note.hold * 48) / 48
        }
        return note
      })
    },
  },
  compress1to2: {
    label: "Compress 1:2 (4th to 8th)",
    combos: [],
    disabled: app =>
      app.chartManager.selection.notes.length < 2 ||
      app.chartManager.getMode() != EditMode.Edit,
    callback: app => {
      const baseBeat = Math.min(
        ...app.chartManager.selection.notes.map(note => note.beat)
      )
      app.chartManager.modifySelection(note => {
        note.beat = (note.beat - baseBeat) / 2 + baseBeat
        note.beat = Math.round(note.beat * 48) / 48
        if (isHoldNote(note)) {
          note.hold /= 2
          note.hold = Math.round(note.hold * 48) / 48
        }
        return note
      })
    },
  },
  compress2to3: {
    label: "Compress 2:3 (8th to 12th)",
    combos: [],
    disabled: app =>
      app.chartManager.selection.notes.length < 2 ||
      app.chartManager.getMode() != EditMode.Edit,
    callback: app => {
      const baseBeat = Math.min(
        ...app.chartManager.selection.notes.map(note => note.beat)
      )
      app.chartManager.modifySelection(note => {
        note.beat = (note.beat - baseBeat) / 1.5 + baseBeat
        note.beat = Math.round(note.beat * 48) / 48
        if (isHoldNote(note)) {
          note.hold /= 1.5
          note.hold = Math.round(note.hold * 48) / 48
        }
        return note
      })
    },
  },
  compress3to4: {
    label: "Compress 3:4 (12th to 16th)",
    combos: [],
    disabled: app =>
      app.chartManager.selection.notes.length < 2 ||
      app.chartManager.getMode() != EditMode.Edit,
    callback: app => {
      const baseBeat = Math.min(
        ...app.chartManager.selection.notes.map(note => note.beat)
      )
      app.chartManager.modifySelection(note => {
        note.beat = (note.beat - baseBeat) * 0.75 + baseBeat
        note.beat = Math.round(note.beat * 48) / 48
        if (isHoldNote(note)) {
          note.hold *= 0.75
          note.hold = Math.round(note.hold * 48) / 48
        }
        return note
      })
    },
  },
  delete: {
    label: "Delete",
    combos: [
      { key: "Backspace", mods: [] },
      { key: "Delete", mods: [] },
    ],
    disabled: app =>
      app.chartManager.getMode() != EditMode.Edit ||
      (app.chartManager.selection.notes.length == 0 &&
        app.chartManager.eventSelection.timingEvents.length == 0),
    callback: app => {
      app.chartManager.deleteSelection()
      app.chartManager.deleteEventSelection()
    },
  },
  paste: {
    label: "Paste",
    combos: [],
    disabled: app =>
      !app.chartManager.chartView ||
      app.chartManager.getMode() != EditMode.Edit,
    callback: async app => {
      const data = await navigator.clipboard.readText()
      app.chartManager.paste(data)
    },
  },
  copy: {
    label: "Copy",
    combos: [],
    disabled: app =>
      !app.chartManager.chartView ||
      app.chartManager.getMode() != EditMode.Edit ||
      !app.chartManager.hasSelection(),
    callback: async app => {
      const data = app.chartManager.copy()
      if (data) await navigator.clipboard.writeText(data)
    },
  },
  cut: {
    label: "Cut",
    combos: [],
    disabled: app =>
      !app.chartManager.chartView ||
      app.chartManager.getMode() != EditMode.Edit ||
      !app.chartManager.hasSelection(),
    callback: async app => {
      const data = app.chartManager.copy()
      if (data) await navigator.clipboard.writeText(data)
      app.chartManager.deleteSelection()
    },
  },
  adjustOffset: {
    label: "Adjust offset",
    combos: [],
    disabled: false,
    callback: app => app.windowManager.openWindow(new OffsetWindow(app)),
  },
  setSongPreview: {
    label: "Set as song preview",
    combos: [],
    disabled: app =>
      !app.chartManager.chartView ||
      app.chartManager.getMode() != EditMode.Edit ||
      !app.chartManager.hasRange(),
    callback: app => {
      const chart = app.chartManager.loadedChart!
      const lastStart = app.chartManager.loadedSM!.properties.SAMPLESTART ?? "0"
      const lastLength =
        app.chartManager.loadedSM!.properties.SAMPLELENGTH ?? "10"

      //Try using the region
      if (
        app.chartManager.startRegion !== undefined &&
        app.chartManager.endRegion !== undefined
      ) {
        const startSec = chart.getSecondsFromBeat(app.chartManager.startRegion)
        const endSec = chart.getSecondsFromBeat(app.chartManager.endRegion)
        const newStart = roundDigit(startSec, 3).toString()
        const newLength = roundDigit(endSec - startSec, 3).toString()
        ActionHistory.instance.run({
          action: app => {
            app.chartManager.loadedSM!.properties.SAMPLESTART = newStart
            app.chartManager.loadedSM!.properties.SAMPLELENGTH = newLength
          },
          undo: () => {
            app.chartManager.loadedSM!.properties.SAMPLESTART = lastStart
            app.chartManager.loadedSM!.properties.SAMPLELENGTH = lastLength
          },
        })
        return
      }

      //Use notes/events
      const selected =
        app.chartManager.selection.notes.length > 0
          ? app.chartManager.selection.notes
          : app.chartManager.eventSelection.timingEvents
      const beats = selected.map(item => item.beat!)
      const startSec = chart.getSecondsFromBeat(Math.min(...beats))
      const endSec = chart.getSecondsFromBeat(Math.max(...beats))
      const newStart = roundDigit(startSec, 3).toString()
      const newLength = roundDigit(endSec - startSec, 3).toString()
      ActionHistory.instance.run({
        action: app => {
          app.chartManager.loadedSM!.properties.SAMPLESTART = newStart
          app.chartManager.loadedSM!.properties.SAMPLELENGTH = newLength
        },
        undo: () => {
          app.chartManager.loadedSM!.properties.SAMPLESTART = lastStart
          app.chartManager.loadedSM!.properties.SAMPLELENGTH = lastLength
        },
      })
    },
  },
  showDebugTimers: {
    label: "Toggle Debug Timers",
    combos: [{ key: "F3", mods: [Modifier.SHIFT] }],
    disabled: false,
    callback: () => {
      Options.debug.showTimers = !Options.debug.showTimers
    },
  },
  showFPSCounter: {
    label: "Toggle FPS Counter",
    combos: [{ key: "F3", mods: [] }],
    disabled: false,
    callback: () => {
      Options.debug.showFPS = !Options.debug.showFPS
    },
  },
}
