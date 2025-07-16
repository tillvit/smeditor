import { Color } from "pixi.js"
import { CandleBox } from "../../chart/component/edit/CandleIndicator"
import { PARITY_COLORS } from "../../chart/component/edit/ParityDebug"
import { Foot } from "../../chart/stats/parity/ParityDataTypes"
import { blendPixiColors } from "../../util/Color"
import { Popup } from "./Popup"

export class CandlePopup extends Popup {
  static box?: CandleBox
  static open(box: CandleBox, foot: Foot) {
    if (this.active) return
    this.box = box
    super._open({
      attach: box,
      title: "Candle",
      description: `The ${foot == Foot.LEFT_HEEL ? "left" : "right"} foot is used to vertically cross the center panel.`,
      width: 150,
      editable: false,
      cancelableOnOpen: false,
      background: blendPixiColors(
        new Color(PARITY_COLORS[foot]),
        new Color("black"),
        0.8
      ).toHex(),
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
