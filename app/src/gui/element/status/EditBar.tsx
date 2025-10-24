import { App } from "../../../App"
import { EditTimingMode } from "../../../chart/ChartManager"
import { EventHandler } from "../../../util/EventHandler"
import { ReactIcon } from "../../Icons"
import { StepsContainer } from "./StepsContainer"
import { TimingContainer } from "./TimingContainer"

export function EditBar(props: { app: App; timingMode: EditTimingMode }) {
  return (
    <div className="edit-bar">
      <div className="edit-bar-left">
        <button
          tabIndex={-1}
          onClick={e => {
            props.app.chartManager.editTimingMode = EditTimingMode.Off
            EventHandler.emit("timingModeChanged")
            e.currentTarget.blur()
          }}
          className={`edit-fancy-button ${props.timingMode == EditTimingMode.Off ? "active" : ""}`}
        >
          <ReactIcon
            id="FEET"
            width={24}
            height={24}
            style={{ marginBottom: `${2 / 16}rem` }}
          />
          Edit Steps
        </button>
        <button
          tabIndex={-1}
          onClick={e => {
            props.app.chartManager.editTimingMode = EditTimingMode.Edit
            EventHandler.emit("timingModeChanged")
            e.currentTarget.blur()
          }}
          className={`edit-fancy-button ${props.timingMode != EditTimingMode.Off ? "active" : ""}`}
        >
          <ReactIcon
            id="METRONOME"
            width={24}
            height={24}
            style={{ marginBottom: `${2 / 16}rem` }}
          />
          Edit Timing
        </button>
        <div className="playback-separator"></div>
      </div>
      <div className="edit-choice-container">
        <StepsContainer app={props.app} timingMode={props.timingMode} />
        <TimingContainer app={props.app} timingMode={props.timingMode} />
      </div>
    </div>
  )
}
