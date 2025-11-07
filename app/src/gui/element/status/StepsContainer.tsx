import { useEffect, useState } from "react"
import { App } from "../../../App"
import { EditTimingMode } from "../../../chart/ChartManager"
import {
  HOLD_NOTE_TYPES,
  HoldNoteType,
  TapNoteType,
} from "../../../chart/sm/NoteTypes"
import { EventHandler } from "../../../util/EventHandler"
import { Keybinds } from "../../../util/Keybinds"

export function StepsContainer(props: {
  app: App
  timingMode: EditTimingMode
}) {
  const [placeholders, setPlaceholders] = useState<TapNoteType[]>([])

  useEffect(() => {
    const noteskinLoaded = () => {
      if (!props.app.chartManager.loadedChart) return
      const types =
        props.app.chartManager.loadedChart.gameType.editNoteTypes.filter(
          type => !HOLD_NOTE_TYPES.includes(type as HoldNoteType)
        )

      setPlaceholders(types)
    }
    noteskinLoaded()
    EventHandler.on("noteskinLoaded", noteskinLoaded)
    return () => {
      EventHandler.off("noteskinLoaded", noteskinLoaded)
    }
  }, [props.app])

  return (
    <div
      className="edit-steps-container"
      style={{
        transform:
          props.timingMode == EditTimingMode.Off ? "" : "translateY(-3rem)",
      }}
    >
      {placeholders.map(placeholder => (
        <button
          key={placeholder}
          ref={el => {
            if (!el) return
            Keybinds.createKeybindTooltip(el)`${"\\" + placeholder} ${
              "noteType" + placeholder
            }`
          }}
          data-note-type={placeholder}
          tabIndex={-1}
          style={{ height: `3rem`, width: `3rem` }}
          className="note-placeholder"
          onClick={e => {
            props.app.chartManager.setEditingNoteType(placeholder)
            e.currentTarget.blur()
          }}
          onMouseEnter={e => {
            e.currentTarget.dataset.hovered = "true"
          }}
          onMouseLeave={e => {
            e.currentTarget.dataset.hovered = "false"
          }}
        />
      ))}
      <div className="note-placeholder-right"></div>
    </div>
  )
}
