import { clamp, roundDigit, safeParse } from "../util/Util"

export class NumberSpinner {
  view: HTMLDivElement
  input: HTMLInputElement
  onChange?: (value: number | undefined) => void
  min = -Number.MAX_VALUE
  max = Number.MAX_VALUE
  precision?: number
  step = 1

  constructor(
    view: HTMLDivElement,
    value: number,
    step: number,
    precision?: number,
    min?: number,
    max?: number
  ) {
    this.view = view
    this.view.classList.add("spinner")

    const input = document.createElement("input")
    input.classList.add("spinner-input")
    input.type = "text"
    input.autocomplete = "off"
    input.spellcheck = false
    input.onblur = () => {
      let value = roundDigit(safeParse(input.value), 3)
      value = clamp(value, this.min, this.max)
      input.value = this.formatValue(value)
      input.blur()
      if (input.value == "") this.onChange?.(undefined)
      else this.onChange?.(value)
    }
    input.onkeydown = ev => {
      if (ev.key == "Enter") input.blur()
    }
    input.oninput = () => {
      input.value = input.value.replaceAll(/[^.0-9+-]/g, "")
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
    upButton.onclick = () => {
      input.value = this.formatValue(parseFloat(input.value) + step)
      this.onChange?.(parseFloat(input.value))
    }
    spinner.appendChild(upButton)

    const downButton = document.createElement("button")
    downButton.classList.add("spinner-down")
    downButton.onclick = () => {
      input.value = this.formatValue(parseFloat(input.value) - step)
      this.onChange?.(parseFloat(input.value))
    }
    spinner.appendChild(downButton)
  }

  get value(): number {
    return parseFloat(this.input.value)
  }

  static create(
    value: number,
    step: number,
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
    if (!this.precision) return roundDigit(value, 3).toString()
    return roundDigit(value, this.precision).toFixed(this.precision)
  }
}
