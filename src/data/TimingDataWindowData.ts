import { App } from "../App"
import { TimingData } from "../chart/sm/TimingData"
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
        const input = NumberSpinner.create(0, 0.001)
        input.onChange = value => {
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
        const input = NumberSpinner.create(120, 0.001)
        input.onChange = value => {
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
        const input = NumberSpinner.create(0, 0.001)
        input.onChange = value => {
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

  label: {
    title: "Label",
    element: createElement({
      create: () => {
        const input = document.createElement("input")
        input.onkeydown = ev => {
          if (ev.key == "Enter") input.blur()
        }
        return input
      },
      update: (element, timingData, beat) => {
        const event = timingData.getTimingEventAtBeat("LABELS", beat)
        const val = event?.value ?? ""
        if (element.dataset.lastValue != val) {
          element.value = val
          element.dataset.lastValue = val
        }
      },
    }),
  },
  timeSig: {
    title: "Time Signature",
    element: createElement({
      create: () => {
        const container = document.createElement("div")
        const top = document.createElement("input")
        top.classList.add("short")
        const seperator = document.createElement("div")
        seperator.innerText = "/"
        const bottom = document.createElement("input")
        bottom.classList.add("short")
        container.appendChild(top)
        container.appendChild(seperator)
        container.appendChild(bottom)
        return container
      },
      update: (element, timingData, beat) => {
        const event = timingData.getTimingEventAtBeat("TIMESIGNATURES", beat)
        const val = (event?.upper ?? "4") + "/" + (event?.lower ?? "4")
        if (element.dataset.lastValue != val) {
          ;(<HTMLInputElement>element.children[0]).value =
            event?.upper.toString() ?? "4"
          ;(<HTMLInputElement>element.children[2]).value =
            event?.lower.toString() ?? "4"
          element.dataset.lastValue = val
        }
      },
    }),
  },
  delay: {
    title: "Delay",
    element: createElement({
      create: () => {
        const input = document.createElement("input")
        return input
      },
      update: (element, timingData, beat) => {
        const event = timingData.getTimingEventAtBeat("DELAYS", beat)
        let val = event?.value.toFixed(3) ?? "0.000"
        if (event && event.beat != beat) val = "0.000"
        if (element.dataset.lastValue != val) {
          element.value = val
          element.dataset.lastValue = val
        }
      },
    }),
  },
  warp: {
    title: "Warp",
    element: createElement({
      create: () => {
        const input = document.createElement("input")
        return input
      },
      update: (element, timingData, beat) => {
        const event = timingData.getTimingEventAtBeat("WARPS", beat)
        let val = event?.value.toFixed(3) ?? "0.000"
        if (event && event.beat != beat) val = "0.000"
        if (element.dataset.lastValue != val) {
          element.value = val
          element.dataset.lastValue = val
        }
      },
    }),
  },
  speed: {
    title: "Speed",
    element: createElement({
      create: () => {
        const container = document.createElement("div")
        const speed = document.createElement("input")
        speed.classList.add("short")
        const seperator = document.createElement("div")
        seperator.innerText = "/"
        const delay = document.createElement("input")
        delay.classList.add("short")
        const seperator2 = document.createElement("div")
        seperator2.innerText = "/"
        const unit = document.createElement("input")
        unit.classList.add("short")
        container.appendChild(speed)
        container.appendChild(seperator)
        container.appendChild(delay)
        container.appendChild(seperator2)
        container.appendChild(unit)
        return container
      },
      update: (element, timingData, beat) => {
        const event = timingData.getTimingEventAtBeat("SPEEDS", beat)
        let val =
          (event?.value ?? "1") +
          "/" +
          (event?.delay ?? "0") +
          "/" +
          (event?.unit ?? "B")
        if (event && event.beat != beat) {
          val = (event?.value ?? "1") + "/0/B"
        }
        if (element.dataset.lastValue != val) {
          ;(<HTMLInputElement>element.children[0]).value =
            event?.value.toString() ?? "1"
          ;(<HTMLInputElement>element.children[2]).value =
            event?.delay.toString() ?? "0"
          ;(<HTMLInputElement>element.children[4]).value = event?.unit ?? "B"
          element.dataset.lastValue = val
        }
      },
    }),
  },
  scroll: {
    title: "Scroll",
    element: createElement({
      create: () => {
        const input = document.createElement("input")
        return input
      },
      update: (element, timingData, beat) => {
        const event = timingData.getTimingEventAtBeat("SCROLLS", beat)
        const val = event?.value.toFixed(3) ?? "1.000"
        if (element.dataset.lastValue != val) {
          element.value = val
          element.dataset.lastValue = val
        }
      },
    }),
  },
  fake: {
    title: "Fake",
    element: createElement({
      create: () => {
        const input = document.createElement("input")
        return input
      },
      update: (element, timingData, beat) => {
        const event = timingData.getTimingEventAtBeat("FAKES", beat)
        let val = event?.value.toFixed(3) ?? "0.000"
        if (event && event.beat != beat) val = "0.000"
        if (element.dataset.lastValue != val) {
          element.value = val
          element.dataset.lastValue = val
        }
      },
    }),
  },
  combo: {
    title: "Combo",
    element: createElement({
      create: () => {
        const container = document.createElement("div")
        const hit = document.createElement("input")
        hit.classList.add("short")
        const seperator = document.createElement("div")
        seperator.innerText = "/"
        const miss = document.createElement("input")
        miss.classList.add("short")
        container.appendChild(hit)
        container.appendChild(seperator)
        container.appendChild(miss)
        return container
      },
      update: (element, timingData, beat) => {
        const event = timingData.getTimingEventAtBeat("COMBOS", beat)
        const val = (event?.hitMult ?? "1") + "/" + (event?.missMult ?? "1")
        if (element.dataset.lastValue != val) {
          ;(<HTMLInputElement>element.children[0]).value =
            event?.hitMult.toString() ?? "1"
          ;(<HTMLInputElement>element.children[2]).value =
            event?.missMult.toString() ?? "1"
          element.dataset.lastValue = val
        }
      },
    }),
  },
  tick: {
    title: "Tickcount",
    element: createElement({
      create: () => {
        const input = document.createElement("input")
        input.classList.add("short")
        return input
      },
      update: (element, timingData, beat) => {
        const event = timingData.getTimingEventAtBeat("TICKCOUNTS", beat)
        const val = event?.value.toString() ?? "4"
        if (element.dataset.lastValue != val) {
          element.value = val
          element.dataset.lastValue = val
        }
      },
    }),
  },
}
