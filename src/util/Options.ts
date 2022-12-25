import { StepsType } from "../chart/sm/SimfileTypes"
import { TimingEventProperty } from "../chart/sm/TimingTypes"

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
      "ATTACKS": true,
    } as {[key in TimingEventProperty]: boolean},
    stepsType: "dance-single" as StepsType,
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
    opacity: 1,
    filteredColor: 0x00ff66,
    filteredOpacity: 1
  }
  editor = {
    scrollSensitivity: 1,
    mousePlacement: false
  }
  experimental = {
    speedChangeWaveform: true
  }
  play = {
    faEnabled: false,
    offset: -0.044,
    hideBarlines: true,
  }
}