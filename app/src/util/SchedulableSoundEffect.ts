import { WaterfallManager } from "../gui/element/WaterfallManager"

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

export interface SchedulableSoundEffectOptions {
  src: string
  volume?: number
  rate?: number
}

export class SchedulableSoundEffect {
  private readonly _gainNode: GainNode

  private _audioContext: AudioContext = new AudioContext()
  private _sources: SafeAudioBufferSourceNode[] = []
  private _rate = 1
  private _buffer: AudioBuffer
  private _volume = 1
  private _destroyed = false

  loaded: Promise<void>

  constructor(options: SchedulableSoundEffectOptions) {
    this._gainNode = this._audioContext.createGain()
    this._gainNode.connect(this._audioContext.destination)

    if (options.volume !== undefined) {
      this.volume(options.volume)
    }

    if (options.rate !== undefined) {
      this.rate(options.rate)
    }

    this._buffer = this._audioContext.createBuffer(2, 1, 44100)
    this.loaded = new Promise(resolve => {
      fetch(options.src)
        .then(data => data.arrayBuffer())
        .then(data => this.decodeData(data))
        .then(buffer => {
          if (!buffer) return
          this._buffer = buffer
        })
        .catch((reason: Error) => {
          WaterfallManager.createFormatted(
            "Failed to load sound effect: " + reason.message,
            "error"
          )
        })
        .finally(() => {
          resolve()
        })
    })
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
    this._destroyed = true
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
          reject(e)
        }
      })()
    })
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
    for (const source of this._sources) {
      source.playbackRate.value = rate
    }
  }

  /**
   * Starts playing this audio.
   *
   * @memberof ChartAudio
   */
  play(offset: number) {
    if (this._destroyed) return
    const source = SafeAudioBufferSourceNode.create(
      this._audioContext.createBufferSource()
    )
    // Connect graph
    source.buffer = this._buffer
    source.connect(this._gainNode)
    this._gainNode.connect(this._audioContext.destination)
    source.start(offset + this._audioContext.currentTime, 0)

    source.playbackRate.value = this._rate
    this._sources.push(source)
    source.onended = () => {
      source.disconnect()
      this._sources = this._sources.filter(s => s != source)
    }
  }

  stop() {
    if (this._destroyed) return
    for (const source of this._sources) {
      source.stop()
      source.disconnect()
    }
    this._sources = []
  }

  getBuffer() {
    return this._buffer
  }
}
