import { createArrowTex } from "./note/NoteTexture.js";
import { createOptionsWindow } from "./gui/view/OptionsView.js";
import { FileSystem } from "./util/FileSystem.js";
import { getBrowser } from "./util/Util.js";
import { Options } from "./util/Options.js";
import { initKeybinds } from "./util/Keybinds.js";
import { createMenuBar } from "./gui/MenuBar.js";


if (getBrowser().includes("Safari")) {
  document.querySelector("body").innerHTML = "<div class='browser-unsupported'><div class='browser-unsupported-item'><h1>Safari is currently not supported!</h1><div>Please use another browser instead</div></div></div>"
}

export const app = new PIXI.Application(
  { 
    backgroundColor: 0x18191c, 
    antialias: true, 
    width: document.getElementById("pixi").clientWidth, 
    height: document.getElementById("pixi").clientHeight, 
    resolution: window.devicePixelRatio, 
    autoDensity: true,
    view: document.getElementById("pixi")
  });

window.app = app
window.options = new Options()

setTimeout(()=>{
  PIXI.BitmapFont.from('Assistant', {
    fontFamily: 'Assistant',
    fontSize: 20,
    fill: 'white'
  }, { 
    chars: [['a','z'],['A','Z'],"!@#$%^&*()~{}[]:.-?=,","0123456789/"," "], 
    resolution: window.devicePixelRatio
  });
})

createArrowTex()

window.files = new FileSystem()
window.selected_sm = ""

createOptionsWindow("select_sm_initial")
initKeybinds()

document.getElementById("menubar").appendChild(createMenuBar())

console.log(`smeditor is currently a work in progress. editing isn't ready yet, so i guess its smviewer?? please be patient !`)
console.log(`audio filtering is working (hopefully) but not yet implemented into UI`)
console.log(`use audio.filters = [new BiquadFilter(options)...] and then audio.processFilters()`)
console.log(`syntax: new BiquadFilter(type, gain, freq, sampleRate, bandwidth)
type: lowpass, highpass, bandpass, peaking, notch, lowshelf, highshelf
gain: change in dB (used for peaking, lowshelf, highshelf)
freq: where the filter frequency center is (or end if it is a lowpass/highpass)
sampleRate: usually 44100
bandwidth: width of the effect in octaves (used for lowpass, highpass, bandpass, peaking, notch)`)
console.log(`i could have been working on chart loading UI but instead i worked on this so:
loadChart(i): loads chart with index i. use sm.charts["dance-single"] to see charts`)

window.addEventListener("resize", function(){
  onResize()
})

function onResize() {
  let screenWidth = window.innerWidth 
  let screenHeight = window.innerHeight - document.getElementById("menubar").clientHeight
  app.screen.width = screenWidth;
  app.screen.height = screenHeight;
  app.view.width = screenWidth * app.renderer.resolution;
  app.view.height = screenHeight * app.renderer.resolution;
  app.view.style.width = `${screenWidth}px`;
  app.view.style.height = `${screenHeight}px`;
  app.render()
}
onResize()

window.addEventListener("keydown", function(e) {
  if (e.code == "Tab") {
    e.preventDefault()
  }
  if (e.code == "Enter") {
    if (e.target instanceof HTMLButtonElement) {e.preventDefault()}
  }
})

window.addEventListener("dragstart", function(e) {
  if (e.target instanceof HTMLImageElement) {
    e.preventDefault()
  }
})


