import { useEffect, useRef, useState } from "react"

export interface InlineInputProps extends InlineInputOptions {
  value: string
  onChange?: (value: string) => void
}

export interface InlineInputOptions {
  style?: React.CSSProperties
  className?: string
  disabled?: boolean
}

export function InlineTextInput(props: InlineInputProps) {
  const [value, setValue] = useState(props.value)
  const inputRef = useRef<HTMLInputElement>(null)
  const ignoreNextChange = useRef(false)

  useEffect(() => {
    if (document.activeElement == inputRef.current) return
    setValue(props.value)
  }, [props.value])

  return (
    <input
      type="text"
      ref={inputRef}
      spellCheck={false}
      className={`inlineEdit ${props.className ?? ""}`}
      style={props.style}
      disabled={props.disabled}
      value={value}
      onChange={e => setValue(e.target.value)}
      onBlur={e => {
        if (ignoreNextChange.current) {
          ignoreNextChange.current = false
          return
        }
        props.onChange?.(e.target.value)
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
  )
}
