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
import { applyPayloadToSM, createSMPayload } from "./CustomScriptUtils"
import CustomScriptWorker from "./CustomScriptWorker?worker"

export class CustomScriptRunner {
  static async run(app: App, script: CustomScript, args: any) {
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

    return new Promise(() => {
      worker.onmessage = (event: MessageEvent<CustomScriptResult>) => {
        if (event.data.type != "payload") {
          console[event.data.type](...event.data.args)
          return
        }
        const newState = event.data.payload
        console.log(newState)

        ActionHistory.instance.run({
          action: () => {
            applyPayloadToSM(app.chartManager.loadedSM!, newState)
            // assignPayloadToSM(app.chartManager.loadedSM!, newState)
            EventHandler.emit("chartModified")
            EventHandler.emit("timingModified")
          },
          undo: () => {
            applyPayloadToSM(app.chartManager.loadedSM!, previousState)
            // assignPayloadToSM(app.chartManager.loadedSM!, previousState)
            EventHandler.emit("chartModified")
            EventHandler.emit("timingModified")
          },
        })

        worker.terminate()
      }
    })
  }
}
