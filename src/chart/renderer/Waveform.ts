import { ParticleContainer, RenderTexture, Sprite, Texture } from "pixi.js"
import { bsearch, getTPS } from "../../util/Util"
import { ChartRenderer } from "../ChartRenderer"
import { ChartAudio } from "../audio/ChartAudio"
import { EditMode } from "../ChartManager"
import { Options } from "../../util/Options"

const MAX_ZOOM = 3500
let LINE_HEIGHT = 1

interface WaveformLine extends Sprite {
  lastUsed: number
}

export class Waveform extends Sprite {

  lineContainer: ParticleContainer = new ParticleContainer(1500, {position: true, scale: true}, 16384, true)
  waveformTex: RenderTexture

  chartAudio: ChartAudio
  renderer: ChartRenderer

  strippedWaveform: number[][] | undefined

  private lastReZoom: number
  private lastZoom: number
  private zoom: number
  private poolSearch = 0
  private lastBeat = 0
  private lastTime = 0

  constructor(renderer: ChartRenderer) {
    super()
    this.renderer = renderer
    this.waveformTex = RenderTexture.create({resolution: 1})
    this.chartAudio = this.renderer.chartManager.songAudio
    this.texture = this.waveformTex
    this.anchor.set(0.5)
    this.lastZoom = this.getZoom()
    this.zoom = this.getZoom()
    this.lastReZoom = Date.now()
    this.chartAudio.addWaveform(this)
    this.refilter()

    setInterval(() => {
      if (getTPS() == 0) return
      if (getTPS() < 60 && LINE_HEIGHT < 3) {
        LINE_HEIGHT = Math.min(3, LINE_HEIGHT + 0.25)
        this.updateLineHeight()
      }
      if (getTPS() > 190 && LINE_HEIGHT > 1) {
        LINE_HEIGHT = Math.max(1, LINE_HEIGHT - 0.25)
        this.updateLineHeight()
      }
    },1000)
  }

  private async stripWaveform(rawData: Float32Array[] | undefined) {
    if (rawData == undefined) return
    this.strippedWaveform = Array.from({ length: rawData.length }, _ => []);
    let blockSize = this.chartAudio.getSampleRate() / (this.zoom*4); // Number of samples in each subdivision
    for (let channel = 0; channel < rawData.length; channel++) {
      let samples = Math.floor(rawData[channel].length / blockSize);
      for (let i = 0; i < samples; i++) {
        let blockStart = Math.floor(blockSize * i); // the location of the first sample in the block
        let sum = 0;
        for (let j = 0; j < blockSize; j++) {
          sum = sum + Math.abs(rawData[channel][blockStart + j]) // find the sum of all the samples in the block
        }
        this.strippedWaveform[channel].push(sum / blockSize); // divide the sum by the block size to get the average
      }
    }
  }

  refilter() {
    this.stripWaveform(this.chartAudio.getRawData())
    this.lastBeat = -1
  }

  renderThis(beat: number, time: number) {
    this.visible = Options.waveform.enabled && (this.renderer.chartManager.getMode() != EditMode.Play || !Options.play.hideBarlines)

    if (!Options.waveform.enabled) return
    if (this.chartAudio != this.renderer.chartManager.getAudio()) {
      this.chartAudio = this.renderer.chartManager.getAudio()
      this.refilter()
      this.chartAudio.addWaveform(this)
    }
    if (this.lastZoom != this.getZoom()) {
      this.lastReZoom = Date.now()
      this.lastZoom = this.getZoom()
    }else{
      if (Date.now() - this.lastReZoom > 120 && this.zoom != this.getZoom()){
        this.zoom = this.getZoom()
        this.refilter()
      }
    }
    this.waveformTex.resize(this.strippedWaveform!.length * 288 ?? 288, this.renderer.chartManager.app.renderer.screen.height)
    if (this.strippedWaveform && (beat != this.lastBeat || time != this.lastTime)) {
      this.lastBeat = beat
      this.lastTime = time
      this.renderData(beat, this.strippedWaveform)
      this.renderer.chartManager.app.renderer.render(this.lineContainer, {renderTexture: this.waveformTex})
      this.tint = Options.waveform.color
    }
  }

  private renderData(beat: number, data: number[][]) {
    this.resetPool()

    if (Options.experimental.speedChangeWaveform && !Options.chart.CMod && Options.chart.doSpeedChanges) {
      let chartSpeed = Options.chart.speed
      let speedMult = this.renderer.chart.timingData.getSpeedMult(beat, this.renderer.chartManager.getTime())
      let curBeat = beat - Options.chart.maxDrawBeatsBack
      let beatLimit = beat + Options.chart.maxDrawBeats
      let scrolls = this.renderer.chart.timingData.getTimingData("SCROLLS")
      let scrollIndex = bsearch(scrolls, curBeat, a => a.beat)
      while (curBeat < beatLimit) {
        let scroll = scrolls[scrollIndex] ?? {beat: 0,value: 1}
        let scrollBeatLimit = scrolls[scrollIndex + 1]?.beat ?? beatLimit
        let y_test = this.renderer.getYPos(curBeat) + this.parent.y 
        if (scrolls[scrollIndex + 1] && ((scroll.value < 0 && y_test > this.renderer.chartManager.app.renderer.screen.height) ||
            scroll.value <= 0)) {
          scrollIndex++
          curBeat = scrolls[scrollIndex]!.beat
          continue
        }
        while (curBeat < Math.min(scrollBeatLimit, beatLimit)) {
          let y = Math.round(this.renderer.getYPos(curBeat) + this.parent.y)
          if (y < 0) {
            if (scroll.value < 0) {
              curBeat = scrollBeatLimit
              break
            }
            curBeat += 100/chartSpeed/speedMult/64/Math.abs(scroll.value) * -y
            continue
          }
          if (y > this.renderer.chartManager.app.renderer.screen.height) {
            if (scroll.value > 0) {
              curBeat = scrollBeatLimit
              break
            }
            curBeat += 100/chartSpeed/speedMult/64/Math.abs(scroll.value) * (y-this.renderer.chartManager.app.renderer.screen.height)
            continue
          }
          curBeat += 100/chartSpeed/speedMult/64/Math.abs(scroll.value) * LINE_HEIGHT
          let calcTime = this.renderer.chart.getSeconds(curBeat)
          if (calcTime < 0) continue
          let samp = Math.floor(calcTime * this.zoom*4)
          for (let channel = 0; channel < data.length; channel++) {
            let v = data[channel][samp];
            if (!v) continue
            let line = this.getLine()
            line.scale.x = v*256 / 16
            line.y = y
            line.x = 144 + 288 * channel
            line.alpha = Options.waveform.opacity
          }
          
        }
        scrollIndex++
        curBeat = scrollBeatLimit
      }
    }else{
      for (let i = 0; i < this.renderer.chartManager.app.renderer.screen.height; i+=LINE_HEIGHT) {
        let calcTime = this.renderer.getTimeFromYPos(i-this.parent.y)
        let samp = Math.floor(calcTime * this.zoom*4)
        for (let channel = 0; channel < data.length; channel ++) {
          let v = data[channel][samp];
          if (!v) continue
          let line = this.getLine()
          line.scale.x = v*256 / 16
          line.y = i
          line.x = 144 + 288 * channel
          line.alpha = Options.waveform.opacity
        }
      }
    }



    this.purgePool()
  }

  private resetPool() {
    this.poolSearch = 0
  }

  private purgePool() {
    for(let i = this.poolSearch; i < this.lineContainer.children.length; i++) {
      let line = this.lineContainer.children[i]
      line.destroy()
      this.lineContainer.removeChild(line)
    }
  }

  private updateLineHeight() {
    for (let child of this.lineContainer.children) {
      let line = child as WaveformLine
      line.height = LINE_HEIGHT
    }
  }

  private getLine(): WaveformLine {
    while (this.lineContainer.children[this.poolSearch]) {
      let w_line = this.lineContainer.children[this.poolSearch] as WaveformLine
      w_line.visible = true
      this.poolSearch++
      return w_line
    }
    let line = new Sprite(Texture.WHITE) as WaveformLine
    line.height = LINE_HEIGHT
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

