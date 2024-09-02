import ft from "fourier-transform/asm"
import tippy from "tippy.js"
import { App } from "../../App"
import { PartialTapNotedataEntry } from "../../chart/sm/NoteTypes"
import { EventHandler } from "../../util/EventHandler"
import { clamp, lerp, roundDigit, unlerp } from "../../util/Math"
import { Options } from "../../util/Options"
import { NumberSlider } from "../element/NumberSlider"
import { WaterfallManager } from "../element/WaterfallManager"
import { Window } from "./Window"

const graphWidth = 800
const graphHeight = 200

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

export class SyncWindow extends Window {
  app: App
  private onAudioLoad = this.reset.bind(this)

  private windowStep = 512
  private fftSize = 1024
  private tempoFftSize = 4096
  private tempoStep = 2

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

  private placeNotesSelectionButton!: HTMLButtonElement
  private toggleButton!: HTMLButtonElement
  private resetButton!: HTMLButtonElement

  private onsetResults!: HTMLDivElement

  private offsetTableLabel!: HTMLDivElement
  private offsetRows: HTMLDivElement[] = []
  private bpmRows: HTMLDivElement[] = []
  private covers: HTMLDivElement[] = []

  private doAnalysis = false

  private lastSecond = 0

  constructor(app: App) {
    super({
      title: "Detect Audio Sync",
      width: 400,
      height: 450,
      win_id: "detect-sync",
    })
    this.app = app
    this.initView()

    this.reset()
    EventHandler.on("audioLoaded", this.onAudioLoad)
  }

  onClose() {
    EventHandler.off("audioLoaded", this.onAudioLoad)
    this.app.chartManager.chartAudio.offLoad(this.onAudioLoad)
  }

  initView() {
    this.viewElement.replaceChildren()

    const container = document.createElement("div")
    container.classList.add("sync-container")
    container.style.display = "flex"
    container.style.flexDirection = "column"
    container.style.alignItems = "center"

    // Main canvas

    const canvas = document.createElement("canvas")
    canvas.style.width = `${graphWidth / 2}px`
    canvas.style.height = `${graphHeight}px`

    // Create tabs

    const tabContainer = document.createElement("div")
    tabContainer.classList.add("sync-tab-container")

    const optionsTab = document.createElement("div")
    optionsTab.classList.add("sync-tab-option", "active")
    optionsTab.innerText = "Analysis Options"

    const tempoTab = document.createElement("div")
    tempoTab.classList.add("sync-tab-option")
    tempoTab.innerText = "Tempo Results"

    const onsetsTab = document.createElement("div")
    onsetsTab.classList.add("sync-tab-option")
    onsetsTab.innerText = "Onset Results"

    tabContainer.replaceChildren(optionsTab, tempoTab, onsetsTab)
    ;[...tabContainer.children].forEach((element, index) => {
      ;(element as HTMLDivElement).onclick = () => {
        tabScroller.scrollLeft = 370 * index
        tabContainer
          .querySelectorAll(".active")
          .forEach(e => e.classList.remove("active"))
        element.classList.add("active")
      }
    })

    // Tab view

    const tabView = document.createElement("div")
    tabView.classList.add("sync-tab-view")

    const tabScroller = document.createElement("div")
    tabScroller.classList.add("sync-tab-scroller")

    const optionsView = this.createOptionsView()
    const tempoView = this.createTempoView()
    const onsetsView = this.createOnsetsView()

    const createCover = (text: string, left: number) => {
      const container = document.createElement("div")
      container.classList.add("sync-cover")
      container.innerText = text
      container.style.left = `${left * 370}px`
      return container
    }

    this.covers = [
      createCover("Clear analysis results to edit", 0),
      createCover("Start analysis to view", 1),
      createCover("Start analysis to view", 2),
    ]

    tabView.appendChild(tabScroller)
    tabScroller.replaceChildren(
      optionsView,
      this.covers[0],
      tempoView,
      this.covers[1],
      onsetsView,
      this.covers[2]
    )

    // Bottom buttons

    const bottomContainer = document.createElement("div")
    bottomContainer.classList.add("sync-bottom-container")

    this.resetButton = document.createElement("button")
    this.resetButton.classList.add("delete")
    this.resetButton.innerText = "Clear results"
    this.resetButton.style.width = "120px"
    this.resetButton.disabled = true
    this.resetButton.onclick = () => {
      this.resetButton.disabled = true
      optionsTab.click()
      this.reset()
    }

    this.toggleButton = document.createElement("button")
    this.toggleButton.innerText = "Start analyzing"
    this.toggleButton.style.width = "200px"
    this.toggleButton.onclick = () => {
      if (!this.doAnalysis) {
        tempoTab.click()
      }
      this.doAnalysis = !this.doAnalysis
      this.toggleButton.innerText = this.doAnalysis
        ? "Stop analyzing"
        : this.hasData()
          ? "Resume analyzing"
          : "Start analyzing"
      this.resetButton.disabled = this.doAnalysis
    }

    bottomContainer.replaceChildren(this.toggleButton, this.resetButton)

    container.replaceChildren(canvas, tabContainer, tabView, bottomContainer)
    this.viewElement.appendChild(container)
    const loop = this.windowLoop(canvas)
    requestAnimationFrame(loop)
  }

  createOptionsView() {
    const optionsView = document.createElement("div")
    optionsView.style.display = "flex"
    optionsView.style.position = "relative"
    optionsView.style.flexDirection = "column"
    optionsView.style.gap = "3px"
    optionsView.style.height = "100%"

    const createLabel = (
      text: string,
      element: HTMLElement,
      tooltip: string
    ) => {
      const container = document.createElement("div")
      container.style.display = "flex"
      container.style.flexDirection = "row"
      container.style.justifyContent = "space-between"
      container.style.alignItems = "center"
      const label = document.createElement("div")
      label.innerText = text
      container.replaceChildren(label, element)

      tippy(container, { content: tooltip })
      return container
    }

    const optionsOnsetsLabel = document.createElement("div")
    optionsOnsetsLabel.innerText = "Onsets"
    optionsOnsetsLabel.style.fontWeight = "600"

    const optionsOnsetsFFTSlider = NumberSlider.create({
      min: Math.log2(128),
      max: Math.log2(8192),
      step: 1,
      value: Math.log2(this.fftSize),
      transformer: val => 2 ** val,
      onChange: value => {
        this.fftSize = 2 ** value
        if (this.windowStep > this.fftSize) {
          this.windowStep = this.fftSize
          optionsOnsetsStepSlider.setValue(value)
        }
        this.reset()
      },
    })

    const optionsOnsetsStepSlider = NumberSlider.create({
      min: Math.log2(128),
      max: Math.log2(8192),
      step: 1,
      value: Math.log2(this.windowStep),
      transformer: val => 2 ** val,
      onChange: value => {
        this.windowStep = 2 ** value
        if (this.windowStep > this.fftSize) {
          this.windowStep = this.fftSize
          optionsOnsetsStepSlider.setValue(Math.log2(this.fftSize))
        }
        this.reset()
      },
    })

    const optionsTempoLabel = document.createElement("div")
    optionsTempoLabel.innerText = "Tempo"
    optionsTempoLabel.style.fontWeight = "600"
    optionsTempoLabel.style.marginTop = "15px"

    const optionsTempoFFTSlider = NumberSlider.create({
      min: Math.log2(128),
      max: Math.log2(8192),
      step: 1,
      value: Math.log2(this.tempoFftSize),
      transformer: val => 2 ** val,
      onChange: value => {
        this.tempoStep = 2 ** value
        if (this.tempoStep > this.tempoFftSize) {
          this.tempoStep = this.tempoFftSize
          optionsTempoStepSlider.setValue(value)
        }
        this.reset()
      },
    })

    const optionsTempoStepSlider = NumberSlider.create({
      min: Math.log2(1),
      max: Math.log2(1024),
      step: 1,
      value: Math.log2(this.tempoStep),
      transformer: val => 2 ** val,
      onChange: value => {
        this.tempoStep = 2 ** value
        if (this.tempoStep > this.tempoFftSize) {
          this.tempoStep = this.tempoFftSize
          optionsTempoStepSlider.setValue(Math.log2(this.tempoFftSize))
        }
        this.reset()
      },
    })

    optionsView.replaceChildren(
      optionsOnsetsLabel,
      createLabel(
        "FFT Size",
        optionsOnsetsFFTSlider.view,
        "Determines the amount of audio to analyze at every block. Higher values result in more accurate frequencies, while lower values result in more accurate timings. Defaults to 1024."
      ),
      createLabel(
        "Window Step",
        optionsOnsetsStepSlider.view,
        "Determines the number of blocks per second. Lower values result in more time-accurate spectrograms, but may take more time and mess up tempo analysis. Defaults to 512 and must be lower than FFT Size."
      ),
      optionsTempoLabel,
      createLabel(
        "FFT Size",
        optionsTempoFFTSlider.view,
        "Determines the amount of the onset graph to analyze at every block. Higher values result in more accurate tempos, while lower values result in more accurate timings. Defaults to 4096."
      ),
      createLabel(
        "Window Step",
        optionsTempoStepSlider.view,
        "Determines the number of blocks per second. Lower values result in more time-accurate tempograms, but may take more time. Defaults to 2 and must be lower than FFT Size."
      )
    )
    return optionsView
  }

  createTempoView() {
    const container = document.createElement("div")
    container.style.display = "flex"
    container.style.position = "relative"
    container.style.gap = "10px"

    const offsetDetectionColumn = document.createElement("div")
    offsetDetectionColumn.style.flex = "1"

    const offsetLabel = document.createElement("div")
    offsetLabel.classList.add("sync-table-label")
    offsetLabel.innerText = "Offsets"

    this.offsetTableLabel = offsetLabel

    const offsetTable = document.createElement("table")
    offsetTable.classList.add("sync-table")
    const offsetHeader = document.createElement("tr")
    const oOffsetHeader = document.createElement("th")
    oOffsetHeader.innerText = "Offset"
    const oConfidenceHeader = document.createElement("th")
    oConfidenceHeader.innerText = "Confidence"
    offsetHeader.replaceChildren(oOffsetHeader, oConfidenceHeader)

    offsetTable.appendChild(offsetHeader)

    offsetDetectionColumn.replaceChildren(offsetLabel, offsetTable)

    const bpmDetectionColumn = document.createElement("div")
    bpmDetectionColumn.style.flex = "1"

    const bpmLabel = document.createElement("div")
    bpmLabel.classList.add("sync-table-label")
    bpmLabel.innerText = "Current Tempos"

    const bpmTable = document.createElement("table")
    bpmTable.classList.add("sync-table")
    const bpmHeader = document.createElement("tr")
    const bBpmHeader = document.createElement("th")
    bBpmHeader.innerText = "BPM"
    const bConfidenceHeader = document.createElement("th")
    bConfidenceHeader.innerText = "Confidence"
    bpmHeader.replaceChildren(bBpmHeader, bConfidenceHeader)

    bpmTable.appendChild(bpmHeader)

    // Fill with empty rows
    for (let i = 0; i < 5; i++) {
      const row = document.createElement("tr")
      const a = document.createElement("td")
      a.innerText = "-"
      const b = document.createElement("td")
      b.innerText = "-"
      row.replaceChildren(a, b)
      offsetTable.appendChild(row)
      this.offsetRows.push(row)
      const clonedRow = row.cloneNode(true) as HTMLDivElement
      bpmTable.appendChild(clonedRow)
      this.bpmRows.push(clonedRow)
    }

    bpmDetectionColumn.replaceChildren(bpmLabel, bpmTable)

    container.replaceChildren(offsetDetectionColumn, bpmDetectionColumn)

    return container
  }

  createOnsetsView() {
    const container = document.createElement("div")
    container.style.display = "flex"
    container.style.flexDirection = "column"
    container.style.gap = "10px"
    container.style.justifyContent = "center"
    container.style.alignItems = "center"
    container.style.position = "relative"

    const thresholdRow = document.createElement("div")
    thresholdRow.style.display = "flex"
    thresholdRow.style.justifyContent = "space-between"
    thresholdRow.style.alignItems = "center"
    thresholdRow.style.width = "100%"

    tippy(thresholdRow, {
      content:
        "Adjust the threshold for a block to be considered an onset (red line).",
    })

    const thresholdLabel = document.createElement("div")
    thresholdLabel.innerText = "Onset Threshold"

    const thresholdSlider = NumberSlider.create({
      min: 0,
      max: 1,
      step: 0.01,
      value: 0.3,
      onChange: value => {
        this.threshold = value
      },
    })

    const onsetResults = document.createElement("div")
    onsetResults.style.color = "#888888"
    onsetResults.style.fontStyle = "italic"
    onsetResults.style.fontSize = "11px"
    onsetResults.style.marginBottom = "15px"
    onsetResults.style.marginTop = "-6px"
    onsetResults.innerText = "Found 0 onsets"
    this.onsetResults = onsetResults

    thresholdRow.replaceChildren(thresholdLabel, thresholdSlider.view)

    const placeRow = document.createElement("div")
    placeRow.style.display = "flex"
    placeRow.style.justifyContent = "space-between"
    placeRow.style.alignItems = "center"
    placeRow.style.width = "100%"

    const placeButton = document.createElement("button")
    placeButton.innerText = "Place onsets as notes"
    placeButton.onclick = () => this.placeOnsets()

    const placeSelectionButton = document.createElement("button")
    placeSelectionButton.innerText = "Place onsets as notes in selection"
    placeSelectionButton.disabled = true
    placeSelectionButton.onclick = () => this.placeOnsets(true)

    this.placeNotesSelectionButton = placeSelectionButton

    placeRow.replaceChildren(placeButton, placeSelectionButton)

    container.replaceChildren(thresholdRow, onsetResults, placeRow)

    return container
  }

  async reset() {
    this._threshold = 0.3
    this.doAnalysis = false
    this.toggleButton.disabled = false
    this.toggleButton.style.background = ""
    this.toggleButton.innerText = "Start analyzing"
    this.app.chartManager.chartAudio.onLoad(this.onAudioLoad)

    await this.getMonoAudioData()
    this.sampleRate = this.app.chartManager.chartAudio.getSampleRate()

    // Precalculate heights of spectrogram pixels
    this.spectroHeights = new Array(this.fftSize).fill(0).map((_, index) => {
      const freq = ((index / (this.fftSize / 2)) * this.sampleRate) / 2
      const freqNext =
        (((index + 1) / (this.fftSize / 2)) * this.sampleRate) / 2
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
        graphHeight * 2
      )
      const ctx = canvas.getContext("2d")!
      ctx.fillStyle = `rgba(0, 0, 0, 0.6)`
      ctx.fillRect(0, 0, canvas.width, graphHeight)
      ctx.fillRect(0, graphHeight * 1.5, canvas.width, graphHeight * 0.5)
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

    this.offsetTableLabel.innerText = "Offsets"
    this.offsetRows.forEach(row => {
      ;(row.firstChild! as HTMLDivElement).innerText = "-"
      ;(row.lastChild! as HTMLDivElement).innerText = "-"
    })
    this.bpmRows.forEach(row => {
      ;(row.firstChild! as HTMLDivElement).innerText = "-"
      ;(row.lastChild! as HTMLDivElement).innerText = "-"
    })
  }

  hasData() {
    return this.numRenderedBlocks > 0
  }

  windowLoop(canvas: HTMLCanvasElement) {
    const ctx = canvas.getContext("2d")!
    ctx.canvas.width = graphWidth
    ctx.canvas.height = graphHeight * 2
    ctx.imageSmoothingEnabled = false
    const update = () => {
      this.placeNotesSelectionButton.disabled =
        this.app.chartManager.startRegion === undefined ||
        this.app.chartManager.endRegion === undefined ||
        this.app.chartManager.startRegion == this.app.chartManager.endRegion

      this.covers[0].classList.toggle("active", this.hasData())
      this.covers[1].classList.toggle("active", !this.hasData())
      this.covers[2].classList.toggle("active", !this.hasData())

      if (!this.app.chartManager.chartAudio) return

      const MAX_BLOCKS = Math.ceil(this.audioLength / this.windowStep)

      // Render new blocks
      if (this.monoAudioData !== undefined && this.doAnalysis) {
        const startTime = performance.now()
        while (performance.now() - startTime < MAX_MS_PER_FRAME) {
          if (this.lowestFinishedBlock >= MAX_BLOCKS) {
            if (this.tempogram.length == 0) {
              this.toggleButton.disabled = true
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
        }
        if (this.lowestFinishedBlock < MAX_BLOCKS) {
          this.toggleButton.style.background = `linear-gradient(90deg, #265296 0 ${
            (this.lowestFinishedBlock / MAX_BLOCKS) * 100
          }%, rgb(83, 82, 82) ${
            (this.lowestFinishedBlock / MAX_BLOCKS) * 100
          }% 100%)`

          this.toggleButton.innerText = `Stop analyzing (${roundDigit(
            (this.lowestFinishedBlock / MAX_BLOCKS) * 100,
            1
          )}%)`
        }
      }

      // Draw
      ctx.fillStyle = "rgb(11, 14, 26)"
      ctx.fillRect(0, 0, canvas.width, canvas.height)

      const zoom = Options.chart.speed / 40

      const leftBoundBlockNum =
        (this.app.chartManager.getTime() * this.sampleRate) / this.windowStep -
        (graphWidth * 0.2) / zoom

      const rightBoundBlockNum =
        (this.app.chartManager.getTime() * this.sampleRate) / this.windowStep +
        (graphWidth * 0.8) / zoom

      for (
        let i = Math.floor(leftBoundBlockNum / MAX_CANVAS_LENGTH);
        i <= Math.floor(rightBoundBlockNum / MAX_CANVAS_LENGTH);
        i++
      ) {
        const canvas = this.spectrogramCanvases[i]
        if (!canvas) continue
        ctx.drawImage(
          canvas,
          (this.app.chartManager.getTime() * this.sampleRate) /
            this.windowStep -
            (graphWidth * 0.2) / zoom -
            MAX_CANVAS_LENGTH * i,
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

        for (const [barBeat, isMeasure] of this.getBarlineBeats(
          leftBoundBeat,
          rightBoundBeat
        )) {
          const barSecond =
            this.app.chartManager.loadedChart.getSecondsFromBeat(barBeat)
          ctx.fillRect(
            unlerp(leftBoundSecond, rightBoundSecond, barSecond) * graphWidth -
              (isMeasure ? 2 : 1),
            0,
            isMeasure ? 5 : 3,
            graphHeight * 1.5
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
            unlerp(leftBoundBlockNum, rightBoundBlockNum, i) * graphWidth - 0.5,
            0,
            2,
            graphHeight * 1.5
          )
        }
      }

      ctx.fillStyle = "rgba(50, 255, 20, 0.3)"

      ctx.fillRect(graphWidth * 0.2 - 1, 0, 3, graphHeight * 2)

      // Draw threshold line
      ctx.fillStyle = "rgba(255, 0, 255, 0.5)"
      ctx.fillRect(
        0,
        graphHeight * 1.5 - this._threshold * graphHeight * 0.5,
        graphWidth,
        1
      )

      const currentTempoBlock = Math.round(
        (this.app.chartManager.getTime() * this.sampleRate) /
          this.windowStep /
          this.tempoStep
      )

      ctx.fillStyle = "rgba(0, 150, 255, 1)"
      ctx.textAlign = "right"
      ctx.textBaseline = "top"
      ctx.font = "22px Assistant"
      ctx.fillText(
        `${this.numRenderedBlocks}/${MAX_BLOCKS} blocks rendered`,
        graphWidth - 10,
        10
      )

      ctx.textAlign = "right"
      ctx.fillStyle = "rgba(0, 150, 255, 1)"
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
              graphHeight * 2,
              graphHeight * 1.5,
              unlerp(MIN_BPM, MAX_BPM, result.bpm)
            )
          )
        }

        // Update tables
        if (this.lastSecond != this.app.chartManager.getTime()) {
          this.lastSecond = this.app.chartManager.getTime()

          const totalConfidence = aggregateTempos
            .slice(0, 5)
            .reduce((a, b) => a + b.smoothedWeight, 0)

          for (let i = 0; i < 5; i++) {
            const row = this.bpmRows[i]
            const bpm = aggregateTempos[i]?.bpm
            const confidence = aggregateTempos[i]?.weight
            ;(row.firstChild as HTMLDivElement).innerText =
              bpm === undefined ? "-" : Math.round(bpm).toString()
            ;(row.lastChild as HTMLDivElement).innerText =
              confidence === undefined
                ? "-"
                : Math.round((confidence / totalConfidence) * 100) + "%"
          }
        }
      }

      // Draw labels
      ctx.globalAlpha = 1
      ctx.font = "22px Assistant"
      ctx.textAlign = "left"
      ctx.textBaseline = "top"
      ctx.fillText("Spectrogram", 10, 10)
      ctx.fillText("Onsets", 10, graphHeight + 10)
      ctx.fillText("Tempogram", 10, graphHeight * 1.5 + 10)

      if (canvas.closest("#windows")) requestAnimationFrame(update)
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

    ctx.fillStyle = `rgba(0, 166, 255, 1)`
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
      this.onsetResults.innerText = `Found ${
        this.peaks.filter(x => x).length
      } onsets`
    } else {
      this.peaks[blockNum] = false
    }

    const ctx =
      this.spectrogramCanvases[
        Math.floor(blockNum / MAX_CANVAS_LENGTH)
      ].getContext("2d")!
    const height = Math.min(1, Math.log(1 + sum)) * graphHeight * 0.5
    ctx.fillStyle = "rgb(11, 14, 26)"
    ctx.fillRect(
      blockNum % MAX_CANVAS_LENGTH,
      graphHeight,
      1,
      graphHeight * 0.5
    )
    ctx.fillStyle = `rgba(0, 100, 150, 0.5)`
    ctx.fillRect(
      blockNum % MAX_CANVAS_LENGTH,
      graphHeight * 1.5 - height,
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
    this.onsetResults.innerText = `Found ${
      this.peaks.filter(x => x).length
    } onsets`
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

    this.offsetTableLabel.innerText = `Offsets (first BPM: ${firstBPM})`

    for (let i = 0; i < Math.min(options.length, 5); i++) {
      const row = this.offsetRows[i]
      ;(row.firstChild as HTMLDivElement).innerText = roundDigit(
        options[i].offset,
        3
      ).toString()
      ;(row.lastChild as HTMLDivElement).innerText =
        Math.round((options[i].response / totalResponse) * 100) + "%"
    }
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

    this.app.chartManager.insertNotes(notes)
  }

  private *getBarlineBeats(
    firstBeat: number,
    lastBeat: number
  ): Generator<[number, boolean], void> {
    firstBeat = Math.max(0, firstBeat)
    const td = this.app.chartManager.loadedChart!.timingData
    const timeSigs = td.getTimingData("TIMESIGNATURES")
    let currentTimeSig = td.getEventAtBeat("TIMESIGNATURES", firstBeat)
    let timeSigIndex = currentTimeSig
      ? timeSigs.findIndex(t => t.beat == currentTimeSig!.beat)
      : -1
    let divisionLength = td.getDivisionLength(firstBeat)
    const beatsToNearestDivision =
      (td.getDivisionOfMeasure(firstBeat) % 1) * divisionLength

    // Find the nearest beat division
    let beat = Math.max(0, firstBeat - beatsToNearestDivision)
    if (beat < firstBeat) beat += divisionLength
    let divisionNumber = Math.round(td.getDivisionOfMeasure(beat))

    let divisionsPerMeasure = currentTimeSig?.upper ?? 4
    while (beat < lastBeat) {
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
          this.toggleButton.style.background = `linear-gradient(90deg, #265296 0 ${
            (blockNum / MAX_BLOCKS) * 100
          }%, rgb(83, 82, 82) ${(blockNum / MAX_BLOCKS) * 100}% 100%)`
          this.toggleButton.innerText = `Finding tempo (${roundDigit(
            (blockNum / MAX_BLOCKS) * 100,
            1
          )}%)`
          setTimeout(() => processBlock(++blockNum), 1)
        }
      } else {
        this.calculateOffset()
        this.spectrogram = []
        this.noveltyCurve = []
        this.tempogram = []
        this.monoAudioData = undefined
        this.toggleButton.innerText = "Finished analyzing"
        this.resetButton.disabled = false
        this.doAnalysis = false
        this.toggleButton.style.background = `#265296`
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

    ctx.fillStyle = `rgba(0, 166, 255, 1)`
    this.tempogram[blockNum].forEach(data => {
      const col = clamp(data.value * 8000, 0, 255)
      ctx.globalAlpha = col / 255
      ctx.fillRect(
        (blockNum * this.tempoStep) % MAX_CANVAS_LENGTH,
        lerp(
          graphHeight * 2,
          graphHeight * 1.5,
          unlerp(MIN_BPM, MAX_BPM, data.bpm)
        ),
        1 * this.tempoStep,
        (graphHeight * 0.5) / (MAX_BPM - MIN_BPM)
      )
    })
  }
}
