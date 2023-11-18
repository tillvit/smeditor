import ft from "fourier-transform/asm"
import { App } from "../../App"
import { EventHandler } from "../../util/EventHandler"
import { clamp } from "../../util/Math"
import { Options } from "../../util/Options"
import { WaterfallManager } from "../element/WaterfallManager"
import { Window } from "./Window"

const graphWidth = 1200
const graphHeight = 400

const FFT_SIZE = 512
const WINDOW_STEP = FFT_SIZE / 2

export class SyncWindow extends Window {
  app: App
  private onAudioLoad = this.reset.bind(this)
  private monoAudioData?: Float32Array
  private sampleRate = 44100
  private spectrogram: Float64Array[] = []
  private spectrogramCanvas?: HTMLCanvasElement

  private spectroHeights: { y: number; height: number }[] = []

  constructor(app: App) {
    super({
      title: "Sync Audio",
      width: 600,
      height: 200,
      win_id: "sync-audio",
    })
    this.app = app
    this.initView()

    this.reset()

    window.renderBlock = this.renderBlock.bind(this)

    EventHandler.on("audioLoaded", this.onAudioLoad)
  }

  destroy() {
    EventHandler.off("audioLoaded", this.onAudioLoad)
  }

  initView() {
    this.viewElement.replaceChildren()

    const container = document.createElement("div")
    container.classList.add("eq-container")

    const canvas = document.createElement("canvas")
    canvas.style.width = "600px"
    canvas.style.height = "200px"

    container.replaceChildren(canvas)
    this.viewElement.appendChild(container)
    const frameDraw = this.drawSpectrogram(canvas)
    requestAnimationFrame(frameDraw)
  }

  async reset() {
    console.log("resetti")

    await this.getMonoAudioData()
    this.sampleRate = this.app.chartManager.chartAudio.getSampleRate()
    this.spectroHeights = new Array(FFT_SIZE).fill(0).map((_, index) => {
      const freq = ((index / (FFT_SIZE / 2)) * this.sampleRate) / 2
      const freqNext = (((index + 1) / (FFT_SIZE / 2)) * this.sampleRate) / 2
      const y =
        graphHeight -
        clamp(
          (Math.log(freq / 20) / Math.log(this.sampleRate / 40)) * graphHeight,
          0,
          graphHeight
        )
      const yNext =
        graphHeight -
        clamp(
          (Math.log(freqNext / 20) / Math.log(this.sampleRate / 40)) *
            graphHeight,
          0,
          graphHeight
        )
      return {
        y: yNext,
        height: y - yNext,
      }
    })
    this.spectrogram = []
    this.spectrogramCanvas = document.createElement("canvas")
    this.spectrogramCanvas.width = Math.ceil(
      this.monoAudioData!.length / WINDOW_STEP
    )
    this.spectrogramCanvas.height = graphHeight
  }

  drawSpectrogram(canvas: HTMLCanvasElement) {
    const ctx = canvas.getContext("2d")!
    ctx.canvas.width = 1200
    ctx.canvas.height = 400
    const call = () => {
      if (!this.app.chartManager.chartAudio) return
      ctx.fillStyle = "rgb(11, 14, 26)"
      ctx.fillRect(0, 0, canvas.width, canvas.height)

      if (this.spectrogramCanvas) {
        const zoom = Options.chart.speed / 100
        ctx.drawImage(
          this.spectrogramCanvas,

          (this.app.chartManager.getTime() * this.sampleRate) / WINDOW_STEP -
            200 / zoom,
          0,
          graphWidth / zoom,
          graphHeight,
          0,
          0,
          graphWidth,
          graphHeight
        )
      }

      ctx.fillStyle = "rgba(255, 0, 0, 0.5)"
      ctx.fillRect(200, 0, 1, graphHeight)

      if (canvas.closest("#windows")) requestAnimationFrame(call)
    }
    return call
  }

  renderBlock(blockNum: number) {
    if (!this.monoAudioData) return
    // Get a chunk of the audio data
    const slice = new Float32Array(FFT_SIZE)
    slice.set(
      this.monoAudioData.subarray(
        blockNum * WINDOW_STEP,
        blockNum * WINDOW_STEP + FFT_SIZE
      )
    )

    // apply hanning window
    for (let i = 0; i < slice.length; i++) {
      slice[i] *= 0.5 * (1 - Math.cos(Math.PI * 2 * (i / FFT_SIZE)))
    }
    const response = ft(slice)
    // console.log(response)
    this.storeResponse(blockNum, response)
  }

  storeResponse(blockNum: number, response: Float64Array) {
    this.spectrogram[blockNum] = response
    const ctx = this.spectrogramCanvas!.getContext("2d")!

    response.forEach((value, index) => {
      const loc = this.spectroHeights[index]
      const col = clamp(value * 2000, 0, 255)
      ctx.fillStyle = `rgba(0, ${(col * 2) / 3}, ${col}, 0.5)`
      ctx.fillRect(blockNum, loc.y, 1, loc.height)
    })
  }

  async getMonoAudioData() {
    const audio = this.app.chartManager.chartAudio
    if (!audio) return
    const buffer = audio.getBuffer()
    const ac = new OfflineAudioContext(
      buffer.numberOfChannels,
      buffer.length,
      buffer.sampleRate
    )
    const source = ac.createBufferSource()
    source.buffer = buffer
    const merger = ac.createChannelMerger(buffer.numberOfChannels)
    source.connect(merger)
    merger.connect(ac.destination)

    source.start()
    await ac
      .startRendering()
      .then(renderedBuffer => {
        this.monoAudioData = renderedBuffer.getChannelData(0)
        // console.log(this.monoAudioData)
      })
      .catch(() => {
        WaterfallManager.createFormatted(
          "Failed to load audio: audio rendering failed",
          "error"
        )
      })
  }
}
