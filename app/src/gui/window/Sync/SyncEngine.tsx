import ft from "fourier-transform/asm"
import { Color } from "pixi.js"
import { Dispatch, SetStateAction } from "react"
import { App } from "../../../App"
import { PartialTapNotedataEntry } from "../../../chart/sm/NoteTypes"
import { blendPixiColors, average as rgbAverage } from "../../../util/Color"
import { EventHandler } from "../../../util/EventHandler"
import { clamp, lerp, roundDigit, unlerp } from "../../../util/Math"
import { Options } from "../../../util/Options"
import { Themes } from "../../../util/Theme"
import { WaterfallManager } from "../../element/WaterfallManager"
import { SyncData } from "./SyncWindow"

export const SyncGraphWidth = 800
export const SyncGraphHeight = 200

const AVERAGE_WINDOW_RADIUS = 3

const MIN_BPM = 125
const MAX_BPM = 250

const TEMPOGRAM_SMOOTHING = 3
const TEMPOGRAM_OFFSET_THRESHOLD = 0.02
const TEMPOGRAM_GROUPING_WINDOW = 6

const OFFSET_LOOKAHEAD = 800

const MAX_MS_PER_FRAME = 15

const MAX_CANVAS_LENGTH = 32768

const WEIGHT_DATA = [
  { frequency: 20, weight: 0.4006009013520281 },
  { frequency: 25, weight: 0.4258037044922291 },
  { frequency: 31.5, weight: 0.4536690484291709 },
  { frequency: 40, weight: 0.4840856831659204 },
  { frequency: 50, weight: 0.5142710208279764 },
  { frequency: 63, weight: 0.5473453749315819 },
  { frequency: 80, weight: 0.5841121495327103 },
  { frequency: 100, weight: 0.6214074879602299 },
  { frequency: 125, weight: 0.6601749463607856 },
  { frequency: 160, weight: 0.7054673721340388 },
  { frequency: 200, weight: 0.7489234225800412 },
  { frequency: 250, weight: 0.7936507936507937 },
  { frequency: 315, weight: 0.8406893652795292 },
  { frequency: 400, weight: 0.889284126278346 },
  { frequency: 500, weight: 0.9291521486643438 },
  { frequency: 630, weight: 0.9675858732462506 },
  { frequency: 800, weight: 0.9985022466300548 },
  { frequency: 1000, weight: 0.9997500624843789 },
  { frequency: 1250, weight: 0.9564801530368244 },
  { frequency: 1600, weight: 0.9409550693954364 },
  { frequency: 2000, weight: 1.0196278358399185 },
  { frequency: 2500, weight: 1.0955902492467817 },
  { frequency: 3150, weight: 1.1232799775344005 },
  { frequency: 4000, weight: 1.0914051841746248 },
  { frequency: 5000, weight: 0.9997500624843789 },
  { frequency: 6300, weight: 0.8727907484180668 },
  { frequency: 8000, weight: 0.7722007722007722 },
  { frequency: 10000, weight: 0.7369196757553427 },
  { frequency: 12500, weight: 0.7768498737618955 },
  { frequency: 16000, weight: 0.7698229407236336 },
  { frequency: 20000, weight: 0.4311738708634257 },
  { frequency: 22550, weight: 0.2 },
  { frequency: 25000, weight: 0 },
]

export class SyncEngine {
  app: App
  canvas: HTMLCanvasElement
  private onAudioLoad = this.reset.bind(this)

  windowStep = 512
  fftSize = 1024
  tempoFftSize = 4096
  tempoStep = 2

  private monoAudioData?: Float32Array
  private audioLength = 0
  private sampleRate = 44100

  private tempogram: { bpm: number; value: number }[][] = []
  private tempogramGroups: {
    center: number
    groups: { bpm: number; value: number }[]
    avg: number
  }[][] = []

  private spectrogram: Float64Array[] = []
  private spectrogramDifference: Float64Array[] = []

  private noveltyCurve: number[] = []
  private noveltyCurveIsolated: number[] = []

  private spectrogramCanvases: OffscreenCanvas[] = []

  private lowestFinishedBlock = 0
  private numRenderedBlocks = 0

  private peaks: boolean[] = []
  private _threshold = 0.3

  private spectroHeights: { y: number; height: number }[] = []
  private spectroWeights: number[] = []

  private lastSecond = -1

  runAnalysis = false
  private destroyed = false
  private setSyncData: Dispatch<SetStateAction<SyncData>>

  constructor(
    app: App,
    canvas: HTMLCanvasElement,
    setSyncData: Dispatch<SetStateAction<SyncData>>
  ) {
    this.app = app
    this.canvas = canvas
    this.setSyncData = setSyncData
    const loop = this.windowLoop(canvas)
    requestAnimationFrame(loop)

    this.reset()
    EventHandler.on("audioLoaded", this.onAudioLoad)
  }

  destroy() {
    this.destroyed = true
    EventHandler.off("audioLoaded", this.onAudioLoad)
    this.app.chartManager.chartAudio.offLoad(this.onAudioLoad)
  }

  async reset() {
    this._threshold = 0.3
    this.runAnalysis = false
    this.app.chartManager.chartAudio.onLoad(this.onAudioLoad)

    await this.getMonoAudioData()
    this.sampleRate = this.app.chartManager.chartAudio.getSampleRate()

    // Precalculate heights of spectrogram pixels
    this.spectroHeights = new Array(this.fftSize).fill(0).map((_, index) => {
      const freq = ((index / (this.fftSize / 2)) * this.sampleRate) / 2
      const freqNext =
        (((index + 1) / (this.fftSize / 2)) * this.sampleRate) / 2
      const y =
        SyncGraphHeight -
        clamp(
          (Math.log(freq / 20) / Math.log(this.sampleRate / 40)) *
            SyncGraphHeight,
          0,
          SyncGraphHeight
        )
      const yNext =
        SyncGraphHeight -
        clamp(
          (Math.log(freqNext / 20) / Math.log(this.sampleRate / 40)) *
            SyncGraphHeight,
          0,
          SyncGraphHeight
        )
      return {
        y: yNext,
        height: y - yNext,
      }
    })

    // https://www.iso.org/obp/ui/en/#!iso:std:83117:en
    this.spectroWeights = new Array(this.fftSize).fill(0).map((_, index) => {
      const freq = ((index / (this.fftSize / 2)) * this.sampleRate) / 2
      const weightIndex = WEIGHT_DATA.findIndex(point => point.frequency > freq)
      if (weightIndex < 1) return 0
      const lower = WEIGHT_DATA[weightIndex - 1]
      const higher = WEIGHT_DATA[weightIndex]
      return lerp(
        lower.weight,
        higher.weight,
        unlerp(
          Math.log(1 + lower.frequency),
          Math.log(1 + higher.frequency),
          Math.log(1 + freq)
        )
      )
    })

    const canvasLength = Math.max(
      1,
      Math.ceil(this.audioLength / this.windowStep)
    )
    this.spectrogramCanvases = []
    for (let i = 0; i < Math.ceil(canvasLength / MAX_CANVAS_LENGTH); i++) {
      const canvas = new OffscreenCanvas(
        Math.min(MAX_CANVAS_LENGTH, canvasLength - i * MAX_CANVAS_LENGTH),
        SyncGraphHeight * 2
      )
      this.spectrogramCanvases.push(canvas)
    }

    this.spectrogram = []
    this.lowestFinishedBlock = 0
    this.numRenderedBlocks = 0
    this.spectrogramDifference = []
    this.noveltyCurve = []
    this.noveltyCurveIsolated = []
    this.peaks = []
    this.tempogram = []
    this.tempogramGroups = []
    this.setSyncData({
      hasData: false,
      bpms: [],
      offsets: [],
      offsetBPM: 0,
      state: "idle",
      percentage: 0,
      numOnsets: 0,
    })
  }

  hasData() {
    return this.numRenderedBlocks > 0
  }

  windowLoop(canvas: HTMLCanvasElement) {
    const ctx = canvas.getContext("2d")!
    ctx.canvas.width = SyncGraphWidth
    ctx.canvas.height = SyncGraphHeight * 2
    ctx.imageSmoothingEnabled = false
    const update = () => {
      if (!this.app.chartManager.chartAudio) return

      const MAX_BLOCKS = Math.ceil(this.audioLength / this.windowStep)

      // Render new blocks
      if (this.monoAudioData !== undefined && this.runAnalysis) {
        const startTime = performance.now()
        while (performance.now() - startTime < MAX_MS_PER_FRAME) {
          if (this.lowestFinishedBlock >= MAX_BLOCKS) {
            if (this.tempogram.length == 0) {
              this.calcTempogram()
            }
            break
          }
          if (this.spectrogram[this.lowestFinishedBlock] === undefined) {
            this.renderBlock(this.lowestFinishedBlock)
            this.calcDifference(this.lowestFinishedBlock)
            this.calcIsolatedNovelty(this.lowestFinishedBlock)
            this.numRenderedBlocks++
          }
          this.lowestFinishedBlock++
          if (this.lowestFinishedBlock < MAX_BLOCKS) {
            this.setSyncData(old => {
              return {
                ...old,
                hasData: true,
                state: "spectogram",
                percentage: this.lowestFinishedBlock / MAX_BLOCKS,
              }
            })
          }
        }
      }

      ctx.clearRect(0, 0, canvas.width, canvas.height)

      const zoom = Options.chart.speed / 40

      const leftBoundBlockNum =
        (this.app.chartManager.time * this.sampleRate) / this.windowStep -
        (SyncGraphWidth * 0.2) / zoom

      const rightBoundBlockNum =
        (this.app.chartManager.time * this.sampleRate) / this.windowStep +
        (SyncGraphWidth * 0.8) / zoom

      for (
        let i = Math.floor(leftBoundBlockNum / MAX_CANVAS_LENGTH);
        i <= Math.floor(rightBoundBlockNum / MAX_CANVAS_LENGTH);
        i++
      ) {
        const canvas = this.spectrogramCanvases[i]
        if (!canvas) continue
        ctx.drawImage(
          canvas,
          (this.app.chartManager.time * this.sampleRate) / this.windowStep -
            (SyncGraphWidth * 0.2) / zoom -
            MAX_CANVAS_LENGTH * i,
          0,
          SyncGraphWidth / zoom,
          SyncGraphHeight * 2,
          0,
          0,
          SyncGraphWidth,
          SyncGraphHeight * 2
        )
      }

      ctx.globalCompositeOperation = "source-atop"

      let targetColor
      if (rgbAverage(Themes.getColor("primary-bg")) > 0.5) {
        targetColor = new Color("white")
      } else {
        targetColor = new Color("black")
      }

      ctx.fillStyle = blendPixiColors(
        Themes.getColor("accent-color"),
        targetColor,
        0.1
      ).toHexa()
      ctx.fillRect(0, 0, canvas.width, canvas.height)

      ctx.globalCompositeOperation = "destination-over"

      ctx.fillStyle = blendPixiColors(
        Themes.getColor("accent-color"),
        targetColor,
        0.9
      ).toHexa()
      ctx.fillRect(0, 0, canvas.width, canvas.height)

      ctx.globalCompositeOperation = "source-over"

      // draw current measure lines

      const leftBoundSecond =
        (leftBoundBlockNum * this.windowStep) / this.sampleRate
      const rightBoundSecond =
        (rightBoundBlockNum * this.windowStep) / this.sampleRate

      if (this.app.chartManager.loadedChart) {
        const leftBoundBeat =
          this.app.chartManager.loadedChart.getBeatFromSeconds(leftBoundSecond)
        const rightBoundBeat =
          this.app.chartManager.loadedChart.getBeatFromSeconds(
            Math.min(
              rightBoundSecond,
              this.app.chartManager.chartAudio.getSongLength()
            )
          )

        ctx.fillStyle = "rgba(255, 255, 255, 0.2)"

        for (const [
          barBeat,
          isMeasure,
        ] of this.app.chartManager.loadedChart.timingData.getMeasureBeats(
          leftBoundBeat,
          rightBoundBeat
        )) {
          const barSecond =
            this.app.chartManager.loadedChart.getSecondsFromBeat(barBeat)
          ctx.fillRect(
            unlerp(leftBoundSecond, rightBoundSecond, barSecond) *
              SyncGraphWidth -
              (isMeasure ? 2 : 1),
            0,
            isMeasure ? 5 : 3,
            SyncGraphHeight * 1.5
          )
        }
      }

      // Draw onset red lines

      ctx.fillStyle = "rgba(255, 0, 0, 0.3)"

      for (
        let i = Math.floor(leftBoundBlockNum);
        i <= Math.ceil(rightBoundBlockNum);
        i++
      ) {
        if (this.peaks[i]) {
          ctx.fillRect(
            unlerp(leftBoundBlockNum, rightBoundBlockNum, i) * SyncGraphWidth -
              0.5,
            0,
            2,
            SyncGraphHeight * 1.5
          )
        }
      }

      ctx.fillStyle = "rgba(50, 255, 20, 0.3)"

      ctx.fillRect(SyncGraphWidth * 0.2 - 1, 0, 3, SyncGraphHeight * 2)

      // Draw threshold line
      ctx.fillStyle = "rgba(255, 0, 255, 0.5)"
      ctx.fillRect(
        0,
        SyncGraphHeight * 1.5 - this._threshold * SyncGraphHeight * 0.5,
        SyncGraphWidth,
        1
      )

      const currentTempoBlock = Math.round(
        (this.app.chartManager.time * this.sampleRate) /
          this.windowStep /
          this.tempoStep
      )

      ctx.fillStyle = Themes.getColor("accent-color").toHex()
      ctx.textAlign = "right"
      ctx.textBaseline = "top"
      ctx.font = "22px Assistant"
      ctx.fillText(
        `${this.numRenderedBlocks}/${MAX_BLOCKS} blocks rendered`,
        SyncGraphWidth - 10,
        10
      )

      ctx.textAlign = "right"
      ctx.textBaseline = "middle"
      if (this.tempogramGroups[currentTempoBlock]) {
        const aggregateTempos = []
        for (const data of this.tempogramGroups[currentTempoBlock]) {
          // Take the local average
          let weightsTotal = 0
          let bpmTotal = 0
          let totalBlocksAvailable = 0
          for (
            let j = currentTempoBlock - TEMPOGRAM_SMOOTHING;
            j <= currentTempoBlock + TEMPOGRAM_SMOOTHING;
            j++
          ) {
            if (this.tempogramGroups[j] === undefined) continue
            const closestGroup = this.tempogramGroups[j].find(
              group =>
                group.center < data.center + TEMPOGRAM_GROUPING_WINDOW &&
                group.center > data.center - TEMPOGRAM_GROUPING_WINDOW
            )
            if (closestGroup === undefined) continue
            weightsTotal += closestGroup.groups[0].value
            bpmTotal += closestGroup.avg
            totalBlocksAvailable++
          }
          weightsTotal /= totalBlocksAvailable
          bpmTotal /= totalBlocksAvailable

          aggregateTempos.push({
            bpm: bpmTotal,
            weight: data.groups[0].value,
            smoothedWeight: weightsTotal,
          })
        }

        aggregateTempos.sort((a, b) => b.smoothedWeight - a.smoothedWeight)

        for (const result of aggregateTempos) {
          if (result.weight < 0.01) continue
          ctx.font = `${18 + result.weight * 300}px Assistant`
          ctx.globalAlpha = Math.min(1, result.weight * 100)
          ctx.fillText(
            roundDigit(result.bpm, 0) + "",
            200,
            lerp(
              SyncGraphHeight * 2,
              SyncGraphHeight * 1.5,
              unlerp(MIN_BPM, MAX_BPM, result.bpm)
            )
          )
        }

        // Update tables

        if (this.lastSecond != this.app.chartManager.time) {
          this.lastSecond = this.app.chartManager.time

          const totalConfidence = aggregateTempos
            .slice(0, 5)
            .reduce((a, b) => a + b.smoothedWeight, 0)
          const bpmWeights = aggregateTempos.slice(0, 5).map(tempo => {
            return {
              bpm: tempo.bpm,
              confidence: tempo.smoothedWeight / totalConfidence,
            }
          })
          this.setSyncData(old => {
            return {
              ...old,
              bpms: bpmWeights,
            }
          })
        }
      }

      // Draw labels
      ctx.globalAlpha = 1
      ctx.font = "22px Assistant"
      ctx.textAlign = "left"
      ctx.textBaseline = "top"
      ctx.fillText("Spectrogram", 10, 10)
      ctx.fillText("Onsets", 10, SyncGraphHeight + 10)
      ctx.fillText("Tempogram", 10, SyncGraphHeight * 1.5 + 10)

      if (!this.destroyed) requestAnimationFrame(update)
    }
    return update
  }

  renderBlock(blockNum: number) {
    if (!this.monoAudioData) return
    // Get a chunk of the audio data
    const slice = new Float32Array(this.fftSize)
    slice.set(
      this.monoAudioData.subarray(
        Math.max(0, blockNum * this.windowStep - this.fftSize / 2),
        blockNum * this.windowStep + this.fftSize / 2
      ),
      -Math.min(0, blockNum * this.windowStep - this.fftSize / 2)
    )

    // apply hanning window
    for (let i = 0; i < slice.length; i++) {
      slice[i] *= 0.5 * (1 - Math.cos(Math.PI * 2 * (i / this.fftSize)))
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
      this.spectrogram[blockNum - 1]?.slice(0) ?? new Float64Array(this.fftSize)
    for (let i = 0; i < block.length; i++) {
      block[i] = Math.max(0, block[i] - previous[i]) * this.spectroWeights[i]
    }
    this.storeDifferenceResponse(blockNum, block)
  }

  storeResponse(blockNum: number, response: Float64Array) {
    this.spectrogram[blockNum] = response
    const ctx =
      this.spectrogramCanvases[
        Math.floor(blockNum / MAX_CANVAS_LENGTH)
      ].getContext("2d")!

    ctx.fillStyle = "white"
    response.forEach((value, index) => {
      const loc = this.spectroHeights[index]
      const col = clamp(value * 2000, 0, 255)
      ctx.globalAlpha = col / 255
      ctx.fillRect(blockNum % MAX_CANVAS_LENGTH, loc.y, 1, loc.height)
    })
    ctx.globalAlpha = 1
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
    if (
      Math.log(1 + sum) > this._threshold &&
      Math.log(1 + sum) > (this.noveltyCurveIsolated[blockNum - 1] ?? 0)
    ) {
      // Only mark this is a peak if its difference is larger than the last one (perceived onset)
      if (this.peaks[blockNum - 1]) {
        this.peaks[blockNum - 1] = false
      }
      this.peaks[blockNum] = true
      this.setSyncData(old => {
        return {
          ...old,
          numOnsets: this.peaks.filter(x => x).length,
        }
      })
    } else {
      this.peaks[blockNum] = false
    }

    const ctx =
      this.spectrogramCanvases[
        Math.floor(blockNum / MAX_CANVAS_LENGTH)
      ].getContext("2d")!
    const height = Math.min(1, Math.log(1 + sum)) * SyncGraphHeight * 0.5
    // ctx.fillRect(
    //   blockNum % MAX_CANVAS_LENGTH,
    //   graphHeight,
    //   1,
    //   graphHeight * 0.5
    // )
    ctx.fillStyle = "white"
    ctx.fillRect(
      blockNum % MAX_CANVAS_LENGTH,
      SyncGraphHeight * 1.5 - height,
      1,
      height
    )
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
        this.audioLength = this.monoAudioData.length
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
    this.setSyncData(old => {
      return {
        ...old,
        numOnsets: this.peaks.filter(x => x).length,
      }
    })
  }

  calculateOffset() {
    const topBPM = new Map<number, number>()
    let highestCount = 0
    let peakScanStart = 0
    let firstBPM = 0
    // find the top bpm
    for (let i = 0; i < this.tempogramGroups.length; i++) {
      const groups = this.tempogramGroups[i]
      const candidates = groups.filter(
        group => group.groups[0].value >= TEMPOGRAM_OFFSET_THRESHOLD
      )
      if (candidates.length == 0) continue
      peakScanStart = i
      candidates.forEach(group => {
        let totalBlocksAvailable = 0
        let bpmTotal = 0
        for (
          let j = i - TEMPOGRAM_SMOOTHING;
          j <= i + TEMPOGRAM_SMOOTHING;
          j++
        ) {
          if (this.tempogramGroups[j] === undefined) continue
          const closestGroup = this.tempogramGroups[j].find(
            ogroup =>
              ogroup.center < group.center + TEMPOGRAM_GROUPING_WINDOW &&
              ogroup.center > group.center - TEMPOGRAM_GROUPING_WINDOW
          )
          if (closestGroup === undefined) continue
          bpmTotal += closestGroup.avg
          totalBlocksAvailable++
        }
        const bpm = Math.round(bpmTotal / totalBlocksAvailable)
        if (!topBPM.has(bpm)) {
          topBPM.set(bpm, 0)
        }
        topBPM.set(bpm, topBPM.get(bpm)! + 1)
        if (topBPM.get(bpm)! > highestCount) {
          highestCount = topBPM.get(bpm)!
          firstBPM = bpm
        }
      })
      if (highestCount > 50) break
    }
    if (firstBPM == 0) return
    const beatLengthBlocks =
      (60 / firstBPM) * (this.sampleRate / this.windowStep)
    const analyzeWave = new Array(OFFSET_LOOKAHEAD).fill(0).map((_, i) => {
      const beatBlock = (i % beatLengthBlocks) / beatLengthBlocks
      let t = 0
      let n = 0
      for (let j = 1; j <= 4; j++) {
        n +=
          (Math.max(
            1 - Math.abs(Math.round(beatBlock * j) / j - beatBlock) * 12,
            0
          ) *
            1) /
          j
        t += 1 / j
      }
      return n / t
    })

    const options = []
    for (let i = peakScanStart; i < peakScanStart + beatLengthBlocks; i++) {
      const response = this.noveltyCurveIsolated
        .slice(i, i + OFFSET_LOOKAHEAD)
        .map((v, i) => {
          return analyzeWave[i] * v
        })
        .reduce((a, b) => a + b, 0)

      options.push({
        block: i,
        offset: -((i * this.windowStep) / this.sampleRate) % (60 / firstBPM),
        response: response,
        curve: this.noveltyCurveIsolated
          .slice(i, i + OFFSET_LOOKAHEAD)
          .map((v, i) => {
            return analyzeWave[i] * v
          }),
      })
    }

    options.sort((a, b) => b.response - a.response)
    const totalResponse = options
      .slice(0, 5)
      .reduce((a, b) => a + b.response, 0)
    const topOffsets = options.slice(0, 5).map(option => {
      return {
        offset: option.offset,
        confidence: option.response / totalResponse,
      }
    })
    this.setSyncData(old => {
      return {
        ...old,
        offsetBPM: firstBPM,
        offsets: topOffsets,
      }
    })
  }

  placeOnsets(selection = false) {
    const notes = this.peaks
      .map((value, index) => {
        if (!value) return null
        let beat = this.app.chartManager.loadedChart!.getBeatFromSeconds(
          (index * this.windowStep) / this.sampleRate
        )
        beat = Math.round(beat * 48) / 48
        if (beat < 0) return null
        return {
          type: "Tap",
          beat,
          col: 0,
        } as PartialTapNotedataEntry
      })
      .filter(note => note !== null)
      .filter(note => {
        if (!selection) return true
        return (
          note.beat > this.app.chartManager.startRegion! &&
          note.beat < this.app.chartManager.endRegion!
        )
      })
    WaterfallManager.create(`Placed ${notes.length} onsets as notes`)

    this.app.chartManager.insertNotes(notes)
  }

  calcTempogram() {
    // scale the novelty curve to max 1
    let max = 0
    for (let i = 0; i < this.noveltyCurveIsolated.length; i++) {
      if (this.noveltyCurveIsolated[i] > max) {
        max = this.noveltyCurveIsolated[i]
      }
    }

    const scaled = new Float32Array(this.noveltyCurveIsolated.length)

    for (let i = 0; i < this.noveltyCurveIsolated.length; i++) {
      scaled[i] = this.noveltyCurveIsolated[i] / max
    }

    const MAX_BLOCKS = Math.ceil(scaled.length / this.tempoStep)

    let frameTime = performance.now()
    const processBlock = (blockNum: number) => {
      const slice = new Float32Array(this.tempoFftSize)
      slice.set(
        scaled.subarray(
          Math.max(0, blockNum * this.tempoStep - this.tempoFftSize / 2),
          blockNum * this.tempoStep + this.tempoFftSize / 2
        ),
        -Math.min(0, blockNum * this.tempoStep - this.tempoFftSize / 2)
      )
      // apply hanning window
      for (let i = 0; i < slice.length; i++) {
        slice[i] *= 0.5 * (1 - Math.cos(Math.PI * 2 * (i / this.tempoFftSize)))
      }
      const response = ft(slice).slice(0)
      // log scale the response
      for (let i = 0; i < response.length; i++) {
        response[i] = Math.log(1 + 1 * response[i])
      }
      this.storeTempogram(blockNum, response)

      if (blockNum < MAX_BLOCKS) {
        if (performance.now() - frameTime < MAX_MS_PER_FRAME) {
          processBlock(++blockNum)
        } else {
          frameTime = performance.now()
          this.setSyncData(old => {
            return {
              ...old,
              state: "tempogram",
              percentage: blockNum / MAX_BLOCKS,
            }
          })
          setTimeout(() => processBlock(++blockNum), 1)
        }
      } else {
        this.setSyncData(old => {
          return {
            ...old,
            state: "finished",
            percentage: 1,
          }
        })
        this.calculateOffset()
        this.spectrogram = []
        this.noveltyCurve = []
        this.tempogram = []
        this.monoAudioData = undefined
        this.runAnalysis = false
      }
    }
    processBlock(0)
  }

  storeTempogram(blockNum: number, response: Float64Array) {
    const tempos = new Map<number, number>()
    const groups: {
      center: number
      groups: { bpm: number; value: number }[]
    }[] = []

    // Reduce tempos
    response.forEach((value, index) => {
      let tmp =
        ((this.sampleRate * 60) / (this.windowStep * this.tempoFftSize)) * index
      if (tmp > MAX_BPM * 4 || tmp < MIN_BPM / 4) return
      while (tmp > MAX_BPM && tmp != Infinity) tmp /= 2
      while (tmp < MIN_BPM && tmp != 0) tmp *= 2
      if (!tempos.has(roundDigit(tmp, 3))) tempos.set(roundDigit(tmp, 3), 0)
      tempos.set(roundDigit(tmp, 3), tempos.get(roundDigit(tmp, 3))! + value)
    })

    this.tempogram[blockNum] = [...tempos.entries()]
      .map(([k, v]) => {
        return { bpm: k, value: v }
      })
      .sort((a, b) => b.value - a.value)
      .filter(a => a.value != 0)

    // Group
    for (let i = 0; i < Math.min(this.tempogram[blockNum].length, 10); i++) {
      const tempo = this.tempogram[blockNum][i]
      const closestGroup = groups.find(
        group =>
          group.center < tempo.bpm + TEMPOGRAM_GROUPING_WINDOW &&
          group.center > tempo.bpm - TEMPOGRAM_GROUPING_WINDOW
      )
      if (closestGroup === undefined) {
        groups.push({ center: tempo.bpm, groups: [tempo] })
        continue
      }
      closestGroup.groups.push(tempo)
    }
    this.tempogramGroups[blockNum] = groups.map(data => {
      return {
        ...data,
        avg:
          data.groups.reduce((p, c) => p + c.bpm * c.value, 0) /
          data.groups.reduce((p, c) => p + c.value, 0),
      }
    })
    const ctx =
      this.spectrogramCanvases[
        Math.floor((blockNum * this.tempoStep) / MAX_CANVAS_LENGTH)
      ].getContext("2d")!

    ctx.fillStyle = "white"
    this.tempogram[blockNum].forEach(data => {
      const col = clamp(data.value * 8000, 0, 255)
      ctx.globalAlpha = col / 255
      ctx.fillRect(
        (blockNum * this.tempoStep) % MAX_CANVAS_LENGTH,
        lerp(
          SyncGraphHeight * 2,
          SyncGraphHeight * 1.5,
          unlerp(MIN_BPM, MAX_BPM, data.bpm)
        ),
        1 * this.tempoStep,
        (SyncGraphHeight * 0.5) / (MAX_BPM - MIN_BPM)
      )
    })
  }
}
