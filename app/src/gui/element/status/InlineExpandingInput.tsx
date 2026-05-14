import { useEffect, useRef, useState } from "react"
import { InlineInputProps } from "../../inputs/InlineTextInput"

export function InlineExpandingInput(props: InlineInputProps) {
  const [value, setValue] = useState(props.value)
  const inputRef = useRef<HTMLInputElement>(null)
  const ignoreNextChange = useRef(false)

  useEffect(() => {
    if (document.activeElement == inputRef.current) return
    setValue(props.value)
  }, [props.value])

  return (
    <span style={{ position: "relative" }}>
      <input
        type="text"
        ref={inputRef}
        spellCheck={false}
        className={`inlineEdit ${props.className ?? ""}`}
        style={{ ...props.style, position: "absolute", width: "100%" }}
        disabled={props.disabled}
        value={value}
        onFocus={e => {
          const el = e.currentTarget
          setTimeout(() => {
            el.select()
          }, 0)
        }}
        onChange={e => setValue(e.target.value)}
        onBlur={e => {
          if (ignoreNextChange.current) {
            ignoreNextChange.current = false
            setValue(props.value)
            return
          }
          props.onChange?.(e.target.value)
          setValue(props.value)
        }}
        onKeyDown={e => {
          if (e.key == "Escape") {
            e.preventDefault()
            e.currentTarget.blur()
            ignoreNextChange.current = true
          }
          if (e.key == "Enter") {
            e.preventDefault()
            e.currentTarget.blur()
          }
        }}
      />
      <div style={{ ...props.style, opacity: 0, pointerEvents: "none" }}>
        {value}
      </div>
    </span>
  )
}
