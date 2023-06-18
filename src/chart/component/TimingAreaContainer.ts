import { Container, Sprite, Texture } from "pixi.js"
import { Options } from "../../util/Options"
import { destroyChildIf } from "../../util/Util"
import { EditMode } from "../ChartManager"
import { ChartRenderer } from "../ChartRenderer"
import {
  DelayTimingEvent,
  FakeTimingEvent,
  StopTimingEvent,
  WarpTimingEvent,
} from "../sm/TimingTypes"

interface TimingAreaObject extends Sprite {
  event: StopTimingEvent | WarpTimingEvent | DelayTimingEvent | FakeTimingEvent
  deactivated: boolean
  marked: boolean
  dirtyTime: number
}

export const TIMING_EVENT_COLORS: {
  [key: string]: number
} = {
  BPMS: 9182254,
  STOPS: 4934913,
  DELAYS: 217453,
  WARPS: 9243998,
  FAKES: 4868682,
  COMBOS: 939078,
  SPEEDS: 2968693,
  LABELS: 7747359,
  SCROLLS: 0x36468e,
  TIMESIGNATURES: 5392684,
  TICKCOUNTS: 1594906,
  BGCHANGES: 8460415,
  FGCHANGES: 8857115,
  ATTACKS: 1856083,
}

export class TimingAreaContainer extends Container {
  children: TimingAreaObject[] = []

  private renderer: ChartRenderer
  private timingAreaMap: Map<
    StopTimingEvent | WarpTimingEvent | DelayTimingEvent | FakeTimingEvent,
    TimingAreaObject
  > = new Map()

  constructor(renderer: ChartRenderer) {
    super()
    this.renderer = renderer
  }

  update(beat: number, fromBeat: number, toBeat: number, fromSecond: number) {
    this.visible =
      this.renderer.chartManager.getMode() != EditMode.Play ||
      !Options.play.hideBarlines

    //Reset mark of old objects
    this.children.forEach(child => (child.marked = false))

    //Add new objects
    for (const event of this.renderer.chart.timingData.getTimingData(
      "STOPS",
      "WARPS",
      "DELAYS",
      "FAKES"
    )) {
      if (!Options.chart.renderTimingEvent[event.type]) continue

      //Check beat requirements
      if (
        (event.type == "STOPS" || event.type == "DELAYS") &&
        event.second! + Math.abs(event.value) <= fromSecond
      )
        continue
      if (
        (event.type == "WARPS" || event.type == "FAKES") &&
        event.beat + event.value < fromBeat
      )
        continue
      if (event.beat > toBeat) break

      //Check if box should be displayed
      if (event.type == "STOPS" || event.type == "DELAYS") {
        if (
          !(
            (!Options.chart.CMod && event.value < 0) ||
            (Options.chart.CMod && event.value > 0)
          )
        )
          continue
      }
      if (event.type == "WARPS" && Options.chart.CMod) continue

      const [outOfBounds, endSearch, yPos, length] = this.checkBounds(
        event,
        beat
      )
      if (endSearch) break
      if (outOfBounds) continue

      //Move element
      const area = this.getTimingArea(event)
      area.y = yPos
      area.height = length
    }

    //Remove old elements
    this.children
      .filter(child => !child.deactivated && !child.marked)
      .forEach(child => {
        child.deactivated = true
        child.visible = false
        this.timingAreaMap.delete(child.event)
      })

    destroyChildIf(this.children, child => Date.now() - child.dirtyTime > 5000)
  }

  private checkBounds(
    event:
      | StopTimingEvent
      | WarpTimingEvent
      | DelayTimingEvent
      | FakeTimingEvent,
    beat: number
  ): [boolean, boolean, number, number] {
    const yStart = Options.chart.CMod
      ? this.renderer.getYPosFromSecond(event.second!)
      : this.renderer.getYPosFromBeat(event.beat)
    let yEnd = yStart
    switch (event.type) {
      case "STOPS":
      case "DELAYS": {
        if (Options.chart.CMod && event.value > 0) {
          yEnd = this.renderer.getYPosFromSecond(event.second! + event.value)
        } else if (event.value < 0) {
          yEnd = this.renderer.getYPosFromBeat(
            this.renderer.chart.getBeatFromSeconds(event.second! + 0.0001)
          )
        }
        break
      }
      case "FAKES": {
        yEnd = this.renderer.getYPosFromBeat(event.beat + event.value)

        break
      }
      case "WARPS": {
        if (!Options.chart.CMod) {
          yEnd = this.renderer.getYPosFromBeat(event.beat + event.value)
        }
        break
      }
    }
    const length = yEnd - yStart
    if (yStart + length < this.renderer.getUpperBound())
      return [true, false, yStart, length]
    if (yStart > this.renderer.getLowerBound()) {
      if (event.beat < beat || this.renderer.isNegScroll(event.beat))
        return [true, false, yStart, length]
      else return [true, true, yStart, length]
    }
    return [false, false, yStart, length]
  }

  private getTimingArea(
    event:
      | StopTimingEvent
      | WarpTimingEvent
      | DelayTimingEvent
      | FakeTimingEvent
  ): TimingAreaObject {
    if (this.timingAreaMap.get(event)) {
      const cached = this.timingAreaMap.get(event)!
      return Object.assign(cached, {
        deactivated: false,
        marked: true,
        dirtyTime: Date.now(),
      })
    }
    let newChild: (Partial<TimingAreaObject> & Sprite) | undefined
    for (const child of this.children) {
      if (child.deactivated) {
        child.deactivated = false
        newChild = child
        break
      }
    }
    if (!newChild) {
      newChild = new Sprite(Texture.WHITE) as TimingAreaObject
      this.addChild(newChild as TimingAreaObject)
    }
    Object.assign(newChild, {
      alpha: 0.2,
      width: this.renderer.chart.gameType.notefieldWidth + 128,
      visible: true,
      tint: TIMING_EVENT_COLORS[event.type],
      event,
      marked: true,
      deactivated: false,
      dirtyTime: Date.now(),
    })
    newChild.anchor.x = 0.5
    newChild.anchor.y = 0
    this.timingAreaMap.set(event, newChild as TimingAreaObject)
    return newChild as TimingAreaObject
  }
}
