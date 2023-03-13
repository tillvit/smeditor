import { WaterfallManager } from "../../gui/element/WaterfallManager"
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
  private _delay?: NodeJS.Timer
  private _listeners: Waveform[] = []
  private _volume = 1
  private _destroyed = false

  loaded: Promise<void>

  constructor(data?: ArrayBuffer) {
    this._audioAnalyzer = this._audioContext.createAnalyser()
    this._audioAnalyzer.fftSize = 8192
    this._audioAnalyzer.maxDecibels = 0
    this._freqData = new Uint8Array(this._audioAnalyzer.frequencyBinCount)
    this._gainNode = this._audioContext.createGain()

    this._buffer = this._audioContext.createBuffer(2, 1, 44100)
    this.initSource()
    this.loaded = new Promise(resolve => {
      this.decodeData(data)
        .then(buffer => {
          if (!buffer) return
          return buffer
        })
        .then(buffer => this.renderBuffer(buffer))
        .catch((reason: Error) => {
          if (reason.name == "EncodingError")
            WaterfallManager.createFormatted(
              "Failed to load audio: file format not supported",
              "error"
            )
          else
            WaterfallManager.createFormatted(
              "Failed to load audio: " + reason.message,
              "error"
            )
        })
        .finally(() => {
          this.initSource()
          this.callListeners()
          resolve()
        })
    })
  }

  /**
   * Renders the specified AudioBuffer to the buffer of this ChartAudio
   *
   * @private
   * @param {(AudioBuffer | undefined)} buffer The buffer to render.
   * @return {*}  {Promise<void>}
   * @memberof ChartAudio
   */
  private async renderBuffer(buffer: AudioBuffer | undefined): Promise<void> {
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
      .catch(() => {
        WaterfallManager.createFormatted(
          "Failed to load audio: audio rendering failed",
          "error"
        )
      })
  }

  /**
   * Binds a Waveform to this ChartAudio.
   * Bound waveforms will automatically update when the audio buffer changes.
   * @param {Waveform} waveform The waveform to bind.
   * @memberof ChartAudio
   */
  bindWaveform(waveform: Waveform) {
    this._listeners.push(waveform)
  }

  /**
   * Returns the length of the audio in seconds.
   *
   * @return {*} {number}
   * @memberof ChartAudio
   */
  getSongLength(): number {
    return this._buffer.length / this._buffer.sampleRate
  }

  /**
   * Returns an array containing the byte frequency data.
   *
   * @return {*}  {Uint8Array}
   * @memberof ChartAudio
   */
  getFrequencyData(): Uint8Array {
    if (this._destroyed) return new Uint8Array()
    this._audioAnalyzer.getByteFrequencyData(this._freqData)
    return this._freqData
  }

  /**
   * Returns the sample rate of the audio
   *
   * @return {*}  {number}
   * @memberof ChartAudio
   */
  getSampleRate(): number {
    return this._buffer.sampleRate
  }

  /**
   * Returns the FFT size of the audio analyzer.
   *
   * @return {*}  {number}
   * @memberof ChartAudio
   */
  getFFTSize(): number {
    return this._audioAnalyzer.fftSize
  }

  /**
   * Returns the raw audio data. Each channel has its own Float32Array
   *
   * @return {*}  {Float32Array[]}
   * @memberof ChartAudio
   */
  getRawData(): Float32Array[] {
    if (this._destroyed) return []
    const ret = []
    for (let i = 0; i < this._buffer.numberOfChannels; i++)
      ret.push(this._buffer.getChannelData(i))
    return ret
  }

  /**
   * Returns whether the audio is currently playing
   *
   * @return {*}  {boolean}
   * @memberof ChartAudio
   */
  isPlaying(): boolean {
    if (this._destroyed) return false
    return this._isPlaying
  }

  /**
   * Destroys this instance and frees up memory. Unbinds all bound waveforms.
   * Destroyed instances cannot be used again.
   * @memberof ChartAudio
   */
  destroy() {
    if (this._destroyed) return
    this.stop()
    this._buffer = this._audioContext.createBuffer(2, 1, 44100)
    this._listeners = []
    clearTimeout(this._delay)
    this._destroyed = true
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

  private callListeners() {
    this._listeners.forEach(waveform => waveform.refilter())
  }

  private async decodeData(data?: ArrayBuffer): Promise<AudioBuffer | void> {
    return new Promise((resolve, reject) => {
      if (!data) {
        resolve()
        return
      }
      this._audioContext
        .decodeAudioData(data)
        .then(buffer => resolve(buffer))
        .catch(reason => reject(reason))
    })
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

  /**
   * Sets the volume of this audio. 1 is 100%.
   *
   * @param {number} volume
   * @memberof ChartAudio
   */
  volume(volume: number) {
    if (this._destroyed) return
    if (this._volume == volume) return
    this._volume = volume
    this._gainNode.gain.setValueAtTime(volume, this._audioContext.currentTime)
  }

  /**
   * Sets the playback rate of this audio. 1 is 100%.
   * Changing the rate will change the pitch.
   * @param {number} rate
   * @memberof ChartAudio
   */
  rate(rate: number) {
    if (this._destroyed) return
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

  /**
   * Starts playing this audio.
   *
   * @memberof ChartAudio
   */
  play() {
    if (this._destroyed) return
    if (!this._source) return
    if (this._isPlaying) return
    this.initSource()
    if (this._playbackTime <= this._buffer.duration) {
      if (this._playbackTime < 0) {
        // Stall until the playback time is positive
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

  /**
   * Seeks the audio to the specified location. If no time is provided, returns the current playback time.
   * @param {number} [playbackTime]
   * @return {*}  {number}
   * @memberof ChartAudio
   */
  seek(): number
  seek(playbackTime: number): void
  seek(playbackTime?: number) {
    if (this._destroyed) return
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

  /**
   * Pauses this audio.
   *
   * @memberof ChartAudio
   */
  pause() {
    if (this._destroyed) return
    this.stop(true)
  }

  /**
   * Stops this audio.
   *
   * @param {boolean} [pause]
   * @memberof ChartAudio
   */
  stop(pause?: boolean) {
    if (this._destroyed) return
    if (!this._source) return
    if (!this._isPlaying) return
    clearTimeout(this._delay)
    this._isPlaying = false
    if (this._playbackTime <= this._buffer.duration) {
      try {
        this._source.stop()
      } catch {
        ;("")
      }
    }
    this._playbackTime = pause
      ? (this._audioContext.currentTime - this._startTimestamp) *
          this._source.playbackRate.value +
        this._playbackTime
      : 0
  }
}
