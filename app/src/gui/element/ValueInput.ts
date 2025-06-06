import { Color } from "pixi.js"
import { App } from "../../App"
import { clamp, roundDigit } from "../../util/Math"
import { parseString } from "../../util/Util"
import { ColorPicker } from "./ColorPicker"
import { DoubleEndedSlider } from "./DoubleEndedSlider"
import { Dropdown } from "./Dropdown"
import { NumberSlider } from "./NumberSlider"
import { NumberSpinner } from "./NumberSpinner"

interface TextInput {
  type: "text"
  transformers?: {
    serialize: (value: string) => string
    deserialize: (value: string) => string
  }
  onChange?: (app: App, value: string) => void
}

type DropdownInput<T> =
  | {
      type: "dropdown"
      items: readonly string[]
      advanced: false
      onChange?: (app: App, value: string | number) => void
    }
  | {
      type: "dropdown"
      items: readonly number[]
      advanced: false
      onChange?: (app: App, value: string | number) => void
    }
  | {
      type: "dropdown"
      items: T[]
      advanced: true
      transformers: {
        serialize: (value: string | number | boolean) => T
        deserialize: (value: T) => string | number | boolean
      }
      onChange?: (app: App, value: string | number | boolean) => void
    }

interface NumberInput {
  type: "number"
  step: number
  precision?: number
  minPrecision?: number
  min?: number
  max?: number
  transformers?: {
    serialize: (value: number) => number
    deserialize: (value: number) => number
  }
  onChange?: (app: App, value: number) => void
}

interface DoubleSliderInput {
  type: "double-slider"
  minValue?: number
  maxValue?: number
  width?: number
  min: number
  max: number
  step: number
  precision?: number
  transformers: {
    serialize: (value: number) => number
    deserialize: (value: number) => number
    display: (value: number) => string | number
  }
  onChange?: (app: App, min: number, max: number) => void
  displayWidth?: number
}

interface SliderInput {
  type: "slider"
  step?: number
  min?: number
  max?: number
  hardMax?: number
  hardMin?: number
  transformers?: {
    serialize: (value: number) => number
    deserialize: (value: number) => number
  }
  onChange?: (app: App, value: number) => void
}

interface DisplaySliderInput {
  type: "display-slider"
  step: number
  min: number
  max: number
  transformers: {
    serialize: (value: number) => number
    deserialize: (value: number) => number
    display: (value: number) => string | number
  }
  onChange?: (app: App, value: number) => void
  displayWidth?: number
  width?: number
}

interface CheckboxInput {
  type: "checkbox"
  onChange?: (app: App, value: boolean) => void
}

interface ColorInput {
  type: "color"
  onChange?: (app: App, value: Color) => void
}

export type ValueInput<T> =
  | TextInput
  | DropdownInput<T>
  | NumberInput
  | CheckboxInput
  | SliderInput
  | DisplaySliderInput
  | DoubleSliderInput
  | ColorInput

export function createValueInput<T>(
  app: App,
  input: ValueInput<T>,
  initialValue: any
): HTMLElement {
  switch (input.type) {
    case "checkbox": {
      const checkbox = document.createElement("input")
      const callback = input.onChange
      checkbox.type = "checkbox"
      checkbox.checked = initialValue
      checkbox.onblur = null
      checkbox.onchange = () => {
        callback?.(app, checkbox.checked)
      }
      checkbox.classList.add("pref-input", "right")
      checkbox.onkeydown = ev => {
        if (ev.key == "Enter") checkbox.blur()
      }
      return checkbox
    }
    case "dropdown": {
      if (input.advanced) {
        const deserializer = input.transformers.deserialize
        const serializer = input.transformers.serialize
        const callback = input.onChange
        const dropdown = Dropdown.create(input.items, serializer(initialValue))
        dropdown.onChange(value => {
          callback?.(app, deserializer(value))
        })
        return dropdown.view
      } else {
        const callback = input.onChange
        const dropdown = Dropdown.create(input.items, initialValue)
        dropdown.onChange(value => {
          callback?.(app, value)
        })
        return dropdown.view
      }
    }
    case "number": {
      const deserializer =
        input.transformers?.deserialize ?? ((value: number) => value)
      const serializer =
        input.transformers?.serialize ?? ((value: number) => value)
      const callback = input.onChange
      const spinner = NumberSpinner.create({
        value: serializer(initialValue as number),
        ...input,
        onchange: value => {
          if (!value) {
            spinner.value = serializer(value as number)
            return
          }
          callback?.(app, deserializer(value))
        },
      })
      return spinner.view
    }
    case "slider": {
      const deserializer =
        input.transformers?.deserialize ?? ((value: number) => value)
      const serializer =
        input.transformers?.serialize ?? ((value: number) => value)
      const callback = input.onChange
      const container = document.createElement("div")
      container.style.display = "flex"
      container.style.alignItems = "center"
      const slider = document.createElement("input")
      slider.type = "range"
      slider.min = input.min?.toString() ?? ""
      slider.max = input.max?.toString() ?? ""
      slider.step = input.step?.toString() ?? "1"
      slider.value = serializer(initialValue).toString()
      const numberInput = document.createElement("input")
      numberInput.type = "text"
      numberInput.value = (
        Math.round(serializer(initialValue) * 1000) / 1000
      ).toString()
      const hardMin = input.hardMin ?? input.min ?? -Number.MAX_VALUE
      const hardMax = input.hardMax ?? input.max ?? Number.MAX_VALUE
      numberInput.onblur = () => {
        let value = parseString(numberInput.value)
        if (value === null) {
          numberInput.value = (
            Math.round(serializer(initialValue) * 1000) / 1000
          ).toString()
          return
        }
        value = clamp(value, hardMin, hardMax)
        numberInput.value = roundDigit(value, 3).toString()
        numberInput.blur()
        if (numberInput.value == "") {
          numberInput.value = serializer(value).toString()
        }
        slider.value = value.toString()
        callback?.(app, deserializer(value))
      }
      slider.oninput = () => {
        const value = parseFloat(slider.value)
        numberInput.value = roundDigit(value, 3).toString()
        callback?.(app, deserializer(value))
      }
      numberInput.style.width = "3rem"
      numberInput.onkeydown = ev => {
        if (ev.key == "Enter") numberInput.blur()
      }
      container.appendChild(slider)
      container.appendChild(numberInput)
      return container
    }
    case "display-slider": {
      const deserializer =
        input.transformers?.deserialize ?? ((value: number) => value)
      const serializer =
        input.transformers?.serialize ?? ((value: number) => value)
      const display = input.transformers?.display ?? ((value: number) => value)
      const callback = input.onChange
      const slider = NumberSlider.create({
        ...input,
        value: serializer(initialValue),
        transformer: val => display(val),
        onChange: value => {
          callback?.(app, deserializer(value))
        },
      })
      return slider.view
    }
    case "double-slider": {
      const deserializer =
        input.transformers?.deserialize ?? ((value: number) => value)
      const serializer =
        input.transformers?.serialize ?? ((value: number) => value)
      const display = input.transformers?.display ?? ((value: number) => value)
      const callback = input.onChange
      const slider = DoubleEndedSlider.create({
        ...input,
        minValue: serializer(initialValue[0]),
        maxValue: serializer(initialValue[1]),
        transformer: val => display(val),
        onChange: (min, max) => {
          callback?.(app, deserializer(min), deserializer(max))
        },
      })
      return slider.view
    }
    case "text": {
      const callback = input.onChange
      const textInput = document.createElement("input")
      textInput.type = "text"
      textInput.value = initialValue.toString()
      textInput.onblur = () => {
        callback?.(app, textInput.value)
      }
      textInput.onkeydown = ev => {
        if (ev.key == "Enter") textInput.blur()
      }
      return textInput
    }
    case "color": {
      const callback = input.onChange
      const colorInput = ColorPicker.create({
        value: initialValue,
      })
      // 'change' event is fired when the user closes the color picker
      colorInput.onColorChange = c => {
        callback?.(app, c)
      }
      return colorInput
    }
  }
}
