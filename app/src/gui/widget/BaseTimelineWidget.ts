import { Container, FederatedPointerEvent, Sprite, Texture } from "pixi.js"
import { EditMode } from "../../chart/ChartManager"
import { Chart } from "../../chart/sm/Chart"
import { BetterRoundedRect } from "../../util/BetterRoundedRect"
import { assignTint } from "../../util/Color"
import { EventHandler } from "../../util/EventHandler"
import { Flags } from "../../util/Flags"
import { clamp, lerp, maxArr, minArr, unlerp } from "../../util/Math"
import { Options } from "../../util/Options"
import { getNoteEnd } from "../../util/Util"
import { Widget } from "./Widget"
import { WidgetManager } from "./WidgetManager"

export class BaseTimelineWidget extends Widget {
  backing: BetterRoundedRect = new BetterRoundedRect("noBorder")
  overlay: Sprite = new Sprite(Texture.WHITE)
  selectionOverlay: Sprite = new Sprite(Texture.WHITE)
  container: Container = new Container()

  protected lastHeight = 0
  protected lastCMod
  protected mouseDown = false
  protected queued = false

  protected verticalMargin = 40
  protected backingVerticalPadding = 10
  protected backingWidth = 32
  xOffset = 20

  constructor(
    manager: WidgetManager,
    xOffset: number = 20,
    backingWidth: number = 32
  ) {
    super(manager)
    this.backingWidth = backingWidth
    this.xOffset = xOffset
    this.sortableChildren = true

    this.addChild(this.backing)
    this.addChild(this.container)
    this.visible = false

    assignTint(this.backing, "widget-bg")

    this.overlay.anchor.x = 0.5
    this.overlay.anchor.y = 0
    this.overlay.alpha = 0.3
    this.overlay.zIndex = 10

    this.lastCMod = Options.chart.CMod
    this.addChild(this.overlay)

    this.x = this.manager.app.STAGE_WIDTH / 2 - this.xOffset

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

    this.eventMode = "static"
    this.on("mousedown", event => {
      this.mouseDown = true
      this.handleMouse(event)
    })
    this.on("mousemove", event => {
      if (this.mouseDown) this.handleMouse(event)
    })

    this.on("mouseup", () => {
      this.mouseDown = false
    })

    this.on("mouseleave", () => {
      this.mouseDown = false
    })
  }

  protected handleMouse(event: FederatedPointerEvent) {
    if (this.manager.chartManager.getMode() == EditMode.Play) return
    if (!this.getChart()) return
    let t =
      (this.container.toLocal(event.global).y + this.container.height / 2) /
      this.container.height
    t = clamp(t, 0, 1)
    const lastNote = this.getChart().getNotedata().at(-1)
    if (!lastNote) return
    if (Options.chart.CMod) {
      this.manager.chartManager.time = lerp(
        -this.getChart().timingData.getOffset(),
        this.getChart().getLastSecond(),
        t
      )
    } else {
      this.manager.chartManager.beat = this.getChart().getLastBeat() * t
    }
  }

  update() {
    this.scale.y = Options.chart.reverse ? -1 : 1
    const width = this.manager.app.STAGE_HEIGHT - this.verticalMargin
    this.backing.height = width + this.backingVerticalPadding
    this.backing.position.y = -this.backing.height / 2
    this.backing.position.x = -this.backing.width / 2
    this.x = this.manager.app.STAGE_WIDTH / 2 - this.xOffset
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

    const overlayStart = Options.chart.CMod
      ? chartView.getSecondFromYPos(-this.manager.app.STAGE_HEIGHT / 2)
      : chartView.getBeatFromYPos(-this.manager.app.STAGE_HEIGHT / 2, true)
    const overlayEnd = Options.chart.CMod
      ? chartView.getSecondFromYPos(this.manager.app.STAGE_HEIGHT / 2)
      : chartView.getBeatFromYPos(this.manager.app.STAGE_HEIGHT / 2, true)
    const overlayRange = this.getYFromRange(chart, overlayStart, overlayEnd)
    this.overlay.y = overlayRange.startY
    this.overlay.height = overlayRange.endY - overlayRange.startY
    this.overlay.height = Math.max(2, this.overlay.height)

    const selection = this.manager.chartManager.selection.notes
    if (selection.length < 1) {
      this.selectionOverlay.visible = false
    } else {
      this.selectionOverlay.visible = true
      let selectionStart, selectionEnd
      if (Options.chart.CMod) {
        selectionStart = minArr(selection.map(note => note.second))
        selectionEnd = maxArr(
          selection.map(note => chart.getSecondsFromBeat(getNoteEnd(note)))
        )
      } else {
        selectionStart = minArr(selection.map(note => note.beat))
        selectionEnd = maxArr(selection.map(note => getNoteEnd(note)))
      }
      const selectionRange = this.getYFromRange(
        chart,
        selectionStart,
        selectionEnd
      )
      this.selectionOverlay.y = selectionRange.startY
      this.selectionOverlay.height = selectionRange.endY - selectionRange.startY
      this.selectionOverlay.height = Math.max(2, this.selectionOverlay.height)
    }

    if (
      this.manager.app.STAGE_HEIGHT != this.lastHeight ||
      this.lastCMod != Options.chart.CMod
    ) {
      this.lastCMod = Options.chart.CMod
      this.lastHeight = this.manager.app.STAGE_HEIGHT
      this.updateDimensions()
      this.populate()
    }
  }

  private getYFromRange(chart: Chart, start: number, end: number) {
    const lastBeat = chart.getLastBeat()
    const lastSecond = chart.getLastSecond()
    let t_startY = unlerp(0, lastBeat, start)
    let t_endY = unlerp(0, lastBeat, end)
    if (Options.chart.CMod) {
      t_startY = unlerp(-chart.timingData.getOffset(), lastSecond, start)
      t_endY = unlerp(-chart.timingData.getOffset(), lastSecond, end)
    }
    t_startY = clamp(t_startY, 0, 1)
    t_endY = clamp(t_endY, 0, 1)
    if (t_startY > t_endY) [t_startY, t_endY] = [t_endY, t_startY]
    const startY = (t_startY - 0.5) * this.container.height
    const endY = (t_endY - 0.5) * this.container.height
    return {
      startY,
      endY,
    }
  }

  updateDimensions() {
    const chart = this.getChart()
    if (!chart) {
      return
    }

    const height = this.manager.app.STAGE_HEIGHT - this.verticalMargin
    this.backing.height = height + this.backingVerticalPadding
    this.backing.width = this.backingWidth
    this.overlay.width = this.backingWidth
    this.selectionOverlay.width = this.backingWidth
    this.pivot.x = this.backing.width / 2
  }

  populate() {}

  protected getChart(): Chart {
    return this.manager.chartManager.loadedChart!
  }
}
