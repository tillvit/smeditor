import { JSXElementConstructor } from "react"
import {
  CheckboxInput,
  CheckboxInputOptions,
  CheckboxInputProps,
} from "./CheckboxInput"
import {
  ColorInput,
  ColorInputOptions,
  ColorInputProps,
} from "./color/ColorInput"
import {
  DisplaySliderInput,
  DisplaySliderInputOptions,
  DisplaySliderInputProps,
} from "./DisplaySliderInput"
import {
  DropdownInput,
  DropdownInputOptions,
  DropdownInputProps,
} from "./DropdownInput"
import {
  FileUploadInput,
  FileUploadInputOptions,
  FileUploadInputProps,
} from "./FileUploadInput"
import {
  NumberInput,
  NumberInputOptions,
  NumberInputProps,
} from "./NumberInput"
import { PathInput, PathInputOptions, PathInputProps } from "./PathInput"
import {
  SliderInput,
  SliderInputOptions,
  SliderInputProps,
} from "./SliderInput"
import { TextInput, TextInputOptions, TextInputProps } from "./TextInput"

interface CustomInputOptions {
  element: JSXElementConstructor<any>
  disabled?: boolean
  style?: React.CSSProperties
  className?: string
}

interface CustomInputProps<T> extends CustomInputOptions {
  value: T
  onChange?: (value: T) => void
}

export type ValueInputOptions =
  | ({ type: "display-slider" } & DisplaySliderInputOptions)
  | ({ type: "slider" } & SliderInputOptions)
  | ({ type: "color" } & ColorInputOptions)
  | ({ type: "dropdown" } & DropdownInputOptions)
  | ({ type: "number" } & NumberInputOptions)
  | ({ type: "text" } & TextInputOptions)
  | ({ type: "file" } & FileUploadInputOptions)
  | ({ type: "path" } & PathInputOptions)
  | ({ type: "checkbox" } & CheckboxInputOptions)
  | ({ type: "custom" } & CustomInputOptions)

export type ValueInputProps =
  | ({ type: "display-slider" } & DisplaySliderInputProps)
  | ({ type: "slider" } & SliderInputProps)
  | ({ type: "color" } & ColorInputProps)
  | ({ type: "dropdown" } & DropdownInputProps)
  | ({ type: "number" } & NumberInputProps)
  | ({ type: "text" } & TextInputProps)
  | ({ type: "file" } & FileUploadInputProps)
  | ({ type: "path" } & PathInputProps)
  | ({ type: "checkbox" } & CheckboxInputProps)
  | ({ type: "custom" } & CustomInputProps<any>)

export function ValueInput(props: ValueInputProps) {
  switch (props.type) {
    case "display-slider":
      return <DisplaySliderInput {...props} />
    case "slider":
      return <SliderInput {...props} />
    case "color":
      return <ColorInput {...props} />
    case "dropdown":
      return <DropdownInput {...props} />
    case "number":
      return <NumberInput {...props} />
    case "text":
      return <TextInput {...props} />
    case "file":
      return <FileUploadInput {...props} />
    case "path":
      return <PathInput {...props} />
    case "checkbox":
      return <CheckboxInput {...props} />
    case "custom":
      return <props.element {...props} />
  }
}
