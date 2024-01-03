import { BitmapText } from "pixi.js"
import { lighten } from "../../../util/Color"
import { Options } from "../../../util/Options"
import { EditMode } from "../../ChartManager"
import { ChartRenderer, ChartRendererComponent } from "../../ChartRenderer"
import { TimingWindowCollection } from "../../play/TimingWindowCollection"

export class ComboNumber extends BitmapText implements ChartRendererComponent {
  private renderer: ChartRenderer

  constructor(renderer: ChartRenderer) {
    super({
      text: "",
      style: {
        fontFamily: "Fancy",
      },
    })
    this.anchor.set(0.5)
    this.renderer = renderer
  }

  update() {
    this.y = Options.chart.reverse ? -50 : 50
    const gameStats = this.renderer.chartManager.gameStats
    this.visible = this.renderer.chartManager.getMode() == EditMode.Play
    if (!gameStats) return
    const combo =
      gameStats.getCombo() == 0
        ? gameStats.getMissCombo()
        : gameStats.getCombo()
    if (combo < 4) this.text = ""
    else this.text = combo + ""

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
