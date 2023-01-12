import { App } from "../App"
import { TimingData } from "../chart/sm/TimingData"
import { Dropdown } from "../gui/Dropdown"
import { NumberSpinner } from "../gui/NumberSpinner"
import { roundDigit } from "../util/Util"

type TimingDataWindowElement<T extends HTMLElement> = {
  create: (app: App, songTiming: () => boolean) => T
  update: (element: T, timingData: TimingData, beat: number) => void
}

type TimingDataWindowData = {
  title: string
  element: TimingDataWindowElement<any>
  dropdownElement?: TimingDataWindowElement<any>
}

const createElement = <T extends HTMLElement>(
  element: TimingDataWindowElement<T>
) => element

export const TIMING_WINDOW_DATA: { [key: string]: TimingDataWindowData } = {
  offset: {
    title: "Offset",
    element: createElement({
      create: (app, songTiming) => {
        const input = NumberSpinner.create(0, 0.001, 3)
        input.onChange = value => {
          if (!value) {
            input.setValue(
              app.chartManager.chart!.timingData.getTimingData("OFFSET")
            )
            return
          }
          app.chartManager.chart?.timingData.update(
            songTiming(),
            "OFFSET",
            value
          )
          app.chartManager.setBeat(app.chartManager.getBeat())
        }
        return input.view
      },
      update: (element, timingData) => {
        const value = timingData.getTimingData("OFFSET")
        const input: HTMLInputElement = element.querySelector(".spinner-input")!
        if (input.dataset.lastValue != value.toFixed(3)) {
          input.dataset.lastValue = value.toFixed(3)
          input.value = roundDigit(value, 3).toFixed(3)
        }
      },
    }),
  },
  bpm: {
    title: "BPM",
    element: createElement({
      create: (app, songTiming) => {
        const input = NumberSpinner.create(120, 0.001, 3)
        input.onChange = value => {
          if (!value) {
            const beat = app.chartManager.getBeat()
            app.chartManager.chart?.timingData.delete(
              songTiming(),
              "BPMS",
              beat
            )
            input.setValue(
              app.chartManager.chart?.timingData.getTimingEventAtBeat(
                "BPMS",
                beat
              )?.value ?? 120
            )
            return
          }
          app.chartManager.chart?.timingData.update(
            songTiming(),
            "BPMS",
            { value: value },
            app.chartManager.getBeat()
          )
        }
        return input.view
      },
      update: (element, timingData, beat) => {
        const value =
          timingData.getTimingEventAtBeat("BPMS", beat)?.value ?? 120
        const input: HTMLInputElement = element.querySelector(".spinner-input")!
        if (input.dataset.lastValue != value.toFixed(3)) {
          input.dataset.lastValue = value.toFixed(3)
          input.value = roundDigit(value, 3).toFixed(3)
        }
      },
    }),
  },
  stop: {
    title: "Stop",
    element: createElement({
      create: (app, songTiming) => {
        const input = NumberSpinner.create(0, 0.001, 3)
        input.onChange = value => {
          if (!value || value == 0) {
            const beat = app.chartManager.getBeat()
            app.chartManager.chart?.timingData.delete(
              songTiming(),
              "STOPS",
              beat
            )
            input.setValue(
              app.chartManager.chart?.timingData.getTimingEventAtBeat(
                "STOPS",
                beat
              )?.value ?? 0
            )
            return
          }
          app.chartManager.chart?.timingData.update(
            songTiming(),
            "STOPS",
            { value: value },
            app.chartManager.getBeat()
          )
        }
        return input.view
      },
      update: (element, timingData, beat) => {
        const event = timingData.getTimingEventAtBeat("STOPS", beat)
        let value = event?.value ?? 0
        if (beat != event?.beat) value = 0
        const input: HTMLInputElement = element.querySelector(".spinner-input")!
        if (input.dataset.lastValue != value.toFixed(3)) {
          input.dataset.lastValue = value.toFixed(3)
          input.value = roundDigit(value, 3).toFixed(3)
        }
      },
    }),
  },
  delay: {
    title: "Delay",
    element: createElement({
      create: (app, songTiming) => {
        const input = NumberSpinner.create(0, 0.001, 3)
        input.onChange = value => {
          if (!value || value == 0) {
            const beat = app.chartManager.getBeat()
            app.chartManager.chart?.timingData.delete(
              songTiming(),
              "DELAYS",
              beat
            )
            input.setValue(
              app.chartManager.chart?.timingData.getTimingEventAtBeat(
                "DELAYS",
                beat
              )?.value ?? 0
            )
            return
          }
          app.chartManager.chart?.timingData.update(
            songTiming(),
            "DELAYS",
            { value: value },
            app.chartManager.getBeat()
          )
        }
        return input.view
      },
      update: (element, timingData, beat) => {
        const event = timingData.getTimingEventAtBeat("DELAYS", beat)
        let value = event?.value ?? 0
        if (beat != event?.beat) value = 0
        const input: HTMLInputElement = element.querySelector(".spinner-input")!
        if (input.dataset.lastValue != value.toFixed(3)) {
          input.dataset.lastValue = value.toFixed(3)
          input.value = roundDigit(value, 3).toFixed(3)
        }
      },
    }),
  },
  warp: {
    title: "Warp",
    element: createElement({
      create: (app, songTiming) => {
        const input = NumberSpinner.create(0, 0.001, 3, 0)
        input.onChange = value => {
          if (!value || value == 0) {
            const beat = app.chartManager.getBeat()
            app.chartManager.chart?.timingData.delete(
              songTiming(),
              "WARPS",
              beat
            )
            input.setValue(
              app.chartManager.chart?.timingData.getTimingEventAtBeat(
                "WARPS",
                beat
              )?.value ?? 0
            )
            return
          }
          if (value < 0) {
            const beat = app.chartManager.getBeat()
            input.setValue(
              app.chartManager.chart?.timingData.getTimingEventAtBeat(
                "WARPS",
                beat
              )?.value ?? 0
            )
            return
          }
          app.chartManager.chart?.timingData.update(
            songTiming(),
            "WARPS",
            { value: value },
            app.chartManager.getBeat()
          )
        }
        return input.view
      },
      update: (element, timingData, beat) => {
        const event = timingData.getTimingEventAtBeat("WARPS", beat)
        let value = event?.value ?? 0
        if (beat != event?.beat) value = 0
        const input: HTMLInputElement = element.querySelector(".spinner-input")!
        if (input.dataset.lastValue != value.toFixed(3)) {
          input.dataset.lastValue = value.toFixed(3)
          input.value = roundDigit(value, 3).toFixed(3)
        }
      },
    }),
  },

  timeSig: {
    title: "Time Sig.",
    element: createElement({
      create: (app, songTiming) => {
        const container = document.createElement("div")
        container.classList.add("flex-column-gap")
        const upperInput = NumberSpinner.create(4, 1, 0, 1)
        upperInput.onChange = value => {
          if (!value) {
            const beat = app.chartManager.getBeat()
            app.chartManager.chart?.timingData.delete(
              songTiming(),
              "TIMESIGNATURES",
              beat
            )
            upperInput.setValue(
              app.chartManager.chart?.timingData.getTimingEventAtBeat(
                "TIMESIGNATURES",
                beat
              )?.upper ?? 4
            )
            return
          }
          if (value < 1) {
            const beat = app.chartManager.getBeat()
            upperInput.setValue(
              app.chartManager.chart?.timingData.getTimingEventAtBeat(
                "TIMESIGNATURES",
                beat
              )?.upper ?? 4
            )
            return
          }
          app.chartManager.chart?.timingData.update(
            songTiming(),
            "TIMESIGNATURES",
            { upper: value, lower: lowerInput.value },
            app.chartManager.getBeat()
          )
        }
        const lowerInput = NumberSpinner.create(4, 1, 0, 1)
        lowerInput.onChange = value => {
          if (!value) {
            const beat = app.chartManager.getBeat()
            app.chartManager.chart?.timingData.delete(
              songTiming(),
              "TIMESIGNATURES",
              beat
            )
            lowerInput.setValue(
              app.chartManager.chart?.timingData.getTimingEventAtBeat(
                "TIMESIGNATURES",
                beat
              )?.lower ?? 4
            )
            return
          }
          if (value < 1) {
            const beat = app.chartManager.getBeat()
            lowerInput.setValue(
              app.chartManager.chart?.timingData.getTimingEventAtBeat(
                "TIMESIGNATURES",
                beat
              )?.lower ?? 4
            )
            return
          }
          app.chartManager.chart?.timingData.update(
            songTiming(),
            "TIMESIGNATURES",
            { upper: upperInput.value, lower: value },
            app.chartManager.getBeat()
          )
        }

        container.appendChild(upperInput.view)
        container.appendChild(lowerInput.view)
        return container
      },
      update: (element, timingData, beat) => {
        const event = timingData.getTimingEventAtBeat("TIMESIGNATURES", beat)
        const upper = event?.upper ?? 4
        const lower = event?.lower ?? 4
        const upperInput: HTMLInputElement =
          element.firstElementChild!.querySelector(".spinner-input")!
        if (upperInput.dataset.lastValue != Math.round(upper).toString()) {
          upperInput.dataset.lastValue = Math.round(upper).toString()
          upperInput.value = Math.round(upper).toString()
        }
        const lowerInput: HTMLDivElement =
          element.lastElementChild!.querySelector(".spinner-input")!
        if (lowerInput.dataset.lastValue != Math.round(lower).toString()) {
          lowerInput.dataset.lastValue = Math.round(lower).toString()
          lowerInput.innerText = Math.round(lower).toString()
        }
      },
    }),
  },
  tick: {
    title: "Tickcount",
    element: createElement({
      create: (app, songTiming) => {
        const input = NumberSpinner.create(4, 1, 0, 0)
        input.onChange = value => {
          if (!value) {
            const beat = app.chartManager.getBeat()
            app.chartManager.chart?.timingData.delete(
              songTiming(),
              "TICKCOUNTS",
              beat
            )
            input.setValue(
              app.chartManager.chart?.timingData.getTimingEventAtBeat(
                "TICKCOUNTS",
                beat
              )?.value ?? 0
            )
            return
          }
          if (value < 0) {
            const beat = app.chartManager.getBeat()
            input.setValue(
              app.chartManager.chart?.timingData.getTimingEventAtBeat(
                "TICKCOUNTS",
                beat
              )?.value ?? 0
            )
            return
          }

          app.chartManager.chart?.timingData.update(
            songTiming(),
            "TICKCOUNTS",
            { value: value },
            app.chartManager.getBeat()
          )
        }
        return input.view
      },
      update: (element, timingData, beat) => {
        const value =
          timingData.getTimingEventAtBeat("TICKCOUNTS", beat)?.value ?? 4
        const input: HTMLInputElement = element.querySelector(".spinner-input")!
        if (input.dataset.lastValue != Math.round(value).toString()) {
          input.dataset.lastValue = Math.round(value).toString()
          input.value = Math.round(value).toString()
        }
      },
    }),
  },
  combo: {
    title: "Combo",
    element: createElement({
      create: (app, songTiming) => {
        const container = document.createElement("div")
        container.classList.add("flex-column-gap")
        const upperInput = NumberSpinner.create(1, 1, 0, 0)
        upperInput.onChange = value => {
          if (!value) {
            const beat = app.chartManager.getBeat()
            app.chartManager.chart?.timingData.delete(
              songTiming(),
              "COMBOS",
              beat
            )
            upperInput.setValue(
              app.chartManager.chart?.timingData.getTimingEventAtBeat(
                "COMBOS",
                beat
              )?.hitMult ?? 1
            )
            return
          }
          if (value < 0) {
            const beat = app.chartManager.getBeat()
            upperInput.setValue(
              app.chartManager.chart?.timingData.getTimingEventAtBeat(
                "COMBOS",
                beat
              )?.hitMult ?? 1
            )
            return
          }
          app.chartManager.chart?.timingData.update(
            songTiming(),
            "COMBOS",
            { hitMult: value, missMult: lowerInput.value },
            app.chartManager.getBeat()
          )
        }
        const lowerInput = NumberSpinner.create(1, 1, 0, 0)
        lowerInput.onChange = value => {
          if (!value) {
            const beat = app.chartManager.getBeat()
            app.chartManager.chart?.timingData.delete(
              songTiming(),
              "COMBOS",
              beat
            )
            lowerInput.setValue(
              app.chartManager.chart?.timingData.getTimingEventAtBeat(
                "COMBOS",
                beat
              )?.missMult ?? 1
            )
            return
          }
          if (value < 0) {
            const beat = app.chartManager.getBeat()
            lowerInput.setValue(
              app.chartManager.chart?.timingData.getTimingEventAtBeat(
                "COMBOS",
                beat
              )?.missMult ?? 1
            )
            return
          }
          app.chartManager.chart?.timingData.update(
            songTiming(),
            "COMBOS",
            { hitMult: value, missMult: lowerInput.value },
            app.chartManager.getBeat()
          )
        }

        container.appendChild(upperInput.view)
        container.appendChild(lowerInput.view)
        return container
      },
      update: (element, timingData, beat) => {
        const event = timingData.getTimingEventAtBeat("COMBOS", beat)
        const hitMult = event?.hitMult ?? 1
        const missMult = event?.missMult ?? 1
        const upperInput: HTMLInputElement =
          element.firstElementChild!.querySelector(".spinner-input")!
        if (upperInput.dataset.lastValue != Math.round(hitMult).toString()) {
          upperInput.dataset.lastValue = Math.round(hitMult).toString()
          upperInput.value = Math.round(hitMult).toString()
        }
        const lowerInput: HTMLInputElement =
          element.lastElementChild!.querySelector(".spinner-input")!
        if (lowerInput.dataset.lastValue != Math.round(missMult).toString()) {
          lowerInput.dataset.lastValue = Math.round(missMult).toString()
          lowerInput.value = Math.round(missMult).toString()
        }
      },
    }),
  },
  speed: {
    title: "Speed",
    element: createElement({
      create: (app, songTiming) => {
        const container = document.createElement("div")
        container.classList.add("flex-column-gap")

        const update = () => {
          app.chartManager.chart?.timingData.update(
            songTiming(),
            "SPEEDS",
            {
              value: valueInput.value,
              delay: delayInput.value,
              unit: unitDropdown.value == "Beats" ? "B" : "T",
            },
            app.chartManager.getBeat()
          )
        }

        const valueInput = NumberSpinner.create(1, 0.1, 0)
        valueInput.onChange = value => {
          if (!value) {
            const beat = app.chartManager.getBeat()
            app.chartManager.chart?.timingData.delete(
              songTiming(),
              "SPEEDS",
              beat
            )
            valueInput.setValue(
              app.chartManager.chart?.timingData.getTimingEventAtBeat(
                "SPEEDS",
                beat
              )?.value ?? 1
            )
            return
          }
          if (value < 0) {
            const beat = app.chartManager.getBeat()
            valueInput.setValue(
              app.chartManager.chart?.timingData.getTimingEventAtBeat(
                "SPEEDS",
                beat
              )?.value ?? 1
            )
            return
          }
          update()
        }

        const delayInput = NumberSpinner.create(1, 0.1, 0)
        delayInput.onChange = value => {
          if (!value || value < 0) {
            const beat = app.chartManager.getBeat()
            delayInput.setValue(
              app.chartManager.chart?.timingData.getTimingEventAtBeat(
                "SPEEDS",
                beat
              )?.delay ?? 0
            )
            return
          }
          update()
        }

        const unitDropdown = Dropdown.create(["Beat", "Time"], "Beats")
        unitDropdown.onChange = update

        container.appendChild(valueInput.view)
        container.appendChild(delayInput.view)
        container.appendChild(unitDropdown.view)
        return container
      },
      update: (element, timingData, beat) => {
        const event = timingData.getTimingEventAtBeat("SPEEDS", beat)
        const value = event?.value ?? 1
        const delay = event?.delay ?? 0
        const unit = event?.unit == "B" ? "Beat" : "Time"
        const valueInput: HTMLInputElement =
          element.firstElementChild!.querySelector(".spinner-input")!
        if (valueInput.dataset.lastValue != roundDigit(value, 3).toString()) {
          valueInput.dataset.lastValue = roundDigit(value, 3).toString()
          valueInput.value = roundDigit(value, 3).toString()
        }
        const delayInput: HTMLInputElement =
          element.children[1].querySelector(".spinner-input")!
        if (delayInput.dataset.lastValue != roundDigit(delay, 3).toString()) {
          delayInput.dataset.lastValue = roundDigit(delay, 3).toString()
          delayInput.value = roundDigit(delay, 3).toString()
        }
        delayInput.disabled = event?.beat != beat

        const unitInput: HTMLDivElement =
          element.lastElementChild!.querySelector(".dropdown-selected")!
        if (unitInput.dataset.lastValue != unit) {
          unitInput.dataset.lastValue = unit
          unitInput.innerText = unit
        }

        if (event?.beat != beat) unitInput.classList.add("disabled")
        else unitInput.classList.remove("disabled")
      },
    }),
  },
  scroll: {
    title: "Scroll",
    element: createElement({
      create: (app, songTiming) => {
        const input = NumberSpinner.create(1, 0.001, 3)
        input.onChange = value => {
          if (!value) {
            const beat = app.chartManager.getBeat()
            app.chartManager.chart?.timingData.delete(
              songTiming(),
              "SCROLLS",
              beat
            )
            input.setValue(
              app.chartManager.chart?.timingData.getTimingEventAtBeat(
                "SCROLLS",
                beat
              )?.value ?? 1
            )
            return
          }
          app.chartManager.chart?.timingData.update(
            songTiming(),
            "SCROLLS",
            { value: value },
            app.chartManager.getBeat()
          )
        }
        return input.view
      },
      update: (element, timingData, beat) => {
        const value =
          timingData.getTimingEventAtBeat("SCROLLS", beat)?.value ?? 1
        const input: HTMLInputElement = element.querySelector(".spinner-input")!
        if (input.dataset.lastValue != value.toFixed(3)) {
          input.dataset.lastValue = value.toFixed(3)
          input.value = roundDigit(value, 3).toFixed(3)
        }
      },
    }),
  },
  fake: {
    title: "Fake",
    element: createElement({
      create: (app, songTiming) => {
        const input = NumberSpinner.create(1, 0.001, 3, 0)
        input.onChange = value => {
          if (!value) {
            const beat = app.chartManager.getBeat()
            app.chartManager.chart?.timingData.delete(
              songTiming(),
              "FAKES",
              beat
            )
            input.setValue(
              app.chartManager.chart?.timingData.getTimingEventAtBeat(
                "FAKES",
                beat
              )?.value ?? 0
            )
            return
          }
          if (value < 0) {
            const beat = app.chartManager.getBeat()
            input.setValue(
              app.chartManager.chart?.timingData.getTimingEventAtBeat(
                "FAKES",
                beat
              )?.value ?? 0
            )
            return
          }
          app.chartManager.chart?.timingData.update(
            songTiming(),
            "FAKES",
            { value: value },
            app.chartManager.getBeat()
          )
        }
        return input.view
      },
      update: (element, timingData, beat) => {
        const event = timingData.getTimingEventAtBeat("FAKES", beat)
        let value = event?.value ?? 1
        if (beat != event?.beat) value = 0
        const input: HTMLInputElement = element.querySelector(".spinner-input")!
        if (input.dataset.lastValue != value.toFixed(3)) {
          input.dataset.lastValue = value.toFixed(3)
          input.value = roundDigit(value, 3).toFixed(3)
        }
      },
    }),
  },
  label: {
    title: "Label",
    element: createElement({
      create: (app, songTiming) => {
        const input = document.createElement("input")
        input.type = "text"
        input.onkeydown = ev => {
          if (ev.key == "Enter") input.blur()
        }
        input.onblur = () => {
          if (input.value == "") {
            const beat = app.chartManager.getBeat()
            app.chartManager.chart?.timingData.delete(
              songTiming(),
              "LABELS",
              beat
            )
            input.value =
              app.chartManager.chart?.timingData.getTimingEventAtBeat(
                "LABELS",
                beat
              )?.value ?? ""

            return
          }
          app.chartManager.chart?.timingData.update(
            songTiming(),
            "LABELS",
            { value: input.value },
            app.chartManager.getBeat()
          )
        }
        return input
      },
      update: (element, timingData, beat) => {
        const event = timingData.getTimingEventAtBeat("LABELS", beat)
        const value = event?.value ?? ""
        const input: HTMLInputElement = element
        if (input.dataset.lastValue != value) {
          input.dataset.lastValue = value
          input.value = value
        }
      },
    }),
  },
}
