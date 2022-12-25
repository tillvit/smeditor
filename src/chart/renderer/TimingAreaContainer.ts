import { Container, Sprite, Texture } from "pixi.js"
import { ChartRenderer } from "../ChartRenderer"
import { DelayTimingEvent, FakeTimingEvent, StopTimingEvent, TimingEventProperty, WarpTimingEvent } from "../sm/TimingTypes"

interface TimingAreaObject extends Sprite {
  event: StopTimingEvent | WarpTimingEvent | DelayTimingEvent | FakeTimingEvent,
  deactivated: boolean,
  marked: boolean,
  dirtyTime: number
}

export const TIMING_EVENT_DATA: {[key in TimingEventProperty]: ["right"|"left", number]} = {
  "BPMS": ["right",0x661320],
  "STOPS": ["left",0x9ea106],
  "DELAYS": ["left",0x06a2d6],
  "WARPS": ["right",0x800b55],
  "FAKES": ["left",0x888888],
  "COMBOS": ["right",0x0f5c25],
  "SPEEDS": ["right",0x2d4c75],
  "LABELS": ["right",0x6e331d],
  "SCROLLS": ["left",0x161f45],
  "TIMESIGNATURES": ["left",0x756941],
  "TICKCOUNTS": ["right",0x339c37],
  "BGCHANGES": ["left",0xad511c],
  "FGCHANGES": ["left",0xcf302d],
  "ATTACKS": ["left",0x08bf88],
}

export class TimingAreaContainer extends Container {

  children: TimingAreaObject[] = []

  private renderer: ChartRenderer
  private timingAreaMap: Map<StopTimingEvent | WarpTimingEvent | DelayTimingEvent | FakeTimingEvent, TimingAreaObject> = new Map

  constructor(renderer: ChartRenderer) {
    super()
    this.renderer = renderer
  }

  renderThis(beat: number, fromBeat: number, toBeat: number, fromSecond: number) {

    //Reset mark of old objects
    this.children.forEach(child => child.marked = false)

    //Add new objects
    for (let event of this.renderer.chart.timingData.getTimingData("STOPS", "WARPS", "DELAYS", "FAKES")) { 
      if (!this.renderer.options.chart.renderTimingEvent[event.type]) continue

      //Check beat requirements
      if ((event.type == "STOPS" || event.type == "DELAYS") && event.second! + Math.abs(event.value) <= fromSecond) continue
      if ((event.type == "WARPS" || event.type == "FAKES") && event.beat + event.value < fromBeat) continue
      if (event.beat > toBeat) break
      
      //Check if box should be displayed
      if (event.type == "STOPS" || event.type == "DELAYS") {
        if (!((!this.renderer.options.chart.CMod && event.value < 0) || (this.renderer.options.chart.CMod && event.value > 0))) continue
      }
      if (event.type == "WARPS" && this.renderer.options.chart.CMod) continue 


      let [outOfBounds, endSearch, yPos, length] = this.checkBounds(event, beat)
      if (endSearch) break
      if (outOfBounds) continue

      //Move element
      let area = this.getTimingArea(event)
      area.y = yPos
      area.height = length
      area.marked = true
      area.dirtyTime = Date.now()
    }

    //Remove old elements
    this.children.filter(child => !child.deactivated && !child.marked).forEach(child => {
      child.deactivated = true
      child.visible = false
      this.timingAreaMap.delete(child.event)
    })

    this.children.filter(child => Date.now() - child.dirtyTime > 5000).forEach(child => {
      this.removeChild(child)
    })
  }

  private checkBounds(event: StopTimingEvent | WarpTimingEvent | DelayTimingEvent | FakeTimingEvent, beat: number): [boolean, boolean, number, number] {
    let y_start = this.renderer.getYPos(event.beat)
    let length = this.renderer.getYPos(event.beat + event.value) - y_start
    if (event.type == "STOPS" || event.type == "DELAYS") {
      if (event.value < 0) length = this.renderer.getYPos(this.renderer.chart.getBeat(event.second!+0.0001))-y_start
      else length = event.value*this.renderer.options.chart.speed/100*64*4
    }
    if (y_start+length < -32 - this.renderer.y) return [true, false, y_start, length]
    if (y_start > this.renderer.chartManager.app.pixi.screen.height-this.renderer.y+32) {
      if (this.renderer.isNegScroll() || event.beat < beat) return [true, false, y_start, length]
      else return [true, true, y_start, length]
    }
    return [false, false, y_start, length]
  }

  private getTimingArea(event: StopTimingEvent | WarpTimingEvent | DelayTimingEvent | FakeTimingEvent): TimingAreaObject {
    if (this.timingAreaMap.get(event)) return this.timingAreaMap.get(event)!
    let newChild: Partial<TimingAreaObject> | undefined
    for (let child of this.children) {
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
    newChild.event = event
    newChild.deactivated = false
    newChild.marked = true
    newChild.anchor!.x = 0.5
    newChild.anchor!.y = 0
    newChild.width = 384
    newChild.visible = true
    newChild.tint = TIMING_EVENT_DATA[event.type][1]
    newChild.alpha = 0.2
    this.timingAreaMap.set(event, newChild as TimingAreaObject)
    return newChild as TimingAreaObject
  }
}