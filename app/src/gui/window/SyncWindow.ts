import ft from "fourier-transform/asm"
import { App } from "../../App"
import { PartialTapNotedataEntry } from "../../chart/sm/NoteTypes"
import { EventHandler } from "../../util/EventHandler"
import { clamp, lerp, roundDigit, unlerp } from "../../util/Math"
import { Options } from "../../util/Options"
import { WaterfallManager } from "../element/WaterfallManager"
import { Window } from "./Window"

const graphWidth = 1200
const graphHeight = 400

const FFT_SIZE = 1024
const WINDOW_STEP = 512

const TEMPO_FFT_SIZE = 2048
const TEMPO_STEP = 2

const AVERAGE_WINDOW_RADIUS = 3

const MIN_BPM = 125
const MAX_BPM = 250

const TEMPOGRAM_SMOOTHING = 3
const TEMPOGRAM_THRESHOLD = 0.015
const TEMPOGRAM_GROUPING_WINDOW = 6

const MAX_MS_PER_FRAME = 15

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

export class SyncWindow extends Window {
  app: App
  private onAudioLoad = this.reset.bind(this)

  private monoAudioData?: Float32Array
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
  private spectrogramCanvas?: HTMLCanvasElement
  private lowestFinishedBlock = 0
  private renderedBlocks = 0
  private peaks: boolean[] = []
  private _threshold = 0.3

  private spectroHeights: { y: number; height: number }[] = []
  private spectroWeights: number[] = []

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
    window.ft = ft
    window.gbpm = () => {
      if (this.tempogram) {
        const blockNum = Math.round(
          (this.app.chartManager.getTime() * this.sampleRate) /
            WINDOW_STEP /
            TEMPO_STEP
        )
        console.log(this.tempogram[blockNum])
        console.log(this.tempogramGroups[blockNum])
      }
    }
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
    this.app.chartManager.chartAudio.onLoad(() => this.reset())

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
    this.spectroWeights = new Array(FFT_SIZE).fill(0).map((_, index) => {
      const freq = ((index / (FFT_SIZE / 2)) * this.sampleRate) / 2
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
    this.spectrogram = []
    this.spectrogramCanvas = document.createElement("canvas")
    this.spectrogramCanvas.width = Math.ceil(
      this.monoAudioData!.length / WINDOW_STEP
    )
    const ctx = this.spectrogramCanvas.getContext("2d")!
    this.spectrogramCanvas.height = graphHeight * 2
    ctx.fillStyle = `rgba(0, 0, 0, 0.6)`
    ctx.fillRect(0, 0, this.spectrogramCanvas.width, graphHeight)
    ctx.fillRect(
      0,
      graphHeight * 1.5,
      this.spectrogramCanvas.width,
      graphHeight * 0.5
    )
    this.lowestFinishedBlock = 0
    this.renderedBlocks = 0
    this.spectrogramDifference = []
    this.noveltyCurve = []
    this.noveltyCurveIsolated = []
    this.peaks = []
    this.tempogram = []
    this.tempogramGroups = []
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
        while (performance.now() - startTime < MAX_MS_PER_FRAME) {
          if (
            this.lowestFinishedBlock >=
            Math.ceil(this.monoAudioData.length / WINDOW_STEP)
          ) {
            if (this.tempogram.length == 0) {
              this.calcTempogram()
            }
            break
          }
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

      // draw current measure lines

      const LEFT_BLOCK =
        (this.app.chartManager.getTime() * this.sampleRate) / WINDOW_STEP -
        200 / zoom

      const RIGHT_BLOCK =
        (this.app.chartManager.getTime() * this.sampleRate) / WINDOW_STEP +
        1000 / zoom

      const LEFT_SECOND = (LEFT_BLOCK * WINDOW_STEP) / this.sampleRate
      const RIGHT_SECOND = (RIGHT_BLOCK * WINDOW_STEP) / this.sampleRate

      if (this.app.chartManager.loadedChart) {
        const LEFT_BEAT =
          this.app.chartManager.loadedChart.getBeatFromSeconds(LEFT_SECOND)
        const RIGHT_BEAT = this.app.chartManager.loadedChart.getBeatFromSeconds(
          Math.min(
            RIGHT_SECOND,
            this.app.chartManager.chartAudio.getSongLength()
          )
        )

        ctx.fillStyle = "rgba(255, 255, 255, 0.2)"

        for (const [barBeat, isMeasure] of this.getBarlineBeats(
          LEFT_BEAT,
          RIGHT_BEAT
        )) {
          const barSecond =
            this.app.chartManager.loadedChart.getSecondsFromBeat(barBeat)
          ctx.fillRect(
            unlerp(LEFT_SECOND, RIGHT_SECOND, barSecond) * graphWidth -
              (isMeasure ? 2 : 1),
            0,
            isMeasure ? 5 : 3,
            graphHeight * 1.5
          )
        }
      }

      // draw onset red lines

      ctx.fillStyle = "rgba(255, 0, 0, 0.3)"

      for (let i = Math.floor(LEFT_BLOCK); i <= Math.ceil(RIGHT_BLOCK); i++) {
        if (this.peaks[i]) {
          ctx.fillRect(
            unlerp(LEFT_BLOCK, RIGHT_BLOCK, i) * graphWidth - 0.5,
            0,
            2,
            graphHeight * 1.5
          )
        }
      }

      ctx.fillRect(199, 0, 3, graphHeight * 2)

      const blockNum = Math.round(
        (this.app.chartManager.getTime() * this.sampleRate) /
          WINDOW_STEP /
          TEMPO_STEP
      )

      ctx.fillStyle = "rgba(255, 0, 255, 0.5)"
      ctx.fillRect(
        0,
        graphHeight * 1.5 - this._threshold * graphHeight * 0.5,
        graphWidth,
        1
      )

      ctx.fillStyle = "rgba(0, 150, 255, 1)"
      ctx.textAlign = "right"
      ctx.textBaseline = "top"
      ctx.font = "22px Assistant"
      ctx.fillText(
        `${this.renderedBlocks}/${MAX_BLOCKS} blocks rendered`,
        graphWidth - 10,
        10
      )

      ctx.textAlign = "right"
      ctx.textBaseline = "middle"
      if (this.tempogramGroups[blockNum]) {
        for (const data of this.tempogramGroups[blockNum]) {
          if (data.groups[0].value < TEMPOGRAM_THRESHOLD) break
          let weightsTotal = 0
          let bpmTotal = 0
          let totalBlocksAvailable = 0
          // take the local average
          for (
            let j = blockNum - TEMPOGRAM_SMOOTHING;
            j <= blockNum + TEMPOGRAM_SMOOTHING;
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

          ctx.font = `${18 + weightsTotal * 300}px Assistant`
          ctx.fillStyle = `rgba(0, 150, 255, ${Math.min(
            255,
            (data.groups[0].value - TEMPOGRAM_THRESHOLD) * 300
          )})`
          ctx.fillText(
            roundDigit(bpmTotal, 0) + "",
            200,
            lerp(
              graphHeight * 2,
              graphHeight * 1.5,
              unlerp(MIN_BPM, MAX_BPM, bpmTotal)
            )
          )
        }
      }

      ctx.font = "22px Assistant"
      ctx.fillStyle = "rgba(0, 150, 255, 1)"
      ctx.textAlign = "left"
      ctx.textBaseline = "top"
      ctx.fillText("Spectogram", 10, 10)
      ctx.fillText("Onsets", 10, graphHeight + 10)
      ctx.fillText("Tempogram", 10, graphHeight * 1.5 + 10)

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
        Math.max(0, blockNum * WINDOW_STEP - FFT_SIZE / 2),
        blockNum * WINDOW_STEP + FFT_SIZE / 2
      ),
      -Math.min(0, blockNum * WINDOW_STEP - FFT_SIZE / 2)
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
      block[i] = Math.max(0, block[i] - previous[i]) * this.spectroWeights[i]
    }
    this.storeDifferenceResponse(blockNum, block)
  }

  storeResponse(blockNum: number, response: Float64Array) {
    this.spectrogram[blockNum] = response
    const ctx = this.spectrogramCanvas!.getContext("2d")!

    ctx.fillStyle = `rgba(0, 166, 255, 0.6)`
    response.forEach((value, index) => {
      const loc = this.spectroHeights[index]
      const col = clamp(value * 2000, 0, 255)
      ctx.globalAlpha = col / 255
      ctx.fillRect(blockNum, loc.y, 1, loc.height)
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
      // only mark this is a peak if its difference is larger than the last one (perceived onset)
      if (this.peaks[blockNum - 1]) {
        this.peaks[blockNum - 1] = false
      }
      this.peaks[blockNum] = true
    } else {
      this.peaks[blockNum] = false
    }

    const ctx = this.spectrogramCanvas!.getContext("2d")!
    const height = Math.min(1, Math.log(1 + sum)) * graphHeight * 0.5
    ctx.fillStyle = "rgb(11, 14, 26)"
    ctx.fillRect(blockNum, graphHeight, 1, graphHeight * 0.5)
    ctx.fillStyle = `rgba(0, 100, 150, 0.5)`
    ctx.fillRect(blockNum, graphHeight * 1.5 - height, 1, height)
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

  private *getBarlineBeats(
    fromBeat: number,
    toBeat: number
  ): Generator<[number, boolean], void> {
    fromBeat = Math.max(0, fromBeat)
    const td = this.app.chartManager.loadedChart!.timingData
    const timeSigs = td.getTimingData("TIMESIGNATURES")
    let currentTimeSig = td.getEventAtBeat("TIMESIGNATURES", fromBeat)
    let timeSigIndex = currentTimeSig
      ? timeSigs.findIndex(t => t.beat == currentTimeSig!.beat)
      : -1
    let divisionLength = td.getDivisionLength(fromBeat)
    const beatsToNearestDivision =
      (td.getDivisionOfMeasure(fromBeat) % 1) * divisionLength

    // Find the nearest beat division
    let beat = Math.max(0, fromBeat - beatsToNearestDivision)
    if (beat < fromBeat) beat += divisionLength
    let divisionNumber = Math.round(td.getDivisionOfMeasure(beat))

    let divisionsPerMeasure = currentTimeSig?.upper ?? 4
    while (beat < toBeat) {
      // Don't display warped beats
      if (!Options.chart.CMod || !td.isBeatWarped(beat)) {
        yield [beat, divisionNumber % divisionsPerMeasure == 0]
      }
      divisionNumber++
      divisionNumber %= divisionsPerMeasure
      // Go to the next division
      beat += divisionLength
      // Check if we have reached the next time signature
      if (beat >= timeSigs[timeSigIndex + 1]?.beat) {
        timeSigIndex++
        // Go to start of the new time signature
        currentTimeSig = timeSigs[timeSigIndex]
        beat = currentTimeSig.beat
        divisionLength = td.getDivisionLength(beat)
        divisionNumber = 0
        divisionsPerMeasure = currentTimeSig.upper
      }
    }
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

    const MAX_BLOCKS = Math.ceil(scaled.length / TEMPO_STEP)

    let frameTime = performance.now()
    const processBlock = (blockNum: number) => {
      const slice = new Float32Array(TEMPO_FFT_SIZE)
      slice.set(
        scaled.subarray(
          Math.max(0, blockNum * TEMPO_STEP - TEMPO_FFT_SIZE / 2),
          blockNum * TEMPO_STEP + TEMPO_FFT_SIZE / 2
        ),
        -Math.min(0, blockNum * TEMPO_STEP - TEMPO_FFT_SIZE / 2)
      )
      // apply hanning window
      for (let i = 0; i < slice.length; i++) {
        slice[i] *= 0.5 * (1 - Math.cos(Math.PI * 2 * (i / TEMPO_FFT_SIZE)))
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
          setTimeout(() => processBlock(++blockNum), 1)
        }
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
        ((this.sampleRate * 60) / (WINDOW_STEP * TEMPO_FFT_SIZE)) * index
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
    const ctx = this.spectrogramCanvas!.getContext("2d")!

    ctx.fillStyle = `rgba(0, 166, 255, 0.6)`
    this.tempogram[blockNum].forEach(data => {
      const col = clamp(data.value * 8000, 0, 255)
      ctx.globalAlpha = col / 255
      ctx.fillRect(
        blockNum * TEMPO_STEP,
        lerp(
          graphHeight * 2,
          graphHeight * 1.5,
          unlerp(MIN_BPM, MAX_BPM, data.bpm)
        ),
        1 * TEMPO_STEP,
        (graphHeight * 0.5) / (MAX_BPM - MIN_BPM)
      )
    })
  }
}
