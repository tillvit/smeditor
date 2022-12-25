import { Graphics } from "pixi.js"
import { bsearch } from "../../util/Util"
import { ChartRenderer } from "../ChartRenderer"
import { ChartAudio } from "../audio/ChartAudio"
import { EditMode } from "../ChartManager"

const MAX_ZOOM = 3500

export class Waveform extends Graphics {

  chartAudio: ChartAudio
  chartRenderer: ChartRenderer

  strippedWaveform: number[] | undefined
  strippedFilteredWaveform: number[] | undefined

  private lastReZoom: number
  private lastZoom: number

  constructor(renderer: ChartRenderer) {
    super()
    this.chartRenderer = renderer
    this.chartAudio = this.chartRenderer.chartManager.songAudio
    this.lastZoom = this.getZoom()
    this.lastReZoom = Date.now()
    this.chartAudio.addWaveform(this)
    this.refilter()
  }

  private async stripWaveform(rawData: Float32Array | undefined): Promise<number[] | undefined> {
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
    this.stripWaveform(this.chartAudio.getRawData()).then(data => this.strippedWaveform = data)
    this.stripWaveform(this.chartAudio.getFilteredRawData()).then(data => this.strippedFilteredWaveform = data)
  }

  renderThis(beat: number) {
    this.visible = this.chartRenderer.options.waveform.enabled && (this.chartRenderer.chartManager.getMode() != EditMode.Play || !this.chartRenderer.options.play.hideBarlines)

    if (!this.chartRenderer.options.waveform.enabled) return
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
      this.clear()
      this.lineStyle(1, this.chartRenderer.options.waveform.color, this.chartRenderer.options.waveform.opacity);
      this.renderData(beat, this.strippedWaveform)
    }
    if (this.strippedFilteredWaveform) {
      this.lineStyle(1, this.chartRenderer.options.waveform.filteredColor, this.chartRenderer.options.waveform.filteredOpacity);
      this.renderData(beat, this.strippedFilteredWaveform)
    }
  }

  private renderData(beat: number, data: number[]) {
    if (this.chartRenderer.options.experimental.speedChangeWaveform && !this.chartRenderer.options.chart.CMod && this.chartRenderer.options.chart.doSpeedChanges) {
      let chartSpeed = this.chartRenderer.options.chart.speed
      let speedMult = this.chartRenderer.chart.timingData.getSpeedMult(beat, this.chartRenderer.chartManager.getTime())
      let curBeat = beat - this.chartRenderer.options.chart.maxDrawBeatsBack
      let beatLimit = beat + this.chartRenderer.options.chart.maxDrawBeats
      let scrolls = this.chartRenderer.chart.timingData.getTimingData("SCROLLS")
      let scrollIndex = bsearch(scrolls, curBeat, a => a.beat)
      while (curBeat < beatLimit) {
        let scroll = scrolls[scrollIndex] ?? {beat: 0,value: 1}
        let scrollBeatLimit = scrolls[scrollIndex + 1]?.beat ?? beatLimit
        let y_test = this.chartRenderer.getYPos(curBeat) + this.parent.y 
        if (scrolls[scrollIndex + 1] && ((scroll.value < 0 && y_test > this.chartRenderer.chartManager.app.pixi.screen.height) ||
            scroll.value <= 0)) {
          scrollIndex++
          curBeat = scrolls[scrollIndex]!.beat
          continue
        }
        while (curBeat < scrollBeatLimit) {
          let y = Math.round(this.chartRenderer.getYPos(curBeat) + this.parent.y)
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
          this.moveTo(-v*192, y-this.parent.y);
          this.lineTo(v*192, y-this.parent.y);
          this.closePath()
          
        }
        scrollIndex++
        curBeat = scrollBeatLimit
      }
    }else{
      for (let i = 0; i < this.chartRenderer.chartManager.app.pixi.screen.height; i++) {
        let calcTime = this.chartRenderer.getTimeFromYPos(i-this.parent.y)
        let samp = Math.floor(calcTime * this.getZoom()*4)
        let v = (data[samp]);
        this.moveTo(-v*192, i-this.parent.y);
        this.lineTo(v*192, i-this.parent.y);
        this.closePath()
      }
    }
  }

  private getZoom(): number {
    return Math.min(this.chartRenderer.options.chart.speed, MAX_ZOOM)
  }
}

