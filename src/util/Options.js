export class Options {
  chart = {
    CMod: false,
    hideWarpedArrows: false,
    doSpeedChanges: false,
    speed: 250,
    receptorYPos: -200,
    snap: 1,
    maxDrawSeconds: 10,
    maxDrawSecondsBack: 2,
    drawNoteFlash: true,
    snapColors: {
      4: 0xE74827,
      8: 0x3D89F7,
      12:0xAA2DF4,
      16:0x82E247,
      24:0xAA2DF4,
      32:0xEAA138,
      48:0xAA2DF4,
      64:0x6BE88E,
      96:0x6BE88E,
      192:0x6BE88E
    },
    timingData: {
      "BPMS": ["right",0x661320],
      "STOPS": ["left",0x9ea106],
      "DELAYS": ["left",0x06a2d6],
      "WARPS": ["right",0x800b55],
      "FAKES": ["left",0x888888],
      "COMBOS": ["right",0x0f5c25],
      "SPEEDS": ["right",0x2d4c75],
      "LABELS": ["right",0x6e331d],
      "SCROLLS": ["left",0x161f45],
      "TIMESIGNATURES": ["left",0x756941],
      "TICKCOUNTS": ["right",0x339c37],
    },
    stepsType: "dance-single",
  }
  audio = {
    assistTick: false,
    assistTickOffset: 0,
    soundEffectVolume: 0.5,
    songVolume: 0.2,
    rate: 1,
  }
  waveform = {
    enabled: true,
    color: 0x404152,
  }
}