import { CSSProperties, useEffect, useRef, useState } from "react"
import { TIMING_EVENT_COLORS } from "../../chart/component/timing/TimingAreaContainer"
import { TIMING_EVENT_NAMES } from "../../chart/sm/TimingTypes"
import { blendColors } from "../../util/Color"
import { EventHandler } from "../../util/EventHandler"
import { DefaultOptions, Options } from "../../util/Options"
import { ReactIcon } from "../Icons"
import { PopupData } from "./PopupManager"

function DraggableTrack(props: {
  type: string
  location?: string
  style?: CSSProperties
  disableDelete?: boolean
}) {
  const dragOffsetX = useRef(0)
  const dragOffsetY = useRef(0)
  const boundaryCache = useRef<[Element, DOMRect][]>([])
  const [dragging, setDragging] = useState(false)

  const elementRef = useRef<HTMLDivElement | null>(null)

  function startDragging(
    event: React.MouseEvent<HTMLDivElement>,
    initialX?: number,
    initialY?: number
  ) {
    const element = event.currentTarget
    if ((event.nativeEvent.target as HTMLElement).closest(".icon")) return
    const copy = element.cloneNode(true) as HTMLDivElement
    const popup = element.closest(".popup") as HTMLDivElement
    console.log(copy, popup)
    if (!popup) return
    copy.style.position = "fixed"
    const elementBounds = element.getBoundingClientRect()
    const popupBounds = popup.getBoundingClientRect()
    if (!initialX || !initialY) {
      console.log(elementBounds.left, popupBounds.left)
      dragOffsetX.current = event.clientX - elementBounds.left
      dragOffsetY.current = event.clientY - elementBounds.top
      copy.style.left = elementBounds.left - popupBounds.left + "px"
      copy.style.top = elementBounds.top - popupBounds.top + "px"
    } else {
      dragOffsetX.current = elementBounds.width / 2
      dragOffsetY.current = (elementBounds.height / 4) * 3
      copy.style.left =
        initialX - elementBounds.width / 2 - popupBounds.left + "px"
      copy.style.top =
        initialY - (elementBounds.height / 4) * 3 - popupBounds.top + "px"
      copy.classList.add("entering")
    }
    copy.style.boxShadow = "6px 6px 6px #222"
    copy.style.transition = "none"
    copy.style.cursor = "grabbing"
    // element.style.opacity = "0.03"
    setDragging(true)
    popup.appendChild(copy)

    const options = Options.chart.timingEventOrder.left.concat(
      ["PLAYFIELD"],
      Options.chart.timingEventOrder.right
    )

    let lastSlot = options.indexOf(props.type)
    const originalSlot = options.indexOf(props.type)

    const moveHandler = (ev: MouseEvent) => {
      copy.style.left =
        ev.clientX - dragOffsetX.current - popupBounds.left + "px"
      copy.style.top = ev.clientY - dragOffsetY.current - popupBounds.top + "px"
      let slot = getClosestSlot(ev.clientX - dragOffsetX.current)
      if (
        Math.abs(
          ev.clientY -
            dragOffsetY.current -
            popupBounds.top -
            (elementBounds.top - popupBounds.top)
        ) > 140
      ) {
        slot = originalSlot
      }
      if (lastSlot != slot) {
        options.splice(lastSlot, 1)
        options.splice(slot, 0, props.type)
        const playfieldIndex = options.indexOf("PLAYFIELD")
        if (playfieldIndex == -1) return
        Options.chart.timingEventOrder.left = options.slice(0, playfieldIndex)
        Options.chart.timingEventOrder.right = options.slice(playfieldIndex + 1)
        if (props.type != "PLAYFIELD") {
          copy.classList.remove("left", "right")
          if (Options.chart.timingEventOrder.left.includes(props.type)) {
            copy.classList.add("left")
          }
          if (Options.chart.timingEventOrder.right.includes(props.type)) {
            copy.classList.add("right")
          }
        }
        lastSlot = slot
      }
    }
    window.addEventListener("mousemove", moveHandler)

    const upHandler = () => {
      copy.remove()
      window.removeEventListener("mousemove", moveHandler)
      setDragging(false)
      boundaryCache.current = []
      window.removeEventListener("mouseup", upHandler)
    }
    window.addEventListener("mouseup", upHandler)
  }

  function getClosestSlot(x: number) {
    if (boundaryCache.current.length == 0) getBoundaries()
    let bestPosition = -1
    let bestDist = 999999
    let lastDist = 999999
    for (let i = 0; i < boundaryCache.current.length; i++) {
      const dist = Math.abs(x - boundaryCache.current[i][1].left)
      if (dist < bestDist) {
        bestDist = dist
        bestPosition = i
      }
      if (dist > lastDist) break
      lastDist = dist
    }
    return bestPosition
  }

  function getBoundaries() {
    const grid = elementRef.current?.closest(".track-grid") as HTMLDivElement
    if (!grid) return
    for (const node of grid.children) {
      boundaryCache.current.push([node, node.getBoundingClientRect()])
    }
    boundaryCache.current.sort((a, b) => a[1].left - b[1].left)
  }

  function removeTrack() {
    const leftIndex = Options.chart.timingEventOrder.left.indexOf(props.type)
    if (leftIndex != -1)
      Options.chart.timingEventOrder.left.splice(leftIndex, 1)
    const rightIndex = Options.chart.timingEventOrder.right.indexOf(props.type)
    if (rightIndex != -1)
      Options.chart.timingEventOrder.right.splice(rightIndex, 1)

    // splice doesn't trigger option listeners
    Options.chart.timingEventOrder.left = [
      ...Options.chart.timingEventOrder.left,
    ]
    Options.chart.timingEventOrder.right = [
      ...Options.chart.timingEventOrder.right,
    ]
  }

  return (
    <div
      className={
        "draggable-track " +
        (props.location ?? "") +
        (props.type == "PLAYFIELD" ? "" : " entering")
      }
      style={{
        backgroundColor: blendColors(
          TIMING_EVENT_COLORS[props.type]?.toString(16).padStart(6, "0") ??
            "#2D2D2D",
          "#333333",
          0.7
        ),
        opacity: dragging ? 0.03 : 1,
        ...props.style,
      }}
      ref={elementRef}
      onMouseDown={e => {
        startDragging(e)
      }}
    >
      <div className="draggable-track-text">{props.type}</div>
      {!props.disableDelete && (
        <ReactIcon id="TRASH" width={16} height={16} onClick={removeTrack} />
      )}
    </div>
  )
}

function LeftoverTrack(props: { type: string }) {
  return (
    <div
      className="leftover-track entering"
      style={{
        backgroundColor: blendColors(
          TIMING_EVENT_COLORS[props.type].toString(16).padStart(6, "0"),
          "#333333",
          0.7
        ),
      }}
      onClick={() => {
        Options.chart.timingEventOrder.right =
          Options.chart.timingEventOrder.right.concat(props.type)
      }}
    >
      <ReactIcon id="PLUS" width={8} height={8} />
      <div className="leftover-track-text">{props.type}</div>
    </div>
  )
}

function TimingTrackOrderPopupContent() {
  const [leftOrder, setLeftOrder] = useState<string[]>(
    Options.chart.timingEventOrder.left
  )
  const [rightOrder, setRightOrder] = useState<string[]>(
    Options.chart.timingEventOrder.right
  )

  useEffect(() => {
    function onOptionChanged() {
      setLeftOrder(Options.chart.timingEventOrder.left)
      setRightOrder(Options.chart.timingEventOrder.right)
    }
    EventHandler.on("userOptionUpdated", onOptionChanged)
    return () => {
      EventHandler.off("userOptionUpdated", onOptionChanged)
    }
  }, [])

  function reset() {
    Options.chart.timingEventOrder.left = structuredClone(
      DefaultOptions.chart.timingEventOrder.left
    )
    Options.chart.timingEventOrder.right = structuredClone(
      DefaultOptions.chart.timingEventOrder.right
    )
  }

  const order = leftOrder
    .map(type => [type, "left"])
    .concat([["PLAYFIELD", ""]])
    .concat(rightOrder.map(type => [type, "right"]))

  const leftoverOptions = TIMING_EVENT_NAMES.filter(
    type => !leftOrder.includes(type) && !rightOrder.includes(type)
  )

  return (
    <div
      className="flex-column-full"
      style={{ padding: "0.5rem", color: "white" }}
    >
      <div className="popup-title">Reorder Timing Tracks</div>
      <div className="track-grid">
        {order.map(([type, location]) => {
          if (type === "PLAYFIELD") {
            return (
              <DraggableTrack
                key={"PLAYFIELD"}
                type={"PLAYFIELD"}
                disableDelete={true}
                style={{
                  backgroundColor: "#2D2D2D",
                  padding: "1.25rem 0.625rem",
                  writingMode: "horizontal-tb",
                }}
              />
            )
          }

          return <DraggableTrack key={type} type={type} location={location} />
        })}
      </div>
      <div className="track-grid-options">
        <div className="track-selector">
          {leftoverOptions.map(type => (
            <LeftoverTrack key={type} type={type} />
          ))}
        </div>
        <button className="delete" onClick={reset}>
          Reset
        </button>
      </div>
    </div>
  )
}

export function TimingTrackOrderPopup(attach: HTMLElement): PopupData {
  return {
    id: "timing-track-order-popup",
    attach: attach,
    offset: { x: 0, y: -15 },
    pivot: { x: 0.5, y: 1 },
    content: <TimingTrackOrderPopupContent />,
  }
}
