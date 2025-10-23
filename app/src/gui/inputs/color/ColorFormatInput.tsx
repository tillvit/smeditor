import { useEffect, useRef, useState } from "react"

interface ColorFormatInputOptions {
  value: string
  onChange: (val: string) => void
  isValid: (val: string) => string | null
}

export function ColorFormatInput(props: ColorFormatInputOptions) {
  const [value, setValue] = useState(props.value)
  const editing = useRef(false)
  const cachedValue = useRef(props.value)

  useEffect(() => {
    if (!editing.current) {
      setValue(props.value)
    }
  }, [props.value])

  return (
    <input
      className={"color-format-input"}
      type="text"
      value={value}
      onFocus={() => {
        editing.current = true
        cachedValue.current = props.value
      }}
      onChange={e => {
        setValue(e.target.value)
        const newValue = props.isValid(e.target.value)
        if (newValue) {
          props.onChange(newValue)
        }
      }}
      onKeyDown={e => {
        if (e.key === "Enter") {
          e.currentTarget.blur()
        }
        if (e.key === "Escape") {
          props.onChange(cachedValue.current)
          e.currentTarget.value = cachedValue.current
          setValue(cachedValue.current)
          e.currentTarget.blur()
        }
      }}
      onBlur={e => {
        editing.current = false
        const newValue = props.isValid(e.target.value)
        if (newValue) {
          props.onChange(newValue)
          setValue(props.value)
        } else {
          setValue(cachedValue.current)
        }
      }}
    />
  )
}
