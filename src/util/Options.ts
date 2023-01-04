import { TimingWindowCollection } from "../chart/play/TimingWindowCollection"
import { TimingEventProperty } from "../chart/sm/TimingTypes"

export class Options {
  static chart = {
    CMod: false,
    hideWarpedArrows: false,
    doSpeedChanges: true,
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
  }
  static audio = {
    assistTick: false,
    metronome: false,
    effectOffset: 0,
    soundEffectVolume: 0.5,
    songVolume: 0.2,
    rate: 1,
  }
  static waveform = {
    enabled: true,
    color: 0x606172,
    opacity: 0.5,
    filteredColor: 0x00ff66,
    filteredOpacity: 1
  }
  static editor = {
    scrollSensitivity: 1,
    mousePlacement: false
  }
  static experimental = {
    speedChangeWaveform: true,
  }
  static play = {
    offset: -0.044,
    hideBarlines: true,
    judgmentTilt: true,
    timingWindowScale: 1,
    timingWindowAdd: 0,
    timingCollection: TimingWindowCollection.ITG,
    defaultTimingCollection: {
      "dance-single": TimingWindowCollection.ITG
    }
  }
  static debug = {
    showTimers: false
  }
}