import { useEffect, useState } from "react"

export interface TextInputProps extends TextInputOptions {
  value: string
  onChange?: (value: string) => void
}

export interface TextInputOptions {
  style?: React.CSSProperties
  className?: string
  placeholder?: string
  disabled?: boolean
}

export function TextInput(props: TextInputProps) {
  const [value, setValue] = useState(props.value)

  useEffect(() => {
    setValue(props.value)
  }, [props.value])

  return (
    <input
      type="text"
      autoComplete="off"
      placeholder={props.placeholder}
      spellCheck="false"
      className={`${props.className ?? ""}`}
      style={props.style}
      value={value}
      disabled={props.disabled}
      onChange={e => {
        setValue(e.target.value)
      }}
      onBlur={e => props.onChange?.(e.target.value)}
      onKeyDown={e => {
        if (e.key == "Enter") e.currentTarget.blur()
      }}
    />
  )
}
