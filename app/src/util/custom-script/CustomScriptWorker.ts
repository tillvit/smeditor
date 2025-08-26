import { EventHandler } from "../EventHandler"
import { createSMFromPayload, createSMPayload } from "./CustomScriptUtils"

self.onmessage = async (event: MessageEvent<CustomScriptWorkerArgs>) => {
  const { smPayload, codePayload, chartId, selectionNoteIndices, args } =
    event.data
  new EventHandler()
  const sm = await createSMFromPayload(smPayload)
  const chart = sm.charts[chartId]
  const selection = selectionNoteIndices.map(i => chart.getNotedata()[i])
  eval(codePayload)
  self.postMessage(createSMPayload(sm))
}
