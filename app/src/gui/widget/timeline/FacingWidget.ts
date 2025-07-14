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

  constructor(manager: WidgetManager) {
    super(manager, {
      backingWidth: 48,
      order: 1,
      trigger: "parity",
    })
    this.addChild(this.backing)
    this.addChild(this.container)
    this.visible = false
    this.name = "facing"

    this.backing.tint = 0
    this.backing.alpha = 0.3

    this.barTexture = RenderTexture.create({
      resolution: this.manager.app.renderer.resolution,
    })

    this.bars = new Sprite(this.barTexture)
    this.bars.anchor.set(0.5)
    this.container.addChild(this.bars)
    this.populate()
  }

  update() {
    if (!Options.chart.facingLayout.enabled) {
      this.visible = false
      return
    }
    this.visible = true
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
    this.barTexture.resize(32, height)
    this.updateDimensions()

    for (let i = 0; i < chart.stats.parity.facingRows.length; i++) {
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
      if (Math.abs(facing) > 1.6) {
        obj.height = 3
        obj.width = 8
      }
      obj.x = 16 + facing * 6
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
  }
}
