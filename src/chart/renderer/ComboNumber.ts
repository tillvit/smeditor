import { BitmapText } from "pixi.js"
import { Options } from "../../util/Options"
import { lighten } from "../../util/Util"
import { EditMode } from "../ChartManager"
import { ChartRenderer } from "../ChartRenderer"
import { TimingWindowCollection } from "../play/TimingWindowCollection"

export class ComboNumber extends BitmapText {
  private renderer: ChartRenderer

  constructor(renderer: ChartRenderer) {
    super("", {
      fontName: "Assistant-Fancy",
    })
    this.y = 50
    this.anchor.set(0.5)
    this.renderer = renderer
  }

  renderThis() {
    const gameStats = this.renderer.chartManager.gameStats
    this.visible = this.renderer.chartManager.getMode() == EditMode.Play
    if (!gameStats) return
    const val =
      gameStats.getCombo() == 0
        ? gameStats.getMissCombo()
        : gameStats.getCombo()
    if (val < 4) this.text = ""
    else this.text = val + ""
    if (gameStats.getCombo() == 0) {
      this.tint = TimingWindowCollection.getCollection(
        Options.play.timingCollection
      ).getMissJudgment().color
    } else if (gameStats.getBestJudge()) {
      this.tint = lighten(
        gameStats.getBestJudge()!.color,
        Math.sin(Date.now() / 225) * 0.2 + 1.2
      )
    } else {
      this.tint = 0xffffff
    }
  }
}
