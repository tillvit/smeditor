import { App } from "../App"
import { EditMode } from "../chart/ChartManager"
import { isHoldNote } from "../chart/sm/NoteTypes"
import { WaterfallManager } from "../gui/element/WaterfallManager"
import { FileHandler } from "../util/FileHandler"
import { Options } from "../util/Options"
import { ChartListWindow } from "../window/ChartListWindow"
import { DirectoryWindow } from "../window/DirectoryWindow"
import { EQWindow } from "../window/EQWindow"
import { SMPropertiesWindow } from "../window/SMPropertiesWindow"
import { TimingDataWindow } from "../window/TimingDataWindow"
import { UserOptionsWindow } from "../window/UserOptionsWindow"

export interface Keybind {
  label: string
  keybinds: KeyCombo[]
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

export const KEYBINDS: { [key: string]: Keybind } = {
  playback: {
    label: "Play/Pause",
    keybinds: [{ key: "Space", mods: [] }],
    disabled: app =>
      !app.chartManager.chartView ||
      app.chartManager.getMode() == EditMode.Play ||
      app.chartManager.getMode() == EditMode.Record,
    callback: app => app.chartManager.playPause(),
  },
  decreaseSnap: {
    label: "Decrease snap",
    keybinds: [{ key: "Left", mods: [] }],
    disabled: app =>
      !app.chartManager.chartView ||
      app.chartManager.getMode() == EditMode.Play ||
      app.chartManager.getMode() == EditMode.Record,
    callback: app => app.chartManager.previousSnap(),
  },
  increaseSnap: {
    label: "Increase snap",
    keybinds: [{ key: "Right", mods: [] }],
    disabled: app =>
      !app.chartManager.chartView ||
      app.chartManager.getMode() == EditMode.Play ||
      app.chartManager.getMode() == EditMode.Record,
    callback: app => app.chartManager.nextSnap(),
  },
  cursorUp: {
    label: "Move cursor up",
    keybinds: [{ key: "Up", mods: [] }],
    disabled: app =>
      !app.chartManager.chartView ||
      app.chartManager.getMode() == EditMode.Play ||
      app.chartManager.getMode() == EditMode.Record,
    callback: app =>
      app.chartManager.setAndSnapBeat(
        app.chartManager.getBeat() - Math.max(0.001, Options.chart.snap)
      ),
  },
  cursorDown: {
    label: "Move cursor down",
    keybinds: [{ key: "Down", mods: [] }],
    disabled: app =>
      !app.chartManager.chartView ||
      app.chartManager.getMode() == EditMode.Play ||
      app.chartManager.getMode() == EditMode.Record,
    callback: app =>
      app.chartManager.setAndSnapBeat(
        app.chartManager.getBeat() + Math.max(0.001, Options.chart.snap)
      ),
  },
  increaseScrollSpeed: {
    label: "Increase scroll speed",
    keybinds: [{ key: "Up", mods: [DEF_MOD] }],
    disabled: app => !app.chartManager.chartView,
    callback: () =>
      (Options.chart.speed = Math.max(
        10,
        Options.chart.speed * Math.pow(1.01, 30)
      )),
  },
  decreaseScrollSpeed: {
    label: "Decrease scroll speed",
    keybinds: [{ key: "Down", mods: [DEF_MOD] }],
    disabled: app => !app.chartManager.chartView,
    callback: () =>
      (Options.chart.speed = Math.max(
        10,
        Options.chart.speed * Math.pow(1.01, -30)
      )),
  },
  zoomIn: {
    label: "Zoom in",
    keybinds: [{ key: "+", mods: [DEF_MOD] }],
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
    keybinds: [{ key: "-", mods: [DEF_MOD] }],
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
    keybinds: [{ key: "0", mods: [DEF_MOD] }],
    disabled: app => !app.chartManager.chartView,
    callback: () => {
      Options.chart.zoom = 1
      WaterfallManager.create(
        "Zoom: " + Math.round(Options.chart.zoom * 100) + "%"
      )
    },
  },
  newSong: {
    label: "New Song...",
    keybinds: [{ key: "N", mods: [DEF_MOD] }],
    disabled: true,
    callback: () => 0,
  },
  openSong: {
    label: "Open Song...",
    keybinds: [{ key: "O", mods: [DEF_MOD] }],
    disabled: app => !app.chartManager.sm,
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
    label: "Song Properties...",
    keybinds: [{ key: "U", mods: [Modifier.SHIFT] }],
    disabled: app => !app.chartManager.sm,
    callback: app => app.windowManager.openWindow(new SMPropertiesWindow(app)),
  },
  save: {
    label: "Save...",
    keybinds: [{ key: "S", mods: [DEF_MOD] }],
    disabled: app => !app.chartManager.sm,
    callback: app => app.chartManager.save(),
  },
  export: {
    label: "Save and export current song",
    keybinds: [{ key: "E", mods: [DEF_MOD] }],
    disabled: app => !app.chartManager.sm,
    callback: app => {
      app.chartManager.save()
      FileHandler.saveDirectory(app.chartManager.sm_path)
    },
  },
  openChart: {
    label: "Chart List",
    keybinds: [{ key: "O", mods: [DEF_MOD, Modifier.SHIFT] }],
    disabled: app => !app.chartManager.sm,
    callback: app => app.windowManager.openWindow(new ChartListWindow(app)),
  },
  timingData: {
    label: "Edit Timing Data...",
    keybinds: [{ key: "T", mods: [Modifier.SHIFT, Modifier.ALT] }],
    disabled: app => !app.chartManager.chartView,
    callback: app => app.windowManager.openWindow(new TimingDataWindow(app)),
  },
  selectRegion: {
    label: "Select Region",
    keybinds: [{ key: "Tab", mods: [] }],
    disabled: app => !app.chartManager.chart,
    callback: app => app.chartManager.selectRegion(),
  },
  volumeUp: {
    label: "Increase volume",
    keybinds: [{ key: "Up", mods: [Modifier.SHIFT] }],
    disabled: false,
    callback: () => {
      Options.audio.songVolume = Math.min(Options.audio.songVolume + 0.05, 1)
      WaterfallManager.create(
        "Volume: " + Math.round(Options.audio.songVolume * 100) + "%"
      )
    },
  },
  volumeDown: {
    label: "Decrease volume",
    keybinds: [{ key: "Down", mods: [Modifier.SHIFT] }],
    disabled: false,
    callback: () => {
      Options.audio.songVolume = Math.max(Options.audio.songVolume - 0.05, 0)
      WaterfallManager.create(
        "Volume: " + Math.round(Options.audio.songVolume * 100) + "%"
      )
    },
  },
  effectvolumeUp: {
    label: "Increase sound effect volume",
    keybinds: [{ key: "Up", mods: [Modifier.SHIFT, Modifier.ALT] }],
    disabled: false,
    callback: () => {
      Options.audio.soundEffectVolume = Math.min(
        Options.audio.soundEffectVolume + 0.05,
        1
      )
      WaterfallManager.create(
        "Effect Volume: " +
          Math.round(Options.audio.soundEffectVolume * 100) +
          "%"
      )
    },
  },
  effectvolumeDown: {
    label: "Decrease sound effect volume",
    keybinds: [{ key: "Down", mods: [Modifier.SHIFT, Modifier.ALT] }],
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
    keybinds: [{ key: "Right", mods: [Modifier.SHIFT] }],
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
    keybinds: [{ key: "Left", mods: [Modifier.SHIFT] }],
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
    keybinds: [],
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
    keybinds: [
      { key: "PageUp", mods: [] },
      { key: ";", mods: [] },
    ],
    disabled: app =>
      !app.chartManager.chartView ||
      app.chartManager.getMode() == EditMode.Play ||
      app.chartManager.getMode() == EditMode.Record,
    callback: app =>
      app.chartManager.setAndSnapBeat(
        Math.max(0, app.chartManager.getBeat() - 4)
      ),
  },
  nextMeasure: {
    label: "Next measure",
    keybinds: [
      { key: "PageDown", mods: [] },
      { key: "'", mods: [] },
    ],
    disabled: app =>
      !app.chartManager.chartView ||
      app.chartManager.getMode() == EditMode.Play ||
      app.chartManager.getMode() == EditMode.Record,
    callback: app =>
      app.chartManager.setAndSnapBeat(app.chartManager.getBeat() + 4),
  },
  previousNote: {
    label: "Previous note",
    keybinds: [{ key: ",", mods: [] }],
    disabled: app =>
      !app.chartManager.chartView ||
      app.chartManager.getMode() == EditMode.Play ||
      app.chartManager.getMode() == EditMode.Record,
    callback: app => app.chartManager.previousNote(),
  },
  nextNote: {
    label: "Next note",
    keybinds: [{ key: ".", mods: [] }],
    disabled: app =>
      !app.chartManager.chartView ||
      app.chartManager.getMode() == EditMode.Play ||
      app.chartManager.getMode() == EditMode.Record,
    callback: app => app.chartManager.nextNote(),
  },
  jumpChartStart: {
    label: "Jump to first note",
    keybinds: [{ key: "Home", mods: [] }],
    disabled: app =>
      !app.chartManager.chartView ||
      app.chartManager.getMode() == EditMode.Play ||
      app.chartManager.getMode() == EditMode.Record,
    callback: app => app.chartManager.firstNote(),
  },
  jumpChartEnd: {
    label: "Jump to last note",
    keybinds: [{ key: "End", mods: [] }],
    disabled: app =>
      !app.chartManager.chartView ||
      app.chartManager.getMode() == EditMode.Play ||
      app.chartManager.getMode() == EditMode.Record,
    callback: app => app.chartManager.lastNote(),
  },
  jumpSongStart: {
    label: "Jump to song start",
    keybinds: [{ key: "Home", mods: [Modifier.SHIFT] }],
    disabled: app =>
      !app.chartManager.chartView ||
      app.chartManager.getMode() == EditMode.Play ||
      app.chartManager.getMode() == EditMode.Record,
    callback: app =>
      app.chartManager.setBeat(Math.max(0, app.chartManager.chart!.getBeat(0))),
  },
  jumpSongEnd: {
    label: "Jump to song end",
    keybinds: [{ key: "End", mods: [Modifier.SHIFT] }],
    disabled: app =>
      !app.chartManager.chartView ||
      app.chartManager.getMode() == EditMode.Play ||
      app.chartManager.getMode() == EditMode.Record,
    callback: app =>
      app.chartManager.setBeat(
        app.chartManager.chart!.getBeat(
          app.chartManager.songAudio.getSongLength()
        )
      ),
  },
  assistTick: {
    label: "Assist Tick",
    keybinds: [{ key: "F7", mods: [] }],
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
    keybinds: [{ key: "F7", mods: [Modifier.ALT] }],
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
    keybinds: [{ key: "W", mods: [Modifier.SHIFT, Modifier.ALT] }],
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
    keybinds: [],
    disabled: true,
    callback: () => 0,
  },
  XMod: {
    label: "XMod (Beat-based)",
    keybinds: [{ key: "X", mods: [Modifier.SHIFT] }],
    disabled: false,
    callback: () => {
      Options.chart.CMod = false
      WaterfallManager.create("Switched to XMod")
    },
  },
  CMod: {
    label: "CMod (Time-based)",
    keybinds: [{ key: "C", mods: [Modifier.SHIFT] }],
    disabled: false,
    callback: () => {
      Options.chart.CMod = true
      WaterfallManager.create("Switched to CMod")
    },
  },
  hideWarpedArrows: {
    label: "Hide warped arrows (CMod only)",
    keybinds: [{ key: "W", mods: [Modifier.SHIFT] }],
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
    keybinds: [{ key: "S", mods: [Modifier.SHIFT] }],
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
    keybinds: [{ key: "E", mods: [Modifier.SHIFT, Modifier.ALT] }],
    disabled: app => !app.chartManager.songAudio,
    callback: app => app.windowManager.openWindow(new EQWindow(app)),
  },
  previousNoteType: {
    label: "Previous note type",
    keybinds: [{ key: "N", mods: [] }],
    disabled: app =>
      !app.chartManager.chartView ||
      app.chartManager.getMode() == EditMode.Play ||
      app.chartManager.getMode() == EditMode.Record,
    callback: app => app.chartManager.previousNoteType(),
  },
  nextNoteType: {
    label: "Next Note Type",
    keybinds: [{ key: "M", mods: [] }],
    disabled: app =>
      !app.chartManager.chartView ||
      app.chartManager.getMode() == EditMode.Play ||
      app.chartManager.getMode() == EditMode.Record,
    callback: app => app.chartManager.nextNoteType(),
  },
  undo: {
    label: "Undo",
    keybinds: [{ key: "Z", mods: [DEF_MOD] }],
    disabled: app =>
      !app.actionHistory.canUndo() ||
      app.chartManager.getMode() != EditMode.Edit,
    callback: app => app.actionHistory.undo(),
  },
  redo: {
    label: "Redo",
    keybinds: [{ key: "Y", mods: [DEF_MOD] }],
    disabled: app =>
      !app.actionHistory.canRedo() ||
      app.chartManager.getMode() != EditMode.Edit,
    callback: app => app.actionHistory.redo(),
  },
  mousePlacement: {
    label: "Enable Mouse Note Placement",
    keybinds: [{ key: "M", mods: [Modifier.SHIFT] }],
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
    keybinds: [{ key: "P", mods: [] }],
    disabled: app =>
      !app.chartManager.chartView &&
      app.chartManager.getMode() != EditMode.Record,
    callback: app => app.chartManager.setMode(EditMode.Play),
  },
  recordMode: {
    label: "Enter/Exit Record Mode",
    keybinds: [{ key: "R", mods: [] }],
    disabled: app =>
      !app.chartManager.chartView &&
      app.chartManager.getMode() != EditMode.Play,
    callback: app => app.chartManager.setMode(EditMode.Record),
  },
  playModeStart: {
    label: "Play from start",
    keybinds: [{ key: "P", mods: [Modifier.SHIFT] }],
    disabled: app =>
      !app.chartManager.chartView &&
      app.chartManager.getMode() != EditMode.Record,
    callback: app => {
      app.chartManager.setBeat(0)
      app.chartManager.setMode(EditMode.Play)
    },
  },
  options: {
    label: "Options",
    keybinds: [{ key: ",", mods: [DEF_MOD] }],
    disabled: false,
    callback: app => {
      app.windowManager.openWindow(new UserOptionsWindow(app))
    },
  },
  convertHoldsRolls: {
    label: "Holds to rolls",
    keybinds: [],
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
    keybinds: [],
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
    keybinds: [],
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
    keybinds: [],
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
    keybinds: [],
    disabled: app =>
      app.chartManager.selection.notes.length == 0 ||
      app.chartManager.getMode() != EditMode.Edit,
    callback: app => {
      app.chartManager.modifySelection(note => {
        note.col =
          app.chartManager.chart!.gameType.flipColumns.horizontal[note.col]
        return note
      })
    },
  },
  mirrorVertically: {
    label: "Vertically",
    keybinds: [],
    disabled: app =>
      app.chartManager.selection.notes.length == 0 ||
      app.chartManager.getMode() != EditMode.Edit,
    callback: app => {
      app.chartManager.modifySelection(note => {
        note.col =
          app.chartManager.chart!.gameType.flipColumns.vertical[note.col]
        return note
      })
    },
  },
  mirrorBoth: {
    label: "Both",
    keybinds: [],
    disabled: app =>
      app.chartManager.selection.notes.length == 0 ||
      app.chartManager.getMode() != EditMode.Edit,
    callback: app => {
      app.chartManager.modifySelection(note => {
        note.col =
          app.chartManager.chart!.gameType.flipColumns.horizontal[note.col]
        note.col =
          app.chartManager.chart!.gameType.flipColumns.vertical[note.col]
        return note
      })
    },
  },
  selectAll: {
    label: "Select All",
    keybinds: [{ key: "A", mods: [DEF_MOD] }],
    disabled: app => !app.chartManager.chart,
    callback: app => {
      app.chartManager.selection.notes = [...app.chartManager.chart!.notedata]
    },
  },
  expand2to1: {
    label: "Expand 2:1 (8th to 4th)",
    keybinds: [],
    disabled: app =>
      app.chartManager.selection.notes.length == 0 ||
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
    keybinds: [],
    disabled: app =>
      app.chartManager.selection.notes.length == 0 ||
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
    keybinds: [],
    disabled: app =>
      app.chartManager.selection.notes.length == 0 ||
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
    keybinds: [],
    disabled: app =>
      app.chartManager.selection.notes.length == 0 ||
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
    keybinds: [],
    disabled: app =>
      app.chartManager.selection.notes.length == 0 ||
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
    keybinds: [],
    disabled: app =>
      app.chartManager.selection.notes.length == 0 ||
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
    keybinds: [
      { key: "Backspace", mods: [] },
      { key: "Delete", mods: [] },
    ],
    disabled: app =>
      app.chartManager.selection.notes.length == 0 ||
      app.chartManager.getMode() != EditMode.Edit,
    callback: app => app.chartManager.deleteSelection(),
  },
  paste: {
    label: "Paste",
    keybinds: [{ key: "V", mods: [DEF_MOD] }],
    preventDefault: false,
    disabled: app =>
      !app.chartManager.chartView ||
      app.chartManager.getMode() != EditMode.Edit,
    callback: async app => {
      const data = await navigator.clipboard.readText()
      app.chartManager.pasteNotes(data)
    },
  },
  copy: {
    label: "Copy",
    keybinds: [{ key: "C", mods: [DEF_MOD] }],
    preventDefault: false,
    disabled: app =>
      !app.chartManager.chartView ||
      app.chartManager.getMode() != EditMode.Edit,
    callback: async app => {
      const data = app.chartManager.copyNotes()
      if (data) await navigator.clipboard.writeText(data)
    },
  },
  cut: {
    label: "Cut",
    keybinds: [{ key: "X", mods: [DEF_MOD] }],
    preventDefault: false,
    disabled: app =>
      !app.chartManager.chartView ||
      app.chartManager.getMode() != EditMode.Edit,
    callback: async app => {
      const data = app.chartManager.copyNotes()
      if (data) await navigator.clipboard.writeText(data)
      app.chartManager.deleteSelection()
    },
  },
}
