import { ArrayBufferTarget, Muxer } from "mp4-muxer"
import { Ticker } from "pixi.js"
import { App } from "../App"
import { EditMode } from "../chart/ChartManager"
import { TIMING_WINDOW_AUTOPLAY } from "../chart/play/StandardTimingWindow"
import { TimingWindowCollection } from "../chart/play/TimingWindowCollection"
import { HoldNotedataEntry, isHoldNote } from "../chart/sm/NoteTypes"
import { Options } from "./Options"
import { bsearch } from "./Util"

interface CaptureOptions {
  aspectRatio: number
  videoHeight: number
  fps: number
  bitrate: number
  playbackRate: number
  assistTick: boolean
  metronome: boolean
  mode: "edit" | "play"
}

export class Capture {
  private readonly app
  private readonly options: CaptureOptions
  private encoder: VideoEncoder
  private ac: AudioEncoder
  private muxer?
  private recording = false

  private cachedZoom = 1
  private cachedYPosition = -250

  constructor(app: App, options?: Partial<CaptureOptions>) {
    this.options = {
      aspectRatio: 4 / 3,
      videoHeight: 1080,
      fps: 60,
      bitrate: 4e7,
      playbackRate: 1,
      assistTick: false,
      metronome: false,
      mode: "edit",
      ...options,
    }
    this.app = app
    this.cachedZoom = Options.chart.zoom
    this.cachedYPosition = Options.chart.receptorYPos
    // Math.round(((app.view.width / app.view.height) * 900) / 2) * 2
    this.muxer = new Muxer({
      target: new ArrayBufferTarget(),
      video: {
        codec: "avc",
        width: this.options.videoHeight * this.options.aspectRatio,
        height: this.options.videoHeight,
      },
      audio: {
        codec: "aac",
        numberOfChannels:
          this.app.chartManager.chartAudio.getBuffer().numberOfChannels,
        sampleRate: this.app.chartManager.chartAudio.getSampleRate(),
      },
      fastStart: "in-memory",
    })
    this.encoder = new VideoEncoder({
      output: (chunk, meta) => void this.muxer!.addVideoChunk(chunk, meta),
      error: e => console.error(e),
    })
    this.encoder.configure({
      codec: "avc1.420028",
      width: this.options.videoHeight * this.options.aspectRatio,
      height: this.options.videoHeight,
      bitrate: this.options.bitrate,
      hardwareAcceleration: "prefer-hardware",
      framerate: this.options.fps,
    })

    this.ac = new AudioEncoder({
      output: (chunk, meta) => void this.muxer!.addAudioChunk(chunk, meta),
      error: e => console.error(e),
    })

    this.ac.configure({
      codec: "mp4a.40.2",
      bitrate: 192000,
      numberOfChannels:
        this.app.chartManager.chartAudio.getBuffer().numberOfChannels,
      sampleRate: this.app.chartManager.chartAudio.getSampleRate(),
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

  async start(startTime = 0, endTime?: number) {
    console.time("capture")
    const chart = this.app.chartManager.loadedChart!
    this.app.chartManager.setMode(EditMode.View)
    this.app.capturing = true
    if (this.app.chartManager.chartAudio.isPlaying()) {
      this.app.chartManager.playPause()
    }
    if (endTime === undefined) {
      endTime =
        this.app.chartManager.loadedChart?.getLastSecond() ??
        this.app.chartManager.chartAudio.getBuffer().length /
          this.app.chartManager.chartAudio.getBuffer().sampleRate
    }

    let frame = 0
    let lastFrameTime = performance.now()
    this.app.onResize(
      this.options.videoHeight * this.options.aspectRatio,
      this.options.videoHeight
    )
    this.app.view.style.width = window.innerWidth + "px"
    this.app.view.style.height = window.innerHeight + "px"
    Ticker.shared.stop()

    let audioBuf = this.app.chartManager.chartAudio.getBuffer()
    // cut audio buffer to match length
    const startSample = Math.floor(startTime * audioBuf.sampleRate)
    const endSample = Math.ceil(endTime * audioBuf.sampleRate)
    const length = endSample - startSample
    const newAudioBuf = new AudioBuffer({
      length,
      sampleRate: audioBuf.sampleRate,
      numberOfChannels: audioBuf.numberOfChannels,
    })
    for (let i = 0; i < audioBuf.numberOfChannels; i++) {
      const channel = audioBuf.getChannelData(i)
      newAudioBuf.copyToChannel(channel.subarray(startSample, endSample), i, 0)
    }
    audioBuf = await this.renderBufferWithModifications(newAudioBuf, {
      volume: Options.audio.songVolume * Options.audio.masterVolume,
      sampleRate: newAudioBuf.sampleRate,
      rate: this.options.playbackRate,
    })

    // calculate note flash index
    let noteFlashIndex = 0

    noteFlashIndex = bsearch(chart.getNotedata(), startTime, a => a.second) + 1
    if (
      noteFlashIndex >= 1 &&
      startTime <= chart.getNotedata()[noteFlashIndex - 1].second
    )
      noteFlashIndex--
    let holdFlashes: HoldNotedataEntry[] = []

    // mix assist sounds
    const assistSounds = await this.createAssistSounds(
      startTime,
      endTime,
      audioBuf.sampleRate,
      this.options.playbackRate
    )

    console.log(audioBuf.length, assistSounds.length, assistSounds)

    const render = async () => {
      if (!this.recording) return

      if (this.encoder.encodeQueueSize < 300) {
        const time =
          (frame / this.options.fps) * this.options.playbackRate + startTime
        if (time > endTime) {
          this.stop()
          return
        }
        this.app.chartManager.time = time
        Ticker.shared.update(Ticker.shared.lastTime + 1000 / this.options.fps)

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
          if (this.app.chartManager.beat < hold.beat + hold.hold) return true
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

        this.app.renderer.render(this.app.stage)

        const videoFrame = new VideoFrame(this.app.view, {
          timestamp: (frame / this.options.fps) * 1000000,
        })

        const audioTime = (time - startTime) / this.options.playbackRate
        const audioStartSample = Math.floor(audioTime * audioBuf.sampleRate)
        const audioEndSample = Math.ceil(
          (audioTime + 1 / this.options.fps) * audioBuf.sampleRate
        )
        const numFrames = audioEndSample - audioStartSample
        const dataBuf = new Float32Array(numFrames * audioBuf.numberOfChannels)
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
              dataBuf[i * numFrames + j - audioStartSample] += assistChannel[j]
            }
          }
        }
        const ad = new AudioData({
          data: dataBuf,
          format: "f32-planar",
          numberOfChannels: audioBuf.numberOfChannels,
          numberOfFrames: numFrames,
          sampleRate: audioBuf.sampleRate,
          timestamp: (frame / this.options.fps) * 1000000,
        })
        frame += 1
        const insert_keyframe = frame % 150 === 0
        this.encoder.encode(videoFrame, { keyFrame: insert_keyframe })
        this.ac.encode(ad)
        ad.close()
        videoFrame.close()
        if (frame % this.options.fps === 0) {
          console.log(this.encoder.encodeQueueSize, this.ac.encodeQueueSize)
        }
      }
      if (
        performance.now() - lastFrameTime < 16 &&
        this.encoder.encodeQueueSize < 300
      ) {
        render()
      } else {
        lastFrameTime = performance.now()
        requestAnimationFrame(render)
      }
    }
    this.recording = true
    render()
  }

  async stop() {
    Ticker.shared.start()
    this.app.chartManager.setMode(EditMode.Edit)
    Options.chart.zoom = this.cachedZoom
    Options.chart.receptorYPos = this.cachedYPosition
    this.app.updateSize()
    this.recording = false
    this.app.capturing = false

    const int = setInterval(() => {
      console.log(this.encoder.encodeQueueSize)
    }, 1000)
    await this.encoder?.flush()
    await this.ac?.flush()
    this.muxer!.finalize()
    clearInterval(int)

    const { buffer } = this.muxer!.target
    const url = URL.createObjectURL(new Blob([buffer], { type: "video/mp4" }))
    const video = document.createElement("video")
    video.setAttribute("controls", "controls")
    video.style.position = "fixed"
    video.style.bottom = "0"
    video.style.width = "500px"
    video.src = url
    document.body.appendChild(video)
    console.timeEnd("capture")
  }
}
