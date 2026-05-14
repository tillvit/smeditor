import { useContext, useEffect, useState } from "react"
import { TechBox } from "../../chart/component/edit/TechErrorIndicators"
import { Chart } from "../../chart/sm/Chart"
import {
  TECH_ERROR_DESCRIPTIONS,
  TechErrors,
} from "../../chart/stats/parity/ParityDataTypes"
import { EventHandler } from "../../util/EventHandler"
import { PopupContext, PopupData } from "./PopupManager"

interface TechErrorPopupOptions {
  box: TechBox
  beat: number
  error: TechErrors
  ignored: boolean
  chart: Chart
}

function TechErrorPopupContent(props: TechErrorPopupOptions) {
  const popupData = useContext(PopupContext)
  const [ignored, setIgnored] = useState(props.ignored)

  useEffect(() => {
    const onParityChange = () => {
      const ignored = props.chart.isErrorIgnored(props.error, props.beat)
      setIgnored(ignored)
      popupData?.setBackground(ignored ? "#404040" : "#41031c")
    }
    EventHandler.on("parityModified", onParityChange)
    EventHandler.on("parityIgnoresModified", onParityChange)
    popupData?.setBackground(ignored ? "#404040" : "#41031c")
    return () => {
      EventHandler.off("parityModified", onParityChange)
      EventHandler.off("parityIgnoresModified", onParityChange)
    }
  }, [])

  return (
    <div
      className="flex-column-full"
      style={{ padding: "0.5rem", color: "white" }}
    >
      <div className="popup-title">
        {TECH_ERROR_DESCRIPTIONS[props.error].title}
      </div>
      <div className="popup-desc">
        {TECH_ERROR_DESCRIPTIONS[props.error].description}
      </div>
      <div
        className="popup-detail"
        style={{ height: "10px", marginTop: "4px" }}
      >
        click to {ignored ? "unignore" : "ignore"}
      </div>
    </div>
  )
}

export function TechErrorPopup(options: TechErrorPopupOptions): PopupData {
  return {
    attach: options.box,
    id: "tech-error-popup",
    width: 200,
    background: options.ignored ? "#404040" : "#41031c",
    offset: { x: 0, y: 15 },
    pivot: { x: 0.5, y: 0 },
    content: <TechErrorPopupContent {...options} />,
  }
}
