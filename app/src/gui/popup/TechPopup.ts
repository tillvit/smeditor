import { TechBox } from "../../chart/component/edit/TechIndicators"
import {
  TECH_DESCRIPTIONS,
  TechCategory,
} from "../../chart/stats/parity/ParityDataTypes"
import { PopupData } from "./PopupManager"
import { SimplePopup } from "./SimplePopup"

export function TechPopup(box: TechBox, tech: TechCategory): PopupData {
  return SimplePopup({
    attach: box,
    label: TECH_DESCRIPTIONS[tech].title,
    description: TECH_DESCRIPTIONS[tech].description,
    id: "tech-popup",
    background: "#404040",
    width: 144,
    offset: { x: 0, y: 15 },
    pivot: { x: 0.5, y: 0 },
  })
}
