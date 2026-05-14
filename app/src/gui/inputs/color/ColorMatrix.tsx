import { useContext, useRef } from "react"
import { clamp } from "../../../util/Math"
import { ColorPickerContext } from "./ColorPickerPopup"

export function ColorMatrix() {
  const pickerData = useContext(ColorPickerContext)!
  const matrixRef = useRef<HTMLDivElement>(null)
  const dotRef = useRef<HTMLDivElement>(null)

  function handleMouseDown(e: React.MouseEvent) {
    window.addEventListener("mousemove", handleMouseMove)
    window.addEventListener("mouseup", handleMouseUp)
    handleMouseMove(e.nativeEvent)
  }

  function handleMouseMove(e: MouseEvent) {
    const matrix = matrixRef.current!
    const bound = matrix.getBoundingClientRect()
    const sat = clamp((e.clientX - bound.left) / bound.width, 0, 1)
    const val = clamp((e.clientY - bound.top) / bound.height, 0, 1)
    pickerData.setSaturation(sat * 100)
    pickerData.setValue((1 - val) * 100)
  }

  function handleMouseUp() {
    window.removeEventListener("mousemove", handleMouseMove)
    window.removeEventListener("mouseup", handleMouseUp)
  }

  return (
    <div
      className="color-matrix"
      style={{ backgroundColor: `hsl(${pickerData.hue} 100% 50%)` }}
      onMouseDown={handleMouseDown}
      ref={matrixRef}
    >
      <div className="color-matrix-x"></div>
      <div className="color-matrix-y"></div>
      <div
        className="color-matrix-dot"
        style={{
          backgroundColor: pickerData.color.toHex(),
          left: pickerData.saturation + "%",
          top: 100 - pickerData.value + "%",
        }}
        ref={dotRef}
      ></div>
    </div>
  )
}
