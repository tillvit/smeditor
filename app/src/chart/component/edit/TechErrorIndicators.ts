import bezier from "bezier-easing"
import {
  BitmapText,
  Container,
  Graphics,
  RenderTexture,
  Sprite,
  Texture,
} from "pixi.js"
import { TechErrorPopup } from "../../../gui/popup/TechErrorPopup"
import { BetterRoundedRect } from "../../../util/BetterRoundedRect"
import { BezierAnimator } from "../../../util/BezierEasing"
import { DisplayObjectPool } from "../../../util/DisplayObjectPool"
import { EventHandler } from "../../../util/EventHandler"
import { Options } from "../../../util/Options"
import { isRightClick } from "../../../util/PixiUtil"
import { nextInSorted, previousInSorted } from "../../../util/Util"
import { EditMode } from "../../ChartManager"
import { ChartRenderer, ChartRendererComponent } from "../../ChartRenderer"
import { TECH_ERROR_STRINGS } from "../../stats/parity/ParityDataTypes"
import { RowStacker } from "../RowStacker"

export interface TechBox extends Container {
  bg: BetterRoundedRect
  icon: Container
  textObj: BitmapText
  setText(text: string): void
  ignore(): void
  unignore(): void
}

export class TechErrorIndicators
  extends Container
  implements ChartRendererComponent
{
  readonly isEditGUI = true
  private renderer: ChartRenderer
  private parityDirty = false
  private errorIconTexture: RenderTexture
  private errorIconIgnoredTexture: RenderTexture

  private boxPool = new DisplayObjectPool({
    create: () => {
      return this.createErrorBox()
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

  private reposition = false

  private topCounter: TechBox
  private bottomCounter: TechBox

  private previousTopVisible = false
  private previousBottomVisible = false

  private rowMap = new Map<number, { boxes: TechBox[]; highlight: Sprite }>()

  children: Container[] = []

  constructor(renderer: ChartRenderer) {
    super()
    this.renderer = renderer

    this.addChild(this.highlightPool)
    this.addChild(this.boxPool)

    const parityChanged = () => {
      this.parityDirty = true
    }
    const repositionHandler = (optionId: string) => {
      if (
        optionId == "chart.zoom" ||
        optionId == "chart.reverse" ||
        optionId == "general.uiScale"
      )
        this.reposition = true
    }
    EventHandler.on("parityModified", parityChanged)
    EventHandler.on("parityIgnoresModified", parityChanged)
    EventHandler.on("userOptionUpdated", repositionHandler)
    this.on("destroyed", () => {
      EventHandler.off("parityModified", parityChanged)
      EventHandler.off("parityIgnoresModified", parityChanged)
      EventHandler.off("userOptionUpdated", repositionHandler)
    })

    const circle = new Graphics()
    circle.beginFill(0xad0e4e)
    circle.drawCircle(0, 0, 12)
    circle.endFill()
    circle.lineStyle(0.5, 0x000000)
    circle.drawCircle(0, 0, 12)
    circle.lineStyle(0.5, 0xffffff)
    circle.drawCircle(0, 0, 10)
    const exclaimation = new BitmapText("!", {
      fontName: "Fancy",
      fontSize: 15,
    })
    exclaimation.anchor.set(0.5, 0.5)
    exclaimation.y -= 2
    exclaimation.x += 0.3
    const icon = new Container()
    icon.addChild(circle, exclaimation)
    icon.x = 16
    icon.y = 16

    this.errorIconTexture = RenderTexture.create({
      resolution: Options.performance.resolution,
      width: 32,
      height: 32,
    })
    this.renderer.chartManager.app.renderer.render(icon, {
      renderTexture: this.errorIconTexture,
    })

    circle.clear()
    circle.beginFill(0x444444)
    circle.drawCircle(0, 0, 12)
    circle.endFill()
    circle.lineStyle(0.5, 0x000000)
    circle.drawCircle(0, 0, 12)
    circle.lineStyle(0.5, 0xffffff)
    circle.drawCircle(0, 0, 10)

    this.errorIconIgnoredTexture = RenderTexture.create({
      resolution: Options.performance.resolution,
      width: 32,
      height: 32,
    })
    this.renderer.chartManager.app.renderer.render(icon, {
      renderTexture: this.errorIconIgnoredTexture,
    })

    this.topCounter = this.createErrorBox()
    this.bottomCounter = this.createErrorBox()

    const chevron = new Graphics()
    chevron.beginFill(0xffffff)
    chevron.moveTo(6, 0)
    chevron.lineTo(0, -6)
    chevron.lineTo(-6, 0)
    chevron.endFill()
    chevron.y = -15
    this.topCounter.addChild(chevron)
    const oldSetText = this.topCounter.setText.bind(this.topCounter)
    this.topCounter.setText = (text: string) => {
      oldSetText(text)
      chevron.x = -this.topCounter.textObj.width / 2 + 16
    }

    const chevron2 = new Graphics()
    chevron2.beginFill(0xffffff)
    chevron2.moveTo(6, 0)
    chevron2.lineTo(0, 6)
    chevron2.lineTo(-6, 0)
    chevron2.endFill()
    this.bottomCounter.addChild(chevron2)
    chevron2.y = 15
    const oldSetText2 = this.bottomCounter.setText.bind(this.bottomCounter)
    this.bottomCounter.setText = (text: string) => {
      oldSetText2(text)
      chevron2.x = -this.bottomCounter.textObj.width / 2 + 16
    }

    this.topCounter.y = Options.chart.reverse
      ? this.renderer.chartManager.app.STAGE_HEIGHT / 2 + 50
      : -this.renderer.chartManager.app.STAGE_HEIGHT / 2 - 50
    this.topCounter.y /= Options.chart.zoom
    this.bottomCounter.y = Options.chart.reverse
      ? -this.renderer.chartManager.app.STAGE_HEIGHT / 2 - 50
      : this.renderer.chartManager.app.STAGE_HEIGHT / 2 + 50
    this.bottomCounter.y /= Options.chart.zoom

    this.addChild(this.topCounter, this.bottomCounter)

    this.topCounter.on("pointerover", () => {
      BezierAnimator.animate(
        this.topCounter.scale,
        { 0: { x: "inherit", y: "inherit" }, 1: { x: 1.4, y: 1.4 } },
        Options.general.smoothAnimations ? 0.3 : 0,
        bezier(0, 0, 0.16, 1.01),
        () => {},
        "te-top-hover"
      )
    })
    this.topCounter.on("pointerout", () => {
      BezierAnimator.animate(
        this.topCounter.scale,
        { 0: { x: "inherit", y: "inherit" }, 1: { x: 1.25, y: 1.25 } },
        Options.general.smoothAnimations ? 0.3 : 0,
        bezier(0, 0, 0.16, 1.01),
        () => {},
        "te-top-hover"
      )
    })

    this.topCounter.on("pointerdown", event => {
      if (!this.renderer.chart.stats.parity) return
      const errorBeats = this.renderer.chart
        .getTechErrors(event.shiftKey)
        .map(error => error.beat)

      const nextBeat = previousInSorted(
        errorBeats,
        this.renderer.chartManager.beat
      )
      if (nextBeat !== null) {
        event.stopImmediatePropagation()
        this.renderer.chartManager.beat = nextBeat
      }
    })
    this.topCounter.eventMode = "static"
    this.topCounter.cursor = "pointer"

    this.bottomCounter.on("pointerover", () => {
      BezierAnimator.animate(
        this.bottomCounter.scale,
        { 0: { x: "inherit", y: "inherit" }, 1: { x: 1.4, y: 1.4 } },
        Options.general.smoothAnimations ? 0.3 : 0,
        bezier(0, 0, 0.16, 1.01),
        () => {},
        "te-bottom-hover"
      )
    })
    this.bottomCounter.on("pointerout", () => {
      BezierAnimator.animate(
        this.bottomCounter.scale,
        { 0: { x: "inherit", y: "inherit" }, 1: { x: 1.25, y: 1.25 } },
        Options.general.smoothAnimations ? 0.3 : 0,
        bezier(0, 0, 0.16, 1.01),
        () => {},
        "te-bottom-hover"
      )
    })

    this.bottomCounter.on("pointerdown", event => {
      if (!this.renderer.chart.stats.parity) return
      const errorBeats = this.renderer.chart
        .getTechErrors(event.shiftKey)
        .map(error => error.beat)
      const nextBeat = nextInSorted(errorBeats, this.renderer.chartManager.beat)
      if (nextBeat !== null) {
        event.stopImmediatePropagation()
        this.renderer.chartManager.beat = nextBeat
      }
    })
    this.bottomCounter.eventMode = "static"
    this.bottomCounter.cursor = "pointer"

    this.topCounter.scale.set(1.25)
    this.bottomCounter.scale.set(1.25)
  }

  update(firstBeat: number, lastBeat: number) {
    const parity = this.renderer.chart.stats.parity
    const chart = this.renderer.chart
    if (
      !parity ||
      !Options.chart.parity.enabled ||
      !Options.chart.parity.showErrors
    ) {
      this.visible = false
      return
    }
    this.topCounter.visible =
      this.renderer.chartManager.getMode() == EditMode.Edit
    this.bottomCounter.visible =
      this.renderer.chartManager.getMode() == EditMode.Edit

    this.visible = true
    if (this.parityDirty) {
      this.rowMap.clear()
      this.boxPool.destroyAll()
      this.highlightPool.destroyAll()
      this.parityDirty = false
    }

    // Create all missing boxes
    let previousErrors = 0
    let nextErrors = 0
    for (const rowIdx of parity.techErrors.keys()) {
      const position = parity.rowTimestamps[rowIdx]
      if (lastBeat < position.beat) {
        if (chart.getTechErrorsAtRow(rowIdx).size != 0)
          nextErrors += chart.getTechErrorsAtRow(rowIdx).size
        continue
      }
      if (firstBeat > position.beat) {
        if (chart.getTechErrorsAtRow(rowIdx).size != 0)
          previousErrors += chart.getTechErrorsAtRow(rowIdx).size
        continue
      }

      if (!this.rowMap.has(rowIdx)) {
        const errors = parity.techErrors.get(rowIdx)!.values().toArray().sort()
        const boxes = []
        const highlight = this.highlightPool.createChild()
        if (!highlight) break
        highlight.width = this.renderer.chart.gameType.notefieldWidth + 80
        highlight.tint = 0xad0e4e
        for (const error of errors) {
          const box = this.boxPool.createChild()
          if (!box) break
          RowStacker.instance.register(
            box,
            position.beat,
            position.second,
            "left",
            40 + error
          )
          boxes.push(box)
          box.setText(TECH_ERROR_STRINGS[error])

          if (chart.isErrorIgnored(error, position.beat)) {
            box.ignore()
          } else {
            box.unignore()
          }

          if (
            TechErrorPopup.getError()?.beat == position.beat &&
            TechErrorPopup.getError()?.error == error
          ) {
            TechErrorPopup.attach(box)
          }

          box.cursor = "pointer"
          box.on("mouseenter", () => {
            if (this.renderer.isDragSelecting()) return
            if (
              TechErrorPopup.getError()?.beat == position.beat &&
              TechErrorPopup.getError()?.error == error
            ) {
              return
            }

            if (TechErrorPopup.active) TechErrorPopup.close()
            if (this.renderer.chartManager.getMode() == EditMode.Edit) {
              TechErrorPopup.open({
                box: box,
                beat: position.beat,
                error: error,
                ignored: false,
                chart,
              })
            }
          })
          box.on("mouseleave", () => {
            if (
              TechErrorPopup.getError()?.beat != position.beat ||
              TechErrorPopup.getError()?.error != error
            ) {
              return
            }
            TechErrorPopup.close()
          })
          box.on("pointerdown", e => {
            if (isRightClick(e)) {
              return
            }
            e.stopImmediatePropagation()
            if (chart.isErrorIgnored(error, position.beat)) {
              chart.deleteErrorIgnore(error, position.beat)
            } else {
              chart.addErrorIgnore(error, position.beat)
            }
          })
          box.eventMode = "static"
        }
        this.rowMap.set(rowIdx, { boxes, highlight })
      }
    }

    for (const [i, { boxes, highlight }] of this.rowMap.entries()) {
      const position = parity.rowTimestamps[i]
      if (!position) continue
      if (position.beat < firstBeat || position.beat > lastBeat) {
        this.rowMap.delete(i)
        boxes.forEach(box => {
          this.boxPool.destroyChild(box)
        })
        if (TechErrorPopup.getError()?.beat == position.beat)
          TechErrorPopup.close()
        this.highlightPool.destroyChild(highlight)

        continue
      }
      const yPos = this.renderer.getYPosFromBeat(position.beat)
      highlight.y = yPos

      highlight.visible = chart.getTechErrorsAtRow(i).size != 0
    }
    this.topCounter.setText(previousErrors + "")
    this.bottomCounter.setText(nextErrors + "")

    if (this.previousTopVisible != previousErrors > 0 || this.reposition) {
      this.previousTopVisible = previousErrors > 0
      let topTargetY = Options.chart.reverse
        ? this.renderer.chartManager.app.STAGE_HEIGHT / 2 - 40
        : -this.renderer.chartManager.app.STAGE_HEIGHT / 2 + 40
      if (previousErrors == 0)
        Options.chart.reverse ? (topTargetY += 90) : (topTargetY -= 90)
      BezierAnimator.animate(
        this.topCounter,
        {
          "0": { y: "inherit" },
          "1": { y: topTargetY / Options.chart.zoom },
        },
        Options.general.smoothAnimations && !this.reposition ? 0.3 : 0,
        bezier(0, 0, 0.16, 1.01),
        () => {},
        "te-top-counter"
      )
    }

    if (this.previousBottomVisible != nextErrors > 0 || this.reposition) {
      this.previousBottomVisible = nextErrors > 0
      let bottomTargetY = Options.chart.reverse
        ? -this.renderer.chartManager.app.STAGE_HEIGHT / 2 + 40
        : this.renderer.chartManager.app.STAGE_HEIGHT / 2 - 40
      if (nextErrors == 0)
        Options.chart.reverse ? (bottomTargetY -= 90) : (bottomTargetY += 90)
      BezierAnimator.animate(
        this.bottomCounter,
        {
          "0": { y: "inherit" },
          "1": { y: bottomTargetY / Options.chart.zoom },
        },
        Options.general.smoothAnimations && !this.reposition ? 0.3 : 0,
        bezier(0, 0, 0.16, 1.01),
        () => {},
        "te-bottom-counter"
      )
    }

    this.topCounter.x = -this.renderer.chart.gameType.notefieldWidth / 2 - 160

    this.bottomCounter.x =
      -this.renderer.chart.gameType.notefieldWidth / 2 - 160

    this.reposition = false
  }

  createErrorBox() {
    const newChild = new Container() as TechBox
    newChild.textObj = new BitmapText("", {
      fontName: "Main",
      fontSize: 15,
    })
    const icon = new Sprite(this.errorIconTexture)
    icon.anchor.y = 0.5
    icon.anchor.x = 0.5
    newChild.icon = icon
    const bg = new BetterRoundedRect("noBorder")
    bg.tint = 0xad0e4e
    newChild.bg = bg

    newChild.addChild(bg, newChild.textObj, icon)

    let lastText = "-"
    const setText = (text: string) => {
      if (text === lastText) return
      lastText = text
      newChild.textObj.text = text
      newChild.textObj.anchor.set(0.5, 0.55)
      newChild.textObj.x = 5 + 8
      newChild.bg.width = newChild.textObj.width + 17
      newChild.bg.height = 20
      newChild.bg.position.x = -newChild.bg.width / 2 + 8
      newChild.bg.position.y = -20 / 2
      newChild.icon.position.x = -newChild.bg.width / 2 - 2 + 8
    }
    newChild.setText = setText
    setText("")

    const ignore = () => {
      bg.tint = 0x444444
      newChild.textObj.alpha = 0.5
      icon.texture = this.errorIconIgnoredTexture
    }
    const unignore = () => {
      bg.tint = 0xad0e4e
      newChild.textObj.alpha = 1
      icon.texture = this.errorIconTexture
    }

    newChild.ignore = ignore
    newChild.unignore = unignore
    return newChild
  }
}
