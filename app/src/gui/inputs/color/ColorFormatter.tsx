import { ReactNode } from "react"

interface ColorFormatOptions {
  label: string
  children: ReactNode
}

export function ColorFormatter(props: ColorFormatOptions) {
  return (
    <div className="color-format">
      <div className="color-format-label">{props.label}</div>
      <div className="color-format-inputs">{props.children}</div>
    </div>
  )
}
