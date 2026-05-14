import { ReactNode, useRef } from "react"
import { clamp } from "../../../util/Math"

export function ColorSlider(props: {
  value: number
  onChange: (val: number) => void
  background?: string
  className?: string
  children?: ReactNode
}) {
  const thumbRef = useRef<HTMLDivElement>(null)
  const sliderRef = useRef<HTMLDivElement>(null)

  function handleMouseDown(e: React.MouseEvent) {
    window.addEventListener("mousemove", handleMouseMove)
    window.addEventListener("mouseup", handleMouseUp)
    handleMouseMove(e.nativeEvent)
  }

  function handleMouseMove(e: MouseEvent) {
    const bound = sliderRef.current!.getBoundingClientRect()
    const x = clamp((e.clientX - bound.left) / bound.width, 0, 1)
    props.onChange(x)
  }

  function handleMouseUp() {
    window.removeEventListener("mousemove", handleMouseMove)
    window.removeEventListener("mouseup", handleMouseUp)
  }

  return (
    <div
      className={"color-slider " + (props.className ?? "")}
      style={{ background: props.background }}
      onMouseDown={handleMouseDown}
      ref={sliderRef}
    >
      <div
        className="color-slider-thumb"
        ref={thumbRef}
        style={{ left: props.value * 100 + "%" }}
      ></div>
      {props.children}
    </div>
  )
}
