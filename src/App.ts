
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
    
    console.log(`smeditor is currently a work in progress. editing is almost start since the viewer is almost done!`)
    console.log(`audio filtering is working (hopefully) but not yet implemented into UI`)
    console.log(`use audio.filters = [new BiquadFilter(options)...] and then audio.processFilters()`)
    console.log(`syntax: new BiquadFilter(type, gain, freq, sampleRate, bandwidth)
    type: lowpass, highpass, bandpass, peaking, notch, lowshelf, highshelf
    gain: change in dB (used for peaking, lowshelf, highshelf)
    freq: where the filter frequency center is (or end if it is a lowpass/highpass)
    sampleRate: usually 44100
    bandwidth: width of the effect in octaves (used for lowpass, highpass, bandpass, peaking, notch)`)

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

    window.addEventListener("resize", this.onResize)
    this.onResize()
  }

  onResize = () => {
    let screenWidth = window.innerWidth 
    let screenHeight = window.innerHeight - document.getElementById("menubar")!.clientHeight
    this.pixi.screen.width = screenWidth;
    this.pixi.screen.height = screenHeight;
    this.view.width = screenWidth * this.pixi.renderer.resolution;
    this.view.height = screenHeight * this.pixi.renderer.resolution;
    this.view.style.width = `${screenWidth}px`;
    this.view.style.height = `${screenHeight}px`;
    this.pixi.render()
  }
}

declare global {
  interface Window { 
    app: App
    runSafari?: Function
  }
}

document.querySelector("body")!.innerHTML = 
`<div id="view-wrapper"> 
  <div id="menubar"></div>
    <canvas id="pixi"></canvas>
  </div>
<div id="windows"></div>
`

if (getBrowser().includes("Safari")) {
  document.querySelector("body")!.innerHTML = 
  `<div class='browser-unsupported'>
    <div class='browser-unsupported-item'>
    <h1>Safari is currently not supported!</h1>
    <div>Please use Chrome instead.</div>
    <div class='browser-unsupported-detail'>Check the console for more info.</div>
    </div>
  </div>`
  console.log(
    `SMEditor is not supported for Safari due to various issues involving rendering and sound.
    PIXI.js, the library used in SMEditor, takes an extremely long time to load and does not perform well on Safari.
    Additionally, many audio files cannot be played in Safari.
    If you still want to try loading SMEditor, run the command runSafari()`
    )
    window.runSafari = async () => {
      document.querySelector("body")!.innerHTML = 
      `<div id="view-wrapper"> 
        <div id="menubar"></div>
          <canvas id="pixi"></canvas>
        </div>
      <div id="windows"></div>
      `
      
      window.app = new App()
      window.runSafari = undefined
    }
} else {
  window.app = new App()
}









