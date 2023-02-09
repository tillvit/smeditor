import { BitmapText, Container, Point, Sprite, Texture } from "pixi.js"
import { EditMode } from "../../chart/ChartManager"
import { Chart } from "../../chart/sm/Chart"
import { BetterRoundedRect } from "../../util/BetterRoundedRect"
import { EventHandler } from "../../util/EventHandler"
import { Options } from "../../util/Options"
import { TimerStats } from "../../util/TimerStats"
import {
  destroyChildIf,
  getFPS,
  getMemoryString,
  getTPS,
  roundDigit,
} from "../../util/Util"
import { Widget } from "./Widget"
import { WidgetManager } from "./WidgetManager"

const WIDGET_WIDTH = 310

interface DropdownItem {
  bg: BetterRoundedRect
  text: BitmapText
  hovered: boolean
  chart: Chart
}

export class InfoWidget extends Widget {
  background = new BetterRoundedRect()
  maskObj = new BetterRoundedRect()
  items = new Container()
  texts = new Container<BitmapText>()
  noteCounts = new Container<BitmapText>()
  dropdownExtended = false
  dropdownBacking = new BetterRoundedRect(false)
  dropdownBackingTarget = 0
  dropdownItems = new Container()
  dropdownItemList: DropdownItem[] = []
  dropdownMask = new Sprite(Texture.WHITE)
  dropdownArrow = Sprite.from(
    "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAABgAAAAYCAYAAADgdz34AAAAAXNSR0IArs4c6QAAAERlWElmTU0AKgAAAAgAAYdpAAQAAAABAAAAGgAAAAAAA6ABAAMAAAABAAEAAKACAAQAAAABAAAAGKADAAQAAAABAAAAGAAAAADiNXWtAAAAn0lEQVRIDe2QXQrCQAyEG8Wz+uIPeBCxbx62GL+BBGppdRVBhASG7GYnk+x0XUU5UA781gF337zaoIUzq0HjHgzKswSKI85uibNaeqC+DvQIHaa8qPUj3pTy/I6AgQtQ3MAxOzhvo0byK7B8eyurETwM4f4d8dwkhsgmhX4iKFT7bPMUzywhkD/h2G5L8wYawsBTDD2bmecClcuBP3fgDlzXonnbkyRWAAAAAElFTkSuQmCC"
  )
  noteTypeContainer = new Container<Container>()

  songTab = new Container()

  private showEase = 0
  private easeVelocity = 0
  private lastType = ""
  private hoverType?: string

  constructor(manager: WidgetManager) {
    super(manager)
    this.addChild(this.background)
    this.background.tint = 0
    this.background.alpha = 0.3
    this.background.width = WIDGET_WIDTH
    this.maskObj.width = WIDGET_WIDTH
    this.background.zIndex = -1
    this.visible = false
    this.sortableChildren = true
    this.addChild(this.maskObj, this.items)
    this.items.addChild(this.texts, this.songTab)

    this.items.mask = this.maskObj
    const mode = new BitmapText("", {
      fontName: "Assistant",
      fontSize: 25,
    })
    mode.name = "Mode"
    mode.x = 20
    mode.y = 20
    this.texts.addChild(mode)

    const info = new BitmapText("", {
      fontName: "Assistant",
      fontSize: 18,
    })
    info.name = "Info"
    info.x = 20
    info.y = 60
    info.anchor.y = 0
    this.texts.addChild(info)

    const chart = new BitmapText("", {
      fontName: "Assistant",
      fontSize: 18,
    })
    chart.name = "Chart"
    chart.x = 20
    chart.y = 50
    this.texts.addChild(chart)

    const renderStats = new BitmapText("", {
      fontName: "Assistant",
      fontSize: 18,
    })
    renderStats.name = "RStats"
    renderStats.x = 290
    renderStats.y = 20
    renderStats.align = "right"
    renderStats.visible = false
    renderStats.anchor.x = 1
    this.texts.addChild(renderStats)

    EventHandler.on("chartLoaded", () => {
      destroyChildIf(this.noteCounts.children, () => true)
      destroyChildIf(this.noteTypeContainer.children, () => true)
      if (!this.manager.chartManager.chart) return
      const stats = this.manager.chartManager.chart.getNotedataStats().counts
      let numLines = 0
      for (const type in stats) {
        const text = new BitmapText(`${type}: ${stats[type]}`, {
          fontName: "Assistant",
          fontSize: 18,
        })
        text.name = type
        text.x = 20 + 150 * (numLines % 2)
        text.y = Math.floor(numLines++ / 2) * 18
        this.noteCounts.addChild(text)
      }
      let numTypes = 0
      const active = this.manager.chartManager.getEditingNoteType()
      for (const type of this.manager.chartManager.chart.gameType
        .editNoteTypes) {
        const sprite =
          this.manager.chartManager.chartView!.notefield.getNoteSprite({
            type,
            beat: 0,
            col: 0,
          })
        sprite.name = type
        sprite.x = 20 + 16 + 40 * (numTypes % 7)
        sprite.y = 40 * Math.floor(numTypes++ / 7)
        sprite.width = 32
        sprite.height = 32
        sprite.alpha = 0.3
        if (type == active) sprite.alpha = 0.9
        sprite.interactive = true
        sprite.on("mouseenter", () => {
          this.hoverType = type
          if (sprite.alpha == 0.3) sprite.alpha = 0.5
        })
        sprite.on("mouseleave", () => {
          this.hoverType = undefined
          if (sprite.alpha == 0.5) sprite.alpha = 0.3
        })
        sprite.on("click", () => {
          this.manager.chartManager.setEditingNoteType(type)
        })
        this.noteTypeContainer.addChild(sprite)
      }
      this.dropdownArrow.visible = true
    })

    this.items.addChild(this.dropdownArrow)
    this.dropdownArrow.x = 20
    this.dropdownArrow.y = 54
    this.dropdownArrow.scale.set(0.5)
    this.dropdownArrow.visible = false

    this.items.addChild(this.dropdownBacking)
    this.dropdownBacking.x = 15
    this.dropdownBacking.y = 48
    this.dropdownBacking.alpha = 0.3
    this.dropdownBacking.interactive = true
    this.dropdownBacking.on("mouseenter", () => {
      this.dropdownBackingTarget = 0.2
    })
    this.dropdownBacking.on("mouseleave", () => {
      this.dropdownBackingTarget = 0
    })

    this.dropdownItems.x = 15
    this.dropdownItems.y = 72

    this.items.addChild(this.noteTypeContainer)
    const canvas = this.manager.chartManager.app.renderer
      .view as HTMLCanvasElement
    canvas.addEventListener("click", e => {
      const local = this.dropdownBacking.toLocal(
        new Point(e.clientX, e.clientY)
      )
      const rect = canvas.getBoundingClientRect()
      local.y -= rect.y
      if (
        local.x > 0 &&
        local.y > 0 &&
        local.y < 22 &&
        local.x < this.dropdownBacking.getLocalBounds().width
      ) {
        if (this.dropdownExtended) {
          this.dropdownExtended = false
          return
        }
        this.dropdownItems.removeChildren()
        destroyChildIf(this.dropdownItems.children, () => true)
        this.dropdownExtended = true
        const bg = new BetterRoundedRect()
        this.dropdownItems.addChild(bg)
        this.dropdownItemList = []
        if (!this.manager.chartManager.sm || !this.manager.chartManager.chart)
          return
        const charts =
          this.manager.chartManager.sm.charts[
            this.manager.chartManager.chart.gameType.id
          ] ?? []
        if (charts.length == 0) return
        const dropdownItems: Partial<DropdownItem>[] = []
        for (let chartIndex = 0; chartIndex < charts.length; chartIndex++) {
          const chart = charts[chartIndex]
          const text = new BitmapText(`${chart.difficulty} ${chart.meter}`, {
            fontName: "Assistant",
            fontSize: 18,
          })
          text.x = 5
          text.y = 1.5 + chartIndex * 22
          this.dropdownItems.addChild(text)
          dropdownItems.push({ text, chart, hovered: false })
        }
        const maxWidth = Math.max(
          ...dropdownItems.map(item => item.text!.width)
        )
        for (let chartIndex = 0; chartIndex < charts.length; chartIndex++) {
          const bg = new BetterRoundedRect()
          bg.width = maxWidth + 10
          bg.height = 22
          bg.x = 0
          bg.y = 0 + chartIndex * 22
          bg.alpha = 0
          bg.interactive = true
          bg.on("mouseenter", () => {
            dropdownItems[chartIndex].hovered = true
          })
          bg.on("mouseleave", () => {
            dropdownItems[chartIndex].hovered = false
          })
          bg.on("click", () => {
            this.manager.chartManager.loadChart(dropdownItems[chartIndex].chart)
            this.dropdownExtended = false
          })
          this.dropdownItems.addChild(bg)
          dropdownItems[chartIndex].bg = bg
        }
        this.dropdownMask.width = maxWidth + 10
        this.dropdownMask.x = 0
        this.dropdownMask.y = 0

        bg.width = maxWidth + 10
        bg.height = charts.length * 22
        bg.x = 0
        bg.y = 0
        bg.tint = 0x555555

        this.dropdownItemList = dropdownItems as DropdownItem[]

        this.dropdownItems.addChild(this.dropdownMask)
      } else {
        this.dropdownExtended = false
      }
    })
    this.items.addChild(this.noteCounts)

    this.addChild(this.dropdownItems)

    this.dropdownItems.mask = this.dropdownMask

    EventHandler.on("chartModified", () => {
      if (!this.manager.chartManager.chart) return
      const stats = this.manager.chartManager.chart.getNotedataStats().counts
      for (const type in stats) {
        const text = this.noteCounts.getChildByName<BitmapText>(type)
        text.text = `${type}: ${stats[type]}`
      }
    })

    this.noteTypeContainer.y = 190
    this.noteCounts.y = 220
  }

  update(): void {
    this.visible = !!this.manager.chartManager.sm
    this.x = -this.manager.app.renderer.screen.width / 2 + 15
    this.y = -this.manager.app.renderer.screen.height / 2 + 20
    this.background.height = 150
    this.maskObj.height = 150

    const chart = this.manager.chartManager.chart

    const activeNoteType = this.manager.chartManager.getEditingNoteType()

    this.texts.getChildByName<BitmapText>("Mode").text =
      this.manager.chartManager.getMode()
    this.texts.getChildByName<BitmapText>("Info").text =
      "\nTime: " +
      roundDigit(this.manager.chartManager.getTime(), 3) +
      "\nBeat: " +
      roundDigit(this.manager.chartManager.getBeat(), 3) +
      "\nBPM: " +
      (chart
        ? roundDigit(
            chart.timingData.getBPM(this.manager.chartManager.getBeat()),
            3
          )
        : "-") +
      "\n\nNote Type: " +
      (this.hoverType ?? activeNoteType)

    this.texts.getChildByName<BitmapText>("Chart").text = chart
      ? `${chart.difficulty} ${chart.meter}`
      : "No Chart"
    this.dropdownArrow.visible = !!chart
    this.dropdownArrow.x =
      23 + this.texts.getChildByName<BitmapText>("Chart").width
    this.dropdownBacking.width = this.dropdownArrow.x

    if (this.lastType != activeNoteType) {
      for (const sprite of this.noteTypeContainer.children) {
        if (sprite.name == activeNoteType) sprite.alpha = 0.9
        else sprite.alpha = 0.3
      }
      this.lastType = activeNoteType
    }

    const renderStats = this.texts.getChildByName<BitmapText>("RStats")
    renderStats.visible = Options.debug.renderingStats
    if (Options.debug.renderingStats) {
      renderStats.text =
        getFPS() + " FPS\n" + getTPS() + " TPS\n" + getMemoryString() + "\n"
      if (Options.debug.showTimers) {
        for (const timer of TimerStats.getTimers()) {
          renderStats.text +=
            timer.name + ": " + timer.lastTime.toFixed(3) + "ms\n"
        }
      }
    }

    if (Options.general.smoothAnimations) {
      const easeTo = Number(
        this.manager.chartManager.getMode() != EditMode.Edit
      )
      this.easeVelocity += (easeTo - this.showEase) * 0.05
      this.showEase += this.easeVelocity
      this.easeVelocity *= 0.75
      this.background.height +=
        (1 - this.showEase) * (120 + this.noteCounts.height)
      this.dropdownBacking.alpha =
        (this.dropdownBackingTarget - this.dropdownBacking.alpha) * 0.3 +
        this.dropdownBacking.alpha
      for (const dropdown of this.dropdownItemList) {
        const target = dropdown.hovered ? 0.3 : 0
        dropdown.bg.alpha =
          (target - dropdown.bg.alpha) * 0.3 + dropdown.bg.alpha
      }
      if (chart) {
        const charts =
          this.manager.chartManager.sm?.charts[chart.gameType.id] ?? []
        const target = this.dropdownExtended ? charts.length * 22 : 0
        this.dropdownMask.height =
          (target - this.dropdownMask.height) * 0.3 + this.dropdownMask.height
      }
    } else {
      if (this.manager.chartManager.getMode() == EditMode.Edit) {
        this.background.height += 120 + this.noteCounts.height
      }
      this.dropdownBacking.alpha = this.dropdownBackingTarget
      for (const dropdown of this.dropdownItemList) {
        dropdown.bg.alpha = dropdown.hovered ? 0.3 : 0
      }
      if (chart) {
        const charts =
          this.manager.chartManager.sm?.charts[chart.gameType.id] ?? []
        const target = this.dropdownExtended ? charts.length * 22 : 0
        this.dropdownMask.height = target
      }
    }
    this.maskObj.height = this.background.height
  }
}
