import { BitmapText, Container, Sprite, Texture } from "pixi.js"
import { BetterRoundedRect } from "../../util/BetterRoundedRect"
import { Options } from "../../util/Options"
import { destroyChildIf, roundDigit } from "../../util/Util"
import { EditMode } from "../ChartManager"
import { ChartRenderer } from "../ChartRenderer"
import { TimingEvent } from "../sm/TimingTypes"
import { TIMING_EVENT_COLORS } from "./TimingAreaContainer"

interface TimingBox extends Container {
  event: TimingEvent
  deactivated: boolean
  marked: boolean
  dirtyTime: number
  backgroundObj: BetterRoundedRect
  textObj: BitmapText
  targetX?: number
  targetAnchor?: number
}

interface TimingTrack extends Sprite {
  targetX: number
  targetAlpha: number
}

interface TimingRow {
  beat: number
  second: number
  leftOffset: number
  rightOffset: number
}

const timingNumbers = {
  fontName: "Main",
  fontSize: 15,
}

const TIMING_TRACK_WIDTHS: { [key: string]: number } = {
  BPMS: 55,
  STOPS: 55,
  DELAYS: 55,
  WARPS: 55,
  FAKES: 55,
  COMBOS: 40,
  SPEEDS: 80,
  LABELS: 80,
  SCROLLS: 55,
  TIMESIGNATURES: 40,
  TICKCOUNTS: 40,
  BGCHANGES: 55,
  FGCHANGES: 55,
  ATTACKS: 55,
}

export class TimingTrackContainer extends Container {
  private tracks = new Container<TimingTrack>()
  private boxes = new Container<TimingBox>()

  private renderer: ChartRenderer
  private timingBoxMap: Map<TimingEvent, TimingBox> = new Map()

  constructor(renderer: ChartRenderer) {
    super()
    this.renderer = renderer
    this.boxes.sortableChildren = true
    this.addChild(this.tracks)
    this.addChild(this.boxes)
  }

  renderThis(beat: number, fromBeat: number, toBeat: number) {
    this.boxes.visible =
      this.renderer.chartManager.getMode() != EditMode.Play ||
      !Options.play.hideBarlines

    const leftTypes = Options.chart.timingEventOrder.left
    const rightTypes = Options.chart.timingEventOrder.right

    for (const track of this.tracks.children) {
      track.targetAlpha = 0
    }
    let x = -this.renderer.chart.gameType.notefieldWidth * 0.5 - 128
    for (let i = leftTypes.length - 1; i >= 0; i--) {
      const type = leftTypes[i]
      let track = this.tracks.getChildByName<TimingTrack>(type)
      const exists = !!track
      if (!exists) {
        const newTrack = new Sprite(Texture.WHITE)
        newTrack.width = TIMING_TRACK_WIDTHS[type]
        newTrack.alpha = 0
        newTrack.name = type
        newTrack.height = 5000
        newTrack.anchor.y = 0.5
        track = newTrack as TimingTrack
        this.tracks.addChild(track)
      }
      track.targetX = x
      if (!exists) track.x = x
      track.targetAlpha = i % 2 == 0 ? 0.1 : 0
      track.anchor.x = 1
      track.tint = 0x263252
      x -= TIMING_TRACK_WIDTHS[type]
    }

    x = this.renderer.chart.gameType.notefieldWidth * 0.5 + 128
    for (let i = 0; i < rightTypes.length; i++) {
      const type = rightTypes[i]
      let track = this.tracks.getChildByName<TimingTrack>(type)
      const exists = !!track
      if (!exists) {
        const newTrack = new Sprite(Texture.WHITE)
        newTrack.width = TIMING_TRACK_WIDTHS[type]
        newTrack.alpha = 0
        newTrack.name = type
        newTrack.height = 5000
        newTrack.anchor.y = 0.5
        track = newTrack as TimingTrack
        this.tracks.addChild(track)
      }
      track.targetX = x
      if (!exists) track.x = x
      track.targetAlpha = i % 2 == 0 ? 0.1 : 0
      track.anchor.x = 0
      track.tint = 0x263252
      x += TIMING_TRACK_WIDTHS[type]
    }
    const editingTiming =
      this.renderer.chartManager.editingTiming &&
      this.renderer.chartManager.getMode() == EditMode.Edit
    for (const track of this.tracks.children) {
      if (!editingTiming) track.targetAlpha = 0
      track.alpha = (track.alpha - track.targetAlpha) * 0.2 + track.targetAlpha
      track.position.x =
        (track.position.x - track.targetX) * 0.2 + track.targetX
    }

    //Reset mark of old objects
    this.boxes.children.forEach(child => (child.marked = false))

    const currentRow: TimingRow | undefined = {
      beat: -1000,
      second: -1000,
      leftOffset: 0,
      rightOffset: 0,
    }
    for (const event of this.renderer.chart.timingData.getTimingData()) {
      if (toBeat < event.beat!) break
      if (
        !Options.chart.timingEventOrder.left.includes(event.type) &&
        !Options.chart.timingEventOrder.right.includes(event.type)
      )
        continue
      if (fromBeat > event.beat!) continue

      const [outOfBounds, endSearch, yPos] = this.checkBounds(event, beat)
      if (endSearch) break
      if (outOfBounds) continue

      const timingBox = this.getTimingBox(event)

      const side = Options.chart.timingEventOrder.right.includes(event.type)
        ? "right"
        : "left"
      if (editingTiming) {
        let targetX =
          this.tracks.getChildByName<TimingTrack>(event.type)?.x ?? timingBox.x
        targetX +=
          (TIMING_TRACK_WIDTHS[event.type] / 2) * (targetX > 0 ? 1 : -1)
        if (!timingBox.targetX) timingBox.position.x = targetX
        timingBox.targetX = targetX
        if (!timingBox.targetAnchor) timingBox.textObj.anchor.x = 0.5
        timingBox.targetAnchor = 0.5
      } else {
        let x =
          (side == "right" ? 1 : -1) *
          (this.renderer.chart.gameType.notefieldWidth * 0.5 + 80)
        if (side == "left") x -= 30
        if (
          currentRow.beat != event.beat ||
          (event.second && currentRow.second != event.second)
        ) {
          currentRow.leftOffset = 0
          currentRow.rightOffset = 0
        }
        if (side == "left") x -= currentRow.leftOffset
        if (side == "right") x += currentRow.rightOffset
        if (!timingBox.targetX) timingBox.position.x = x
        timingBox.targetX = x
        if (side == "left")
          currentRow.leftOffset += timingBox.textObj.width + 15
        if (side == "right")
          currentRow.rightOffset += timingBox.textObj.width + 15
        currentRow.beat = event.beat!
        currentRow.second = event.second!
        if (!timingBox.targetAnchor)
          timingBox.textObj.anchor.x = side == "right" ? 0 : 1
        timingBox.targetAnchor = side == "right" ? 0 : 1
      }
      timingBox.backgroundObj.tint = TIMING_EVENT_COLORS[event.type] ?? 0x000000
      timingBox.position.x =
        (timingBox.targetX - timingBox.position.x) * 0.2 + timingBox.position.x
      timingBox.textObj.anchor.x =
        (timingBox.targetAnchor - timingBox.textObj.anchor.x) * 0.2 +
        timingBox.textObj.anchor.x
      timingBox.backgroundObj.position.x =
        -5 - timingBox.textObj.width * timingBox.textObj.anchor.x
      timingBox.y = yPos
      timingBox.marked = true
      timingBox.dirtyTime = Date.now()

      timingBox.backgroundObj.position.y = Options.chart.reverse ? -14 : -11
      timingBox.textObj.scale.y = Options.chart.reverse ? -1 : 1
    }

    //Remove old elements
    this.boxes.children
      .filter(child => !child.deactivated && !child.marked)
      .forEach(child => {
        child.deactivated = true
        child.visible = false
        this.timingBoxMap.delete(child.event)
      })

    destroyChildIf(
      this.boxes.children,
      child => Date.now() - child.dirtyTime > 5000
    )
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

  private getTimingBox(event: TimingEvent): TimingBox {
    if (this.timingBoxMap.get(event)) return this.timingBoxMap.get(event)!
    let newChild: Partial<TimingBox> | undefined
    for (const child of this.boxes.children) {
      if (child.deactivated) {
        child.deactivated = false
        newChild = child
        break
      }
    }
    if (!newChild) {
      newChild = new Container() as TimingBox
      newChild.zIndex = event.beat
      newChild.textObj = new BitmapText("", timingNumbers)
      newChild.backgroundObj = new BetterRoundedRect()
      newChild.addChild!(newChild.backgroundObj)
      newChild.addChild!(newChild.textObj)
      this.boxes.addChild(newChild as TimingBox)
    }
    newChild.event = event
    newChild.deactivated = false
    newChild.marked = true
    newChild.visible = true
    newChild.targetX = undefined
    newChild.targetAnchor = undefined
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
    this.timingBoxMap.set(event, newChild as TimingBox)
    return newChild as TimingBox
  }
}
