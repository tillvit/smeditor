import {
  useCallback,
  useContext,
  useEffect,
  useLayoutEffect,
  useRef,
  useState,
} from "react"
import { clamp } from "../../util/Math"
import { Options } from "../../util/Options"
import { ReactIcon } from "../Icons"
import { WindowContext } from "./WindowManager"

export interface WindowOptions {
  title: string
  width: number
  height?: number
  win_id?: string
  disableClose?: boolean
  blocking?: boolean
}

export function Window(props: { focused: boolean }) {
  const [windowPosition, setWindowPosition] = useState<{
    x: number
    y: number
  }>({ x: -3000, y: -3000 })
  const windowData = useContext(WindowContext)
  const [dragging, setDragging] = useState(false)
  const [minimized, setMinimized] = useState(false)
  const windowElement = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!windowElement.current) return
    if (windowData?.blocking) {
      window.addEventListener("resize", center)
      return () => window.removeEventListener("resize", center)
    }
  }, [windowElement])

  useLayoutEffect(() => {
    if (!windowElement.current) return
    const resizeObserver = new ResizeObserver(() => {
      center()
      if (!windowData?.blocking) resizeObserver.disconnect()
    })
    resizeObserver.observe(windowElement.current)
    return () => resizeObserver.disconnect()
  }, [windowElement])

  function clampPosition(position: { x: number; y: number }) {
    const bounds = windowData!.app.view.getBoundingClientRect()
    return {
      x: clamp(
        position.x,
        bounds.left,
        bounds.width - windowElement.current!.clientWidth + bounds.left
      ),
      y: clamp(
        position.y,
        bounds.top,
        bounds.height - windowElement.current!.clientHeight + bounds.top
      ),
    }
  }

  const handleDrag = useCallback((event: MouseEvent) => {
    if (!windowElement.current || windowData?.blocking) return
    setWindowPosition(pos =>
      clampPosition({ x: pos.x + event.movementX, y: pos.y + event.movementY })
    )
  }, [])

  const startDrag = useCallback(() => {
    if (!windowElement.current || windowData?.blocking) return
    setDragging(true)
    window.addEventListener("mousemove", handleDrag)
    window.addEventListener("mouseup", () => {
      setDragging(false)
      window.removeEventListener("mousemove", handleDrag)
    })
  }, [])

  function center() {
    const bounds = windowElement.current!.getBoundingClientRect()
    const x =
      window.innerWidth / 2 - (bounds.width / 2) * Options.general.uiScale
    const y =
      window.innerHeight / 2 - (bounds.height / 2) * Options.general.uiScale
    // fast update no flicker !
    windowElement.current!.style.left = x + "px"
    windowElement.current!.style.top = y + "px"
    setWindowPosition(clampPosition({ x, y }))
  }

  return (
    <WindowContext.Provider
      value={{
        ...windowData!,
        center,
      }}
    >
      <div
        className={
          "window" +
          (props.focused ? " focused" : "") +
          (minimized ? " minimized" : "")
        }
        style={{
          width: windowData!.width / 16 + "rem",
          left: windowPosition.x + "px",
          top: windowPosition.y + "px",
          zIndex: windowData!.blocking ? 10000 : 1,
        }}
        ref={windowElement}
        onMouseDown={() => windowData!.focus()}
      >
        <div
          className="navbar"
          onMouseDown={startDrag}
          style={{
            cursor: windowData?.blocking
              ? "auto"
              : dragging
                ? "grabbing"
                : "grab",
          }}
        >
          <div className="title unselectable">{windowData!.title}</div>
          {windowData?.disableClose || (
            <>
              <ReactIcon
                id="MINIMIZE"
                width={15}
                height={15}
                onClick={() => {
                  setMinimized(!minimized)
                }}
              />
              <ReactIcon
                id="CLOSE_WINDOW"
                width={15}
                height={15}
                onClick={windowData?.close}
              />
            </>
          )}
        </div>
        <div
          className={"window-view " + (minimized ? "minimized" : "")}
          style={{
            width: "100%",
            height: windowData!.height
              ? windowData!.height / 16 + "rem"
              : undefined,
            ...windowData!.viewStyle,
          }}
        >
          {windowData!.content}
        </div>
      </div>
    </WindowContext.Provider>
  )
}
