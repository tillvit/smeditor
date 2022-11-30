export class Options {
  chart = {
    CMod: false,
    hideWarpedArrows: false,
    doSpeedChanges: false,
    speed: 250,
    receptorYPos: -200,
    snap: 1,
    maxDrawBeats: 20,
    maxDrawBeatsBack: 10,
    drawNoteFlash: true,
    renderTimingEvent: {
      "BPMS": true,
      "STOPS": true,
      "DELAYS": true,
      "WARPS": true,
      "FAKES": true,
      "COMBOS": true,
      "SPEEDS": true,
      "LABELS": true,
      "SCROLLS": true,
      "TIMESIGNATURES": true,
      "TICKCOUNTS": true,
      "BGCHANGES": true,
      "FGCHANGES": true,
      "ATTACKS": false,
    },
    stepsType: "dance-single",
  }
  audio = {
    assistTick: false,
    metronome: false,
    effectOffset: 0,
    soundEffectVolume: 0.5,
    songVolume: 0.2,
    rate: 1,
  }
  waveform = {
    enabled: true,
    color: 0x404152,
  }
}