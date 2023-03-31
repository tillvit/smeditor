import { App } from "../App"
import { TimingData } from "../chart/sm/TimingData"
import { TimingEventProperty } from "../chart/sm/TimingTypes"
import { Dropdown } from "../gui/element/Dropdown"
import { NumberSpinner } from "../gui/element/NumberSpinner"
import { roundDigit } from "../util/Util"

type TimingDataWindowElement<T extends HTMLElement> = {
  create: (app: App, songTiming: () => boolean) => T
  update: (element: T, timingData: TimingData, beat: number) => void
}

type TimingDataWindowData = {
  title: string
  element: TimingDataWindowElement<any>
}

const createElement = <T extends HTMLElement>(
  element: TimingDataWindowElement<T>
) => element

const deleteEv = (
  app: App,
  songTiming: () => boolean,
  type: TimingEventProperty
) => {
  const beat = app.chartManager.getBeat()
  app.chartManager.loadedChart?.timingData.delete(songTiming(), type, beat)
}

export const TIMING_WINDOW_DATA: { [key: string]: TimingDataWindowData } = {
  offset: {
    title: "Offset",
    element: createElement({
      create: (app, songTiming) => {
        const input = NumberSpinner.create(0, 0.001, 3)
        input.onChange = value => {
          if (value == undefined) {
            input.setValue(
              app.chartManager.loadedChart!.timingData.getTimingData("OFFSET")
            )
            return
          }
          app.chartManager.loadedChart?.timingData.insert(
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
          if (value == undefined) {
            deleteEv(app, songTiming, "BPMS")
            return
          }
          app.chartManager.loadedChart?.timingData.insert(
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
          if (value == undefined || value == 0) {
            deleteEv(app, songTiming, "STOPS")
            return
          }
          app.chartManager.loadedChart?.timingData.insert(
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
          if (value == undefined || value == 0) {
            deleteEv(app, songTiming, "DELAYS")
            return
          }
          app.chartManager.loadedChart?.timingData.insert(
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
          if (value == undefined || value == 0) {
            deleteEv(app, songTiming, "WARPS")
            return
          }
          if (value < 0) {
            const beat = app.chartManager.getBeat()
            const event =
              app.chartManager.loadedChart?.timingData.getTimingEventAtBeat(
                "WARPS",
                beat
              )
            input.setValue(event?.value ?? 0)
            if (beat != event?.beat) input.setValue(0)
            return
          }
          app.chartManager.loadedChart?.timingData.insert(
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
          if (value == undefined) {
            deleteEv(app, songTiming, "TIMESIGNATURES")
            return
          }
          if (value < 1) {
            const beat = app.chartManager.getBeat()
            upperInput.setValue(
              app.chartManager.loadedChart?.timingData.getTimingEventAtBeat(
                "TIMESIGNATURES",
                beat
              )?.upper ?? 4
            )
            return
          }
          app.chartManager.loadedChart?.timingData.insert(
            songTiming(),
            "TIMESIGNATURES",
            { upper: value, lower: lowerInput.value },
            app.chartManager.getBeat()
          )
        }
        const lowerInput = NumberSpinner.create(4, 1, 0, 1)
        lowerInput.onChange = value => {
          if (value == undefined) {
            deleteEv(app, songTiming, "TIMESIGNATURES")
            return
          }
          if (value < 1) {
            const beat = app.chartManager.getBeat()
            lowerInput.setValue(
              app.chartManager.loadedChart?.timingData.getTimingEventAtBeat(
                "TIMESIGNATURES",
                beat
              )?.lower ?? 4
            )
            return
          }
          app.chartManager.loadedChart?.timingData.insert(
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
          if (value == undefined) {
            deleteEv(app, songTiming, "TICKCOUNTS")
            return
          }
          if (value < 0) {
            const beat = app.chartManager.getBeat()
            input.setValue(
              app.chartManager.loadedChart?.timingData.getTimingEventAtBeat(
                "TICKCOUNTS",
                beat
              )?.value ?? 0
            )
            return
          }

          app.chartManager.loadedChart?.timingData.insert(
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
          if (value == undefined) {
            deleteEv(app, songTiming, "COMBOS")
            return
          }
          if (value < 0) {
            const beat = app.chartManager.getBeat()
            upperInput.setValue(
              app.chartManager.loadedChart?.timingData.getTimingEventAtBeat(
                "COMBOS",
                beat
              )?.hitMult ?? 1
            )
            return
          }
          app.chartManager.loadedChart?.timingData.insert(
            songTiming(),
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
          if (value < 0) {
            const beat = app.chartManager.getBeat()
            lowerInput.setValue(
              app.chartManager.loadedChart?.timingData.getTimingEventAtBeat(
                "COMBOS",
                beat
              )?.missMult ?? 1
            )
            return
          }
          app.chartManager.loadedChart?.timingData.insert(
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
          app.chartManager.loadedChart?.timingData.insert(
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
          if (value == undefined) {
            deleteEv(app, songTiming, "SPEEDS")
            return
          }
          if (value < 0) {
            const beat = app.chartManager.getBeat()
            valueInput.setValue(
              app.chartManager.loadedChart?.timingData.getTimingEventAtBeat(
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
          if (value == undefined || value < 0) {
            const beat = app.chartManager.getBeat()
            delayInput.setValue(
              app.chartManager.loadedChart?.timingData.getTimingEventAtBeat(
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
          if (value == undefined) {
            deleteEv(app, songTiming, "SCROLLS")
            return
          }
          app.chartManager.loadedChart?.timingData.insert(
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
          if (value == undefined) {
            deleteEv(app, songTiming, "FAKES")
            return
          }
          if (value < 0) {
            const beat = app.chartManager.getBeat()
            const event =
              app.chartManager.loadedChart?.timingData.getTimingEventAtBeat(
                "FAKES",
                beat
              )
            input.setValue(event?.value ?? 0)
            if (beat != event?.beat) input.setValue(0)
            return
          }
          app.chartManager.loadedChart?.timingData.insert(
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
        input.autocomplete = "off"
        input.spellcheck = false
        input.onkeydown = ev => {
          if (ev.key == "Enter") input.blur()
        }
        input.onblur = () => {
          if (input.value == "") {
            deleteEv(app, songTiming, "LABELS")
            return
          }
          app.chartManager.loadedChart?.timingData.insert(
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
