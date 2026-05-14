import { App } from "../../App"
import { WaterfallManager } from "../../gui/element/WaterfallManager"
import { CustomScriptTriggerWindow } from "../../gui/window/CustomScript/CustomScriptTriggerWindow"
import { WindowManager } from "../../gui/window/WindowManager"
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
  static MAX_LENGTH = 10000
  static activeWorkers = new Set<Worker>()

  static async runPrompt(
    app: App,
    script: CustomScript,
    logCallback?: (
      type: "log" | "error" | "warn" | "info",
      ...data: any[]
    ) => void,
    onFinish?: () => void,
    onStart?: () => void
  ) {
    if (script.arguments.length == 0) {
      onStart?.()
      return CustomScriptRunner.run(app, script, [], logCallback, onFinish)
    }

    return new Promise<Worker | undefined>(resolve => {
      const window = CustomScriptTriggerWindow(script, args => {
        onStart?.()
        resolve(
          CustomScriptRunner.run(app, script, args, logCallback, onFinish)
        )
      })
      WindowManager.openWindow(window)
    })
  }

  static run(
    app: App,
    script: CustomScript,
    args: (string | number | boolean)[],
    logCallback?: (
      type: "log" | "error" | "warn" | "info",
      ...data: any[]
    ) => void,
    onFinish?: () => void
  ) {
    if (!app.chartManager.loadedSM || !app.chartManager.loadedChart) {
      WaterfallManager.createFormatted("No SM loaded!", "warn")
      onFinish?.()
      return
    }

    if (script.jsCode === null) {
      WaterfallManager.createFormatted("The script failed to run!", "error")
      onFinish?.()
      return
    }

    let selectionData = null

    if (app.chartManager.selection.notes.length > 0) {
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
      selectionData = {
        type: "notes" as const,
        indices: selectionNoteIndices,
        range: app.chartManager.getRange()!,
      }
    } else if (app.chartManager.eventSelection.timingEvents.length > 0) {
      const events = app.chartManager.eventSelection.timingEvents
      const timingData = app.chartManager.loadedChart.timingData.getTimingData()
      let selectionEventIndex = 0
      const selectionEventIndices = []
      for (let i = 0; i < timingData.length; i++) {
        if (selectionEventIndex >= events.length) break
        if (
          isSameRow(events[selectionEventIndex].beat, timingData[i].beat) &&
          events[selectionEventIndex].type === timingData[i].type
        ) {
          selectionEventIndices.push(i)
          selectionEventIndex++
        }
      }
      selectionData = {
        type: "timing" as const,
        indices: selectionEventIndices,
        range: app.chartManager.getRange()!,
      }
    } else if (app.chartManager.hasRange()) {
      selectionData = {
        type: "notes" as const,
        indices: [],
        range: app.chartManager.getRange()!,
      }
    }

    const previousState = createSMPayload(app.chartManager.loadedSM)

    const workerArgs: CustomScriptWorkerArgs = {
      smPayload: previousState,
      codePayload: script.jsCode,
      chartId: app.chartManager.loadedChart._id!,
      selection: selectionData,
      args,
    }

    const worker = new CustomScriptWorker()
    CustomScriptRunner.activeWorkers.add(worker)
    worker.postMessage(workerArgs)
    worker.onerror = e => {
      logCallback?.("error", "Validation failed: \n" + e.error.message)
      console.error("Custom script error:", e)
      worker.terminate()
      CustomScriptRunner.activeWorkers.delete(worker)
      onFinish?.()
    }
    worker.onmessage = (event: MessageEvent<CustomScriptResult>) => {
      if (event.data.type == "close") {
        worker.terminate()
        onFinish?.()
        return
      }
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
        onFinish?.()
        worker.terminate()
        onFinish?.()
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
      CustomScriptRunner.activeWorkers.delete(worker)
      onFinish?.()
    }

    return worker
  }

  static stopAll() {
    CustomScriptRunner.activeWorkers.forEach(worker => {
      worker.terminate()
    })
    CustomScriptRunner.activeWorkers.clear()
  }
}
