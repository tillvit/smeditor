import { roundDigit } from "../../util/Math"

interface SliderOptions {
  value?: number
  width?: number
  min: number
  max: number
  step: number
  precision?: number
  transformer?: (value: number) => string | number
  onChange?: (value: number) => void
  displayWidth?: number
}

export class NumberSlider {
  view: HTMLDivElement
  slider: HTMLInputElement
  text: HTMLDivElement
  options

  constructor(view: HTMLDivElement, options: SliderOptions) {
    this.view = view
    this.options = options
    this.view.classList.add("slider")

    const input = document.createElement("input")
    input.classList.add("slider-input")
    input.type = "range"
    input.min = options.min.toString()
    input.max = options.max.toString()
    input.step = options.step.toString()
    input.value = (options.value ?? (options.min + options.max) / 2).toString()
    input.oninput = () => {
      text.innerText = this.formatValue(parseFloat(input.value)) + ""
      this.options.onChange?.(parseFloat(input.value))
    }
    if (options.width !== undefined)
      input.style.width = options.width / 16 + "rem"
    this.slider = input
    view.appendChild(input)

    const text = document.createElement("div")
    text.innerText = this.formatValue(parseFloat(input.value)) + ""
    text.style.width = `${(this.options.displayWidth ?? 32) / 16}rem`
    this.text = text
    view.appendChild(text)
  }

  get value(): number {
    return parseFloat(this.slider.value)
  }

  setValue(value: number) {
    this.slider.value = value + ""
    this.text.innerText = this.formatValue(parseFloat(this.slider.value)) + ""
  }

  static create(options: SliderOptions) {
    return new NumberSlider(document.createElement("div"), options)
  }

  private formatValue(value: number) {
    if (this.options.transformer) {
      return this.options.transformer(value)
    }
    if (this.options.precision === undefined)
      return roundDigit(value, 3).toString()
    return roundDigit(value, this.options.precision).toFixed(
      this.options.precision
    )
  }
}
