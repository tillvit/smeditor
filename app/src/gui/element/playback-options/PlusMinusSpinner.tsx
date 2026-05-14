import { useEffect, useRef, useState } from "react"
import { EventHandler } from "../../../util/EventHandler"
import { Options } from "../../../util/Options"
import { parseString } from "../../../util/Util"

interface SpinnerOptions {
  getValue: () => number
  step?: number
  altStep?: number
  min?: number
  max?: number
  hardMin?: number
  hardMax?: number
  onChange: (value: number) => void
  addTooltip?: (ref: HTMLElement) => void
}

export function PlusMinusSpinner(props: SpinnerOptions) {
  const [value, setValue] = useState(props.getValue().toFixed())
  const [lastValue, setLastValue] = useState(props.getValue())
  const inputRef = useRef<HTMLInputElement>(null)
  const containerRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const optionUpdate = () => {
      setValue(props.getValue().toFixed())
      setLastValue(props.getValue())
    }
    EventHandler.on("userOptionUpdated", optionUpdate)
    return () => EventHandler.off("userOptionUpdated", optionUpdate)
  }, [])

  useEffect(() => {
    if (props.addTooltip && containerRef.current) {
      props.addTooltip(containerRef.current)
    }
  }, [containerRef, props.addTooltip])

  const getStep = (shift: boolean) => {
    let step = Options.general.spinnerStep
    if (shift) {
      step =
        props.altStep ??
        (props.step !== undefined
          ? props.step / 10
          : Options.general.spinnerStep)
    } else {
      step = props.step ?? Options.general.spinnerStep
    }
    return step
  }

  function clampNumber(val: number) {
    if (props.min !== undefined && val < props.min) {
      val = props.min
    }
    if (props.max !== undefined && val > props.max) {
      val = props.max
    }
    return val
  }

  function setNumberValue(val: number) {
    val = clampNumber(val)
    setValue(val.toFixed())
    setLastValue(val)
    props.onChange(val)
  }

  function checkValue() {
    const val = parseString(value)
    if (val == null || !isFinite(val)) {
      setValue(lastValue.toString())
      return
    }
    setNumberValue(val)
  }

  function handleWheel(ev: React.WheelEvent) {
    const newValue =
      lastValue +
      ((getStep(ev.getModifierState("Shift")) * ev.deltaY) / 100) *
        (Options.chart.scroll.invertZoomScroll ? -1 : 1) *
        Options.chart.scroll.scrollSensitivity
    setNumberValue(newValue)
  }

  function handleButton(ev: React.MouseEvent, direction: number) {
    const newValue =
      lastValue + direction * getStep(ev.getModifierState("Shift"))
    setNumberValue(newValue)
  }

  return (
    <div className="pm-spinner" ref={containerRef}>
      <button className="pm-spinner-btn" onClick={ev => handleButton(ev, -1)}>
        -
      </button>
      <input
        className="pm-spinner-input"
        type="text"
        ref={inputRef}
        value={value}
        onKeyDown={e => {
          const el = inputRef.current!
          if (e.key == "Enter") el.blur()
          if (e.key == "Escape") {
            setValue(value)
          }
        }}
        onWheel={handleWheel}
        onChange={el => setValue(el.target.value)}
        onBlur={() => checkValue()}
      />
      <button className="pm-spinner-btn" onClick={ev => handleButton(ev, 1)}>
        +
      </button>
    </div>
  )
}
