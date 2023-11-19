import ft from "fourier-transform/asm"
import { App } from "../../App"
import { PartialTapNotedataEntry } from "../../chart/sm/NoteTypes"
import { EventHandler } from "../../util/EventHandler"
import { clamp, unlerp } from "../../util/Math"
import { Options } from "../../util/Options"
import { WaterfallManager } from "../element/WaterfallManager"
import { Window } from "./Window"

const graphWidth = 1200
const graphHeight = 400

const FFT_SIZE = 1024
const WINDOW_STEP = FFT_SIZE / 2

const AVERAGE_WINDOW_RADIUS = 3

export class SyncWindow extends Window {
  app: App
  private onAudioLoad = this.reset.bind(this)

  private monoAudioData?: Float32Array
  private sampleRate = 44100
  private spectrogram: Float64Array[] = []
  private spectrogramDifference: Float64Array[] = []
  private noveltyCurve: number[] = []
  private noveltyCurveIsolated: number[] = []
  private spectrogramCanvas?: HTMLCanvasElement
  private lowestFinishedBlock = 0
  private renderedBlocks = 0
  private peaks: boolean[] = []
  private _threshold = 0.3

  private spectroHeights: { y: number; height: number }[] = []

  constructor(app: App) {
    super({
      title: "Sync Audio",
      width: 600,
      height: 400,
      win_id: "sync-audio",
    })
    this.app = app
    this.initView()

    this.reset()

    EventHandler.on("audioLoaded", this.onAudioLoad)
    window.pnt = this.placeNoteTest.bind(this)
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
    canvas.style.height = "400px"

    container.replaceChildren(canvas)
    this.viewElement.appendChild(container)
    const loop = this.windowLoop(canvas)
    requestAnimationFrame(loop)
  }

  async reset() {
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
    this.spectrogramCanvas.height = graphHeight * 2
    this.lowestFinishedBlock = 0
    this.renderedBlocks = 0
    this.spectrogramDifference = []
    this.noveltyCurve = []
    this.noveltyCurveIsolated = []
    this.peaks = []
  }

  windowLoop(canvas: HTMLCanvasElement) {
    const ctx = canvas.getContext("2d")!
    ctx.canvas.width = 1200
    ctx.canvas.height = 800
    ctx.imageSmoothingEnabled = false
    const call = () => {
      if (!this.app.chartManager.chartAudio) return

      const MAX_BLOCKS = Math.ceil(
        (this.monoAudioData?.length ?? 0) / WINDOW_STEP
      )

      // render new blocks
      if (this.monoAudioData) {
        const startTime = performance.now()
        while (performance.now() - startTime < 8) {
          if (
            this.lowestFinishedBlock >=
            Math.ceil(this.monoAudioData.length / WINDOW_STEP)
          )
            break
          if (this.spectrogram[this.lowestFinishedBlock] === undefined) {
            this.renderBlock(this.lowestFinishedBlock)
            this.calcDifference(this.lowestFinishedBlock)
            this.calcIsolatedNovelty(this.lowestFinishedBlock)
            this.renderedBlocks++
          }
          this.lowestFinishedBlock++
        }
      }

      // draw

      ctx.fillStyle = "rgb(11, 14, 26)"
      ctx.fillRect(0, 0, canvas.width, canvas.height)

      const zoom = Options.chart.speed / 100
      if (this.spectrogramCanvas) {
        ctx.drawImage(
          this.spectrogramCanvas,

          (this.app.chartManager.getTime() * this.sampleRate) / WINDOW_STEP -
            200 / zoom,
          0,
          graphWidth / zoom,
          graphHeight * 2,
          0,
          0,
          graphWidth,
          graphHeight * 2
        )
      }

      ctx.fillStyle = "rgba(0, 100, 150, 1)"
      ctx.textAlign = "right"
      ctx.textBaseline = "top"
      ctx.font = "22px Assistant"
      ctx.fillText(
        `${this.renderedBlocks}/${MAX_BLOCKS} blocks rendered`,
        graphWidth - 10,
        10
      )

      ctx.fillStyle = "rgba(0, 100, 150, 1)"
      ctx.textAlign = "left"
      ctx.fillText("Spectogram", 10, 10)
      ctx.fillText("Onsets", 10, graphHeight + 10)
      ctx.font = "22px Assistant"

      ctx.fillStyle = "rgba(255, 0, 0, 0.5)"
      ctx.fillRect(199, 0, 3, graphHeight * 2)

      const LEFT_BLOCK =
        (this.app.chartManager.getTime() * this.sampleRate) / WINDOW_STEP -
        200 / zoom

      const RIGHT_BLOCK =
        (this.app.chartManager.getTime() * this.sampleRate) / WINDOW_STEP +
        1000 / zoom

      for (let i = Math.floor(LEFT_BLOCK); i <= Math.ceil(RIGHT_BLOCK); i++) {
        if (this.peaks[i]) {
          ctx.fillRect(
            unlerp(LEFT_BLOCK, RIGHT_BLOCK, i) * graphWidth,
            0,
            1,
            graphHeight * 2
          )
        }
      }

      ctx.fillStyle = "rgba(255, 0, 255, 0.5)"
      ctx.fillRect(
        0,
        graphHeight * 2 - this._threshold * graphHeight,
        graphWidth,
        1
      )

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
    const response = ft(slice).slice(0)
    // log scale the response
    for (let i = 0; i < response.length; i++) {
      response[i] = Math.log(1 + 1 * response[i])
    }
    this.storeResponse(blockNum, response)
  }

  calcDifference(blockNum: number) {
    const block = this.spectrogram[blockNum].slice(0)
    const previous =
      this.spectrogram[blockNum - 1]?.slice(0) ?? new Float64Array(FFT_SIZE)
    for (let i = 0; i < block.length; i++) {
      block[i] = Math.max(0, block[i] - previous[i])
    }
    this.storeDifferenceResponse(blockNum, block)
  }

  storeResponse(blockNum: number, response: Float64Array) {
    this.spectrogram[blockNum] = response
    const ctx = this.spectrogramCanvas!.getContext("2d")!

    response.forEach((value, index) => {
      const loc = this.spectroHeights[index]
      const col = clamp(value * 2000, 0, 255)
      ctx.fillStyle = `rgba(0, ${(col * 2) / 3}, ${col}, 0.6)`
      ctx.fillRect(blockNum, loc.y, 1, loc.height)
    })
  }

  storeDifferenceResponse(blockNum: number, response: Float64Array) {
    this.spectrogramDifference[blockNum] = response

    // add up the difference in this block
    const sum = response.reduce((a, b) => a + b, 0)
    this.noveltyCurve[blockNum] = sum
  }

  calcIsolatedNovelty(blockNum: number) {
    // the new block must update old blocks
    for (let i = blockNum - AVERAGE_WINDOW_RADIUS; i <= blockNum; i++) {
      if (i < 0) continue
      let sum = 0
      let totalBlocksAvailable = 0
      // take the local average
      for (
        let j = i - AVERAGE_WINDOW_RADIUS;
        j <= i + AVERAGE_WINDOW_RADIUS;
        j++
      ) {
        if (this.noveltyCurve[j] === undefined) continue
        sum += this.noveltyCurve[j]
        totalBlocksAvailable++
      }
      sum /= totalBlocksAvailable
      this.storeIsolatedNovelty(i, Math.max(0, this.noveltyCurve[i] - sum))
    }
  }

  storeIsolatedNovelty(blockNum: number, sum: number) {
    this.noveltyCurveIsolated[blockNum] = Math.log(1 + sum)
    this.peaks[blockNum] =
      Math.log(1 + sum) > this._threshold &&
      (this.noveltyCurveIsolated[blockNum - 1] ?? 0) < this._threshold

    const ctx = this.spectrogramCanvas!.getContext("2d")!
    const height = Math.min(1, Math.log(1 + sum)) * graphHeight
    ctx.fillStyle = "rgb(11, 14, 26)"
    ctx.fillRect(blockNum, graphHeight, 1, graphHeight)
    ctx.fillStyle = `rgba(0, 100, 150, 0.5)`
    ctx.fillRect(blockNum, graphHeight * 2 - height, 1, height)
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

  get threshold() {
    return this._threshold
  }

  set threshold(value: number) {
    this._threshold = value
    this.peaks = this.noveltyCurveIsolated.map(
      (value, index) =>
        value > this._threshold &&
        (this.noveltyCurveIsolated[index - 1] ?? 0) < this._threshold
    )
  }

  placeNoteTest(quantize: number) {
    console.log(this.peaks)
    this.app.chartManager.loadedChart?.addNotes(
      this.peaks

        .map((value, index) => {
          if (!value) return null
          let b = this.app.chartManager.loadedChart!.getBeatFromSeconds(
            (index * WINDOW_STEP) / this.sampleRate
          )
          if (quantize != 0) {
            b = Math.round(b / (4 / quantize)) * (4 / quantize)
          }
          return {
            type: "Tap",
            beat: b,
            col: 5,
          } as PartialTapNotedataEntry
        })
        .filter(v => v !== null) as PartialTapNotedataEntry[]
    )
  }
}
