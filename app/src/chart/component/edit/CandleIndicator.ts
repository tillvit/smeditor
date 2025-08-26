import { BitmapText, Color, Container, Sprite, Texture } from "pixi.js"
import { CandlePopup } from "../../../gui/popup/CandlePopup"
import { BetterRoundedRect } from "../../../util/BetterRoundedRect"
import { blendPixiColors, getParityColor } from "../../../util/Color"
import { DisplayObjectPool } from "../../../util/DisplayObjectPool"
import { EventHandler } from "../../../util/EventHandler"
import { Options } from "../../../util/Options"
import { EditMode } from "../../ChartManager"
import { ChartRenderer, ChartRendererComponent } from "../../ChartRenderer"
import { Foot } from "../../stats/parity/ParityDataTypes"
import { RowStacker } from "../RowStacker"

export interface CandleBox extends Container {
  bg: BetterRoundedRect
  textObj: BitmapText
}

export class CandleIndicator
  extends Container
  implements ChartRendererComponent
{
  readonly isEditGUI = true
  private renderer: ChartRenderer
  private parityDirty = false

  private boxPool = new DisplayObjectPool({
    create: () => {
      return this.createBox()
    },
  })
  private highlightPool = new DisplayObjectPool({
    create: () => {
      const highlight = new Sprite(Texture.WHITE)
      highlight.height = 16
      highlight.alpha = 0.6
      highlight.anchor.set(0.5, 0.5)
      return highlight
    },
  })

  private rowMap = new Map<number, { box: CandleBox; highlight: Sprite }>()

  constructor(renderer: ChartRenderer) {
    super()
    this.renderer = renderer

    this.addChild(this.highlightPool)
    this.addChild(this.boxPool)

    const parityChanged = () => {
      CandlePopup.close()
      this.parityDirty = true
    }
    const colorChange = (optionId: string) => {
      if (
        [
          "chart.parity.leftHeelColor",
          "chart.parity.leftToeColor",
          "chart.parity.rightHeelColor",
          "chart.parity.rightToeColor",
        ].includes(optionId)
      ) {
        this.parityDirty = true
      }
    }
    EventHandler.on("userOptionUpdated", colorChange)
    EventHandler.on("parityModified", parityChanged)
    this.on("destroyed", () => {
      EventHandler.off("userOptionUpdated", colorChange)
      EventHandler.off("parityModified", parityChanged)
    })
  }

  update(firstBeat: number, lastBeat: number) {
    const parity = this.renderer.chart.stats.parity
    if (
      !parity ||
      !Options.chart.parity.enabled ||
      !Options.chart.parity.showCandles
    ) {
      this.visible = false
      return
    }
    this.visible = true
    if (this.parityDirty) {
      this.rowMap.clear()
      this.boxPool.destroyAll()
      this.highlightPool.destroyAll()
      this.parityDirty = false
    }

    // Create all missing boxes
    for (const rowIdx of parity.candles.keys()) {
      const position = parity.rowTimestamps[rowIdx]
      if (lastBeat < position.beat) continue
      if (firstBeat > position.beat) continue

      if (!this.rowMap.has(rowIdx)) {
        const foot = parity.candles.get(rowIdx)!
        const boxes = []
        const box = this.boxPool.createChild()
        const highlight = this.highlightPool.createChild()
        if (!box || !highlight) break
        RowStacker.instance.register(
          box,
          position.beat,
          position.second,
          "left",
          30
        )
        boxes.push(box)
        box.textObj.text = foot == Foot.LEFT_HEEL ? "C" : "C"
        const darkColor = blendPixiColors(
          new Color(getParityColor(foot)),
          new Color("black"),
          0.5
        )

        box.bg.tint = darkColor

        box.on("mouseenter", () => {
          if (this.renderer.isDragSelecting()) return

          if (CandlePopup.active) CandlePopup.close()
          if (this.renderer.chartManager.getMode() == EditMode.Edit) {
            CandlePopup.open(box, foot)
          }
        })
        box.on("mouseleave", () => {
          CandlePopup.close()
        })

        box.eventMode = "static"

        highlight.width = this.renderer.chart.gameType.notefieldWidth + 80
        highlight.tint = darkColor
        this.rowMap.set(rowIdx, { box, highlight })
      }
    }

    for (const [i, items] of this.rowMap.entries()) {
      const position = parity.rowTimestamps[i]
      if (!position) continue
      if (position.beat < firstBeat || position.beat > lastBeat) {
        this.rowMap.delete(i)
        this.boxPool.destroyChild(items.box)
        this.highlightPool.destroyChild(items.highlight)
        if (CandlePopup.box == items.box) CandlePopup.close()
        continue
      }
      const yPos = this.renderer.getYPosFromBeat(position.beat)
      items.highlight.y = yPos
    }
  }

  createBox() {
    const newChild = new Container() as CandleBox
    newChild.textObj = new BitmapText("", {
      fontName: "Fancy",
      fontSize: 15,
    })
    const bg = new BetterRoundedRect("noBorder")
    newChild.bg = bg

    newChild.addChild(bg, newChild.textObj)

    newChild.textObj.anchor.set(0.5, 0.55)
    newChild.bg.width = newChild.textObj.width + 18
    newChild.bg.height = 25
    newChild.bg.position.x = -newChild.bg.width / 2
    newChild.bg.position.y = -25 / 2

    return newChild
  }
}
