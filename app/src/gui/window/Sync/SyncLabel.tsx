import { ReactNode } from "react"
import { tippySafe } from "../../../util/Util"

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
        tippySafe(el, { content: props.tooltip })
      }}
    >
      <div className="label">{props.text}</div>
      {props.children}
    </div>
  )
}
