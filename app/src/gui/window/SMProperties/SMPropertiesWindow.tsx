import { useContext, useEffect, useRef } from "react"
import { Simfile } from "../../../chart/sm/Simfile"
import { SimfileProperty } from "../../../chart/sm/SimfileTypes"
import { ActionHistory } from "../../../util/ActionHistory"
import { EventHandler } from "../../../util/EventHandler"
import { WindowContext, WindowData } from "../WindowManager"
import { SMPropertyEditor } from "./SMPropertyEditor"

function SMPropertiesWindowContent() {
  const windowData = useContext(WindowContext)
  const smRef = useRef<Simfile | null>(null)

  function updateProperty(
    prop: SimfileProperty,
    value: string | File | undefined
  ) {
    if (!smRef.current) return
    if (value instanceof File) return
    const lastValue = smRef.current.properties[prop]
    if (lastValue === value) return

    ActionHistory.instance.run({
      action: () => {
        smRef.current!.properties[prop] = value
        EventHandler.emit("smModified")
        if (prop === "MUSIC") {
          windowData?.app.chartManager.loadAudio()
        }
      },
      undo: () => {
        smRef.current!.properties[prop] = lastValue
        EventHandler.emit("smModified")
        if (prop === "MUSIC") {
          windowData?.app.chartManager.loadAudio()
        }
      },
    })
  }

  useEffect(() => {
    if (!windowData) return
    smRef.current = windowData.app.chartManager.loadedSM!
  }, [])

  return (
    <div className="flex-column-full">
      {smRef.current && (
        <SMPropertyEditor
          sm={smRef.current}
          onChange={updateProperty}
          newSong={false}
        />
      )}
    </div>
  )
}
export function SMPropertiesWindow(): WindowData {
  return {
    title: "Song Properties",
    width: 450,
    id: "sm_properties",
    content: <SMPropertiesWindowContent />,
  }
}
