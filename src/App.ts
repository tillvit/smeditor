import { BitmapFont, Container, Renderer, TEXT_GRADIENT, Ticker } from "pixi.js"
import WebFont from "webfontloader"
import { ChartManager } from "./chart/ChartManager"
import { Keybinds } from "./listener/Keybinds"
import { ActionHistory } from "./util/ActionHistory"
import { BetterRoundedRect } from "./util/BetterRoundedRect"
import { FileSystem } from "./util/FileSystem"
import { Options } from "./util/Options"
import { TimerStats } from "./util/TimerStats"
import { fpsUpdate, getBrowser } from "./util/Util"
import { DirectoryWindow } from "./window/DirectoryWindow"
import { BasicOptionsWindow } from "./window/BasicOptionsWindow"
import { WindowManager } from "./window/WindowManager"
import { MenubarManager } from "./gui/element/MenubarManager"
import { EventHandler } from "./util/EventHandler"

declare global {
  interface Window {
    app: App
    runSafari?: () => void
  }
}

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
    Options.loadOptions()
    setInterval(() => Options.saveOptions(), 10000)
    this.registerFonts()

    this.view = document.getElementById("pixi") as HTMLCanvasElement

    this.stage = new Container()
    this.stage.sortableChildren = true
    this.renderer = new Renderer({
      backgroundColor: 0x18191c,
      antialias: false,
      width: this.view.clientWidth,
      height: this.view.clientHeight,
      resolution: Options.performance.resolution,
      autoDensity: true,
      view: this.view,
    })

    this.ticker = new Ticker()
    this.ticker.add(() => {
      TimerStats.time("Render Time")
      this.renderer.render(this.stage)
      TimerStats.endTime("Render Time")
      TimerStats.endFrame()
      fpsUpdate()
    })
    this.ticker.start()
    this.stage.sortableChildren = true

    BetterRoundedRect.init(this.renderer)

    this.options = Options
    this.files = new FileSystem()
    this.chartManager = new ChartManager(this)
    this.menubarManager = new MenubarManager(
      this,
      document.getElementsByClassName("menubar")[0] as HTMLDivElement
    )
    this.windowManager = new WindowManager(
      this,
      document.getElementById("windows") as HTMLDivElement
    )
    this.actionHistory = new ActionHistory(this)

    this.registerListeners()
    this.keybinds = new Keybinds(this)

    this.onResize()

    console.log(
      `smeditor is currently a work in progress. check the github repo for more info!`
    )

    this.windowManager.openWindow(
      new BasicOptionsWindow(this, "select_sm_initial")
    )

    // window.onbeforeunload = event => {
    //   event.preventDefault()
    //   return (event.returnValue = "Are you sure you want to exit?")
    // }

    window.onunload = () => {
      Options.saveOptions()
    }
  }

  registerFonts() {
    BitmapFont.from(
      "Assistant",
      {
        fontFamily: "Assistant",
        fontSize: 20,
        fill: "white",
      },
      {
        chars: [
          ["a", "z"],
          ["A", "Z"],
          "!@#$%^&*()~{}[]:.-?=,",
          "0123456789/",
          " ",
        ],
        resolution: window.devicePixelRatio,
      }
    )

    BitmapFont.from(
      "Assistant-Fancy",
      {
        fontFamily: "Assistant",
        fontSize: 40,
        fontWeight: "700",
        fill: ["#dddddd", "#ffffff"],
        fillGradientType: TEXT_GRADIENT.LINEAR_VERTICAL,
        stroke: 0xaaaaaa,
        strokeThickness: 3,
      },
      {
        chars: [
          ["a", "z"],
          ["A", "Z"],
          "!@#$%^&*()~{}[]:.-?=,",
          "0123456789/",
          " ",
        ],
        resolution: window.devicePixelRatio,
      }
    )
  }

  registerListeners() {
    window.addEventListener("keydown", function (e) {
      if (e.code == "Tab") {
        e.preventDefault()
      }
      if (e.code == "Enter") {
        if (e.target instanceof HTMLButtonElement) {
          e.preventDefault()
        }
      }
    })

    window.addEventListener("dragstart", function (e) {
      if (e.target instanceof HTMLImageElement) {
        e.preventDefault()
      }
    })

    setInterval(() => {
      if (
        this.lastHeight != window.innerHeight ||
        this.lastWidth != window.innerWidth
      ) {
        this.lastHeight = window.innerHeight
        this.lastWidth = window.innerWidth
        this.onResize()
        EventHandler.emit("resize")
      }
    }, 100)

    window.addEventListener("dragover", event => {
      event.preventDefault()
      event.dataTransfer!.dropEffect = "copy"
    })

    window.addEventListener("drop", event => {
      event.stopPropagation()
      event.preventDefault()
      const handler = async () => {
        let prefix = ""
        const items = event.dataTransfer!.items
        for (let i = 0; i < items.length; i++) {
          const item = items[i].webkitGetAsEntry()
          if (item?.isFile) {
            if (item.name.endsWith(".sm") || item.name.endsWith(".ssc")) {
              prefix = "New Song"
              break
            }
          }
        }

        const queue = []
        for (let i = 0; i < items.length; i++) {
          const item = items[i].webkitGetAsEntry()
          queue.push(this.traverseFileTree(prefix, item!))
        }
        await Promise.all(queue)
        this.windowManager.openWindow(
          new DirectoryWindow(this, {
            title: "Select an sm/ssc file...",
            accepted_file_types: ["sm", "ssc"],
            disableClose: !this.chartManager.sm,
            callback: (path: string) => {
              this.chartManager.loadSM(path)
              this.windowManager
                .getWindowById("select_sm_initial")
                ?.closeWindow()
            },
          })
        )
      }
      handler()
    })
  }

  private traverseFileTree(
    prefix: string,
    item: FileSystemEntry,
    path?: string
  ): Promise<void> {
    return new Promise(resolve => {
      path = path || ""
      if (item.isFile) {
        ;(<FileSystemFileEntry>item).file(file => {
          this.files.addFile(prefix + "/" + path + file.name, file)
          resolve()
        })
      } else if (item.isDirectory) {
        const dirReader = (<FileSystemDirectoryEntry>item).createReader()
        dirReader.readEntries(entries => {
          const handler = async () => {
            for (let i = 0; i < entries.length; i++) {
              await this.traverseFileTree(
                prefix,
                entries[i],
                path + item.name + "/"
              )
            }
            resolve()
          }
          handler()
        })
      }
    })
  }

  onResize() {
    const screenWidth = window.innerWidth
    const screenHeight =
      window.innerHeight -
      document.getElementsByClassName("menubar")[0]!.clientHeight
    this.renderer.screen.width = screenWidth
    this.renderer.screen.height = screenHeight
    this.view.width = screenWidth * this.renderer.resolution
    this.view.height = screenHeight * this.renderer.resolution
    this.view.style.width = `${screenWidth}px`
    this.view.style.height = `${screenHeight}px`
  }
}

document.querySelector("body")!.innerHTML = `<div id="view-wrapper"> 
  <div class="menubar"></div>
    <canvas id="pixi"></canvas>
  </div>
  <div id="blocker" style="display: none"></div>
<div id="windows"></div>
`

// Check WebGL

WebFont.load({
  google: {
    families: ["Assistant:200,300,400,500,600,700,800"],
  },
  active: init,
  inactive: init,
  classes: false,
})

function init() {
  const canvas = document.createElement("canvas")
  const gl = (canvas.getContext("webgl") ||
    canvas.getContext("experimental-webgl")) as WebGLRenderingContext

  if (!gl) {
    document.querySelector(
      "body"
    )!.innerHTML = `<div class='browser-unsupported'>
      <div class='browser-unsupported-item'>
      <h1>WebGL is not enabled</h1>
      <div>Please visit your browser settings and enable WebGL.</div>
      </div>
    </div>`
  } else if (getBrowser().includes("Safari")) {
    document.querySelector(
      "body"
    )!.innerHTML = `<div class='browser-unsupported'>
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
    window.runSafari = () => {
      document.querySelector("body")!.innerHTML = `<div id="view-wrapper"> 
          <div class="menubar"></div>
            <canvas id="pixi"></canvas>
          </div>
        <div id="blocker" style="display: none"></div>
        <div id="windows"></div>
        `
      window.app = new App()
      window.runSafari = undefined
    }
  } else {
    window.app = new App()
  }
}
