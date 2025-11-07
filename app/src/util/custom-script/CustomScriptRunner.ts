import { App } from "../../App"
import { WaterfallManager } from "../../gui/element/WaterfallManager"
import { ActionHistory } from "../ActionHistory"
import { EventHandler } from "../EventHandler"
import { isSameRow } from "../Util"
import {
  CustomScript,
  CustomScriptResult,
  CustomScriptWorkerArgs,
} from "./CustomScriptTypes"
import {
  applyPayloadToSM,
  createSMPayload,
  SMPayload,
  validatePayload,
} from "./CustomScriptUtils"
import CustomScriptWorker from "./CustomScriptWorker?worker"

export class CustomScriptRunner {
  static run(
    app: App,
    script: CustomScript,
    args: any,
    logCallback?: (
      type: "log" | "error" | "warn" | "info",
      ...data: any[]
    ) => void
  ) {
    if (!app.chartManager.loadedSM || !app.chartManager.loadedChart) return
    const noteSelection = app.chartManager.selection.notes
    const notedata = app.chartManager.loadedChart.getNotedata()
    let selectionNoteIndex = 0
    const selectionNoteIndices = []
    for (let i = 0; i < notedata.length; i++) {
      if (selectionNoteIndex >= noteSelection.length) break
      if (
        isSameRow(noteSelection[selectionNoteIndex].beat, notedata[i].beat) &&
        notedata[i].col === noteSelection[selectionNoteIndex].col
      ) {
        selectionNoteIndices.push(i)
        selectionNoteIndex++
      }
    }

    const previousState = createSMPayload(app.chartManager.loadedSM)
    console.log("Previous state:", previousState)

    const workerArgs: CustomScriptWorkerArgs = {
      smPayload: previousState,
      codePayload: script.jsCode,
      chartId: app.chartManager.loadedChart._id!,
      selectionNoteIndices,
      // todo add selection event indices
      args,
    }

    const worker = new CustomScriptWorker()
    worker.postMessage(workerArgs)
    worker.onerror = e => {
      WaterfallManager.createFormatted(
        `Custom script "${script.name}" failed: ${e.message}`,
        "error"
      )
      console.error("Custom script error:", e)
      worker.terminate()
    }
    worker.onmessage = (event: MessageEvent<CustomScriptResult>) => {
      if (event.data.type != "payload") {
        if (["log", "error", "warn", "info"].includes(event.data.type)) {
          logCallback?.(event.data.type, ...event.data.args)
        }
        return
      }
      const newState = event.data.payload
      let payload: SMPayload
      try {
        payload = validatePayload(newState)
      } catch (e: any) {
        console.error((e as Error).message)
        logCallback?.("error", "Validation failed: \n" + (e as Error).message)
        worker.terminate()
        return
      }

      ActionHistory.instance.run({
        action: () => {
          applyPayloadToSM(app.chartManager.loadedSM!, payload)
          EventHandler.emit("chartModified")
          EventHandler.emit("timingModified")
        },
        undo: () => {
          applyPayloadToSM(app.chartManager.loadedSM!, previousState)
          EventHandler.emit("chartModified")
          EventHandler.emit("timingModified")
        },
      })

      worker.terminate()
    }

    return worker
  }
}
