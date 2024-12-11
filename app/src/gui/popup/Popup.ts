import { DisplayObject, Rectangle } from "pixi.js"
import { clamp } from "../../util/Math"

export interface PopupOptions {
  attach: DisplayObject | HTMLElement
  title: string
  description?: string
  width?: number
  height?: number
  options?: PopupOption[]
  background?: string
  textColor?: string
  editable: boolean
  cancelableOnOpen: boolean
  clickHandler?: (event: MouseEvent) => void
}

interface PopupOption {
  label: string
  callback?: () => void
  type: "delete" | "confirm" | "default"
}

interface ObjectBounds {
  top: number
  bottom: number
  left: number
  right: number
  width: number
  height: number
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
    this._build()

    if (!document.getElementById("popups")) {
      console.error("Failed to open popup!", "error")
      return
    }
    document.getElementById("popups")?.appendChild(this.popup!)

    if (this.clickOutside)
      window.removeEventListener("click", this.clickOutside, true)
    this.clickOutside =
      this.options.clickHandler ??
      ((event: MouseEvent) => {
        if (!this.popup?.contains(event.target as Node | null)) {
          this.close()
        }
      })

    this.popup!.style.transitionDuration = "0s"
    this.movePosition()
    this.moveInterval = setInterval(() => this.movePosition(), MOVE_INTERVAL)
    this.active = true

    if (this.options.cancelableOnOpen) {
      setTimeout(
        () => window.addEventListener("click", this.clickOutside!, true),
        200
      )
    }
  }

  private static cloneRect(rect: Rectangle) {
    return {
      top: rect.top,
      bottom: rect.bottom,
      left: rect.left,
      right: rect.right,
      width: rect.width,
      height: rect.height,
    }
  }

  private static movePosition() {
    const point: ObjectBounds =
      this.options.attach instanceof HTMLElement
        ? this.options.attach.getBoundingClientRect()
        : this.cloneRect(this.options.attach.getBounds())
    if (!(this.options.attach instanceof HTMLElement)) {
      // Shift the top if it is a pixi object
      point.top += document.getElementById("pixi")!.offsetTop + 9
    }

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
    const topY = point.top + point.height / 2 + 15
    this.popup!.style.top = `${topY}px`
    if (topY + this.popup!.clientHeight > window.innerHeight - 15) {
      this.popup!.style.transform = "translate(-50%, -100%)"
      this.view!.style.transformOrigin = "bottom"
      this.popup!.style.top = `${point.top - 15}px`
    } else {
      this.popup!.style.transform = ""
      this.view!.style.transformOrigin = ""
    }
    requestAnimationFrame(() => (this.popup!.style.transitionDuration = ""))
  }

  private static _build() {
    const popup = document.createElement("div")
    popup.classList.add("popup")
    this.popup = popup

    const popupView = document.createElement("div")
    popupView.classList.add("popup-zoomer")
    if (this.options.width) popupView.style.width = `${this.options.width}px`
    popupView.style.backgroundColor = this.options.background ?? ""
    popupView.style.color = this.options.textColor ?? ""
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

    if (this.options.editable) {
      const editText = document.createElement("div")
      editText.innerText = "click to edit"
      editText.style.marginTop = "4px"
      editText.style.height = "10px"
      popupView.appendChild(editText)
      editText.classList.add("popup-desc")
      this.editText = editText
    }

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
    if (!this.popup || !this.options.editable) return
    this.persistent = true
    this.view!.classList.add("selected")
    this.editText!.style.transform = "scale(0)"
    this.editText!.style.height = "0px"
    if (!this.options.cancelableOnOpen) {
      setTimeout(
        () => window.addEventListener("click", this.clickOutside!, true),
        200
      )
    }
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
