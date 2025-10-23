import { Color } from "pixi.js"
import { useContext } from "react"
import { colorToHsla, colorToRgba } from "../../../util/Color"
import { clamp } from "../../../util/Math"
import { ColorFormatInput } from "./ColorFormatInput"
import { ColorFormatter } from "./ColorFormatter"
import { ColorPickerContext } from "./ColorPickerPopup"

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

export function ColorFormatHex() {
  const pickerData = useContext(ColorPickerContext)!
  const color = pickerData.color

  return (
    <ColorFormatter label="HEX">
      <ColorFormatInput
        value={color.alpha == 1 ? color.toHex() : color.toHexa()}
        onChange={e => {
          pickerData.setColor(new Color(e))
        }}
        isValid={value => {
          const match = /#?([0-9a-fA-F]+)/.exec(value)
          if (!match) return null
          if ([3, 4, 6, 8].includes(match[1].length)) {
            if (value[0] != "#") value = "#" + value
            return value
          }
          return null
        }}
      />
    </ColorFormatter>
  )
}

export function ColorFormatRgba() {
  const pickerData = useContext(ColorPickerContext)!
  const color = pickerData.color

  return (
    <ColorFormatter label="RGBA">
      <ColorFormatInput
        value={(color.red * 255).toFixed(0)}
        onChange={e => {
          const c = colorToRgba(color)
          c.r = parseInt(e)
          pickerData.setColor(new Color(c))
        }}
        isValid={intValid(0, 255)}
      />
      <ColorFormatInput
        value={(color.green * 255).toFixed(0)}
        onChange={e => {
          const c = colorToRgba(color)
          c.g = parseInt(e)
          pickerData.setColor(new Color(c))
        }}
        isValid={intValid(0, 255)}
      />
      <ColorFormatInput
        value={(color.blue * 255).toFixed(0)}
        onChange={e => {
          const c = colorToRgba(color)
          c.b = parseInt(e)
          pickerData.setColor(new Color(c))
        }}
        isValid={intValid(0, 255)}
      />
      <ColorFormatInput
        value={(color.alpha * 100).toFixed(0) + "%"}
        onChange={e => {
          const c = colorToRgba(color)
          c.a = parseInt(e) / 100
          pickerData.setColor(new Color(c))
        }}
        isValid={intValid(0, 100, "%")}
      />
    </ColorFormatter>
  )
}

export function ColorFormatHsla() {
  const pickerData = useContext(ColorPickerContext)!
  const hsla = colorToHsla(pickerData.color)

  return (
    <ColorFormatter label="HSLA">
      <ColorFormatInput
        value={hsla[0].toFixed(0) + "º"}
        onChange={e => {
          hsla[0] = parseInt(e)
          pickerData.setColor(new Color(hsla))
        }}
        isValid={intValid(0, 360)}
      />
      <ColorFormatInput
        value={hsla[1].toFixed(0) + "%"}
        onChange={e => {
          hsla[1] = parseInt(e)
          pickerData.setColor(new Color(hsla))
        }}
        isValid={intValid(0, 100, "%")}
      />
      <ColorFormatInput
        value={hsla[2].toFixed(0)}
        onChange={e => {
          hsla[2] = parseInt(e)
          pickerData.setColor(new Color(hsla))
        }}
        isValid={intValid(0, 100, "%")}
      />
      <ColorFormatInput
        value={hsla[3].toFixed(0) + "%"}
        onChange={e => {
          hsla[3] = parseInt(e)
          pickerData.setColor(new Color(hsla))
        }}
        isValid={intValid(0, 100, "%")}
      />
    </ColorFormatter>
  )
}

export function ColorFormatHsva() {
  const pickerData = useContext(ColorPickerContext)!

  return (
    <ColorFormatter label="HSVA">
      <ColorFormatInput
        value={pickerData.hue.toFixed(0) + "º"}
        onChange={e => {
          pickerData.setHue(parseInt(e))
        }}
        isValid={intValid(0, 360, "º")}
      />
      <ColorFormatInput
        value={pickerData.saturation.toFixed(0) + "%"}
        onChange={e => {
          pickerData.setSaturation(parseInt(e))
        }}
        isValid={intValid(0, 100, "%")}
      />
      <ColorFormatInput
        value={pickerData.value.toFixed(0) + "%"}
        onChange={e => {
          pickerData.setValue(parseInt(e))
        }}
        isValid={intValid(0, 100, "%")}
      />
      <ColorFormatInput
        value={(pickerData.alpha * 100).toFixed(0) + "%"}
        onChange={e => {
          pickerData.setAlpha(parseInt(e) / 100)
        }}
        isValid={intValid(0, 100, "%")}
      />
    </ColorFormatter>
  )
}
