import { BitmapText, Container, Sprite, Texture } from "pixi.js"
import { DisplayObjectPool } from "../../../util/DisplayObjectPool"
import { EventHandler } from "../../../util/EventHandler"
import { Options } from "../../../util/Options"
import { ChartRenderer, ChartRendererComponent } from "../../ChartRenderer"

const measureNumbers = {
  fontName: "Main",
  fontSize: 20,
  fill: ["#ffffff"],
}
export class BarlineContainer
  extends Container
  implements ChartRendererComponent
{
  private renderer: ChartRenderer
  private barlineMap: Map<number, Sprite> = new Map()
  private barlineLabelMap: Map<number, BitmapText> = new Map()
  private barlinePool = new DisplayObjectPool({
    create: () => new Sprite(Texture.WHITE),
  })
  private barlineLabelPool = new DisplayObjectPool({
    create: () => new BitmapText("", measureNumbers),
  })

  constructor(renderer: ChartRenderer) {
    super()
    this.renderer = renderer

    const timeSig = () => {
      this.barlineMap.clear()
      this.barlineLabelMap.clear()
      this.barlinePool.destroyAll()
      this.barlineLabelPool.destroyAll()
    }
    EventHandler.on("timeSigChanged", timeSig)
    this.on("destroyed", () => EventHandler.off("timeSigChanged", timeSig))

    this.addChild(this.barlinePool, this.barlineLabelPool)
  }

  update(fromBeat: number, toBeat: number) {
    this.visible = this.renderer.shouldDisplayBarlines()

    for (const [barBeat, isMeasure] of this.getBarlineBeats(fromBeat, toBeat)) {
      // Create missing barlines
      if (!this.barlineMap.has(barBeat)) {
        const barline = this.barlinePool.createChild()
        if (!barline) continue
        Object.assign(barline, {
          width: this.renderer.chart.gameType.notefieldWidth + 128,
          height: isMeasure ? 4 : 1,
          visible: true,
        })
        barline.anchor.set(0.5)
        this.barlineMap.set(barBeat, barline)
      }
      if (isMeasure && !this.barlineLabelMap.has(barBeat)) {
        const label = this.barlineLabelPool.createChild()
        if (!label) continue
        Object.assign(label, {
          x: (this.renderer.chart.gameType.notefieldWidth + 128) / -2 - 16,
          text: `${Math.round(
            this.renderer.chart.timingData.getMeasure(barBeat)
          )}`,
          visible: true,
        })
        label.anchor.set(1, 0.5)
        this.barlineLabelMap.set(barBeat, label)
      }
    }

    for (const [beat, child] of this.barlineMap.entries()) {
      if (beat < fromBeat || beat > toBeat) {
        this.barlineMap.delete(beat)
        this.barlinePool.destroyChild(child)
        continue
      }
      child.y = this.renderer.getYPosFromBeat(beat)
    }

    for (const [beat, child] of this.barlineLabelMap.entries()) {
      if (beat < fromBeat || beat > toBeat) {
        this.barlineLabelMap.delete(beat)
        this.barlineLabelPool.destroyChild(child)
        continue
      }
      child.y = this.renderer.getYPosFromBeat(beat)
    }
  }

  private *getBarlineBeats(
    fromBeat: number,
    toBeat: number
  ): Generator<[number, boolean], void> {
    fromBeat = Math.max(0, fromBeat)
    const td = this.renderer.chart.timingData
    const timeSigs = td.getTimingData("TIMESIGNATURES")
    let currentTimeSig = td.getEventAtBeat("TIMESIGNATURES", fromBeat)
    let timeSigIndex = currentTimeSig
      ? timeSigs.findIndex(t => t.beat == currentTimeSig!.beat)
      : -1
    let divisionLength = td.getDivisionLength(fromBeat)
    const beatsToNearestDivision =
      (td.getDivisionOfMeasure(fromBeat) % 1) * divisionLength

    // Find the nearest beat division
    let beat = Math.max(0, fromBeat - beatsToNearestDivision)
    if (beat < fromBeat) beat += divisionLength
    let divisionNumber = Math.round(td.getDivisionOfMeasure(beat))

    let divisionsPerMeasure = currentTimeSig?.upper ?? 4
    while (beat < toBeat) {
      // Don't display warped beats
      if (!Options.chart.CMod || !this.renderer.chart.isBeatWarped(beat)) {
        yield [beat, divisionNumber % divisionsPerMeasure == 0]
      }
      divisionNumber++
      divisionNumber %= divisionsPerMeasure
      // Go to the next division
      beat += divisionLength
      // Check if we have reached the next time signature
      if (beat >= timeSigs[timeSigIndex + 1]?.beat) {
        timeSigIndex++
        // Go to start of the new time signature
        currentTimeSig = timeSigs[timeSigIndex]
        beat = currentTimeSig.beat
        divisionLength = td.getDivisionLength(beat)
        divisionNumber = 0
        divisionsPerMeasure = currentTimeSig.upper
      }
    }
  }
}
