import { BitmapText, Container, Sprite, Texture } from "pixi.js"
import { EventHandler } from "../../util/EventHandler"
import { Options } from "../../util/Options"
import { destroyChildIf } from "../../util/Util"
import { EditMode } from "../ChartManager"
import { ChartRenderer } from "../ChartRenderer"

const MAX_POOL = 200

interface Barline extends Sprite {
  type: "barline"
  beat: number
  deactivated: boolean
  marked: boolean
  dirtyTime: number
}

interface BarlineLabel extends BitmapText {
  type: "label"
  beat: number
  deactivated: boolean
  marked: boolean
  dirtyTime: number
}

type BarlineObject = Barline | BarlineLabel

const measureNumbers = {
  fontName: "Main",
  fontSize: 20,
  fill: ["#ffffff"],
}

export class BarlineContainer extends Container {
  children: BarlineObject[] = []

  private renderer: ChartRenderer
  private barlineMap: Map<number, Barline> = new Map()
  private barlineLabelMap: Map<number, BarlineLabel> = new Map()

  constructor(renderer: ChartRenderer) {
    super()
    this.renderer = renderer
    const timeSig = () => {
      this.removeChildren()
      this.barlineMap.clear()
      this.barlineLabelMap.clear()
    }
    EventHandler.on("timeSigChanged", timeSig)
    this.on("destroyed", () => [EventHandler.off("timeSigChanged", timeSig)])
  }

  update(beat: number, fromBeat: number, toBeat: number) {
    this.visible =
      this.renderer.chartManager.getMode() != EditMode.Play ||
      !Options.play.hideBarlines

    //Reset mark of old objects
    this.children.forEach(child => (child.marked = false))

    fromBeat = Math.max(0, fromBeat)
    const td = this.renderer.chart.timingData
    const timeSigs = td.getTimingData("TIMESIGNATURES")
    let timeSig = td.getTimingEventAtBeat("TIMESIGNATURES", fromBeat)
    let timeSigIndex = timeSig
      ? timeSigs.findIndex(t => t.beat == timeSig!.beat)
      : -1
    let divisionLength = td.getDivisionLength(fromBeat)
    const distToDivision =
      (td.getDivisionOfMeasure(fromBeat) % 1) * divisionLength

    // now we are at a beat division
    let barBeat = Math.max(0, fromBeat - distToDivision)
    let divNumber = Math.round(td.getDivisionOfMeasure(barBeat))
    // console.log("starting at " + barBeat, " div number " + divNumber)

    let divisionsPerMeasure = timeSig?.upper ?? 4

    const endLoop = () => {
      divNumber++
      divNumber %= divisionsPerMeasure
      // go to next beat
      barBeat += divisionLength
      // have we new time sig ???
      if (barBeat >= timeSigs[timeSigIndex + 1]?.beat) {
        // console.log("new time sig")
        timeSigIndex++
        // go to start of new sig
        timeSig = timeSigs[timeSigIndex]
        barBeat = timeSig.beat
        divisionLength = td.getDivisionLength(barBeat)
        divNumber = 0
        divisionsPerMeasure = timeSig.upper
      }
    }

    while (barBeat < toBeat) {
      if (this.barlineMap.size > MAX_POOL) break
      if (Options.chart.CMod && this.renderer.chart.isBeatWarped(barBeat)) {
        endLoop()
        continue
      }
      const [outOfBounds, endSearch, yPos] = this.checkBounds(barBeat, beat)
      if (endSearch) break
      if (outOfBounds) {
        endLoop()
        continue
      }

      //Move element
      const barline = this.getBarline(
        barBeat,
        divNumber % divisionsPerMeasure == 0
      )
      barline.y = yPos
      barline.marked = true
      barline.deactivated = false
      barline.dirtyTime = Date.now()
      if (divNumber % divisionsPerMeasure == 0) {
        const barlineLabel = this.getBarlineLabel(barBeat)
        barlineLabel.y = yPos
        barlineLabel.marked = true
        barlineLabel.deactivated = false
        barlineLabel.dirtyTime = Date.now()
        barlineLabel.scale.y = Options.chart.reverse ? -1 : 1
      }
      endLoop()
    }

    // console.log(this.children.map(child=>child.beat + " (" + child.type + ") => " + (Date.now() - child.dirtyTime)).join("\n"))

    //Remove old elements
    this.children
      .filter(child => !child.deactivated && !child.marked)
      .forEach(child => {
        child.deactivated = true
        child.visible = false
        if (child.type == "barline") this.barlineMap.delete(child.beat)
        if (child.type == "label") this.barlineLabelMap.delete(child.beat)
      })

    destroyChildIf(this.children, child => Date.now() - child.dirtyTime > 5000)
  }

  private checkBounds(
    bar_beat: number,
    beat: number
  ): [boolean, boolean, number] {
    const y = this.renderer.getYPos(bar_beat)
    if (y < this.renderer.getUpperBound()) return [true, false, y]
    if (y > this.renderer.getLowerBound()) {
      if (bar_beat < beat || this.renderer.isNegScroll(bar_beat))
        return [true, false, y]
      else return [true, true, y]
    }
    return [false, false, y]
  }

  private getBarline(beat: number, isMeasure: boolean): Barline {
    if (this.barlineMap.get(beat)) return this.barlineMap.get(beat)!
    let newChild: Partial<Barline> | undefined
    for (const child of this.children) {
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
    newChild.height = isMeasure ? 4 : 1
    newChild.visible = true
    this.barlineMap.set(beat, newChild as Barline)
    return newChild as Barline
  }

  private getBarlineLabel(beat: number): BarlineLabel {
    if (this.barlineLabelMap.get(beat)) return this.barlineLabelMap.get(beat)!
    let newChild: Partial<BarlineLabel> | undefined
    for (const child of this.children) {
      if (child.type == "label" && child.deactivated) {
        newChild = child
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
    newChild.x = (this.renderer.chart.gameType.notefieldWidth + 128) / -2 - 16
    newChild.visible = true
    newChild.text = `${Math.round(
      this.renderer.chart.timingData.getMeasure(beat)
    )}`
    this.barlineLabelMap.set(beat, newChild as BarlineLabel)
    return newChild as BarlineLabel
  }
}
