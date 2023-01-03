
import { BitmapFont, Container, Renderer, Ticker } from 'pixi.js';
import WebFont from 'webfontloader'
import { BiquadFilter } from './chart/audio/BiquadFilter'
import { ChartManager } from './chart/ChartManager'
import { MenubarManager } from './gui/MenubarManager'
import { Keybinds } from './listener/Keybinds'
import { ActionHistory } from './util/ActionHistory'
import { BetterRoundedRect } from './util/BetterRoundedRect'
import { FileSystem } from './util/FileSystem';
import { Options } from './util/Options';
import { TimerStats } from './util/TimerStats'
import { getBrowser } from './util/Util';
import { DirectoryWindow } from './window/DirectoryWindow'
import { OptionsWindow } from './window/OptionsWindow'
import { WindowManager } from './window/WindowManager'

export class App {

  renderer: Renderer
  ticker: Ticker
  stage: Container
  view: HTMLCanvasElement
  options: Options
  files: FileSystem
  keybinds: Keybinds
  chartManager: ChartManager
  windowManager: WindowManager
  menubarManager: MenubarManager
  actionHistory: ActionHistory

  private lastWidth = window.innerWidth
  private lastHeight = window.innerHeight

  constructor() {
    this.registerFonts()
    
    this.view = document.getElementById("pixi") as HTMLCanvasElement
    
    this.stage = new Container()
    this.renderer = new Renderer({ 
      backgroundColor: 0x18191c, 
      antialias: false, 
      width: this.view.clientWidth, 
      height: this.view.clientHeight, 
      resolution: window.devicePixelRatio, 
      autoDensity: true,
      view: this.view,
    })
    this.ticker = new Ticker()
    this.ticker.add(()=>{
      TimerStats.time("Render Time")
      this.renderer.render(this.stage)
      TimerStats.endTime("Render Time")
      TimerStats.endFrame()
    })
    this.ticker.start()
    this.stage.sortableChildren = true

    BetterRoundedRect.init(this.renderer)
    
    this.options = Options
    this.files = new FileSystem()
    this.chartManager = new ChartManager(this)
    this.menubarManager = new MenubarManager(this, document.getElementsByClassName("menubar")[0] as HTMLDivElement)
    this.windowManager = new WindowManager(this, document.getElementById("windows") as HTMLDivElement)
    this.actionHistory = new ActionHistory(this)

    this.registerListeners()
    this.keybinds = new Keybinds(this)

    this.onResize()

    
    console.log(`smeditor is currently a work in progress. editing is almost start since the viewer is almost done!`)
    console.log(`audio filtering is working (hopefully) but not yet implemented into UI`)
    // console.log(`use audio.filters = [new BiquadFilter(options)...] and then audio.processFilters()`)
    // console.log(`syntax: new BiquadFilter(type, gain, freq, sampleRate, bandwidth)
    // type: lowpass, highpass, bandpass, peaking, notch, lowshelf, highshelf
    // gain: change in dB (used for peaking, lowshelf, highshelf)
    // freq: where the filter frequency center is (or end if it is a lowpass/highpass)
    // sampleRate: usually 44100
    // bandwidth: width of the effect in octaves (used for lowpass, highpass, bandpass, peaking, notch)`)

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

    setInterval(()=>{
      if (this.lastHeight != window.innerHeight || this.lastWidth != window.innerWidth) {
        this.lastHeight = window.innerHeight
        this.lastWidth = window.innerWidth
        this.onResize()
        window.postMessage("resize")
      }
    },100)

    window.addEventListener('dragover', (event) => {
      event.preventDefault()
      event.dataTransfer!.dropEffect = 'copy';
    });

    window.addEventListener('drop', async (event) => {
      event.stopPropagation();
      event.preventDefault();
      let prefix = ""
      let items = event.dataTransfer!.items;
      for (var i=0; i<items.length; i++) {
        let item = items[i].webkitGetAsEntry()
        if (item && item.isFile) {
          if (item.name.endsWith(".sm") || item.name.endsWith(".ssc")) {
            prefix = "New Song"
            break
          }
        }
      }
  
      let queue = [];
      for (var i=0; i < items.length; i++) {
        let item = items[i].webkitGetAsEntry()
        queue.push(this.traverseFileTree(prefix, item!))
      }
      await Promise.all(queue);
      this.windowManager.openWindow(new DirectoryWindow(this, {
        title: "Select an sm/ssc file...",
        accepted_file_types: ["sm","ssc"],
        disableClose: !this.chartManager.sm,
        callback: (path: string) => {
          this.chartManager.loadSM(path)
          this.windowManager.getWindowById("select_sm_initial")?.closeWindow()
        }
      }))
    });
  }

  private traverseFileTree(prefix: string, item: FileSystemEntry, path?: string): Promise<void> {
    return new Promise((resolve) => {
      path = path || "";
      if (item.isFile) {
        (<FileSystemFileEntry>item).file((file) => {
          this.files.addFile(prefix + "/" + path + file.name, file)
          resolve()
        })
      } else if (item.isDirectory) {
        var dirReader = (<FileSystemDirectoryEntry>item).createReader();
        dirReader.readEntries(async (entries) => {
          for (var i=0; i<entries.length; i++) {
            await this.traverseFileTree(prefix, entries[i], path + item.name + "/");
          }
          resolve()
        });
      }
    })
  }

  onResize(){
    let screenWidth = window.innerWidth 
    let screenHeight = window.innerHeight - document.getElementsByClassName("menubar")[0]!.clientHeight
    this.renderer.screen.width = screenWidth;
    this.renderer.screen.height = screenHeight;
    this.view.width = screenWidth * this.renderer.resolution;
    this.view.height = screenHeight * this.renderer.resolution;
    this.view.style.width = `${screenWidth}px`;
    this.view.style.height = `${screenHeight}px`;
  }
}

declare global {
  interface Window { 
    app: App
    runSafari?: Function
    BiquadFilter: BiquadFilter
  }
}


document.querySelector("body")!.innerHTML = 
`<div id="view-wrapper"> 
  <div class="menubar"></div>
    <canvas id="pixi"></canvas>
  </div>
<div id="windows"></div>
`

// Check WebGL

WebFont.load({
  google: {
    families: ['Assistant:200,300,400,500,600,700,800']
  },
  active: init,
  inactive: init,
  classes: false
});

function init() {
  let canvas = document.createElement("canvas")
  let gl = (canvas.getContext('webgl') || canvas.getContext('experimental-webgl')) as WebGLRenderingContext;

  if (!gl) {
    document.querySelector("body")!.innerHTML = 
    `<div class='browser-unsupported'>
      <div class='browser-unsupported-item'>
      <h1>WebGL is not enabled</h1>
      <div>Please visit your browser settings and enable WebGL.</div>
      </div>
    </div>`
  }else if (getBrowser().includes("Safari")) {
    document.querySelector("body")!.innerHTML = 
    `<div class='browser-unsupported'>
      <div class='browser-unsupported-item'>
      <h1>Safari is currently not supported</h1>
      <div>Please use Chrome/Firefox instead.</div>
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
          <div class="menubar"></div>
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
}







