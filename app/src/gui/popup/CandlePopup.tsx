import { Color } from "pixi.js"
import { CandleBox } from "../../chart/component/edit/CandleIndicator"
import { Foot } from "../../chart/stats/parity/ParityDataTypes"
import { blendPixiColors, getParityColor } from "../../util/Color"
import { PopupData } from "./PopupManager"
import { SimplePopup } from "./SimplePopup"

export function CandlePopup(box: CandleBox, foot: Foot): PopupData {
  return SimplePopup({
    attach: box,
    label: "Candle",
    description: `The ${
      foot == Foot.LEFT_HEEL ? "left" : "right"
    } foot is used to vertically cross the center panel.`,
    id: "candle-popup",
    background: blendPixiColors(
      new Color(getParityColor(foot)),
      new Color("black"),
      0.8
    ).toHex(),
    width: 144,
    offset: { x: 0, y: 15 },
    pivot: { x: 0.5, y: 0 },
  })
}
