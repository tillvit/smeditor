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

type CustomScriptArgument =
  | CustomScriptCheckboxArgument
  | CustomScriptColorArgument
  | CustomScriptNumberArgument
  | CustomScriptTextArgument
  | CustomScriptDropdownArgument
  | CustomScriptSliderArgument

interface CustomScriptBaseArgument {
  name: string
  description: string
  default?: any
}

interface CustomScriptCheckboxArgument extends CustomScriptBaseArgument {
  type: "checkbox"
  default?: boolean
}

interface CustomScriptColorArgument extends CustomScriptBaseArgument {
  type: "color"
  default?: string
}

interface CustomScriptNumberArgument extends CustomScriptBaseArgument {
  type: "number"
  default?: number
  min?: number
  max?: number
  step?: number
  precision?: number
  minPrecision?: number
}

interface CustomScriptTextArgument extends CustomScriptBaseArgument {
  type: "text"
  default?: string
}

interface CustomScriptDropdownArgument extends CustomScriptBaseArgument {
  type: "dropdown"
  items: (string | number)[]
  default?: string | number
}

interface CustomScriptSliderArgument extends CustomScriptBaseArgument {
  type: "slider"
  default?: number
  min?: number
  max?: number
  hardMax?: number
  hardMin?: number
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
