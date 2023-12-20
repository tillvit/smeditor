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
        .map(flag => CHAR_MAP[flag])
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
}

export const FLAG_MAP: Record<BooleanFlags, { char: string; name: string }> = {
  viewMode: {
    char: "V",
    name: "Force view mode (disables record mode)",
  },
  menuBar: {
    char: "M",
    name: "Hide menu bar",
  },
  chartList: {
    char: "C",
    name: "Hide chart list (in development)",
  },
  barlines: {
    char: "B",
    name: "Hide barlines, waveform, and timing boxes",
  },
  assist: {
    char: "A",
    name: "Disable assist sounds",
  },
  recordMode: {
    char: "R",
    name: "Disable record mode",
  },
  playMode: {
    char: "P",
    name: "Disable play mode",
  },
  layout: {
    char: "L",
    name: "Hide note layout",
  },
  status: {
    char: "S",
    name: "Hide status bar",
  },
  autoPlay: {
    char: "a",
    name: "Play automatically",
  },
  openWindows: {
    char: "O",
    name: "Disable opening windows",
  },
  hidePoweredByText: {
    char: "H",
    name: `Hide "Powered by SMEditor" text`,
  },
}

const CHAR_MAP = Object.fromEntries(
  Object.entries(FLAG_MAP).map(([k, v]) => [v.char, k as BooleanFlags])
)

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
  hidePoweredByText: boolean
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
  hidePoweredByText: false,
  openWindows: true,
  url: null,
  chartIndex: null,
  chartType: null,
}
