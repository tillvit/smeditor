import { useEffect, useState } from "react"

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

  useEffect(() => {
    setValue(props.value)
  }, [props.value])

  return (
    <input
      type="text"
      spellCheck={false}
      className={`inlineEdit ${props.className ?? ""}`}
      style={props.style}
      disabled={props.disabled}
      value={value}
      onChange={e => setValue(e.target.value)}
      onBlur={e => props.onChange?.(e.target.value)}
      onKeyDown={e => {
        if (e.key == "Enter" || e.key == "Escape") {
          e.preventDefault()
          e.currentTarget.blur()
        }
      }}
    />
  )
}
