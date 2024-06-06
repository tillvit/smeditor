import { TIMING_EVENT_COLORS } from "../../chart/component/timing/TimingAreaContainer"
import { TIMING_EVENT_NAMES } from "../../chart/sm/TimingTypes"
import { blendColors } from "../../util/Color"
import { clamp } from "../../util/Math"
import { DefaultOptions, Options } from "../../util/Options"
import { Icons } from "../Icons"

export class TimingTrackOrderPopup {
  static active = false
  static popup?: HTMLDivElement

  private static clickOutside?: (e: MouseEvent) => void
  private static moveInterval: NodeJS.Timeout
  private static exitTimeout: NodeJS.Timeout
  private static draggedElement?: HTMLDivElement
  private static dragOffsetX = 0
  private static dragOffsetY = 0
  private static grid?: HTMLDivElement
  private static leftovers?: HTMLDivElement

  private static boundaryCache: [Element, DOMRect][] = []

  static open() {
    if (this.active) return
    this.popup = this.build()
    document.getElementById("popups")?.appendChild(this.popup)

    this.clickOutside = (event: MouseEvent) => {
      if (
        !this.popup?.contains(event.target as Node | null) &&
        !this.draggedElement?.contains(event.target as Node | null) &&
        !document
          .getElementById("arrange-tracks")
          ?.contains(event.target as Node | null)
      )
        this.close()
    }
    setTimeout(() => window.addEventListener("click", this.clickOutside!, true))

    // instantly snap to position when first showing
    this.popup.style.transitionDuration = `0s`
    setTimeout(() => this.movePosition())

    clearTimeout(this.exitTimeout)
    this.moveInterval = setInterval(() => this.movePosition(), 150)
    this.active = true
  }

  private static build() {
    const popup = document.createElement("div")
    popup.classList.add("popup")
    popup.id = "timing-track-order"
    const popupZoomer = document.createElement("div")
    popupZoomer.classList.add("popup-zoomer")
    popup.appendChild(popupZoomer)
    const container = document.createElement("div")
    container.classList.add("container")
    popupZoomer.appendChild(container)
    const gridOptions = document.createElement("div")
    gridOptions.classList.add("track-grid-options")
    const reset = document.createElement("button")
    reset.classList.add("delete")
    reset.innerText = "Reset"
    reset.onclick = () => {
      Options.chart.timingEventOrder = structuredClone(
        DefaultOptions.chart.timingEventOrder
      )
      this.clearBoundaries()
      this.grid?.replaceChildren()
      this.leftovers?.replaceChildren()
      const leftoverTypes: string[] = [...TIMING_EVENT_NAMES]

      for (const type of Options.chart.timingEventOrder.left) {
        const el = this.makeDraggableTrack(type)
        el.classList.add("left")
        this.grid?.appendChild(el)
        leftoverTypes.splice(leftoverTypes.indexOf(type), 1)
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
      this.grid?.appendChild(playfield)
      for (const type of Options.chart.timingEventOrder.right) {
        const el = this.makeDraggableTrack(type)
        el.classList.add("right")
        this.grid?.appendChild(el)
        leftoverTypes.splice(leftoverTypes.indexOf(type), 1)
      }

      for (const type of leftoverTypes) {
        this.leftovers?.appendChild(this.makeLeftoverTrack(type))
      }
    }
    this.grid = document.createElement("div")
    this.grid.classList.add("track-grid")
    container.appendChild(this.grid)
    container.appendChild(gridOptions)

    const leftoverTypes: string[] = [...TIMING_EVENT_NAMES]

    for (const type of Options.chart.timingEventOrder.left) {
      const el = this.makeDraggableTrack(type)
      el.classList.add("left")
      this.grid.appendChild(el)
      leftoverTypes.splice(leftoverTypes.indexOf(type), 1)
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
      const el = this.makeDraggableTrack(type)
      el.classList.add("right")
      this.grid.appendChild(el)
      leftoverTypes.splice(leftoverTypes.indexOf(type), 1)
    }

    this.leftovers = document.createElement("div")
    this.leftovers.classList.add("track-selector")
    gridOptions.appendChild(this.leftovers)
    gridOptions.appendChild(reset)

    for (const type of leftoverTypes) {
      this.leftovers.appendChild(this.makeLeftoverTrack(type))
    }
    return popup
  }

  private static makeDraggableTrack(type: string) {
    const trackContainer = document.createElement("div")
    trackContainer.classList.add("draggable-track")
    const trackLabel = document.createElement("div")
    trackLabel.classList.add("draggable-track-text")
    trackLabel.innerText = type
    trackContainer.style.backgroundColor = blendColors(
      TIMING_EVENT_COLORS[type].toString(16).padStart(6, "0"),
      "#333333",
      0.7
    )
    trackContainer.appendChild(trackLabel)

    let active = true

    const deleteIcon = document.createElement("img")
    deleteIcon.src = Icons.TRASH
    deleteIcon.style.width = "16px"
    deleteIcon.addEventListener("click", () => {
      if (!active) return
      active = false
      this.deleteTrack(type)
      trackContainer.classList.add("exiting")
      setTimeout(() => trackContainer.remove(), 400)
      const leftover = this.makeLeftoverTrack(type)
      leftover.classList.add("entering")
      setTimeout(() => leftover.classList.remove("entering"), 400)
      this.leftovers?.appendChild(leftover)
      this.clearBoundaries()
    })

    trackContainer.appendChild(deleteIcon)
    trackContainer.addEventListener("mousedown", ev => {
      if (!active) return
      if (ev.target == deleteIcon) return
      this.startDragging(ev, trackContainer)
    })
    trackContainer.dataset.type = type
    return trackContainer
  }

  private static makeLeftoverTrack(type: string) {
    const container = document.createElement("div")
    container.classList.add("leftover-track")

    const icon = document.createElement("img")
    icon.src = Icons.PLUS

    container.append(icon)

    const label = document.createElement("div")
    label.classList.add("leftover-track-text")
    label.innerText = type
    container.style.backgroundColor = blendColors(
      TIMING_EVENT_COLORS[type].toString(16).padStart(6, "0"),
      "#333333",
      0.7
    )
    container.appendChild(label)

    let moveX = 0
    let moveY = 0
    let mouseDown = false
    let spawned = false

    container.addEventListener("mousedown", () => {
      mouseDown = true
    })

    container.addEventListener("mousemove", event => {
      if (!mouseDown || spawned) return
      moveX += event.movementX
      moveY += event.movementY
      if (moveX * moveX + moveY * moveY > 15) {
        spawned = true
        const draggable = this.makeDraggableTrack(type)
        this.grid?.appendChild(draggable)
        this.clearBoundaries()
        const elementBounds = container.getBoundingClientRect()
        const slot = this.getClosestSlot(elementBounds.left)
        const options = Options.chart.timingEventOrder.left.concat(
          ["PLAYFIELD"],
          Options.chart.timingEventOrder.right
        )
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
        this.startDragging(event, draggable, event.clientX, event.clientY)
        if (Options.general.smoothAnimations) {
          container.style.width = container.clientWidth + "px"
          container.style.transition = "0.4s cubic-bezier(0, 0.91, 0.34, 1.05)"
          setTimeout(() => {
            container.style.width = "0px"
            container.style.opacity = "0"
            container.style.padding = "0"
            container.style.fontSize = "0"
          }, 10)
          setTimeout(() => container.remove(), 400)
        } else {
          container.remove()
        }
      }
    })

    container.addEventListener("mouseup", () => {
      if (!mouseDown || spawned) return
      spawned = true
      Options.chart.timingEventOrder.right.push(type)
      if (Options.general.smoothAnimations) {
        container.style.width = container.clientWidth + "px"
        container.style.transition = "0.4s cubic-bezier(0, 0.91, 0.34, 1.05)"
        setTimeout(() => {
          container.style.width = "0px"
          container.style.opacity = "0"
          container.style.padding = "0"
          container.style.fontSize = "0"
        }, 10)
        setTimeout(() => container.remove(), 400)
      } else {
        container.remove()
      }

      const draggable = this.makeDraggableTrack(type)
      draggable.classList.add("entering")
      draggable.classList.add("right")
      setTimeout(() => draggable.classList.remove("entering"), 400)
      this.grid?.appendChild(draggable)
      this.clearBoundaries()
    })

    return container
  }

  private static startDragging(
    event: MouseEvent,
    element: HTMLDivElement,
    initialX?: number,
    initialY?: number
  ) {
    if (!this.popup) return
    this.draggedElement = element.cloneNode(true) as HTMLDivElement
    // window.addEventListener("mousemove", this.mouseHandler)
    this.draggedElement.style.position = "fixed"
    const elementBounds = element.getBoundingClientRect()
    const popupBounds = this.popup.getBoundingClientRect()
    if (!initialX || !initialY) {
      this.dragOffsetX = event.clientX - elementBounds.left
      this.dragOffsetY = event.clientY - elementBounds.top
      this.draggedElement.style.left =
        elementBounds.left - popupBounds.left + "px"
      this.draggedElement.style.top = elementBounds.top - popupBounds.top + "px"
    } else {
      this.dragOffsetX = elementBounds.width / 2
      this.dragOffsetY = (elementBounds.height / 4) * 3
      this.draggedElement.style.left =
        initialX - elementBounds.width / 2 - popupBounds.left + "px"
      this.draggedElement.style.top =
        initialY - (elementBounds.height / 4) * 3 - popupBounds.top + "px"
      this.draggedElement.classList.add("entering")
    }
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

    const upHandler = () => {
      this.draggedElement?.remove()
      this.draggedElement = undefined
      window.removeEventListener("mousemove", moveHandler)
      element.style.opacity = ""
      this.clearBoundaries()
      window.removeEventListener("mouseup", upHandler)
    }
    window.addEventListener("mouseup", upHandler)
  }

  private static saveOptions(options: string[]) {
    const playfieldIndex = options.indexOf("PLAYFIELD")
    if (playfieldIndex == -1) return
    Options.chart.timingEventOrder.left = options.slice(0, playfieldIndex)
    Options.chart.timingEventOrder.right = options.slice(playfieldIndex + 1)
  }

  private static deleteTrack(type: string) {
    const leftIndex = Options.chart.timingEventOrder.left.indexOf(type)
    if (leftIndex != -1)
      Options.chart.timingEventOrder.left.splice(leftIndex, 1)
    const rightIndex = Options.chart.timingEventOrder.right.indexOf(type)
    if (rightIndex != -1)
      Options.chart.timingEventOrder.right.splice(rightIndex, 1)
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

    setTimeout(() => (this.popup!.style.transitionDuration = ``), 10)
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
    window.removeEventListener("click", this.clickOutside!, true)
    this.popup.classList.add("exiting")
    this.exitTimeout = setTimeout(() => this.popup!.remove(), 200)
    this.active = false
    clearInterval(this.moveInterval)
    this.clearBoundaries()
  }
}
