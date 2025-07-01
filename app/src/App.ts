import {
  BitmapFont,
  Color,
  Container,
  Renderer,
  TEXT_GRADIENT,
  Ticker,
  UPDATE_PRIORITY,
} from "pixi.js"
import semver from "semver"
import tippy from "tippy.js"
import "tippy.js/animations/scale-subtle.css"
import "tippy.js/dist/tippy.css"
import { registerSW } from "virtual:pwa-register"
import WebFont from "webfontloader"
import { ChartManager } from "./chart/ChartManager"
import { GameTypeRegistry } from "./chart/gameTypes/GameTypeRegistry"
import { NoteskinRegistry } from "./chart/gameTypes/noteskin/NoteskinRegistry"
import { Chart } from "./chart/sm/Chart"
import { ContextMenuPopup } from "./gui/element/ContextMenu"
import { MenubarManager } from "./gui/element/MenubarManager"
import { WaterfallManager } from "./gui/element/WaterfallManager"
import { AppUpdateNotification } from "./gui/notification/AppUpdateNotification"
import { CoreUpdateNotification } from "./gui/notification/CoreUpdateNotification"
import { DebugWidget } from "./gui/widget/DebugWidget"
import { ChangelogWindow } from "./gui/window/ChangelogWindow"
import { DirectoryWindow } from "./gui/window/DirectoryWindow"
import { InitialWindow } from "./gui/window/InitialWindow"
import { WindowManager } from "./gui/window/WindowManager"
import { ActionHistory } from "./util/ActionHistory"
import { BetterRoundedRect } from "./util/BetterRoundedRect"
import { EventHandler } from "./util/EventHandler"
import { FileHandler } from "./util/file-handler/FileHandler"
import { Flags, loadFlags } from "./util/Flags"
import { Keybinds } from "./util/Keybinds"
import { Options } from "./util/Options"
import { extname } from "./util/Path"
import { fpsUpdate } from "./util/Performance"
import { Themes } from "./util/Theme"
import { isIFrame } from "./util/Util"

declare global {
  interface Window {
    app: App
    GameTypeRegistry: GameTypeRegistry
    NoteskinRegistry: NoteskinRegistry
  }
  interface File {
    path?: string
  }
  interface HTMLInputElement {
    nwsaveas?: string
    nwworkingdir?: string
  }
}

interface AppVersion {
  version: string
  type: string
  date: number
  downloads: {
    "mac-x64": string
    "mac-arm": string
    win: string
    linux: string
  }
  changelog: string[]
}

const BASE_STAGE_HEIGHT = 960

export class App {
  readonly VERSION = "1.3.0"

  readonly options = Options
  readonly events = EventHandler
  readonly themes = Themes

  readonly renderer: Renderer
  readonly stage: Container
  readonly view: HTMLCanvasElement
  readonly chartManager: ChartManager
  readonly windowManager: WindowManager
  readonly menubarManager: MenubarManager
  readonly actionHistory: ActionHistory
  capturing = false

  STAGE_HEIGHT = BASE_STAGE_HEIGHT
  STAGE_WIDTH = BASE_STAGE_HEIGHT

  private lastWidth = -1
  private lastHeight = -1

  constructor() {
    tippy.setDefaultProps({ duration: [200, 100], theme: "sm" })

    Options.loadOptions()
    loadFlags()
    Keybinds.load(this)

    if (window.nw) {
      const win = nw.Window.get()
      if (Options.app.fullscreen) {
        win.enterFullscreen()
      } else {
        win.resizeTo(Options.app.width, Options.app.height)
      }
    }

    setInterval(() => {
      if (this.capturing) return
      Options.saveOptions()
    }, 10000)
    if (Options.general.smoothAnimations)
      document.body.classList.add("animated")
    document.body.parentElement!.style.fontSize = `${Options.general.uiScale * 100}%`
    this.registerFonts()

    this.view = document.getElementById("pixi") as HTMLCanvasElement

    document.oncontextmenu = event => {
      event.preventDefault()
      if (!this.chartManager.loadedChart) return
      if (event.target != this.view) return
      ContextMenuPopup.open(this, event)
    }

    this.view.onmousedown = () => {
      ContextMenuPopup.close()
    }

    this.stage = new Container()
    this.stage.sortableChildren = true
    this.renderer = new Renderer({
      backgroundColor: 0x18191c,
      antialias: Options.performance.antialiasing,
      width: this.view.clientWidth,
      height: this.view.clientHeight,
      resolution: Options.performance.resolution,
      autoDensity: true,
      view: this.view,
      powerPreference: "low-power",
    })

    Ticker.shared.maxFPS = 0
    Ticker.shared.add(() => {
      // Update ChartRenderer every frame
      const updateStart = performance.now()
      this.chartManager.widgetManager.update()
      if (
        this.chartManager.loadedSM &&
        this.chartManager.loadedChart &&
        this.chartManager.chartView
      ) {
        this.chartManager.chartView.update()
      }
      DebugWidget.instance?.addDrawUpdateTimeValue(
        performance.now() - updateStart
      )

      const startTime = performance.now()
      this.renderer.render(this.stage)
      DebugWidget.instance?.addFrameTimeValue(performance.now() - startTime)
      if (performance.memory?.usedJSHeapSize)
        DebugWidget.instance?.addMemoryTimeValue(
          performance.memory.usedJSHeapSize
        )
      fpsUpdate()
    }, UPDATE_PRIORITY.HIGH)

    BetterRoundedRect.init(this.renderer)

    this.chartManager = new ChartManager(this)
    this.menubarManager = new MenubarManager(
      this,
      document.getElementById("menubar") as HTMLDivElement
    )
    this.windowManager = new WindowManager(
      this,
      document.getElementById("windows") as HTMLDivElement
    )
    this.actionHistory = new ActionHistory(this)

    this.registerListeners()

    if (!Flags.hidePoweredByText && isIFrame()) {
      const embed = document.getElementById("embed") as HTMLDivElement
      embed.appendChild(document.createTextNode("Powered by "))
      const smLink = document.createElement("a")
      smLink.href = "https://tillvit.github.io/smeditor/"
      smLink.innerText = "SMEditor"
      smLink.target = "_blank"
      embed.appendChild(smLink)
      if (Flags.url != null) {
        embed.appendChild(document.createTextNode(" | Open this chart in a "))
        const newLink = document.createElement("a")
        const url = new URL(location.origin + "/smeditor/app/")
        newLink.innerText = "new tab"
        newLink.target = "_blank"
        url.searchParams.append("url", Flags.url)
        if (Flags.chartType !== null)
          url.searchParams.append("chartType", Flags.chartType)
        if (Flags.chartIndex !== null)
          url.searchParams.append("chartIndex", Flags.chartIndex + "")
        newLink.href = url.toString()
        embed.appendChild(newLink)
      }
    }

    FileHandler.initFileSystem().then(() => {
      if (Flags.url) {
        this.chartManager.loadSM(Flags.url).then(() => {
          const sm = this.chartManager.loadedSM
          if (!sm) return
          let gameTypeCharts: Chart[] | undefined
          if (Flags.chartType != null) {
            gameTypeCharts = sm.charts[Flags.chartType]
            if (gameTypeCharts === undefined) {
              WaterfallManager.createFormatted(
                `Couldn't find chart with type ${Flags.chartType}`,
                "warn"
              )
              return
            }
          }
          if (gameTypeCharts === undefined) {
            const gameTypes = Object.keys(sm.charts)
            if (gameTypes.length == 0) {
              // no charts available
              return
            }
            gameTypeCharts = sm.charts[gameTypes[0]]
            if (gameTypeCharts.length == 0) {
              return
            }
          }
          let chart: Chart | undefined
          if (Flags.chartIndex != null) {
            chart = gameTypeCharts.at(Flags.chartIndex)
            if (chart === undefined) {
              WaterfallManager.createFormatted(
                `Couldn't find chart with index ${Flags.chartIndex}`,
                "warn"
              )
              return
            }
          }
          if (chart === undefined) {
            chart = gameTypeCharts.at(-1)
            if (!chart) return
          }
          this.chartManager.loadChart(chart)
        })
        return
      }
      this.windowManager.openWindow(new InitialWindow(this))

      if (window.nw) {
        const win = nw.Window.get()

        nw.App.on("open", args => {
          if (!args || args?.length === 0) {
            nw.Window.open(window.location.href)
            return
          }
          let foundSM = ""
          for (let file of args) {
            if (file.startsWith("file://")) file = file.substring(7)
            if (extname(file) == ".ssc") {
              foundSM = file
              break
            } else if (foundSM == "" && extname(file) == ".sm") {
              foundSM = file
            }
          }
          if (foundSM != "") {
            this.chartManager.loadSM(foundSM)
            this.windowManager.getWindowById("select_sm_initial")?.closeWindow()
          }
        })

        window.addEventListener("keydown", e => {
          if (e.key == "r" && (e.metaKey || e.ctrlKey)) {
            e.preventDefault()
            win.reload()
          }
          if (e.code == "KeyW" && (e.metaKey || e.ctrlKey)) {
            e.preventDefault()
            win.close()
          }
          if (
            process.versions["nw-flavor"] == "sdk" &&
            e.code == "KeyI" &&
            e.metaKey &&
            e.altKey
          ) {
            e.preventDefault()
            win.showDevTools()
          }
        })
        win.on("enter-fullscreen", () => {
          Options.app.fullscreen = win.isFullscreen
        })
        win.on("resize", (w, h) => {
          if (!win.isFullscreen) {
            Options.app.width = w!
            Options.app.height = h!
          }
        })
        win.on("restore", () => {
          Options.app.fullscreen = win.isFullscreen
        })
        this.checkAppVersion()
      }

      this.checkCoreVersion()
    })

    window.onbeforeunload = event => {
      if (ActionHistory.instance.isDirty() && Options.general.warnBeforeExit) {
        event.preventDefault()
        return (event.returnValue = "Are you sure you want to exit?")
      }
    }

    window.onpagehide = () => {
      if (this.capturing) return
      Options.saveOptions()
    }

    Themes.loadTheme(Options.general.theme)
    Ticker.shared.start()
  }

  registerFonts() {
    BitmapFont.from(
      "Main",
      {
        fontFamily: "Assistant",
        fontSize: 20,
        fill: "white",
      },
      {
        chars: [
          ["a", "z"],
          ["A", "Z"],
          "!@#$%^&*()~{}[]:.-?=,_|",
          "0123456789/",
          " ",
        ],
        resolution: window.devicePixelRatio,
      }
    )

    BitmapFont.from(
      "Mono",
      {
        fontFamily: "monospace",
        fontSize: 20,
        fill: "white",
      },
      {
        chars: [
          ["a", "z"],
          ["A", "Z"],
          "!@#$%^&*()~{}[]:.-?=,_|",
          "0123456789/",
          " ",
        ],
        resolution: window.devicePixelRatio,
      }
    )

    BitmapFont.from(
      "Fancy",
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
          "!@#$%^&*()~{}[]:.-?=,_|",
          "0123456789/",
          " ",
        ],
        resolution: window.devicePixelRatio,
      }
    )
  }

  registerListeners() {
    this.view.addEventListener("mousedown", () => {
      this.windowManager.unfocusAll()
    })

    EventHandler.on("themeChanged", () => {
      this.renderer.background.color = new Color(
        Themes.getCurrentTheme()["editor-bg"]
      ).toNumber()
    })

    EventHandler.on("userOptionUpdated", option => {
      if (option == "general.uiScale") {
        this.updateSize()
      }
    })

    window.addEventListener("keydown", function (e) {
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
      if (this.capturing) return
      const screenWidth = window.innerWidth
      const screenHeight = this.getCanvasHeight()
      if (this.lastHeight != screenHeight || this.lastWidth != screenWidth) {
        this.lastHeight = screenHeight
        this.lastWidth = screenWidth
        this.onResize(screenWidth, screenHeight)
        EventHandler.emit("resize")
      }
    }, 100)

    window.addEventListener("dragover", event => {
      event.preventDefault()
      event.dataTransfer!.dropEffect = "copy"
    })

    window.addEventListener("drop", event => {
      if (window.nw) {
        event.stopPropagation()
        event.preventDefault()

        let foundSM = ""
        for (const file of event.dataTransfer!.files) {
          if (file.path) {
            if (extname(file.path) == ".ssc") {
              foundSM = file.path
              break
            } else if (foundSM == "" && extname(file.path) == ".sm") {
              foundSM = file.path
            }
          }
        }
        if (foundSM != "") {
          this.chartManager.loadSM(foundSM)
          this.windowManager.getWindowById("select_sm_initial")?.closeWindow()
        }
      } else {
        FileHandler.handleDropEvent(event).then(folder => {
          const dirWindow = new DirectoryWindow(this, {
            title: "Select an sm/ssc file...",
            accepted_file_types: [".sm", ".ssc"],
            disableClose: true,
            callback: (path: string) => {
              this.chartManager.loadSM(path)
              this.windowManager
                .getWindowById("select_sm_initial")
                ?.closeWindow()
            },
            onload: () => {
              dirWindow
                .getAcceptableFile(folder ?? "")
                .then(path => dirWindow.selectPath(path))
            },
          })
          this.windowManager.openWindow(dirWindow)
        })
      }
    })
  }

  onResize(screenWidth: number, screenHeight: number) {
    this.renderer.screen.width = screenWidth
    this.renderer.screen.height = screenHeight
    this.view.width = screenWidth * this.renderer.resolution
    this.view.height = screenHeight * this.renderer.resolution
    this.view.style.width = `${screenWidth}px`
    this.view.style.height = `${screenHeight}px`
    this.STAGE_HEIGHT = BASE_STAGE_HEIGHT / Options.general.uiScale
    const zoomRatio = screenHeight / this.STAGE_HEIGHT
    this.stage.scale.set(zoomRatio)
    this.stage.position.set(screenWidth / 2, screenHeight / 2)
    this.STAGE_WIDTH = screenWidth / zoomRatio
  }

  updateSize() {
    const screenWidth = window.innerWidth
    const screenHeight = this.getCanvasHeight()
    this.lastHeight = screenHeight
    this.lastWidth = screenWidth
    this.onResize(screenWidth, screenHeight)
    EventHandler.emit("resize")
  }

  getCanvasHeight() {
    return (
      window.innerHeight -
      (document.getElementById("menubar")?.clientHeight ?? 0) -
      (document.getElementById("playback-options")?.clientHeight ?? 0)
    )
  }

  checkAppVersion() {
    if (!window.nw) return
    const gui = nw.require("nw.gui")

    const BUILD_TYPES: Record<string, number> = {
      stable: 3,
      beta: 2,
      alpha: 1,
      nightly: 0,
    }
    let os = "win"
    if (process.platform == "darwin") {
      os = nw.require("os").arch() == "arm64" ? "mac-arm" : "mac-x64"
    } else if (process.platform == "linux") os = "linux"
    fetch("/smeditor/assets/app/versions.json")
      .then(data => data.json())
      .then((versions: AppVersion[]) => {
        versions = versions.sort((a, b) => {
          if (BUILD_TYPES[a.type] != BUILD_TYPES[b.type])
            return BUILD_TYPES[b.type] - BUILD_TYPES[a.type]
          return b.date - a.date
        })
        const version = versions[0]
        if (
          semver.lt(gui.App.manifest.version, version.version) &&
          localStorage.getItem("downloadedVersion") !== version.version
        ) {
          AppUpdateNotification.open(
            version.version,
            version.downloads[os as keyof AppVersion["downloads"]]
          )
        }
      })
  }

  checkCoreVersion() {
    const update = registerSW({})
    navigator.serviceWorker.addEventListener("controllerchange", () => {
      CoreUpdateNotification.open(update)
      console.log("Found new version")
    })

    const localVersion = localStorage.getItem("coreVersion")
    if (localVersion !== null && semver.lt(localVersion, this.VERSION)) {
      this.windowManager.openWindow(new ChangelogWindow(this))
    }
    localStorage.setItem("coreVersion", this.VERSION)
  }
}

document.querySelector("body")!.innerHTML = `<div id="popups"></div>
          <div id="view-wrapper">
            <div id="menubar"></div>
            <div id="waterfall"><div id="waterfall-container"></div></div>
            <canvas id="pixi"></canvas>
          </div>
          <div id="context-menu"></div>
          <div id="blocker" style="display: none"></div>
          <div id="windows"></div>
          <div id="embed"></div>
        `

WebFont.load({
  custom: {
    families: ["Assistant"],
  },
  active: init,
  inactive: init,
  classes: false,
})

function init() {
  // Check WebGL
  const canvas = document.createElement("canvas")
  const gl = (canvas.getContext("webgl") ||
    canvas.getContext("experimental-webgl")) as WebGLRenderingContext

  if (!gl) {
    document.querySelector("body")!.innerHTML =
      `<div class='browser-unsupported'>
      <div class='browser-unsupported-item'>
      <h1>WebGL is not enabled</h1>
      <div>Please visit your browser settings and enable WebGL.</div>
      </div>
    </div>`
  } else {
    window.app = new App()
    window.GameTypeRegistry = GameTypeRegistry
    window.NoteskinRegistry = NoteskinRegistry
  }
}
