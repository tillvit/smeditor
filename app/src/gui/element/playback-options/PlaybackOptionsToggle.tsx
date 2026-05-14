import { ReactNode, useEffect, useRef, useState } from "react"
import { EventHandler } from "../../../util/EventHandler"

interface ToggleOptions {
  onChange: (index: number) => void
  getValue: () => number
  values: ReactNode[]
  addTooltip?: (ref: HTMLElement) => void
}

export function PlaybackOptionsToggle(props: ToggleOptions) {
  const [currentValue, setCurrentValue] = useState(props.getValue())
  const containerRef = useRef<HTMLDivElement>(null)
  const highlightRef = useRef<HTMLDivElement>(null)
  const valueRefs = useRef<(HTMLDivElement | null)[]>([])

  useEffect(() => {
    const optionUpdate = () => {
      setCurrentValue(props.getValue())
    }
    EventHandler.on("userOptionUpdated", optionUpdate)
    return () => EventHandler.off("userOptionUpdated", optionUpdate)
  }, [])

  function updateHighlight() {
    if (
      containerRef.current &&
      highlightRef.current &&
      valueRefs.current[currentValue]
    ) {
      const selected = valueRefs.current[currentValue]
      const first = valueRefs.current[0]!
      const left =
        selected.getBoundingClientRect().left -
        first.getBoundingClientRect().left
      highlightRef.current.style.left = `${left}px`
      highlightRef.current.style.width = `${selected.getBoundingClientRect().width}px`
      highlightRef.current.style.height = `${selected.getBoundingClientRect().height}px`
    }
  }

  useEffect(() => {
    if (props.addTooltip && containerRef.current) {
      props.addTooltip(containerRef.current)
    }
  }, [containerRef, props.addTooltip])

  useEffect(() => {
    // Move highlight to selected item
    updateHighlight()
  }, [currentValue, highlightRef, valueRefs, containerRef])

  useEffect(() => {
    window.addEventListener("resize", updateHighlight)
    return () => {
      window.removeEventListener("resize", updateHighlight)
    }
  })

  const handleClick = (idx: number) => {
    if (currentValue === idx) return
    setCurrentValue(idx)
    props.onChange(idx)
  }

  return (
    <div className="po-toggle" ref={containerRef}>
      {props.values.map((el, idx) => (
        <div
          key={idx}
          onClick={() => handleClick(idx)}
          ref={el => void (valueRefs.current[idx] = el)}
          className={currentValue === idx ? "active" : ""}
        >
          {el}
        </div>
      ))}
      <div className="po-toggle-highlight" ref={highlightRef} />
    </div>
  )
}
