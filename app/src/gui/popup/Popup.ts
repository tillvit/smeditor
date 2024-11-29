import { DisplayObject } from "pixi.js"
import { clamp } from "../../util/Math"

export interface PopupOptions {
  attach: DisplayObject
  title: string
  description?: string
  width?: number
  height?: number
  options?: PopupOption[]
  background?: string
}

interface PopupOption {
  label: string
  callback?: () => void
  type: "delete" | "confirm" | "default"
}

const MOVE_INTERVAL = 150

export abstract class Popup {
  static active = false
  static persistent = false

  static options: PopupOptions

  static popup?: HTMLDivElement
  static view?: HTMLDivElement
  static title?: HTMLDivElement
  static desc?: HTMLDivElement
  static editText?: HTMLDivElement

  private static clickOutside?: (e: MouseEvent) => void
  private static moveInterval: NodeJS.Timeout
  private static updateInterval: NodeJS.Timeout

  static _open(options: PopupOptions) {
    if (this.active) return
    this.options = options
    this.popup = this._build()

    if (!document.getElementById("popups")) {
      console.error("Failed to open popup!", "error")
      return
    }
    document.getElementById("popups")?.appendChild(this.popup)

    this.clickOutside = (event: MouseEvent) => {
      if (!this.popup?.contains(event.target as Node | null)) {
        this.close()
      }
    }

    // don't show until the position has been set
    this.popup.style.display = `none`
    requestAnimationFrame(() => this.movePosition())
    this.moveInterval = setInterval(() => this.movePosition(), MOVE_INTERVAL)
    this.active = true
  }

  private static movePosition() {
    this.popup!.style.display = ""
    const point = this.options.attach.getBounds()
    // will the box stay in bounds?
    const centerx = point.left + point.width / 2
    const width = this.popup!.clientWidth
    const leftRestriction = width / 2 + 15
    const rightRestriction = window.innerWidth - width / 2 - 15
    this.popup!.style.left = `${clamp(
      centerx,
      leftRestriction,
      rightRestriction
    )}px`
    const canvasTop = document.getElementById("pixi")!.offsetTop + 9
    const topY = point.top + point.height / 2 + canvasTop + 15
    this.popup!.style.top = `${topY}px`
    if (topY + this.popup!.clientHeight > window.innerHeight - 15) {
      this.popup!.style.transform = `translate(-50%, -100%)`
      this.popup!.style.top = `${point.top + canvasTop - 15}px`
    } else {
      this.popup!.style.transform = ``
    }
  }
  private static _build() {
    const popup = document.createElement("div")
    popup.classList.add("popup")
    const popupView = document.createElement("div")
    popupView.classList.add("popup-zoomer")
    popupView.style.width = `${this.options.width ?? 200}px`
    popupView.style.backgroundColor = this.options.background ?? "#333333"
    popup.appendChild(popupView)
    this.view = popupView

    const title = document.createElement("div")
    title.innerText = this.options.title
    title.classList.add("popup-title")
    popupView.appendChild(title)
    this.title = title

    if (this.options.description !== undefined) {
      const desc = document.createElement("div")
      desc.innerText = this.options.description
      desc.classList.add("popup-desc")
      popupView.appendChild(desc)
      this.desc = desc
    }

    this.buildContent()

    const editText = document.createElement("div")
    editText.innerText = "click to edit"
    editText.style.marginTop = "4px"
    editText.style.height = "10px"
    popupView.appendChild(editText)
    editText.classList.add("popup-desc")
    this.editText = editText

    if (this.options.options) {
      const popupOptions = document.createElement("div")
      popupOptions.classList.add("popup-options")

      this.options.options.forEach(o => {
        const button = document.createElement("button")
        button.innerText = o.label
        button.onclick = () => {
          o.callback?.()
        }
        button.classList.add(o.type)
        popupOptions.appendChild(button)
      })

      this.view.append(popupOptions)
    }

    return popup
  }

  static buildContent() {}

  static close() {
    if (!this.popup || !this.active) return
    window.removeEventListener("click", this.clickOutside!, true)
    this.popup.classList.add("exiting")
    const popup = this.popup
    setTimeout(() => popup.remove(), 200)
    this.active = false
    this.persistent = false
    clearInterval(this.moveInterval)
    clearInterval(this.updateInterval)
  }

  static select() {
    if (!this.popup) return
    this.persistent = true
    this.view!.classList.add("selected")
    this.editText!.style.transform = "scale(0)"
    this.editText!.style.height = "0px"
    setTimeout(
      () => window.addEventListener("click", this.clickOutside!, true),
      200
    )
  }

  static detach() {
    clearInterval(this.moveInterval)
  }

  static attach(target: DisplayObject) {
    clearInterval(this.moveInterval)
    this.moveInterval = setInterval(() => this.movePosition(), MOVE_INTERVAL)
    this.options.attach = target
  }
}
