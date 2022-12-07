
import { Application, BitmapFont } from 'pixi.js';
import { ChartManager } from './chart/ChartManager'
import { MenubarManager } from './gui/MenubarManager'
import { Keybinds } from './listener/Keybinds'
import { FileSystem } from './util/FileSystem';
import { Options } from './util/Options';
import { getBrowser } from './util/Util';
import { OptionsWindow } from './window/OptionsWindow'
import { WindowManager } from './window/WindowManager'

export class App {

  pixi: Application
  view: HTMLCanvasElement
  options: Options
  files: FileSystem
  keybinds: Keybinds
  chartManager: ChartManager
  windowManager: WindowManager
  menubarManager: MenubarManager

  constructor() {
    this.registerFonts()
    
    this.view = document.getElementById("pixi") as HTMLCanvasElement
    this.pixi = new Application({ 
      backgroundColor: 0x18191c, 
      antialias: true, 
      width: this.view.clientWidth, 
      height: this.view.clientHeight, 
      resolution: window.devicePixelRatio, 
      autoDensity: true,
      view: this.view
    });

    this.options = new Options()
    this.files = new FileSystem()
    this.keybinds = new Keybinds(this)
    this.chartManager = new ChartManager(this)
    this.menubarManager = new MenubarManager(this, document.getElementById("menubar") as HTMLDivElement)
    this.windowManager = new WindowManager(this, document.getElementById("windows") as HTMLDivElement)

    this.registerListeners()
    
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

    this.windowManager.openWindow(new OptionsWindow(this, "select_sm_initial"))
  }

  registerFonts() {
    BitmapFont.from('Assistant', {
      fontFamily: 'Assistant',
      fontSize: 20,
      fill: 'white'
    }, { 
      chars: [['a','z'],['A','Z'],"!@#$%^&*()~{}[]:.-?=,","0123456789/"," "], 
      resolution: window.devicePixelRatio
    });
  }

  registerListeners(){
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

    window.addEventListener("resize", ()=>{
      let screenWidth = window.innerWidth 
      let screenHeight = window.innerHeight - document.getElementById("menubar")!.clientHeight
      console.log(screenWidth, screenHeight)
      this.pixi.screen.width = screenWidth;
      this.pixi.screen.height = screenHeight;
      this.view.width = screenWidth * this.pixi.renderer.resolution;
      this.view.height = screenHeight * this.pixi.renderer.resolution;
      this.view.style.width = `${screenWidth}px`;
      this.view.style.height = `${screenHeight}px`;
      this.pixi.render()
    })
  }
}

declare global {
  interface Window { app: App }
}

if (getBrowser().includes("Safari")) {
  document.querySelector("body")!.innerHTML = 
  `<div class='browser-unsupported'>
    <div class='browser-unsupported-item'>
    <h1>Safari is currently not supported!</h1>
    <div>Please use another browser instead</div>
    </div>
  </div>`
} else {
  window.app = new App()
}









