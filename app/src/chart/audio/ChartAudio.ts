import { WaterfallManager } from "../../gui/element/WaterfallManager"
import { Options } from "../../util/Options"

class SafeAudioBufferSourceNode extends AudioBufferSourceNode {
  private started = false
  start(when?: number, offset?: number, duration?: number): void {
    if (!this.started) super.start(when, offset, duration)
    this.started = true
  }
  stop(when?: number): void {
    if (this.started) super.stop(when)
    this.started = false
  }
  static create(node: AudioBufferSourceNode) {
    const safe = node as SafeAudioBufferSourceNode
    safe.started = false
    Object.setPrototypeOf(safe, SafeAudioBufferSourceNode.prototype)
    return safe
  }
}

class ToggleableBiquadFilterNode extends BiquadFilterNode {
  enabled = false
  static create(filter: BiquadFilterNode) {
    const toggle = filter as ToggleableBiquadFilterNode
    toggle.enabled = false
    return toggle
  }
}

export class ChartAudio {
  private readonly _audioAnalyzer: AnalyserNode
  private readonly _filteredAudioAnalyzer: AnalyserNode
  private readonly _freqData: Uint8Array
  private readonly _filteredFreqData: Uint8Array
  private readonly _gainNode: GainNode
  private readonly type

  private _audioContext: AudioContext = new AudioContext()
  private _source?: SafeAudioBufferSourceNode
  private _playbackTime = 0
  private _startTimestamp = 0
  private _rate = 1
  private _isPlaying = false
  private _buffer: AudioBuffer
  private _filteredBuffer: AudioBuffer
  private _loadedBuffer: AudioBuffer
  private _delay?: NodeJS.Timeout
  private _listeners: (() => void)[] = []
  private _volume = 1
  private _destroyed = false
  private _renderTimeout?: NodeJS.Timeout
  private _filters: ToggleableBiquadFilterNode[] = [
    this.createFilter({ type: "highpass", frequency: 20, Q: 0.71 }),
    this.createFilter({ type: "lowshelf", frequency: 75, gain: 0 }),
    this.createFilter({ type: "peaking", frequency: 100, gain: 0, Q: 0.6 }),
    this.createFilter({ type: "peaking", frequency: 250, gain: 0, Q: 0.3 }),
    this.createFilter({ type: "peaking", frequency: 1040, gain: 0, Q: 0.41 }),
    this.createFilter({ type: "peaking", frequency: 2500, gain: 0, Q: 0.2 }),
    this.createFilter({ type: "highshelf", frequency: 7500, gain: 0 }),
    this.createFilter({ type: "lowpass", frequency: 20000, Q: 0.71 }),
  ]
  private _filtersEnabled = false

  loaded: Promise<void>

  constructor(data?: ArrayBuffer, type?: string) {
    this.type = type ?? ""
    this._filters[0].gain.value = -25
    this._audioAnalyzer = this._audioContext.createAnalyser()
    this._audioAnalyzer.fftSize = 8192
    this._audioAnalyzer.maxDecibels = 0
    this._freqData = new Uint8Array(this._audioAnalyzer.frequencyBinCount)
    this._filteredAudioAnalyzer = this._audioContext.createAnalyser()
    this._filteredAudioAnalyzer.fftSize = 8192
    this._filteredAudioAnalyzer.maxDecibels = 0
    this._filteredFreqData = new Uint8Array(
      this._filteredAudioAnalyzer.frequencyBinCount
    )
    this._gainNode = this._audioContext.createGain()

    this._buffer = this._audioContext.createBuffer(2, 1, 44100)
    this._filteredBuffer = this._audioContext.createBuffer(2, 1, 44100)
    this._loadedBuffer = this._audioContext.createBuffer(2, 1, 44100)
    this.initSource()
    this.loaded = new Promise(resolve => {
      this.decodeData(data)
        .then(buffer => {
          if (!buffer) return
          this._loadedBuffer = buffer
          return buffer
        })
        .then(async buffer => {
          await this.renderBuffer(buffer)
          await this.renderFilteredBuffer(buffer)
          return buffer
        })
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
   * Renders the specified AudioBuffer to the buffer of this ChartAudio, applying filters set to this instance.
   *
   * @private
   * @param {(AudioBuffer | undefined)} buffer The buffer to render.
   * @return {*}  {Promise<void>}
   * @memberof ChartAudio
   */
  private async renderFilteredBuffer(
    buffer: AudioBuffer | undefined
  ): Promise<void> {
    if (!buffer) return
    const offlineCtx = new OfflineAudioContext(
      buffer.numberOfChannels,
      buffer.length,
      buffer.sampleRate
    )
    const source = offlineCtx.createBufferSource()
    source.buffer = buffer
    let input: AudioNode = source
    for (const filter of this._filters) {
      if (!filter.enabled) continue
      const newFilter = offlineCtx.createBiquadFilter()
      newFilter.type = filter.type
      newFilter.Q.setValueAtTime(filter.Q.value, 0)
      newFilter.frequency.setValueAtTime(filter.frequency.value, 0)
      newFilter.gain.setValueAtTime(filter.gain.value, 0)
      input.connect(newFilter)
      input = newFilter
    }
    input.connect(offlineCtx.destination)
    source.start()
    return await offlineCtx
      .startRendering()
      .then(renderedBuffer => {
        this._filteredBuffer = renderedBuffer
      })
      .catch(() => {
        WaterfallManager.createFormatted(
          "Failed to load audio: audio rendering failed",
          "error"
        )
      })
  }

  private createFilter(options: {
    type: BiquadFilterType
    Q?: number
    gain?: number
    frequency?: number
  }): ToggleableBiquadFilterNode {
    const node = ToggleableBiquadFilterNode.create(
      this._audioContext.createBiquadFilter()
    )
    node.type = options.type
    if (options.Q !== undefined) node.Q.value = options.Q
    if (options.gain !== undefined) node.gain.value = options.gain
    if (options.frequency !== undefined)
      node.frequency.value = options.frequency
    return node
  }

  getFilters() {
    return this._filters
  }

  getFilter(filterIndex: number) {
    return this._filters[filterIndex]
  }

  updateFilter(
    filterIndex: number,
    properties: { Q?: number; gain?: number; frequency?: number }
  ) {
    if (!this._filters[filterIndex]) return
    if (properties.Q !== undefined)
      this._filters[filterIndex].Q.value = properties.Q
    if (properties.frequency !== undefined)
      this._filters[filterIndex].frequency.value = properties.frequency
    if (properties.gain !== undefined)
      this._filters[filterIndex].gain.value = properties.gain
    clearTimeout(this._renderTimeout)
    this._renderTimeout = setTimeout(
      () =>
        this.renderFilteredBuffer(this._loadedBuffer).then(() =>
          this.callListeners()
        ),
      500
    )
  }

  enableFilter(filterIndex: number) {
    this._filters[filterIndex].enabled = true
    this.initSource()
    clearTimeout(this._renderTimeout)
    this._renderTimeout = setTimeout(
      () =>
        this.renderFilteredBuffer(this._loadedBuffer).then(() =>
          this.callListeners()
        ),
      500
    )
    this._filtersEnabled = true
  }

  disableFilter(filterIndex: number) {
    this._filters[filterIndex].enabled = false
    this.initSource()
    clearTimeout(this._renderTimeout)
    this._renderTimeout = setTimeout(
      () =>
        this.renderFilteredBuffer(this._loadedBuffer).then(() =>
          this.callListeners()
        ),
      500
    )
    this._filtersEnabled = this._filters.some(filter => filter.enabled)
  }

  hasFilters() {
    return this._filtersEnabled
  }

  /**
   * Add a listener that fires when the audio buffer changes.
   * @memberof ChartAudio
   */
  onUpdate(callback: () => void) {
    this._listeners.push(callback)
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
   * Returns an array containing the byte frequency data after audio filtering.
   *
   * @return {*}  {Uint8Array}
   * @memberof ChartAudio
   */
  getFilteredFrequencyData(): Uint8Array {
    if (this._destroyed) return new Uint8Array()
    this._filteredAudioAnalyzer.getByteFrequencyData(this._filteredFreqData)
    return this._filteredFreqData
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
   * Returns the raw audio data. Each channel has its own Float32Array.
   *
   * @return {*}  {number[]}
   * @memberof ChartAudio
   */
  getRawData(): Float32Array[] {
    if (this._destroyed) return []
    const ret = []
    for (let i = 0; i < this._buffer.numberOfChannels; i++) {
      const buf = new Float32Array(this._buffer.length)
      this._buffer.copyFromChannel(buf, i)
      ret.push(buf)
    }
    return ret
  }

  /**
   * Returns the filtered raw audio data. Each channel has its own Float32Array.
   *
   * @return {*}  {number[]}
   * @memberof ChartAudio
   */
  getFilteredRawData(): Float32Array[] {
    if (this._destroyed) return []
    const ret = []
    for (let i = 0; i < this._filteredBuffer.numberOfChannels; i++) {
      const buf = new Float32Array(this._filteredBuffer.length)
      this._filteredBuffer.copyFromChannel(buf, i)
      ret.push(buf)
    }
    return ret
  }

  getBuffer(): AudioBuffer {
    return this._loadedBuffer
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

  reload() {
    this.initSource()
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

  getFrequencyResponse(frequencies: number[]): number[] {
    const floatArray = new Float32Array(frequencies)
    if (!this._filters.some(filter => filter.enabled)) {
      return new Array(frequencies.length).fill(1) as number[]
    }
    return this._filters
      .filter(filter => filter.enabled)
      .map(filter => {
        const out = new Float32Array(frequencies.length)
        filter.getFrequencyResponse(
          floatArray,
          out,
          new Float32Array(frequencies.length)
        )
        return [...out]
      })
      .reduce((accumulator, response) =>
        accumulator.map((value, index) => value * response[index])
      )
  }

  private callListeners() {
    this._listeners.forEach(listener => listener())
  }

  private async decodeData(data?: ArrayBuffer): Promise<AudioBuffer | void> {
    return new Promise((resolve, reject) => {
      if (!data) {
        resolve()
        return
      }
      ;(async () => {
        try {
          resolve(await this._audioContext.decodeAudioData(data))
        } catch (e) {
          if (this.type == ".ogg") {
            // attempt to decode with ogg
            const oggdec = (await import("../../util/OggDec")).default
            try {
              resolve(await oggdec.decodeOggData(data))
            } catch (err) {
              reject(err)
            }
            return
          }
          reject(e)
        }
      })()
    })
  }

  private initSource() {
    for (const filter of this._filters) {
      filter.disconnect()
    }
    this._audioAnalyzer.disconnect()
    this._filteredAudioAnalyzer.disconnect()
    this._gainNode.disconnect()
    this._audioContext.destination.disconnect()
    this._source?.stop()
    this._source = SafeAudioBufferSourceNode.create(
      this._audioContext.createBufferSource()
    )

    this._source.buffer = this._buffer
    this._source.connect(this._audioAnalyzer)
    let input: AudioNode = this._audioAnalyzer
    for (const filter of this._filters) {
      if (!filter.enabled) continue
      input.connect(filter)
      input = filter
    }
    input.connect(this._filteredAudioAnalyzer)
    if (Options.audio.allowFilter) {
      this._filteredAudioAnalyzer.connect(this._gainNode)
    } else {
      this._audioAnalyzer.connect(this._gainNode)
    }
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
      this._source.stop()
    }
    this._playbackTime = pause
      ? (this._audioContext.currentTime - this._startTimestamp) *
          this._source.playbackRate.value +
        this._playbackTime
      : 0
  }
}
