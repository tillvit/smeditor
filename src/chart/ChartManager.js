import { reloadData } from "../gui/view/OptionsView.js";
import { app } from "../index.js";
import { OffsetHowler } from "../util/OffsetHowler.js";
import { parseSM } from "../util/parseSM.js";
import { getBeat, getFont, getFPS, getSeconds, roundDigit } from "../util/util.js";
import { buildChart } from "./ChartRenderer.js";

var sm;
var audio;
let chart = window.chart
var playing = false
var update = false
var snaps = [1,2,3,4,6,8,12,16,24,48, -1]
var snapIndex = 0
var audio_url;

var tick = new Howl({
  src: 'assets/sound/assist_tick.wav',
  volume: 0.5
});

var sn = new Howl({
  src: 'assets/sound/snap.wav',
  volume: 0
});

const font = new PIXI.TextStyle({
  fontFamily: getFont(),
  fill: ['#ffffff'],
  fontSize: 20,
});



var info;

// window.addEventListener("load",()=>{
//   info = new PIXI.BitmapText("debug",{
//     fontName: "Assistant",
//     fontSize: 20,
//     fill: ['#ffffff']
//     // align: "right"
//   })
//   app.stage.addChild(info)
//   console.log("hey")
  
// })

let noteIndex = 0

export async function loadAudio() {
  let a_file = window.files.getFileRelativeTo(window.selected_sm,window.sm["MUSIC"])
  if (window.sm["MUSIC"] == "") {
    console.log("No Audio File!")
    return
  }
  if (a_file == undefined) {
    console.log("Failed to load audio file " + window.sm["MUSIC"])
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
    audio.seek(getSeconds(0, window.sm))
    chart.setTime(getSeconds(0, window.sm)) 
  })
  chart.loadAudio(audio_url)
  window.audio = audio
}

export async function loadSM() {
  
  playing = false
  let sm = await parseSM(window.selected_sm)
  window.sm = sm
  app.stage.removeChildren()
  info = new PIXI.BitmapText("debug",{
    fontName: "Assistant",
    fontSize: 20,
    fill: ['#ffffff']
  })
  loadChart(0)
  loadAudio()
  app.stage.addChild(info)
}

export function loadChart(chartIndex) {
  chart = buildChart(window.sm, chartIndex)
  if (chart == null)
    return
  
  if (update == false) {
    info.x = 0
    info.y = 0
    app.ticker.add((delta) => {
      let time = audio.seek()
  
      info.text = "Time: " + roundDigit(chart.time,3) + "\n" + "Beat: " + roundDigit(chart.beat,3) + "\nFPS: " + getFPS()

      if (playing)
        chart.setTime(time) 
      let nd = chart.getNoteData()
      while(noteIndex < nd.length && time > nd[noteIndex][3]-0.020) {
        if (playing && (nd[noteIndex][2] != "Fake" && nd[noteIndex][2] != "Mine") && !nd[noteIndex].warped) {
          chart.addFlash(nd[noteIndex][1])
          if (chart.assistTick)
            tick.play()
        }
        noteIndex++
      }
      chart.render();
    });
    update = true
  }
  chart.view.x = app.screen.width/2
  chart.view.y = app.screen.height/2
  window.chart = chart
}

function seekBack() {
  let time = audio.seek()
  let nd = chart.getNoteData()
  while(noteIndex > 0 && time < nd[noteIndex-1][3]) {
    noteIndex--
    if (playing && (nd[noteIndex][2] != "Fake" || nd[noteIndex][2] != "Mine")) {
      chart.addFlash(nd[noteIndex][1])
      // tick.play()
    }
    
  }
}

window.addEventListener("resize", function(){
  onResize()
})

function onResize() {
  if (chart) {
    chart.view.x = app.screen.width/2
    chart.view.y = app.screen.height/2
    }
}

var cmdPressed = 0
document.addEventListener("keydown", function(e) {
  let sm = window.sm
  if (sm == undefined)
    return
  if (e.code == "Space") {
    if (playing) {
      audio.pause()
    }else{
      audio.play()
    }
    playing = !playing
  }
  let snap = chart.snap==0?0.001:chart.snap
  if (e.code == "ArrowUp") {
    // let beat = getBeat(audio.seek(), sm["BPMS"], sm["OFFSET"])
    let beat = chart.beat
    let newbeat = Math.round((beat-snap)/snap)*snap
    newbeat = Math.max(0,newbeat)
    audio.seek(getSeconds(newbeat, sm))
    chart.setBeat(newbeat)
    seekBack()
  }
  if (e.code == "ArrowDown") {
    // let beat = getBeat(audio.seek(), sm["BPMS"], sm["OFFSET"])
    let beat = chart.beat
    let newbeat = Math.round((beat+snap)/snap)*snap
    newbeat = Math.max(0,newbeat)
    
    audio.seek(getSeconds(newbeat, sm))
    chart.setBeat(newbeat)
    seekBack()
  }
  if (cmdPressed > 0) {
    if (e.code == "ArrowLeft") {
      chart.setZoom(Math.max(10,chart.speed*Math.pow(1.01,-30)))
    }
    if (e.code == "ArrowRight") {
      chart.setZoom(Math.max(10,chart.speed*Math.pow(1.01,30)))
    }
  }else{
    if (e.code == "ArrowLeft") {
      snapIndex = ((snapIndex-1) + snaps.length) % snaps.length
      chart.snap = snaps[snapIndex]==-1?0:1/snaps[snapIndex]
      sn.play()
    }
    if (e.code == "ArrowRight") {
      snapIndex = (snapIndex+1) % snaps.length
      chart.snap = snaps[snapIndex]==-1?0:1/snaps[snapIndex]
      sn.play()
    }
  }
  if (e.code == "MetaLeft" || e.code == "MetaRight") {
    cmdPressed++;
  }
  if (e.code == "Digit7") {
    chart.assistTick = !chart.assistTick
  }
  if (e.code == "KeyC") {
    chart.CMod = !chart.CMod
  }
  return false
})

document.addEventListener("keyup", function(e) {
  if (e.code == "MetaLeft" || e.code == "MetaRight") {
    cmdPressed--;
  }
})

let partialScroll = 0
var timer = null;
window.addEventListener('wheel', function() {
    if(timer !== null) {
        clearTimeout(timer);        
    }
}, false);
document.addEventListener("wheel", function (e) {
  if (window.sm == undefined)
    return
  if (cmdPressed > 0) {
    let newSpeed = Math.max(10,chart.speed*Math.pow(1.01,e.deltaY/5))
    chart.setZoom(newSpeed)
  }else{
    // let beat = getBeat(audio.seek(), sm["BPMS"], sm["OFFSET"])
    let beat = chart.beat
    let newbeat = beat
    let snap = chart.snap
    if (snap == 0) {
      partialScroll = 0
      newbeat = beat + e.deltaY/chart.speed
    }else{
      partialScroll +=  e.deltaY/chart.speed
      if (Math.abs(partialScroll) > snap) {
        if (partialScroll < 0) {
          newbeat = Math.round((beat+Math.ceil(partialScroll/snap)*snap)/snap)*snap
        }else{
          newbeat = Math.round((beat+Math.floor(partialScroll/snap)*snap)/snap)*snap
        }
        partialScroll %= snap
      }
    }
    // let newbeat = (snap == 0) ? beat + e.deltaY * 1/chart.speed: Math.round((beat+snap*e.deltaY * 10/chart.speed)/snap)*snap
    newbeat = Math.max(0,newbeat)
    if (newbeat != beat) {
      chart.setBeat(newbeat)
      audio.seek(getSeconds(newbeat, chart.sm))
    }
    seekBack()
  }
}, true);