import { BitmapText, Container, Sprite, Texture } from "pixi.js"
import { Options } from "../../util/Options"
import { EditMode } from "../ChartManager"
import { ChartRenderer } from "../ChartRenderer"

interface Barline extends Sprite {
  type: "barline",
  beat: number,
  deactivated: boolean,
  marked: boolean,
  dirtyTime: number
}

interface BarlineLabel extends BitmapText {
  type: "label",
  beat: number
  deactivated: boolean,
  marked: boolean,
  dirtyTime: number
}

type BarlineObject = Barline | BarlineLabel

const measureNumbers = {
  fontName: "Assistant",
  fontSize: 20,
  fill: ['#ffffff']
}

export class BarlineContainer extends Container {

  children: BarlineObject[] = []

  private renderer: ChartRenderer
  private barlineMap: Map<number, Barline> = new Map
  private barlineLabelMap: Map<number, BarlineLabel> = new Map

  constructor(renderer: ChartRenderer) {
    super()
    this.renderer = renderer
  }

  renderThis(beat: number, fromBeat: number, toBeat: number) {

    this.visible = this.renderer.chartManager.getMode() != EditMode.Play || !Options.play.hideBarlines

    //Reset mark of old objects
    this.children.forEach(child => child.marked = false)


    //Add new objects
    for (let bar_beat = Math.max(0,Math.floor(fromBeat)); bar_beat < toBeat; bar_beat++) {
      if (Options.chart.CMod && this.renderer.chart.isBeatWarped(bar_beat)) continue
      let [outOfBounds, endSearch, yPos] = this.checkBounds(bar_beat, beat)
      if (endSearch) break
      if (outOfBounds) continue
     
      //Move element
      let barline = this.getBarline(bar_beat)
      barline.y = yPos
      barline.marked = true
      barline.deactivated = false
      barline.dirtyTime = Date.now()
      if (bar_beat % 4 == 0) {
        let barlineLabel = this.getBarlineLabel(bar_beat)
        barlineLabel.y = yPos
        barlineLabel.marked = true
        barlineLabel.deactivated = false
        barlineLabel.dirtyTime = Date.now()
      }
    }

    //Remove old elements
    this.children.filter(child => !child.deactivated && !child.marked).forEach(child => {
      child.deactivated = true
      child.visible = false
      if (child.type == "barline") this.barlineMap.delete(child.beat)
      if (child.type == "label") this.barlineLabelMap.delete(child.beat)
    })

    this.children.filter(child => Date.now() - child.dirtyTime > 5000).forEach(child => {
      child.destroy()
      this.removeChild(child)
    })
  }

  private checkBounds(bar_beat: number, beat: number): [boolean, boolean, number] {
    let y = this.renderer.getYPos(bar_beat)
    if (y < -32 - this.renderer.y) return [true, false, y]
    if (y > this.renderer.chartManager.app.renderer.screen.height-this.renderer.y+32) {
      if (bar_beat < beat || this.renderer.isNegScroll(bar_beat)) return [true, false, y]
      else return [true, true, y]
    }
    return [false, false, y]
  }

  
  private getBarline(beat: number): Barline {
    if (this.barlineMap.get(beat)) return this.barlineMap.get(beat)!
    let newChild: Partial<Barline> | undefined
    for (let child of this.children) {
      if (child.type == "barline" && child.deactivated) {
        newChild = child
      }
    }
    if (!newChild) { 
      newChild = new Sprite(Texture.WHITE) as Barline 
      this.addChild(newChild as Barline)
    }
    newChild.type = "barline"
    newChild.beat = beat
    newChild.anchor!.x = 0.5
    newChild.anchor!.y = 0.5
    newChild.width = this.renderer.chart.gameType.notefieldWidth + 128
    newChild.height = this.isMeasureLine(beat) ? 4 : 1
    newChild.visible = true
    this.barlineMap.set(beat, newChild as Barline)
    return newChild as Barline
  }

  private getBarlineLabel(beat: number): BarlineLabel {
    if (this.barlineLabelMap.get(beat)) return this.barlineLabelMap.get(beat)!
    let newChild: Partial<BarlineLabel> | undefined
    for (let child of this.children) {
      if (child.type == "label" && child.deactivated) {
        child.deactivated = false
        newChild = child
        break
      }
    }
    if (!newChild) {
      newChild = new BitmapText("", measureNumbers) as BarlineLabel
      this.addChild(newChild as BarlineLabel)
    }
    newChild.type = "label"
    newChild.beat = beat
    newChild.deactivated = false
    newChild.marked = true
    newChild.anchor!.x = 1
    newChild.anchor!.y = 0.5 
    newChild.x = (this.renderer.chart.gameType.notefieldWidth + 128)/(-2)-16
    newChild.visible = true
    newChild.text = "" + beat/4
    this.barlineLabelMap.set(beat, newChild as BarlineLabel)
    return newChild as BarlineLabel
  }

  private isMeasureLine(beat: number): boolean {
    return beat % 4 == 0
  }
}