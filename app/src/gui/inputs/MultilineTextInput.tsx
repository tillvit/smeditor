import { useEffect, useState } from "react"

export interface MultilineTextInputProps extends MultilineTextInputOptions {
  value: string
  onChange?: (value: string) => void
}

export interface MultilineTextInputOptions {
  style?: React.CSSProperties
  className?: string
  placeholder?: string
  rows?: number
}

export function MultilineTextInput(props: MultilineTextInputProps) {
  const [value, setValue] = useState(props.value)

  useEffect(() => {
    setValue(props.value)
  }, [props.value])

  return (
    <textarea
      autoComplete="off"
      spellCheck="false"
      placeholder={props.placeholder ?? ""}
      className={`${props.className ?? ""}`}
      style={props.style}
      value={value}
      onChange={e => {
        setValue(e.target.value)
      }}
      cols={20}
      rows={props.rows ?? 5}
      onBlur={e => props.onChange?.(e.target.value)}
      onKeyDown={e => {
        if (e.key == "Enter") e.currentTarget.blur()
      }}
    />
  )
}
