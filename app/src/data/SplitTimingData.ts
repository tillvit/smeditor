import { ChartTimingData } from "../chart/sm/ChartTimingData"
import { TimingEventType } from "../chart/sm/TimingTypes"

export const SPLIT_TIMING_DATA = {
  chart: {
    title: "Chart Timing Column",
    desc: "Events in this column are only used by this difficulty",
    convertText: "Convert to song timing",
    buttonOne: {
      text: "Copy chart events",
      tooltip: "Copies chart events from this column to song timing",
      tooltipAll:
        "Copies offset and chart events from all columns to song timing",
      action: (timingData: ChartTimingData, type: TimingEventType) => {
        timingData.copyColumnsToSimfile([type])
      },
      actionAll: (timingData: ChartTimingData) => {
        timingData.copyAllToSimfile()
      },
    },
    buttonTwo: {
      text: "Delete chart events",
      tooltip:
        "Reverts this column to the events in song timing, deleting any difficulty-specific events",
      tooltipAll:
        "Reverts offset and all columns to the events in song timing, deleting any difficulty-specific events",
      action: (timingData: ChartTimingData, type: TimingEventType) => {
        timingData.deleteColumns([type])
      },
      actionAll: (timingData: ChartTimingData) => {
        timingData.deleteAllChartSpecific()
      },
    },
  },
  song: {
    title: "Song Timing Column",
    desc: "Events in this column are used by all difficulties (unless overridden)",
    convertText: "Convert to chart timing",
    buttonOne: {
      text: "Copy song events",
      tooltip: "Copies song events from this column to chart timing",
      tooltipAll:
        "Copies offset and song events from all columns to chart timing",
      action: (timingData: ChartTimingData, type: TimingEventType) => {
        timingData.copyColumnsFromSimfile([type])
      },
      actionAll: (timingData: ChartTimingData) => {
        timingData.copyAllFromSimfile()
      },
    },
    buttonTwo: {
      text: "Don't copy song events",
      tooltip:
        "Converts this column to chart timing without copying any song events",
      tooltipAll:
        "Converts offset and all columns to chart timing without copying any song events",
      action: (timingData: ChartTimingData, type: TimingEventType) => {
        timingData.createChartColumns([type])
      },
      actionAll: (timingData: ChartTimingData) => {
        timingData.createEmptyData()
      },
    },
  },
}

export const SPLIT_OFFSET_DATA = {
  chart: {
    title: "Chart Specific Offset",
    desc: "This offset is only used by this difficulty",
    convertText: "Convert to song timing",
    buttonOne: {
      text: "Copy chart offset",
      tooltip: "Sets the song offset to this chart offset",
      action: (timingData: ChartTimingData) => {
        timingData.copyOffsetToSimfile()
      },
    },
    buttonTwo: {
      text: "Revert to song offset",
      tooltip: "Reverts to the song offset, removing the chart-specific offset",
      action: (timingData: ChartTimingData) => {
        timingData.removeChartOffset()
      },
    },
  },
  song: {
    title: "Song Specific Offset",
    desc: "This offset is used by all difficulties (unless overridden)",
    convertText: "Convert to chart timing",
    buttonOne: {
      text: "Copy song offset",
      tooltip: "Copies song offset to the chart offset",
      action: (timingData: ChartTimingData) => {
        timingData.setOffset(timingData.getOffset())
      },
    },
    buttonTwo: {
      text: "Don't copy song offset",
      tooltip: "Sets the new chart offset to 0",
      action: (timingData: ChartTimingData) => {
        timingData.setOffset(0)
      },
    },
  },
}
