import { BitmapText, Container } from "pixi.js"
import { BetterRoundedRect } from "../../util/BetterRoundedRect"
import { Options } from "../../util/Options"
import { destroyChildIf, roundDigit } from "../../util/Util"
import { EditTimingMode } from "../ChartManager"
import { ChartRenderer } from "../ChartRenderer"
import { TimingEvent, TimingEventProperty } from "../sm/TimingTypes"
import { TIMING_EVENT_COLORS } from "./TimingAreaContainer"
import { TIMING_TRACK_WIDTHS, timingNumbers } from "./TimingTrackContainer"

interface TimingBox extends Container {
  event: TimingEvent
  songTiming: boolean
  deactivated: boolean
  marked: boolean
  dirtyTime: number
  backgroundObj: BetterRoundedRect
  textObj: BitmapText
}

export class SelectionTimingEventContainer extends Container {
  children: TimingBox[] = []

  private renderer: ChartRenderer
  private eventMap: Map<TimingEvent, TimingBox> = new Map()
  private trackPosCache: Map<string, number> = new Map()

  constructor(renderer: ChartRenderer) {
    super()
    this.renderer = renderer
    this.sortableChildren = true
  }

  update(beat: number, toBeat: number) {
    if (!this.renderer.chartManager.eventSelection.shift) {
      destroyChildIf(this.children, () => true)
      this.eventMap.clear()
      this.trackPosCache.clear()
      return
    }
    const beatShift = this.renderer.chartManager.eventSelection.shift.beatShift
    this.visible = true
    this.children.forEach(child => (child.marked = false))
    //Reset mark of old objects
    for (const event of this.renderer.chartManager.eventSelection
      .timingEvents) {
      if (event.beat! + beatShift > toBeat) continue

      const [outOfBounds, endSearch, yPos] = this.checkBounds(event, beat)
      if (endSearch) continue
      if (outOfBounds) continue

      const timingBox = this.getTimingBox(event)

      const side = Options.chart.timingEventOrder.right.includes(event.type)
        ? "right"
        : "left"
      if (this.renderer.chartManager.editTimingMode != EditTimingMode.Off) {
        let x = this.getTrackPos(event.type)
        x += (TIMING_TRACK_WIDTHS[event.type] / 2) * (x > 0 ? 1 : -1)
        timingBox.position.x = x
        timingBox.textObj.anchor.x = 0.5
      } else {
        let x =
          (side == "right" ? 1 : -1) *
          (this.renderer.chart.gameType.notefieldWidth * 0.5 + 80)
        if (side == "left") x -= 30
        timingBox.position.x = x
        timingBox.textObj.anchor.x = side == "right" ? 0 : 1
      }
      timingBox.backgroundObj.tint = TIMING_EVENT_COLORS[event.type] ?? 0x000000
      timingBox.backgroundObj.position.x =
        -5 - timingBox.textObj.width * timingBox.textObj.anchor.x
      timingBox.y = yPos
      timingBox.marked = true
      timingBox.dirtyTime = Date.now()

      timingBox.backgroundObj.position.y = Options.chart.reverse ? -14 : -11
      timingBox.textObj.scale.y = Options.chart.reverse ? -1 : 1
    }

    this.children
      .filter(child => !child.deactivated && !child.marked)
      .forEach(child => {
        child.deactivated = true
        child.visible = false
        this.eventMap.delete(child.event)
      })

    destroyChildIf(this.children, child => Date.now() - child.dirtyTime > 5000)
  }

  private checkBounds(
    event: TimingEvent,
    beat: number
  ): [boolean, boolean, number] {
    const newBeat =
      event.beat! + this.renderer.chartManager.eventSelection.shift!.beatShift
    const y =
      Options.chart.CMod && event.second
        ? this.renderer.getYPosFromTime(event.second)
        : this.renderer.getYPos(newBeat)
    if (y < this.renderer.getUpperBound()) return [true, false, y]
    if (y > this.renderer.getLowerBound()) {
      if (newBeat < beat || this.renderer.isNegScroll(newBeat))
        return [true, false, y]
      else return [true, true, y]
    }
    return [false, false, y]
  }

  private getTimingBox(event: TimingEvent): TimingBox {
    if (this.eventMap.get(event)) return this.eventMap.get(event)!
    let newChild: Partial<TimingBox> | undefined
    for (const child of this.children) {
      if (child.deactivated) {
        child.deactivated = false
        newChild = child
        break
      }
    }
    if (!newChild) {
      newChild = new Container() as TimingBox
      newChild.zIndex = event.beat
      newChild.textObj = new BitmapText("", timingNumbers)
      newChild.backgroundObj = new BetterRoundedRect()
      newChild.addChild!(newChild.backgroundObj)
      newChild.addChild!(newChild.textObj)
      this.addChild(newChild as TimingBox)
    }
    newChild.alpha = 0.4
    newChild.event = event
    newChild.deactivated = false
    newChild.songTiming = this.renderer.chart.timingData.isTypeChartSpecific(
      event.type
    )
    newChild.marked = true
    newChild.visible = true
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
        label = `${roundDigit(event.value, 3)}/${roundDigit(event.delay, 3)}/${
          event.unit
        }`
        break
      case "LABELS":
        label = event.value
        break
      case "TIMESIGNATURES":
        label = `${roundDigit(event.upper, 3)}/${roundDigit(event.lower, 3)}`
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
    newChild.textObj!.text = label
    newChild.textObj!.anchor.y = 0.5
    newChild.visible = true
    newChild.backgroundObj!.width = newChild.textObj!.width + 10
    newChild.backgroundObj!.height = 25
    newChild.zIndex = event.beat
    this.eventMap.set(event, newChild as TimingBox)
    return newChild as TimingBox
  }

  getTrackPos(type: TimingEventProperty) {
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
