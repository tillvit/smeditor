import { ValueInput } from "../gui/element/ValueInput"
import { CustomScriptArgument } from "../util/custom-script/CustomScriptTypes"

type CustomScriptInput<T, U extends CustomScriptArgument> = Omit<
  ValueInput<T>,
  "onChange"
> & {
  onChange: (argument: U, value: T) => void
}

interface CustomScriptArgumentField<T, U extends CustomScriptArgument> {
  name: string
  description?: string
  input: CustomScriptInput<T, U> | ((arg: U) => CustomScriptInput<T, U>)
  // reload all inputs on change
  reload?: boolean
  getValue: (arg: U) => any
}

export const ARGUMENT_FIELDS: {
  [Type in CustomScriptArgument["type"]]: CustomScriptArgumentField<
    any,
    Extract<CustomScriptArgument, { type: Type }>
  >[]
} = {
  text: [
    {
      name: "Default",
      description: "Default value",
      getValue: arg => arg.default,
      input: {
        type: "text",
        onChange: (arg, value) => {
          arg.default = value
        },
      },
    },
  ],
  checkbox: [
    {
      name: "Default",
      description: "Default value",
      getValue: arg => arg.default,
      input: {
        type: "checkbox",
        onChange: (arg, value) => {
          arg.default = value
        },
      },
    },
  ],
  color: [
    {
      name: "Default",
      description: "Default value",
      getValue: arg => arg.default,
      input: {
        type: "color",
        onChange: (arg, value) => {
          arg.default = value
        },
      },
    },
  ],
  number: [
    {
      name: "Minimum",
      description: "Minimum value",
      getValue: arg => arg.min,
      reload: true,
      input: {
        type: "number",
        onChange: (arg, value) => {
          if (arg.max !== undefined && value > arg.max) {
            arg.max = value
          }
          if (arg.default !== undefined && value > arg.default) {
            arg.default = value
          }
          arg.min = value
        },
      },
    },
    {
      name: "Maximum",
      description: "Maximum value",
      getValue: arg => arg.max,
      reload: true,
      input: {
        type: "number",
        onChange: (arg, value) => {
          if (arg.min !== undefined && value < arg.min) {
            arg.min = value
          }
          if (arg.default !== undefined && value < arg.default) {
            arg.default = value
          }
          arg.max = value
        },
      },
    },
    {
      name: "Step",
      description: "Step value when the arrow buttons are pressed",
      getValue: arg => arg.step,
      input: {
        type: "number",
        onChange: (arg, value) => {
          arg.step = value
        },
      },
    },
    {
      name: "Default",
      description: "Default value",
      getValue: arg => {
        return arg.default
      },
      input: arg => {
        return {
          type: "number",
          min: arg.min ?? -Number.MAX_VALUE,
          max: arg.max ?? Number.MAX_VALUE,
          precision: arg.precision,
          onChange: (arg, value) => {
            arg.default = value
          },
        }
      },
    },
    {
      name: "Precision",
      description: "Number of decimal places to use",
      getValue: arg => arg.precision,
      reload: true,
      input: {
        type: "number",
        onChange: (arg, value) => {
          arg.precision = value
        },
      },
    },
  ],
  slider: [
    {
      name: "Minimum",
      description: "Minimum value",
      getValue: arg => arg.min,
      reload: true,
      input: {
        type: "number",
        onChange: (arg, value) => {
          if (arg.max !== undefined && value > arg.max) {
            arg.max = value
          }
          arg.min = value
        },
      },
    },
    {
      name: "Maximum",
      description: "Maximum value",
      getValue: arg => arg.max,
      reload: true,
      input: {
        type: "number",
        onChange: (arg, value) => {
          if (arg.min !== undefined && value < arg.min) {
            arg.min = value
          }
          arg.max = value
        },
      },
    },
    {
      name: "Default",
      description: "Default value",
      getValue: arg => arg.default,
      input: arg => {
        return {
          type: "number",
          min: arg.min,
          max: arg.max,
          onChange: (arg, value) => {
            arg.default = value
          },
        }
      },
    },
  ],
  dropdown: [
    {
      name: "Options",
      description:
        "Dropdown options. Seperate options with a comma. Arguments that are a number will be converted into a number.",
      getValue: arg => arg.items.join(","),
      reload: true,
      input: {
        type: "text",
        onChange: (arg, value) => {
          arg.items = (value as string)
            .split(",")
            .map(option => option.trim())
            .map(option => {
              const number = Number(option)
              if (!isNaN(number)) {
                return number
              }
              return option
            })
        },
      },
    },
    {
      name: "Default",
      description: "Default selected option",
      getValue: arg => arg.default,
      input: arg => {
        return {
          type: "dropdown",
          items: arg.items || [],
          advanced: false,
          onChange: (arg, value) => {
            arg.default = value
          },
        }
      },
    },
  ],
}

export const DEFAULT_ARGUMENTS: {
  [Type in CustomScriptArgument["type"]]: Extract<
    CustomScriptArgument,
    { type: Type }
  >
} = {
  text: {
    type: "text",
    name: "Text Argument",
    description: "",
    default: "text",
  },
  checkbox: {
    type: "checkbox",
    name: "Checkbox Argument",
    description: "",
    default: false,
  },
  color: {
    type: "color",
    name: "Color Argument",
    description: "",
    default: "#ffffff",
  },
  number: {
    type: "number",
    name: "Number Argument",
    description: "",
    default: 0,
    step: 1,
  },
  slider: {
    type: "slider",
    name: "Slider Argument",
    description: "",
    default: 0,
    min: 0,
    max: 10,
  },
  dropdown: {
    type: "dropdown",
    name: "Dropdown Argument",
    description: "",
    items: ["Option 1", "Option 2", "Option 3"],
    default: "Option 1",
  },
}
