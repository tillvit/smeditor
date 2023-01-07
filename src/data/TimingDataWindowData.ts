import { App } from "../App"
import { TimingData } from "../chart/sm/TimingData"
import { safeParse } from "../util/Util"


type TimingDataWindowElement<T extends HTMLElement> = {
  create: (app: App) => T;
  update: (element: T, timingData: TimingData, beat: number) => void,
}

type TimingDataWindowData = {
  title: string,
  element: TimingDataWindowElement<any>
}

const createElement = <T extends HTMLElement>(element: TimingDataWindowElement<T>) => element;

export const TIMING_WINDOW_DATA: {[key: string]: TimingDataWindowData} = {
  beat: {
    title: "Beat",
    element: createElement({
      create: (app) => {
        let input = document.createElement("input")
        input.type = "text"
        input.onblur = () => {
          let beat = Math.max(0, safeParse(input.value))
          app.chartManager.setBeat(beat)
          input.value = beat.toFixed(3)
          input.blur()
        }
        input.onkeydown = (ev) => {
          if (ev.key == "Enter") input.blur()
        }
        input.oninput = () => {
          input.value = input.value.replaceAll(/[^.0-9+-]/g,"")
        }
        return input
      },
      update: (element, _, beat) => {
        let val = element.value = beat.toFixed(3)
        if (element.dataset.lastValue != val) {
          element.value = val
          element.dataset.lastValue = val
        }
      }
    })
  },
  offset: {
    title: "Offset",
    element: createElement({
      create: (app) => {
        let input = document.createElement("input")
        input.type = "text"
        input.onblur = () => {
          let offset = safeParse(input.value)
          app.chartManager.chart?.timingData.update("OFFSET", offset)
          app.chartManager.setBeat(app.chartManager.getBeat())
          input.value = offset.toFixed(3)
          input.blur()
        }
        input.onkeydown = (ev) => {
          if (ev.key == "Enter") input.blur()
        }
        input.oninput = () => {
          input.value = input.value.replaceAll(/[^.0-9+-]/g,"")
        }
        return input
      },
      update: (element, timingData) => {
        let val = timingData.getTimingData("OFFSET").toFixed(3)
        if (element.dataset.lastValue != val) {
          element.value = val
          element.dataset.lastValue = val
        }
      }
    })
  },
  label: {
    title: "Label",
    element: createElement({
      create: () => {
        let input = document.createElement("input")
        input.onkeydown = (ev) => {
          if (ev.key == "Enter") input.blur()
        }
        return input
      },
      update: (element, timingData, beat) => {
        let event = timingData.getTimingEventAtBeat("LABELS", beat)
        let val = event?.value ?? ""
        if (element.dataset.lastValue != val) {
          element.value = val
          element.dataset.lastValue = val
        }
      }
    })
  },
  timeSig: {
    title: "Time Signature",
    element: createElement({
      create: () => {
        let container = document.createElement("div")
        let top = document.createElement("input")
        top.classList.add("short")
        let seperator = document.createElement("div")
        seperator.innerText = "/"
        let bottom = document.createElement("input")
        bottom.classList.add("short")
        container.appendChild(top)
        container.appendChild(seperator)
        container.appendChild(bottom)
        return container
      },
      update: (element, timingData, beat) => {
        let event = timingData.getTimingEventAtBeat("TIMESIGNATURES", beat)
        let val = (event?.upper ?? "4") + "/" + (event?.lower ?? "4")
        if (element.dataset.lastValue != val) {
          (<HTMLInputElement>element.children[0]).value = event?.upper.toString() ?? "4";
          (<HTMLInputElement>element.children[2]).value = event?.lower.toString() ?? "4";
          element.dataset.lastValue = val
        }
      }
    })
  },
  bpm: {
    title: "BPM",
    element: createElement({
      create: () => {
        let input = document.createElement("input")
        return input
      },
      update: (element, timingData, beat) => {
        let event = timingData.getTimingEventAtBeat("BPMS", beat)
        let val = event?.value.toFixed(3) ?? "120.000"
        if (element.dataset.lastValue != val) {
          element.value = val
          element.dataset.lastValue = val
        }
      }
    })
  },
  stop: {
    title: "Stop",
    element: createElement({
      create: () => {
        let input = document.createElement("input")
        return input
      },
      update: (element, timingData, beat) => {
        let event = timingData.getTimingEventAtBeat("STOPS", beat)
        let val = event?.value.toFixed(3) ?? "0.000"
        if (event && event.beat != beat) val = "0.000"
        if (element.dataset.lastValue != val) {
          element.value = val
          element.dataset.lastValue = val
        }
      }
    })
  },
  delay: {
    title: "Delay",
    element: createElement({
      create: () => {
        let input = document.createElement("input")
        return input
      },
      update: (element, timingData, beat) => {
        let event = timingData.getTimingEventAtBeat("DELAYS", beat)
        let val = event?.value.toFixed(3) ?? "0.000"
        if (event && event.beat != beat) val = "0.000"
        if (element.dataset.lastValue != val) {
          element.value = val
          element.dataset.lastValue = val
        }
      }
    })
  },
  warp: {
    title: "Warp",
    element: createElement({
      create: () => {
        let input = document.createElement("input")
        return input
      },
      update: (element, timingData, beat) => {
        let event = timingData.getTimingEventAtBeat("WARPS", beat)
        let val = event?.value.toFixed(3) ?? "0.000"
        if (event && event.beat != beat) val = "0.000"
        if (element.dataset.lastValue != val) {
          element.value = val
          element.dataset.lastValue = val
        }
      }
    })
  },
  speed: {
    title: "Speed",
    element: createElement({
      create: () => {
        let container = document.createElement("div")
        let speed = document.createElement("input")
        speed.classList.add("short")
        let seperator = document.createElement("div")
        seperator.innerText = "/"
        let delay = document.createElement("input")
        delay.classList.add("short")
        let seperator2 = document.createElement("div")
        seperator2.innerText = "/"
        let unit = document.createElement("input")
        unit.classList.add("short")
        container.appendChild(speed)
        container.appendChild(seperator)
        container.appendChild(delay)
        container.appendChild(seperator2)
        container.appendChild(unit)
        return container
      },
      update: (element, timingData, beat) => {
        let event = timingData.getTimingEventAtBeat("SPEEDS", beat)
        let val = (event?.value ?? "1") + "/" + (event?.delay ?? "0") + "/" + (event?.unit ?? "B")
        if (event && event.beat != beat) {
          val =  (event?.value ?? "1") + "/0/B"
        }
        if (element.dataset.lastValue != val) {
          (<HTMLInputElement>element.children[0]).value = event?.value.toString() ?? "1";
          (<HTMLInputElement>element.children[2]).value = event?.delay.toString() ?? "0";
          (<HTMLInputElement>element.children[4]).value = event?.unit ?? "B";
          element.dataset.lastValue = val
        }
      }
    })
  },
  scroll: {
    title: "Scroll",
    element: createElement({
      create: () => {
        let input = document.createElement("input")
        return input
      },
      update: (element, timingData, beat) => {
        let event = timingData.getTimingEventAtBeat("SCROLLS", beat)
        let val = event?.value.toFixed(3) ?? "1.000"
        if (element.dataset.lastValue != val) {
          element.value = val
          element.dataset.lastValue = val
        }
      }
    })
  },
  fake: {
    title: "Fake",
    element: createElement({
      create: () => {
        let input = document.createElement("input")
        return input
      },
      update: (element, timingData, beat) => {
        let event = timingData.getTimingEventAtBeat("FAKES", beat)
        let val = event?.value.toFixed(3) ?? "0.000"
        if (event && event.beat != beat) val = "0.000"
        if (element.dataset.lastValue != val) {
          element.value = val
          element.dataset.lastValue = val
        }
      }
    })
  },
  combo: {
    title: "Combo",
    element: createElement({
      create: () => {
        let container = document.createElement("div")
        let hit = document.createElement("input")
        hit.classList.add("short")
        let seperator = document.createElement("div")
        seperator.innerText = "/"
        let miss = document.createElement("input")
        miss.classList.add("short")
        container.appendChild(hit)
        container.appendChild(seperator)
        container.appendChild(miss)
        return container
      },
      update: (element, timingData, beat) => {
        let event = timingData.getTimingEventAtBeat("COMBOS", beat)
        let val = (event?.hitMult ?? "1") + "/" + (event?.missMult ?? "1")
        if (element.dataset.lastValue != val) {
          (<HTMLInputElement>element.children[0]).value = event?.hitMult.toString() ?? "1";
          (<HTMLInputElement>element.children[2]).value = event?.missMult.toString() ?? "1";
          element.dataset.lastValue = val
        }
      }
    })
  },
  tick: {
    title: "Tickcount",
    element: createElement({
      create: () => {
        let input = document.createElement("input")
        input.classList.add("short")
        return input
      },
      update: (element, timingData, beat) => {
        let event = timingData.getTimingEventAtBeat("TICKCOUNTS", beat)
        let val = event?.value.toString() ?? "4"
        if (element.dataset.lastValue != val) {
          element.value = val
          element.dataset.lastValue = val
        }
      }
    })
  },
}