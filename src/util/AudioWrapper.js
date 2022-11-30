import { recalcFilter } from "../gui/chart/Waveform.js";
import { BiquadFilter } from "./BiquadFilter.js";

export class AudioWrapper {

  constructor(url, onload) {
    this._audioContext = new (window.AudioContext || window.webkitAudioContext)();
    this._source; // AudioBufferSourceNode
    this._playbackTime = 0; // time of the audio playback, seconds
    this._startTimestamp = 0; // timestamp of last playback start, milliseconds
    this._isPlaying = false;
    this._gainNode = this._audioContext.createGain();
    this.filters = []
    this.getData(url).then((result)=> {
      let rawData = result.getChannelData(0)
      this.rawData = rawData
      let sampleRate = result.sampleRate
      this._buffer = this._audioContext.createBuffer(1, rawData.length, sampleRate);
      this._buffer.copyToChannel(rawData, 0)
      this.initSource()
      if (onload) onload()
    });
  }

  processFilters() {
    let dat = this.rawData
    this.filters.forEach(filter=>{
      filter.reset()
      dat = dat.map(samp=>filter.process(samp))
    })
    this._buffer.copyToChannel(dat, 0)
    this.filteredRawData = dat
    recalcFilter()
  }

  async getData(url) { 
    let result = await fetch(url)
    .then(response => response.arrayBuffer())
    .then(arrayBuffer => this._audioContext.decodeAudioData(arrayBuffer))
    return result;
  }

  //https://github.com/JMPerez/beats-audio-api/blob/gh-pages/script.js
  getPeaks(data) {
    var partSize = this._buffer.sampleRate/2,
        parts = data.length / partSize,
        peaks = [];
    for (var i = 0; i < parts; i++) {
      var max = 0;
      for (var j = i * partSize; j < (i + 1) * partSize; j++) {
        var volume = Math.abs(data[j])
        if (!max || (volume > max.volume)) {
          max = {
            position: j,
            volume: volume
          };
        }
      }
      peaks.push(max);
    }
    peaks.sort(function(a, b) {
      return b.volume - a.volume;
    });
    peaks = peaks.splice(0, peaks.length * 0.5);
    peaks.sort(function(a, b) {
      return a.position - b.position;
    });
    return peaks;
  }

  getIntervals(peaks) {
    var groups = [];
    peaks.forEach((peak, index) => {
      for (var i = 1; (index + i) < peaks.length && i < 10; i++) {
        var group = {
          tempo: (60 * this._buffer.sampleRate) / (peaks[index + i].position - peak.position),
          count: 1
        };
        while (group.tempo < 90) {
          group.tempo *= 2;
        }
        while (group.tempo > 180) {
          group.tempo /= 2;
        }
        group.tempo = Math.round(group.tempo);
        if (!(groups.some(function(interval) {
          return (interval.tempo === group.tempo ? interval.count++ : 0);
        }))) {
          groups.push(group);
        }
      }
    });
    return groups;
  }

  testFindBPM() {
    let LOWPASS = new BiquadFilter("lowpass",10,150,44100,1)
    let HIGHPASS = new BiquadFilter("highpass",10,100,44100,1)
    let data = this.rawData.map(x=>LOWPASS.process(x))
    data = data.map(x=>HIGHPASS.process(x))
    let peaks = this.getPeaks(data)
    let groups = this.getIntervals(peaks);
    groups.sort(function(intA, intB) {
      return intB.count - intA.count;
    })
    console.log(groups.slice(0,5))
  }

  initSource() {
    this._source = this._audioContext.createBufferSource();
    this._source.buffer = this._buffer;
    this._source.connect(this._gainNode);
    this._gainNode.connect(this._audioContext.destination);
  }

  volume(vol) {
    this._gainNode.gain.setValueAtTime(vol, this._audioContext.currentTime);
  }

  rate(rate) {
    this._source.playbackRate.value = rate
  }

  play() {
    if (!this._buffer) return
    if (this._isPlaying) return;
    this.initSource();
    if (this._playbackTime <= this._buffer.duration) {
      if (this._playbackTime < 0) {
        clearTimeout(this._delay)
        console.log(-this._playbackTime)
        this._delay = setTimeout(()=>this._source.start(0, 0), -this._playbackTime*1000)
      }else{
        this._source.start(0, this._playbackTime);
      }
    }
    
    this._startTimestamp = this._audioContext.currentTime
    this._isPlaying = true;
  }

  seek(playbackTime) {
    if (!this._buffer) return
    if (playbackTime === undefined) return (this._audioContext.currentTime - this._startTimestamp) + this._playbackTime;
    if (this._isPlaying) {
      this.stop(); 
      this._playbackTime = playbackTime;
      this.play(); 
    } else {
      this._playbackTime = playbackTime;
    }
  }

  pause() {
    this.stop(true);
  }

  stop(pause) {
    if (!this._buffer) return
    if (!this._isPlaying) return;
    clearTimeout(this._delay)
    this._isPlaying = false;
    if (this._playbackTime <= this._buffer.duration) { this._source.stop(); }
    this._playbackTime = pause ? (this._audioContext.currentTime - this._startTimestamp) + this._playbackTime : 0;
  }
}