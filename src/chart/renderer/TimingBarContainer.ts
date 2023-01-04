import { BitmapText, Container, Graphics, Sprite, Texture } from "pixi.js"
import { Options } from "../../util/Options"
import { clamp } from "../../util/Util"
import { EditMode } from "../ChartManager"
import { ChartRenderer } from "../ChartRenderer"
import { TimingWindow } from "../play/TimingWindow"
import { isStandardMissTimingWindow, isStandardTimingWindow } from "../play/TimingWindowCollection"

interface TimingBarObject extends Sprite {
  createTime: number,
}

const BAR_WIDTH = 1
const BAR_HEIGHT = 15

const errorStyle = {
  fontName: "Assistant",
  fontSize: 12,
  fill: ['#ffffff']
}

export class TimingBarContainer extends Container {

  private barlines: Container = new Container()
  private barline: Sprite
  private currentMedian: Graphics
  private errorText: BitmapText = new BitmapText("", errorStyle)
  private errorTextTime: number = -1
  private renderer: ChartRenderer
  private data: number[] = []

  constructor(renderer: ChartRenderer) {
    super()
    this.y = 10
    this.renderer = renderer
    this.barline = new Sprite(Texture.WHITE)
    this.barline.anchor.set(0.5)
    this.barline.height = 1
    this.barline.alpha = 0.5
    let target = new Sprite(Texture.WHITE)
    target.width = 2
    target.height = BAR_HEIGHT
    target.anchor.set(0.5)
    target.alpha = 0.5
    this.currentMedian = new Graphics()
    this.currentMedian.beginFill(0xffffff);
    this.currentMedian.moveTo(0, -10);
    this.currentMedian.lineTo(5, -15);
    this.currentMedian.lineTo(-5, -15);
    this.currentMedian.lineTo(0, -10);		
    this.errorText.y = -25
    this.errorText.anchor.set(0.5)
    this.addChild(this.barline)
    this.addChild(target)
    this.addChild(this.barlines)
    this.addChild(this.currentMedian)
    this.addChild(this.errorText)
  }

  renderThis() {
    this.visible = this.renderer.chartManager.getMode() == EditMode.Play
    for (let child of this.barlines.children) { 
      let barline = child as TimingBarObject
      let t = (8000 - (Date.now() - barline.createTime))/6000
      child.alpha = Math.min(1, t)
    }
    this.errorText.alpha = clamp((2000 - (Date.now() - this.errorTextTime))/1000, 0, 1)
    this.barline.width = Options.play.timingCollection.maxWindowMS()/1000*2*400
    this.barlines.children.filter(child => Date.now() - (child as TimingBarObject).createTime > 8000).forEach(child => {
      child.destroy()
      this.barlines.removeChild(child)
    })  
  }

  addBar(error: number, judge: TimingWindow) {
    if (!isStandardMissTimingWindow(judge) && !isStandardTimingWindow(judge)) return
    if (!isStandardMissTimingWindow(judge)) this.data.push(error)
    if (this.data.length > 30) this.data.splice(0, 1)
    let bar = new Sprite(Texture.WHITE) as TimingBarObject
    bar.width = BAR_WIDTH
    bar.height = BAR_HEIGHT
    bar.anchor.set(0.5)
    bar.x = error*400
    bar.tint = judge.color
    bar.createTime = Date.now()
    this.errorText.tint = judge.color
    this.errorText.text = (error*1000).toFixed(1) + "ms"
    this.errorTextTime = Date.now()
    this.barlines.addChild(bar)
    this.currentMedian.x = this.getMedian()*400
  }

  private getMedian() {
    let dat = [...this.data]
    if (dat.length == 0) return 0
    dat.sort((a, b) => a - b)

    let half = Math.floor(dat.length / 2)
    if (dat.length % 2) return dat[half]
    return (dat[half - 1] + dat[half]) / 2
  }

  reset() {
    this.data = []
    this.currentMedian.x = 0
  }
}