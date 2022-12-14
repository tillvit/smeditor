import { clamp } from "../util/Util"
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
      minimizeElement.src =
        "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAADAAAAAwCAYAAABXAvmHAAAAAXNSR0IArs4c6QAAANtJREFUaEPtlbsNwlAQBMcRLQC10QZEiAAi0wa0xqcMdIiICGmejZ60znfPN3OWBzp/hs7fnyzwb4MxEAOSQE5IAtTxGNAIZUEMSIA6HgMaoSyIAQlQx2NAI5QFMSAB6ngMaISyIAYkQB2PAY1QFsSABKjjMaARyoIYkAB1PAY0QlkQAxKgjseARigLysACOAEbYCX75oo/gCuwrwXOwHauyY3njLVAbbNsXDxX3bMWuHd0Ot9gbrXACOzmQtZ4zvuE6iM+fj7ideMBU9XV1VyAQ/4DUyH+tbd7Ay+Srg0YYU5a1gAAAABJRU5ErkJggg=="
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
      closeElement.src =
        "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAADAAAAAwCAYAAABXAvmHAAAAAXNSR0IArs4c6QAAA35JREFUaEPtmbfrFUEQxz+/0pwwFNoqmMCcc46olY1/m7U2Ys45IWIuDFiJCYyYC0X5ypwcx93t7O57yIO37c3Ofr8zszvhBujxNdDj+OkT+N8e7HugVzywGtgLPAB2A1+6BHw4sB+YBuwBLoTO8YTQMuAYMNSUXQM2AZ9CyiO/jwBOAAtt3zdgG3CuTU+IwFLgeAl8oesWsA74EAmySVzgTwILKgJBEm0ElpvlhzScegPYCHzMJDEKOAXMbdDzFdgMXKr73kbgFTAhAO4msCHDE6OB08DswDkvgImxBK4ASxzWVTitB947ZMsiYwz8LMc+XeZVsQRGmmvnOQ64a3firUNWIgobWX6OQ/6O6X4XS0DyIqHLNd9x0D076E1AdixwBpjp0HnbdDZ6N/QK6YymF6Lu/IfAGkD3p26NM/AzHOBdoekhUJAov9Ft5z8ClPiqJAT+LDDdAd6da7wEdKaypEgscgB4bCRemux4A68MG1pu8FIUQ0DyyglHgJUhFMATI/HTsulUx56rluU/O2T/isQS0J5hluCUpUNLJLQmhwSBi8AWQInLvVIISPlg4LBZ2H1Yi+Bly7bRRWIqgYLEIXt1ckioRJDlo8GnhlAZrDxxEFibyEA10A7ge+L+pDtQPWuQkVB1GrOUIHfmgO+EBwrAInHACjsPCZXou4AfHuE2mZw7UNYbk621TyWCwi67n+gEASU4hUPRSXmN2pGmKJdAKviCZDaJHALKyuqV1bnlrOvW2SX12KkEOgW+IJ5MIoWASgkVdYsdZlfLqeVpilTEqcd210Epz6gsfxRY4QCvTkovza+GiUOdimgSMR6IqUQL8EUnpWdWWdfT2UWR8BKIAa/+WJav9rBdIeEhoHpHYePpAZrAF+ESQ8LVG4QICLwamNqRRiWIQ+AL8ZhpR5BEG4EY8JpIqJmvHX3U3NaOkWgjoFpfw9XQ8lq+qsc7ldM+NU/b64C0EXgGTAqgj7V8HQnNiELTuedNWNoIKO4V/wqluiXwem2807gmW8gTbSQ0od4KnI/1gOSr/wYKHfct5nPBly+2Ro3VCbU6NYWx5km1K/QKaVN1zK7BlbzzOnQ5Ir/rYpdJCLziXt5pXB4C2qxQ2Qc8NXeG5p+R2P+Ja2Ktx2OK/cpqBa9dXgKF7O9UZN3aF0OgWxiy9PYJZJmvA5v7HuiAEbNU/AEymbExfA8cowAAAABJRU5ErkJggg=="
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

  abstract initView(viewElement: HTMLDivElement): void

  addToManager(windowManager: WindowManager) {
    this.windowManager = windowManager
    windowManager.view.appendChild(this.windowElement)
    this.focus()
  }

  closeWindow() {
    if (this.windowManager) {
      this.windowManager.removeWindow(this)
      this.windowElement.classList.add("exiting")
      window.removeEventListener("mousedown", this.block, true)
      if (this.options.blocking)
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
