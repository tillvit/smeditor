export interface CheckboxInputProps extends CheckboxInputOptions {
  value: boolean
  onChange?: (value: boolean) => void
}

export interface CheckboxInputOptions {
  style?: React.CSSProperties
  className?: string
}
export function CheckboxInput(props: CheckboxInputProps) {
  return (
    <input
      type="checkbox"
      checked={props.value}
      className={`${props.className ?? ""}`}
      style={props.style}
      onChange={e => {
        props.onChange?.(e.target.checked)
      }}
    />
  )
}
