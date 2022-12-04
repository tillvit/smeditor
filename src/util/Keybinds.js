import { loadSM, nextSnap, playPause, previousSnap, setAndSnapBeat, setEffectVolume, setRate, setVolume } from "../gui/chart/ChartManager.js";
import { createChartListWindow } from "../gui/view/ChartListView.js";
import { createDirectoryWindow } from "../gui/view/DirectoryView.js";
import { createEQWindow } from "../gui/view/EQView.js";
import { reloadData } from "../gui/view/OptionsView.js";

export const isOsx = ~navigator.userAgent.indexOf('Mac OS X');
const defMod = isOsx ? 'meta' : 'ctrl'
const MODS = {
  'shift': 'Shift',
  'ctrl': 'Ctrl',
  'alt': 'Alt', 
  'meta': 'Command',
};
const MODPROPS = ['ctrlKey', 'altKey', 'shiftKey', 'metaKey'];
const MODORDER = ['ctrl', 'alt', 'shift', 'meta'];
export const KEYBIND_OPTIONS = {
  playback: {
    label: "Play/Pause",
    keybind: "Space",
    mods: [],
    disabled: () => window.chartView == undefined,
    callback: () => playPause()
  },
  decreaseSnap: {
    label: "Decrease snap",
    keybind: "Left",
    mods: [],
    disabled: () => window.chartView == undefined,
    callback: () => previousSnap()
  },
  increaseSnap: {
    label: "Increase snap",
    keybind: "Right",
    mods: [],
    disabled: () => window.chartView == undefined,
    callback: () => nextSnap()
  },
  cursorUp: {
    label: "Move cursor up",
    keybind: "Up",
    mods: [],
    disabled: () => window.chartView == undefined,
    callback: () => setAndSnapBeat(chartView.beat-Math.max(0.001,options.chart.snap))
  },
  cursorDown: {
    label: "Move cursor down",
    keybind: "Down",
    mods: [],
    disabled: () => window.chartView == undefined,
    callback: () => setAndSnapBeat(chartView.beat+Math.max(0.001,options.chart.snap))
  },
  increaseScrollSpeed: {
    label: "Increase scroll speed",
    keybind: "Up",
    mods: [defMod],
    disabled: () => window.chartView == undefined,
    callback: () => chartView.setZoom(Math.max(10,options.chart.speed*Math.pow(1.01,30)))
  },
  decreaseScrollSpeed: {
    label: "Decrease scroll speed",
    keybind: "Down",
    mods: [defMod],
    disabled: () => window.chartView == undefined,
    callback: () => chartView.setZoom(Math.max(10,options.chart.speed*Math.pow(1.01,-30)))
  },
  newSong: {
    label: "New Song...",
    keybind: "N",
    mods: [defMod],
    disabled: true,
  },
  openSong: {
    label: "Open Song...",
    keybind: "O",
    mods: [defMod],
    disabled: () => window.selected_sm == "",
    callback: ()=> {
      createDirectoryWindow("Select an sm/ssc file...",["sm","ssc"], true, "", (file) => {
        window.selected_sm = file
        loadSM()
        reloadData("song_properties")
      })
    }
  },
  save: {
    label: "Save...",
    keybind: "S",
    mods: [defMod],
    disabled: true,
  },
  newChart: {
    label: "New Chart...",
    keybind: "N",
    mods: [defMod,"shift"],
    disabled: true,
  },
  openChart: {
    label: "Open Chart...",
    keybind: "O",
    mods: [defMod,"shift"],
    disabled: ()=>window.selected_sm == "",
    callback: ()=> createChartListWindow()
  },
  chartProperties: {
    label: "Chart Properties...",
    keybind: "P",
    mods: ["shift","alt"],
    disabled: true,
  },
  adjustSync: {
    label: "Adjust Sync...",
    keybind: "S",
    mods: ["shift", "alt"],
    disabled: true,
  },
  adjustTiming: {
    label: "Adjust Timing Changes...",
    keybind: "T",
    mods: ["shift", "alt"],
    disabled: true,
  },
  selectRegion: {
    label: "Select Region",
    keybind: "Tab",
    mods: [],
    disabled: true,
  },
  volumeUp: {
    label: "Increase volume",
    keybind: "Up",
    mods: ["shift"],
    disabled: false,
    callback: () => setVolume(Math.min(options.audio.songVolume+0.05,1))
  },
  volumeDown: {
    label: "Decrease volume",
    keybind: "Down",
    mods: ["shift"],
    disabled: false,
    callback: () => setVolume(Math.max(options.audio.songVolume-0.05,0))
  },
  effectvolumeUp: {
    label: "Increase sound effect volume",
    keybind: "Up",
    mods: ["shift","alt"],
    disabled: false,
    callback: () => setEffectVolume(Math.min(options.audio.soundEffectVolume+0.05,1))
  },
  effectvolumeDown: {
    label: "Decrease sound effect volume",
    keybind: "Down",
    mods: ["shift","alt"],
    disabled: false,
    callback: () => setEffectVolume(Math.max(options.audio.soundEffectVolume-0.05,0))
  },
  rateUp: {
    label: "Increase playback rate",
    keybind: "Right",
    mods: ["shift"],
    disabled: false,
    callback: () => setRate(options.audio.rate += 0.05)
  },
  rateDown: {
    label: "Decrease playback rate",
    keybind: "Left",
    mods: ["shift"],
    disabled: false,
    callback: () => setRate(Math.max(options.audio.rate-0.05,0.1))
  },
  rateDefault: {
    label: "Reset playback rate",
    keybind: "",
    mods: [""],
    disabled: false,
    callback: () => setRate(1)
  },
  previousMeasure: {
    label: "Previous measure",
    keybind: ";",
    mods: [],
    disabled: () => window.chartView == undefined,
    callback: () => chartView.setBeat(Math.max(0,chartView.beat - 4))
  },
  nextMeasure: {
    label: "Next measure",
    keybind: "'",
    mods: [],
    disabled: () => window.chartView == undefined,
    callback: () => chartView.setBeat(chartView.beat + 4)
  },
  assistTick: {
    label: "Assist Tick",
    keybind: "F7",
    mods: [],
    disabled: false,
    callback: () => options.audio.assistTick = !options.audio.assistTick
  },
  metronome: {
    label: "Metronome",
    keybind: "F7",
    mods: ["alt"],
    disabled: false,
    callback: () => options.audio.metronome = !options.audio.metronome
  },
  renderWaveform: {
    label: "Render waveform",
    keybind: "W",
    mods: ["shift", "alt"],
    disabled: false,
    callback: () => options.waveform.enabled = !options.waveform.enabled
  },
  waveformOptions: {
    label: "Waveform options...",
    keybind: "",
    mods: [],
    disabled: true,
    callback: () => {}
  },
  XMod: {
    label: "XMod (Beat-based)",
    keybind: "X",
    mods: ["shift"],
    disabled: false,
    callback: () => options.chart.CMod = false
  },
  CMod: {
    label: "CMod (Time-based)",
    keybind: "C",
    mods: ["shift"],
    disabled: false,
    callback: () => options.chart.CMod = true
  },
  hideWarpedArrows: {
    label: "Hide warped arrows (CMod only)",
    keybind: "W",
    mods: ["shift"],
    disabled: false,
    callback: () => options.chart.hideWarpedArrows = !options.chart.hideWarpedArrows
  },
  doSpeedChanges: {
    label: "Do speed changes (XMod only)",
    keybind: "S",
    mods: ["shift"],
    disabled: false,
    callback: () => options.chart.doSpeedChanges = !options.chart.doSpeedChanges
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
    mods: ["shift","alt"],
    disabled: ()=>window.audio == undefined,
    callback: () => createEQWindow()
  },
}
const SPECIAL_KEYS = {
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

export function getKeybindString(id) {
  let item = KEYBIND_OPTIONS[id]
  if (item == undefined) console.log(id)
  let prefix = MODORDER.filter(x=>item.mods.includes(x)).map(x=>MODS[x]).join("+")
  return prefix + (prefix != ""?"+":"") + item.keybind
}

function compareModifiers(k1,k2) {
  if (k1.length != k2.length) return false
  for (let mod of MODORDER) {
    if ((k1.includes(mod) ? 1 : 0) + (k2.includes(mod) ? 1 : 0) == 1) return false
  }
  return true
}

export function initKeybinds() {
  document.addEventListener("keydown",(e)=>{
    if (e.target instanceof HTMLTextAreaElement) return
    if (["Meta", "Control", "Shift", "Alt"].includes(e.key)) return
    
    let mods = []
    for (let i = 0; i < MODPROPS.length; i++) {
      if (e[MODPROPS[i]]) mods.push(MODORDER[i])
    }
    let key = e.code
    if (key.startsWith("Digit")) key = key.slice(5)
    if (key.startsWith("Key")) key = key.slice(3)
    if (key in SPECIAL_KEYS) key = SPECIAL_KEYS[key]
    let prefix = MODORDER.filter(x=>mods.includes(x)).map(x=>MODS[x]).join("+")
    // console.log(prefix + (prefix != ""?"+":"") + key)
  
    let matches = Object.values(KEYBIND_OPTIONS).filter(x=>compareModifiers(x.mods,mods)&&x.keybind==key)
    if (matches.length > 0) { 
      let disabled = matches[0].disabled
      if (typeof disabled == "function") disabled = disabled()
      if (disabled) return
      matches[0].callback()
      // console.log(matches[0].label)
      e.preventDefault() 
    };
  }, false)
}

