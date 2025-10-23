import { useEffect, useState } from "react"

export interface TextInputProps extends TextInputOptions {
  value: string
  onChange?: (value: string) => void
}

export interface TextInputOptions {
  style?: React.CSSProperties
  className?: string
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
      spellCheck="false"
      className={`${props.className ?? ""}`}
      style={props.style}
      value={value}
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
