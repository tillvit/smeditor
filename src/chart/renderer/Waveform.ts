import { Container, Sprite, Texture } from "pixi.js"
import { bsearch } from "../../util/Util"
import { ChartRenderer } from "../ChartRenderer"
import { ChartAudio } from "../audio/ChartAudio"
import { EditMode } from "../ChartManager"
import { Options } from "../../util/Options"

const MAX_ZOOM = 3500

interface WaveformLine extends Sprite {
  lastUsed: number
  active: boolean
}

export class Waveform extends Container {

  children: WaveformLine[] = []

  chartAudio: ChartAudio
  renderer: ChartRenderer

  strippedWaveform: number[] | undefined
  strippedFilteredWaveform: number[] | undefined

  private lastReZoom: number
  private lastZoom: number
  private zoom: number

  constructor(renderer: ChartRenderer) {
    super()
    this.renderer = renderer
    this.chartAudio = this.renderer.chartManager.songAudio
    this.lastZoom = this.getZoom()
    this.zoom = this.getZoom()
    this.lastReZoom = Date.now()
    this.chartAudio.addWaveform(this)
    this.refilter()
  }

  private async stripWaveform(rawData: Float32Array | undefined): Promise<number[] | undefined> {
    if (rawData == undefined) return
    let blockSize = this.chartAudio.getSampleRate() / (this.zoom*4); // Number of samples in each subdivision
    let samples = Math.floor(rawData.length / blockSize);
    let filteredData = [];
    for (let i = 0; i < samples; i++) {
      let blockStart = Math.floor(blockSize * i); // the location of the first sample in the block
      let sum = 0;
      for (let j = 0; j < blockSize; j++) {
        sum = sum + Math.abs(rawData[blockStart + j]) // find the sum of all the samples in the block
      }
      filteredData.push(sum / blockSize); // divide the sum by the block size to get the average
    }
    return filteredData
  }

  refilter() {
    this.stripWaveform(this.chartAudio.getRawData()).then(data => this.strippedWaveform = data)
    this.stripWaveform(this.chartAudio.getFilteredRawData()).then(data => this.strippedFilteredWaveform = data)
  }

  renderThis(beat: number) {
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
    this.children.forEach(line => line.active = false)
    if (this.strippedWaveform) {
      this.renderData(beat, this.strippedWaveform, Options.waveform.color, Options.waveform.opacity)
    }
    if (this.strippedFilteredWaveform) {
      this.renderData(beat, this.strippedFilteredWaveform, Options.waveform.filteredColor, Options.waveform.filteredOpacity)
    }
    this.children.forEach(line => line.visible = line.active)
    this.children.filter(line => Date.now() - line.lastUsed > 5000).forEach(line => {
      line.destroy()
      this.removeChild(line)
    })
  }

  private renderData(beat: number, data: number[], color: number, opacity: number) {
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
        while (curBeat < scrollBeatLimit) {
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
          curBeat += 100/chartSpeed/speedMult/64/Math.abs(scroll.value)
          let calcTime = this.renderer.chart.getSeconds(curBeat)
          if (calcTime < 0) continue
          let samp = Math.floor(calcTime * this.zoom*4)
          let v = data[samp];
          if (!v) continue
          let line = this.getLine()
          line.width = v*384
          line.y = y-this.parent.y
          line.tint = color
          line.alpha = opacity
          
        }
        scrollIndex++
        curBeat = scrollBeatLimit
      }
    }else{
      for (let i = 0; i < this.renderer.chartManager.app.renderer.screen.height; i++) {
        let calcTime = this.renderer.getTimeFromYPos(i-this.parent.y)
        let samp = Math.floor(calcTime * this.zoom*4)
        let v = (data[samp]);
        if (!v) continue
        let line = this.getLine()
        line.width = v*384
        line.y = i-this.parent.y
        line.tint = color
        line.alpha = opacity
      }
    }
  }

  private getLine(): WaveformLine {
    for (let line of this.children) {
      if (!line.active) {
        line.active = true
        line.lastUsed = Date.now()
        return line
      }
    }
    let line = new Sprite(Texture.WHITE) as WaveformLine
    line.height = 1
    line.anchor.set(0.5)
    line.lastUsed = Date.now()
    line.active = true
    this.addChild(line)
    return line
  }

  private getZoom(): number {
    return Math.min(Options.chart.speed, MAX_ZOOM)
  }
}

