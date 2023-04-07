import { ParticleContainer, RenderTexture, Sprite, Texture } from "pixi.js"
import { EventHandler } from "../../util/EventHandler"
import { Options } from "../../util/Options"
import { bsearch, destroyChildIf } from "../../util/Util"
import { EditMode } from "../ChartManager"
import { ChartRenderer } from "../ChartRenderer"
import { ChartAudio } from "../audio/ChartAudio"

const MAX_ZOOM = 3500

interface WaveformLine extends Sprite {
  lastUsed: number
}

export class Waveform extends Sprite {
  lineContainer: ParticleContainer = new ParticleContainer(
    1500,
    { position: true, scale: true },
    16384,
    true
  )
  waveformTex: RenderTexture
  lineTex: RenderTexture = RenderTexture.create({ width: 16, height: 16 })

  chartAudio: ChartAudio
  renderer: ChartRenderer
  white: Sprite

  strippedWaveform: number[][] | undefined

  private lastReZoom: number
  private lastZoom: number
  private zoom: number
  private poolSearch = 0
  private lastBeat = 0
  private lastTime = 0
  private lastHeight = 0
  private lastLineHeight = Options.chart.waveform.lineHeight

  constructor(renderer: ChartRenderer) {
    super()
    this.renderer = renderer
    this.waveformTex = RenderTexture.create({
      resolution: Math.min(1, Options.performance.resolution),
    })
    this.chartAudio = this.renderer.chartManager.chartAudio
    this.texture = this.waveformTex

    this.white = new Sprite(Texture.WHITE)
    this.white.width = 16
    this.white.height = 16

    this.anchor.set(0.5)
    this.lastZoom = this.getZoom()
    this.zoom = this.getZoom()
    this.lastReZoom = Date.now()
    this.chartAudio.bindWaveform(this)
    this.refilter()

    const timingHandler = () => (this.lastBeat = -1)
    EventHandler.on("timingModified", timingHandler)
    this.on("destroyed", () => {
      EventHandler.off("timingModified", timingHandler)
    })
  }

  private async stripWaveform(
    rawData: Float32Array[] | undefined
  ): Promise<void> {
    return new Promise(resolve => {
      if (rawData == undefined) {
        resolve()
        return
      }
      this.strippedWaveform = Array.from({ length: rawData.length }, () => [])
      const blockSize = this.chartAudio.getSampleRate() / (this.zoom * 4) // Number of samples in each subdivision
      for (let channel = 0; channel < rawData.length; channel++) {
        const samples = Math.floor(rawData[channel].length / blockSize)
        for (let i = 0; i < samples; i++) {
          const blockStart = Math.floor(blockSize * i) // the location of the first sample in the block
          let sum = 0
          for (let j = 0; j < blockSize; j++) {
            sum = sum + Math.abs(rawData[channel][blockStart + j]) // find the sum of all the samples in the block
          }
          this.strippedWaveform[channel].push(sum / blockSize) // divide the sum by the block size to get the average
        }
      }
      resolve()
    })
  }

  refilter() {
    this.stripWaveform(this.chartAudio.getRawData())
    this.lastBeat = -1
  }

  update(beat: number, time: number) {
    this.visible =
      Options.chart.waveform.enabled &&
      (this.renderer.chartManager.getMode() != EditMode.Play ||
        !Options.play.hideBarlines)

    if (!Options.chart.waveform.enabled) return
    if (this.chartAudio != this.renderer.chartManager.getAudio()) {
      this.chartAudio = this.renderer.chartManager.getAudio()
      this.refilter()
      this.chartAudio.bindWaveform(this)
    }
    if (this.lastZoom != this.getZoom()) {
      this.lastReZoom = Date.now()
      this.lastZoom = this.getZoom()
      this.lastBeat = -1
    } else {
      if (Date.now() - this.lastReZoom > 120 && this.zoom != this.getZoom()) {
        this.zoom = this.getZoom()
        this.refilter()
      }
    }
    if (this.lastLineHeight != Options.chart.waveform.lineHeight) {
      this.lastLineHeight = Options.chart.waveform.lineHeight
      if (Options.chart.waveform.lineHeight <= 0)
        Options.chart.waveform.lineHeight = 1
      this.updateLineHeight()
    }
    this.waveformTex.resize(
      Math.min(
        this.renderer.chartManager.app.renderer.screen.width,
        (this.strippedWaveform?.length ?? 0) * 288 * Options.chart.zoom
      ),
      this.renderer.chartManager.app.renderer.screen.height
    )
    this.white.alpha = Options.chart.waveform.opacity
    this.renderer.chartManager.app.renderer.render(this.white, {
      renderTexture: this.lineTex,
    })
    if (
      this.strippedWaveform &&
      (beat != this.lastBeat ||
        time != this.lastTime ||
        this.renderer.chartManager.app.renderer.screen.height *
          Options.chart.zoom !=
          this.lastHeight)
    ) {
      this.lastBeat = beat
      this.lastTime = time
      this.lastHeight =
        this.renderer.chartManager.app.renderer.screen.height *
        Options.chart.zoom
      this.renderData(beat, this.strippedWaveform)
      this.renderer.chartManager.app.renderer.render(this.lineContainer, {
        renderTexture: this.waveformTex,
      })
      this.tint = Options.chart.waveform.color
    }
    this.scale.set(1 / Options.chart.zoom)
  }

  private renderData(beat: number, data: number[][]) {
    this.resetPool()

    if (
      Options.experimental.speedChangeWaveform &&
      !Options.chart.CMod &&
      Options.chart.doSpeedChanges
    ) {
      const chartSpeed = Options.chart.speed
      const speedMult = this.renderer.chart.timingData.getSpeedMult(
        beat,
        this.renderer.chartManager.getTime()
      )
      let currentBeat = beat - Options.chart.maxDrawBeatsBack
      const maxDrawBeats = beat + Options.chart.maxDrawBeats
      const scrolls = this.renderer.chart.timingData.getTimingData("SCROLLS")
      const offset = this.renderer.chart.timingData.getTimingData("OFFSET")
      const startBPM = this.renderer.chart.timingData.getBPM(0)
      const timingChanges = this.renderer.chart.timingData.getBeatTiming()
      const pixelsToEffectiveBeats =
        100 / chartSpeed / speedMult / 64 / Options.chart.zoom
      const screenHeight = this.renderer.chartManager.app.renderer.screen.height
      let curSec = this.renderer.chart.getSecondsFromBeat(currentBeat)
      let finishedDrawing = false

      // Get the first scroll index after curBeat
      let scrollIndex = bsearch(scrolls, currentBeat, a => a.beat)
      if (scrolls[scrollIndex]?.beat != 0) scrollIndex--
      let currentYPos = Math.round(
        this.renderer.getYPos(currentBeat) * Options.chart.zoom + this.parent.y
      )
      while (currentBeat < maxDrawBeats && !finishedDrawing) {
        const scroll = scrolls[scrollIndex] ?? { beat: 0, value: 1 }
        const scrollEndBeat = scrolls[scrollIndex + 1]?.beat ?? maxDrawBeats
        const scrollEndYPos =
          this.renderer.getYPos(scrollEndBeat) * Options.chart.zoom +
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
          const samp = Math.floor(curSec * this.zoom * 4)
          for (let channel = 0; channel < data.length; channel++) {
            const v = data[channel][samp]
            if (!v) continue
            const line = this.getLine()
            line.scale.x = v * 16 * Options.chart.zoom
            line.y = currentYPos
            line.x =
              this.waveformTex.width / 2 +
              288 * (channel + 0.5 - data.length / 2) * Options.chart.zoom
          }
        }
        scrollIndex++
        currentBeat = scrollEndBeat
        currentYPos = scrollEndYPos
      }
    } else {
      for (
        let y = 0;
        y < this.renderer.chartManager.app.renderer.screen.height;
        y += Options.chart.waveform.lineHeight
      ) {
        const calcTime = this.renderer.getTimeFromYPos(
          (y - this.parent.y) / Options.chart.zoom
        )
        const samp = Math.floor(calcTime * this.zoom * 4)
        for (let channel = 0; channel < data.length; channel++) {
          const v = data[channel][samp]
          if (!v) continue
          const line = this.getLine()
          line.scale.x = v * 16 * Options.chart.zoom
          line.y = y
          line.x =
            this.waveformTex.width / 2 +
            288 * (channel + 0.5 - data.length / 2) * Options.chart.zoom
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
    const line = new Sprite(this.lineTex) as WaveformLine
    line.height = Options.chart.waveform.lineHeight
    line.anchor.set(0.5)
    line.visible = true
    this.poolSearch++
    this.lineContainer.addChild(line)
    return line
  }

  private getZoom(): number {
    return Math.min(Options.chart.speed, MAX_ZOOM)
  }
}
