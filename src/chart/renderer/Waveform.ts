import { ParticleContainer, RenderTexture, Sprite, Texture } from "pixi.js"
import { EventHandler } from "../../util/EventHandler"
import { Options } from "../../util/Options"
import { bsearch, destroyChildIf } from "../../util/Util"
import { ChartAudio } from "../audio/ChartAudio"
import { EditMode } from "../ChartManager"
import { ChartRenderer } from "../ChartRenderer"

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

    EventHandler.on("timingModified", () => (this.lastBeat = -1))
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

  renderThis(beat: number, time: number) {
    this.visible =
      Options.chart.waveform.enabled &&
      (this.renderer.chartManager.getMode() != EditMode.Play ||
        !Options.play.hideBarlines)

    if (!Options.chart.waveform.enabled) return
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
      let curBeat = beat - Options.chart.maxDrawBeatsBack
      const beatLimit = beat + Options.chart.maxDrawBeats
      const scrolls = this.renderer.chart.timingData.getTimingData("SCROLLS")
      const offset = this.renderer.chart.timingData.getTimingData("OFFSET")
      const startBPM = this.renderer.chart.timingData.getBPM(0)
      const timingChanges = this.renderer.chart.timingData.getBeatTiming()
      let curSec = this.renderer.chart.getSeconds(curBeat)

      let scrollIndex = bsearch(scrolls, curBeat, a => a.beat)
      if (scrolls[scrollIndex]?.beat != 0) scrollIndex--
      let y = Math.round(
        this.renderer.getYPos(curBeat) * Options.chart.zoom + this.parent.y
      )
      while (curBeat < beatLimit) {
        const scroll = scrolls[scrollIndex] ?? { beat: 0, value: 1 }
        const scrollBeatLimit = scrolls[scrollIndex + 1]?.beat ?? beatLimit
        const y_test =
          this.renderer.getYPos(scrollBeatLimit) * Options.chart.zoom +
          this.parent.y
        if (
          scrolls[scrollIndex + 1] &&
          (scroll.value == 0 ||
            (scroll.value < 0 &&
              y_test > this.renderer.chartManager.app.renderer.screen.height) ||
            (scroll.value > 0 && y_test < 0))
        ) {
          scrollIndex++
          curBeat = scrolls[scrollIndex]!.beat
          y = Math.round(y_test)
          continue
        }
        while (curBeat < Math.min(scrollBeatLimit, beatLimit)) {
          if (y < 0) {
            if (scroll.value < 0) {
              curBeat = scrollBeatLimit
              break
            }
            curBeat +=
              ((100 / chartSpeed / speedMult / 64 / Math.abs(scroll.value)) *
                -y) /
              Options.chart.zoom
            y = 0
          }

          if (y > this.renderer.chartManager.app.renderer.screen.height) {
            if (scroll.value > 0) {
              curBeat = beatLimit
              break
            }
            curBeat +=
              ((100 / chartSpeed / speedMult / 64 / Math.abs(scroll.value)) *
                (y - this.renderer.chartManager.app.renderer.screen.height)) /
              Options.chart.zoom
            y = this.renderer.chartManager.app.renderer.screen.height
            continue
          }
          curBeat +=
            ((100 / chartSpeed / speedMult / 64 / Math.abs(scroll.value)) *
              Options.chart.waveform.lineHeight) /
            Options.chart.zoom
          y += (scroll.value > 0 ? 1 : -1) * Options.chart.waveform.lineHeight
          const flooredBeat = Math.floor(curBeat * 1000) / 1000
          if (curBeat <= 0) curSec = -offset + (curBeat * 60) / startBPM
          else if (flooredBeat >= timingChanges[1]?.beat) {
            while (flooredBeat >= timingChanges[1]?.beat) timingChanges.shift()
            curSec = this.renderer.chart.getSeconds(curBeat)
          } else {
            const beatsElapsed = curBeat - timingChanges[0].beat
            let timeElapsed = (beatsElapsed * 60) / timingChanges[0].bpm
            if (timingChanges[0].warped) timeElapsed = 0
            curSec = Math.max(
              timingChanges[0].secondClamp,
              timingChanges[0].secondAfter + timeElapsed
            )
          }
          if (curSec < 0) continue
          const samp = Math.floor(curSec * this.zoom * 4)
          for (let channel = 0; channel < data.length; channel++) {
            const v = data[channel][samp]
            if (!v) continue
            const line = this.getLine()
            line.scale.x = ((v * 256) / 16) * Options.chart.zoom
            line.y = y
            line.x =
              this.waveformTex.width / 2 +
              288 * (channel + 0.5 - data.length / 2) * Options.chart.zoom
          }
        }
        scrollIndex++
        curBeat = scrollBeatLimit
        y = y_test
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
          line.scale.x = ((v * 256) / 16) * Options.chart.zoom
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
