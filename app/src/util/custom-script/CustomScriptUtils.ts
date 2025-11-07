import z from "zod"
import { GameTypeRegistry } from "../../chart/gameTypes/GameTypeRegistry"
import { Chart } from "../../chart/sm/Chart"
import { CHART_DIFFICULTIES } from "../../chart/sm/ChartTypes"
import { Simfile } from "../../chart/sm/Simfile"
import { TIMING_EVENT_NAMES, TimingEventType } from "../../chart/sm/TimingTypes"
import { Foot } from "../../chart/stats/parity/ParityDataTypes"
import { DEFAULT_SM } from "../../data/SMData"

export const WorkerWhitelist = [
  "WorkerGlobalScope",
  "Object",
  "Function",
  "Array",
  "Number",
  "parseFloat",
  "parseInt",
  "Infinity",
  "NaN",
  "undefined",
  "Boolean",
  "String",
  "Symbol",
  "Date",
  "Promise",
  "RegExp",
  "Error",
  "globalThis",
  "JSON",
  "Math",
  "Intl",
  "ArrayBuffer",
  "Atomics",
  "Uint8Array",
  "Int8Array",
  "Uint16Array",
  "Int16Array",
  "Uint32Array",
  "Int32Array",
  "BigUint64Array",
  "BigInt64Array",
  "Uint8ClampedArray",
  "Float16Array",
  "Float32Array",
  "Float64Array",
  "DataView",
  "Map",
  "BigInt",
  "Set",
  "Iterator",
  "decodeURI",
  "decodeURIComponent",
  "encodeURI",
  "encodeURIComponent",
  "eval",
  "isFinite",
  "isNaN",
  "console",
  "TextEncoderStream",
  "TextEncoder",
  "TextDecoderStream",
  "TextDecoder",
  "onmessage",
  "onmessageerror",
  "cancelAnimationFrame",
  "close",
  "postMessage",
  "requestAnimationFrame",
  "Blob",
  "File",
] as const

export type WorkerWhitelistProperties = (typeof WorkerWhitelist)[number]

const NoteDataEntrySchema = z.object({
  beat: z.number().nonnegative(),
  col: z.number().int().nonnegative(),
  type: z.enum(["Tap", "Hold", "Roll", "Mine", "Lift", "Fake"]),
  notemods: z.string().optional(),
  keysounds: z.string().optional(),
  hold: z.number().optional(),
  faked: z.boolean().optional(),
  warped: z.boolean().optional(),
  second: z.number().optional(),
  quant: z.number().optional(),
  parity: z
    .object({
      foot: z.enum(Foot).optional(),
      override: z
        .enum(Foot)
        .or(z.enum(["Left", "Right"]))
        .optional(),
      tech: z.string().optional(),
    })
    .optional(),
})

const TimingEventSchema = z.union([
  z.object({
    type: z.literal("BPMS"),
    beat: z.number(),
    value: z.number(),
  }),
  z.object({
    type: z.literal("STOPS"),
    beat: z.number(),
    value: z.number(),
  }),
  z.object({
    type: z.literal("WARPS"),
    beat: z.number(),
    value: z.number(),
  }),
  z.object({
    type: z.literal("DELAYS"),
    beat: z.number(),
    value: z.number(),
  }),
  z.object({
    type: z.literal("SCROLLS"),
    beat: z.number(),
    value: z.number(),
  }),
  z.object({
    type: z.literal("FAKES"),
    beat: z.number(),
    value: z.number(),
  }),
  z.object({
    type: z.literal("TICKCOUNTS"),
    beat: z.number(),
    value: z.number().int().nonnegative(),
  }),
  z.object({
    type: z.literal("LABELS"),
    beat: z.number(),
    value: z.string(),
  }),
  z.object({
    type: z.literal("SPEEDS"),
    beat: z.number(),
    value: z.number(),
    delay: z.number(),
    unit: z.enum(["B", "T"]),
  }),
  z.object({
    type: z.literal("TIMESIGNATURES"),
    beat: z.number(),
    upper: z.number().int().positive(),
    lower: z.number().int().positive(),
  }),
  z.object({
    type: z.literal("COMBOS"),
    beat: z.number(),
    hitMult: z.number().int().nonnegative(),
    missMult: z.number().int().nonnegative(),
  }),
  z.object({
    type: z.literal("ATTACKS"),
    second: z.number(),
    endType: z.enum(["LEN", "END"]),
    value: z.number(),
    mods: z.string(),
  }),
  z.object({
    type: z.literal("BGCHANGES"),
    beat: z.number(),
    file: z.string(),
    updateRate: z.number(),
    crossFade: z.boolean(),
    stretchRewind: z.boolean(),
    stretchNoLoop: z.boolean(),
    effect: z.string(),
    file2: z.string(),
    transition: z.string(),
    color1: z.string(),
    color2: z.string(),
  }),
  z.object({
    type: z.literal("FGCHANGES"),
    beat: z.number(),
    file: z.string(),
    updateRate: z.number(),
    crossFade: z.boolean(),
    stretchRewind: z.boolean(),
    stretchNoLoop: z.boolean(),
    effect: z.string(),
    file2: z.string(),
    transition: z.string(),
    color1: z.string(),
    color2: z.string(),
  }),
])

const TimingDataSchema = z.object({
  columns: z
    .record(
      z.string(),
      z.array(
        TimingEventSchema.and(
          z.object({
            beat: z.number().optional(),
            second: z.number().optional(),
          })
        )
      )
    )
    .superRefine((obj, ctx) => {
      for (const [type, events] of Object.entries(obj)) {
        if (!TIMING_EVENT_NAMES.includes(type as TimingEventType)) {
          ctx.addIssue({
            code: "invalid_value",
            values: [type],
            message: `Invalid timing event type: ${type}`,
          })
          continue
        }
        for (const event of events) {
          if (event.type !== type) {
            ctx.addIssue({
              code: "invalid_value",
              values: [event.type, type],
              message: `Event type ${event.type} does not match its column type ${type}`,
            })
          }
        }
      }
    }),
  offset: z.number().optional(),
})

const ChartPayloadSchema = z
  .object({
    chartName: z.string(),
    chartStyle: z.string(),
    gameTypeId: z.string().refine(id => {
      return GameTypeRegistry.getGameType(id) !== undefined
    }, "Invalid game type id"),
    credit: z.string(),
    description: z.string(),
    difficulty: z.enum(CHART_DIFFICULTIES),
    meter: z.number().int().nonnegative(),
    meterF: z.number().nonnegative(),
    _id: z.string(),
    notedata: z.array(NoteDataEntrySchema),
    timingData: TimingDataSchema,
    radarValues: z.string(),
    other_properties: z.record(z.string(), z.string()),
  })
  .superRefine((chart, ctx) => {
    const gameType = GameTypeRegistry.getGameType(chart.gameTypeId)!
    for (const [i, entry] of chart.notedata.entries()) {
      if (entry.col >= gameType.numCols) {
        ctx.addIssue({
          code: "invalid_value",
          values: [i, entry.col, gameType.numCols],
          message: `Notedata entry ${i} has invalid column ${entry.col} for game type ${gameType.id} (max ${gameType.numCols - 1})`,
        })
      }
    }
  })

const SMPayloadSchema = z.object({
  timingData: TimingDataSchema,
  charts: z.record(z.string(), ChartPayloadSchema),
  other_properties: z.record(z.string(), z.string()),
  properties: z
    .object({
      TITLE: z.string().optional(),
      SUBTITLE: z.string().optional(),
      ARTIST: z.string().optional(),
      TITLETRANSLIT: z.string().optional(),
      SUBTITLETRANSLIT: z.string().optional(),
      ARTISTTRANSLIT: z.string().optional(),
      GENRE: z.string().optional(),
      CREDIT: z.string().optional(),
      ORIGIN: z.string().optional(),
      BACKGROUND: z.string().optional(),
      BANNER: z.string().optional(),
      MUSIC: z.string().optional(),
      CDTITLE: z.string().optional(),
      JACKET: z.string().optional(),
      DISCIMAGE: z.string().optional(),
      CDIMAGE: z.string().optional(),
      PREVIEW: z.string().optional(),
      LYRICSPATH: z.string().optional(),
      SAMPLESTART: z.string().optional(),
      SAMPLELENGTH: z.string().optional(),
      SELECTABLE: z.string().optional(),
    })
    .partial(),
})

export type ChartPayload = z.infer<typeof ChartPayloadSchema>
export type SMPayload = z.infer<typeof SMPayloadSchema>

function createChartPayload(chart: Chart): ChartPayload {
  return {
    chartName: chart.chartName,
    chartStyle: chart.chartStyle,
    gameTypeId: chart.gameType.id,
    credit: chart.credit,
    description: chart.description,
    difficulty: chart.difficulty,
    meter: chart.meter,
    meterF: chart.meterF,
    _id: chart._id!,
    notedata: chart.getNotedata(),
    timingData: {
      columns: chart.timingData.getAllColumns(),
      offset: chart.timingData.hasChartOffset()
        ? chart.timingData.getOffset()
        : undefined,
    },
    radarValues: chart.radarValues,
    other_properties: chart.other_properties,
  }
}

export function createSMPayload(sm: Simfile): SMPayload {
  return {
    other_properties: sm.other_properties,
    properties: sm.properties,
    timingData: {
      columns: sm.timingData.getAllColumns(),
      offset: sm.timingData.getOffset(),
    },
    charts: Object.fromEntries(
      Object.entries(sm.charts).map(([key, chart]) => {
        return [key, createChartPayload(chart)]
      })
    ),
  }
}

export function validatePayload(payload: any) {
  const result = SMPayloadSchema.safeParse(payload)
  if (!result.success) {
    throw new Error(z.prettifyError(result.error))
  }
  return result.data
}

export async function createSMFromPayload(payload: SMPayload) {
  const blob = new Blob([DEFAULT_SM], { type: "text/plain" })
  const file = new File([blob], "song.sm", { type: "text/plain" })
  const sm = new Simfile(file)
  await sm.loaded

  applyPayloadToSM(sm, payload)

  return sm
}

export function applyPayloadToSM(sm: Simfile, payload: SMPayload) {
  sm.other_properties = payload.other_properties
  sm.properties = payload.properties
  Object.assign(sm.timingData, payload.timingData)

  const oldCharts = new Set(Object.keys(sm.charts))

  // load charts
  const usedIds = new Set()
  for (const [key, data] of Object.entries(payload.charts)) {
    const chartData: ChartPayload = data
    let chart = sm.charts[key]
    if (!chart) {
      chart = new Chart(sm)
      chart._id = key
      sm.addChart(chart)
    }
    if (usedIds.has(key)) {
      // duplicate id, create a new one
      delete chart._id
      sm.addChart(chart)
      console.warn(`Duplicate chart id ${key} found, created a new one`)
    }
    usedIds.add(key)

    Object.assign(chart, { sm })
    for (const key of [
      "chartName",
      "chartStyle",
      "credit",
      "description",
      "difficulty",
      "meter",
      "meterF",
      "radarValues",
      "other_properties",
    ] as const) {
      ;(chart as any)[key] = chartData[key]
    }

    // repopulate gameType
    chart.gameType = GameTypeRegistry.getGameType(chartData.gameTypeId)!

    Object.assign(chart.timingData, chartData.timingData)
    chart.timingData.reloadCache()
    chart._id = key

    chart.setNotedata(chartData.notedata as any)

    sm.charts[key] = chart
  }
  // remove deleted charts
  const deletedCharts = oldCharts.difference(usedIds)
  for (const id of deletedCharts) {
    sm.removeChart(sm.charts[id])
    console.log("removed chart with id " + id)
  }

  return sm
}
