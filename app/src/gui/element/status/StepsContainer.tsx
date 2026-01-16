import { memo, useEffect, useState } from "react"
import { App } from "../../../App"
import { EditTimingMode } from "../../../chart/ChartManager"
import {
  HOLD_NOTE_TYPES,
  HoldNoteType,
  TapNoteType,
} from "../../../chart/sm/NoteTypes"
import { EventHandler } from "../../../util/EventHandler"
import { Keybinds } from "../../../util/Keybinds"

const PlaceHolderButton = memo(function (props: {
  noteType: TapNoteType
  app: App
}) {
  return (
    <button
      ref={el => {
        if (!el) return
        console.log("creating tooltip for", props.noteType)
        Keybinds.createKeybindTooltip(el)`${"\\" + props.noteType} ${
          "noteType" + props.noteType
        }`
      }}
      data-note-type={props.noteType}
      tabIndex={-1}
      style={{ height: `3rem`, width: `3rem` }}
      className="note-placeholder"
      onClick={e => {
        props.app.chartManager.setEditingNoteType(props.noteType)
        e.currentTarget.blur()
      }}
      onMouseEnter={e => {
        e.currentTarget.dataset.hovered = "true"
      }}
      onMouseLeave={e => {
        e.currentTarget.dataset.hovered = "false"
      }}
    />
  )
})

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
        <PlaceHolderButton
          key={placeholder}
          noteType={placeholder}
          app={props.app}
        />
      ))}
      <div className="note-placeholder-right"></div>
    </div>
  )
}
