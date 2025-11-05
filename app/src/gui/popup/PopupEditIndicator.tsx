import { useContext } from "react"
import { PopupContext } from "./PopupManager"

export function PopupEditIndicator() {
  const popupData = useContext(PopupContext)!
  const highlighted = popupData.highlighted ?? false
  return (
    <div
      className="popup-detail"
      style={
        highlighted
          ? { transform: "scale(0)", height: "0" }
          : { height: "10px", marginTop: "4px" }
      }
    >
      click to edit
    </div>
  )
}
