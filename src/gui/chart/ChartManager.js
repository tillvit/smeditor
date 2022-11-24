import { app } from "../../App.js";
import { OffsetHowler } from "../../util/OffsetHowler.js";
import { parseSM } from "../../util/Simfile.js";
import { getFPS, roundDigit } from "../../util/Util.js";
import { ChartRenderer } from "./ChartRenderer.js";

const snaps = [1,2,3,4,6,8,12,16,24,48, -1]

var options;
var audio;
var chartView;
var playing = false
var update = false
var snapIndex = 0
var audio_url;
var partialScroll = 0

var tick = new Howl({
  src: 'assets/sound/assist_tick.wav',
  volume: 0.5
});

var sn = new Howl({
  src: 'assets/sound/snap.wav',
  volume: 0
});

var info;
var noteIndex = 0

export async function loadAudio() {
  let a_file = window.files.getFileRelativeTo(window.selected_sm,window.sm["MUSIC"])
  if (window.sm["MUSIC"] == "") {
    console.log("No Audio File!")
    audio = undefined
    return
  }
  if (a_file == undefined) {
    console.log("Failed to load audio file " + window.sm["MUSIC"])
    audio = undefined
    return
  }
  audio_url = await URL.createObjectURL(a_file)
  audio = new OffsetHowler({
    src: [audio_url],
    volume: 0.2,
    html5: true,
    preload: true,
    format: [a_file.name.split(".").pop()]
  });
  audio.once("load", function(){
    audio.seek(window.chart.getSeconds(0))
    chartView.setTime(window.chart.getSeconds(0)) 
  })
  chartView.loadAudio(audio_url)
  seekBack()
}

export async function loadSM() {
  options = window.options
  playing = false
  let sm = await parseSM(window.selected_sm)
  window.sm = sm
  
  loadAudio()
  loadChart()

  if (update == false) {
    info = new PIXI.BitmapText("debug",{
      fontName: "Assistant",
      fontSize: 20,
      fill: ['#ffffff']
    })
    info.x = 0
    info.y = 0
    app.stage.addChild(info)
    app.ticker.add(() => {
      chartView?.render();
    });
    setInterval(()=>{
      if (chartView == undefined || window.chart == undefined)
        return

      let time = audio?.seek() ?? 0
  
      info.text = "Time: " + roundDigit(chartView.time,3) + "\n" + "Beat: " + roundDigit(chartView.beat,3) + "\nFPS: " + getFPS() 

      if (playing) chartView.setTime(time) 
      let nd = window.chart.notedata
      while(noteIndex < nd.length && time > nd[noteIndex].second-0.036+options.audio.assistTickOffset) {
        if (playing && (nd[noteIndex].type != "Fake" && nd[noteIndex].type != "Mine") && !nd[noteIndex].fake) {
          chartView.addFlash(nd[noteIndex].col)
          if (options.audio.assistTick) tick.play()
        }
        noteIndex++
      }

      tick.volume(options.audio.soundEffectVolume)
      audio?.volume(options.audio.songVolume)
      audio?.rate(options.audio.rate)
    })
    update = true
  }
}

export function loadChart(chartIndex) {
  let charts = window.sm.charts[options.chart.stepsType]
  if (charts == undefined) return
  if (chartIndex == undefined) {
    for (let i = 4; i >= 0; i--) {
      if (charts[i] != undefined) {
        chartIndex = i
        break
      }
    }
    for (let i = 5; i < charts.length; i++) {
      if (charts[i] != undefined) {
        chartIndex = i
        break
      }
    }
    if (chartIndex == undefined) return;
  }
  window.chart = charts[chartIndex]
  if (charts[chartIndex] == null) {
    console.log("Couldn't find the chart with index " + chartIndex)
    return
  }

  if (chartView) {
    app.stage.removeChild(chartView.view)
  }
    
  chartView = new ChartRenderer(window.chart)
 
  chartView.view.x = app.screen.width/2
  chartView.view.y = app.screen.height/2
  window.chartView = chartView
  seekBack()
}

window.loadChart = loadChart

function seekBack() {
  let time = audio?.seek() ?? 0
  let nd = window.chart.notedata
  if (noteIndex > nd.length) noteIndex = nd.length - 1
  while(noteIndex > 0 && time < nd[noteIndex-1].second) {
    noteIndex--
    if (playing && (nd[noteIndex].type != "Fake" && nd[noteIndex].type != "Mine") && !nd[noteIndex].fake) {
      chartView.addFlash(nd[noteIndex].col)
    }
  }
}

window.addEventListener("resize", function(){
  onResize()
})

function onResize() {
  if (chartView) {
    chartView.view.x = app.screen.width/2
    chartView.view.y = app.screen.height/2
  }
}

var cmdPressed = 0
document.addEventListener("keydown", function(e) {
  let sm = window.sm
  if (sm == undefined || window.chart == undefined || audio == undefined) return
  if (e.code == "Space") {
    if (playing) audio.pause()
    else audio.play()
    playing = !playing
  }
  let snap = window.options.chart.snap==0?0.001:window.options.chart.snap
  if (e.code == "ArrowUp") {
    let beat = chartView.beat
    let newbeat = Math.round((beat-snap)/snap)*snap
    newbeat = Math.max(0,newbeat)
    audio.seek(window.chart.getSeconds(newbeat))
    chartView.setBeat(newbeat)
    seekBack()
  }
  if (e.code == "ArrowDown") {
    let beat = chartView.beat
    let newbeat = Math.round((beat+snap)/snap)*snap
    newbeat = Math.max(0,newbeat)
    audio.seek(window.chart.getSeconds(newbeat))
    chartView.setBeat(newbeat)
    seekBack()
  }
  if (cmdPressed > 0) {
    if (e.code == "ArrowLeft") chartView.setZoom(Math.max(10,options.chart.speed*Math.pow(1.01,-30)))
    if (e.code == "ArrowRight") chartView.setZoom(Math.max(10,options.chart.speed*Math.pow(1.01,30)))
  }else{
    if (e.code == "ArrowLeft") {
      snapIndex = ((snapIndex-1) + snaps.length) % snaps.length
      options.chart.snap = snaps[snapIndex]==-1?0:1/snaps[snapIndex]
      sn.play()
    }
    if (e.code == "ArrowRight") {
      snapIndex = (snapIndex+1) % snaps.length
      options.chart.snap = snaps[snapIndex]==-1?0:1/snaps[snapIndex]
      sn.play()
    }
  }
  if (e.code == "MetaLeft" || e.code == "MetaRight" || e.code == "ControlLeft" || e.code == "ControlRight") cmdPressed++
  if (e.code == "Digit7") options.audio.assistTick = !options.audio.assistTick
  if (e.code == "KeyC") options.chart.CMod = !options.chart.CMod
})

document.addEventListener("keyup", function(e) {
  if (e.code == "MetaLeft" || e.code == "MetaRight" || e.code == "ControlLeft" || e.code == "ControlRight") cmdPressed = Math.max(cmdPressed-1,0)
})
document.addEventListener("wheel", function (e) {
  if (window.sm == undefined || window.chart == undefined|| audio == undefined) return
  if (cmdPressed > 0) {
    let newSpeed = Math.max(10,options.chart.speed*Math.pow(1.01,e.deltaY/5))
    chartView.setZoom(newSpeed)
  }else{
    let beat = chartView.beat
    let newbeat = beat
    let snap = options.chart.snap
    let speed = options.chart.speed
    if (snap == 0) {
      partialScroll = 0
      newbeat = beat + e.deltaY/speed
    }else{
      partialScroll += e.deltaY/speed
      if (Math.abs(partialScroll) > snap) {
        if (partialScroll < 0) {
          newbeat = Math.round((beat+Math.ceil(partialScroll/snap)*snap)/snap)*snap
        }else{
          newbeat = Math.round((beat+Math.floor(partialScroll/snap)*snap)/snap)*snap
        }
        partialScroll %= snap
      }
    }
    newbeat = Math.max(0,newbeat)
    if (newbeat != beat) {
      chartView.setBeat(newbeat)
      audio.seek(window.chart.getSeconds(newbeat))
    }
    seekBack()
  }
}, true);