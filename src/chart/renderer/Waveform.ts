import { ParticleContainer, RenderTexture, Sprite, Texture } from "pixi.js"
import { bsearch, destroyChildIf, getTPS } from "../../util/Util"
import { ChartRenderer } from "../ChartRenderer"
import { ChartAudio } from "../audio/ChartAudio"
import { EditMode } from "../ChartManager"
import { Options } from "../../util/Options"

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
  private lastLineHeight = Options.waveform.lineHeight

  constructor(renderer: ChartRenderer) {
    super()
    this.renderer = renderer
    this.waveformTex = RenderTexture.create({
      resolution: Math.min(1, Options.performance.resolution),
    })
    this.chartAudio = this.renderer.chartManager.songAudio
    this.texture = this.waveformTex

    this.white = new Sprite(Texture.WHITE)
    this.white.width = 16
    this.white.height = 16

    this.anchor.set(0.5)
    this.lastZoom = this.getZoom()
    this.zoom = this.getZoom()
    this.lastReZoom = Date.now()
    this.chartAudio.addWaveform(this)
    this.refilter()

    setInterval(() => {
      if (!Options.waveform.autoAdjustQuality)
        if (getTPS() == 0 || !this.visible) return
      if (getTPS() < 60 && Options.waveform.lineHeight < 3) {
        Options.waveform.lineHeight = Math.min(
          3,
          Options.waveform.lineHeight + 0.25
        )
      }
      if (getTPS() > 190 && Options.waveform.lineHeight > 1) {
        Options.waveform.lineHeight = Math.max(
          1,
          Options.waveform.lineHeight - 0.25
        )
      }
    }, 1000)
  }

  private async stripWaveform(rawData: Float32Array[] | undefined) {
    if (rawData == undefined) return
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
  }

  refilter() {
    this.stripWaveform(this.chartAudio.getRawData())
    this.lastBeat = -1
  }

  renderThis(beat: number, time: number) {
    this.visible =
      Options.waveform.enabled &&
      (this.renderer.chartManager.getMode() != EditMode.Play ||
        !Options.play.hideBarlines)

    if (!Options.waveform.enabled) return
    if (this.chartAudio != this.renderer.chartManager.getAudio()) {
      this.chartAudio = this.renderer.chartManager.getAudio()
      this.refilter()
      this.chartAudio.addWaveform(this)
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
    if (this.lastLineHeight != Options.waveform.lineHeight) {
      this.lastLineHeight = Options.waveform.lineHeight
      if (Options.waveform.lineHeight <= 0) Options.waveform.lineHeight = 1
      this.updateLineHeight()
    }
    this.waveformTex.resize(
      this.strippedWaveform!.length * 288 ?? 288,
      this.renderer.chartManager.app.renderer.screen.height
    )
    this.white.alpha = Options.waveform.opacity
    this.renderer.chartManager.app.renderer.render(this.white, {
      renderTexture: this.lineTex,
    })
    if (
      this.strippedWaveform &&
      (beat != this.lastBeat || time != this.lastTime)
    ) {
      this.lastBeat = beat
      this.lastTime = time
      this.renderData(beat, this.strippedWaveform)
      this.renderer.chartManager.app.renderer.render(this.lineContainer, {
        renderTexture: this.waveformTex,
      })
      this.tint = Options.waveform.color
    }
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
      let curBeat = beat - Options.chart.maxDrawBeatsBack
      const beatLimit = beat + Options.chart.maxDrawBeats
      const scrolls = this.renderer.chart.timingData.getTimingData("SCROLLS")
      let scrollIndex = bsearch(scrolls, curBeat, a => a.beat)
      while (curBeat < beatLimit) {
        const scroll = scrolls[scrollIndex] ?? { beat: 0, value: 1 }
        const scrollBeatLimit = scrolls[scrollIndex + 1]?.beat ?? beatLimit
        const y_test = this.renderer.getYPos(curBeat) + this.parent.y
        if (
          scrolls[scrollIndex + 1] &&
          ((scroll.value < 0 &&
            y_test > this.renderer.chartManager.app.renderer.screen.height) ||
            scroll.value <= 0)
        ) {
          scrollIndex++
          curBeat = scrolls[scrollIndex]!.beat
          continue
        }
        while (curBeat < Math.min(scrollBeatLimit, beatLimit)) {
          const y = Math.round(this.renderer.getYPos(curBeat) + this.parent.y)
          if (y < 0) {
            if (scroll.value < 0) {
              curBeat = scrollBeatLimit
              break
            }
            curBeat +=
              (100 / chartSpeed / speedMult / 64 / Math.abs(scroll.value)) * -y
            continue
          }
          if (y > this.renderer.chartManager.app.renderer.screen.height) {
            if (scroll.value > 0) {
              curBeat = scrollBeatLimit
              break
            }
            curBeat +=
              (100 / chartSpeed / speedMult / 64 / Math.abs(scroll.value)) *
              (y - this.renderer.chartManager.app.renderer.screen.height)
            continue
          }
          curBeat +=
            (100 / chartSpeed / speedMult / 64 / Math.abs(scroll.value)) *
            Options.waveform.lineHeight
          const calcTime = this.renderer.chart.getSeconds(curBeat)
          if (calcTime < 0) continue
          const samp = Math.floor(calcTime * this.zoom * 4)
          for (let channel = 0; channel < data.length; channel++) {
            const v = data[channel][samp]
            if (!v) continue
            const line = this.getLine()
            line.scale.x = (v * 256) / 16
            line.y = y
            line.x = 144 + 288 * channel
          }
        }
        scrollIndex++
        curBeat = scrollBeatLimit
      }
    } else {
      for (
        let i = 0;
        i < this.renderer.chartManager.app.renderer.screen.height;
        i += Options.waveform.lineHeight
      ) {
        const calcTime = this.renderer.getTimeFromYPos(i - this.parent.y)
        const samp = Math.floor(calcTime * this.zoom * 4)
        for (let channel = 0; channel < data.length; channel++) {
          const v = data[channel][samp]
          if (!v) continue
          const line = this.getLine()
          line.scale.x = (v * 256) / 16
          line.y = i
          line.x = 144 + 288 * channel
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
      line.height = Options.waveform.lineHeight
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
    line.height = Options.waveform.lineHeight
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
