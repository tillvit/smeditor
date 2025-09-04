import {
  Assets,
  BitmapText,
  BLEND_MODES,
  Container,
  Sprite,
  Texture,
} from "pixi.js"
import {
  STAGE_LAYOUTS,
  StageLayout,
} from "../../chart/stats/parity/StageLayouts"
import { Widget } from "./Widget"
import { WidgetManager } from "./WidgetManager"

import bezier from "bezier-easing"

import { BezierAnimator } from "../../util/BezierEasing"
import { EventHandler } from "../../util/EventHandler"
import { clamp, lerp, unlerp } from "../../util/Math"
import { bsearch } from "../../util/Util"

import footUrl from "../../../assets/foot.png"
import receptorUrl from "../../../assets/receptor.png"
import { Foot, ParityState } from "../../chart/stats/parity/ParityDataTypes"
import { assignTint, getParityColor } from "../../util/Color"
import { Options } from "../../util/Options"
import { BaseTimelineWidget } from "./timeline/BaseTimelineWidget"

interface StagePanel extends Container {
  bg: Sprite
  arrow: Sprite
}

interface FeetPosition {
  left: { x: number; y: number; angle: number }
  right: { x: number; y: number; angle: number }
}

const PANEL_SIZE = 80

export class DancingBotWidget extends Widget {
  panels: StagePanel[] = []
  currentRow = -1
  lastBeat = 0
  lastSecond = 0

  leftFoot?: Container
  rightFoot?: Container

  layout?: StageLayout
  dirty = false

  constructor(manager: WidgetManager) {
    super(manager)
    this.sortableChildren = true

    EventHandler.on("chartLoaded", () => this.build())
    EventHandler.on("parityModified", () => this.reindex())
  }

  async build() {
    this.removeChildren()
    this.panels = []
    if (!this.manager.app.chartManager.loadedChart) return

    this.layout =
      STAGE_LAYOUTS[this.manager.app.chartManager.loadedChart.gameType.id]
    if (!this.layout) {
      return
    }

    const receptorTex = await Assets.load(receptorUrl)

    let maxX = 0
    let maxY = 0

    this.layout.layout.forEach(point => {
      const container = new Container() as StagePanel

      const bg = new Sprite(Texture.WHITE)
      bg.alpha = 0.1
      bg.anchor.set(0.5)
      bg.width = PANEL_SIZE
      bg.height = PANEL_SIZE

      const bgTint = new Sprite(Texture.WHITE)
      bgTint.anchor.set(0.5)
      bgTint.width = PANEL_SIZE
      bgTint.height = PANEL_SIZE
      bgTint.blendMode = BLEND_MODES.COLOR_BURN
      assignTint(bgTint, "primary-bg-active")
      container.addChild(bgTint)

      const sprite = new Sprite(receptorTex)
      sprite.anchor.set(0.5)
      sprite.x = point.x
      sprite.y = point.y * -1
      sprite.alpha = 0.3
      sprite.width = PANEL_SIZE * 0.75
      sprite.height = PANEL_SIZE * 0.75
      sprite.blendMode = BLEND_MODES.MULTIPLY
      sprite.rotation = point.rotation

      container.bg = bg
      container.arrow = sprite
      container.x = point.x * PANEL_SIZE
      container.y = point.y * -PANEL_SIZE
      container.addChild(bg, sprite)

      this.addChild(container)
      this.panels.push(container)
      maxX = Math.max(maxX, Math.abs(container.x))
      maxY = Math.max(maxY, Math.abs(container.y))
    })
    const footTex = await Assets.load(footUrl)

    const leftContainer = new Container()
    const rightContainer = new Container()

    const leftFoot = new Sprite(footTex)
    const rightFoot = new Sprite(footTex)
    leftFoot.scale.set(((PANEL_SIZE / 4) * 3) / leftFoot.height)
    rightFoot.scale.set(((PANEL_SIZE / 4) * 3) / rightFoot.height)

    leftFoot.tint = getParityColor(Foot.LEFT_HEEL)
    rightFoot.tint = getParityColor(Foot.RIGHT_HEEL)

    leftFoot.anchor.set(0.5)
    rightFoot.anchor.set(0.5)
    rightFoot.scale.x *= -1

    const leftText = new BitmapText("L", {
      fontSize: 25,
      fontName: "Fancy",
      tint: getParityColor(Foot.LEFT_HEEL),
    })
    const rightText = new BitmapText("R", {
      fontSize: 25,
      fontName: "Fancy",
      tint: getParityColor(Foot.RIGHT_HEEL),
    })
    leftText.anchor.set(0.5)
    rightText.anchor.set(0.5)

    leftContainer.addChild(leftFoot, leftText)
    rightContainer.addChild(rightFoot, rightText)
    this.leftFoot = leftContainer
    this.rightFoot = rightContainer

    this.leftFoot.zIndex = 50
    this.rightFoot.zIndex = 50

    this.addChild(this.leftFoot, this.rightFoot)
    this.lastBeat = -1
    this.pivot.set(maxX + PANEL_SIZE / 2, maxY + PANEL_SIZE / 2)

    const colorChange = (optionId: string) => {
      if (
        [
          "chart.parity.leftHeelColor",
          "chart.parity.leftToeColor",
          "chart.parity.rightHeelColor",
          "chart.parity.rightToeColor",
        ].includes(optionId)
      ) {
        leftFoot.tint = getParityColor(Foot.LEFT_HEEL)
        rightFoot.tint = getParityColor(Foot.RIGHT_HEEL)
        leftText.tint = getParityColor(Foot.LEFT_HEEL)
        rightText.tint = getParityColor(Foot.RIGHT_HEEL)
      }
    }
    EventHandler.on("userOptionUpdated", colorChange)
  }

  reindex() {
    const parity = this.manager.app.chartManager.loadedChart?.stats.parity
    if (!parity || !this.manager.app.chartManager.chartView) return
    const visualBeat = this.manager.app.chartManager.chartView.getVisualBeat()
    let currentIndex = bsearch(parity.rowTimestamps, visualBeat, a => a.beat)
    while (parity.rowTimestamps[currentIndex]?.beat < visualBeat) {
      currentIndex++
    }
    if (currentIndex == 0 && visualBeat < parity.rowTimestamps[0].beat) {
      this.currentRow = -1
      return
    }
    this.currentRow = currentIndex
    this.dirty = true
  }

  update(): void {
    const bestPath =
      this.manager.app.chartManager.loadedChart?.stats.parity?.states

    const RIGHT_SAFE =
      this.manager.chartManager.app.STAGE_WIDTH / 2 -
      BaseTimelineWidget.getTotalWidgetWidth()
    this.x = RIGHT_SAFE - 16
    this.y = this.manager.app.STAGE_HEIGHT / 2 - 16

    if (
      !bestPath ||
      !this.manager.app.chartManager.chartView ||
      !this.layout ||
      !Options.chart.parity.enabled ||
      !Options.chart.parity.showDancingBot
    ) {
      this.visible = false
      return
    }
    this.visible = true
    const visualBeat = this.manager.app.chartManager.chartView.getVisualBeat()
    const visualSecond = this.manager.app.chartManager.chartView.getVisualTime()

    if (this.lastSecond == visualSecond && !this.dirty) {
      return
    }
    this.dirty = false
    this.panels.forEach(panel => {
      const partialBeat = ((visualBeat % 1) + 1) % 1
      panel.arrow.alpha = 0.3 + clamp(1 - partialBeat, 0.5, 1) * 0.8
    })
    if (visualBeat < this.lastBeat) {
      this.reindex()
    } else {
      while (bestPath[this.currentRow + 1]?.beat <= visualBeat) {
        this.currentRow++
        const row = bestPath[this.currentRow]
        row.action.forEach((col, i) => {
          if (row.holdFeet.has(col) || !col) return
          this.flashPanel(i)
        })
      }
    }

    this.lastBeat = visualBeat
    this.lastSecond = visualSecond

    if (this.leftFoot && this.rightFoot) {
      let oldState = bestPath[this.currentRow]
      const newState = bestPath[this.currentRow + 1] ?? bestPath.at(-2)
      if (bestPath.at(-1) == oldState) {
        oldState = bestPath.at(-2)!
      }

      if (oldState) {
        const oldPosition = this.getFeetPosition(oldState)
        const nextPosition = this.getFeetPosition(newState)

        let t = clamp(
          unlerp(
            Math.max(oldState.second, newState.second - 0.3),
            newState.second,
            visualSecond
          ),
          0,
          1
        )
        if (isNaN(t)) t = 1

        const newPosition = this.lerpPositions(
          oldPosition,
          nextPosition,
          t,
          newState
        )
        let leftScale = 1
        let rightScale = 1

        const movedLeftOld = oldState.movedFeet.has(Foot.LEFT_HEEL)
        const movedRightOld = oldState.movedFeet.has(Foot.RIGHT_HEEL)
        const movedLeftNew = newState.movedFeet.has(Foot.LEFT_HEEL)
        const movedRightNew = newState.movedFeet.has(Foot.RIGHT_HEEL)

        if (visualSecond > newState.second - 0.1) {
          const t = clamp(
            unlerp(newState.second - 0.1, newState.second, visualSecond),
            0,
            1
          )
          if (movedLeftNew) {
            leftScale *= lerp(1, 0.9, t)
          }
          if (movedRightNew) {
            rightScale *= lerp(1, 0.9, t)
          }
        }
        if (visualSecond < oldState.second + 0.1) {
          const t = clamp(
            unlerp(oldState.second, oldState.second + 0.1, visualSecond),
            0,
            1
          )
          if (movedLeftOld) {
            leftScale *= lerp(0.9, 1, t)
          }
          if (movedRightOld) {
            rightScale *= lerp(0.9, 1, t)
          }
        }
        this.leftFoot.scale.set(leftScale)
        this.rightFoot.scale.set(rightScale)

        this.leftFoot.x = newPosition.left.x
        this.leftFoot.y = newPosition.left.y
        this.leftFoot.rotation = newPosition.left.angle
        this.rightFoot.x = newPosition.right.x
        this.rightFoot.y = newPosition.right.y
        this.rightFoot.rotation = newPosition.right.angle
      }
    }
  }

  getFeetPosition(state: ParityState): FeetPosition {
    const leftPos = {
      x: this.panels[state.footColumns[Foot.LEFT_HEEL]]?.position.x ?? 0,
      y: this.panels[state.footColumns[Foot.LEFT_HEEL]]?.position.y ?? 0,
    }
    const rightPos = {
      x: this.panels[state.footColumns[Foot.RIGHT_HEEL]]?.position.x ?? 0,
      y: this.panels[state.footColumns[Foot.RIGHT_HEEL]]?.position.y ?? 0,
    }

    if (state.footColumns[Foot.LEFT_TOE] != -1) {
      leftPos.x =
        (leftPos.x + this.panels[state.footColumns[Foot.LEFT_TOE]].position.x) /
        2
      leftPos.y =
        (leftPos.y + this.panels[state.footColumns[Foot.LEFT_TOE]].position.y) /
        2
    }

    if (state.footColumns[Foot.RIGHT_TOE] != -1) {
      rightPos.x =
        (rightPos.x +
          this.panels[state.footColumns[Foot.RIGHT_TOE]].position.x) /
        2
      rightPos.y =
        (rightPos.y +
          this.panels[state.footColumns[Foot.RIGHT_TOE]].position.y) /
        2
    }

    if (this.layout!.name == "dance-single") {
      if (Math.abs(leftPos.x) <= PANEL_SIZE / 4) {
        leftPos.x -= PANEL_SIZE / 4
        leftPos.y *= 0.5
      }
      if (Math.abs(rightPos.x) <= PANEL_SIZE / 4) {
        rightPos.x += PANEL_SIZE / 4
        rightPos.y *= 0.5
      }

      if (rightPos.x < (-PANEL_SIZE / 4) * 3) {
        rightPos.y -= (PANEL_SIZE / 4) * Math.sign(leftPos.y)
        rightPos.x += PANEL_SIZE / 4
      }
      if (leftPos.x > (PANEL_SIZE / 4) * 3) {
        leftPos.y -= (PANEL_SIZE / 4) * Math.sign(leftPos.y)
        leftPos.x -= PANEL_SIZE / 4
      }
    }

    let leftAngle = this.getPlayerAngle(leftPos, rightPos) / 5
    let rightAngle = leftAngle

    if (state.footColumns[Foot.LEFT_TOE] != -1) {
      leftAngle =
        -this.getPlayerAngle(
          {
            x: this.panels[state.footColumns[Foot.LEFT_HEEL]].position.x,
            y: this.panels[state.footColumns[Foot.LEFT_HEEL]].position.y,
          },
          {
            x: this.panels[state.footColumns[Foot.LEFT_TOE]].position.x,
            y: this.panels[state.footColumns[Foot.LEFT_TOE]].position.y,
          }
        ) +
        Math.PI / 2
    }
    if (state.footColumns[Foot.RIGHT_TOE] != -1) {
      rightAngle =
        -this.getPlayerAngle(
          {
            x: this.panels[state.footColumns[Foot.RIGHT_HEEL]].position.x,
            y: this.panels[state.footColumns[Foot.RIGHT_HEEL]].position.y,
          },
          {
            x: this.panels[state.footColumns[Foot.RIGHT_TOE]].position.x,
            y: this.panels[state.footColumns[Foot.RIGHT_TOE]].position.y,
          }
        ) +
        Math.PI / 2
    }

    return {
      left: { x: leftPos.x, y: leftPos.y, angle: leftAngle },
      right: { x: rightPos.x, y: rightPos.y, angle: rightAngle },
    }
  }

  getPlayerAngle(
    left: { x: number; y: number },
    right: { x: number; y: number }
  ) {
    const x1 = right.x - left.x
    const y1 = right.y - left.y
    const x2 = 1
    const y2 = 0
    const dot = x1 * x2 + y1 * y2
    const det = x1 * y2 - y1 * x2
    return Math.atan2(det, dot)
  }

  lerpPositions(
    positionA: FeetPosition,
    positionB: FeetPosition,
    t: number,
    state: ParityState
  ): FeetPosition {
    const movedLeft = state.movedFeet.has(Foot.LEFT_HEEL)
    const movedRight = state.movedFeet.has(Foot.RIGHT_HEEL)
    return {
      left: {
        x: lerp(positionA.left.x, positionB.left.x, t),
        y: lerp(positionA.left.y, positionB.left.y, t),
        angle: movedLeft
          ? lerp(positionA.left.angle, positionB.left.angle, t)
          : positionA.left.angle,
      },
      right: {
        x: lerp(positionA.right.x, positionB.right.x, t),
        y: lerp(positionA.right.y, positionB.right.y, t),
        angle: movedRight
          ? lerp(positionA.right.angle, positionB.right.angle, t)
          : positionA.right.angle,
      },
    }
  }

  flashPanel(col: number) {
    const panel = this.panels[col]
    if (!panel) return

    BezierAnimator.animate(
      panel.bg,
      {
        "0": {
          alpha: 0.6,
        },
        "1": {
          alpha: 0.1,
        },
      },
      0.4,
      bezier(0.19, 1.15, 0.55, 0.96),
      undefined,
      "panel-" + col
    )
  }
}
