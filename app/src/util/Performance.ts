declare global {
  interface Performance {
    memory?: {
      /** The maximum size of the heap, in bytes, that is available to the context. */
      jsHeapSizeLimit: number
      /** The total allocated heap size, in bytes. */
      totalJSHeapSize: number
      /** The currently active segment of JS heap, in bytes. */
      usedJSHeapSize: number
    }
  }
}

const fpsTimes: number[] = []
export function getFPS() {
  return fpsTimes.length
}

export function fpsUpdate() {
  fpsTimes.push(Date.now())
  while (fpsTimes.length > 0 && fpsTimes[0] < Date.now() - 1000) {
    fpsTimes.shift()
  }
}

const tpsTimes: number[] = []
export function getTPS() {
  return tpsTimes.length
}

export function tpsUpdate() {
  tpsTimes.push(Date.now())
  while (tpsTimes.length > 0 && tpsTimes[0] < Date.now() - 1000) {
    tpsTimes.shift()
  }
}
