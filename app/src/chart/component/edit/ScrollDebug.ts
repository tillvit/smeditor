import { BitmapText, Container, Sprite, Texture } from "pixi.js"
import { roundDigit } from "../../../util/Math"
import { Options } from "../../../util/Options"
import { ChartRenderer, ChartRendererComponent } from "../../ChartRenderer"
import { ScrollTimingEvent } from "../../sm/TimingTypes"

interface ScrollDebugItem extends Container {
  marked: boolean
  box: Sprite
  text: BitmapText
}

export class ScrollDebug extends Container implements ChartRendererComponent {
  private renderer: ChartRenderer

  private scrollMap: Map<ScrollTimingEvent, ScrollDebugItem> = new Map()
  private receptors

  private topBound
  private bottomBound

  private topBoundBeat
  private bottomBoundBeat

  private topScreenBeat
  private bottomScreenBeat

  private topScreenBeatText
  private bottomScreenBeatText

  children: Container[] = []

  constructor(renderer: ChartRenderer) {
    super()
    this.visible = false
    this.renderer = renderer
    this.receptors = this.createBar(0x7777ff)
    this.receptors.width = 300
    this.addChild(this.receptors)

    this.topBound = this.createBar(0xff0000)
    this.addChild(this.topBound)

    this.bottomBound = this.createBar(0xff0000)
    this.addChild(this.bottomBound)

    this.topBoundBeat = this.createBar(0xffff88)
    this.addChild(this.topBoundBeat)

    this.bottomBoundBeat = this.createBar(0x88ffff)
    this.addChild(this.bottomBoundBeat)

    this.topScreenBeat = this.createBar(0xff88ff)
    this.topScreenBeat.width = 300
    this.addChild(this.topScreenBeat)

    this.topScreenBeatText = new BitmapText("", {
      fontName: "Fancy",
      fontSize: 50,
    })
    this.topScreenBeatText.anchor.x = 0.5
    this.topScreenBeatText.anchor.y = 0.5
    this.topScreenBeatText.tint = 0xff88ff
    this.addChild(this.topScreenBeatText)

    this.bottomScreenBeat = this.createBar(0xff33ff)
    this.bottomScreenBeat.width = 300
    this.addChild(this.bottomScreenBeat)

    this.bottomScreenBeatText = new BitmapText("", {
      fontName: "Fancy",
      fontSize: 50,
    })
    this.bottomScreenBeatText.anchor.x = 0.5
    this.bottomScreenBeatText.anchor.y = 0.5
    this.bottomScreenBeatText.tint = 0xff33ff
    this.addChild(this.bottomScreenBeatText)

    this.scale.x = 0.4
    this.scale.y = 0.4
  }

  createBar(tint: number) {
    const bar = new Sprite(Texture.WHITE)
    Object.assign(bar, {
      width: 750,
      height: 15,
      tint,
      opacity: 0.5,
    })
    bar.anchor.set(0.5)
    return bar
  }

  update() {
    this.visible = Options.debug.showScroll
    if (!this.visible) return

    const scrolls = this.renderer.chart.timingData.getTimingData("SCROLLS")

    this.x = this.renderer.chartManager.app.STAGE_WIDTH / 4

    for (const box of this.scrollMap.values()) {
      box.marked = false
    }

    for (const scroll of scrolls) {
      if (scroll == scrolls.at(-1)) continue
      if (this.scrollMap.has(scroll)) {
        this.scrollMap.get(scroll)!.marked = true
        continue
      }
      const cont = new Container() as ScrollDebugItem
      const box = new Sprite(Texture.WHITE)
      const text = new BitmapText("", {
        fontName: "Main",
        fontSize: 25,
      })
      box.alpha = 0.2
      box.width = 150
      box.anchor.x = 0.5
      text.anchor.x = 0.5
      cont.text = text
      cont.marked = true
      cont.box = box
      this.scrollMap.set(scroll, cont)
      cont.addChild(box, text)
      this.addChild(cont)
    }

    const beat = this.renderer.chartManager.beat

    for (let i = 0; i < scrolls.length - 1; i++) {
      let scrollStartY = this.renderer.getYPosFromBeat(scrolls[i].beat)
      let scrollEndY = this.renderer.getYPosFromBeat(scrolls[i + 1].beat)
      const box = this.scrollMap.get(scrolls[i])!

      if (
        !this.inBounds(scrollEndY) &&
        !this.inBounds(scrollStartY) &&
        scrollStartY * scrollEndY >= 0
      ) {
        box.visible = false
        continue
      }

      if (
        Math.abs(scrolls[i].beat - beat) > 20 &&
        Math.abs(scrolls[i + 1].beat - beat) > 20 &&
        !(beat > scrolls[i].beat && beat < scrolls[i + 1].beat)
      ) {
        box.visible = false
        continue
      }

      box.text.text = `yStart:${roundDigit(scrollStartY, 1)}\nyEnd:${roundDigit(
        scrollEndY,
        1
      )}\nval:${scrolls[i].value}\nh:${roundDigit(
        scrollEndY - scrollStartY,
        1
      )}`
      if (scrollEndY < scrollStartY)
        [scrollStartY, scrollEndY] = [scrollEndY, scrollStartY]

      box.visible = true

      box.y = scrollStartY
      box.box.height = scrollEndY - scrollStartY
      box.box.tint = 0xffffff
      box.text.tint = 0xffffff

      if (beat > scrolls[i].beat && beat < scrolls[i + 1].beat) {
        box.text.y = Math.max(
          this.renderer.getActualReceptorYPos() - scrollStartY,
          0
        )
        box.box.tint = 0x88ff88
      }
      if (beat < scrolls[i].beat) box.text.y = 0
      if (beat > scrolls[i + 1].beat) box.text.y = box.box.height
      box.x = ((i % 4) - 1.5) * 150
    }

    for (const [scroll, item] of this.scrollMap.entries()) {
      if (!item.marked) {
        this.scrollMap.delete(scroll)
        item.destroy()
        continue
      }
    }

    const topScroll = this.renderer.findFirstOnScreenScroll()
    const bottomScroll = this.renderer.findLastOnScreenScroll()

    {
      const c = this.scrollMap.get(topScroll)
      if (c) {
        c.text.text += "\nstart"
        if (c.box.tint == 0xffffff) c.box.tint = 0xffff88
        c.text.tint = 0xffff88
      }
    }
    {
      const c = this.scrollMap.get(bottomScroll)
      if (c) {
        c.text.text += "\nend"
        if (c.box.tint == 0xffffff) c.box.tint = 0x88ffff
        c.text.tint = 0x88ffff
      }
    }

    this.receptors.y = this.renderer.getActualReceptorYPos()
    this.topBound.y = this.renderer.getUpperBound()
    this.bottomBound.y = this.renderer.getLowerBound()
    this.topBoundBeat.y = this.renderer.getYPosFromBeat(
      this.renderer.getVisualBeat() - Options.chart.maxDrawBeatsBack
    )
    this.bottomBoundBeat.y = this.renderer.getYPosFromBeat(
      this.renderer.getVisualBeat() + Options.chart.maxDrawBeats
    )
    this.topScreenBeat.y = this.renderer.getYPosFromBeat(
      this.renderer.getTopOnScreenBeat()
    )
    this.bottomScreenBeat.y = this.renderer.getYPosFromBeat(
      this.renderer.getBottomOnScreenBeat()
    )
    this.topScreenBeatText.y = this.topScreenBeat.y
    this.topScreenBeatText.text =
      roundDigit(this.renderer.getTopOnScreenBeat(), 3) + ""
    this.bottomScreenBeatText.y = this.bottomScreenBeat.y
    this.bottomScreenBeatText.text =
      roundDigit(this.renderer.getBottomOnScreenBeat(), 3) + ""
  }

  inBounds(y: number) {
    const h = this.renderer.chartManager.app.STAGE_HEIGHT / this.scale.y
    return Math.abs(y) < h
  }
}
