import { Color } from "pixi.js"
import { useEffect, useRef, useState } from "react"
import { PopupManager } from "../../popup/PopupManager"
import { ColorPickerPopup } from "./ColorPickerPopup"

export interface ColorInputProps extends ColorInputOptions {
  value: Color | string
  onChange?: (value: Color) => void
}

export interface ColorInputOptions {
  style?: React.CSSProperties
  className?: string
  height?: number
  width?: number
  disabled?: boolean
}

function convertColor(color: string | Color) {
  if (typeof color === "string") {
    return new Color(color)
  }
  return color
}

export function ColorInput(props: ColorInputProps) {
  const [value, setValue] = useState(convertColor(props.value))
  const pickerRef = useRef<HTMLDivElement>(null)
  const cachedColor = useRef(props.value)

  useEffect(() => {
    setValue(convertColor(props.value))
  }, [props.value])

  return (
    <>
      <div
        className="color-picker color-picker-transparent"
        style={{
          width: props.width ? props.width / 16 + "rem" : undefined,
          height: props.height ? props.height / 16 + "rem" : undefined,
        }}
        ref={pickerRef}
        onClick={() => {
          if (props.disabled) return
          cachedColor.current = value
          PopupManager.open(
            ColorPickerPopup(pickerRef.current!, value, val => {
              setValue(val)
              console.log(val)
              props.onChange?.(val)
            })
          )
        }}
      >
        <div
          style={{
            backgroundColor: value.toHexa(),
            width: "100%",
            height: "100%",
          }}
        >
          {" "}
        </div>
      </div>
    </>
  )
}
