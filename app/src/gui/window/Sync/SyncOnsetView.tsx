import {
  Dispatch,
  SetStateAction,
  useContext,
  useEffect,
  useState,
} from "react"
import { EventHandler } from "../../../util/EventHandler"
import { DisplaySliderInput } from "../../inputs/DisplaySliderInput"
import { WindowContext } from "../WindowManager"
import { SyncLabel } from "./SyncLabel"
import { SyncData } from "./SyncWindow"

export function SyncOnsetView(props: {
  syncData: SyncData
  onsetThreshold: number
  setOnsetThreshold: Dispatch<SetStateAction<number>>
  placeOnsets: (selection?: boolean) => void
}) {
  const app = useContext(WindowContext)!.app
  const [hasSelection, setHasSelection] = useState(false)

  useEffect(() => {
    const onRegionChange = () => {
      const hasSelection = !(
        app.chartManager.startRegion === undefined ||
        app.chartManager.endRegion === undefined ||
        app.chartManager.startRegion == app.chartManager.endRegion
      )
      setHasSelection(hasSelection)
    }
    EventHandler.on("regionChanged", onRegionChange)
    return () => EventHandler.off("regionChanged", onRegionChange)
  }, [])

  return (
    <div
      className="flex-column-full"
      style={{
        position: "relative",
        gap: "0.625rem",
        justifyContent: "center",
      }}
    >
      <SyncLabel
        text="Onset Threshold"
        tooltip="Adjust the threshold for a block to be considered an onset (red line)."
      >
        <DisplaySliderInput
          min={0}
          max={1}
          step={0.01}
          value={props.onsetThreshold}
          onChange={value => {
            props.setOnsetThreshold(value)
          }}
        />
      </SyncLabel>
      <div
        style={{
          color: "#888",
          fontStyle: "italic",
          fontSize: "0.75rem",
          marginBottom: "1rem",
          marginTop: "-0.375rem",
          alignSelf: "center",
        }}
      >
        Found {props.syncData.numOnsets} onsets
      </div>
      <div style={{ display: "flex", justifyContent: "space-between" }}>
        <button onClick={() => props.placeOnsets()}>
          Place onsets as notes
        </button>
        <button
          onClick={() => props.placeOnsets(true)}
          disabled={!hasSelection}
        >
          Place onsets as notes in selection
        </button>
      </div>
    </div>
  )
}
