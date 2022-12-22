import { Parser } from "expr-eval"
import { App } from "../App"
import { TimingData } from "../chart/sm/TimingData"

type TimingWindowElement<T extends HTMLElement> = {
  create: (app: App) => T,
  update: (element: T, timingData: TimingData, beat: number) => void,
}

type TimingWindowData = {
  title: string,
  element: TimingWindowElement<any>
}

export const TIMING_WINDOW_DATA: {[key: string]: TimingWindowData} = {
  beat: {
    title: "Beat",
    element: {
      create: (app) => {
        let input = document.createElement("input")
        input.onchange = () => {
          let beat = Math.max(0, Parser.evaluate(input.value))
          app.chartManager.setBeat(beat)
          input.value = beat.toFixed(3)
          input.blur()
        }
        input.oninput = () => {
          input.value = input.value.replaceAll(/[^.0-9+-]/g,"")
        }
        return input
      },
      update: (element, _, beat) => {
        element.value = beat.toFixed(3)
      }
    }
  },
  offset: {
    title: "Offset",
    element: {
      create: (app) => {
        let input = document.createElement("input")
        input.onchange = () => {
          let offset = Parser.evaluate(input.value)
          app.chartManager.chart?.timingData.update("OFFSET", offset)
          app.chartManager.setBeat(app.chartManager.getBeat())
          input.value = offset.toFixed(3)
          input.blur()
        }
        input.oninput = () => {
          input.value = input.value.replaceAll(/[^.0-9+-]/g,"")
        }
        return input
      },
      update: (element, timingData) => {
        element.value = timingData.getTimingData("OFFSET")
      }
    }
  },
  label: {
    title: "Label",
    element: {
      create: () => {
        let input = document.createElement("input")
        return input
      },
      update: (element, timingData, beat) => {
        let event = timingData.getTimingEventAtBeat("LABELS", beat)
        element.value = event?.value ?? ""
      }
    }
  },
  timeSig: {
    title: "Time Signature",
     element: {
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
        element.children[0].value = event?.upper ?? "4"
        element.children[2].value = event?.lower ?? "4"
      }
    }
  },
  bpm: {
    title: "BPM",
     element: {
      create: () => {
        let input = document.createElement("input")
        return input
      },
      update: (element, timingData, beat) => {
        let event = timingData.getTimingEventAtBeat("BPMS", beat)
        element.value = event?.value.toFixed(3) ?? "120.000"
      }
    }
  },
  stop: {
    title: "Stop",
     element: {
      create: () => {
        let input = document.createElement("input")
        return input
      },
      update: (element, timingData, beat) => {
        let event = timingData.getTimingEventAtBeat("STOPS", beat)
        element.value = event?.value.toFixed(3) ?? "0.000"
        if (event && event.beat != beat) element.value = "0.000"
      }
    }
  },
  delay: {
    title: "Delay",
     element: {
      create: () => {
        let input = document.createElement("input")
        return input
      },
      update: (element, timingData, beat) => {
        let event = timingData.getTimingEventAtBeat("DELAYS", beat)
        element.value = event?.value.toFixed(3) ?? "0.000"
        if (event && event.beat != beat) element.value = "0.000"
      }
    }
  },
  warp: {
    title: "Warp",
     element: {
      create: () => {
        let input = document.createElement("input")
        return input
      },
      update: (element, timingData, beat) => {
        let event = timingData.getTimingEventAtBeat("WARPS", beat)
        element.value = event?.value.toFixed(3) ?? "0.000"
        if (event && event.beat != beat) element.value = "0.000"
      }
    }
  },
  speed: {
    title: "Speed",
     element: {
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
        element.children[0].value = event?.value ?? "1"
        element.children[2].value = event?.delay ?? "0"
        element.children[4].value = event?.unit ?? "B"
        if (event && event.beat != beat) {
          element.children[2].value = "0"
          element.children[4].value = "B"
        }
      }
    }
  },
  scroll: {
    title: "Scroll",
     element: {
      create: () => {
        let input = document.createElement("input")
        return input
      },
      update: (element, timingData, beat) => {
        let event = timingData.getTimingEventAtBeat("SCROLLS", beat)
        element.value = event?.value.toFixed(3) ?? "1.000"
      }
    }
  },
  fake: {
    title: "Fake",
     element: {
      create: () => {
        let input = document.createElement("input")
        return input
      },
      update: (element, timingData, beat) => {
        let event = timingData.getTimingEventAtBeat("FAKES", beat)
        element.value = event?.value.toFixed(3) ?? "0.000"
        if (event && event.beat != beat) element.value = "0.000"
      }
    }
  },
  combo: {
    title: "Combo",
     element: {
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
        element.children[0].value = event?.hitMult ?? 1
        element.children[2].value = event?.missMult ?? 1
      }
    }
  },
  tick: {
    title: "Tickcount",
     element: {
      create: () => {
        let input = document.createElement("input")
        input.classList.add("short")
        return input
      },
      update: (element, timingData, beat) => {
        let event = timingData.getTimingEventAtBeat("TICKCOUNTS", beat)
        element.value = event?.value ?? 4
      }
    }
  },
}