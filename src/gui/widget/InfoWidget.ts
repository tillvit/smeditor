import { BetterRoundedRect } from "../../util/BetterRoundedRect"
import { Widget } from "./Widget"
import { WidgetManager } from "./WidgetManager"

const WIDGET_WIDTH = 300

export class InfoWidget extends Widget {
  background = new BetterRoundedRect()

  constructor(manager: WidgetManager) {
    super(manager)
    this.addChild(this.background)
    this.background.tint = 0
    this.background.alpha = 0.3
    this.background.width = WIDGET_WIDTH
  }

  update(): void {
    this.x = -this.manager.app.renderer.screen.width / 2 + 20
    this.y = -this.manager.app.renderer.screen.height / 2 + 20
  }
}
