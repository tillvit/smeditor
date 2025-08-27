import { GameTypeRegistry } from "../../chart/gameTypes/GameTypeRegistry"
import { Chart } from "../../chart/sm/Chart"
import { ChartTimingData } from "../../chart/sm/ChartTimingData"
import { Simfile } from "../../chart/sm/Simfile"
import { SongTimingData } from "../../chart/sm/SongTimingData"
import { DEFAULT_SM } from "../../data/SMData"

const excludeKeys = [
  "gameLogic", // gameType
  "loaded", // sm loaded
  "stats", // chartstats
  "notedataRows", // can be regenerated
  "ignoredErrors", // probably not used
  "_cache", // can be regenerated
]

const excludeNoteKeys = ["warped", "fake", "second", "quant"]

export function createSMPayload(sm: Simfile): any {
  /* eslint-disable @typescript-eslint/no-unsafe-return */
  const payload = JSON.stringify(sm, (key, value: any) => {
    // exclude some useless stuff
    if (excludeKeys.includes(key)) return
    if (
      key == "chart" ||
      key == "sm" ||
      key == "songTimingData" ||
      key == "chartTimingDatas"
    )
      return // remove circular references
    if (Array.isArray(value) && key == "notedata") {
      return value.map(note => {
        const newNote = structuredClone(note)
        excludeNoteKeys.forEach(k => delete newNote[k])
        return newNote
      })
    }
    return value
  })
  return JSON.parse(payload)
  /* eslint-enable @typescript-eslint/no-unsafe-return */
}

export async function createSMFromPayload(payload: any) {
  const blob = new Blob([DEFAULT_SM], { type: "text/plain" })
  const file = new File([blob], "song.sm", { type: "text/plain" })
  const sm = new Simfile(file)
  await sm.loaded
  Object.assign(sm, {
    ...payload,
    timingData: null,
    charts: {},
  })
  sm.loaded = Promise.resolve()

  // load sm timing data
  const songTD = new SongTimingData(sm)
  Object.assign(songTD, payload.timingData)
  sm.timingData = songTD

  // load charts
  for (const [key, chartData] of Object.entries(payload.charts)) {
    const chart = new Chart(sm)
    Object.assign(chart, { ...(chartData as any), sm, timingData: null })
    const chartTD = new ChartTimingData(songTD, chart)
    Object.assign(chartTD, { ...(chartData as any).timingData })
    chart.timingData = chartTD
    chart.timingData.reloadCache()
    chart._id = key

    chart.recalculateNotes()
    chart.recalculateRows()

    sm.charts[key] = chart
  }

  return sm
}

export function applyPayloadToSM(sm: Simfile, payload: any) {
  const charts = payload.charts
  const songTimingData = payload.timingData
  delete payload.charts
  delete payload.timingData
  Object.assign(sm, payload)
  payload.charts = charts
  payload.timingData = songTimingData

  const songTD = sm.timingData
  Object.assign(songTD, songTimingData)
  sm.timingData = songTD

  const oldCharts = new Set(Object.keys(sm.charts))

  // load charts
  const usedIds = new Set()
  for (const [key, data] of Object.entries(charts)) {
    const chartData = data as any
    let chart = sm.charts[key]
    if (!chart) {
      chart = new Chart(sm)
      chart._id = key
      sm.addChart(chart)
      console.log("new chart created with id " + key)
    }
    if (usedIds.has(key)) {
      // duplicate id, create a new one
      delete chart._id
      sm.addChart(chart)
      console.warn(`Duplicate chart id ${key} found, created a new one`)
    }
    usedIds.add(key)

    const chartTimingData = chartData.timingData
    delete chartData.timingData
    Object.assign(chart, { ...chartData, sm })
    chartData.timingData = chartTimingData
    // repopulate gameType
    chart.gameType = GameTypeRegistry.getGameType(chartData.gameType.id)!

    const chartTD = chart.timingData
    Object.assign(chartTD, { ...chartTimingData })
    chart.timingData = chartTD
    chart.timingData.reloadCache()
    chart._id = key

    chart.recalculateRows()
    chart.recalculateStats()

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
