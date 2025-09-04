import { WaterfallManager } from "../../gui/element/WaterfallManager"
import { roundDigit } from "../../util/Math"
import { bsearchEarliest, isSameRow } from "../../util/Util"
import {
  FootOverride,
  TECH_ERROR_STRING_REVERSE,
  TECH_ERROR_STRINGS,
} from "../stats/parity/ParityDataTypes"
import { Chart } from "./Chart"
import { Simfile } from "./Simfile"
import { SMEData, SMEParityData } from "./SMETypes"

export function serializeSMEData(sm: Simfile): string {
  const data: SMEData = {
    version: 1,
    parity: {},
  }

  const charts = sm.getAllChartsByGameType()
  for (const gameType in charts) {
    data.parity[gameType] = charts[gameType].map(chart => {
      return getParityData(chart)
    })
  }
  return JSON.stringify(data)
}

export function getParityData(chart: Chart): SMEParityData {
  const overrides: [number, number, FootOverride][] = []
  for (const note of chart.getNotedata()) {
    if (note.parity?.override) {
      overrides.push([roundDigit(note.beat, 3), note.col, note.parity.override])
    }
  }

  const ignores: Record<number, string[]> = {}
  chart.ignoredErrors.forEach((errors, beat) => {
    ignores[beat] = Array.from(errors).map(e => TECH_ERROR_STRINGS[e])
  })

  return {
    overrides,
    ignores,
  }
}

export function loadSMEData(string: string, sm: Simfile, isAutosave: boolean) {
  try {
    const data = JSON.parse(string) as SMEData
    const smCharts = sm.getAllChartsByGameType()
    // Don't load if autosave is used
    if (!isAutosave) {
      for (const [gameType, charts] of Object.entries(data.parity)) {
        for (let i = 0; i < charts.length; i++) {
          const chart = smCharts[gameType]?.[i]
          if (chart) {
            loadChartParityData(charts[i], chart)
          } else {
            WaterfallManager.createFormatted(
              `Chart for game type ${gameType} not found`,
              "warn"
            )
          }
        }
      }
    }
  } catch (error) {
    WaterfallManager.createFormatted(
      "Couldn't parse SME data file: " + error,
      "error"
    )
  }
}

export function loadChartParityData(data: SMEParityData, chart: Chart) {
  const notedata = chart.getNotedata()
  for (const [beat, col, override] of data.overrides) {
    try {
      let noteIdx = bsearchEarliest(notedata, beat, n => n.beat)
      while (
        notedata[noteIdx] &&
        notedata[noteIdx].col != col &&
        isSameRow(notedata[noteIdx].beat, beat)
      ) {
        noteIdx++
      }
      if (!isSameRow(notedata[noteIdx].beat, beat)) {
        console.warn(
          `No note found at beat ${beat} and column ${col} for parity override ${override}`
        )
        continue
      }
      const note = notedata[noteIdx]
      if (!note.parity) note.parity = {}
      note.parity.override = override as FootOverride
    } catch (e) {
      console.warn(
        `Failed to parse parity override at beat ${beat} and column ${col} in ${chart.chartName}: ${e}`
      )
    }
  }

  const ignores = data.ignores
  for (const [beatStr, errors] of Object.entries(ignores)) {
    try {
      const beat = Math.round(parseFloat(beatStr) * 48) / 48
      if (!chart.ignoredErrors.has(beat))
        chart.ignoredErrors.set(beat, new Set())
      errors
        .map(e => TECH_ERROR_STRING_REVERSE[e])
        .filter(e => e !== undefined)
        .forEach(error => chart.ignoredErrors.get(beat)?.add(error))
    } catch (e) {
      console.warn(
        `Failed to parse parity ignore at beat ${beatStr} in ${chart.chartName}: ${e}`
      )
    }
  }
}
