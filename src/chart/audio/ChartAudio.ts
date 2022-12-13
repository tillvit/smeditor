import { BiquadFilter } from "./BiquadFilter"
import { Waveform } from "./Waveform"

export class ChartAudio {

  private _audioContext: AudioContext = new AudioContext()
  private _audioAnalyzer: AnalyserNode
  private  _freqData: Uint8Array
  private _gainNode: GainNode
  private _source?: AudioBufferSourceNode
  private _playbackTime: number = 0
  private _startTimestamp: number = 0
  private _rate: number = 0
  private _isPlaying: boolean = false
  private _rawData: Float32Array = new Float32Array(1024)
  private _filteredRawData?: Float32Array
  private _buffer: AudioBuffer
  private _delay?: number
  private _listeners: Waveform[] = []

  filters: BiquadFilter[] = []
  

  constructor(url?: string, onload?: (audio: ChartAudio) => void) {
    this._audioAnalyzer = this._audioContext.createAnalyser()
    this._audioAnalyzer.fftSize = 8192;
    this._audioAnalyzer.maxDecibels = 0;
    this._freqData = new Uint8Array(this._audioAnalyzer.frequencyBinCount);
    this._gainNode = this._audioContext.createGain();

    this._buffer = this._audioContext.createBuffer(1, this._rawData.length, 44100);
    this.getData(url).then((buffer) => {
      if (!buffer) return
      this._rawData = buffer.getChannelData(0)
      this._buffer = this._audioContext.createBuffer(1, this._rawData.length, buffer.sampleRate);
      this._buffer.copyToChannel(this._rawData, 0)
    })
    .catch(reason=>console.error(reason))
    .finally(() => {
      this.initSource()
      this.callListeners()
      if (onload) onload(this)
    })
  }

  addWaveform(waveform: Waveform) {
    this._listeners.push(waveform)
  }

  getSongLength(): number {
    return this._rawData.length/this._buffer.sampleRate
  }

  private callListeners() {
    this._listeners.forEach(waveform => waveform.refilter())
  }

  getFrequencyData(): Uint8Array {
    this._audioAnalyzer.getByteFrequencyData(this._freqData);
    return this._freqData
  }

  async processFilters() {
    let data = this._rawData
    this.filters.forEach((filter: BiquadFilter) => {
      filter.reset()
      data = data.map(sample=>filter.process(sample))
    })
    this._buffer.copyToChannel(data, 0)
    this._filteredRawData = data
    if (this.filters.length == 0) this._filteredRawData = undefined
    this.callListeners()
  }

  getBodePlot(numPixels: number): number[] {
    let bodePlot: number[] = []
    for (let x = 0; x < numPixels; x++) bodePlot[x] = 1
    this.filters.forEach(filter=>{
      filter.magnitude(bodePlot)
    })
    bodePlot = bodePlot.map(x => 10*Math.log(x));
    return bodePlot
  }

  async getData(url?: string): Promise<AudioBuffer | void> { 
    return new Promise((resolve, reject) => {
      if (!url) resolve()
      fetch(url!).then(response => response.arrayBuffer())
        .then(data => this._audioContext.decodeAudioData(data))
        .then(buffer => resolve(buffer))
        .catch(reason => reject(reason))
    })
  }

  getSampleRate(): number {
    return this._buffer.sampleRate
  }

  getFFTSize(): number {
    return this._audioAnalyzer.fftSize
  }

  getRawData(): Float32Array {
    return this._rawData
  }

  getFilteredRawData(): Float32Array | undefined {
    return this._filteredRawData
  }

  isPlaying(): boolean {
    return this._isPlaying
  }

  private initSource() {
    this._source = this._audioContext.createBufferSource();
    this._source.buffer = this._buffer;
    this._source.connect(this._audioAnalyzer);
    this._audioAnalyzer.connect(this._gainNode);
    this._gainNode.connect(this._audioContext.destination);   
    this._source.playbackRate.value = this._rate
  }

  volume(volume: number) {
    this._gainNode.gain.setValueAtTime(volume, this._audioContext.currentTime);
  }

  rate(rate: number) {
    this._rate = rate 
    if (!this._source) return
    if (this._isPlaying) this._playbackTime += (this._audioContext.currentTime - this._startTimestamp) * this._source.playbackRate.value
    this._startTimestamp = this._audioContext.currentTime
    this._source.playbackRate.value = rate
  }

  play() {
    if (!this._source) return
    if (this._isPlaying) return;
    this.initSource();
    if (this._playbackTime <= this._buffer.duration) {
      if (this._playbackTime < 0) {
        clearTimeout(this._delay)
        this._delay = setInterval(()=>{
          if (this.seek() > 0) {
            clearInterval(this._delay)
            this._source?.start(0, 0)
          }
        })
      } else{
        this._source.start(0, this._playbackTime);
      }
    }
    
    this._startTimestamp = this._audioContext.currentTime
    this._isPlaying = true;
  }

  seek(): number
  seek(playbackTime: number): void
  seek(playbackTime?: number) {
    if (!this._source) return
    if (playbackTime === undefined) {
      if (!this._isPlaying) return this._playbackTime;
      return (this._audioContext.currentTime - this._startTimestamp) * this._source.playbackRate.value  + this._playbackTime;
    }
    if (this._isPlaying) {
      this.stop(); 
      this._playbackTime = playbackTime;
      this.play(); 
    } else {
      this._playbackTime = playbackTime
    }
  }

  pause() {
    this.stop(true);
  }

  stop(pause?: boolean) {
    if (!this._source) return
    if (!this._isPlaying) return;
    clearTimeout(this._delay)
    this._isPlaying = false;
    if (this._playbackTime <= this._buffer.duration) { 
      try {
        this._source.stop(); 
      } catch {}
    }
    this._playbackTime = pause ? (this._audioContext.currentTime - this._startTimestamp) * this._source.playbackRate.value + this._playbackTime : 0;
  }

}