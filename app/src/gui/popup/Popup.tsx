import { Color, Point, Rectangle } from "pixi.js"
import { useContext, useEffect, useRef } from "react"
import { blendPixiColors } from "../../util/Color"
import { clamp } from "../../util/Math"
import { Themes } from "../../util/Theme"
import { PopupContext } from "./PopupManager"

interface ObjectBounds {
  top: number
  bottom: number
  left: number
  right: number
  width: number
  height: number
}

function cloneRect(rect: Rectangle) {
  return {
    top: rect.top,
    bottom: rect.bottom,
    left: rect.left,
    right: rect.right,
    width: rect.width,
    height: rect.height,
  }
}

function createRect(point: Point) {
  return {
    top: point.y,
    bottom: point.y,
    left: point.x,
    right: point.x,
    width: 0,
    height: 0,
  }
}

const MOVE_INTERVAL = 150

export function Popup() {
  const popupData = useContext(PopupContext)!
  const popupRef = useRef<HTMLDivElement>(null)
  const popupZoomerRef = useRef<HTMLDivElement>(null)

  const pivot = popupData.pivot ?? { x: 0.5, y: 0.5 }

  function positionPopup() {
    const bounds: ObjectBounds =
      popupData.attach instanceof Point
        ? createRect(popupData.attach)
        : popupData.attach instanceof HTMLElement
          ? popupData.attach.getBoundingClientRect()
          : cloneRect(popupData.attach.getBounds())
    if (
      !(popupData.attach instanceof HTMLElement) &&
      !(popupData.attach instanceof Point)
    ) {
      // Shift the top if it is a pixi object
      bounds.top += document.getElementById("pixi")!.offsetTop + 9
    }
    const popup = popupRef.current!
    const centerX = bounds.left + bounds.width / 2 + (popupData.offset?.x ?? 0)
    const width = popup.clientWidth
    const leftRestriction = pivot.x * width
    const rightRestriction = window.innerWidth - (1 - pivot.x) * width
    popup.style.left = `${clamp(centerX, leftRestriction, rightRestriction)}px`

    const topRestriction = pivot.y * popup.clientHeight
    const bottomRestriction =
      window.innerHeight - (1 - pivot.y) * popup.clientHeight
    const centerY = bounds.top + bounds.height / 2 + (popupData.offset?.y ?? 0)
    popup.style.top = `${clamp(centerY, topRestriction, bottomRestriction)}px`
    requestAnimationFrame(() => (popup.style.transitionDuration = ""))
  }

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (
        popupRef.current &&
        !popupRef.current.contains(event.target as Node | null)
      ) {
        popupData.close()
      }
    }
    document.addEventListener("mousedown", handleClickOutside, true)
    const interval = setInterval(() => {
      positionPopup()
    }, MOVE_INTERVAL)
    positionPopup()
    return () => {
      document.removeEventListener("mousedown", handleClickOutside, true)
      clearInterval(interval)
    }
  })

  const background = popupData.background
    ? new Color(popupData.background)
    : Themes.getColor("window-bg")

  return (
    <div
      ref={popupRef}
      className={
        `popup ${popupData.className ?? ""}` +
        (popupData.closed ? " exiting" : "")
      }
      style={{
        ...popupData.style,
        transform: `translate(${-pivot.x * 100}%, ${-pivot.y * 100}%)`,
      }}
    >
      <div
        className={`popup-zoomer ${popupData.highlighted ? "selected" : ""}`}
        style={{
          width: popupData.width ? `${popupData.width / 16}rem` : undefined,
          transformOrigin: `${pivot.x * 100}% ${pivot.y * 100}%`,
          background: popupData.highlighted
            ? blendPixiColors(background, new Color("white"), 0.05).toHex()
            : background.toHex(),
        }}
        ref={popupZoomerRef}
      >
        {popupData.content}
      </div>
    </div>
  )
}
