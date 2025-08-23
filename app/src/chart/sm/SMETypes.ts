import { FootOverride } from "../stats/parity/ParityDataTypes"

export type SMEData = {
  version: number
  parity: Record<string, SMEParityData[]>
}

export type SMEParityData = {
  overrides: [number, number, FootOverride][] // beat, col, override
  ignores: Record<number, string[]> // beat => errors[]
}
