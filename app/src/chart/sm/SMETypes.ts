export type SMEData = {
  version: number
  parity: Record<string, SMEParityData[]>
}

export type SMEParityData = {
  overrides: [number, number, string][] // beat, col, override
  ignores: Record<number, string[]> // beat => errors[]
}
