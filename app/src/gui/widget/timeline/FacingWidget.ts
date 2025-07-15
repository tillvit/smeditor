import {
  Color,
  ParticleContainer,
  RenderTexture,
  Sprite,
  Texture,
} from "pixi.js"
import { PARITY_COLORS } from "../../../chart/component/edit/ParityDebug"
import { Foot } from "../../../chart/stats/parity/ParityDataTypes"
import { blendColors } from "../../../util/Color"
import { clamp } from "../../../util/Math"
import { Options } from "../../../util/Options"
import { destroyChildIf } from "../../../util/PixiUtil"
import { bsearchEarliest } from "../../../util/Util"
import { WidgetManager } from "../WidgetManager"
import { BaseTimelineWidget } from "./BaseTimelineWidget"

export class FacingLayoutWidget extends BaseTimelineWidget {
  barContainer = new ParticleContainer(
    1500,
    { position: true, scale: true, tint: true },
    16384,
    true
  )

  bars: Sprite
  barTexture: RenderTexture

  middleLine: Sprite

  constructor(manager: WidgetManager) {
    super(manager, {
      backingWidth: 48,
      order: 1,
      trigger: "parity",
    })
    this.visible = false
    this.name = "facing"

    this.backing.tint = 0
    this.backing.alpha = 0.3

    this.middleLine = new Sprite(Texture.WHITE)
    this.middleLine.anchor.set(0.5)
    this.middleLine.width = 1
    this.middleLine.alpha = 0.2
    this.middleLine.height = this.manager.app.STAGE_HEIGHT
    this.addChild(this.middleLine)

    this.barTexture = RenderTexture.create({
      resolution: this.manager.app.renderer.resolution,
    })

    this.bars = new Sprite(this.barTexture)
    this.bars.anchor.set(0.5)
    this.container.addChild(this.bars)
    this.container.addChild(this.barContainer)
    this.populate()
  }

  update() {
    if (!Options.chart.facingLayout.enabled) {
      this.visible = false
      return
    }
    this.visible = true
    this.middleLine.height = this.backing.height

    if (Options.chart.layoutFollowPosition) {
      this.bars.visible = false
      this.barContainer.visible = true
    } else {
      this.bars.visible = true
      this.barContainer.visible = false
    }
    super.update()
  }

  populate(startBeat?: number, endBeat?: number) {
    const chart = this.getChart()
    if (
      !chart ||
      !chart.stats.parity ||
      chart.stats.parity.rowTimestamps.length == 0
    ) {
      destroyChildIf(this.barContainer.children, () => true)

      this.manager.app.renderer.render(this.barContainer, {
        renderTexture: this.barTexture,
      })
      return
    }
    let childIndex = 0

    const height = this.manager.app.STAGE_HEIGHT - this.verticalMargin
    if (Options.chart.layoutFollowPosition) {
      this.barContainer.y = -height / 2
      this.barContainer.x = -16
    } else {
      this.barContainer.position.set(0)
      this.barTexture.resize(32, height)
    }
    this.updateDimensions()

    const startIdx = bsearchEarliest(
      chart.stats.parity.rowTimestamps,
      startBeat ?? 0,
      pos => pos.beat
    )

    for (let i = startIdx; i < chart.stats.parity.facingRows.length; i++) {
      if (
        startBeat !== undefined &&
        chart.stats.parity.rowTimestamps[i].beat < startBeat
      )
        continue
      if (
        endBeat !== undefined &&
        chart.stats.parity.rowTimestamps[i].beat > endBeat
      )
        break

      if (chart.stats.parity.candles.has(i)) {
        let c_obj = this.barContainer.children[childIndex]
        if (!c_obj) {
          c_obj = new Sprite(Texture.WHITE)
          this.barContainer.addChild(c_obj)
        }
        c_obj.anchor.set(0.5)
        c_obj.height = 3
        c_obj.width = 32
        c_obj.alpha = 0.4
        c_obj.tint = PARITY_COLORS[chart.stats.parity.candles.get(i)!]
        c_obj.x = 16
        c_obj.y = this.getYFromBeat(chart.stats.parity.rowTimestamps[i].beat)
        childIndex++
      }

      let obj = this.barContainer.children[childIndex]
      if (!obj) {
        obj = new Sprite(Texture.WHITE)
        obj.width = 6
        this.barContainer.addChild(obj)
      }
      let facing = chart.stats.parity.facingRows[i]
      facing = clamp(facing, -2, 2)
      if (chart.stats.parity.facingRows[i] < 0) {
        obj.tint = blendColors(
          "#ffffff",
          new Color(PARITY_COLORS[Foot.LEFT_HEEL]).toHex(),
          facing / -2
        )
      } else {
        obj.tint = blendColors(
          "#ffffff",
          new Color(PARITY_COLORS[Foot.RIGHT_HEEL]).toHex(),
          facing / 2
        )
      }
      obj.anchor.set(0.5)
      obj.height = 1
      obj.width = 6
      obj.alpha = 1
      if (Math.abs(facing) > 1.6) {
        obj.height = 2
        obj.width = 8
      }
      const offset = (Math.sign(facing) * Math.pow(Math.abs(facing), 1.5)) / 2
      obj.x = 16 + offset * 8
      obj.y = this.getYFromBeat(chart.stats.parity.rowTimestamps[i].beat)
      childIndex++
    }

    destroyChildIf(
      this.barContainer.children,
      (_, index) => index >= childIndex
    )

    this.manager.app.renderer.render(this.barContainer, {
      renderTexture: this.barTexture,
    })
    if (!Options.chart.layoutFollowPosition) {
      this.barContainer.visible = true
      this.manager.app.renderer.render(this.barContainer, {
        renderTexture: this.barTexture,
      })
      this.barContainer.visible = false
    }
  }
}
