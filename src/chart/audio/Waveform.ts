import { Graphics } from "pixi.js"
import { ChartRenderer } from "../ChartRenderer"
import { ChartAudio } from "./ChartAudio"

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
    this.lastZoom = this.chartRenderer.options.chart.speed
    this.lastReZoom = Date.now()
    this.chartAudio.addWaveform(this)
    this.refilter()
  }

  stripWaveform(rawData: Float32Array | undefined): number[] | undefined {
    if (rawData == undefined) return
    let blockSize = this.chartAudio.getSampleRate() / (this.chartRenderer.options.chart.speed*4); // Number of samples in each subdivision
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
    if (Date.now() - this.lastReZoom > 40 && this.lastZoom != this.chartRenderer.options.chart.speed) {
      this.lastZoom = this.chartRenderer.options.chart.speed
      this.lastReZoom = Date.now()
      this.refilter()
    }
    if (this.strippedWaveform) {
      this.view.clear()
      this.view.lineStyle(1, this.chartRenderer.options.waveform.color, this.chartRenderer.options.waveform.opacity);
      for (let i = 0; i < this.chartRenderer.chartManager.app.pixi.screen.height; i++) {
        let calcTime = this.chartRenderer.getTimeFromYPos(i-this.view.parent.y)
        let samp = Math.floor(calcTime * this.chartRenderer.options.chart.speed*4)
        let v = (this.strippedWaveform[samp]);
        this.view.moveTo(-v*192-32, i-this.view.parent.y);
        this.view.lineTo(v*192-32, i-this.view.parent.y);
        this.view.closePath()
      }
    }
    if (this.strippedFilteredWaveform) {
      this.view.lineStyle(1, this.chartRenderer.options.waveform.filteredColor, this.chartRenderer.options.waveform.filteredOpacity);
      for (let i = 0; i < this.chartRenderer.chartManager.app.pixi.screen.height; i++) {
        let calcTime = this.chartRenderer.getTimeFromYPos(i-this.view.parent.y)
        let samp = Math.floor(calcTime * this.chartRenderer.options.chart.speed*4)
        let v = (this.strippedFilteredWaveform[samp]);
        this.view.moveTo(-v*192-32, i-this.view.parent.y);
        this.view.lineTo(v*192-32, i-this.view.parent.y);
        this.view.closePath()
      }
    }

  }
}

