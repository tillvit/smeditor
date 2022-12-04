import { app } from "../../App.js";
import { AudioWrapper } from "../../util/AudioWrapper.js";
import { isOsx } from "../../util/Keybinds.js";
import { parseSM } from "../../util/Simfile.js";
import { getFPS, roundDigit } from "../../util/Util.js";
import { ChartRenderer } from "./ChartRenderer.js";

const snaps = [1,2,3,4,6,8,12,16,24,48, -1]

var options;
var audio; 
var chartView;
var update = false
var snapIndex = 0
var audio_url;
var partialScroll = 0

var tick = new Howl({
  src: 'assets/sound/assist_tick.ogg',
  volume: 0.5
});

var me_high = new Howl({
  src: 'assets/sound/metronome_high.ogg',
  volume: 0.5
});

var me_low = new Howl({
  src: 'assets/sound/metronome_low.ogg',
  volume: 0.5
});

var sn = new Howl({
  src: 'assets/sound/snap.wav',
  volume: 0
});

var info;
var noteIndex = 0
var lastBeat = -1

export async function loadAudio() {
  let a_file = window.files.getFileRelativeTo(window.selected_sm,window.sm["MUSIC"])
  if (window.sm["MUSIC"] == "") {
    console.log("No Audio File!")
    audio = new AudioWrapper(undefined, (audio)=>{
      audio.seek(window.chart.getSeconds(0))
      setEffectVolume(options.audio.soundEffectVolume)
      setVolume(options.audio.songVolume)
      setRate(options.audio.rate)
    })
    window.audio = audio
    return
  }
  if (a_file == undefined) {
    console.log("Failed to load audio file " + window.sm["MUSIC"])
    audio = new AudioWrapper(undefined, (audio)=>{
      audio.seek(window.chart.getSeconds(0))
      setEffectVolume(options.audio.soundEffectVolume)
      setVolume(options.audio.songVolume)
      setRate(options.audio.rate)
    })
    window.audio = audio
    return
  }
  audio_url = await URL.createObjectURL(a_file)
  audio = new AudioWrapper(audio_url, (audio)=>{
    audio.seek(window.chart.getSeconds(0))
    chartView.setTime(window.chart.getSeconds(0)) 
    chartView.loadAudio(audio)
    setEffectVolume(options.audio.soundEffectVolume)
    setVolume(options.audio.songVolume)
    setRate(options.audio.rate)
  })
  window.audio = audio
  seekBack()
}

export async function loadSM() {
  options = window.options
  let sm = await parseSM(window.selected_sm)
  window.sm = sm
  
  loadChart()
  loadAudio()
  

  if (update == false) {
    app.view.addEventListener("wheel", function (e) {
      if (window.sm == undefined || window.chart == undefined || audio == undefined) return
      if ((isOsx && e.metaKey) || (!isOsx && e.ctrlKey)) {
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

      if (audio._isPlaying) chartView.setTime(time) 
      let nd = window.chart.notedata
      while(noteIndex < nd.length && time > nd[noteIndex].second+options.audio.effectOffset) {
        if (audio._isPlaying && (nd[noteIndex].type != "Fake" && nd[noteIndex].type != "Mine") && !nd[noteIndex].fake) {
          chartView.addFlash(nd[noteIndex].col)
          if (options.audio.assistTick) tick.play()
        }
        noteIndex++
      }
      if (Math.floor(chart.getBeat(chartView.time+options.audio.effectOffset)) != lastBeat) {
        lastBeat = Math.floor(chart.getBeat(chartView.time+options.audio.effectOffset))
        if (audio._isPlaying && options.audio.metronome) {
          if (lastBeat % 4 == 0) me_high.play()
          else me_low.play()
        }
      }
    })
    update = true
  }
}

export function setRate(rate) {
  options.audio.rate = rate
  audio?.rate(options.audio.rate)
}

export function setVolume(vol) {
  options.audio.songVolume = vol
  audio?.volume(options.audio.songVolume)
}

export function setEffectVolume(vol) {
  options.audio.soundEffectVolume = vol
  tick?.volume(options.audio.soundEffectVolume)
  me_high?.volume(options.audio.soundEffectVolume)
  me_low?.volume(options.audio.soundEffectVolume)
}

export function loadChart(chartIndex) {
  let charts = window.sm.charts[options.chart.stepsType]
  if (charts == undefined) return
  if (chartIndex == undefined) {
    chartIndex = charts.length - 1
    if (chartIndex < 0) return
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
    if (audio._isPlaying && (nd[noteIndex].type != "Fake" && nd[noteIndex].type != "Mine") && !nd[noteIndex].fake) {
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

export function playPause() {
  if (audio._isPlaying) audio.pause()
  else audio.play()
}

export function setAndSnapBeat(beat) {
  let snap = Math.max(0.001,options.chart.snap)
  let newbeat = Math.round((beat)/snap)*snap
  newbeat = Math.max(0,newbeat)
  audio.seek(window.chart.getSeconds(newbeat))
  chartView.setBeat(newbeat)
  seekBack()
}

export function previousSnap(){
  snapIndex = ((snapIndex-1) + snaps.length) % snaps.length
  options.chart.snap = snaps[snapIndex]==-1?0:1/snaps[snapIndex]
  sn.play()
}

export function nextSnap(){
  snapIndex = ((snapIndex+1) + snaps.length) % snaps.length
  options.chart.snap = snaps[snapIndex]==-1?0:1/snaps[snapIndex]
  sn.play()
}
