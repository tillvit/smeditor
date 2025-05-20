import { ArrayBufferTarget, Muxer } from "mp4-muxer"
import { Ticker } from "pixi.js"
import { App } from "../App"
import { EditMode } from "../chart/ChartManager"
import { TIMING_WINDOW_AUTOPLAY } from "../chart/play/StandardTimingWindow"
import { Options } from "./Options"
import { bsearch } from "./Util"

interface CaptureOptions {
  aspectRatio: number
  videoHeight: number
  fps: number
  bitrate: number
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

  async renderBufferWithVolume(
    buffer: AudioBuffer,
    volume: number,
    sampleRate: number
  ): Promise<AudioBuffer> {
    const offlineCtx = new OfflineAudioContext(
      buffer.numberOfChannels,
      buffer.duration * sampleRate,
      sampleRate
    )

    const gainNode = offlineCtx.createGain()
    gainNode.gain.setValueAtTime(volume, 0)

    const offlineSource = offlineCtx.createBufferSource()
    offlineSource.buffer = buffer
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
    sampleRate: number
  ) {
    let assistTick = this.app.chartManager.assistTick.getBuffer()
    assistTick = await this.renderBufferWithVolume(
      assistTick,
      Options.audio.soundEffectVolume * Options.audio.masterVolume,
      sampleRate
    )

    const buffer = new AudioBuffer({
      length: Math.floor((endTime - startTime) * sampleRate),
      sampleRate,
      numberOfChannels: 2,
    })
    const chart = this.app.chartManager.loadedChart!
    const startBeat = chart.getBeatFromSeconds(startTime)
    const endBeat = chart.getBeatFromSeconds(endTime)
    const notedata = chart.getNotedataInRange(startBeat, endBeat)

    let lastBeat = -1
    for (const note of notedata) {
      if (note.beat == lastBeat) {
        continue
      }
      lastBeat = note.beat
      if (chart.gameType.gameLogic.shouldAssistTick(note)) {
        const startSample = Math.floor((note.second - startTime) * sampleRate)
        for (let i = 0; i < buffer.numberOfChannels; i++) {
          const channel = buffer.getChannelData(i)
          for (let j = 0; j < assistTick.length; j++) {
            if (startSample + j >= channel.length) break
            channel[startSample + j] += assistTick.getChannelData(
              i % assistTick.numberOfChannels
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
    audioBuf = await this.renderBufferWithVolume(
      audioBuf,
      Options.audio.songVolume * Options.audio.masterVolume,
      audioBuf.sampleRate
    )

    // calculate note flash index
    let noteFlashIndex = 0

    noteFlashIndex = bsearch(chart.getNotedata(), startTime, a => a.second) + 1
    if (
      noteFlashIndex >= 1 &&
      startTime <= chart.getNotedata()[noteFlashIndex - 1].second
    )
      noteFlashIndex--

    // mix assist sounds
    const assistSounds = await this.createAssistSounds(
      startTime,
      endTime,
      audioBuf.sampleRate
    )

    const render = async () => {
      if (!this.recording) return

      if (this.encoder.encodeQueueSize < 300) {
        const time = frame / this.options.fps + startTime
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
          if (
            chart.gameType.gameLogic.shouldAssistTick(notedata[noteFlashIndex])
          ) {
            this.app.chartManager.chartView!.doJudgement(
              notedata[noteFlashIndex],
              0,
              TIMING_WINDOW_AUTOPLAY
            )
          }
          noteFlashIndex++
        }

        this.app.renderer.render(this.app.stage)

        const videoFrame = new VideoFrame(this.app.view, {
          timestamp: (frame / this.options.fps) * 1000000,
        })

        const numFrames =
          Math.floor((time + 1 / this.options.fps) * audioBuf.sampleRate) -
          Math.ceil(time * audioBuf.sampleRate)
        const dataBuf = new Float32Array(numFrames * audioBuf.numberOfChannels)
        for (let i = 0; i < audioBuf.numberOfChannels; i++) {
          const channel = audioBuf.getChannelData(i)
          dataBuf.set(
            channel.subarray(
              Math.ceil(time * audioBuf.sampleRate),
              Math.floor((time + 1 / this.options.fps) * audioBuf.sampleRate)
            ),
            i * numFrames
          )

          // mix assist sounds
          const assistChannel = assistSounds.getChannelData(i)

          const startSample = Math.ceil(
            (time - startTime) * audioBuf.sampleRate
          )
          const endSample = Math.floor(
            (time - startTime + 1 / this.options.fps) * audioBuf.sampleRate
          )
          for (let j = startSample; j < endSample; j++) {
            if (j >= assistChannel.length) break
            dataBuf[i * numFrames + j - startSample] += assistChannel[j]
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
        console.log(this.encoder.encodeQueueSize, this.ac.encodeQueueSize)
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
