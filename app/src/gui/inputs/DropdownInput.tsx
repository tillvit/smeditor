import { useEffect, useRef, useState } from "react"
import { ReactIcon } from "../Icons"

export interface DropdownInputProps extends DropdownInputOptions {
  value: string
  onChange?: (value: string, idx: number) => void
}

export interface DropdownInputOptions {
  values: readonly string[]
  style?: React.CSSProperties
  className?: string
  disabled?: boolean
  transformers?: {
    serialize: (value: string) => string
    deserialize: (value: string) => string
  }
}

export function DropdownInput(props: DropdownInputProps) {
  const [expanded, setExpanded] = useState(false)
  const viewRef = useRef<HTMLDivElement | null>(null)
  const listRef = useRef<HTMLDivElement | null>(null)
  const transformers = props.transformers ?? {
    serialize: (value: string) => value,
    deserialize: (value: string) => value,
  }

  useEffect(() => {
    const clickOutside = (e: MouseEvent) => {
      const target = e.target as HTMLElement
      if (
        !target.closest(".dropdown") ||
        target.closest(".dropdown") != viewRef.current
      )
        setExpanded(false)
    }
    window.addEventListener("click", clickOutside)
    return () => window.removeEventListener("click", clickOutside)
  }, [])

  useEffect(() => {
    if (!listRef.current) return
    if (!expanded) {
      listRef.current.style.height = ""
      return
    }
    const itemList = listRef.current
    itemList.style.height = itemList.scrollHeight + "px"
  }, [expanded, listRef.current])

  return (
    <div
      className={`dropdown ${props.className ?? ""} ${props.disabled ? "disabled" : ""}`}
      style={props.style}
      ref={viewRef}
    >
      <div className="dropdown-selected" onClick={() => setExpanded(!expanded)}>
        <div className="dropdown-selected-text">
          {transformers.serialize(props.value)}
        </div>
        <ReactIcon id="CHEVRON" width={12} />
      </div>
      <div
        className={`dropdown-items ${expanded ? "" : "collapsed"}`}
        ref={listRef}
      >
        {expanded &&
          props.values.map((item, index) => (
            <div
              key={index}
              className="dropdown-item"
              onClick={() => {
                if (props.disabled) return
                props.onChange?.(transformers.deserialize(item), index)
                setExpanded(false)
              }}
              style={{
                animationDelay: index * 0.02 + "s",
              }}
            >
              {item}
            </div>
          ))}
      </div>
    </div>
  )
}
