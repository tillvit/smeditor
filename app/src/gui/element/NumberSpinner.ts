import { clamp, roundDigit } from "../../util/Math"
import { Options } from "../../util/Options"
import { parseString } from "../../util/Util"
import { Icons } from "../Icons"

interface NumberSpinnerOptions {
  value: number
  step: number | null
  precision: number
  minPrecision: number | null
  min: number
  max: number
  onchange?: (value: number | undefined) => void
}

export class NumberSpinner {
  readonly view: HTMLDivElement
  readonly input: HTMLInputElement
  private options: NumberSpinnerOptions
  private lastVal = ""

  constructor(view: HTMLDivElement, options: Partial<NumberSpinnerOptions>) {
    this.view = view
    this.view.classList.add("spinner")
    this.options = {
      value: 0,
      precision: 3,
      step: null,
      minPrecision: null,
      min: -Number.MAX_VALUE,
      max: Number.MAX_VALUE,
      ...options,
    }

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
        this.options.onchange?.(undefined)
        return
      }
      const val = parseString(input.value)
      if (val === null) {
        input.value = this.lastVal
        return
      }
      const value = roundDigit(
        clamp(val, this.options.min, this.options.max),
        this.options.precision
      )
      input.value = this.formatValue(value)
      this.options.onchange?.(value)
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
    this.value = this.options.value
    view.appendChild(input)

    const spinner = document.createElement("div")
    spinner.classList.add("spinner-btns")
    view.appendChild(spinner)

    const upButton = document.createElement("button")
    upButton.classList.add("spinner-up")
    upButton.appendChild(Icons.getIcon("CHEVRON", 10))
    upButton.tabIndex = -1
    upButton.onclick = e => {
      let changeStep = this.options.step ?? Options.general.spinnerStep
      if (e.getModifierState("Shift")) {
        changeStep /= 10
      }
      if (parseFloat(input.value) + changeStep > this.options.max) {
        input.value = this.formatValue(this.options.max)
        this.options.onchange?.(this.options.max)
        return
      }
      input.value = this.formatValue(parseFloat(input.value) + changeStep)
      this.options.onchange?.(parseFloat(input.value))
    }
    spinner.appendChild(upButton)

    const downButton = document.createElement("button")
    downButton.classList.add("spinner-down")
    downButton.appendChild(Icons.getIcon("CHEVRON", 10))
    downButton.tabIndex = -1
    downButton.onclick = e => {
      let changeStep = this.options.step ?? Options.general.spinnerStep
      if (e.getModifierState("Shift")) {
        changeStep /= 10
      }
      if (parseFloat(input.value) - changeStep < this.options.min) {
        input.value = this.formatValue(this.options.min)
        this.options.onchange?.(this.options.min)
        return
      }
      input.value = this.formatValue(parseFloat(input.value) - changeStep)
      this.options.onchange?.(parseFloat(input.value))
    }
    spinner.appendChild(downButton)
  }

  static create(options: Partial<NumberSpinnerOptions>) {
    return new NumberSpinner(document.createElement("div"), options)
  }

  private formatValue(value: number) {
    const decimalLength = value.toString().split(".")[1]?.length ?? 0
    if (
      this.options.minPrecision !== null &&
      this.options.minPrecision >= decimalLength
    ) {
      return roundDigit(value, this.options.minPrecision).toFixed(
        this.options.minPrecision
      )
    }
    if (
      this.options.minPrecision !== null &&
      this.options.precision >= decimalLength
    ) {
      return value.toString()
    }
    return roundDigit(value, this.options.precision).toFixed(
      this.options.precision
    )
  }

  get value(): number {
    return parseFloat(this.input.value)
  }

  set value(value: number) {
    if (
      parseFloat(this.input.value) != roundDigit(value, this.options.precision)
    )
      this.input.value = this.formatValue(value)
  }

  get step(): number | null {
    return this.options.step
  }

  set step(value: number | null) {
    this.options.step = value
  }

  get min(): number {
    return this.options.min
  }

  set min(value: number) {
    this.options.min = value
  }

  get max(): number {
    return this.options.max
  }

  set max(value: number) {
    this.options.max = value
  }

  get precision(): number {
    return this.options.precision
  }

  set precision(value: number) {
    this.options.precision = value
  }

  get minPrecision(): number | null {
    return this.options.minPrecision
  }

  set minPrecision(value: number | null) {
    this.options.minPrecision = value
  }

  get onchange(): ((value: number | undefined) => void) | undefined {
    return this.options.onchange
  }

  set onchange(value: ((value: number | undefined) => void) | undefined) {
    this.options.onchange = value
  }

  get disabled(): boolean {
    return this.input.disabled
  }

  set disabled(value: boolean) {
    this.input.disabled = value
  }
}
