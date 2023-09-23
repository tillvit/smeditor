import {
  FXAAFilter,
  ParticleContainer,
  RenderTexture,
  Sprite,
  Texture,
} from "pixi.js"
import { EventHandler } from "../../util/EventHandler"
import { clamp } from "../../util/Math"
import { Options } from "../../util/Options"
import { bsearch, destroyChildIf } from "../../util/Util"
import { EditMode } from "../ChartManager"
import { ChartRenderer, ChartRendererComponent } from "../ChartRenderer"

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
  private waveformTex: RenderTexture

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
    this.trackVariable(
      () => Options.chart.waveform.antialiasing,
      value => {
        this.filters = value ? [new FXAAFilter()] : []
      }
    )
    this.trackVariable(
      () => this.renderer.chartManager.app.renderer.screen.height,
      () => this.resizeWaveform()
    )
    this.trackVariable(() => Options.chart.waveform.opacity)
    this.trackVariable(() => Options.chart.waveform.filteredOpacity)
    this.trackVariable(() => Options.chart.waveform.filteredColor)
    this.trackVariable(() => Options.chart.waveform.color)
    this.trackVariable(() => Options.chart.waveform.speedChanges)
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

    this.anchor.set(0.5)
    this.renderer.chartManager.chartAudio.onUpdate(() => this.getData())
    this.getData()
    this.resizeWaveform()

    this.filters = Options.chart.waveform.antialiasing ? [new FXAAFilter()] : []

    const timingHandler = () => (this.drawDirty = true)
    const audioChanged = () => {
      this.getData()
      this.resizeWaveform()
      this.renderer.chartManager.chartAudio.onUpdate(() => this.getData())
    }
    EventHandler.on("timingModified", timingHandler)
    this.on("destroyed", () => {
      EventHandler.off("timingModified", timingHandler)
    })
    EventHandler.on("audioLoaded", audioChanged)
    this.on("destroyed", () => {
      EventHandler.off("audioLoaded", audioChanged)
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
        this.renderer.chartManager.app.renderer.screen.width
      ),
      this.renderer.chartManager.app.renderer.screen.height
    )
  }

  update() {
    this.visible =
      Options.chart.waveform.enabled &&
      (this.renderer.chartManager.getMode() != EditMode.Play ||
        !Options.play.hideBarlines)

    if (!Options.chart.waveform.enabled) return
    if (this.drawDirty || this.variableChanged()) {
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

    if (
      Options.chart.waveform.speedChanges &&
      !Options.chart.CMod &&
      Options.chart.doSpeedChanges
    ) {
      // XMod with speed changes

      const chartSpeed = Options.chart.speed
      const speedMult = this.renderer.chart.timingData.getSpeedMult(
        this.renderer.getVisualBeat(),
        this.renderer.getVisualTime()
      )

      const maxDrawBeats =
        this.renderer.getVisualBeat() + Options.chart.maxDrawBeats
      const scrolls = this.renderer.chart.timingData.getTimingData("SCROLLS")
      const offset = this.renderer.chart.timingData.getTimingData("OFFSET")
      const startBPM = this.renderer.chart.timingData.getBPM(0)
      const timingChanges = this.renderer.chart.timingData.getBeatTiming()
      const pixelsToEffectiveBeats =
        100 / chartSpeed / speedMult / 64 / Options.chart.zoom
      const screenHeight = this.renderer.chartManager.app.renderer.screen.height

      let finishedDrawing = false

      // Get the first scroll index after curBeat
      let scrollIndex = bsearch(
        scrolls,
        this.renderer.getVisualBeat() - Options.chart.maxDrawBeatsBack,
        a => a.beat
      )

      let currentBeat = scrolls[scrollIndex]?.beat ?? 0 // start drawing from the start of the scroll section
      if (currentBeat == 0) currentBeat = -Options.chart.maxDrawBeatsBack // Draw the waveform before beat 0
      let curSec = this.renderer.chart.getSecondsFromBeat(currentBeat)

      let currentYPos = Math.round(
        this.renderer.getYPosFromBeat(currentBeat) * Options.chart.zoom +
          this.parent.y
      )
      while (currentBeat < maxDrawBeats && !finishedDrawing) {
        const scroll = scrolls[scrollIndex] ?? { beat: 0, value: 1 }
        const scrollEndBeat = scrolls[scrollIndex + 1]?.beat ?? maxDrawBeats
        const scrollEndYPos =
          this.renderer.getYPosFromBeat(scrollEndBeat) * Options.chart.zoom +
          this.parent.y

        // Skip this scroll if
        // a. value is 0,
        // b. value is positive and ends off the top of the screen
        // c. value is negative and ends off the bottom of the screen
        if (
          scrolls[scrollIndex + 1] &&
          (scroll.value == 0 ||
            (scroll.value < 0 && scrollEndYPos > screenHeight) ||
            (scroll.value > 0 && scrollEndYPos < 0))
        ) {
          scrollIndex++
          currentBeat = scrolls[scrollIndex]!.beat
          currentYPos = Math.round(scrollEndYPos)
          continue
        }

        const pixelsToBeats = pixelsToEffectiveBeats / Math.abs(scroll.value)
        // Start drawing this scroll segment by stepping by 1 pixel
        while (currentBeat < Math.min(scrollEndBeat, maxDrawBeats)) {
          // Stop if the scroll is off the screen
          if (currentYPos < 0) {
            // Skip the scroll if we step off the stop of the screen
            if (scroll.value < 0) {
              currentBeat = scrollEndBeat
              break
            }
            // Skip to the top of the screen and keep stepping from there
            currentBeat += pixelsToBeats * -currentYPos
            currentYPos = 0
          }

          if (currentYPos > screenHeight) {
            // Stop, waveform finished rendering
            if (scroll.value > 0) {
              finishedDrawing = true
              break
            }
            // Skip to the bottom of the screen and keep stepping from there
            currentBeat += pixelsToBeats * (currentYPos - screenHeight)
            currentYPos = screenHeight
            continue
          }

          // Step by 1 or -1 pixels and get the current beat
          currentBeat += pixelsToBeats * Options.chart.waveform.lineHeight
          currentYPos +=
            (scroll.value > 0 ? 1 : -1) * Options.chart.waveform.lineHeight

          // Calculate current second
          const flooredBeat = Math.floor(currentBeat * 1000) / 1000
          if (currentBeat <= 0) curSec = -offset + (currentBeat * 60) / startBPM
          else if (flooredBeat >= timingChanges[1]?.beat) {
            // Use getSeconds for every timing event
            while (flooredBeat >= timingChanges[1]?.beat) timingChanges.shift()
            curSec = this.renderer.chart.getSecondsFromBeat(currentBeat)
          } else {
            // Use normal bpm to beats calculation to not use getSeconds
            const beatsElapsed = currentBeat - timingChanges[0].beat
            let timeElapsed = (beatsElapsed * 60) / timingChanges[0].bpm
            if (timingChanges[0].warped) timeElapsed = 0
            curSec = Math.max(
              timingChanges[0].secondClamp,
              timingChanges[0].secondAfter + timeElapsed
            )
          }
          if (curSec < 0) continue
          // Draw the line
          for (let channel = 0; channel < this.rawData.length; channel++) {
            const line = this.getLine()
            line.scale.x =
              this.getSample(this.rawData[channel], curSec, "main") *
              16 *
              Options.chart.zoom
            line.y = currentYPos
            line.tint = Options.chart.waveform.color
            line.alpha = Options.chart.waveform.opacity
            line.x =
              this.waveformTex.width / 2 +
              288 *
                (channel + 0.5 - this.rawData.length / 2) *
                Options.chart.zoom
            if (!hasFilters) continue
            const filteredLine = this.getLine()
            filteredLine.scale.x =
              this.getSample(this.filteredRawData[channel], curSec, "filter") *
              16 *
              Options.chart.zoom
            filteredLine.tint = Options.chart.waveform.filteredColor
            filteredLine.alpha = Options.chart.waveform.filteredOpacity
            filteredLine.y = currentYPos
            filteredLine.x =
              this.waveformTex.width / 2 +
              288 *
                (channel + 0.5 - this.filteredRawData.length / 2) *
                Options.chart.zoom
          }
        }
        scrollIndex++
        currentBeat = scrollEndBeat
        currentYPos = scrollEndYPos
      }
    } else if (!Options.chart.CMod) {
      // XMod no speed changes

      let currentBeat = this.renderer.getBeatFromYPos(
        -this.parent.y / Options.chart.zoom
      )
      const offset = this.renderer.chart.timingData.getTimingData("OFFSET")
      const startBPM = this.renderer.chart.timingData.getBPM(0)
      const timingChanges = this.renderer.chart.timingData.getBeatTiming()

      // Snap current time to the nearest pixel to avoid flickering
      const pixelsToBeatsRatio =
        this.renderer.getPixelsToEffectiveBeatsRatio() / Options.chart.zoom
      currentBeat =
        Math.floor(currentBeat / pixelsToBeatsRatio) * pixelsToBeatsRatio

      let curSec = this.renderer.chart.getSecondsFromBeat(currentBeat)
      for (
        let y = 0;
        y < this.renderer.chartManager.app.renderer.screen.height;
        y += Options.chart.waveform.lineHeight
      ) {
        currentBeat += pixelsToBeatsRatio * Options.chart.waveform.lineHeight

        const flooredBeat = Math.floor(currentBeat * 1000) / 1000
        if (currentBeat <= 0) curSec = -offset + (currentBeat * 60) / startBPM
        else if (flooredBeat >= timingChanges[1]?.beat) {
          // Use getSeconds for every timing event
          while (flooredBeat >= timingChanges[1]?.beat) timingChanges.shift()
          curSec = this.renderer.chart.getSecondsFromBeat(currentBeat)
        } else {
          // Use normal bpm to beats calculation to not use getSeconds
          const beatsElapsed = currentBeat - timingChanges[0].beat
          let timeElapsed = (beatsElapsed * 60) / timingChanges[0].bpm
          if (timingChanges[0].warped) timeElapsed = 0
          curSec = Math.max(
            timingChanges[0].secondClamp,
            timingChanges[0].secondAfter + timeElapsed
          )
        }

        for (let channel = 0; channel < this.rawData.length; channel++) {
          const line = this.getLine()
          line.scale.x =
            this.getSample(this.rawData[channel], curSec, "main") *
            16 *
            Options.chart.zoom
          line.y = y
          line.x =
            this.waveformTex.width / 2 +
            288 * (channel + 0.5 - this.rawData.length / 2) * Options.chart.zoom
          line.tint = Options.chart.waveform.color
          line.alpha = Options.chart.waveform.opacity
          if (!hasFilters) continue
          const filteredLine = this.getLine()
          filteredLine.scale.x =
            this.getSample(this.filteredRawData[channel], curSec, "filter") *
            16 *
            Options.chart.zoom
          filteredLine.tint = Options.chart.waveform.filteredColor
          filteredLine.alpha = Options.chart.waveform.filteredOpacity
          filteredLine.y = y
          filteredLine.x =
            this.waveformTex.width / 2 +
            288 *
              (channel + 0.5 - this.filteredRawData.length / 2) *
              Options.chart.zoom
        }
      }
    } else {
      // CMod

      let calcTime = this.renderer.getSecondFromYPos(
        -this.parent.y / Options.chart.zoom
      )
      // Snap current time to the nearest pixel to avoid flickering
      const pixelsToSecondsRatio =
        this.renderer.getPixelsToSecondsRatio() / Options.chart.zoom
      calcTime =
        Math.floor(calcTime / pixelsToSecondsRatio) * pixelsToSecondsRatio
      for (
        let y = 0;
        y < this.renderer.chartManager.app.renderer.screen.height;
        y += Options.chart.waveform.lineHeight
      ) {
        calcTime += pixelsToSecondsRatio * Options.chart.waveform.lineHeight

        for (let channel = 0; channel < this.rawData.length; channel++) {
          const line = this.getLine()
          line.scale.x =
            this.getSample(this.rawData[channel], calcTime, "main") *
            16 *
            Options.chart.zoom
          line.y = y
          line.x =
            this.waveformTex.width / 2 +
            288 * (channel + 0.5 - this.rawData.length / 2) * Options.chart.zoom
          line.tint = Options.chart.waveform.color
          line.alpha = Options.chart.waveform.opacity
          if (!hasFilters) continue
          const filteredLine = this.getLine()
          filteredLine.scale.x =
            this.getSample(this.filteredRawData[channel], calcTime, "filter") *
            16 *
            Options.chart.zoom
          filteredLine.tint = Options.chart.waveform.filteredColor
          filteredLine.alpha = Options.chart.waveform.filteredOpacity
          filteredLine.y = y
          filteredLine.x =
            this.waveformTex.width / 2 +
            288 *
              (channel + 0.5 - this.filteredRawData.length / 2) *
              Options.chart.zoom
        }
      }
    }

    this.purgePool()
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
    while (this.lineContainer.children[this.poolSearch]) {
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
