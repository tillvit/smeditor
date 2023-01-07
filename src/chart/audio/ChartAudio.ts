import { Waveform } from "../renderer/Waveform"

export class ChartAudio {
  private _audioContext: AudioContext = new AudioContext()
  private _audioAnalyzer: AnalyserNode
  private _freqData: Uint8Array
  private _gainNode: GainNode
  private _source?: AudioBufferSourceNode
  private _playbackTime = 0
  private _startTimestamp = 0
  private _rate = 1
  private _isPlaying = false
  private _buffer: AudioBuffer
  private _delay?: number
  private _listeners: Waveform[] = []
  private _volume = 1

  loaded: Promise<void>

  constructor(url?: string) {
    this._audioAnalyzer = this._audioContext.createAnalyser()
    this._audioAnalyzer.fftSize = 8192
    this._audioAnalyzer.maxDecibels = 0
    this._freqData = new Uint8Array(this._audioAnalyzer.frequencyBinCount)
    this._gainNode = this._audioContext.createGain()

    this._buffer = this._audioContext.createBuffer(2, 1, 44100)
    this.initSource()
    this.loaded = new Promise(resolve => {
      this.getData(url)
        .then(buffer => {
          if (!buffer) return
          return buffer
        })
        .then(buffer => this.renderBuffer(buffer))
        .catch(reason => console.error(reason))
        .finally(() => {
          this.initSource()
          this.callListeners()
          resolve()
        })
    })
  }

  private async renderBuffer(buffer: AudioBuffer | undefined) {
    if (!buffer) return
    const offlineCtx = new OfflineAudioContext(
      buffer.numberOfChannels,
      buffer.length,
      buffer.sampleRate
    )
    const source = offlineCtx.createBufferSource()
    source.buffer = buffer
    source.connect(offlineCtx.destination)
    source.start()
    return await offlineCtx
      .startRendering()
      .then(renderedBuffer => {
        this._buffer = renderedBuffer
      })
      .catch(err => {
        console.error(`Rendering failed: ${err}`)
      })
  }

  addWaveform(waveform: Waveform) {
    this._listeners.push(waveform)
  }

  getSongLength(): number {
    return this._buffer.length / this._buffer.sampleRate
  }

  private callListeners() {
    this._listeners.forEach(waveform => waveform.refilter())
  }

  getFrequencyData(): Uint8Array {
    this._audioAnalyzer.getByteFrequencyData(this._freqData)
    return this._freqData
  }

  // getBodePlot(numPixels: number): number[] {
  //   let bodePlot: number[] = []
  //   for (let x = 0; x < numPixels; x++) bodePlot[x] = 1
  //   this.filters.forEach(filter=>{
  //     filter.magnitude(bodePlot)
  //   })
  //   bodePlot = bodePlot.map(x => 10*Math.log(x));
  //   return bodePlot
  // }

  async getData(url?: string): Promise<AudioBuffer | void> {
    return new Promise((resolve, reject) => {
      if (!url) resolve()
      fetch(url!)
        .then(response => response.arrayBuffer())
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

  getRawData(): Float32Array[] {
    const ret = []
    for (let i = 0; i < this._buffer.numberOfChannels; i++)
      ret.push(this._buffer.getChannelData(i))
    return ret
  }

  isPlaying(): boolean {
    return this._isPlaying
  }

  private initSource() {
    this._source = this._audioContext.createBufferSource()
    this._source.buffer = this._buffer
    this._source.connect(this._audioAnalyzer)
    this._audioAnalyzer.connect(this._gainNode)
    this._gainNode.connect(this._audioContext.destination)
    this._source.playbackRate.value = this._rate
    if (this._isPlaying) {
      this.pause()
      this.play()
    }
  }

  volume(volume: number) {
    if (this._volume == volume) return
    this._volume = volume
    this._gainNode.gain.setValueAtTime(volume, this._audioContext.currentTime)
  }

  rate(rate: number) {
    if (this._rate == rate) return
    this._rate = rate
    if (!this._source) return
    if (this._isPlaying)
      this._playbackTime +=
        (this._audioContext.currentTime - this._startTimestamp) *
        this._source.playbackRate.value
    this._startTimestamp = this._audioContext.currentTime
    this._source.playbackRate.value = rate
  }

  play() {
    if (!this._source) return
    if (this._isPlaying) return
    this.initSource()
    if (this._playbackTime <= this._buffer.duration) {
      if (this._playbackTime < 0) {
        clearTimeout(this._delay)
        this._delay = setInterval(() => {
          if (this.seek() > 0) {
            clearInterval(this._delay)
            this._source?.start(0, 0)
          }
        })
      } else {
        this._source.start(0, this._playbackTime)
      }
    }

    this._startTimestamp = this._audioContext.currentTime
    this._isPlaying = true
  }

  seek(): number
  seek(playbackTime: number): void
  seek(playbackTime?: number) {
    if (!this._source) return
    if (playbackTime === undefined) {
      if (!this._isPlaying) return this._playbackTime
      return (
        (this._audioContext.currentTime - this._startTimestamp) *
          this._source.playbackRate.value +
        this._playbackTime
      )
    }
    if (this._isPlaying) {
      this.stop()
      this._playbackTime = playbackTime
      this.play()
    } else {
      this._playbackTime = playbackTime
    }
  }

  pause() {
    this.stop(true)
  }

  stop(pause?: boolean) {
    if (!this._source) return
    if (!this._isPlaying) return
    clearTimeout(this._delay)
    this._isPlaying = false
    if (this._playbackTime <= this._buffer.duration) {
      this._source.stop()
    }
    this._playbackTime = pause
      ? (this._audioContext.currentTime - this._startTimestamp) *
          this._source.playbackRate.value +
        this._playbackTime
      : 0
  }
}
