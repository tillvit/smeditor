import { ReactNode, useEffect, useRef, useState } from "react"
import { EventHandler } from "../../../util/EventHandler"

interface CheckboxOptions {
  onChange: (value: boolean) => void
  getValue: () => boolean
  onEl: ReactNode
  offEl: ReactNode
  addTooltip?: (ref: HTMLElement) => void
}

export function PlaybackOptionsCheckbox(props: CheckboxOptions) {
  const [toggled, setToggled] = useState(props.getValue())
  const containerRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const optionUpdate = () => {
      setToggled(props.getValue())
    }
    EventHandler.on("userOptionUpdated", optionUpdate)
    return () => EventHandler.off("userOptionUpdated", optionUpdate)
  }, [])

  useEffect(() => {
    if (props.addTooltip && containerRef.current) {
      props.addTooltip(containerRef.current)
    }
  }, [containerRef, props.addTooltip])

  return (
    <div
      className="ico-checkbox"
      ref={containerRef}
      onClick={() => {
        setToggled(!toggled)
        props.onChange(!toggled)
      }}
    >
      {toggled ? props.onEl : props.offEl}
    </div>
  )
}
