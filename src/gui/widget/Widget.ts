import { Container } from "pixi.js"
import { WidgetManager } from "./WidgetManager"

export abstract class Widget extends Container {
  manager: WidgetManager

  constructor(manager: WidgetManager) {
    super()
    this.manager = manager
  }

  abstract update(): void

  startPlay() {
    return
  }

  endPlay() {
    return
  }
}
