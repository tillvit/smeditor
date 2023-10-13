import { BitmapText, Container, Sprite, Texture } from "pixi.js"
import { BetterRoundedRect } from "../../util/BetterRoundedRect"
import { DisplayObjectPool } from "../../util/DisplayObjectPool"
import { roundDigit } from "../../util/Math"
import { Options } from "../../util/Options"
import { EditTimingMode } from "../ChartManager"
import { ChartRenderer, ChartRendererComponent } from "../ChartRenderer"
import { Cached, TimingEvent, TimingEventType } from "../sm/TimingTypes"
import { TIMING_EVENT_COLORS } from "./TimingAreaContainer"
import { TIMING_TRACK_WIDTHS, timingNumbers } from "./TimingTrackContainer"

interface TimingBox extends Container {
  event: TimingEvent
  guideLine: Sprite
  isChartTiming: boolean
  deactivated: boolean
  marked: boolean
  dirtyTime: number
  backgroundObj: BetterRoundedRect
  textObj: BitmapText
}

export class SelectionTimingEventContainer
  extends Container
  implements ChartRendererComponent
{
  children: TimingBox[] = []

  private renderer: ChartRenderer
  private timingBoxMap: Map<Cached<TimingEvent>, TimingBox> = new Map()
  private trackPosCache: Map<string, number> = new Map()
  private timingBoxPool = new DisplayObjectPool({
    create: () => {
      const box = new Container() as TimingBox
      box.guideLine = new Sprite(Texture.WHITE)
      box.textObj = new BitmapText("", timingNumbers)
      box.backgroundObj = new BetterRoundedRect()
      box.addChild(box.guideLine, box.backgroundObj, box.textObj)
      return box
    },
  })

  constructor(renderer: ChartRenderer) {
    super()
    this.renderer = renderer
    this.timingBoxPool.sortableChildren = true
    this.addChild(this.timingBoxPool)
  }

  update(fromBeat: number, toBeat: number) {
    if (!this.renderer.chartManager.eventSelection.shift) {
      this.timingBoxPool.destroyAll()
      this.timingBoxMap.clear()
      this.trackPosCache.clear()
      return
    }
    const beatShift = this.renderer.chartManager.eventSelection.shift.beatShift

    for (const event of this.renderer.chartManager.eventSelection
      .timingEvents) {
      if (toBeat < event.beat + beatShift) continue
      if (fromBeat > event.beat + beatShift) continue

      if (!this.timingBoxMap.has(event)) {
        const box = this.timingBoxPool.createChild()
        if (!box) continue
        this.timingBoxMap.set(event, box)

        let label = ""
        switch (event.type) {
          case "BPMS":
          case "STOPS":
          case "WARPS":
          case "DELAYS":
          case "TICKCOUNTS":
          case "FAKES":
          case "SCROLLS":
            label = roundDigit(event.value, 3).toString()
            break
          case "SPEEDS":
            label = `${roundDigit(event.value, 3)}/${roundDigit(
              event.delay,
              3
            )}/${event.unit}`
            break
          case "LABELS":
            label = event.value
            break
          case "TIMESIGNATURES":
            label = `${roundDigit(event.upper, 3)}/${roundDigit(
              event.lower,
              3
            )}`
            break
          case "COMBOS":
            label = `${roundDigit(event.hitMult, 3)}/${roundDigit(
              event.missMult,
              3
            )}`
            break
          case "BGCHANGES":
          case "FGCHANGES":
            label = event.file
            break
          case "ATTACKS":
            label = `${event.mods} (${event.endType}=${event.value})`
        }

        const side = Options.chart.timingEventOrder.right.includes(event.type)
          ? "right"
          : "left"

        Object.assign(box, {
          alpha: 0.4,
          isChartTiming: this.renderer.chart.timingData.isPropertyChartSpecific(
            event.type
          ),
          zIndex: event.beat,
        })
        box.textObj.text = label
        box.textObj.anchor.set(0.5, 0.55)

        box.backgroundObj.width = box.textObj.width + 10
        box.backgroundObj.height = 25
        box.backgroundObj.tint = TIMING_EVENT_COLORS[event.type] ?? 0x000000
        box.backgroundObj.position.x = -box.backgroundObj.width / 2
        box.backgroundObj.position.y = -box.backgroundObj.height / 2

        box.guideLine.height = 1
        box.guideLine.anchor.set(side == "left" ? 0 : 1, 0.5)
        box.guideLine.width =
          Math.abs(box.position.x) + 192 - box.backgroundObj.width / 2
        box.guideLine.position.x =
          ((side == "left" ? 1 : -1) * box.backgroundObj.width) / 2

        if (this.renderer.chartManager.editTimingMode != EditTimingMode.Off) {
          let x = this.getTrackPos(event.type)
          x += (TIMING_TRACK_WIDTHS[event.type] / 2) * (x > 0 ? 1 : -1)
          box.position.x = x
          box.pivot.x = 0
        } else {
          let x =
            (side == "right" ? 1 : -1) *
            (this.renderer.chart.gameType.notefieldWidth * 0.5 + 80)
          if (side == "left") x -= 30
          box.position.x = x
          box.pivot.x =
            side == "right"
              ? -box.backgroundObj.width / 2
              : box.backgroundObj.width / 2
        }
      }
    }

    for (const [event, box] of this.timingBoxMap.entries()) {
      if (
        toBeat < event.beat + beatShift ||
        fromBeat > event.beat + beatShift
      ) {
        this.timingBoxPool.destroyChild(box)
        this.timingBoxMap.delete(event)
        continue
      }
      box.textObj.scale.y = Options.chart.reverse ? -1 : 1
      box.y =
        Options.chart.CMod && event.second
          ? this.renderer.getYPosFromSecond(event.second)
          : this.renderer.getYPosFromBeat(event.beat + beatShift)
    }
  }

  getTrackPos(type: TimingEventType) {
    if (this.trackPosCache.has(type)) return this.trackPosCache.get(type)!
    const leftTypes = Options.chart.timingEventOrder.left
    const rightTypes = Options.chart.timingEventOrder.right
    let x = -this.renderer.chart.gameType.notefieldWidth * 0.5 - 128
    for (let i = leftTypes.length - 1; i >= 0; i--) {
      const type = leftTypes[i]
      this.trackPosCache.set(type, x)
      x -= TIMING_TRACK_WIDTHS[type]
    }

    x = this.renderer.chart.gameType.notefieldWidth * 0.5 + 128
    for (let i = 0; i < rightTypes.length; i++) {
      const type = rightTypes[i]
      this.trackPosCache.set(type, x)
      x += TIMING_TRACK_WIDTHS[type]
    }
    return this.trackPosCache.get(type) ?? 0
  }
}
