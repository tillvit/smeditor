import { app } from "../../App.js";

var rawData
var sampleRate
var waveform
var filteredWaveform
var audioWrapper
let graphic;
let ch

export function createWaveform(chart) {
  ch = chart
  graphic = new PIXI.Graphics();
  return graphic
}

export function loadAudio(wrapper) {
  rawData = wrapper._buffer.getChannelData(0)
  sampleRate = wrapper._buffer.sampleRate
  waveform = filterWaveForm(rawData)
  audioWrapper = wrapper
}

function filterWaveForm(rawData) {
  if (rawData == undefined)
    return
  const blockSize = sampleRate / (window.options.chart.speed*4); // Number of samples in each subdivision
  const samples = Math.floor(rawData.length / blockSize);
  const filteredData = [];
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

export function setWaveformZoom() {
  waveform = filterWaveForm(rawData)
  if (audioWrapper.filteredRawData) filteredWaveform = filterWaveForm(audioWrapper.filteredRawData)
}

export function recalcFilter() {
  if (audioWrapper.filteredRawData) filteredWaveform = filterWaveForm(audioWrapper.filteredRawData)
}

export function renderWaveform() {
  if (waveform) {
    graphic.clear()
    graphic.lineStyle(1, window.options.waveform.color);
    for (let i = 0; i < app.screen.height; i++) {
      let calcTime = ch.getTimeFromYPos(i-graphic.parent.y)
      
      let samp = Math.floor(calcTime * window.options.chart.speed*4)

      let v = (waveform[samp]);
      graphic.moveTo(-v*192-32, i-graphic.parent.y);
      graphic.lineTo(v*192-32, i-graphic.parent.y);
      graphic.closePath()

    }
  }
  if (filteredWaveform) {
    graphic.lineStyle(1, 0x00ff00, 0.2);
    for (let i = 0; i < app.screen.height; i++) {
      let calcTime = ch.getTimeFromYPos(i-graphic.parent.y)
      
      let samp = Math.floor(calcTime * window.options.chart.speed*4)

      let v = (filteredWaveform[samp]);
      graphic.moveTo(-v*192-32, i-graphic.parent.y);
      graphic.lineTo(v*192-32, i-graphic.parent.y);
      graphic.closePath()

    }
  }
}
