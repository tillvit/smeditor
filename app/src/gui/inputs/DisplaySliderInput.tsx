export interface DisplaySliderInputProps extends DisplaySliderInputOptions {
  value: number
  onChange?: (value: number) => void
}

export interface DisplaySliderInputOptions {
  step?: number
  min: number
  max: number
  style?: React.CSSProperties
  sliderWidth?: number
  displayWidth?: number
  className?: string
  disabled?: boolean
  transformers?: {
    serialize: (value: number) => number
    deserialize: (value: number) => number
    display: (value: number) => string
  }
}
export function DisplaySliderInput(props: DisplaySliderInputProps) {
  const min = props.min
  const max = props.max
  const displayWidth = props.displayWidth ?? 48
  const transformers = props.transformers ?? {
    serialize: v => v,
    deserialize: v => v,
    display: v => v.toString(),
  }

  return (
    <div className="slider">
      <input
        type="range"
        value={transformers.serialize(props.value)}
        min={min}
        max={max}
        disabled={props.disabled}
        step={props.step}
        onChange={e => {
          props.onChange?.(transformers.deserialize(parseFloat(e.target.value)))
        }}
        className={`slider-input ${props.className ?? ""}`}
        style={{
          ...props.style,
          width: props.sliderWidth ? props.sliderWidth / 16 + "rem" : undefined,
        }}
      />
      <div
        style={{
          width: displayWidth / 16 + "rem",
        }}
        className={`spinner-input ${props.className ?? ""}`}
      >
        {transformers.display(props.value)}
      </div>
    </div>
  )
}
