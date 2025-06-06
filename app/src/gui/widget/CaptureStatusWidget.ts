import { BitmapText, Sprite, Texture } from "pixi.js"
import { BetterRoundedRect } from "../../util/BetterRoundedRect"
import { assignTint } from "../../util/Color"
import { roundDigit } from "../../util/Math"
import { Options } from "../../util/Options"
import { Widget } from "./Widget"
import { WidgetManager } from "./WidgetManager"

export class CaptureStatusWidget extends Widget {
  timeText: BitmapText
  beatText: BitmapText
  measureText: BitmapText

  constructor(manager: WidgetManager) {
    super(manager)

    const bg = new BetterRoundedRect("noBorder")
    bg.width = 330
    bg.height = 48
    bg.tint = 0xff0000
    bg.pivot.set(bg.width / 2, bg.height)
    this.addChild(bg)
    assignTint(bg, "widget-bg")

    this.timeText = this.createCounter("Time", {
      x: -110,
      y: -32,
    })

    this.createLine({ x: -55, y: -40 })

    this.beatText = this.createCounter("Beat", {
      x: 0,
      y: -32,
    })

    this.createLine({ x: 55, y: -40 })

    this.measureText = this.createCounter("Measure", {
      x: 110,
      y: -32,
    })

    // this.visible = false
  }

  private createCounter(label: string, position: { x: number; y: number }) {
    const text = new BitmapText("", {
      fontSize: 32,
      fontName: "Main",
    })
    text.scale.set((16 * 1.1) / 32)
    text.anchor.set(0.5, 0.5)
    text.position.set(position.x, position.y)
    this.addChild(text)
    assignTint(text, "text-color")

    const labelObj = new BitmapText(label, {
      fontSize: 32,
      fontName: "Main",
    })
    labelObj.scale.set((16 * 0.6) / 32)
    labelObj.anchor.set(0.5, 0.5)
    labelObj.position.set(position.x, position.y + 16)
    this.addChild(labelObj)
    assignTint(labelObj, "text-color-secondary")

    return text
  }

  private createLine(position: { x: number; y: number }) {
    const line = new Sprite(Texture.WHITE)
    line.width = 1
    line.height = 32
    line.position.set(position.x, position.y)
    line.tint = 0x868686
    line.alpha = 0.5
    this.addChild(line)
  }

  update(): void {
    if (!this.manager.app.capturing) {
      this.visible = false
      return
    }
    this.visible = true

    this.scale.set(
      Options.performance.resolution * Options.general.uiScale * 0.7
    )
    this.position.y =
      this.manager.app.STAGE_HEIGHT / 2 -
      32 * Options.performance.resolution * Options.general.uiScale * 0.7

    const measure =
      this.manager.chartManager.loadedChart?.timingData?.getMeasure(
        this.manager.chartManager.beat
      ) ?? this.manager.chartManager.beat / 4
    const time = this.manager.chartManager.time
    this.measureText.text = roundDigit(measure, 3).toFixed(3)
    this.beatText.text = roundDigit(this.manager.chartManager.beat, 3).toFixed(
      3
    )

    let t = ""
    t +=
      (time < 0 ? "-" : "") +
      Math.floor(Math.abs(time) / 60)
        .toString()
        .padStart(2, "0")
    t += ":"
    t += Math.floor(Math.abs(time) % 60)
      .toString()
      .padStart(2, "0")
    t += "."

    t += (roundDigit(Math.abs(time) % 1, 3) * 1000).toString().padStart(3, "0")
    this.timeText.text = t
  }
}
