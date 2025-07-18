import {
  Container,
  FederatedPointerEvent,
  Sprite,
  Texture,
  Ticker,
} from "pixi.js"
import { EditMode } from "../../../chart/ChartManager"
import { Chart } from "../../../chart/sm/Chart"
import { BetterRoundedRect } from "../../../util/BetterRoundedRect"
import { assignTint } from "../../../util/Color"
import { DisplayObjectPool } from "../../../util/DisplayObjectPool"
import { EventHandler } from "../../../util/EventHandler"
import { Flags } from "../../../util/Flags"
import { clamp, lerp, maxArr, minArr, unlerp } from "../../../util/Math"
import { Options } from "../../../util/Options"
import { getNoteEnd } from "../../../util/Util"
import { Widget } from "../Widget"
import { WidgetManager } from "../WidgetManager"

interface TimelineWidgetOptions {
  backingWidth?: number
  order?: number
  trigger: "chart" | "parity"
}

const SECOND_RADIUS = 10
const BEAT_RADIUS = 16

export class BaseTimelineWidget extends Widget {
  backing: BetterRoundedRect = new BetterRoundedRect("noBorder")
  overlay: Sprite = new Sprite(Texture.WHITE)
  receptor: Sprite = new Sprite(Texture.WHITE)
  selectionOverlay: Sprite = new Sprite(Texture.WHITE)
  container: Container = new Container()

  errors = new DisplayObjectPool({
    create: () => {
      const sprite = new Sprite(Texture.WHITE)
      sprite.tint = 0xff0000
      sprite.alpha = 0.3
      return sprite
    },
  })
  errorMap: Map<number, Sprite> = new Map()

  protected lastHeight = 0
  protected lastBeat = -1
  protected mouseDown = false
  protected queued = false

  protected verticalMargin = 40
  protected backingVerticalPadding = 10
  protected backingWidth = 32
  private xOffset = 20
  private dragStartT = 0
  private dragEndT = 0

  _order = 0

  static widgets: BaseTimelineWidget[] = []
  static xGap = 10
  static xMargin = 20

  constructor(
    manager: WidgetManager,
    options: Partial<TimelineWidgetOptions> = {}
  ) {
    super(manager)

    options = {
      backingWidth: 32,
      order: 0,
      trigger: "chart",
      ...options,
    }

    this.backingWidth = options.backingWidth!
    this.sortableChildren = true
    this._order = options.order!

    this.addChild(this.backing)
    this.addChild(this.container)
    this.visible = false

    assignTint(this.backing, "widget-bg")

    this.receptor.anchor.x = 0.5
    this.receptor.anchor.y = 0
    this.receptor.alpha = 0.3
    this.receptor.zIndex = 10
    this.receptor.height = 2

    this.addChild(this.receptor)

    this.overlay.anchor.x = 0.5
    this.overlay.anchor.y = 0
    this.overlay.alpha = 0.3
    this.overlay.zIndex = 10

    this.addChild(this.overlay)

    this.selectionOverlay.anchor.x = 0.5
    this.selectionOverlay.anchor.y = 0
    this.selectionOverlay.tint = 0x4e6fa3
    this.selectionOverlay.alpha = 0.3
    this.selectionOverlay.zIndex = 10

    this.addChild(this.selectionOverlay)

    this.errors.zIndex = 10

    this.addChild(this.errors)

    this.x = this.manager.app.STAGE_WIDTH / 2 - this.xOffset

    EventHandler.on("chartLoaded", () => {
      this.queued = false
      this.populateRange()
    })
    EventHandler.on("parityIgnoresModified", () => {
      if (!this.queued) this.populateRange()
      this.queued = true
    })
    EventHandler.on(
      options.trigger == "chart" ? "chartModifiedAfter" : "parityModified",
      () => {
        if (!this.queued) this.populateRange()
        this.queued = true
      }
    )
    EventHandler.on("userOptionUpdated", optionId => {
      if (
        optionId == "chart.CMod" ||
        optionId == "chart.layoutFollowPosition" ||
        optionId == "chart.hideWarpedArrows" ||
        optionId == "chart.hideFakedArrows"
      ) {
        this.populateRange()
      }
    })
    const interval = setInterval(() => {
      if (this.queued) {
        this.queued = false
        this.populateRange()
      }
    }, 3000)

    this.on("destroyed", () => clearInterval(interval))

    this.eventMode = "static"
    this.on("mousedown", event => {
      this.mouseDown = true
      this.handleMouse(event)
    })
    this.on("mousemove", event => {
      if (this.mouseDown) this.handleMouse(event, true)
    })

    this.on("mouseup", () => {
      this.mouseDown = false
    })

    this.on("mouseleave", () => {
      this.mouseDown = false
    })

    this.pivot.x = this.backing.width / 2

    BaseTimelineWidget.register(this)
  }

  protected handleMouse(event: FederatedPointerEvent, drag = false) {
    if (this.manager.chartManager.getMode() == EditMode.Play) return
    if (!this.getChart()) return
    const height = this.manager.app.STAGE_HEIGHT - this.verticalMargin
    let t = (this.container.toLocal(event.global).y + height / 2) / height
    t = clamp(t, 0, 1)
    if (!drag) this.dragStartT = t
    this.dragEndT = t
    const lastNote = this.getChart().getNotedata().at(-1)
    if (!lastNote || (drag && Options.chart.layoutFollowPosition)) return

    const position = this.getSongPositionFromT(t)

    if (Options.chart.CMod) {
      this.manager.chartManager.time = position.second
    } else {
      this.manager.chartManager.beat = position.beat
    }
  }

  update() {
    this.scale.y = Options.chart.reverse ? -1 : 1
    const height = this.manager.app.STAGE_HEIGHT - this.verticalMargin
    this.backing.height = height + this.backingVerticalPadding
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
      this.selectionOverlay.height = 0
      return
    }

    if (this.mouseDown && Options.chart.layoutFollowPosition) {
      const tDifference = this.dragEndT - this.dragStartT
      if (Options.chart.CMod) {
        this.manager.chartManager.time = Math.max(
          -chart.timingData.getOffset(),
          this.manager.chartManager.time +
            (tDifference * Ticker.shared.deltaMS * SECOND_RADIUS) / 100
        )
      } else {
        this.manager.chartManager.beat = Math.max(
          0,
          this.manager.chartManager.beat +
            (tDifference * Ticker.shared.deltaMS * BEAT_RADIUS) / 100
        )
      }
    }

    const overlayStart = chartView.getBeatFromYPos(
      -this.manager.app.STAGE_HEIGHT / 2,
      true
    )
    const overlayEnd = chartView.getBeatFromYPos(
      this.manager.app.STAGE_HEIGHT / 2,
      true
    )

    let overlayStartY = this.getYFromBeat(overlayStart)
    let overlayEndY = this.getYFromBeat(overlayEnd)
    if (overlayStartY > overlayEndY) {
      ;[overlayStartY, overlayEndY] = [overlayEndY, overlayStartY]
    }

    this.overlay.y = overlayStartY - this.backing.height / 2
    this.overlay.height = overlayEndY - overlayStartY
    this.overlay.height = Math.max(2, this.overlay.height)

    const selection = this.manager.chartManager.selection.notes
    if (selection.length < 1) {
      this.selectionOverlay.visible = false
    } else {
      this.selectionOverlay.visible = true
      const selectionStart = minArr(selection.map(note => note.beat))
      const selectionEnd = maxArr(selection.map(note => getNoteEnd(note)))

      let startY = this.getYFromBeat(selectionStart)
      let endY = this.getYFromBeat(selectionEnd)
      if (startY > endY) {
        ;[startY, endY] = [endY, startY]
      }

      this.selectionOverlay.y = startY - this.backing.height / 2
      this.selectionOverlay.height = endY - startY
      this.selectionOverlay.height = Math.max(2, this.selectionOverlay.height)
    }

    this.receptor.y = Options.chart.CMod
      ? this.getYFromSecond(chartView.getVisualTime()) - this.backing.height / 2
      : this.getYFromBeat(chartView.getVisualBeat()) - this.backing.height / 2

    if (this.manager.app.STAGE_HEIGHT != this.lastHeight) {
      this.lastHeight = this.manager.app.STAGE_HEIGHT
      this.updateDimensions()
      this.populate()
    }

    if (
      Options.chart.layoutFollowPosition &&
      chartView.getVisualBeat() != this.lastBeat
    ) {
      this.lastBeat = chartView.getVisualBeat()
      const topBeat = Options.chart.CMod
        ? chart.getBeatFromSeconds(this.getTopSecond())
        : this.getTopBeat()
      const bottomBeat = Options.chart.CMod
        ? chart.getBeatFromSeconds(this.getBottomSecond())
        : this.getBottomBeat()
      this.populate(topBeat, bottomBeat)
    }

    this.errors.visible = Options.chart.parity.showErrors
  }

  populateRange() {
    const chart = this.getChart()
    if (!Options.chart.layoutFollowPosition) this.populate()
    if (!chart) return
    const topBeat = Options.chart.CMod
      ? chart.getBeatFromSeconds(this.getTopSecond())
      : this.getTopBeat()
    const bottomBeat = Options.chart.CMod
      ? chart.getBeatFromSeconds(this.getBottomSecond())
      : this.getBottomBeat()
    this.populate(topBeat, bottomBeat)
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
    this.receptor.width = this.backingWidth
    this.selectionOverlay.width = this.backingWidth
    this.pivot.x = this.backing.width / 2
  }

  getYFromBeat(beat: number) {
    const chart = this.getChart()
    const second = chart.getSecondsFromBeat(beat)

    let t = 0
    if (Options.chart.CMod) {
      const topSecond = this.getTopSecond()
      const bottomSecond = this.getBottomSecond()
      t = unlerp(topSecond, bottomSecond, second)
    } else {
      const topBeat = this.getTopBeat()
      const bottomBeat = this.getBottomBeat()
      t = unlerp(topBeat, bottomBeat, beat)
    }
    t = clamp(t, 0, 1)

    return t * (this.manager.app.STAGE_HEIGHT - this.verticalMargin)
  }

  getYFromSecond(second: number) {
    const chart = this.getChart()
    const beat = chart.timingData.getBeatFromSeconds(second)
    return this.getYFromBeat(beat)
  }

  getSongPositionFromT(t: number) {
    const chart = this.getChart()

    if (Options.chart.CMod) {
      const topSecond = this.getTopSecond()
      const bottomSecond = this.getBottomSecond()
      return {
        second: Math.max(
          -chart.timingData.getOffset(),
          lerp(topSecond, bottomSecond, t)
        ),
        beat: chart.timingData.getBeatFromSeconds(
          Math.max(
            -chart.timingData.getOffset(),
            lerp(topSecond, bottomSecond, t)
          )
        ),
      }
    } else {
      const topBeat = this.getTopBeat()
      const bottomBeat = this.getBottomBeat()
      return {
        beat: Math.max(0, lerp(topBeat, bottomBeat, t)),
        second: chart.getSecondsFromBeat(
          Math.max(0, lerp(topBeat, bottomBeat, t))
        ),
      }
    }
  }

  getTopSecond() {
    const chart = this.getChart()
    const chartView = this.manager.chartManager.chartView!
    return Options.chart.layoutFollowPosition
      ? chartView.getVisualTime() - SECOND_RADIUS
      : chart.timingData.getOffset()
  }

  getBottomSecond() {
    const chart = this.getChart()
    const chartView = this.manager.chartManager.chartView!
    return Options.chart.layoutFollowPosition
      ? chartView.getVisualTime() + SECOND_RADIUS
      : chart.getLastSecond()
  }

  getTopBeat() {
    const chartView = this.manager.chartManager.chartView!
    return Options.chart.layoutFollowPosition
      ? chartView.getVisualBeat() - BEAT_RADIUS
      : 0
  }

  getBottomBeat() {
    const chart = this.getChart()
    const chartView = this.manager.chartManager.chartView!
    return Options.chart.layoutFollowPosition
      ? chartView.getVisualBeat() + BEAT_RADIUS
      : chart.getLastBeat()
  }

  populate(_topBeat?: number, _bottomBeat?: number) {
    const chart = this.getChart()
    if (!chart) return
    if (chart.stats.parity) {
      const topBeat = _topBeat ?? this.getTopBeat()
      const bottomBeat = _bottomBeat ?? this.getBottomBeat()
      for (const rowIdx of chart.stats.parity.techErrors.keys()) {
        const position = chart.stats.parity.rowTimestamps[rowIdx]
        if (position.beat < topBeat || position.beat > bottomBeat) continue
        if (this.errorMap.has(rowIdx)) continue
        const sprite = this.errors.createChild()
        if (!sprite) continue
        sprite.height = 1
        sprite.anchor.set(0.5, 0)
        this.errorMap.set(rowIdx, sprite)
      }
      if (Options.chart.parity.showErrors) {
        for (const [rowIdx, sprite] of this.errorMap.entries()) {
          const position = chart.stats.parity.rowTimestamps[rowIdx]
          const errors = chart.stats.parity.techErrors.get(rowIdx)!
          if (
            !position ||
            position.beat < topBeat ||
            position.beat > bottomBeat ||
            !errors?.size
          ) {
            this.errorMap.delete(rowIdx)
            this.errors.destroyChild(sprite)
            continue
          }

          const ignoreSize =
            chart.getErrorIgnoresAtBeat(position.beat)?.size ?? 0
          if (errors.size - ignoreSize > 0) {
            sprite.tint = 0xff0000
          } else {
            sprite.tint = 0x888888
          }
          sprite.y = this.getYFromBeat(position.beat) - this.backing.height / 2
          sprite.width = this.backingWidth
        }
      }
    } else {
      this.errorMap.clear()
      this.errors.destroyAll()
    }
  }

  protected getChart(): Chart {
    return this.manager.chartManager.loadedChart!
  }

  get order() {
    return this._order
  }

  set order(value: number) {
    this._order = value
    BaseTimelineWidget.resort()
  }

  static register(widget: BaseTimelineWidget) {
    if (this.widgets.includes(widget)) return

    if (this.widgets.length == 0) {
      Ticker.shared.add(() => {
        let x = this.xMargin
        this.widgets.forEach(widget => {
          if (!widget.visible) return
          widget.xOffset = x
          x += widget.backingWidth + this.xGap
        })
      })
    }

    this.widgets.push(widget)
    this.resort()
  }

  static resort() {
    this.widgets.sort((a, b) => a.order - b.order)
  }

  static getTotalWidgetWidth() {
    return (
      this.widgets
        .filter(widget => widget.visible)
        .reduce((acc, widget) => acc + widget.backingWidth, 0) +
      this.xGap * (this.widgets.length - 1) +
      this.xMargin
    )
  }
}
