import { TechBox } from "../../chart/component/edit/TechIndicators"
import {
  TECH_DESCRIPTIONS,
  TechCategory,
} from "../../chart/stats/parity/ParityDataTypes"
import { Popup } from "./Popup"

export class TechPopup extends Popup {
  static box?: TechBox
  static open(box: TechBox, tech: TechCategory) {
    if (this.active) return
    this.box = box
    super._open({
      attach: box,
      title: TECH_DESCRIPTIONS[tech].title,
      description: TECH_DESCRIPTIONS[tech].description,
      width: 150,
      editable: false,
      cancelableOnOpen: false,
      background: "#404040",
      textColor: "#ffffff",
      options: [],
    })
  }
  static close() {
    if (!this.active) return
    super.close()
    this.box = undefined
  }
}
