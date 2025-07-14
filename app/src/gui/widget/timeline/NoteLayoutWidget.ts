import { ParticleContainer, RenderTexture, Sprite, Texture } from "pixi.js"
import { QUANT_COLORS } from "../../../chart/component/edit/SnapContainer"
import { isHoldNote, NotedataEntry } from "../../../chart/sm/NoteTypes"
import { Options } from "../../../util/Options"
import { destroyChildIf } from "../../../util/PixiUtil"
import { WidgetManager } from "../WidgetManager"
import { BaseTimelineWidget } from "./BaseTimelineWidget"

export class NoteLayoutWidget extends BaseTimelineWidget {
  barContainer = new ParticleContainer(
    1500,
    { position: true, scale: true, tint: true },
    16384,
    true
  )

  bars: Sprite
  barTexture: RenderTexture

  constructor(manager: WidgetManager) {
    super(manager)
    this.visible = false
    this.name = "note-layout"

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
    if (!Options.chart.noteLayout.enabled) {
      this.visible = false
      return
    }
    this.visible = true
    super.update()
  }

  populate(startBeat?: number, endBeat?: number) {
    const chart = this.getChart()
    if (!chart) {
      destroyChildIf(this.barContainer.children, () => true)

      this.manager.app.renderer.render(this.barContainer, {
        renderTexture: this.barTexture,
      })
      return
    }
    let childIndex = 0
    const numCols = chart.gameType.numCols
    const lastNote = chart.getNotedata().at(-1)

    const height = this.manager.app.STAGE_HEIGHT - this.verticalMargin
    this.barTexture.resize(numCols * 6, height)
    this.backingWidth = numCols * 6 + 8
    this.updateDimensions()

    if (!lastNote) {
      destroyChildIf(this.barContainer.children, () => true)
      this.manager.app.renderer.render(this.barContainer, {
        renderTexture: this.barTexture,
      })
      return
    }
    for (const note of chart.getNotedataInRange(
      startBeat ?? 0,
      endBeat ?? chart.getLastBeat()
    )) {
      if (!this.shouldDisplayNote(note)) continue
      let obj = this.barContainer.children[childIndex]
      if (!obj) {
        obj = new Sprite(Texture.WHITE)
        obj.width = 4
        this.barContainer.addChild(obj)
      }
      obj.anchor.set(0.5)
      obj.height = 1
      obj.x = (note.col + 0.5) * 6
      obj.y = this.getYFromBeat(note.beat)
      obj.tint = QUANT_COLORS[note.quant]
      if (note.type == "Mine") obj.tint = 0x808080
      childIndex++
      if (isHoldNote(note)) {
        let h_obj = this.barContainer.children[childIndex]
        if (!h_obj) {
          h_obj = new Sprite(Texture.WHITE)
          h_obj.width = 4
          h_obj.height = 2
          this.barContainer.addChild(h_obj)
        }
        h_obj.anchor.x = 0.5
        h_obj.anchor.y = 0
        h_obj.x = (note.col + 0.5) * 6
        const y_end = this.getYFromBeat(note.beat + note.hold) + 1
        h_obj.y = obj.y
        h_obj.height = y_end - obj.y
        if (note.type == "Hold") h_obj.tint = 0xa0a0a0
        if (note.type == "Roll") h_obj.tint = 0xada382
        childIndex++
      }
    }

    destroyChildIf(
      this.barContainer.children,
      (_, index) => index >= childIndex
    )

    this.manager.app.renderer.render(this.barContainer, {
      renderTexture: this.barTexture,
    })
  }

  private shouldDisplayNote(note: NotedataEntry): boolean {
    if (Options.chart.CMod && note.fake && Options.chart.hideFakedArrows)
      return false
    if (Options.chart.CMod && Options.chart.hideWarpedArrows && note.warped)
      return false
    return true
  }
}
