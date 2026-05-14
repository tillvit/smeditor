import { ValueInputOptions } from "../gui/inputs/ValueInput"
import { CustomScriptArgument } from "../util/custom-script/CustomScriptTypes"

export type CustomScriptInput<U extends CustomScriptArgument> =
  ValueInputOptions & {
    onChange: (argument: U, value: any) => void
  }

export interface CustomScriptArgumentField<U extends CustomScriptArgument> {
  name: string
  key: keyof U
  description?: string
  input: CustomScriptInput<U> | ((arg: U) => CustomScriptInput<U>)
  getValue: (arg: U) => any
}

export const ARGUMENT_FIELDS: {
  [Type in CustomScriptArgument["type"]]: CustomScriptArgumentField<
    Extract<CustomScriptArgument, { type: Type }>
  >[]
} = {
  text: [
    {
      name: "Default value",
      key: "default",
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
      name: "Default value",
      description: "Default value",
      key: "default",
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
      name: "Default value",
      key: "default",
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
      key: "min",
      description: "Minimum value",
      getValue: arg => arg.min,
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
      key: "max",
      description: "Maximum value",
      getValue: arg => arg.max,
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
      key: "step",
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
      name: "Default value",
      key: "default",
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
      key: "precision",
      description: "Number of decimal places to use",
      getValue: arg => arg.precision,
      input: {
        type: "number",
        min: 0,
        max: 6,
        precision: 0,
        onChange: (arg, value) => {
          arg.precision = value
        },
      },
    },
  ],
  slider: [
    {
      name: "Minimum",
      key: "min",
      description: "Minimum value",
      getValue: arg => arg.min,
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
      key: "max",
      description: "Maximum value",
      getValue: arg => arg.max,
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
      name: "Default value",
      key: "default",
      description: "Default value",
      getValue: arg => arg.default,
      input: arg => {
        return {
          type: "slider",
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
      key: "values",
      description: "Dropdown options, separated by a comma.",
      getValue: arg => arg.values.join(","),
      input: {
        type: "text",
        onChange: (arg, value) => {
          arg.values = (value as string).split(",").map(option => option.trim())
          if (!arg.values.includes(arg.default)) {
            arg.default = arg.values[0]
          }
        },
      },
    },
    {
      name: "Default value",
      key: "default",
      description: "Default selected option",
      getValue: arg => arg.default,
      input: arg => {
        return {
          type: "dropdown",
          values: arg.values || [],
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
    min: 0,
    max: 10,
    precision: 3,
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
    values: ["Option 1", "Option 2", "Option 3"],
    default: "Option 1",
  },
}
