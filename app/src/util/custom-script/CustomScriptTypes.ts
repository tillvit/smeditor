import { KeyCombo } from "../../data/KeybindData"

export interface CustomScript {
  name: string
  description: string
  jsCode: string
  tsCode: string
  arguments: CustomScriptArgument[]
  keybinds: KeyCombo[]
}

export interface CustomScriptWorkerArgs {
  smPayload: string
  codePayload: string
  chartId: string
  selectionNoteIndices: number[]
  args: any[]
}

export type CustomScriptArgument =
  | CustomScriptCheckboxArgument
  | CustomScriptColorArgument
  | CustomScriptNumberArgument
  | CustomScriptTextArgument
  | CustomScriptDropdownArgument
  | CustomScriptSliderArgument

interface CustomScriptBaseArgument {
  name: string
  description: string
}

export interface CustomScriptCheckboxArgument extends CustomScriptBaseArgument {
  type: "checkbox"
  default: boolean
}

export interface CustomScriptColorArgument extends CustomScriptBaseArgument {
  type: "color"
  default: string
}

export interface CustomScriptNumberArgument extends CustomScriptBaseArgument {
  type: "number"
  default: number
  min?: number
  max?: number
  step?: number
  precision?: number
  minPrecision?: number
}

export interface CustomScriptTextArgument extends CustomScriptBaseArgument {
  type: "text"
  default: string
}

export interface CustomScriptDropdownArgument extends CustomScriptBaseArgument {
  type: "dropdown"
  items: (string | number)[]
  default: string | number
}

export interface CustomScriptSliderArgument extends CustomScriptBaseArgument {
  type: "slider"
  default: number
  min: number
  max: number
}

interface CustomScriptPayload {
  type: "payload"
  payload: string
}

interface CustomScriptLog {
  type: "error" | "log" | "warn" | "info"
  args: string[]
}

export type CustomScriptResult = CustomScriptPayload | CustomScriptLog
