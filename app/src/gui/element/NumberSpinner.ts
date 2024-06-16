import { clamp, roundDigit } from "../../util/Math"
import { Options } from "../../util/Options"
import { parseString } from "../../util/Util"

export class NumberSpinner {
  view: HTMLDivElement
  input: HTMLInputElement
  onChange?: (value: number | undefined) => void
  min = -Number.MAX_VALUE
  max = Number.MAX_VALUE
  precision?: number
  step? = 1
  lastVal = ""

  constructor(
    view: HTMLDivElement,
    value: number,
    step?: number,
    precision?: number,
    min?: number,
    max?: number
  ) {
    this.view = view
    this.view.classList.add("spinner")

    this.view.onfocus = () => {
      input.focus()
    }

    const input = document.createElement("input")
    input.classList.add("spinner-input")
    input.type = "text"
    input.autocomplete = "off"
    input.spellcheck = false
    input.onblur = () => {
      if (input.value === this.lastVal) return
      if (input.value === "") {
        this.onChange?.(undefined)
        return
      }
      const val = parseString(input.value)
      if (val === null) {
        input.value = this.lastVal
        return
      }
      let value = roundDigit(val, this.precision ?? 3)
      value = clamp(value, this.min, this.max)
      input.value = this.formatValue(value)
      this.onChange?.(value)
    }
    input.onkeydown = ev => {
      if (ev.key == "Enter") input.blur()
      if (ev.key == "Escape") {
        input.value = this.lastVal
        input.blur()
      }
    }
    input.onfocus = () => {
      this.lastVal = input.value
    }
    this.input = input
    this.min = min ?? this.min
    this.max = max ?? this.max
    this.step = step
    this.precision = precision
    this.setValue(value)
    view.appendChild(input)

    const spinner = document.createElement("div")
    spinner.classList.add("spinner-btns")
    view.appendChild(spinner)

    const upButton = document.createElement("button")
    upButton.classList.add("spinner-up")
    upButton.tabIndex = -1
    upButton.onclick = e => {
      let changeStep = step ?? Options.general.spinnerStep
      if (e.getModifierState("Shift")) {
        changeStep /= 10
      }
      if (max !== undefined && parseFloat(input.value) + changeStep > max)
        return
      input.value = this.formatValue(parseFloat(input.value) + changeStep)
      this.onChange?.(parseFloat(input.value))
    }
    spinner.appendChild(upButton)

    const downButton = document.createElement("button")
    downButton.classList.add("spinner-down")
    downButton.tabIndex = -1
    downButton.onclick = e => {
      let changeStep = step ?? Options.general.spinnerStep
      if (e.getModifierState("Shift")) {
        changeStep /= 10
      }
      if (min !== undefined && parseFloat(input.value) - changeStep < min)
        return
      input.value = this.formatValue(parseFloat(input.value) - changeStep)
      this.onChange?.(parseFloat(input.value))
    }
    spinner.appendChild(downButton)
  }

  get value(): number {
    return parseFloat(this.input.value)
  }

  static create(
    value: number,
    step?: number,
    precision?: number,
    min?: number,
    max?: number
  ) {
    return new NumberSpinner(
      document.createElement("div"),
      value,
      step,
      precision,
      min,
      max
    )
  }

  setValue(value: number) {
    if (parseFloat(this.input.value) != roundDigit(value, this.precision ?? 3))
      this.input.value = this.formatValue(value)
  }

  private formatValue(value: number) {
    if (this.precision === undefined) return roundDigit(value, 3).toString()
    return roundDigit(value, this.precision).toFixed(this.precision)
  }
}
