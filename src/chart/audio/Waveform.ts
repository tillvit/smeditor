import { Graphics } from "pixi.js"
import { bsearch } from "../../util/Util"
import { ChartRenderer } from "../ChartRenderer"
import { ChartAudio } from "./ChartAudio"

const MAX_ZOOM = 3500

export class Waveform {

  chartAudio: ChartAudio
  chartRenderer: ChartRenderer
  view: Graphics = new Graphics()

  strippedWaveform: number[] | undefined
  strippedFilteredWaveform: number[] | undefined

  private lastReZoom: number
  private lastZoom: number

  constructor(renderer: ChartRenderer) {
    this.chartRenderer = renderer
    this.chartAudio = this.chartRenderer.chartManager.songAudio
    this.lastZoom = this.getZoom()
    this.lastReZoom = Date.now()
    this.chartAudio.addWaveform(this)
    this.refilter()
  }

  stripWaveform(rawData: Float32Array | undefined): number[] | undefined {
    if (rawData == undefined) return
    let blockSize = this.chartAudio.getSampleRate() / (this.getZoom()*4); // Number of samples in each subdivision
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
    this.strippedWaveform = this.stripWaveform(this.chartAudio.getRawData())
    this.strippedFilteredWaveform = this.stripWaveform(this.chartAudio.getFilteredRawData())
  }

  render() {
    if (this.chartAudio != this.chartRenderer.chartManager.getAudio()) {
      this.chartAudio = this.chartRenderer.chartManager.getAudio()
      this.refilter()
      this.chartAudio.addWaveform(this)
    }
    if (Date.now() - this.lastReZoom > 40 && this.lastZoom != this.getZoom()) {
      this.lastZoom = this.getZoom()
      this.lastReZoom = Date.now()
      this.refilter()
    }
    if (this.strippedWaveform) {
      this.view.clear()
      this.view.lineStyle(1, this.chartRenderer.options.waveform.color, this.chartRenderer.options.waveform.opacity);
      this.renderData(this.strippedWaveform)
    }
    if (this.strippedFilteredWaveform) {
      this.view.lineStyle(1, this.chartRenderer.options.waveform.filteredColor, this.chartRenderer.options.waveform.filteredOpacity);
      this.renderData(this.strippedFilteredWaveform)
    }
  }

  private renderData(data: number[]) {
    if (this.chartRenderer.options.experimental.speedChangeWaveform && !this.chartRenderer.options.chart.CMod && this.chartRenderer.options.chart.doSpeedChanges) {
      let chartSpeed = this.chartRenderer.options.chart.speed
      let speedMult = this.chartRenderer.chart.timingData.getSpeedMult(this.chartRenderer.chartManager.getBeat(), this.chartRenderer.chartManager.getTime())
      let curBeat = this.chartRenderer.chartManager.getBeat() - this.chartRenderer.options.chart.maxDrawBeatsBack
      let beatLimit = this.chartRenderer.chartManager.getBeat() + this.chartRenderer.options.chart.maxDrawBeats
      let scrolls = this.chartRenderer.chart.timingData.getTimingData("SCROLLS")
      let scrollIndex = bsearch(scrolls, curBeat, a => a.beat)
      while (curBeat < beatLimit) {
        let scroll = scrolls[scrollIndex] ?? {beat: 0,value: 1}
        let scrollBeatLimit = scrolls[scrollIndex + 1]?.beat ?? beatLimit
        let y_test = this.chartRenderer.getYPos(curBeat) + this.view.parent.y 
        if (scrolls[scrollIndex + 1] && ((scroll.value < 0 && y_test > this.chartRenderer.chartManager.app.pixi.screen.height) ||
            scroll.value <= 0)) {
          scrollIndex++
          curBeat = scrolls[scrollIndex]!.beat
          continue
        }
        while (curBeat < scrollBeatLimit) {
          let y = Math.round(this.chartRenderer.getYPos(curBeat) + this.view.parent.y)
          if (y < 0) {
            if (scroll.value < 0) {
              curBeat = scrollBeatLimit
              break
            }
            curBeat += 100/chartSpeed/speedMult/64/Math.abs(scroll.value) * -y
            continue
          }
          if (y > this.chartRenderer.chartManager.app.pixi.screen.height) {
            if (scroll.value > 0) {
              curBeat = scrollBeatLimit
              break
            }
            curBeat += 100/chartSpeed/speedMult/64/Math.abs(scroll.value) * (y-this.chartRenderer.chartManager.app.pixi.screen.height)
            continue
          }
          curBeat += 100/chartSpeed/speedMult/64/Math.abs(scroll.value)
          let calcTime = this.chartRenderer.chart.getSeconds(curBeat)
          if (calcTime < 0) continue
          let samp = Math.floor(calcTime * this.getZoom()*4)
          let v = (data[samp]);
          this.view.moveTo(-v*192-32, y-this.view.parent.y);
          this.view.lineTo(v*192-32, y-this.view.parent.y);
          this.view.closePath()
          
        }
        scrollIndex++
        curBeat = scrollBeatLimit
      }
    }else{
      for (let i = 0; i < this.chartRenderer.chartManager.app.pixi.screen.height; i++) {
        let calcTime = this.chartRenderer.getTimeFromYPos(i-this.view.parent.y)
        let samp = Math.floor(calcTime * this.getZoom()*4)
        let v = (data[samp]);
        this.view.moveTo(-v*192-32, i-this.view.parent.y);
        this.view.lineTo(v*192-32, i-this.view.parent.y);
        this.view.closePath()
      }
    }
  }

  private getZoom(): number {
    return Math.min(this.chartRenderer.options.chart.speed, MAX_ZOOM)
  }
}

