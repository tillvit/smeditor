import { useEffect, useRef, useState } from "react"
import { clamp, roundDigit } from "../../util/Math"
import { parseString } from "../../util/Util"

export interface SliderInputProps extends SliderInputOptions {
  value: number
  onChange?: (value: number | null) => void
}

export interface SliderInputOptions {
  step?: number
  precision?: number
  min: number
  max: number
  hardMin?: number
  hardMax?: number
  style?: React.CSSProperties
  sliderWidth?: number
  displayWidth?: number
  className?: string
  transformers?: {
    serialize: (value: number) => number
    deserialize: (value: number) => number
  }
}
export function SliderInput(props: SliderInputProps) {
  const precision = props.precision ?? 0
  const min = props.min
  const max = props.max
  const hardMin = props.hardMin ?? props.min
  const hardMax = props.hardMax ?? props.max
  const displayWidth = props.displayWidth ?? 48
  const transformers = props.transformers ?? {
    serialize: v => v,
    deserialize: v => v,
  }
  const [value, setValue] = useState(transformers.serialize(props.value))
  const [displayValue, setDisplayValue] = useState(
    getFormattedValue(transformers.serialize(props.value))
  )
  const cachedValue = useRef("")

  useEffect(() => {
    setDisplayValue(getFormattedValue(transformers.serialize(props.value)))
    setValue(transformers.serialize(props.value))
  }, [props.value])

  function getFormattedValue(val: number) {
    return roundDigit(val, precision).toFixed(precision)
  }

  return (
    <div className="slider">
      <input
        type="range"
        value={value}
        min={min}
        max={max}
        step={props.step}
        onChange={e => {
          setValue(parseFloat(e.target.value))
          setDisplayValue(getFormattedValue(parseFloat(e.target.value)))
          props.onChange?.(transformers.deserialize(parseFloat(e.target.value)))
        }}
        className={`slider-input ${props.className ?? ""}`}
        style={{
          ...props.style,
          width: props.sliderWidth ? props.sliderWidth / 16 + "rem" : undefined,
        }}
      />
      <input
        type="text"
        value={displayValue}
        style={{
          width: displayWidth / 16 + "rem",
        }}
        onFocus={e => {
          cachedValue.current = e.target.value
        }}
        onChange={e => {
          setDisplayValue(e.target.value)
        }}
        onKeyDown={e => {
          if (e.key === "Enter") {
            e.currentTarget.blur()
          }
          if (e.key === "Escape") {
            setDisplayValue(cachedValue.current)
            e.currentTarget.blur()
          }
        }}
        onBlur={() => {
          if (displayValue === "") {
            setDisplayValue(cachedValue.current)
            return
          }
          const val = parseString(displayValue)
          if (val === null) {
            setDisplayValue(cachedValue.current)
            return
          }
          const num = roundDigit(clamp(val, hardMin, hardMax), precision)
          setValue(num)
          setDisplayValue(getFormattedValue(num))
          props.onChange?.(transformers.deserialize(num))
        }}
        className={`spinner-input ${props.className ?? ""}`}
        autoComplete="off"
        spellCheck="false"
      />
    </div>
  )
}

// interface SliderOptions {
//   value?: number
//   width?: number
//   min: number
//   max: number
//   step: number
//   precision?: number
//   transformer?: (value: number) => string | number
//   onChange?: (value: number) => void
//   displayWidth?: number
// }

// export class NumberSlider {
//   view: HTMLDivElement
//   slider: HTMLInputElement
//   text: HTMLDivElement
//   options

//   constructor(view: HTMLDivElement, options: SliderOptions) {
//     this.view = view
//     this.options = options
//     this.view.classList.add("slider")

//     const input = document.createElement("input")
//     input.classList.add("slider-input")
//     input.type = "range"
//     input.min = options.min.toString()
//     input.max = options.max.toString()
//     input.step = options.step.toString()
//     input.value = (options.value ?? (options.min + options.max) / 2).toString()
//     input.oninput = () => {
//       text.innerText = this.formatValue(parseFloat(input.value)) + ""
//       this.options.onChange?.(parseFloat(input.value))
//     }
//     if (options.width !== undefined)
//       input.style.width = options.width / 16 + "rem"
//     this.slider = input
//     view.appendChild(input)

//     const text = document.createElement("div")
//     text.innerText = this.formatValue(parseFloat(input.value)) + ""
//     text.style.width = `${(this.options.displayWidth ?? 32) / 16}rem`
//     this.text = text
//     view.appendChild(text)
//   }

//   get value(): number {
//     return parseFloat(this.slider.value)
//   }

//   setValue(value: number) {
//     this.slider.value = value + ""
//     this.text.innerText = this.formatValue(parseFloat(this.slider.value)) + ""
//   }

//   static create(options: SliderOptions) {
//     return new NumberSlider(document.createElement("div"), options)
//   }

//   private formatValue(value: number) {
//     if (this.options.transformer) {
//       return this.options.transformer(value)
//     }
//     if (this.options.precision === undefined)
//       return roundDigit(value, 3).toString()
//     return roundDigit(value, this.options.precision).toFixed(
//       this.options.precision
//     )
//   }
// }
