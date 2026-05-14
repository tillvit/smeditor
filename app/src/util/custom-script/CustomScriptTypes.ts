import z from "zod"
import { SMPayload } from "./CustomScriptUtils"

export interface CustomScript {
  name: string
  description: string
  jsCode: string | null
  tsCode: string
  arguments: CustomScriptArgument[]
  // keybinds: KeyCombo[]
}

interface CustomScriptSelectionData {
  type: "notes" | "timing"
  indices: number[]
  range: {
    start: { beat: number; second: number }
    end: { beat: number; second: number }
  }
}

export interface CustomScriptWorkerArgs {
  smPayload: SMPayload
  codePayload: string
  chartId: string
  selection: CustomScriptSelectionData | null
  args: (string | number | boolean)[]
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
  min: number
  max: number
  step: number
  precision: number
}

export interface CustomScriptTextArgument extends CustomScriptBaseArgument {
  type: "text"
  default: string
}

export interface CustomScriptDropdownArgument extends CustomScriptBaseArgument {
  type: "dropdown"
  values: string[]
  default: string
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

interface CustomScriptClose {
  type: "close"
}

interface CustomScriptLog {
  type: "error" | "log" | "warn"
  args: string[]
}

export type CustomScriptResult =
  | CustomScriptPayload
  | CustomScriptLog
  | CustomScriptClose

const CustomScriptArgumentSchema = z.discriminatedUnion("type", [
  z.object({
    type: z.literal("checkbox"),
    name: z.string(),
    description: z.string(),
    default: z.boolean(),
  }),
  z.object({
    type: z.literal("color"),
    name: z.string(),
    description: z.string(),
    default: z.string(),
  }),
  z.object({
    type: z.literal("number"),
    name: z.string(),
    description: z.string(),
    default: z.number(),
    min: z.number(),
    max: z.number(),
    step: z.number(),
    precision: z.number(),
  }),
  z.object({
    type: z.literal("text"),
    name: z.string(),
    description: z.string(),
    default: z.string(),
  }),
  z.object({
    type: z.literal("dropdown"),
    name: z.string(),
    description: z.string(),
    values: z.array(z.string()),
    default: z.string(),
  }),
  z.object({
    type: z.literal("slider"),
    name: z.string(),
    description: z.string(),
    default: z.number(),
    min: z.number(),
    max: z.number(),
  }),
])

export const CustomScriptUploadSchema = z.object({
  name: z.string(),
  description: z.string(),
  code: z.string(),
  arguments: z.array(CustomScriptArgumentSchema),
})

export const CustomScriptSchema = z.object({
  name: z.string(),
  description: z.string(),
  tsCode: z.string(),
  jsCode: z.string().nullable(),
  arguments: z.array(CustomScriptArgumentSchema),
})
