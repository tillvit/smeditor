import { ReactNode } from "react"
import tippy from "tippy.js"

export function SyncLabel(props: {
  text: string
  tooltip: string
  children?: ReactNode
}) {
  return (
    <div
      style={{
        display: "flex",
        flexDirection: "row",
        justifyContent: "space-between",
        alignItems: "center",
      }}
      ref={el => {
        if (!el) return
        tippy(el, { content: props.tooltip })
      }}
    >
      <div className="label">{props.text}</div>
      {props.children}
    </div>
  )
}
