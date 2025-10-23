import { useEffect, useRef } from "react"

export function PlaybackOptionsGroup(props: {
  label: string
  children: React.ReactNode
  className?: string
  scaling?: boolean
  addTooltip?: (ref: HTMLElement) => void
}) {
  const container = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!container.current) return
    if (props.addTooltip) {
      props.addTooltip(container.current)
    }
    if (props.scaling) {
      container.current.style.setProperty(
        "--w",
        container.current.offsetWidth / 16 + "rem"
      )
    }
  }, [container])

  return (
    <div
      className={"playback-options-row " + (props.className || "")}
      ref={container}
    >
      <div className="playback-options-label">{props.label}</div>
      {props.children}
    </div>
  )
}
