import { MouseEvent, useEffect, useRef, useState } from "react"
import { clamp, roundDigit } from "../../util/Math"
import { Options } from "../../util/Options"
import { parseString } from "../../util/Util"
import { ReactIcon } from "../Icons"

export interface NumberInputProps extends NumberInputOptions {
  value: number
  onChange?: (value: number | null) => void
}

export interface NumberInputOptions {
  allowNull?: boolean
  step?: number
  precision?: number
  minPrecision?: number | null
  min?: number
  max?: number
  style?: React.CSSProperties
  className?: string
  disabled?: boolean
  transformers?: {
    serialize: (value: number) => number
    deserialize: (value: number) => number
  }
}
export function NumberInput(props: NumberInputProps) {
  const inputRef = useRef<HTMLInputElement>(null)
  const allowNull = props.allowNull ?? false
  const step = props.step ?? null
  const precision = props.precision ?? 3
  const minPrecision = props.minPrecision ?? null
  const min = props.min ?? -Number.MAX_VALUE
  const max = props.max ?? Number.MAX_VALUE
  const transformers = props.transformers ?? {
    serialize: v => v,
    deserialize: v => v,
  }

  const cachedValue = useRef("")
  const [value, setValue] = useState(
    getFormattedValue(transformers.serialize(props.value))
  )
  const editing = useRef(false)
  const numberValue = useRef(transformers.serialize(props.value))

  useEffect(() => {
    numberValue.current = transformers.serialize(props.value)
    if (editing.current) return
    setValue(getFormattedValue(transformers.serialize(props.value)))
  }, [props.value])

  function getFormattedValue(val: number) {
    const decimalLength = val.toString().split(".")[1]?.length ?? 0
    if (minPrecision !== null && minPrecision >= decimalLength) {
      return roundDigit(val, minPrecision).toFixed(minPrecision)
    }
    if (minPrecision !== null && precision >= decimalLength) {
      return val.toString()
    }
    return roundDigit(val, precision).toFixed(precision)
  }

  const upClicked = (e: MouseEvent) => {
    let changeStep = step ?? Options.general.spinnerStep
    if (e.getModifierState("Shift")) {
      changeStep /= 10
    }
    const newValue = Math.min(numberValue.current + changeStep, max)
    numberValue.current = newValue
    setValue(getFormattedValue(newValue))
    props.onChange?.(transformers.deserialize(newValue))
  }

  const downClicked = (e: MouseEvent) => {
    let changeStep = step ?? Options.general.spinnerStep
    if (e.getModifierState("Shift")) {
      changeStep /= 10
    }
    const newValue = Math.max(numberValue.current - changeStep, min)
    numberValue.current = newValue
    setValue(getFormattedValue(newValue))
    props.onChange?.(transformers.deserialize(newValue))
  }

  return (
    <div className="spinner">
      <input
        ref={inputRef}
        type="text"
        value={value}
        disabled={props.disabled}
        onFocus={e => {
          cachedValue.current = e.target.value
          editing.current = true
        }}
        onChange={e => {
          setValue(e.target.value)
        }}
        onKeyDown={e => {
          if (e.key === "Enter") {
            e.currentTarget.blur()
          }
          if (e.key === "Escape") {
            setValue(cachedValue.current)
            e.currentTarget.blur()
          }
        }}
        onBlur={() => {
          editing.current = false
          if (value === "" && allowNull) {
            setValue(cachedValue.current)
            props.onChange?.(null)
            return
          }
          const val = parseString(value)
          if (val === null) {
            setValue(cachedValue.current)
            return
          }
          const num = roundDigit(clamp(val, min, max), precision)
          numberValue.current = num
          setValue(getFormattedValue(num))
          props.onChange?.(transformers.deserialize(num))
        }}
        className={`spinner-input ${props.className ?? ""}`}
        style={props.style}
        autoComplete="off"
        spellCheck="false"
      />
      <div className="spinner-btns">
        <button className="spinner-up" tabIndex={-1} onClick={upClicked}>
          <ReactIcon id="CHEVRON" width={10} />
        </button>
        <button className="spinner-down" tabIndex={-1} onClick={downClicked}>
          <ReactIcon id="CHEVRON" width={10} />
        </button>
      </div>
    </div>
  )
}
