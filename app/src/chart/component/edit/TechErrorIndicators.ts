import bezier from "bezier-easing"
import { BitmapText, Container, Graphics, RenderTexture, Sprite } from "pixi.js"
import { TechErrorPopup } from "../../../gui/popup/TechErrorPopup"
import { BetterRoundedRect } from "../../../util/BetterRoundedRect"
import { BezierAnimator } from "../../../util/BezierEasing"
import { DisplayObjectPool } from "../../../util/DisplayObjectPool"
import { EventHandler } from "../../../util/EventHandler"
import { Options } from "../../../util/Options"
import { isRightClick } from "../../../util/PixiUtil"
import { bsearch, isSameRow } from "../../../util/Util"
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

  private topCounter: TechBox
  private bottomCounter: TechBox

  private previousTopVisible = false
  private previousBottomVisible = false

  private rowMap = new Map<number, TechBox[]>()

  children: Container[] = []

  constructor(renderer: ChartRenderer) {
    super()
    this.renderer = renderer

    this.addChild(this.boxPool)

    const parityChanged = () => {
      this.parityDirty = true
    }
    EventHandler.on("parityModified", parityChanged)
    EventHandler.on("parityIgnoresModified", parityChanged)
    this.on("destroyed", () => {
      EventHandler.off("parityModified", parityChanged)
      EventHandler.off("parityIgnoresModified", parityChanged)
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
    this.bottomCounter.y = Options.chart.reverse
      ? -this.renderer.chartManager.app.STAGE_HEIGHT / 2 - 50
      : this.renderer.chartManager.app.STAGE_HEIGHT / 2 + 50

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

    const filterErrorBeats = (includeIgnored: boolean): number[] => {
      const techErrors = this.renderer.chart.stats.parity!.techErrors
      if (includeIgnored) {
        const beats: number[] = techErrors
          .keys()
          .map(i => this.renderer.chart.stats.parity!.rowTimestamps[i].beat)
          .toArray()
          .sort((a, b) => a - b)
        return beats
      }
      const techErrorsFiltered: number[] = this.renderer.chart.stats
        .parity!.techErrors.entries()
        .filter(([i, errors]) => {
          return errors.values().some(error => {
            return !this.renderer.chart.isErrorIgnored(
              error,
              this.renderer.chart.stats.parity!.rowTimestamps[i].beat
            )
          }) as boolean
        })
        .map(
          pair => this.renderer.chart.stats.parity!.rowTimestamps[pair[0]].beat
        )
        .toArray()
        .sort((a, b) => a - b)
      return techErrorsFiltered
    }

    this.topCounter.on("pointerdown", event => {
      if (!this.renderer.chart.stats.parity) return
      const errors = filterErrorBeats(event.shiftKey)
      if (errors.length == 0) return
      const idx = bsearch(errors, this.renderer.chartManager.beat)

      if (isSameRow(this.renderer.chartManager.beat, errors[idx])) {
        if (idx - 1 >= 0) {
          this.renderer.chartManager.beat = errors[idx - 1]
        } else {
          this.renderer.chartManager.beat = errors[0]
        }
      } else this.renderer.chartManager.beat = errors[idx]
      event.stopImmediatePropagation()
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
      const errors = filterErrorBeats(event.shiftKey)
      if (errors.length == 0) return
      event.stopImmediatePropagation()
      const idx = bsearch(errors, this.renderer.chartManager.beat)

      if (idx == 0 && this.renderer.chartManager.beat < errors[idx]) {
        this.renderer.chartManager.beat = errors[idx]
        return
      }

      if (isSameRow(this.renderer.chartManager.beat, errors[idx])) {
        if (idx + 1 < errors.length) {
          this.renderer.chartManager.beat = errors[idx + 1]
        } else {
          this.renderer.chartManager.beat = errors[idx]
        }
      } else this.renderer.chartManager.beat = errors[idx + 1]
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
    this.visible = true
    if (this.parityDirty) {
      this.rowMap.clear()
      this.boxPool.destroyAll()
      this.parityDirty = false
    }

    // Create all missing boxes
    let previousErrors = 0
    let nextErrors = 0
    for (const rowIdx of parity.techErrors.keys()) {
      const position = parity.rowTimestamps[rowIdx]
      if (lastBeat < position.beat) {
        const errors = parity.techErrors.get(rowIdx)
        const ignoredErrors =
          chart.getErrorIgnoresAtBeat(position.beat)?.size ?? 0
        nextErrors += errors!.size - ignoredErrors
        continue
      }
      if (firstBeat > position.beat) {
        const errors = parity.techErrors.get(rowIdx)
        const ignoredErrors =
          chart.getErrorIgnoresAtBeat(position.beat)?.size ?? 0
        previousErrors += errors!.size - ignoredErrors
        continue
      }

      if (!this.rowMap.has(rowIdx)) {
        const errors = parity.techErrors.get(rowIdx)!.values().toArray().sort()
        const boxes = []
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
        this.rowMap.set(rowIdx, boxes)
      }
    }

    for (const [i, boxes] of this.rowMap.entries()) {
      const position = parity.rowTimestamps[i]
      if (!position) continue
      if (position.beat < firstBeat || position.beat > lastBeat) {
        this.rowMap.delete(i)
        boxes.forEach(box => this.boxPool.destroyChild(box))
        continue
      }
    }
    this.topCounter.setText(previousErrors + "")
    this.bottomCounter.setText(nextErrors + "")

    if (this.previousTopVisible != previousErrors > 0) {
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
          "1": { y: topTargetY },
        },
        Options.general.smoothAnimations ? 0.3 : 0,
        bezier(0, 0, 0.16, 1.01),
        () => {},
        "te-top-counter"
      )
    }

    if (this.previousBottomVisible != nextErrors > 0) {
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
          "1": { y: bottomTargetY },
        },
        Options.general.smoothAnimations ? 0.3 : 0,
        bezier(0, 0, 0.16, 1.01),
        () => {},
        "te-bottom-counter"
      )
    }

    this.topCounter.x = -this.renderer.chart.gameType.notefieldWidth / 2 - 160

    this.bottomCounter.x =
      -this.renderer.chart.gameType.notefieldWidth / 2 - 160
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
