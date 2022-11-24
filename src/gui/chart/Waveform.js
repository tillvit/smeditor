import { app } from "../../App.js";

var rawData
var sampleRate
var waveform
let graphic;
let ac = new AudioContext()
let ch

export function createWaveform(chart) {
  ch = chart
  graphic = new PIXI.Graphics();
  return graphic
}

export function loadAudio(url) {
  getData(url).then(function(result) {
    rawData = result.getChannelData(0)
    sampleRate = result.sampleRate
    filterWaveForm()
  });
}

function filterWaveForm() {
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
  waveform = filteredData
}

async function getData(url) {
  let result = await fetch(url)
  .then(response => response.arrayBuffer())
  .then(arrayBuffer => ac.decodeAudioData(arrayBuffer))
  return result;
}

export function setWaveformZoom() {
  filterWaveForm()
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
}