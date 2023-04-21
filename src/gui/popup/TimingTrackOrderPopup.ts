import { TIMING_EVENT_COLORS } from "../../chart/component/TimingAreaContainer"
import { Options } from "../../util/Options"
import { blendColors, clamp } from "../../util/Util"

export class TimingTrackOrderPopup {
  static active = false
  static popup?: HTMLDivElement

  private static clickOutside?: (e: MouseEvent) => void
  private static moveInterval: NodeJS.Timer
  private static draggedElement?: HTMLDivElement
  private static dragOffsetX = 0
  private static dragOffsetY = 0
  private static grid?: HTMLDivElement

  private static boundaryCache: [Element, DOMRect][] = []

  static open() {
    if (this.active) return
    this.popup = this.build()
    document.getElementById("popups")?.appendChild(this.popup)

    this.clickOutside = (event: MouseEvent) => {
      if (
        !this.popup?.contains(event.target as Node | null) &&
        !this.draggedElement?.contains(event.target as Node | null)
      )
        this.close()
    }
    setTimeout(() => window.addEventListener("click", this.clickOutside!))

    // don't show until the position has been set
    this.popup.style.display = `none`
    setTimeout(() => this.movePosition())
    this.moveInterval = setInterval(() => this.movePosition(), 150)
    this.active = true
  }

  private static build() {
    const popup = document.createElement("div")
    popup.classList.add("popup")
    popup.id = "timing-track-order"
    const popupZoomer = document.createElement("div")
    popupZoomer.classList.add("popup-zoomer")
    popupZoomer.style.backgroundColor = "#333333"
    popup.appendChild(popupZoomer)
    const container = document.createElement("div")
    container.classList.add("container")
    popupZoomer.appendChild(container)
    const title = document.createElement("div")
    title.classList.add("title")
    title.innerText = "Arrange Timing Tracks"
    this.grid = document.createElement("div")
    this.grid.classList.add("track-grid")
    container.appendChild(title)
    container.appendChild(this.grid)

    for (const type of Options.chart.timingEventOrder.left) {
      const el = this.makeTrack(type)
      el.classList.add("left")
      this.grid.appendChild(el)
    }
    const playfield = document.createElement("div")
    playfield.classList.add("draggable-track")
    playfield.innerText = "PLAYFIELD"
    playfield.style.backgroundColor = "#2D2D2D"
    playfield.style.padding = "20px 10px"
    playfield.style.writingMode = "horizontal-tb"
    playfield.addEventListener("mousedown", ev =>
      this.startDragging(ev, playfield)
    )
    playfield.dataset.type = "PLAYFIELD"
    this.grid.appendChild(playfield)
    for (const type of Options.chart.timingEventOrder.right) {
      const el = this.makeTrack(type)
      el.classList.add("right")
      this.grid.appendChild(el)
    }
    return popup
  }

  private static makeTrack(type: string) {
    const container = document.createElement("div")
    container.classList.add("draggable-track")
    const text = document.createElement("div")
    text.classList.add("draggable-track-text")
    text.innerText = type
    container.style.backgroundColor = blendColors(
      TIMING_EVENT_COLORS[type].toString(16).padStart(6, "0"),
      "#333333",
      0.75
    )
    container.appendChild(text)
    container.addEventListener("mousedown", ev =>
      this.startDragging(ev, container)
    )
    container.dataset.type = type
    return container
  }

  private static startDragging(event: MouseEvent, element: HTMLDivElement) {
    if (!this.popup) return
    this.draggedElement = element.cloneNode(true) as HTMLDivElement
    // window.addEventListener("mousemove", this.mouseHandler)
    this.draggedElement.style.position = "fixed"
    const elementBounds = element.getBoundingClientRect()
    const popupBounds = this.popup.getBoundingClientRect()
    this.dragOffsetX = event.clientX - elementBounds.left
    this.dragOffsetY = event.clientY - elementBounds.top
    this.draggedElement.style.left =
      elementBounds.left - popupBounds.left + "px"
    this.draggedElement.style.top = elementBounds.top - popupBounds.top + "px"
    this.draggedElement.style.boxShadow = "6px 6px 6px #222"
    this.draggedElement.style.transition = "none"
    element.style.opacity = "0.03"
    this.popup.appendChild(this.draggedElement)

    const options = Options.chart.timingEventOrder.left.concat(
      ["PLAYFIELD"],
      Options.chart.timingEventOrder.right
    )

    const type = element.dataset.type!
    let lastSlot = options.indexOf(type)
    const originalSlot = options.indexOf(type)

    const moveHandler = (ev: MouseEvent) => {
      this.draggedElement!.style.left =
        ev.clientX - this.dragOffsetX - popupBounds.left + "px"
      this.draggedElement!.style.top =
        ev.clientY - this.dragOffsetY - popupBounds.top + "px"
      let slot = this.getClosestSlot(ev.clientX - this.dragOffsetX)
      if (
        Math.abs(
          ev.clientY -
            this.dragOffsetY -
            popupBounds.top -
            (elementBounds.top - popupBounds.top)
        ) > 140
      ) {
        slot = originalSlot
      }
      if (lastSlot != slot) {
        options.splice(lastSlot, 1)
        options.splice(slot, 0, type)
        this.saveOptions(options)
        options.forEach(option => {
          const element = this.grid?.querySelector(`div[data-type=${option}]`)
          this.grid?.appendChild(element!)
          if (option != "PLAYFIELD") {
            element?.classList.remove("left", "right")
            if (Options.chart.timingEventOrder.left.includes(option)) {
              element?.classList.add("left")
            }
            if (Options.chart.timingEventOrder.right.includes(option)) {
              element?.classList.add("right")
            }
          }
        })
        if (type != "PLAYFIELD") {
          this.draggedElement?.classList.remove("left", "right")
          if (Options.chart.timingEventOrder.left.includes(type)) {
            this.draggedElement?.classList.add("left")
          }
          if (Options.chart.timingEventOrder.right.includes(type)) {
            this.draggedElement?.classList.add("right")
          }
        }

        lastSlot = slot
      }
    }
    window.addEventListener("mousemove", moveHandler)
    window.addEventListener("mouseup", () => {
      this.draggedElement?.remove()
      this.draggedElement = undefined
      window.removeEventListener("mousemove", moveHandler)
      element.style.opacity = ""
      this.clearBoundaries()
    })
  }

  private static saveOptions(options: string[]) {
    const playfieldIndex = options.indexOf("PLAYFIELD")
    if (playfieldIndex == -1) return
    Options.chart.timingEventOrder.left = options.slice(0, playfieldIndex)
    Options.chart.timingEventOrder.right = options.slice(playfieldIndex + 1)
  }

  private static movePosition() {
    if (!this.popup) return
    const button = document.getElementById("arrange-tracks")
    if (!button) return
    this.popup.style.display = ``
    const point = button.getBoundingClientRect()
    // will the box stay in bounds?
    const centerx = point.left + point.width / 2
    const width = this.popup.clientWidth
    const leftRestriction = width / 2 + 15
    const rightRestriction = window.innerWidth - width / 2 - 15
    this.popup.style.left = `${clamp(
      centerx,
      leftRestriction,
      rightRestriction
    )}px`
    const centery = point.top + point.height / 2
    this.popup.style.top = `${point.top + point.height}px`
    if (centery + this.popup.clientHeight > window.innerHeight - 15) {
      this.popup.style.transform = `translate(-50%, -100%)`
      this.popup.style.top = `${point.top - point.height / 2}px`
    }
  }

  private static getClosestSlot(x: number) {
    if (this.boundaryCache.length == 0) this.getBoundaries()
    let bestPosition = -1
    let bestDist = 999999
    let lastDist = 999999
    for (let i = 0; i < this.boundaryCache.length; i++) {
      const dist = Math.abs(x - this.boundaryCache[i][1].left)
      if (dist < bestDist) {
        bestDist = dist
        bestPosition = i
      }
      if (dist > lastDist) break
      lastDist = dist
    }
    return bestPosition
  }

  private static getBoundaries() {
    if (!this.grid) return
    for (const node of this.grid.children) {
      this.boundaryCache.push([node, node.getBoundingClientRect()])
    }
    this.boundaryCache.sort((a, b) => a[1].left - b[1].left)
  }

  private static clearBoundaries() {
    this.boundaryCache = []
  }

  static close() {
    if (!this.popup || !this.active) return
    window.removeEventListener("click", this.clickOutside!)
    this.popup.classList.add("exiting")
    setTimeout(() => this.popup!.remove(), 200)
    this.active = false
    clearInterval(this.moveInterval)
    this.clearBoundaries()
  }
}
