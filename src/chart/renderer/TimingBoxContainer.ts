import { BitmapText, Container } from "pixi.js"
import { BetterRoundedRect } from "../../util/BetterRoundedRect"
import { Options } from "../../util/Options"
import { roundDigit } from "../../util/Util"
import { EditMode } from "../ChartManager"
import { ChartRenderer } from "../ChartRenderer"
import { TimingEvent } from "../sm/TimingTypes"
import { TIMING_EVENT_DATA } from "./TimingAreaContainer"

interface TimingBoxObject extends Container {
  event: TimingEvent,
  deactivated: boolean,
  marked: boolean,
  dirtyTime: number,
  backgroundObj: BetterRoundedRect,
  textObj: BitmapText,
}

const timingNumbers = {
  fontName: "Assistant",
  fontSize: 15
}

export class TimingBoxContainer extends Container {

  children: TimingBoxObject[] = []

  private renderer: ChartRenderer
  private timingBoxMap: Map<TimingEvent, TimingBoxObject> = new Map

  private same_beat = -1
  private last_length_left = 0
  private last_length_right = 0

  constructor(renderer: ChartRenderer) {
    super()
    this.renderer = renderer
    this.sortableChildren = true
  }

  renderThis(beat: number, fromBeat: number, toBeat: number) {

    this.visible = this.renderer.chartManager.getMode() != EditMode.Play || !Options.play.hideBarlines

    //Reset mark of old objects
    this.children.forEach(child => child.marked = false)

    this.same_beat = -1
    this.last_length_left = 0
    this.last_length_right = 0
    for (let event of this.renderer.chart.timingData.getTimingData()) { 
      if (toBeat < event.beat!) break
      if (!Options.chart.renderTimingEvent[event.type]) continue
      if (fromBeat > event.beat!) continue
      
      let [outOfBounds, endSearch, yPos] = this.checkBounds(event, beat)
      if (endSearch) break
      if (outOfBounds) continue

      let area = this.getTimingBox(event)
      area.y = yPos
      area.marked = true
      area.dirtyTime = Date.now()
    }

    //Remove old elements
    this.children.filter(child => !child.deactivated && !child.marked).forEach(child => {
      child.deactivated = true
      child.visible = false
      this.timingBoxMap.delete(child.event)
    })

    this.children.filter(child => Date.now() - child.dirtyTime > 5000).forEach(child => {
      child.destroy()
      this.removeChild(child)
    })
  }

  private checkBounds(event: TimingEvent, beat: number): [boolean, boolean, number] {
    let y = this.renderer.getYPos(event.beat!)
    if (event.type == "ATTACKS" && Options.chart.CMod) y = (event.second-this.renderer.chartManager.getTime())*Options.chart.speed/100*64*4 + Options.chart.receptorYPos
    if (y < -32 - this.renderer.y) return [true, false, y]
    if (y > this.renderer.chartManager.app.renderer.screen.height-this.renderer.y+32) {
      if (this.renderer.isNegScroll() || event.beat! < beat) return [true, false, y]
      else return [true, true, y]
    }
    return [false, false, y]
  }

  private getTimingBox(event: TimingEvent): TimingBoxObject {
    if (this.timingBoxMap.get(event)) return this.timingBoxMap.get(event)!
    let newChild: Partial<TimingBoxObject> | undefined
    for (let child of this.children) {
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

    let text_style = TIMING_EVENT_DATA[event.type] ?? ["right", 0x000000]
    let x = (text_style[0] == "right" ? 1 : -1) * (this.renderer.chart.gameType.notefieldWidth*0.5+64+16)
    if (this.same_beat != event.beat) {
      this.last_length_left = 0
      this.last_length_right = 0
    }
    if (text_style[0] == "left") x -= this.last_length_left
    if (text_style[0] == "right") x += this.last_length_right
    newChild.position!.x = x

    let label = ""
    switch (event.type) {
      case "BPMS":
      case "STOPS":
      case "WARPS":
      case "DELAYS":
      case "TICKCOUNTS":
      case "FAKES":
      case "SCROLLS":
        label = roundDigit(event.value,3).toString()
        break
      case "SPEEDS":
        label = roundDigit(event.value,3) + "/" + roundDigit(event.delay,3).toString() + "/" + event.unit
        break
      case "LABELS":
        label = event.value
        break
      case "TIMESIGNATURES":
        label = event.upper + "/" + event.lower
        break
      case "COMBOS":
        label = event.hitMult + "/" + event.missMult
        break
      case "BGCHANGES":
      case "FGCHANGES":
        label = event.file
        break
      case "ATTACKS":
        label = event.mods + " (" + event.endType + "=" + event.value + ")"
    }
    newChild.textObj!.text = label;
    newChild.textObj!.anchor!.x = text_style[0] == "right" ? 0 : 1
    newChild.textObj!.anchor!.y = 0.5
    newChild.visible = true
    newChild.backgroundObj!.width = newChild.textObj!.width + 10
    newChild.backgroundObj!.height = 25 
    newChild.backgroundObj!.position.x = -5 - (text_style[0] == "right" ? 0 : newChild.textObj!.width)
    newChild.backgroundObj!.position.y = -10
    newChild.backgroundObj!.tint = text_style[1]
    newChild.zIndex = event.beat
    if (text_style[0] == "left") this.last_length_left += newChild.textObj!.width + 15
    if (text_style[0] == "right") this.last_length_right += newChild.textObj!.width + 15 
    this.same_beat = event.beat!
    this.timingBoxMap.set(event, newChild as TimingBoxObject)
    return newChild as TimingBoxObject
  }
}