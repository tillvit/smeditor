import { Color, DisplayObject } from "pixi.js"
import {
  createContext,
  Dispatch,
  SetStateAction,
  useContext,
  useEffect,
  useState,
} from "react"
import { colorToHsva } from "../../../util/Color"
import { PopupContext, PopupData } from "../../popup/PopupManager"
import {
  ColorFormatHex,
  ColorFormatHsla,
  ColorFormatHsva,
  ColorFormatRgba,
} from "./ColorFormats"
import { ColorMatrix } from "./ColorMatrix"
import { ColorSlider } from "./ColorSlider"

interface ColorPickerContextData {
  hue: number
  saturation: number
  value: number
  alpha: number
  color: Color
  setHue: Dispatch<SetStateAction<number>>
  setSaturation: Dispatch<SetStateAction<number>>
  setValue: Dispatch<SetStateAction<number>>
  setAlpha: Dispatch<SetStateAction<number>>
  setColor: (val: Color) => void
}

export const ColorPickerContext = createContext<ColorPickerContextData | null>(
  null
)

function ColorPickerContent(props: {
  color: Color
  onChange: (val: Color) => void
}) {
  const hsva = colorToHsva(props.color)

  const popupData = useContext(PopupContext)!
  const [hue, setHue] = useState(hsva[0])
  const [saturation, setSaturation] = useState(hsva[1])
  const [value, setValue] = useState(hsva[2])
  const [alpha, setAlpha] = useState(hsva[3] / 100)
  const [color, setColor] = useState(new Color("white"))

  function onColorUpdate(color: Color) {
    const hsva = colorToHsva(color)
    setHue(hsva[0])
    setSaturation(hsva[1])
    setValue(hsva[2])
    setAlpha(hsva[3])
  }

  useEffect(() => {
    const c = new Color({
      h: hue,
      s: saturation,
      v: value,
      a: alpha,
    })
    setColor(c)
    props.onChange(c)
  }, [hue, saturation, value, alpha])

  useEffect(() => {
    const escapeListener = (e: KeyboardEvent) => {
      if (e.key == "Escape") {
        e.stopImmediatePropagation()
        window.removeEventListener("keydown", escapeListener)
        const oldValue = props.color
        onColorUpdate(oldValue)
        popupData.close()
      }
    }
    window.addEventListener("keydown", escapeListener)
    return () => {
      window.removeEventListener("keydown", escapeListener)
    }
  }, [])

  return (
    <ColorPickerContext.Provider
      value={{
        hue,
        saturation,
        value,
        alpha,
        color,
        setHue,
        setSaturation,
        setValue,
        setAlpha,
        setColor: onColorUpdate,
      }}
    >
      <div className="color-popup">
        <div className="color-picker-area">
          <ColorMatrix />
          <ColorSlider
            value={hue / 360}
            onChange={v => setHue(v * 360)}
            background="linear-gradient(to right, red 0%, #ff0 17%, lime 33%, cyan 50%, blue 66%, #f0f 83%, red 100%)"
          />
          <ColorSlider
            value={alpha}
            onChange={setAlpha}
            className="color-picker-transparent"
          >
            <div
              className="color-slider"
              style={{
                background: `linear-gradient(to right, transparent, ${color.toHex()})`,
              }}
            ></div>
          </ColorSlider>
        </div>
        <div className="color-picker-area">
          <ColorFormatHex />
          <ColorFormatRgba />
          <ColorFormatHsva />
          <ColorFormatHsla />
          <div className="color-picker-preview">
            <div className="color-picker-transparent" style={{ flex: 1 }}>
              <div
                style={{
                  width: "100%",
                  height: "100%",
                  background: color.toHexa(),
                }}
              ></div>
            </div>
            <div className="color-picker-transparent" style={{ flex: 1 }}>
              <div
                style={{
                  width: "100%",
                  height: "100%",
                  background: props.color.toHexa(),
                }}
              ></div>
            </div>
          </div>
        </div>
      </div>
    </ColorPickerContext.Provider>
  )
}

export function ColorPickerPopup(
  attach: HTMLElement | DisplayObject,
  color: Color,
  onChange: (val: Color) => void
): PopupData {
  return {
    id: "color-picker",
    attach,
    content: <ColorPickerContent color={color} onChange={onChange} />,
  }
}
