import { BitmapText, Container } from "pixi.js"
import { BetterRoundedRect } from "../../../util/BetterRoundedRect"
import { DisplayObjectPool } from "../../../util/DisplayObjectPool"
import { EventHandler } from "../../../util/EventHandler"
import { Options } from "../../../util/Options"
import { ChartRenderer, ChartRendererComponent } from "../../ChartRenderer"
import { Cached, TimingEvent } from "../../sm/TimingTypes"
import { TECH_STRINGS } from "../../stats/parity/ParityDataTypes"
import { RowStacker } from "../RowStacker"

export interface TechBox extends Container {
  event: Cached<TimingEvent>
  backgroundObj: BetterRoundedRect
  textObj: BitmapText
}

// const TECH_COLORS: { [key: number]: number } = {
//   [TechCategory.Brackets]: 0x572e0b,
//   [TechCategory.Crossovers]: 0x4d121c,
//   [TechCategory.Doublesteps]: 0x0b260a,
//   [TechCategory.Footswitches]: 0x11124a,
//   [TechCategory.Holdswitch]: 0x054a39,
//   [TechCategory.Jacks]: 0x39083d,
//   [TechCategory.Sideswitches]: 0x4a4905,
// }

export class TechIndicators
  extends Container
  implements ChartRendererComponent
{
  private renderer: ChartRenderer
  private parityDirty = false

  private boxPool = new DisplayObjectPool({
    create: () => {
      const newChild = new Container() as TechBox
      newChild.textObj = new BitmapText("", {
        fontName: "Main",
        fontSize: 20,
      })
      // newChild.backgroundObj.tint = 0x000000
      newChild.addChild(newChild.textObj)
      return newChild
    },
  })

  private rowMap = new Map<number, TechBox[]>()

  children: Container[] = []

  constructor(renderer: ChartRenderer) {
    super()
    this.renderer = renderer

    this.addChild(this.boxPool)

    const parityChanged = () => {
      this.parityDirty = true
    }
    EventHandler.on("parityModified", parityChanged)
    this.on("destroyed", () =>
      EventHandler.off("parityModified", parityChanged)
    )
  }

  update(firstBeat: number, lastBeat: number) {
    const parity = this.renderer.chart.stats.parity
    if (
      !parity ||
      !Options.chart.parity.enabled ||
      !Options.chart.parity.showTech
    ) {
      this.visible = false
      return
    }
    this.visible = true
    if (this.parityDirty) {
      this.rowMap.clear()
      this.boxPool.destroyAll()
      this.parityDirty = false
    }

    this.boxPool.visible = this.renderer.shouldDisplayEditGUI()

    // Create all missing boxes
    for (let i = 0; i < parity.techRows.length; i++) {
      const position = parity.rowTimestamps[i]
      if (parity.techRows[i] === undefined) continue
      if (lastBeat < position.beat) break
      if (firstBeat > position.beat) continue

      if (!this.rowMap.has(i)) {
        const techs = parity.techRows[i]!.values().toArray().sort()
        const boxes = []
        for (const tech of techs) {
          const box = this.boxPool.createChild()
          if (!box) break
          RowStacker.instance.register(
            box,
            position.beat,
            position.second,
            "right",
            20 + tech
          )
          boxes.push(box)
          box.textObj.text = TECH_STRINGS[tech]
          box.textObj.anchor.set(0.5, 0.55)
          // box.backgroundObj.alpha = 0
          // box.backgroundObj.tint = TECH_COLORS[tech] || 0x000000
          // box.backgroundObj.width = box.textObj.width + 10
          // box.backgroundObj.height = 25
          // box.backgroundObj.position.x = -box.backgroundObj.width / 2
          // box.backgroundObj.position.y = -25 / 2
        }
        this.rowMap.set(i, boxes)
      }
    }

    for (const [i, boxes] of this.rowMap.entries()) {
      const position = parity.rowTimestamps[i]
      if (!position) continue
      if (position.beat < firstBeat || position.beat > lastBeat) {
        this.rowMap.delete(i)
        boxes.forEach(box => this.boxPool.destroyChild(box))
        continue
      }
    }
  }
}
