import { Color } from "pixi.js"
import { colorFallback, colorToHsla, colorToHsva } from "../../util/Color"
import { clamp } from "../../util/Math"

class TransparentPreview extends HTMLDivElement {
  colorElement!: HTMLDivElement

  set color(value: Color) {
    this.colorElement.style.background = value.toHexa()
  }
}

function createTransparent() {
  const bg = document.createElement("div") as TransparentPreview
  bg.classList.add("color-picker-transparent")
  Object.setPrototypeOf(bg, TransparentPreview.prototype)
  const color = document.createElement("div")
  color.style.width = "100%"
  color.style.height = "100%"
  bg.colorElement = color
  bg.appendChild(color)
  return bg
}

interface ColorFormatInputOptions {
  setValue: (color: Color) => string
  isValid: (value: string) => string | null
}

interface ColorFormatOptions {
  label: string
  inputs: Record<string, ColorFormatInputOptions>
  getValue: (this: ColorFormatInput) => Color
  onupdate: (color: Color) => void
}

class ColorFormatInput extends HTMLDivElement {
  inputs!: Record<string, HTMLInputElement>
  opts!: Record<string, ColorFormatInputOptions>
  getValue!: (this: ColorFormatInput) => Color
  onupdate!: (color: Color) => void
  static create(options: ColorFormatOptions) {
    const input = document.createElement("div") as ColorFormatInput
    Object.setPrototypeOf(input, ColorFormatInput.prototype)
    input.opts = options.inputs
    input.inputs = {}
    input.getValue = options.getValue.bind(input)
    input.onupdate = options.onupdate
    input.classList.add("color-format")

    const label = document.createElement("div")
    label.classList.add("color-format-label")
    label.innerText = options.label
    const container = document.createElement("div")
    container.classList.add("color-format-inputs")

    Object.entries(options.inputs).forEach(([key, opt]) => {
      const i = document.createElement("input")
      i.type = "text"
      let lastValue = ""
      i.onfocus = () => {
        lastValue = i.value
      }
      i.onkeydown = e => {
        if (e.key == "Enter") {
          i.blur()
          e.preventDefault()
        }
        if (e.key == "Escape") {
          i.value = lastValue
          i.blur()
          e.stopImmediatePropagation()
        }
      }
      i.oninput = () => {
        if (opt.isValid(i.value) !== null) {
          input.onupdate?.(input.getValue())
        }
      }
      i.onblur = () => {
        const adjust = opt.isValid(i.value)
        if (adjust === null) {
          i.value = lastValue
        } else {
          i.value = adjust
        }
        input.onupdate?.(input.getValue())
      }
      input.inputs[key] = i
      container.appendChild(i)
    })

    input.replaceChildren(label, container)

    return input
  }

  setValue(color: Color) {
    Object.entries(this.inputs).forEach(([key, inp]) => {
      if (document.activeElement == inp) return
      inp.value = this.opts[key].setValue(color)
    })
  }
}

const intValid = (low: number, high: number, suffix?: string) => {
  return (value: string) => {
    if (suffix !== undefined && value.endsWith(suffix)) {
      value = value.slice(0, value.length - suffix.length)
    }
    let v
    try {
      v = parseInt(value)
    } catch (e) {
      return null
    }
    return clamp(v, low, high) + ""
  }
}

const getInt = (value: string, low: number, high: number, suffix?: string) => {
  let v
  if (suffix !== undefined && value.endsWith(suffix)) {
    value = value.slice(0, value.length - suffix.length)
  }
  try {
    v = parseInt(value)
  } catch (e) {
    return low
  }
  return clamp(v, low, high)
}

interface ColorPickerOptions {
  value: string
  height?: number
  width?: number
}

export class ColorPicker extends TransparentPreview {
  private _value!: Color
  private _hue: number = 0
  private _sat: number = 0
  private _val: number = 0
  private _alp: number = 1

  private popup?: HTMLDivElement
  private matrix?: HTMLDivElement
  private matrixDot?: HTMLDivElement
  private matrixDragging = false
  private hueDragging = false
  private hueThumb?: HTMLDivElement
  private alphaDragging = false
  private alphaBg?: HTMLDivElement
  private alphaThumb?: HTMLDivElement
  private previewNew?: TransparentPreview

  private formats: ColorFormatInput[] = []

  onColorChange?: (color: Color) => void

  static create(options: ColorPickerOptions): ColorPicker {
    const picker = createTransparent() as ColorPicker
    Object.setPrototypeOf(picker, ColorPicker.prototype)
    picker.value = colorFallback(options.value)
    picker.classList.add("color-picker")
    picker.formats = []

    if (options.height !== undefined) {
      picker.style.height = options.height + "px"
    }
    if (options.width !== undefined) {
      picker.style.width = options.width + "px"
    }

    picker.addEventListener("click", () => {
      picker.createPopup()
    })

    return picker
  }

  private updatePreview() {
    this.color = this._value
  }

  get value() {
    return this._value
  }

  set value(color: Color) {
    this._value = color
    const hsv = colorToHsva(this._value)
    this._hue = hsv[0]
    this._sat = hsv[1]
    this._val = hsv[2]
    this._alp = hsv[3]
    this.updatePreview()
    this.updatePopup()
  }

  get hue() {
    return this._hue
  }

  set hue(value: number) {
    this._hue = value
    this.updateColor()
  }

  get sat() {
    return this._sat
  }

  set sat(value: number) {
    this._sat = value
    this.updateColor()
  }

  get val() {
    return this._val
  }

  set val(value: number) {
    this._val = value
    this.updateColor()
  }

  get alpha() {
    return this._alp
  }

  set alpha(value: number) {
    this._alp = value
    this.updateColor()
  }

  updateColor() {
    this._value = new Color({
      h: this._hue * 360,
      s: this._sat * 100,
      v: this._val * 100,
      a: this._alp,
    })
    this.updatePreview()
    this.updatePopup()
  }

  createPopup() {
    if (this.popup) {
      this.closePopup()
      return
    }

    const popup = document.createElement("div")
    popup.classList.add("color-picker-popup")

    const colorArea = document.createElement("div")
    colorArea.classList.add("color-picker-area")

    const [matrix, dot] = this.createMatrix()
    this.matrix = matrix
    this.matrixDot = dot

    dot.style.background = "#f00"

    const [hueSlider, hueThumb] = this.createSlider({
      ondrag: () => (this.hueDragging = true),
      offdrag: () => (this.hueDragging = false),
      change: v => {
        this.hue = v
        this.onColorChange?.(this._value)
      },
    })
    this.hueThumb = hueThumb
    hueSlider.style.background =
      "linear-gradient(to right, red 0%, #ff0 17%, lime 33%, cyan 50%, blue 66%, #f0f 83%, red 100%)"

    const [alphaSlider, alphaThumb] = this.createSlider({
      ondrag: () => (this.alphaDragging = true),
      offdrag: () => (this.alphaDragging = false),
      change: v => {
        this.alpha = v
        this.onColorChange?.(this._value)
      },
    })
    this.alphaThumb = alphaThumb
    alphaSlider.classList.add("color-picker-transparent")
    const alphaBg = document.createElement("div")
    alphaBg.classList.add("color-slider")
    alphaSlider.appendChild(alphaBg)
    this.alphaBg = alphaBg

    colorArea.replaceChildren(matrix, hueSlider, alphaSlider)

    const textArea = document.createElement("div")
    textArea.classList.add("color-picker-area")

    const hex = ColorFormatInput.create({
      label: "HEX",
      inputs: {
        hex: {
          setValue: c => {
            return c.alpha != 1 ? c.toHexa() : c.toHex()
          },
          isValid: s => {
            const match = /#?([0-9a-fA-F]+)/.exec(s)
            if (!match) return null
            if ([3, 4, 6, 8].includes(match[1].length)) {
              if (s[0] != "#") s = "#" + s
              return s
            }
            return null
          },
        },
      },
      getValue() {
        let s = this.inputs.hex.value
        if (s[0] != "#") s = "#" + s
        return new Color(s)
      },
      onupdate: c => {
        this.value = c
        this.onColorChange?.(this._value)
      },
    })
    this.formats.push(hex)
    textArea.appendChild(hex)

    const rgb = ColorFormatInput.create({
      label: "RGBA",
      inputs: {
        r: {
          setValue: c => Math.round(c.red * 255).toString(),
          isValid: intValid(0, 255),
        },
        g: {
          setValue: c => Math.round(c.green * 255).toString(),
          isValid: intValid(0, 255),
        },
        b: {
          setValue: c => Math.round(c.blue * 255).toString(),
          isValid: intValid(0, 255),
        },
        a: {
          setValue: c => Math.round(c.alpha * 100) + "%",
          isValid: intValid(0, 100, "%"),
        },
      },
      getValue() {
        return new Color({
          r: getInt(this.inputs.r.value, 0, 255),
          g: getInt(this.inputs.g.value, 0, 255),
          b: getInt(this.inputs.b.value, 0, 255),
          a: getInt(this.inputs.a.value, 0, 100, "%") / 100,
        })
      },
      onupdate: c => {
        this.value = c
        this.onColorChange?.(this._value)
      },
    })
    this.formats.push(rgb)
    textArea.appendChild(rgb)

    const hsv = ColorFormatInput.create({
      label: "HSVA",
      inputs: {
        h: {
          setValue: c => Math.round(colorToHsva(c)[0] * 360) + "º",
          isValid: intValid(0, 360, "º"),
        },
        s: {
          setValue: c => Math.round(colorToHsva(c)[1] * 100) + "%",
          isValid: intValid(0, 100, "%"),
        },
        v: {
          setValue: c => Math.round(colorToHsva(c)[2] * 100) + "%",
          isValid: intValid(0, 100, "%"),
        },
        a: {
          setValue: c => Math.round(c.alpha * 100) + "%",
          isValid: intValid(0, 100, "%"),
        },
      },
      getValue() {
        return new Color({
          h: getInt(this.inputs.h.value, 0, 360, "º"),
          s: getInt(this.inputs.s.value, 0, 100, "%"),
          v: getInt(this.inputs.v.value, 0, 100, "%"),
          a: getInt(this.inputs.a.value, 0, 100, "%") / 100,
        })
      },
      onupdate: c => {
        this.value = c
        this.onColorChange?.(this._value)
      },
    })
    this.formats.push(hsv)
    textArea.appendChild(hsv)

    const hsl = ColorFormatInput.create({
      label: "HSLA",
      inputs: {
        h: {
          setValue: c => Math.round(colorToHsla(c)[0] * 360) + "º",
          isValid: intValid(0, 360, "º"),
        },
        s: {
          setValue: c => Math.round(colorToHsla(c)[1] * 100) + "%",
          isValid: intValid(0, 100, "%"),
        },
        l: {
          setValue: c => Math.round(colorToHsla(c)[2] * 100) + "%",
          isValid: intValid(0, 100, "%"),
        },
        a: {
          setValue: c => Math.round(c.alpha * 100) + "%",
          isValid: intValid(0, 100, "%"),
        },
      },
      getValue() {
        return new Color({
          h: getInt(this.inputs.h.value, 0, 360, "º"),
          s: getInt(this.inputs.s.value, 0, 100, "%"),
          l: getInt(this.inputs.l.value, 0, 100, "%"),
          a: getInt(this.inputs.a.value, 0, 100, "%") / 100,
        })
      },
      onupdate: c => {
        this.value = c
        this.onColorChange?.(this._value)
      },
    })
    this.formats.push(hsl)
    textArea.appendChild(hsl)

    const previewContainer = document.createElement("div")
    previewContainer.classList.add("color-picker-preview")

    const previewNew = createTransparent()
    const previewOld = createTransparent()
    previewOld.color = this._value
    previewNew.color = this._value
    previewContainer.replaceChildren(previewNew, previewOld)
    this.previewNew = previewNew
    textArea.appendChild(previewContainer)

    popup.replaceChildren(colorArea, textArea)

    this.popup = popup

    this.updatePopup()

    const oldValue = this._value

    const escapeListener = (e: KeyboardEvent) => {
      if (e.key == "Escape") {
        e.stopImmediatePropagation()
        window.removeEventListener("keydown", escapeListener)
        window.removeEventListener("mousedown", clickOutside)
        this.closePopup()
        this.value = oldValue
        this.onColorChange?.(this._value)
      }
    }

    const clickOutside = (event: MouseEvent) => {
      if (!popup.contains(event.target as Node | null)) {
        window.removeEventListener("keydown", escapeListener)
        window.removeEventListener("mousedown", clickOutside)
        this.closePopup()
      }
    }

    window.addEventListener("keydown", escapeListener)
    window.addEventListener("mousedown", clickOutside)

    document.getElementById("popups")!.appendChild(popup)

    setTimeout(() => this.movePosition())
  }

  updatePopup() {
    if (!this.popup) return
    this.matrix!.style.backgroundColor = `hsl(${this._hue * 360} 100% 50%)`
    this.matrixDot!.style.backgroundColor = this._value.toHex()
    if (!this.matrixDragging) {
      this.matrixDot!.style.left = this._sat * 200 + "px"
      this.matrixDot!.style.top = (1 - this._val) * 200 + "px"
    }
    if (!this.hueDragging) {
      this.hueThumb!.style.left = this._hue * 200 + "px"
    }

    const rgbString = `rgba(${this._value.red * 255}, ${this._value.green * 255}, ${this._value.blue * 255}`
    this.alphaBg!.style.background = `linear-gradient(to right, ${rgbString}, 0 ), ${rgbString}, 1))`
    if (!this.alphaDragging) {
      this.alphaThumb!.style.left = this._alp * 200 + "px"
    }

    this.formats.forEach(f => f.setValue(this._value))
    this.previewNew!.color = this._value
  }

  closePopup() {
    const p = this.popup
    this.popup = undefined
    if (!p) return
    p.classList.add("exiting")
    setTimeout(() => {
      p.remove()
    }, 500)
  }

  createMatrix() {
    const matrix = document.createElement("div")
    matrix.classList.add("color-matrix")
    matrix.style.backgroundColor = "#ff0000"
    const x = document.createElement("div")
    x.classList.add("color-matrix-x")
    const y = document.createElement("div")
    y.classList.add("color-matrix-y")
    const dot = document.createElement("div")
    dot.classList.add("color-matrix-dot")
    matrix.appendChild(dot)
    matrix.replaceChildren(x, y, dot)

    matrix.onmousedown = e => {
      window.addEventListener("mousemove", mousemove)
      window.addEventListener("mouseup", mouseup)
      mousemove(e)
      this.matrixDragging = true
    }

    const mousemove = (e: MouseEvent) => {
      const bound = matrix.getBoundingClientRect()
      const sat = clamp((e.clientX - bound.left) / bound.width, 0, 1)
      const val = clamp((e.clientY - bound.top) / bound.height, 0, 1)
      dot.style.left = sat * bound.width + "px"
      dot.style.top = val * bound.height + "px"
      this._sat = sat
      this.val = 1 - val
      this.onColorChange?.(this._value)
    }

    const mouseup = () => {
      window.removeEventListener("mousemove", mousemove)
      window.removeEventListener("mouseup", mouseup)
      this.matrixDragging = false
    }

    return [matrix, dot]
  }

  createSlider(opt: {
    ondrag?: () => void
    change: (val: number) => void
    offdrag?: () => void
  }) {
    const slider = document.createElement("div")
    slider.classList.add("color-slider")
    const thumb = document.createElement("div")
    thumb.classList.add("color-slider-thumb")
    slider.appendChild(thumb)

    slider.onmousedown = e => {
      window.addEventListener("mousemove", mousemove)
      window.addEventListener("mouseup", mouseup)
      mousemove(e)
      opt.ondrag?.()
      this.onColorChange?.(this._value)
    }

    const mousemove = (e: MouseEvent) => {
      const bound = slider.getBoundingClientRect()
      const x = clamp((e.clientX - bound.left) / bound.width, 0, 1)
      thumb.style.left = x * bound.width + "px"
      opt.change(x)
    }

    const mouseup = () => {
      window.removeEventListener("mousemove", mousemove)
      window.removeEventListener("mouseup", mouseup)
      opt.offdrag?.()
    }

    return [slider, thumb]
  }

  private movePosition() {
    const point = this.getBoundingClientRect()
    const popupX = point.left + point.width / 2 - this.popup!.clientWidth / 2
    const popupY = point.top + point.height + 10
    const leftRestriction = 15
    const rightRestriction = window.innerWidth - this.popup!.clientWidth - 15
    this.popup!.style.left = `${clamp(
      popupX,
      leftRestriction,
      rightRestriction
    )}px`
    this.popup!.style.top = `${popupY}px`
    if (popupY + this.popup!.clientHeight > window.innerHeight - 15) {
      this.popup!.style.transformOrigin = `bottom center`
      this.popup!.style.top = `${point.top - this.popup!.clientHeight - 10}px`
    }
  }

  isActive() {
    return this.popup !== undefined
  }
}
