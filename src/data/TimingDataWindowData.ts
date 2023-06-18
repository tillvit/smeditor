import { App } from "../App"
import { TimingData } from "../chart/sm/TimingData"
import { Dropdown } from "../gui/element/Dropdown"
import { NumberSpinner } from "../gui/element/NumberSpinner"
import { roundDigit } from "../util/Util"

type TimingDataWindowElement<T extends HTMLElement> = {
  create: (app: App, isSongTiming: () => boolean) => T
  update: (element: T, timingData: TimingData, beat: number) => void
}

type TimingDataWindowData = {
  title: string
  element: TimingDataWindowElement<any>
}

const createElement = <T extends HTMLElement>(
  element: TimingDataWindowElement<T>
) => element

export const TIMING_WINDOW_DATA: { [key: string]: TimingDataWindowData } = {
  offset: {
    title: "Offset",
    element: createElement({
      create: (app, isSongTiming) => {
        const input = NumberSpinner.create(0, 0.001, 3)
        input.onChange = value => {
          if (value == undefined) return
          app.chartManager.loadedChart?.timingData.insert(
            isSongTiming(),
            "OFFSET",
            value
          )
          app.chartManager.setBeat(app.chartManager.getBeat())
        }
        return input.view
      },
      update: (element, timingData) => {
        const input: HTMLInputElement = element.querySelector(".spinner-input")!
        if (document.activeElement == input) return
        const value = timingData.getTimingData("OFFSET")
        if (input.value != roundDigit(value, 3).toFixed(3)) {
          input.value = roundDigit(value, 3).toFixed(3)
        }
      },
    }),
  },
  bpm: {
    title: "BPM",
    element: createElement({
      create: (app, isSongTiming) => {
        const input = NumberSpinner.create(120, undefined, 3)
        input.onChange = value => {
          if (value == undefined) {
            const beat = app.chartManager.getBeat()
            app.chartManager.loadedChart?.timingData.delete(
              isSongTiming(),
              "BPMS",
              beat
            )
            return
          }
          app.chartManager.loadedChart?.timingData.insert(
            isSongTiming(),
            "BPMS",
            { value: value },
            app.chartManager.getBeat()
          )
        }
        return input.view
      },
      update: (element, timingData, beat) => {
        const input: HTMLInputElement = element.querySelector(".spinner-input")!
        if (document.activeElement == input) return
        const value =
          timingData.getTimingEventAtBeat("BPMS", beat)?.value ?? 120
        if (input.value != roundDigit(value, 3).toFixed(3)) {
          input.value = roundDigit(value, 3).toFixed(3)
        }
      },
    }),
  },
  stop: {
    title: "Stop",
    element: createElement({
      create: (app, isSongTiming) => {
        const input = NumberSpinner.create(0, undefined, 3)
        input.onChange = value => {
          if (value == undefined || value == 0) {
            const beat = app.chartManager.getBeat()
            app.chartManager.loadedChart?.timingData.delete(
              isSongTiming(),
              "STOPS",
              beat
            )
            return
          }
          app.chartManager.loadedChart?.timingData.insert(
            isSongTiming(),
            "STOPS",
            { value: value },
            app.chartManager.getBeat()
          )
        }
        return input.view
      },
      update: (element, timingData, beat) => {
        const input: HTMLInputElement = element.querySelector(".spinner-input")!
        if (document.activeElement == input) return
        const event = timingData.getTimingEventAtBeat("STOPS", beat)
        let value = event?.value ?? 0
        if (beat != event?.beat) value = 0
        if (input.value != roundDigit(value, 3).toFixed(3)) {
          input.value = roundDigit(value, 3).toFixed(3)
        }
      },
    }),
  },
  delay: {
    title: "Delay",
    element: createElement({
      create: (app, isSongTiming) => {
        const input = NumberSpinner.create(0, undefined, 3)
        input.onChange = value => {
          if (value == undefined || value == 0) {
            const beat = app.chartManager.getBeat()
            app.chartManager.loadedChart?.timingData.delete(
              isSongTiming(),
              "DELAYS",
              beat
            )
            return
          }
          app.chartManager.loadedChart?.timingData.insert(
            isSongTiming(),
            "DELAYS",
            { value: value },
            app.chartManager.getBeat()
          )
        }
        return input.view
      },
      update: (element, timingData, beat) => {
        const input: HTMLInputElement = element.querySelector(".spinner-input")!
        if (document.activeElement == input) return
        const event = timingData.getTimingEventAtBeat("DELAYS", beat)
        let value = event?.value ?? 0
        if (beat != event?.beat) value = 0
        if (input.value != roundDigit(value, 3).toFixed(3)) {
          input.value = roundDigit(value, 3).toFixed(3)
        }
      },
    }),
  },
  warp: {
    title: "Warp",
    element: createElement({
      create: (app, isSongTiming) => {
        const input = NumberSpinner.create(0, undefined, 3, 0)
        input.onChange = value => {
          if (value == undefined || value == 0) {
            const beat = app.chartManager.getBeat()
            app.chartManager.loadedChart?.timingData.delete(
              isSongTiming(),
              "WARPS",
              beat
            )
            return
          }
          if (value < 0) return
          app.chartManager.loadedChart?.timingData.insert(
            isSongTiming(),
            "WARPS",
            { value: value },
            app.chartManager.getBeat()
          )
        }
        return input.view
      },
      update: (element, timingData, beat) => {
        const input: HTMLInputElement = element.querySelector(".spinner-input")!
        if (document.activeElement == input) return
        const event = timingData.getTimingEventAtBeat("WARPS", beat)
        let value = event?.value ?? 0
        if (beat != event?.beat) value = 0
        if (input.value != roundDigit(value, 3).toFixed(3)) {
          input.value = roundDigit(value, 3).toFixed(3)
        }
      },
    }),
  },

  timeSig: {
    title: "Time Sig.",
    element: createElement({
      create: (app, isSongTiming) => {
        const container = document.createElement("div")
        container.classList.add("flex-column-gap")
        const upperInput = NumberSpinner.create(4, 1, 0, 1)
        upperInput.onChange = value => {
          if (value == undefined) {
            const beat = app.chartManager.getBeat()
            app.chartManager.loadedChart?.timingData.delete(
              isSongTiming(),
              "TIMESIGNATURES",
              beat
            )
            return
          }
          if (value < 1) return
          app.chartManager.loadedChart?.timingData.insert(
            isSongTiming(),
            "TIMESIGNATURES",
            { upper: value, lower: lowerInput.value },
            app.chartManager.getBeat()
          )
        }
        const lowerInput = NumberSpinner.create(4, 1, 0, 1)
        lowerInput.onChange = value => {
          if (value == undefined) {
            const beat = app.chartManager.getBeat()
            app.chartManager.loadedChart?.timingData.delete(
              isSongTiming(),
              "TIMESIGNATURES",
              beat
            )
            return
          }
          if (value < 1) return
          app.chartManager.loadedChart?.timingData.insert(
            isSongTiming(),
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
        const upperInput: HTMLInputElement =
          element.firstElementChild!.querySelector(".spinner-input")!
        const lowerInput: HTMLInputElement =
          element.lastElementChild!.querySelector(".spinner-input")!
        const event = timingData.getTimingEventAtBeat("TIMESIGNATURES", beat)
        const upper = event?.upper ?? 4
        const lower = event?.lower ?? 4
        if (
          document.activeElement != upperInput &&
          upperInput.value != Math.round(upper).toString()
        ) {
          upperInput.value = Math.round(upper).toString()
        }
        if (
          document.activeElement != lowerInput &&
          lowerInput.value != Math.round(lower).toString()
        ) {
          lowerInput.value = Math.round(lower).toString()
        }
      },
    }),
  },
  tick: {
    title: "Tickcount",
    element: createElement({
      create: (app, isSongTiming) => {
        const input = NumberSpinner.create(4, 1, 0, 0)
        input.onChange = value => {
          if (value == undefined) {
            const beat = app.chartManager.getBeat()
            app.chartManager.loadedChart?.timingData.delete(
              isSongTiming(),
              "TICKCOUNTS",
              beat
            )
            return
          }
          if (value < 0) return
          app.chartManager.loadedChart?.timingData.insert(
            isSongTiming(),
            "TICKCOUNTS",
            { value: value },
            app.chartManager.getBeat()
          )
        }
        return input.view
      },
      update: (element, timingData, beat) => {
        const input: HTMLInputElement = element.querySelector(".spinner-input")!
        if (document.activeElement == input) return
        const value =
          timingData.getTimingEventAtBeat("TICKCOUNTS", beat)?.value ?? 4
        if (input.value != Math.round(value).toString()) {
          input.value = Math.round(value).toString()
        }
      },
    }),
  },
  combo: {
    title: "Combo",
    element: createElement({
      create: (app, isSongTiming) => {
        const container = document.createElement("div")
        container.classList.add("flex-column-gap")
        const upperInput = NumberSpinner.create(1, 1, 0, 0)
        upperInput.onChange = value => {
          if (value == undefined) {
            const beat = app.chartManager.getBeat()
            app.chartManager.loadedChart?.timingData.delete(
              isSongTiming(),
              "COMBOS",
              beat
            )
            return
          }
          if (value < 0) return
          app.chartManager.loadedChart?.timingData.insert(
            isSongTiming(),
            "COMBOS",
            { hitMult: value, missMult: lowerInput.value },
            app.chartManager.getBeat()
          )
        }
        const lowerInput = NumberSpinner.create(1, 1, 0, 0)
        lowerInput.onChange = value => {
          if (value == undefined) {
            const beat = app.chartManager.getBeat()
            lowerInput.setValue(
              app.chartManager.loadedChart?.timingData.getTimingEventAtBeat(
                "COMBOS",
                beat
              )?.missMult ?? 1
            )
            return
          }
          if (value < 0) return
          app.chartManager.loadedChart?.timingData.insert(
            isSongTiming(),
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
        const upperInput: HTMLInputElement =
          element.firstElementChild!.querySelector(".spinner-input")!
        const lowerInput: HTMLInputElement =
          element.lastElementChild!.querySelector(".spinner-input")!
        const event = timingData.getTimingEventAtBeat("COMBOS", beat)
        const hitMult = event?.hitMult ?? 1
        const missMult = event?.missMult ?? 1
        if (
          document.activeElement != upperInput &&
          upperInput.value != Math.round(hitMult).toString()
        ) {
          upperInput.value = Math.round(hitMult).toString()
        }
        if (
          document.activeElement != lowerInput &&
          lowerInput.value != Math.round(missMult).toString()
        ) {
          lowerInput.value = Math.round(missMult).toString()
        }
      },
    }),
  },
  speed: {
    title: "Speed",
    element: createElement({
      create: (app, isSongTiming) => {
        const container = document.createElement("div")
        container.classList.add("flex-column-gap")

        const update = () => {
          app.chartManager.loadedChart?.timingData.insert(
            isSongTiming(),
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
          if (value == undefined) {
            const beat = app.chartManager.getBeat()
            app.chartManager.loadedChart?.timingData.delete(
              isSongTiming(),
              "SPEEDS",
              beat
            )
            return
          }
          update()
        }

        const delayInput = NumberSpinner.create(1, 0.1, 0)
        delayInput.onChange = value => {
          if (value == undefined || value < 0) return
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
        const valueInput: HTMLInputElement =
          element.firstElementChild!.querySelector(".spinner-input")!
        const delayInput: HTMLInputElement =
          element.children[1].querySelector(".spinner-input")!

        const event = timingData.getTimingEventAtBeat("SPEEDS", beat)
        const value = event?.value ?? 1
        const delay = event?.delay ?? 0
        const unit = event?.unit == "B" ? "Beat" : "Time"
        if (
          document.activeElement != valueInput &&
          valueInput.value != roundDigit(value, 3).toFixed(3)
        ) {
          valueInput.value = roundDigit(value, 3).toFixed(3)
        }
        if (
          document.activeElement != delayInput &&
          delayInput.value != roundDigit(delay, 3).toFixed(3)
        ) {
          delayInput.value = roundDigit(delay, 3).toFixed(3)
        }
        delayInput.disabled = event?.beat != beat

        const unitInput: HTMLDivElement =
          element.lastElementChild!.querySelector(".dropdown-selected")!
        if (unitInput.innerText != unit) {
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
      create: (app, isSongTiming) => {
        const input = NumberSpinner.create(1, undefined, 3)
        input.onChange = value => {
          if (value == undefined) {
            const beat = app.chartManager.getBeat()
            app.chartManager.loadedChart?.timingData.delete(
              isSongTiming(),
              "SCROLLS",
              beat
            )
            return
          }
          app.chartManager.loadedChart?.timingData.insert(
            isSongTiming(),
            "SCROLLS",
            { value: value },
            app.chartManager.getBeat()
          )
        }
        return input.view
      },
      update: (element, timingData, beat) => {
        const input: HTMLInputElement = element.querySelector(".spinner-input")!
        if (document.activeElement == input) return
        const value =
          timingData.getTimingEventAtBeat("SCROLLS", beat)?.value ?? 1
        if (input.value != roundDigit(value, 3).toFixed(3)) {
          input.value = roundDigit(value, 3).toFixed(3)
        }
      },
    }),
  },
  fake: {
    title: "Fake",
    element: createElement({
      create: (app, isSongTiming) => {
        const input = NumberSpinner.create(1, undefined, 3, 0)
        input.onChange = value => {
          if (value == undefined) {
            const beat = app.chartManager.getBeat()
            app.chartManager.loadedChart?.timingData.delete(
              isSongTiming(),
              "FAKES",
              beat
            )
            return
          }
          if (value < 0) return
          app.chartManager.loadedChart?.timingData.insert(
            isSongTiming(),
            "FAKES",
            { value: value },
            app.chartManager.getBeat()
          )
        }
        return input.view
      },
      update: (element, timingData, beat) => {
        const input: HTMLInputElement = element.querySelector(".spinner-input")!
        if (document.activeElement == input) return
        const event = timingData.getTimingEventAtBeat("FAKES", beat)
        let value = event?.value ?? 1
        if (beat != event?.beat) value = 0
        if (input.value != roundDigit(value, 3).toFixed(3)) {
          input.value = roundDigit(value, 3).toFixed(3)
        }
      },
    }),
  },
  label: {
    title: "Label",
    element: createElement({
      create: (app, isSongTiming) => {
        const input = document.createElement("input")
        input.type = "text"
        input.autocomplete = "off"
        input.spellcheck = false
        input.onkeydown = ev => {
          if (ev.key == "Enter") input.blur()
        }
        input.onblur = () => {
          if (input.value == "") {
            const beat = app.chartManager.getBeat()
            app.chartManager.loadedChart?.timingData.delete(
              isSongTiming(),
              "LABELS",
              beat
            )
            return
          }
          app.chartManager.loadedChart?.timingData.insert(
            isSongTiming(),
            "LABELS",
            { value: input.value },
            app.chartManager.getBeat()
          )
        }
        return input
      },
      update: (element, timingData, beat) => {
        const input: HTMLInputElement = element
        if (document.activeElement == input) return
        const event = timingData.getTimingEventAtBeat("LABELS", beat)
        const value = event?.value ?? ""
        if (input.value != value) {
          input.value = value
        }
      },
    }),
  },
}
