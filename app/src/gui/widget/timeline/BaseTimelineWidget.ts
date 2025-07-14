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
  selectionOverlay: Sprite = new Sprite(Texture.WHITE)
  container: Container = new Container()

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

    this.x = this.manager.app.STAGE_WIDTH / 2 - this.xOffset

    EventHandler.on("chartLoaded", () => {
      this.queued = false
      this.populate()
    })
    EventHandler.on(
      options.trigger == "chart" ? "chartModifiedAfter" : "parityModified",
      () => {
        if (!this.queued) this.populate()
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
        this.populate()
      }
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

    // center the overlay if there is beat / renderer desync

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
        ? chart.getBeatFromSeconds(chartView.getVisualTime() - SECOND_RADIUS)
        : chartView.getVisualBeat() - BEAT_RADIUS
      const bottomBeat = Options.chart.CMod
        ? chart.getBeatFromSeconds(chartView.getVisualTime() + SECOND_RADIUS)
        : chartView.getVisualBeat() + BEAT_RADIUS
      this.populate(topBeat, bottomBeat)
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

  getYFromBeat(beat: number) {
    const chart = this.getChart()
    const second = chart.getSecondsFromBeat(beat)
    const chartView = this.manager.chartManager.chartView!

    let t = 0
    if (Options.chart.CMod) {
      const topSecond = Options.chart.layoutFollowPosition
        ? chartView.getVisualTime() - SECOND_RADIUS
        : chart.timingData.getOffset()
      const bottomSecond = Options.chart.layoutFollowPosition
        ? chartView.getVisualTime() + SECOND_RADIUS
        : chart.getLastSecond()
      t = unlerp(topSecond, bottomSecond, second)
    } else {
      const topBeat = Options.chart.layoutFollowPosition
        ? chartView.getVisualBeat() - BEAT_RADIUS
        : 0
      const bottomBeat = Options.chart.layoutFollowPosition
        ? chartView.getVisualBeat() + BEAT_RADIUS
        : chart.getLastBeat()
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
    const chartView = this.manager.chartManager.chartView!
    const chart = this.getChart()

    if (Options.chart.CMod) {
      const topSecond = Options.chart.layoutFollowPosition
        ? chartView.getVisualTime() - SECOND_RADIUS
        : chart.timingData.getOffset()
      const bottomSecond = Options.chart.layoutFollowPosition
        ? chartView.getVisualTime() + SECOND_RADIUS
        : chart.getLastSecond()
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
      const topBeat = Options.chart.layoutFollowPosition
        ? chartView.getVisualBeat() - BEAT_RADIUS
        : 0
      const bottomBeat = Options.chart.layoutFollowPosition
        ? chartView.getVisualBeat() + BEAT_RADIUS
        : chart.getLastBeat()
      return {
        beat: Math.max(0, lerp(topBeat, bottomBeat, t)),
        second: chart.getSecondsFromBeat(
          Math.max(0, lerp(topBeat, bottomBeat, t))
        ),
      }
    }
  }

  populate(_topBeat?: number, _bottomBeat?: number) {}

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

    // console.log("Registering widget", widget.constructor.name)
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
      this.widgets.reduce((acc, widget) => acc + widget.backingWidth, 0) +
      this.xGap * (this.widgets.length - 1) +
      this.xMargin
    )
  }
}
