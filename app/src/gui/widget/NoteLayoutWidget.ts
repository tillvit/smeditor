import {
  FederatedPointerEvent,
  ParticleContainer,
  RenderTexture,
  Sprite,
  Texture,
} from "pixi.js"
import { EditMode } from "../../chart/ChartManager"
import { QUANT_COLORS } from "../../chart/component/edit/SnapContainer"
import { Chart } from "../../chart/sm/Chart"
import { isHoldNote } from "../../chart/sm/NoteTypes"
import { BetterRoundedRect } from "../../util/BetterRoundedRect"
import { EventHandler } from "../../util/EventHandler"
import { clamp, lerp, unlerp } from "../../util/Math"
import { Options } from "../../util/Options"
import { Flags } from "../../util/Switches"
import { destroyChildIf, getDivision } from "../../util/Util"
import { Widget } from "./Widget"
import { WidgetManager } from "./WidgetManager"

export class NoteLayoutWidget extends Widget {
  barContainer = new ParticleContainer(
    1500,
    { position: true, scale: true, tint: true },
    16384,
    true
  )
  backing: BetterRoundedRect = new BetterRoundedRect()
  bars: Sprite
  barTexture: RenderTexture
  overlay: Sprite = new Sprite(Texture.WHITE)

  private lastHeight = 0
  private lastCMod
  private mouseDown = false
  private queued = false

  constructor(manager: WidgetManager) {
    super(manager)
    this.addChild(this.backing)
    this.visible = false
    this.backing.tint = 0
    this.backing.alpha = 0.3
    this.barTexture = RenderTexture.create({
      resolution: this.manager.app.renderer.resolution,
    })
    this.bars = new Sprite(this.barTexture)
    this.bars.anchor.set(0.5)
    this.addChild(this.bars)
    this.overlay.anchor.x = 0.5
    this.overlay.anchor.y = 0
    this.overlay.alpha = 0.3
    this.lastCMod = Options.chart.CMod
    this.addChild(this.overlay)
    this.x = this.manager.app.renderer.screen.width / 2 - 20
    EventHandler.on("chartLoaded", () => {
      this.queued = false
      this.populate()
    })
    EventHandler.on("chartModifiedAfter", () => {
      if (!this.queued) this.populate()
      this.queued = true
    })
    const interval = setInterval(() => {
      if (this.queued) {
        this.queued = false
        this.populate()
      }
    }, 3000)

    this.on("destroyed", () => clearInterval(interval))
    this.populate()

    this.eventMode = "static"
    this.on("mousedown", event => {
      this.mouseDown = true
      this.handleMouse(event)
    })
    this.on("mousemove", event => {
      if (this.mouseDown) this.handleMouse(event)
    })
    window.onmouseup = () => {
      this.mouseDown = false
    }
  }

  private handleMouse(event: FederatedPointerEvent) {
    if (this.manager.chartManager.getMode() == EditMode.Play) return
    if (!this.getChart()) return
    let t =
      (this.bars.toLocal(event.global).y + this.bars.height / 2) /
      this.bars.height
    t = clamp(t, 0, 1)
    const lastNote = this.getChart().getNotedata().at(-1)
    if (!lastNote) return
    const lastBeat = lastNote.beat + (isHoldNote(lastNote) ? lastNote.hold : 0)
    const lastSecond = this.getChart().getSecondsFromBeat(lastBeat)
    if (Options.chart.CMod) {
      this.manager.chartManager.setTime(
        lerp(-this.getChart().timingData.getOffset(), lastSecond, t)
      )
    } else {
      this.manager.chartManager.setBeat(lastBeat * t)
    }
  }

  update() {
    this.scale.y = Options.chart.reverse ? -1 : 1
    const height = this.manager.app.renderer.screen.height - 40
    this.backing.height = height + 10
    this.backing.position.y = -this.backing.height / 2
    this.backing.position.x = -this.backing.width / 2
    this.bars.height = height
    this.x = this.manager.app.renderer.screen.width / 2 - 20
    const chart = this.getChart()
    const chartView = this.manager.chartManager.chartView!
    if (!chart || !chartView || !Flags.layout) {
      this.visible = false
      return
    }
    this.visible = true
    const lastNote = chart.getNotedata().at(-1)
    if (!lastNote) {
      this.overlay.height = 0
      return
    }
    const lastBeat = lastNote.beat + (isHoldNote(lastNote) ? lastNote.hold : 0)
    const lastSecond = chart.getSecondsFromBeat(lastBeat)
    const start = Options.chart.CMod
      ? chartView.getSecondFromYPos(
          -this.manager.app.renderer.screen.height / 2
        )
      : chartView.getBeatFromYPos(
          -this.manager.app.renderer.screen.height / 2,
          true
        )
    const end = Options.chart.CMod
      ? chartView.getSecondFromYPos(this.manager.app.renderer.screen.height / 2)
      : chartView.getBeatFromYPos(
          this.manager.app.renderer.screen.height / 2,
          true
        )
    let t_startY = unlerp(0, lastBeat, start)
    let t_endY = unlerp(0, lastBeat, end)
    if (Options.chart.CMod) {
      t_startY = unlerp(-chart.timingData.getOffset(), lastSecond, start)
      t_endY = unlerp(-chart.timingData.getOffset(), lastSecond, end)
    }
    t_startY = clamp(t_startY, 0, 1)
    t_endY = clamp(t_endY, 0, 1)
    if (t_startY > t_endY) [t_startY, t_endY] = [t_endY, t_startY]
    const startY = (t_startY - 0.5) * (this.backing.height - 10)
    const endY = (t_endY - 0.5) * (this.backing.height - 10)
    this.overlay.y = startY
    this.overlay.height = endY - startY
    this.overlay.height = Math.max(2, this.overlay.height)
    if (
      this.manager.app.renderer.screen.height != this.lastHeight ||
      this.lastCMod != Options.chart.CMod
    ) {
      this.lastCMod = Options.chart.CMod
      this.lastHeight = this.manager.app.renderer.screen.height
      this.populate()
    }
  }

  populate() {
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

    const height = this.manager.app.renderer.screen.height - 40
    this.backing.height = height
    this.backing.width = numCols * 6 + 8
    this.overlay.width = numCols * 6 + 8
    this.pivot.x = this.backing.width / 2

    this.barTexture.resize(numCols * 6, height)

    if (!lastNote) {
      destroyChildIf(this.barContainer.children, () => true)
      this.manager.app.renderer.render(this.barContainer, {
        renderTexture: this.barTexture,
      })
      return
    }
    const lastBeat = lastNote.beat + (isHoldNote(lastNote) ? lastNote.hold : 0)
    const lastSecond = chart.getSecondsFromBeat(lastBeat)

    const songOffset = chart.timingData.getOffset()

    chart.getNotedata().forEach(note => {
      let obj = this.barContainer.children[childIndex]
      if (!obj) {
        obj = new Sprite(Texture.WHITE)
        obj.width = 4
        this.barContainer.addChild(obj)
      }
      obj.anchor.set(0.5)
      obj.height = 1
      obj.x = (note.col + 0.5) * 6
      let t = unlerp(0, lastBeat, note.beat)
      if (Options.chart.CMod) t = unlerp(songOffset, lastSecond, note.second)
      obj.y = t * height
      obj.tint = QUANT_COLORS[getDivision(note.beat)]
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
        const y_end =
          (Options.chart.CMod
            ? chart.getSecondsFromBeat(note.beat + note.hold) / lastSecond
            : (note.beat + note.hold) / lastBeat) *
            height +
          1
        h_obj.y = obj.y
        h_obj.height = y_end - obj.y
        if (note.type == "Hold") h_obj.tint = 0xa0a0a0
        if (note.type == "Roll") h_obj.tint = 0xada382
        childIndex++
      }
    })

    destroyChildIf(
      this.barContainer.children,
      (_, index) => index >= childIndex
    )

    this.manager.app.renderer.render(this.barContainer, {
      renderTexture: this.barTexture,
    })
  }

  private getChart(): Chart {
    return this.manager.chartManager.loadedChart!
  }
}
