import { WaterfallManager } from "../../../gui/element/WaterfallManager"
import { EventHandler } from "../../../util/EventHandler"
import { Options } from "../../../util/Options"
import { Chart } from "../../sm/Chart"
import { ChartAnalyzer } from "../ChartAnalyzer"
import ParityInternals from "./ParityInternals?worker"
import {
  ParityInboundMessage,
  ParityOutboundMessage,
} from "./ParityWebWorkerTypes"

export class ParityAnalyzer extends ChartAnalyzer {
  worker?: Worker
  active = false
  disabled = false

  private pendingJobs = new Map<
    number,
    {
      resolve: (value: any) => void
      reject: (reason?: any) => void
    }
  >()
  private messageId = 0

  private eventHandler = ((item: string) => {
    if (item === "experimental.parity.enabled") {
      if (Options.experimental.parity.enabled && this.active) {
        this.initializeWorker().then(() => this.calculateAll())
        return
      } else {
        this.terminateWorker()
      }
    }
    if (
      (item == "experimental.parity.showDebug" ||
        item == "experimental.parity.showGraph") &&
      this.worker &&
      (Options.experimental.parity.showDebug ||
        Options.experimental.parity.showGraph)
    ) {
      if (this.disabled) return
      this.postMessage({
        type: "getDebug",
      })
        .then(data => {
          this.chart.stats.parity!.debug = data.data!
        })
        .catch(error => {
          console.error("Failed to get parity debug data:", error)
        })
    }
  }).bind(this)

  constructor(chart: Chart) {
    super(chart)

    EventHandler.on("userOptionUpdated", this.eventHandler)
  }

  recalculate(startBeat: number, endBeat: number) {
    this.workerCalculate(startBeat, endBeat)
  }

  calculateAll() {
    this.workerCalculate(0, this.chart.getLastBeat())
  }

  // We can use a web worker to make sure the page doesn't freeze while calculating parity
  // This is good for long/complex charts
  workerCalculate(startBeat: number, endBeat: number) {
    if (!this.active || !Options.experimental.parity.enabled || this.disabled)
      return
    const start = performance.now()
    const notedata = this.chart.getNotedata()
    this.postMessage({
      type: "compute",
      startBeat,
      endBeat,
      notedata,
      debug:
        Options.experimental.parity.showDebug ||
        Options.experimental.parity.showGraph,
    })
      .then(data => {
        notedata.forEach(note => {
          const key = note.beat.toFixed(3) + "-" + note.col
          const foot = data.parityLabels.get(key)
          if (foot) {
            if (!note.parity) note.parity = {}
            note.parity.foot = foot
          }
        })
        if (!this.chart.stats.parity) {
          this.chart.stats.parity = {
            rowTimestamps: data.rowTimestamps,
            states: data.bestStates,
            techRows: data.techRows,
            techErrors: data.techErrors,
            debug: {
              notedataRows: [],
              nodeRows: [],
              edgeCacheSize: 0,
              nodeMap: new Map(),
              bestPath: [],
              bestPathCost: 0,
              bestPathSet: new Set(),
              stats: {
                lastUpdatedRowStart: -1,
                lastUpdatedOldRowEnd: -1,
                lastUpdatedRowEnd: -1,
                rowUpdateTime: 0,
                lastUpdatedNodeStart: -1,
                lastUpdatedNodeEnd: -1,
                nodeUpdateTime: 0,
                createdNodes: 0,
                createdEdges: 0,
                calculatedEdges: 0,
                cachedEdges: 0,
                edgeUpdateTime: 0,
                cachedBestRows: 0,
                pathUpdateTime: 0,
              },
            },
            debugTime: 0,
          }
        } else {
          this.chart.stats.parity.states = data.bestStates
          this.chart.stats.parity.techRows = data.techRows
          this.chart.stats.parity.techErrors = data.techErrors
          this.chart.stats.parity.rowTimestamps = data.rowTimestamps
        }
        if (data.debug) {
          // Incrementally recreate the debug data instead of sending it over
          const debugData = this.chart.stats.parity.debug

          const newRows = this.chart.stats.parity.debug.notedataRows
            .slice(0, data.debug.removedRowsStart)
            .concat(data.debug.newRows)
            .concat(debugData.notedataRows.slice(data.debug.removedRowsEnd))
          debugData.notedataRows = newRows

          const statesToRemove =
            data.debug?.newStates.length -
            (data.debug.newRows.length -
              data.debug.removedRowsEnd +
              data.debug.removedRowsStart)
          const removedStates = debugData.nodeRows.slice(
            Math.max(data.debug.removedRowsStart - 1, 0),
            statesToRemove
          )
          const newStates = this.chart.stats.parity.debug.nodeRows
            .slice(0, Math.max(0, data.debug.removedRowsStart - 1))
            .concat(data.debug.newStates)
            .concat(
              debugData.nodeRows.slice(
                Math.max(0, data.debug.removedRowsStart - 1 + statesToRemove)
              )
            )

          removedStates.forEach(row => {
            row.nodes.forEach(node => {
              debugData.nodeMap.delete(node.key)
            })
          })

          data.debug.newStates.forEach(row => {
            row.nodes.forEach(node => {
              debugData.nodeMap.set(node.key, node)
            })
          })

          debugData.nodeRows = newStates
          debugData.stats = data.debug.stats
          debugData.edgeCacheSize = data.debug.edgeCacheSize
          debugData.bestPath = data.debug.bestPath
          debugData.bestPathCost = data.debug.bestPathCost
          debugData.bestPathSet = data.debug.bestPathSet
        }

        this.chart.stats.parity.debugTime = performance.now() - start
        EventHandler.emit("parityModified")
      })
      .catch(error => {
        console.error("Failed to calculate parity:", error)
        this.chart.stats.parity!.debugTime = performance.now() - start
      })
  }

  async onLoad() {
    await this.initializeWorker()
    this.active = true
    this.calculateAll()
  }

  onUnload(): void {
    this.terminateWorker()
    this.active = false
  }

  reset() {}

  destroy() {
    EventHandler.off("userOptionUpdated", this.eventHandler)
  }

  async initializeWorker() {
    this.worker = new ParityInternals()
    this.worker.onmessage = (event: MessageEvent<ParityOutboundMessage>) => {
      const { id } = event.data
      if (this.pendingJobs.has(id)) {
        const job = this.pendingJobs.get(id)!
        this.pendingJobs.delete(id)
        if (event.data.type == "error") {
          job.reject(event.data.error)
        } else {
          job.resolve(event.data)
        }
      } else {
        console.warn(`Parity: Received message with unknown id: ${id}`)
      }
    }

    this.postMessage({
      type: "init",
      gameType: this.chart.gameType.id,
    }).catch(error => {
      WaterfallManager.createFormatted(
        "Failed to initialize parity worker: " + error,
        "error"
      )
      this.disabled = true
    })
  }

  terminateWorker() {
    this.disabled = false
    this.worker?.terminate()
    this.worker = undefined
    this.pendingJobs.forEach((job, id) => {
      job.reject(new Error("Parity worker terminated"))
      this.pendingJobs.delete(id)
    })
    this.messageId = 0
  }

  async postMessage<Message extends Omit<ParityInboundMessage, "id">>(
    message: Message
  ): Promise<Extract<ParityOutboundMessage, { type: Message["type"] }>> {
    if (!this.worker) {
      throw new Error("Parity worker is not initialized")
    }

    return new Promise((resolve, reject) => {
      const messageId = this.messageId
      this.worker!.postMessage({
        ...message,
        id: messageId,
      } as ParityInboundMessage)
      this.pendingJobs.set(messageId, { resolve, reject })
      this.messageId++
      if (this.messageId >= 10000) {
        this.messageId = 0
      }
    })
  }
}
