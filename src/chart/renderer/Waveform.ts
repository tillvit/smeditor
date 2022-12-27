import { Graphics } from "pixi.js"
import { bsearch } from "../../util/Util"
import { ChartRenderer } from "../ChartRenderer"
import { ChartAudio } from "../audio/ChartAudio"
import { EditMode } from "../ChartManager"
import { Options } from "../../util/Options"

const MAX_ZOOM = 3500

export class Waveform extends Graphics {

  chartAudio: ChartAudio
  renderer: ChartRenderer

  strippedWaveform: number[] | undefined
  strippedFilteredWaveform: number[] | undefined

  private lastReZoom: number
  private lastZoom: number

  constructor(renderer: ChartRenderer) {
    super()
    this.renderer = renderer
    this.chartAudio = this.renderer.chartManager.songAudio
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
    this.visible = Options.waveform.enabled && (this.renderer.chartManager.getMode() != EditMode.Play || !Options.play.hideBarlines)

    if (!Options.waveform.enabled) return
    if (this.chartAudio != this.renderer.chartManager.getAudio()) {
      this.chartAudio = this.renderer.chartManager.getAudio()
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
      this.lineStyle(1, Options.waveform.color, Options.waveform.opacity);
      this.renderData(beat, this.strippedWaveform)
    }
    if (this.strippedFilteredWaveform) {
      this.lineStyle(1, Options.waveform.filteredColor, Options.waveform.filteredOpacity);
      this.renderData(beat, this.strippedFilteredWaveform)
    }
  }

  private renderData(beat: number, data: number[]) {
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
        if (scrolls[scrollIndex + 1] && ((scroll.value < 0 && y_test > this.renderer.chartManager.app.pixi.screen.height) ||
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
          if (y > this.renderer.chartManager.app.pixi.screen.height) {
            if (scroll.value > 0) {
              curBeat = scrollBeatLimit
              break
            }
            curBeat += 100/chartSpeed/speedMult/64/Math.abs(scroll.value) * (y-this.renderer.chartManager.app.pixi.screen.height)
            continue
          }
          curBeat += 100/chartSpeed/speedMult/64/Math.abs(scroll.value)
          let calcTime = this.renderer.chart.getSeconds(curBeat)
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
      for (let i = 0; i < this.renderer.chartManager.app.pixi.screen.height; i++) {
        let calcTime = this.renderer.getTimeFromYPos(i-this.parent.y)
        let samp = Math.floor(calcTime * this.getZoom()*4)
        let v = (data[samp]);
        this.moveTo(-v*192, i-this.parent.y);
        this.lineTo(v*192, i-this.parent.y);
        this.closePath()
      }
    }
  }

  private getZoom(): number {
    return Math.min(Options.chart.speed, MAX_ZOOM)
  }
}

