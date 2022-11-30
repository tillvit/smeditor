import { createWindow } from "../BaseWindow.js";

export function createEQWindow() {
  let window = createWindow("Audio Equalizer", 600, 200, "eq", true)
  makeEQView(window)
  return window
}


function makeEQView(view) {
  let canvas = document.createElement("canvas")
  view.appendChild(canvas)
  let frameDraw = drawEQ(canvas)
  requestAnimationFrame(frameDraw)
}

function drawEQ(canvas){
  let ctx = canvas.getContext("2d");
  let freqLines = [20,30,40,50,60,70,80,90,100,200,300,400,500,600,700,800,900,1000,2000,3000,4000,5000,6000,7000,8000,9000,10000,20000]
  let freqLabels = ["20","30","40","50","60","","80","","100","200","300","400","500","600","","800","","1k","2k","3k","4k","5k","6k","","8k","","10k","20k"]
  let freqLinesX = []
  for (let freq of freqLines) {
    freqLinesX.push(Math.floor(Math.log10(freq/20)*1190/3))
  }
  ctx.canvas.width  = 1200;
  ctx.canvas.height = 400;
  let call = () => {
    ctx.fillStyle = "rgba(0, 0, 0, 1)";
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    window.audio.getFreqData();
    let freqData = window.audio._freqData
    ctx.fillStyle = "rgb(0, 50, 150)";
    for (let x = 0; x < 1190; x++) {
      let freq = Math.pow(10,3/1170*x)*20
      let bin = freq/window.audio._buffer.sampleRate*2*window.audio._audioAnalyzer.fftSize
      let y = freqData[Math.floor(bin)]/255
      ctx.fillRect(x, 400-y*360, 1, y*360);
    }
    ctx.fillStyle = "rgb(0, 100, 150)";
    ctx.font = '22px Assistant';
    for (let i = 0; i < freqLines.length; i ++) {
      let x = freqLinesX[i]
      ctx.fillRect(x, 0, 1, 400);
      if (i == freqLines.length-1) x-= 20
      ctx.fillText(freqLabels[i], x, 200);
    }
    ctx.fillRect(0, 200, 1200, 1);
    ctx.fillStyle = "rgba(0, 100, 150,0.7)";
    for (let x = 0; x < 1200; x++) {
      let gain = window.audio._magnitude[x].val
      ctx.fillRect(x, 200, 1, -gain*3);
    }
    if (canvas.closest("#windows")) requestAnimationFrame(call)
  }
  return call
}

