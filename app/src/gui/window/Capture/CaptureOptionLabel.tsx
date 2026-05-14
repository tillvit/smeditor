import { ReactNode } from "react"

export function CaptureOptionLabel(props: {
  label: string
  children?: ReactNode
}) {
  return (
    <div className="pref-item">
      <div className="pref-item-label label">{props.label}</div>
      {props.children}
    </div>
  )
}
