import { GameTypeRegistry } from "../chart/gameTypes/GameTypeRegistry"
import { WaterfallManager } from "../gui/element/WaterfallManager"

type BooleanFlags = {
  [K in keyof URLFlags]-?: URLFlags[K] extends boolean ? K : never
}[keyof URLFlags]

export function loadFlags() {
  const params = new URLSearchParams(location.search)
  const flags = params.get("flags")
  if (flags != null) {
    const setFlags = new Set(
      flags
        .split("")
        .map(flag => switchMap[flag])
        .filter(flag => flag)
    )
    for (const flag of setFlags.values()) {
      Flags[flag] = !Flags[flag]
    }
  }
  const url = params.get("url")
  if (url != null) {
    try {
      Flags.url = new URL(url).toString()
    } catch {
      WaterfallManager.createFormatted("Invalid url " + url, "warn")
      Flags.url = null
    }
  }
  const chartIndex = params.get("chartIndex")
  if (chartIndex != null) {
    try {
      Flags.chartIndex = parseInt(chartIndex)
    } catch {
      WaterfallManager.createFormatted(
        "Invalid chartIndex " + chartIndex,
        "warn"
      )
      Flags.chartIndex = null
    }
  }
  const chartType = params.get("chartType")
  if (chartType !== null) {
    if (!GameTypeRegistry.getGameType(chartType)) {
      WaterfallManager.createFormatted("Invalid chartType " + chartType, "warn")
      Flags.chartType = null
    } else {
      Flags.chartType = chartType
    }
  }
  console.log(Flags)
}

const switchMap: Record<string, BooleanFlags> = {
  V: "viewMode",
  M: "menuBar",
  C: "chartList",
  B: "barlines",
  A: "assist",
  R: "recordMode",
  P: "playMode",
  L: "layout",
  S: "status",
  a: "autoPlay",
  O: "openWindows",
}

interface URLFlags {
  viewMode: boolean
  menuBar: boolean
  chartList: boolean
  barlines: boolean
  assist: boolean
  recordMode: boolean
  playMode: boolean
  layout: boolean
  status: boolean
  autoPlay: boolean
  openWindows: boolean
  url: string | null
  chartIndex: number | null
  chartType: string | null
}

export const Flags: URLFlags = {
  viewMode: false,
  menuBar: true,
  chartList: true,
  barlines: true,
  assist: true,
  recordMode: true,
  playMode: true,
  layout: true,
  status: true,
  autoPlay: false,
  openWindows: true,
  url: null,
  chartIndex: null,
  chartType: null,
}
