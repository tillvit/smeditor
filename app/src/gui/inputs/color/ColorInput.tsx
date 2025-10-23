import { Color } from "pixi.js"
import { useEffect, useRef, useState } from "react"
import { PopupManager } from "../../popup/PopupManager"
import { ColorPickerPopup } from "./ColorPickerPopup"

export interface ColorInputProps extends ColorInputOptions {
  value: Color
  onChange?: (value: Color) => void
}

export interface ColorInputOptions {
  style?: React.CSSProperties
  className?: string
  height?: number
  width?: number
}

export function ColorInput(props: ColorInputProps) {
  const [value, setValue] = useState(props.value)
  const pickerRef = useRef<HTMLDivElement>(null)
  const cachedColor = useRef(props.value)

  useEffect(() => {
    setValue(props.value)
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
          cachedColor.current = value
          PopupManager.openPopup(
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
