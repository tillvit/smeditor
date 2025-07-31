import { ArrayBufferTarget, Muxer } from "mp4-muxer"
import { Ticker } from "pixi.js"
import { App } from "../App"
import { EditMode } from "../chart/ChartManager"
import { TIMING_WINDOW_AUTOPLAY } from "../chart/play/StandardTimingWindow"
import { TimingWindowCollection } from "../chart/play/TimingWindowCollection"
import { HoldNotedataEntry, isHoldNote } from "../chart/sm/NoteTypes"
import { Flags } from "./Flags"
import { Options } from "./Options"
import { bsearch } from "./Util"

export interface CaptureCallbackData {
  currentRenderFrame: number
  currentEncodeQueue: number
  totalFrames: number
  currentVideoFrame: VideoFrame | null
}

export interface CaptureOptions {
  aspectRatio: number
  videoHeight: number
  fps: number
  bitrate: number
  playbackRate: number
  assistTick: boolean
  metronome: boolean
  hideBarlines: boolean
  startTime: number
  endTime: number
  updateCallback?: (data: CaptureCallbackData) => Promise<void>
  onFinish?: (url: string) => void
}

export class Capture {
  private readonly app
  private readonly options: CaptureOptions
  private encoder: VideoEncoder
  private ac: AudioEncoder
  private muxer?
  private recording = false

  private renderInterval?: NodeJS.Timeout

  private cachedBarlines

  private _currentFrame = 0
  private blob?: Blob
  readonly totalFrames

  constructor(app: App, options?: Partial<CaptureOptions>) {
    this.options = {
      aspectRatio: 4 / 3,
      videoHeight: 1080,
      fps: 60,
      bitrate: 4e7,
      playbackRate: 1,
      assistTick: false,
      metronome: false,
      hideBarlines: false,
      startTime: 0,
      endTime: 10,
      ...options,
    }
    this.app = app
    this.muxer = new Muxer({
      target: new ArrayBufferTarget(),
      video: {
        codec: "avc",
        width:
          Math.round(
            (this.options.videoHeight * this.options.aspectRatio) / 2
          ) * 2,
        height: this.options.videoHeight,
      },
      audio: {
        codec: "opus",
        numberOfChannels:
          this.app.chartManager.chartAudio.getBuffer().numberOfChannels,
        sampleRate: this.app.chartManager.chartAudio.getSampleRate(),
      },
      fastStart: "in-memory",
    })

    this.totalFrames = Math.ceil(
      (this.options.endTime - this.options.startTime) * this.options.fps
    )
    this.cachedBarlines = Flags.barlines

    this.encoder = new VideoEncoder({
      output: (chunk, meta) => void this.muxer!.addVideoChunk(chunk, meta),
      error: e => {
        throw e
      },
    })

    this.ac = new AudioEncoder({
      output: (chunk, meta) => void this.muxer!.addAudioChunk(chunk, meta),
      error: e => {
        throw e
      },
    })
  }

  async renderBufferWithModifications(
    buffer: AudioBuffer,
    options: {
      volume: number
      sampleRate: number
      rate: number
    }
  ): Promise<AudioBuffer> {
    const offlineCtx = new OfflineAudioContext(
      buffer.numberOfChannels,
      Math.ceil((buffer.duration * options.sampleRate) / options.rate),
      options.sampleRate
    )

    const gainNode = offlineCtx.createGain()
    gainNode.gain.setValueAtTime(options.volume, 0)

    const offlineSource = offlineCtx.createBufferSource()
    offlineSource.buffer = buffer
    offlineSource.playbackRate.setValueAtTime(options.rate, 0)
    offlineSource.connect(gainNode)
    gainNode.connect(offlineCtx.destination)

    offlineSource.start()

    const output = await offlineCtx.startRendering()
    offlineSource.stop()
    return output
  }

  async createAssistSounds(
    startTime: number,
    endTime: number,
    sampleRate: number,
    playbackRate: number
  ) {
    const buffer = new AudioBuffer({
      length: Math.ceil(((endTime - startTime) * sampleRate) / playbackRate),
      sampleRate,
      numberOfChannels: 2,
    })
    const chart = this.app.chartManager.loadedChart!
    const startBeat = chart.getBeatFromSeconds(startTime)
    const endBeat = chart.getBeatFromSeconds(endTime)
    const notedata = chart.getNotedataInRange(startBeat, endBeat)

    if (this.options.assistTick) {
      let assist_tick = this.app.chartManager.assistTick.getBuffer()

      assist_tick = await this.renderBufferWithModifications(assist_tick, {
        volume: Options.audio.soundEffectVolume * Options.audio.masterVolume,
        sampleRate,
        rate: 1,
      })
      let lastBeat = -1
      for (const note of notedata) {
        if (note.beat == lastBeat) {
          continue
        }
        lastBeat = note.beat
        if (chart.gameType.gameLogic.shouldAssistTick(note)) {
          const startSample = Math.floor(
            ((note.second - startTime) * sampleRate) / playbackRate
          )
          for (let i = 0; i < buffer.numberOfChannels; i++) {
            const channel = buffer.getChannelData(i)
            for (let j = 0; j < assist_tick.length; j++) {
              if (startSample + j >= channel.length) break
              channel[startSample + j] += assist_tick.getChannelData(
                i % assist_tick.numberOfChannels
              )[j]
            }
          }
        }
      }
    }
    if (this.options.metronome) {
      let me_high = this.app.chartManager.me_high.getBuffer()

      me_high = await this.renderBufferWithModifications(me_high, {
        volume: Options.audio.soundEffectVolume * Options.audio.masterVolume,
        sampleRate,
        rate: 1,
      })

      let me_low = this.app.chartManager.me_low.getBuffer()
      me_low = await this.renderBufferWithModifications(me_low, {
        volume: Options.audio.soundEffectVolume * Options.audio.masterVolume,
        sampleRate,
        rate: 1,
      })
      let lastSecond: null | number = null
      for (const [barBeat, isMeasure] of chart.timingData.getMeasureBeats(
        startBeat,
        endBeat
      )) {
        const barSecond = chart.timingData.getSecondsFromBeat(barBeat)
        if (lastSecond !== null && barSecond == lastSecond) {
          continue
        }
        lastSecond = barSecond
        const sound = isMeasure ? me_high : me_low
        const startSample = Math.floor(
          ((barSecond - startTime) * sampleRate) / playbackRate
        )
        for (let i = 0; i < buffer.numberOfChannels; i++) {
          const channel = buffer.getChannelData(i)
          for (let j = 0; j < sound.length; j++) {
            if (startSample + j >= channel.length) break
            channel[startSample + j] += sound.getChannelData(
              i % sound.numberOfChannels
            )[j]
          }
        }
      }
    }

    return buffer
  }

  async start(): Promise<string> {
    console.time("capture")

    const videoEncoderOptions = {
      codec: "avc1.420028",
      width:
        Math.round((this.options.videoHeight * this.options.aspectRatio) / 2) *
        2,
      height: this.options.videoHeight,
      bitrate: this.options.bitrate,
      hardwareAcceleration: "no-preference",
      framerate: this.options.fps,
    } as const

    const audioEncoderOptions = {
      codec: "opus",
      numberOfChannels:
        this.app.chartManager.chartAudio.getBuffer().numberOfChannels,
      sampleRate: this.app.chartManager.chartAudio.getSampleRate(),
      bitrate: 192000,
    }

    if (
      !(await VideoEncoder.isConfigSupported(videoEncoderOptions)).supported ||
      !(await AudioEncoder.isConfigSupported(audioEncoderOptions)).supported
    ) {
      throw new Error("Exporting is not available on this browser!")
    }

    this.encoder.configure(videoEncoderOptions)
    this.ac.configure(audioEncoderOptions)

    const chart = this.app.chartManager.loadedChart!
    document.body.classList.remove("animated")
    this.app.chartManager.setMode(EditMode.View)
    Flags.barlines = !this.options.hideBarlines
    this.app.capturing = true
    if (this.app.chartManager.chartAudio.isPlaying()) {
      this.app.chartManager.playPause()
    }
    if (this.options.endTime === undefined) {
      this.options.endTime =
        this.app.chartManager.loadedChart?.getLastSecond() ??
        this.app.chartManager.chartAudio.getBuffer().length /
          this.app.chartManager.chartAudio.getBuffer().sampleRate
    }

    this._currentFrame = 0
    this.app.onResize(
      this.options.videoHeight * this.options.aspectRatio,
      this.options.videoHeight
    )
    this.app.view.style.width = window.innerWidth + "px"
    this.app.view.style.height = window.innerHeight + "px"
    Ticker.shared.stop()

    let audioBuf = this.app.chartManager.chartAudio.getBuffer()
    // cut audio buffer to match length
    const startSample = Math.floor(this.options.startTime * audioBuf.sampleRate)
    const endSample = Math.ceil(this.options.endTime * audioBuf.sampleRate)
    const length = endSample - startSample
    const newAudioBuf = new AudioBuffer({
      length,
      sampleRate: audioBuf.sampleRate,
      numberOfChannels: audioBuf.numberOfChannels,
    })
    for (let i = 0; i < audioBuf.numberOfChannels; i++) {
      const channel = audioBuf.getChannelData(i)
      newAudioBuf.copyToChannel(
        channel.subarray(Math.max(0, startSample), endSample),
        i,
        Math.max(0, -startSample)
      )
    }

    audioBuf = await this.renderBufferWithModifications(newAudioBuf, {
      volume: Options.audio.songVolume * Options.audio.masterVolume,
      sampleRate: newAudioBuf.sampleRate,
      rate: this.options.playbackRate,
    })

    // calculate note flash index
    let noteFlashIndex = 0

    noteFlashIndex =
      bsearch(chart.getNotedata(), this.options.startTime, a => a.second) + 1
    if (
      noteFlashIndex >= 1 &&
      this.options.startTime <= chart.getNotedata()[noteFlashIndex - 1].second
    )
      noteFlashIndex--
    let holdFlashes: HoldNotedataEntry[] = []

    // mix assist sounds
    const assistSounds = await this.createAssistSounds(
      this.options.startTime,
      this.options.endTime,
      audioBuf.sampleRate,
      this.options.playbackRate
    )

    console.log(this.ac.state)

    return new Promise((resolve, reject) => {
      this.recording = true
      this.renderInterval = setInterval(() => {
        if (!this.recording) return
        try {
          if (this.encoder.encodeQueueSize < 300) {
            const time =
              (this._currentFrame / this.options.fps) *
                this.options.playbackRate +
              this.options.startTime
            if (time > this.options.endTime) {
              resolve(this.stop())
              return
            }
            this.app.chartManager.time = time

            // do note flashes
            const notedata = chart.getNotedata()
            while (
              noteFlashIndex < notedata.length &&
              time > notedata[noteFlashIndex].second
            ) {
              const note = notedata[noteFlashIndex]
              if (chart.gameType.gameLogic.shouldAssistTick(note)) {
                this.app.chartManager.chartView!.doJudgement(
                  note,
                  0,
                  TIMING_WINDOW_AUTOPLAY
                )
                if (isHoldNote(note)) {
                  if (note.type == "Hold") {
                    this.app.chartManager
                      .chartView!.getNotefield()
                      .activateHold(note.col)
                  } else if (note.type == "Roll") {
                    this.app.chartManager
                      .chartView!.getNotefield()
                      .activateRoll(note.col)
                  }
                  holdFlashes.push(note)
                }
              }
              noteFlashIndex++
            }
            holdFlashes = holdFlashes.filter(hold => {
              if (this.app.chartManager.beat < hold.beat + hold.hold)
                return true
              if (hold.type == "Hold") {
                this.app.chartManager
                  .chartView!.getNotefield()
                  .releaseHold(hold.col)
              }
              if (hold.type == "Roll") {
                this.app.chartManager
                  .chartView!.getNotefield()
                  .releaseRoll(hold.col)
              }
              this.app.chartManager.chartView!.doJudgement(
                hold,
                null,
                TimingWindowCollection.getCollection(
                  Options.play.timingCollection
                ).getHeldJudgement(hold)
              )
              return false
            })
            Ticker.shared.update(
              Ticker.shared.lastTime + 1000 / this.options.fps
            )

            this.app.renderer.render(this.app.stage)

            const videoFrame = new VideoFrame(this.app.view, {
              timestamp: (this._currentFrame / this.options.fps) * 1000000,
            })

            const audioTime =
              (time - this.options.startTime) / this.options.playbackRate
            const audioStartSample = Math.floor(audioTime * audioBuf.sampleRate)
            const audioEndSample = Math.ceil(
              (audioTime + 1 / this.options.fps) * audioBuf.sampleRate
            )
            const numFrames = audioEndSample - audioStartSample
            const dataBuf = new Float32Array(
              numFrames * audioBuf.numberOfChannels
            )
            for (let i = 0; i < audioBuf.numberOfChannels; i++) {
              const channel = audioBuf.getChannelData(i)
              dataBuf.set(
                channel.subarray(audioStartSample, audioEndSample),
                i * numFrames
              )

              if (this.options.metronome || this.options.assistTick) {
                // mix assist sounds
                const assistChannel = assistSounds.getChannelData(i)

                for (let j = audioStartSample; j < audioEndSample; j++) {
                  if (j >= assistChannel.length) break
                  dataBuf[i * numFrames + j - audioStartSample] +=
                    assistChannel[j]
                }
              }
            }
            const ad = new AudioData({
              data: dataBuf,
              format: "f32-planar",
              numberOfChannels: audioBuf.numberOfChannels,
              numberOfFrames: numFrames,
              sampleRate: audioBuf.sampleRate,
              timestamp: (this._currentFrame / this.options.fps) * 1000000,
            })
            this._currentFrame += 1
            this.encoder.encode(videoFrame)
            this.ac.encode(ad)
            ad.close()

            this.options
              .updateCallback?.({
                currentRenderFrame: this._currentFrame,
                currentEncodeQueue: this.encoder.encodeQueueSize,
                totalFrames: this.totalFrames,
                currentVideoFrame: videoFrame,
              })
              .then(() => {
                videoFrame.close()
              })
          }
        } catch (e) {
          reject(e)
          this.stop()
        }
      }, 10)
    })
  }

  async stop() {
    clearInterval(this.renderInterval)
    Ticker.shared.start()
    this.app.chartManager.setMode(EditMode.Edit)
    this.app.updateSize()
    this.recording = false
    this.app.capturing = false
    Flags.barlines = this.cachedBarlines

    const int = setInterval(() => {
      this.options.updateCallback?.({
        currentRenderFrame: this.totalFrames,
        currentEncodeQueue: this.encoder.encodeQueueSize,
        totalFrames: this.totalFrames,
        currentVideoFrame: null,
      })
    }, 100)
    if (this.encoder.state == "configured") await this.encoder.flush()
    if (this.ac.state == "configured") await this.ac.flush()
    this.muxer!.finalize()
    clearInterval(int)

    const { buffer } = this.muxer!.target
    const blob = new Blob([buffer], { type: "video/mp4" })
    this.blob = blob
    const url = URL.createObjectURL(blob)
    if (Options.general.smoothAnimations)
      document.body.classList.add("animated")
    console.timeEnd("capture")

    this.options.onFinish?.(url)

    return url
  }

  get currentRenderFrame() {
    return this._currentFrame
  }

  get currentEncodeQueue() {
    return this.encoder?.encodeQueueSize ?? 0
  }

  get size() {
    return this.blob ? this.blob.size : 0
  }
}
