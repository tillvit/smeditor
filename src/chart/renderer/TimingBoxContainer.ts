import { BitmapText, Container } from "pixi.js"
import { BetterRoundedRect } from "../../util/BetterRoundedRect"
import { Options } from "../../util/Options"
import { destroyChildIf, roundDigit } from "../../util/Util"
import { EditMode } from "../ChartManager"
import { ChartRenderer } from "../ChartRenderer"
import { TimingEvent } from "../sm/TimingTypes"
import { TIMING_EVENT_DATA } from "./TimingAreaContainer"

interface TimingBoxObject extends Container {
  event: TimingEvent
  deactivated: boolean
  marked: boolean
  dirtyTime: number
  backgroundObj: BetterRoundedRect
  textObj: BitmapText
}

const timingNumbers = {
  fontName: "Assistant",
  fontSize: 15,
}

export class TimingBoxContainer extends Container {
  children: TimingBoxObject[] = []

  private renderer: ChartRenderer
  private timingBoxMap: Map<TimingEvent, TimingBoxObject> = new Map()

  constructor(renderer: ChartRenderer) {
    super()
    this.renderer = renderer
    this.sortableChildren = true
  }

  renderThis(beat: number, fromBeat: number, toBeat: number) {
    this.visible =
      this.renderer.chartManager.getMode() != EditMode.Play ||
      !Options.play.hideBarlines

    //Reset mark of old objects
    this.children.forEach(child => (child.marked = false))

    let same_beat = -1
    let same_second = undefined
    let last_length_left = 0
    let last_length_right = 0
    for (const event of this.renderer.chart.timingData.getTimingData()) {
      if (toBeat < event.beat!) break
      if (!Options.chart.renderTimingEvent[event.type]) continue
      if (fromBeat > event.beat!) continue

      const [outOfBounds, endSearch, yPos] = this.checkBounds(event, beat)
      if (endSearch) break
      if (outOfBounds) continue

      const area = this.getTimingBox(event)

      const text_style = TIMING_EVENT_DATA[event.type] ?? ["right", 0x000000]
      let x =
        (text_style[0] == "right" ? 1 : -1) *
        (this.renderer.chart.gameType.notefieldWidth * 0.5 + 64 + 16)
      if (
        same_beat != event.beat ||
        (event.second && same_second != event.second)
      ) {
        last_length_left = 0
        last_length_right = 0
      }
      if (text_style[0] == "left") x -= last_length_left
      if (text_style[0] == "right") x += last_length_right
      area.position.x = x
      area.textObj.anchor.x = text_style[0] == "right" ? 0 : 1
      area.backgroundObj.position.x =
        -5 - (text_style[0] == "right" ? 0 : area.textObj.width)
      area.backgroundObj.tint = text_style[1]
      if (text_style[0] == "left") last_length_left += area.textObj.width + 15
      if (text_style[0] == "right") last_length_right += area.textObj.width + 15
      same_beat = event.beat!
      same_second = event.second
      area.y = yPos
      area.marked = true
      area.dirtyTime = Date.now()

      area.backgroundObj.position.y = Options.chart.reverse ? -14 : -11
      area.textObj.scale.y = Options.chart.reverse ? -1 : 1
    }

    //Remove old elements
    this.children
      .filter(child => !child.deactivated && !child.marked)
      .forEach(child => {
        child.deactivated = true
        child.visible = false
        this.timingBoxMap.delete(child.event)
      })

    destroyChildIf(this.children, child => Date.now() - child.dirtyTime > 5000)
  }

  private checkBounds(
    event: TimingEvent,
    beat: number
  ): [boolean, boolean, number] {
    const y =
      Options.chart.CMod && event.second
        ? this.renderer.getYPosFromTime(event.second)
        : this.renderer.getYPos(event.beat!)
    if (y < this.renderer.getUpperBound()) return [true, false, y]
    if (y > this.renderer.getLowerBound()) {
      if (event.beat! < beat || this.renderer.isNegScroll(event.beat!))
        return [true, false, y]
      else return [true, true, y]
    }
    return [false, false, y]
  }

  private getTimingBox(event: TimingEvent): TimingBoxObject {
    if (this.timingBoxMap.get(event)) return this.timingBoxMap.get(event)!
    let newChild: Partial<TimingBoxObject> | undefined
    for (const child of this.children) {
      if (child.deactivated) {
        child.deactivated = false
        newChild = child
        break
      }
    }
    if (!newChild) {
      newChild = new Container() as TimingBoxObject
      newChild.textObj = new BitmapText("", timingNumbers)
      newChild.backgroundObj = new BetterRoundedRect()
      newChild.addChild!(newChild.backgroundObj)
      newChild.addChild!(newChild.textObj)
      this.addChild(newChild as TimingBoxObject)
    }
    newChild.event = event
    newChild.deactivated = false
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
    this.timingBoxMap.set(event, newChild as TimingBoxObject)
    return newChild as TimingBoxObject
  }
}
