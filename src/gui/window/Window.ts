import { clamp } from "../../util/Math"
import { Icons } from "../Icons"
import { WindowManager } from "./WindowManager"

export interface WindowOptions {
  title: string
  width: number
  height: number
  win_id?: string
  disableClose?: boolean
  blocking?: boolean
}

export abstract class Window {
  private windowManager?: WindowManager

  options: WindowOptions
  windowElement: HTMLDivElement
  viewElement: HTMLDivElement

  constructor(options: WindowOptions) {
    this.options = options

    const windowElement = document.createElement("div")
    const viewElement = document.createElement("div")
    const navbarElement = document.createElement("div")
    const navbarTitleElement = document.createElement("div")

    windowElement.appendChild(navbarElement)
    windowElement.appendChild(viewElement)
    windowElement.style.width = options.width + "px"
    windowElement.style.left = window.innerWidth / 2 - options.width / 2 + "px"
    windowElement.style.top = window.innerHeight / 2 - options.height / 2 + "px"
    windowElement.classList.add("unselectable", "window")
    if (options.win_id) windowElement.dataset.win_id = options.win_id

    viewElement.classList.add("view")
    viewElement.style.height = options.height + "px"
    viewElement.style.width = options.width + "px"

    navbarElement.classList.add("navbar")
    navbarElement.appendChild(navbarTitleElement)
    if (!options.disableClose) {
      const minimizeElement = document.createElement("img")
      const closeElement = document.createElement("img")

      minimizeElement.classList.add("unselectable")
      minimizeElement.draggable = false
      minimizeElement.src = Icons.MINIMIZE_WINDOW
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
      closeElement.src = Icons.CLOSE_WINDOW
      closeElement.onclick = () => this.closeWindow()

      navbarElement.appendChild(minimizeElement)
      navbarElement.appendChild(closeElement)
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
  }

  abstract initView(): void

  addToManager(windowManager: WindowManager) {
    this.windowManager = windowManager
    windowManager.view.appendChild(this.windowElement)
    this.focus()
  }

  // eslint-disable-next-line @typescript-eslint/no-empty-function
  onClose(): void {}

  closeWindow() {
    if (this.windowManager) {
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
}
