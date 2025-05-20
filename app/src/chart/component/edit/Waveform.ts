import {
  Color,
  FXAAFilter,
  ParticleContainer,
  RenderTexture,
  Sprite,
  Texture,
} from "pixi.js"
import { colorFallback } from "../../../util/Color"
import { EventHandler } from "../../../util/EventHandler"
import { clamp } from "../../../util/Math"
import { Options } from "../../../util/Options"
import { destroyChildIf } from "../../../util/Util"
import { ChartRenderer, ChartRendererComponent } from "../../ChartRenderer"
import { TimingData } from "../../sm/TimingData"
import {
  BeatTimingCache,
  BPMTimingEvent,
  ScrollTimingEvent,
} from "../../sm/TimingTypes"

const MAX_ZOOM = 3500

interface WaveformLine extends Sprite {
  lastUsed: number
}

export class Waveform extends Sprite implements ChartRendererComponent {
  private lineContainer: ParticleContainer = new ParticleContainer(
    1500,
    { position: true, scale: true, tint: true, alpha: true },
    16384,
    true
  )
  private readonly waveformTex: RenderTexture

  private renderer: ChartRenderer

  private rawData: Float32Array[] = []
  private filteredRawData: Float32Array[] = []

  private speed
  private lastSpeed
  private lastSpeedTimeout?: NodeJS.Timeout
  private sampleRate = 44100

  private poolSearch = 0
  private trackedVariables = new Map<
    () => any,
    { value: any; cb?: (value: any) => void }
  >()

  private drawDirty = true
  private blockCache = new Map<string, number[]>()

  private colorCache = new Color("black")
  private filteredColorCache = new Color("black")

  constructor(renderer: ChartRenderer) {
    super()
    this.renderer = renderer
    this.waveformTex = RenderTexture.create({
      resolution: Math.min(1, Options.performance.resolution),
    })
    this.texture = this.waveformTex

    this.speed = this.getSpeed()
    this.lastSpeed = this.getSpeed()

    this.trackVariable(() => this.renderer.getVisualBeat())
    this.trackVariable(() => this.renderer.getVisualTime())
    this.trackVariable(() => Options.chart.speed)
    this.trackVariable(
      () => this.getSpeed(),
      value => {
        this.speed = value
        clearTimeout(this.lastSpeedTimeout)
        this.lastSpeedTimeout = setTimeout(() => {
          this.blockCache.clear()
          this.lastSpeed = this.speed
          this.drawDirty = true
        }, 200)
      }
    )
    this.trackVariable(() => Options.chart.zoom)
    this.trackVariable(() => Options.chart.CMod)
    this.trackVariable(() => Options.chart.doSpeedChanges)
    this.trackVariable(() => Options.chart.waveform.allowFilter)
    this.trackVariable(() => Options.chart.reverse)
    this.trackVariable(
      () => Options.chart.waveform.antialiasing,
      value => {
        this.filters = value ? [new FXAAFilter()] : []
      }
    )
    this.trackVariable(
      () => this.renderer.chartManager.app.STAGE_WIDTH,
      () => this.resizeWaveform()
    )
    this.trackVariable(
      () => this.renderer.chartManager.app.STAGE_HEIGHT,
      () => this.resizeWaveform()
    )
    this.trackVariable(() => Options.chart.waveform.filteredColor)
    this.trackVariable(() => Options.chart.waveform.color)
    this.trackVariable(() => Options.chart.waveform.speedChanges)
    this.trackVariable(() => Options.chart.receptorYPos)
    this.trackVariable(
      () => Options.chart.waveform.lineHeight,
      () => {
        if (Options.chart.waveform.lineHeight <= 0)
          Options.chart.waveform.lineHeight = 1
        this.updateLineHeight()
      }
    )

    this.trackVariable(
      () => Options.chart.zoom,
      () => this.resizeWaveform()
    )
    this.trackVariable(() => this.renderer.chartManager.chartAudio.hasFilters())

    const onUpdate = () => this.getData()

    this.anchor.set(0.5)
    this.renderer.chartManager.chartAudio.onUpdate(onUpdate)
    this.getData()
    this.resizeWaveform()

    this.filters = Options.chart.waveform.antialiasing ? [new FXAAFilter()] : []

    const timingHandler = () => (this.drawDirty = true)
    const audioChanged = () => {
      this.getData()
      this.resizeWaveform()
      this.renderer.chartManager.chartAudio.onUpdate(onUpdate)
    }
    EventHandler.on("timingModified", timingHandler)
    this.on("destroyed", () => {
      EventHandler.off("timingModified", timingHandler)
    })
    EventHandler.on("audioLoaded", audioChanged)
    this.on("destroyed", () => {
      EventHandler.off("audioLoaded", audioChanged)
      this.renderer.chartManager.chartAudio.offUpdate(onUpdate)
    })
  }

  private getData() {
    this.rawData = this.renderer.chartManager.chartAudio.getRawData()
    this.filteredRawData =
      this.renderer.chartManager.chartAudio.getFilteredRawData()
    this.sampleRate = this.renderer.chartManager.chartAudio.getSampleRate()
    this.blockCache.clear()
    this.drawDirty = true
  }

  private resizeWaveform() {
    this.waveformTex.resize(
      clamp(
        (this.rawData?.length ?? 0) * 288 * Options.chart.zoom,
        1,
        this.renderer.chartManager.app.STAGE_WIDTH
      ),
      this.renderer.chartManager.app.STAGE_HEIGHT
    )
  }

  update() {
    this.visible =
      Options.chart.waveform.enabled && this.renderer.shouldDisplayBarlines()

    if (!Options.chart.waveform.enabled) return
    if (this.drawDirty || this.variableChanged()) {
      if (this.colorCache.toHexa() != Options.chart.waveform.color) {
        this.colorCache = colorFallback(Options.chart.waveform.color)
      }
      if (
        this.filteredColorCache.toHexa() != Options.chart.waveform.filteredColor
      ) {
        this.filteredColorCache = colorFallback(
          Options.chart.waveform.filteredColor
        )
      }
      this.drawDirty = false
      this.renderData()
      this.renderer.chartManager.app.renderer.render(this.lineContainer, {
        renderTexture: this.waveformTex,
      })
    }
    this.scale.set(1 / Options.chart.zoom)
  }

  private trackVariable<T>(get: () => T, onchange?: (value: T) => void) {
    this.trackedVariables.set(get, { value: get(), cb: onchange })
  }

  private variableChanged() {
    let hasChanged = false
    for (const [get, last] of this.trackedVariables.entries()) {
      if (get() != last.value) {
        this.trackedVariables.get(get)!.value = get()
        this.trackedVariables.get(get)!.cb?.(get())
        hasChanged = true
      }
    }
    return hasChanged
  }

  private getSample(data: Float32Array, second: number, cacheId: string) {
    if (second < 0) return 0
    const blockSize = this.sampleRate / (this.lastSpeed * 4)
    const blockNum = Math.floor(second * this.lastSpeed * 4)
    if (this.blockCache.get(cacheId)?.[blockNum] !== undefined)
      return this.blockCache.get(cacheId)![blockNum]
    const blockStart = Math.floor(blockNum * blockSize)
    const value =
      data
        .slice(blockStart, Math.floor(blockStart + blockSize))
        .reduce((acc, samp) => acc + Math.abs(samp), 0) / blockSize
    if (!this.blockCache.has(cacheId)) this.blockCache.set(cacheId, [])
    this.blockCache.get(cacheId)![blockNum] = value
    return value
  }

  private renderData() {
    this.resetPool()
    const hasFilters =
      Options.chart.waveform.allowFilter &&
      this.renderer.chartManager.chartAudio.hasFilters()

    // Lasy getSecond calculation
    // works only when only moving forwards in time
    const lazyCalc = {
      data: {
        bpms: [] as BPMTimingEvent[],
        bpmIndex: 0,
        timing: [] as BeatTimingCache[],
        timingIndex: 0,
        offset: 0,
        lastBeat: -999,
        timingData: null as TimingData | null,
      },
      init(data: TimingData) {
        this.data.bpms = data.getTimingData("BPMS")
        this.data.timing = data.getBeatTiming()
        this.data.offset = data.getOffset()
        if (this.data.bpms[0]?.beat !== 0) {
          const firstEvent = structuredClone(this.data.bpms[0]) ?? {
            value: 120,
            type: "BPMS",
            beat: 0,
          }
          firstEvent.beat = 0
          this.data.bpms.unshift(firstEvent)
        }
        if (this.data.timing.length == 0) {
          this.data.timing.unshift({
            beat: 0,
            secondBefore: -this.data.offset,
            secondAfter: -this.data.offset,
            secondClamp: -this.data.offset,
            secondOf: -this.data.offset,
            warped: false,
            bpm: 120,
          })
        }
        this.data.timingData = data
      },
      getBPM(beat: number) {
        while (beat > this.data.bpms[this.data.bpmIndex + 1]?.beat) {
          this.data.bpmIndex++
        }
        return this.data.bpms[this.data.bpmIndex].value
      },
      getSecond(beat: number) {
        const flooredBeat = Math.floor(beat * 48) / 48
        if (beat <= 0)
          return -this.data.offset + (beat * 60) / this.getBPM(beat)
        else if (
          flooredBeat >= this.data.timing[this.data.timingIndex + 1]?.beat
        ) {
          // Use getSeconds for every timing event
          while (
            flooredBeat >= this.data.timing[this.data.timingIndex + 1]?.beat
          )
            this.data.timingIndex++
          return this.data.timingData!.getSecondsFromBeat(beat)
        } else {
          // Use normal bpm to beats calculation to not use getSeconds
          const event = this.data.timing[this.data.timingIndex]
          const beatsElapsed = beat - event.beat
          let timeElapsed = (beatsElapsed * 60) / event.bpm
          if (event.warped) timeElapsed = 0
          return Math.max(event.secondClamp, event.secondAfter + timeElapsed)
        }
      },
    }

    const screenHeight = this.renderer.chartManager.app.STAGE_HEIGHT

    if (
      Options.chart.waveform.speedChanges &&
      !Options.chart.CMod &&
      Options.chart.doSpeedChanges
    ) {
      // XMod with speed changes

      const chartSpeed = Options.chart.speed
      const speedMult = this.renderer.getCurrentSpeedMult()

      const topBeat = this.renderer.getTopOnScreenBeat()
      const bottomBeat = this.renderer.getBottomOnScreenBeat()
      const startBeat = Math.min(topBeat, bottomBeat)
      const endBeat = Math.max(topBeat, bottomBeat)

      const startScroll = this.renderer.findFirstOnScreenScroll()
      const endScroll = this.renderer.findLastOnScreenScroll()

      const scrolls: ScrollTimingEvent[] = [
        ...this.renderer.chart.timingData.getTimingData("SCROLLS"),
      ]
      if (scrolls[0]?.beat != 0)
        scrolls.unshift({
          type: "SCROLLS",
          beat: 0,
          value: scrolls[0]?.value ?? 1,
        })

      lazyCalc.init(this.renderer.chart.timingData)

      const startScrollIndex = scrolls.findIndex(
        a => a.beat == startScroll.beat
      )
      const endScrollIndex = scrolls.findIndex(a => a.beat == endScroll.beat)

      const pixelsToEffectiveBeats =
        100 / chartSpeed / Math.abs(speedMult) / 64 / Options.chart.zoom

      let currentBeat = startBeat
      let currentYPos = Math.round(
        this.renderer.getYPosFromBeat(currentBeat) * Options.chart.zoom +
          screenHeight / 2
      )
      let curSec = this.renderer.chart.getSecondsFromBeat(currentBeat)

      for (const scroll of scrolls.slice(
        startScrollIndex,
        endScrollIndex + 1
      )) {
        if (scroll.value == 0) continue
        const pixelsToBeats = pixelsToEffectiveBeats / Math.abs(scroll.value)
        if (scroll.beat != startScroll.beat) {
          currentBeat = scroll.beat
        } else {
          // fix flickering by rounding the current beat to land on a pixel
          currentBeat =
            Math.round((currentBeat - scroll.beat) / pixelsToBeats) *
              pixelsToBeats +
            scroll.beat
        }
        currentYPos = Math.round(
          this.renderer.getYPosFromBeat(currentBeat) * Options.chart.zoom +
            screenHeight / 2
        )
        curSec = this.renderer.chart.getSecondsFromBeat(currentBeat)
        const scrollDirection = this.renderer.getScrollDirection(scroll.value)
        const scrollEndBeat =
          scrolls[scrolls.indexOf(scroll) + 1]?.beat ?? Number.MAX_VALUE
        while (currentBeat < Math.min(scrollEndBeat, endBeat)) {
          // Stop if the scroll is off the screen
          if (currentYPos < 0) {
            // Skip the scroll if we step off the top of the screen
            if (scrollDirection < 0) {
              currentBeat = scrollEndBeat
              break
            }
            // Skip to the top of the screen and keep stepping from there
            currentBeat += pixelsToBeats * -currentYPos
            currentYPos = 0
            continue
          }

          if (currentYPos > screenHeight) {
            // Skip the scroll if we step off the bottom of the screen
            if (scrollDirection > 0) {
              currentBeat = scrollEndBeat
              break
            }
            // Skip to the bottom of the screen and keep stepping from there
            currentBeat += pixelsToBeats * (currentYPos - screenHeight)
            currentYPos = screenHeight
            continue
          }

          // Step by 1 or -1 pixels and get the current beat
          currentBeat += pixelsToBeats * Options.chart.waveform.lineHeight
          currentYPos += scrollDirection * Options.chart.waveform.lineHeight

          curSec = lazyCalc.getSecond(currentBeat)
          this.drawLine(curSec, currentYPos, hasFilters)
        }
      }
    } else if (!Options.chart.CMod) {
      // XMod no speed changes

      let currentBeat = this.renderer.getBeatFromYPos(
        (-screenHeight / 2 +
          (Options.chart.reverse
            ? this.renderer.chartManager.app.STAGE_HEIGHT
            : 0)) /
          Options.chart.zoom
      )
      lazyCalc.init(this.renderer.chart.timingData)

      // Snap current time to the nearest pixel to avoid flickering
      const pixelsToBeatsRatio =
        this.renderer.getPixelsToEffectiveBeatsRatio() / Options.chart.zoom
      currentBeat =
        Math.floor(currentBeat / pixelsToBeatsRatio) * pixelsToBeatsRatio

      let curSec = this.renderer.chart.getSecondsFromBeat(currentBeat)
      const drawLine = (y: number) => {
        currentBeat += pixelsToBeatsRatio * Options.chart.waveform.lineHeight
        curSec = lazyCalc.getSecond(currentBeat)

        this.drawLine(curSec, y, hasFilters)
      }
      if (Options.chart.reverse) {
        for (
          let y = this.renderer.chartManager.app.STAGE_HEIGHT;
          y >= 0;
          y -= Options.chart.waveform.lineHeight
        )
          drawLine(y)
      } else {
        for (
          let y = 0;
          y <= this.renderer.chartManager.app.STAGE_HEIGHT;
          y += Options.chart.waveform.lineHeight
        )
          drawLine(y)
      }
    } else {
      // CMod

      let calcTime = this.renderer.getSecondFromYPos(
        (-screenHeight / 2 +
          (Options.chart.reverse
            ? this.renderer.chartManager.app.STAGE_HEIGHT
            : 0)) /
          Options.chart.zoom
      )
      // Snap current time to the nearest pixel to avoid flickering
      const pixelsToSecondsRatio =
        this.renderer.getPixelsToSecondsRatio() / Options.chart.zoom
      calcTime =
        Math.floor(calcTime / pixelsToSecondsRatio) * pixelsToSecondsRatio
      const drawLine = (y: number) => {
        calcTime += pixelsToSecondsRatio * Options.chart.waveform.lineHeight
        this.drawLine(calcTime, y, hasFilters)
      }
      if (Options.chart.reverse) {
        for (
          let y = this.renderer.chartManager.app.STAGE_HEIGHT;
          y >= 0;
          y -= Options.chart.waveform.lineHeight
        )
          drawLine(y)
      } else {
        for (
          let y = 0;
          y <= this.renderer.chartManager.app.STAGE_HEIGHT;
          y += Options.chart.waveform.lineHeight
        )
          drawLine(y)
      }
    }

    this.purgePool()
  }

  private drawLine(second: number, y: number, hasFilters: boolean) {
    if (second < 0) return
    for (let channel = 0; channel < this.rawData.length; channel++) {
      const line = this.getLine()
      line.scale.x =
        this.getSample(this.rawData[channel], second, "main") *
        16 *
        Options.chart.zoom
      line.y = y
      line.tint = this.colorCache
      line.alpha = this.colorCache.alpha
      line.x =
        this.waveformTex.width / 2 +
        288 * (channel + 0.5 - this.rawData.length / 2) * Options.chart.zoom
      if (!hasFilters) continue
      const filteredLine = this.getLine()
      filteredLine.scale.x =
        this.getSample(this.filteredRawData[channel], second, "filter") *
        16 *
        Options.chart.zoom
      filteredLine.tint = this.filteredColorCache
      filteredLine.alpha = this.filteredColorCache.alpha
      filteredLine.y = y
      filteredLine.x =
        this.waveformTex.width / 2 +
        288 *
          (channel + 0.5 - this.filteredRawData.length / 2) *
          Options.chart.zoom
    }
  }

  private resetPool() {
    this.poolSearch = 0
  }

  private purgePool() {
    destroyChildIf(
      this.lineContainer.children,
      (_, index) => index >= this.poolSearch
    )
  }

  private updateLineHeight() {
    for (const child of this.lineContainer.children) {
      const line = child as WaveformLine
      line.height = Options.chart.waveform.lineHeight
    }
  }

  private getLine(): WaveformLine {
    if (this.lineContainer.children[this.poolSearch]) {
      const w_line = this.lineContainer.children[
        this.poolSearch
      ] as WaveformLine
      w_line.visible = true
      this.poolSearch++
      return w_line
    }
    const line = new Sprite(Texture.WHITE) as WaveformLine
    line.height = Options.chart.waveform.lineHeight
    line.anchor.set(0.5)
    line.visible = true
    this.poolSearch++
    this.lineContainer.addChild(line)
    return line
  }

  private getSpeed(): number {
    return Math.min(Options.chart.speed, MAX_ZOOM)
  }
}
