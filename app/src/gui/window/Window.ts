import { clamp } from "../../util/Math"
import { Options } from "../../util/Options"
import { Icons } from "../Icons"
import { WindowManager } from "./WindowManager"

export interface WindowOptions {
  title: string
  width: number
  height?: number
  win_id?: string
  disableClose?: boolean
  blocking?: boolean
}

export abstract class Window {
  private windowManager?: WindowManager
  private minimizeElement!: HTMLDivElement
  private closeElement!: HTMLDivElement

  closed = false

  options: WindowOptions
  windowElement: HTMLDivElement
  viewElement: HTMLDivElement

  protected constructor(options: WindowOptions) {
    this.options = options

    const windowElement = document.createElement("div")
    const viewElement = document.createElement("div")
    const navbarElement = document.createElement("div")
    const navbarTitleElement = document.createElement("div")

    windowElement.appendChild(navbarElement)
    windowElement.appendChild(viewElement)
    windowElement.style.width = options.width / 16 + "rem"
    windowElement.style.left =
      window.innerWidth / 2 -
      (options.width / 2) * Options.general.uiScale +
      "px"
    if (options.height)
      windowElement.style.top =
        window.innerHeight / 2 -
        (options.height / 2) * Options.general.uiScale +
        "px"
    windowElement.classList.add("window")
    if (options.win_id) windowElement.dataset.win_id = options.win_id

    viewElement.classList.add("view")
    if (options.height) viewElement.style.height = options.height / 16 + "rem"
    viewElement.style.width = options.width / 16 + "rem"

    navbarElement.classList.add("navbar")
    if (options.title !== "") {
      navbarElement.appendChild(navbarTitleElement)
    }

    const minimizeElement = Icons.getIcon("MINIMIZE", 15)
    const closeElement = Icons.getIcon("CLOSE_WINDOW", 15)

    minimizeElement.classList.add("unselectable")
    minimizeElement.draggable = false
    minimizeElement.onclick = () => {
      if (viewElement.style.height != "0px") {
        viewElement.style.height = "0px"
      } else {
        viewElement.style.height = options.height + "px"
      }
      this.clampPosition()
    }

    closeElement.classList.add("unselectable")
    closeElement.draggable = false
    closeElement.onclick = () => this.closeWindow()

    navbarElement.appendChild(minimizeElement)
    navbarElement.appendChild(closeElement)
    this.minimizeElement = minimizeElement
    this.closeElement = closeElement

    if (options.disableClose) {
      minimizeElement.style.display = "none"
      closeElement.style.display = "none"
    }

    navbarTitleElement.innerText = options.title
    navbarTitleElement.classList.add("title")

    windowElement.addEventListener("mousedown", () => this.focus())
    if (options.blocking) {
      window.addEventListener("mousedown", this.block, true)
      document.getElementById("blocker")!.style.display = "block"
      windowElement.dataset.blocking = "block"
    }

    navbarTitleElement.addEventListener("mousedown", () => {
      window.addEventListener("mousemove", this.handleDrag)
      window.addEventListener("mouseup", () =>
        window.removeEventListener("mousemove", this.handleDrag)
      )
    })

    this.focus()
    windowElement.classList.add("focused")

    this.windowElement = windowElement
    this.viewElement = viewElement

    requestAnimationFrame(() => this.center())
  }

  abstract initView(): void

  addToManager(windowManager: WindowManager) {
    this.windowManager = windowManager
    windowManager.view.appendChild(this.windowElement)
    this.focus()
  }

  onClose(): void {}

  closeWindow() {
    if (this.windowManager) {
      this.closed = true
      this.onClose()
      this.windowManager.removeWindow(this)
      this.windowElement.classList.add("exiting")
      window.removeEventListener("mousedown", this.block, true)
      if (
        this.options.blocking &&
        this.windowManager.windows.filter(window => window.options.blocking)
          .length == 0
      )
        document.getElementById("blocker")!.style.display = "none"
      setTimeout(
        () => this.windowManager!.view.removeChild(this.windowElement),
        40
      )
    }
  }

  focus() {
    if (this.windowManager == undefined) return
    this.windowManager.unfocusAll()
    this.windowElement.classList.add("focused")
    const windows: HTMLDivElement[] = Array.from(
      this.windowManager.view.children
    )
      .map(x => x as HTMLDivElement)
      .filter(x => x != this.windowElement)
    windows.sort((a, b) => parseInt(a.style.zIndex) - parseInt(b.style.zIndex))
    windows.push(this.windowElement)
    for (let i = 0; i < windows.length; i++) {
      windows[i].style.zIndex = (
        (windows[i].dataset.blocking ? 10001 : 0) + i
      ).toString()
    }
  }

  unfocus() {
    if (this.windowManager == undefined) return
    this.windowElement.classList.remove("focused")
  }

  center() {
    const bounds = this.windowElement.getBoundingClientRect()
    this.windowElement.style.left =
      window.innerWidth / 2 -
      (bounds.width / 2) * Options.general.uiScale +
      "px"

    this.windowElement.style.top =
      window.innerHeight / 2 -
      (bounds.height / 2) * Options.general.uiScale +
      "px"
    this.clampPosition()
  }
  private block = (event: MouseEvent) => {
    if (!event.target || this.windowElement.contains(<Node>event.target)) return
    event.stopImmediatePropagation()
    event.preventDefault()
  }

  private handleDrag = (event: MouseEvent) => {
    const x =
      parseInt(this.windowElement.style.left.slice(0, -2)) + event.movementX
    const y =
      parseInt(this.windowElement.style.top.slice(0, -2)) + event.movementY
    this.windowElement.style.left = x + "px"
    this.windowElement.style.top = y + "px"
    this.clampPosition()
  }

  private clampPosition() {
    if (this.windowManager == undefined) return
    const x = parseInt(this.windowElement.style.left.slice(0, -2))
    const y = parseInt(this.windowElement.style.top.slice(0, -2))
    const bounds = this.windowManager.app.view.getBoundingClientRect()
    this.windowElement.style.left =
      clamp(
        x,
        bounds.left,
        bounds.width - this.windowElement.clientWidth + bounds.left
      ) + "px"
    this.windowElement.style.top =
      clamp(
        y,
        bounds.top,
        bounds.height - this.windowElement.clientHeight + bounds.top
      ) + "px"
  }

  move(x: number, y: number) {
    this.windowElement.style.left = x + "px"
    this.windowElement.style.top = y + "px"
  }

  setDisableClose(disable: boolean) {
    if (disable) {
      this.minimizeElement.style.display = "none"
      this.closeElement.style.display = "none"
    } else {
      this.minimizeElement.style.display = ""
      this.closeElement.style.display = ""
    }
  }

  setBlocking(blocking: boolean) {
    if (blocking) {
      this.windowElement.dataset.blocking = "block"
      document.getElementById("blocker")!.style.display = "block"
      window.addEventListener("mousedown", this.block, true)
    } else {
      this.windowElement.dataset.blocking = ""
      document.getElementById("blocker")!.style.display = "none"
      window.removeEventListener("mousedown", this.block, true)
    }
    this.focus()
  }
}
