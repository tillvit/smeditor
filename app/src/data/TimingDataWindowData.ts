import { App } from "../App"
import {
  TIMING_DATA_DISPLAY_PRECISION,
  TIMING_DATA_PRECISION,
  TimingData,
} from "../chart/sm/TimingData"
import { Dropdown } from "../gui/element/Dropdown"
import { NumberSpinner } from "../gui/element/NumberSpinner"
import { Options } from "../util/Options"

type TimingDataWindowInputs = {
  data: any[]
}

type TimingDataWindowElement = {
  create: (this: TimingDataWindowInputs, app: App) => HTMLElement
  update: (
    this: TimingDataWindowInputs,
    timingData: TimingData,
    beat: number
  ) => void
}

type TimingDataWindowData = {
  title: string
  element: TimingDataWindowElement
}

const precisionSettings = {
  precision: TIMING_DATA_PRECISION,
  minPrecision: TIMING_DATA_DISPLAY_PRECISION,
  value: 0,
}

function createSimpleData(
  type: "BPMS" | "STOPS" | "WARPS" | "DELAYS" | "SCROLLS" | "FAKES"
) {
  return {
    create: function (app: App) {
      const input = NumberSpinner.create({
        ...precisionSettings,
        value: 0,
        min: type == "WARPS" ? 0 : -Number.MAX_VALUE,
        onChange: value => {
          const timingData = app.chartManager.loadedChart!.timingData
          const beat = Math.round(app.chartManager.beat * 48) / 48
          if (value == undefined) {
            timingData.deleteColumnEvents([{ type, beat }])
            return
          }
          timingData.insertColumnEvents([{ type, beat, value }])
        },
      })
      this.data = [input]
      return input.view
    },
    update: function (timingData: TimingData, beat: number) {
      const spinner: NumberSpinner = this.data[0]
      if (document.activeElement == spinner.input) return
      spinner.value = timingData.getOffset()
      const event = timingData.getEventAtBeat(type, beat)
      let value = event?.value ?? 0
      if (
        TimingData.getColumnType(type) == "instant" &&
        (!event || Math.abs(event.beat - beat) > 1 / 48)
      ) {
        value = 0
      }
      spinner.value = value
    },
  } satisfies TimingDataWindowElement
}

export const TIMING_WINDOW_DATA: { [key: string]: TimingDataWindowData } = {
  offset: {
    title: "Offset",
    element: {
      create: function (app: App) {
        const input = NumberSpinner.create({
          ...precisionSettings,
          step: Options.general.spinnerStep / 100,
          onChange: value => {
            const timingData = app.chartManager.loadedChart!.timingData
            if (value == undefined) return
            if (timingData.hasChartOffset()) {
              timingData.setOffset(value)
            } else {
              timingData.songTimingData.setOffset(value)
            }
          },
        })
        this.data.push(input)
        return input.view
      },
      update: function (timingData: TimingData) {
        const offsetSpinner: NumberSpinner = this.data[0]
        if (document.activeElement == offsetSpinner.input) return
        offsetSpinner.value = timingData.getOffset()
      },
    },
  },
  bpm: {
    title: "BPM",
    element: createSimpleData("BPMS"),
  },
  stop: {
    title: "Stop",
    element: createSimpleData("STOPS"),
  },
  delay: {
    title: "Delay",
    element: createSimpleData("DELAYS"),
  },
  warp: {
    title: "Warp",
    element: createSimpleData("WARPS"),
  },

  timeSig: {
    title: "Time Sig.",
    element: {
      create: function (app: App) {
        const container = document.createElement("div")
        container.classList.add("flex-column-gap")
        const upperInput = NumberSpinner.create({
          value: 4,
          step: 1,
          precision: 0,
          min: 1,
          onChange: value => {
            const timingData = app.chartManager.loadedChart!.timingData
            const beat = Math.round(app.chartManager.beat * 48) / 48
            if (value == undefined) {
              timingData.deleteColumnEvents([{ type: "TIMESIGNATURES", beat }])
              return
            }
            if (value < 1) return
            timingData.insertColumnEvents([
              {
                type: "TIMESIGNATURES",
                beat,
                upper: value,
                lower: lowerInput.value,
              },
            ])
          },
        })
        const lowerInput = NumberSpinner.create({
          value: 4,
          step: 1,
          precision: 0,
          min: 1,
          onChange: value => {
            const timingData = app.chartManager.loadedChart!.timingData
            const beat = Math.round(app.chartManager.beat * 48) / 48
            if (value == undefined) {
              timingData.deleteColumnEvents([{ type: "TIMESIGNATURES", beat }])
              return
            }
            if (value < 1) return
            timingData.insertColumnEvents([
              {
                type: "TIMESIGNATURES",
                beat,
                upper: upperInput.value,
                lower: value,
              },
            ])
          },
        })
        container.appendChild(upperInput.view)
        container.appendChild(lowerInput.view)
        this.data = [upperInput, lowerInput]
        return container
      },
      update: function (timingData: TimingData, beat: number) {
        const upperInput: NumberSpinner = this.data[0]
        const lowerInput: NumberSpinner = this.data[1]
        const event = timingData.getEventAtBeat("TIMESIGNATURES", beat)
        const upper = event?.upper ?? 4
        const lower = event?.lower ?? 4
        if (document.activeElement != upperInput.input)
          upperInput.value = Math.round(upper)
        if (document.activeElement != lowerInput.input)
          lowerInput.value = Math.round(lower)
      },
    },
  },
  tick: {
    title: "Tickcount",
    element: {
      create: function (app: App) {
        const input = NumberSpinner.create({
          value: 4,
          step: 1,
          precision: 0,
          min: 0,
          onChange: value => {
            const timingData = app.chartManager.loadedChart!.timingData
            const beat = Math.round(app.chartManager.beat * 48) / 48
            if (value == undefined) {
              timingData.deleteColumnEvents([{ type: "TICKCOUNTS", beat }])
              return
            }
            if (value < 0) return
            timingData.insertColumnEvents([{ type: "TICKCOUNTS", beat, value }])
          },
        })
        this.data = [input]
        return input.view
      },
      update: function (timingData: TimingData, beat: number) {
        const spinner: NumberSpinner = this.data[0]
        if (document.activeElement == spinner.input) return
        const value = timingData.getEventAtBeat("TICKCOUNTS", beat)?.value ?? 4
        spinner.value = Math.round(value)
      },
    },
  },
  combo: {
    title: "Combo",
    element: {
      create: function (app: App) {
        const container = document.createElement("div")
        container.classList.add("flex-column-gap")
        const upperInput = NumberSpinner.create({
          value: 1,
          step: 1,
          precision: 0,
          min: 0,
          onChange: value => {
            const timingData = app.chartManager.loadedChart!.timingData
            const beat = Math.round(app.chartManager.beat * 48) / 48
            if (value == undefined) {
              timingData.deleteColumnEvents([{ type: "COMBOS", beat }])
              return
            }
            if (value < 0) return
            timingData.insertColumnEvents([
              {
                type: "COMBOS",
                beat: beat,
                hitMult: value,
                missMult: lowerInput.value,
              },
            ])
          },
        })
        const lowerInput = NumberSpinner.create({
          value: 1,
          step: 1,
          precision: 0,
          min: 0,
          onChange: value => {
            const timingData = app.chartManager.loadedChart!.timingData
            const beat = Math.round(app.chartManager.beat * 48) / 48
            if (value == undefined) {
              lowerInput.value =
                app.chartManager.loadedChart?.timingData.getEventAtBeat(
                  "COMBOS",
                  beat
                )?.missMult ?? 1
              return
            }
            if (value < 0) return
            timingData.insertColumnEvents([
              {
                type: "COMBOS",
                beat,
                hitMult: upperInput.value,
                missMult: value,
              },
            ])
          },
        })
        container.appendChild(upperInput.view)
        container.appendChild(lowerInput.view)
        this.data = [upperInput, lowerInput]
        return container
      },
      update: function (timingData: TimingData, beat: number) {
        const upperInput: NumberSpinner = this.data[0]
        const lowerInput: NumberSpinner = this.data[1]
        const event = timingData.getEventAtBeat("COMBOS", beat)
        const hitMult = event?.hitMult ?? 1
        const missMult = event?.missMult ?? 1
        if (document.activeElement != upperInput.input) {
          upperInput.value = Math.round(hitMult)
        }
        if (document.activeElement != lowerInput.input) {
          lowerInput.value = Math.round(missMult)
        }
      },
    },
  },
  speed: {
    title: "Speed",
    element: {
      create: function (app: App) {
        const container = document.createElement("div")
        container.classList.add("flex-column-gap")

        const update = () => {
          const timingData = app.chartManager.loadedChart!.timingData
          const beat = Math.round(app.chartManager.beat * 48) / 48
          timingData.insertColumnEvents([
            {
              type: "SPEEDS",
              beat,
              value: valueInput.value,
              delay: delayInput.value,
              unit: unitDropdown.value == "Beats" ? "B" : "T",
            },
          ])
        }

        const valueInput = NumberSpinner.create({
          ...precisionSettings,
          value: 1,
          step: 0.1,
          onChange: value => {
            const timingData = app.chartManager.loadedChart!.timingData
            const beat = Math.round(app.chartManager.beat * 48) / 48
            if (value == undefined) {
              timingData.deleteColumnEvents([{ type: "SPEEDS", beat }])
              return
            }
            update()
          },
        })

        const delayInput = NumberSpinner.create({
          ...precisionSettings,
          value: 1,
          step: 0.1,
          min: 0,
          onChange: value => {
            if (value == undefined || value < 0) return
            update()
          },
        })

        const unitDropdown = Dropdown.create(["Beats", "Time"], "Beats")
        unitDropdown.onChange(update)

        container.appendChild(valueInput.view)
        container.appendChild(delayInput.view)
        container.appendChild(unitDropdown.view)

        this.data = [valueInput, delayInput, unitDropdown]
        return container
      },
      update: function (timingData: TimingData, beat: number) {
        const valueInput: NumberSpinner = this.data[0]
        const delayInput: NumberSpinner = this.data[1]
        const unitDropdown: Dropdown<string> = this.data[2]

        const event = timingData.getEventAtBeat("SPEEDS", beat)
        const value = event?.value ?? 1
        const delay = event?.delay ?? 0
        const unit = event?.unit == "B" ? "Beats" : "Time"
        if (document.activeElement != valueInput.input) {
          valueInput.value = value
        }
        if (document.activeElement != delayInput.input) {
          delayInput.value = delay
        }
        const occuringSameBeat = event && Math.abs(event.beat - beat) < 1 / 48
        delayInput.disabled = !occuringSameBeat

        if (unitDropdown.value != unit) {
          unitDropdown.setSelected(unit)
        }
        unitDropdown.disabled = !occuringSameBeat
      },
    },
  },
  scroll: {
    title: "Scroll",
    element: createSimpleData("SCROLLS"),
  },
  fake: {
    title: "Fake",
    element: createSimpleData("FAKES"),
  },
  label: {
    title: "Label",
    element: {
      create: function (app: App) {
        const input = document.createElement("input")
        input.type = "text"
        input.autocomplete = "off"
        input.spellcheck = false
        input.onkeydown = ev => {
          if (ev.key == "Enter") input.blur()
        }
        input.onblur = () => {
          const timingData = app.chartManager.loadedChart!.timingData
          const beat = Math.round(app.chartManager.beat * 48) / 48
          if (input.value == "") {
            timingData.deleteColumnEvents([{ type: "LABELS", beat }])
            return
          }
          timingData.insertColumnEvents([
            {
              type: "LABELS",
              beat,
              value: input.value,
            },
          ])
        }
        this.data = [input]
        return input
      },
      update: function (timingData: TimingData, beat: number) {
        const input: HTMLInputElement = this.data[0]
        if (document.activeElement == input) return
        const event = timingData.getEventAtBeat("LABELS", beat)
        const value = event?.value ?? ""
        if (input.value != value) {
          input.value = value
        }
      },
    },
  },
}
