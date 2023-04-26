import {
  BitmapText,
  Container,
  FederatedMouseEvent,
  Point,
  Sprite,
  Texture,
} from "pixi.js"
import { TimingEventPopup } from "../../gui/popup/TimingEventPopup"
import { BetterRoundedRect } from "../../util/BetterRoundedRect"
import { Options } from "../../util/Options"
import { destroyChildIf, lighten, roundDigit } from "../../util/Util"
import { EditMode, EditTimingMode } from "../ChartManager"
import { ChartRenderer } from "../ChartRenderer"
import { TimingEvent, TimingEventProperty } from "../sm/TimingTypes"
import { TIMING_EVENT_COLORS } from "./TimingAreaContainer"

export interface TimingBox extends Container {
  event: TimingEvent
  songTiming: boolean
  deactivated: boolean
  marked: boolean
  dirtyTime: number
  backgroundObj: BetterRoundedRect
  selection: BetterRoundedRect
  textObj: BitmapText
  guideLine?: Sprite
  targetX?: number
  targetAnchor?: number
  popup?: TimingEventPopup
  widthCache: number
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

export const timingNumbers = {
  fontName: "Main",
  fontSize: 15,
}

export const TIMING_TRACK_WIDTHS: { [key: string]: number } = {
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

  private ghostBox?: TimingBox

  constructor(renderer: ChartRenderer) {
    super()
    this.renderer = renderer
    this.boxes.sortableChildren = true
    this.sortableChildren = true
    this.addChild(this.tracks)
    this.addChild(this.boxes)
  }

  update(beat: number, fromBeat: number, toBeat: number) {
    if (this.renderer.chartManager.editTimingMode != EditTimingMode.Add) {
      this.ghostBox?.removeFromParent()
      this.ghostBox?.destroy()
      this.ghostBox = undefined
    }

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
      this.renderer.chartManager.editTimingMode != EditTimingMode.Off &&
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
      const timingWidth = timingBox.widthCache

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
        if (!timingBox.targetAnchor) timingBox.pivot.x = 0
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
        if (side == "left") currentRow.leftOffset += timingWidth + 5
        if (side == "right") currentRow.rightOffset += timingWidth + 5
        currentRow.beat = event.beat!
        currentRow.second = event.second!
        if (!timingBox.targetAnchor)
          timingBox.pivot.x =
            side == "right" ? -timingWidth / 2 : timingWidth / 2
        timingBox.targetAnchor = side == "right" ? 0 : 1
      }

      timingBox.position.x =
        (timingBox.targetX - timingBox.position.x) * 0.2 + timingBox.position.x
      timingBox.pivot.x =
        ((timingBox.targetAnchor - 0.5) * timingWidth - timingBox.pivot.x) *
          0.2 +
        timingBox.pivot.x
      timingBox.backgroundObj.position.x = -timingWidth / 2
      timingBox.backgroundObj.position.y = -25 / 2
      timingBox.y = yPos
      timingBox.marked = true
      timingBox.dirtyTime = Date.now()

      timingBox.selection.position = timingBox.backgroundObj.position
      timingBox.textObj.scale.y = Options.chart.reverse ? -1 : 1

      const inSelection =
        this.renderer.chartManager.getMode() != EditMode.Play &&
        (this.renderer.chartManager.eventSelection.timingEvents.includes(
          timingBox.event
        ) ||
          this.renderer.chartManager.eventSelection.inProgressTimingEvents.includes(
            timingBox.event
          ))
      timingBox.backgroundObj.tint = inSelection
        ? lighten(
            TIMING_EVENT_COLORS[event.type] ?? 0x000000,
            Math.sin(Date.now() / 320) * 0.4 + 1.5
          )
        : TIMING_EVENT_COLORS[event.type] ?? 0x000000
      timingBox.selection.alpha = inSelection ? 1 : 0
      timingBox.visible =
        !inSelection || !this.renderer.chartManager.eventSelection.shift
      if (this.renderer.chartManager.editTimingMode != EditTimingMode.Off) {
        const inSelectionBounds = this.renderer.selectionTest(timingBox)
        if (!inSelection && inSelectionBounds) {
          this.renderer.chartManager.addEventToDragSelection(timingBox.event)
        }
        if (inSelection && !inSelectionBounds) {
          this.renderer.chartManager.removeEventFromDragSelection(
            timingBox.event
          )
        }
      }
    }

    //Remove old elements
    this.boxes.children
      .filter(child => !child.deactivated && !child.marked)
      .forEach(child => {
        child.deactivated = true
        child.visible = false
        if (child.popup?.persistent) child.popup.detach()
        else child.popup?.close()
        child.popup = undefined
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
      newChild.selection = new BetterRoundedRect("onlyBorder")
      newChild.selection.tint = 0x3a9bf0
      newChild.addChild!(newChild.backgroundObj)
      newChild.addChild!(newChild.textObj)
      newChild.addChild!(newChild.selection)
      this.boxes.addChild(newChild as TimingBox)
    }
    newChild.event = event
    newChild.deactivated = false
    newChild.songTiming = this.renderer.chart.timingData.isTypeChartSpecific(
      event.type
    )
    newChild.marked = true
    newChild.visible = true
    newChild.targetX = undefined
    newChild.targetAnchor = undefined
    newChild.textObj!.text = this.getLabelFromEvent(event)
    newChild.textObj!.anchor.x = 0.5
    newChild.textObj!.anchor.y = 0.55 //???
    newChild.backgroundObj!.width = newChild.textObj!.width + 10
    newChild.widthCache = newChild.backgroundObj!.width
    newChild.backgroundObj!.height = 25
    newChild.selection!.width = newChild.textObj!.width + 10
    newChild.selection!.height = 25
    newChild.zIndex = event.beat
    newChild.interactive = true
    if (newChild?.popup?.persistent !== true) newChild.popup?.close()
    newChild.popup = undefined
    newChild.removeAllListeners!()
    newChild.on!("mouseenter", () => {
      if (newChild?.popup?.persistent === true) return
      if (this.renderer.chartManager.eventSelection.timingEvents.length > 0)
        return
      if (this.renderer.isDragSelecting()) return

      newChild!.popup?.close()
      if (this.renderer.chartManager.getMode() == EditMode.Edit) {
        new TimingEventPopup(
          newChild as TimingBox,
          this.renderer.chart.timingData
        )
        newChild!.popup!.onConfirm = () => {
          this.renderer.chartManager.removeEventFromSelection(newChild!.event!)
        }
      }
    })
    newChild.on!("mouseleave", () => {
      if (newChild?.popup?.persistent === true) return
      newChild!.popup?.close()
    })
    newChild.on!("destroyed", () => {
      newChild!.removeAllListeners!()
    })
    let initalPosY = 0
    let movedEvent: TimingEvent | undefined

    const moveHandler = (event: FederatedMouseEvent) => {
      const timingEvent = movedEvent!
      const position = this.toLocal(event.global)
      if (Math.abs(position.y - initalPosY) < 32) {
        if (this.renderer.chartManager.eventSelection.shift) {
          this.renderer.chartManager.eventSelection.shift = {
            beatShift: 0,
          }
        }
        return
      }
      newChild?.popup?.close()
      const newBeat = this.renderer.getBeatFromYPos(position.y)
      const snap = Options.chart.snap == 0 ? 1 / 1000 : Options.chart.snap
      let snapBeat = Math.round(newBeat / snap) * snap
      if (
        Math.abs(snapBeat - newBeat) > Math.abs(newBeat - timingEvent.beat!)
      ) {
        snapBeat = timingEvent.beat!
      }
      this.renderer.chartManager.eventSelection.shift ||= {
        beatShift: 0,
      }
      this.renderer.chartManager.eventSelection.shift.beatShift = Math.max(
        -Math.min(
          ...this.renderer.chartManager.eventSelection.timingEvents.map(
            event => event.beat!
          )
        ),
        snapBeat - timingEvent.beat!
      )
    }
    newChild.on!("mousedown", event => {
      event.stopImmediatePropagation()
      if (
        this.renderer.chartManager.eventSelection.timingEvents.includes(
          newChild!.event!
        )
      ) {
        if (event.getModifierState("Control") || event.getModifierState("Meta"))
          this.renderer.chartManager.removeEventFromSelection(newChild!.event!)
      } else {
        if (
          !event.getModifierState("Control") &&
          !event.getModifierState("Meta") &&
          !event.getModifierState("Shift")
        )
          this.renderer.chartManager.clearSelections()
        this.renderer.chartManager.addEventToSelection(newChild!.event!)
      }
      if (
        this.renderer.chartManager.getMode() == EditMode.Edit &&
        this.renderer.chartManager.eventSelection.timingEvents.length == 1
      ) {
        if (!newChild?.popup) {
          TimingEventPopup.activePopup?.close()
          new TimingEventPopup(
            newChild as TimingBox,
            this.renderer.chart.timingData
          )
          newChild!.popup!.onConfirm = () => {
            this.renderer.chartManager.removeEventFromSelection(
              newChild!.event!
            )
          }
        }
      }
      if (
        newChild!.popup &&
        !event.getModifierState("Control") &&
        !event.getModifierState("Meta") &&
        !event.getModifierState("Shift")
      )
        newChild!.popup.select()
      else newChild!.popup?.close()
      initalPosY = newChild!.y!
      movedEvent = newChild!.event!
      if (this.renderer.chartManager.editTimingMode == EditTimingMode.Add)
        return
      this.renderer.on("mousemove", moveHandler)
      const mouseUp = () => {
        this.renderer.off("mousemove", moveHandler)
        this.renderer.off("mouseup", mouseUp)
        if (
          (this.renderer.chartManager.eventSelection.shift?.beatShift ?? 0) != 0
        )
          this.renderer.chartManager.modifyEventSelection(event => {
            if (event.type == "ATTACKS") {
              event.second = this.renderer.chart.timingData.getSecondsFromBeat(
                event.beat! +
                  this.renderer.chartManager.eventSelection.shift!.beatShift
              )
            }
            event.beat! +=
              this.renderer.chartManager.eventSelection.shift!.beatShift
            return event
          })
        this.renderer.chartManager.eventSelection.shift = undefined
      }
      this.renderer.on("mouseup", mouseUp)
    })
    this.timingBoxMap.set(event, newChild as TimingBox)
    return newChild as TimingBox
  }

  setGhostEvent(pos: Point) {
    const snap = Options.chart.snap == 0 ? 1 / 1000 : Options.chart.snap
    const snapBeat =
      Math.round(this.renderer.getBeatFromYPos(pos.y) / snap) * snap
    const type = this.ghostBox?.popup
      ? this.ghostBox.event.type
      : this.getClosestTrack(pos.x)?.name
    if (!type) {
      this.ghostBox?.removeFromParent()
      this.ghostBox?.destroy()
      this.ghostBox = undefined
      return
    }
    if (!this.ghostBox) {
      const newChild: Partial<TimingBox> | undefined =
        new Container() as TimingBox
      newChild.zIndex = -1
      newChild.guideLine = new Sprite(Texture.WHITE)
      newChild.textObj = new BitmapText("", timingNumbers)
      newChild.backgroundObj = new BetterRoundedRect()
      newChild.selection = new BetterRoundedRect("onlyBorder")
      newChild.selection.tint = 0x0f3d4b
      newChild.selection.alpha = 0
      newChild.addChild!(newChild.guideLine)
      newChild.addChild!(newChild.backgroundObj)
      newChild.addChild!(newChild.textObj)
      newChild.addChild!(newChild.selection)
      this.addChild(newChild as TimingBox)
      newChild.deactivated = false
      newChild.marked = true
      newChild.visible = true
      newChild.targetX = undefined
      newChild.targetAnchor = undefined
      newChild.textObj.anchor.x = 0.5
      newChild.textObj.anchor.y = 0.55
      newChild.backgroundObj.height = 25
      newChild.selection.height = 25
      newChild.guideLine.height = 1
      newChild.guideLine.anchor.y = 0.5
      newChild.interactive = true
      newChild.popup = undefined

      newChild.on!("destroyed", () => {
        newChild.removeAllListeners!()
      })
      this.ghostBox = newChild as TimingBox
    }
    if (
      !this.ghostBox?.popup &&
      (this.ghostBox.event?.beat != snapBeat ||
        this.ghostBox.event?.type != type)
    ) {
      this.ghostBox.event =
        structuredClone(
          this.renderer.chart.timingData.getTimingEventAtBeat(
            type as TimingEventProperty,
            snapBeat
          )
        ) ??
        this.renderer.chart.timingData.getDefaultEvent(
          type as TimingEventProperty,
          snapBeat
        )
      this.ghostBox.event.beat = snapBeat
      this.ghostBox.textObj.text = this.getLabelFromEvent(this.ghostBox.event)
      this.ghostBox.backgroundObj.width = this.ghostBox.textObj.width + 10
      this.ghostBox.selection.width = this.ghostBox.textObj.width + 10
    }
    this.ghostBox.alpha = this.ghostBox?.popup ? 1 : 0.4
    this.ghostBox.selection.alpha = this.ghostBox?.popup ? 1 : 0

    this.ghostBox.name = type

    const yPos = this.renderer.getYPos(
      this.ghostBox?.popup ? this.ghostBox.event.beat! : snapBeat
    )

    let targetX = this.tracks.getChildByName<TimingTrack>(type)!.x
    targetX += (TIMING_TRACK_WIDTHS[type] / 2) * (targetX > 0 ? 1 : -1)
    this.ghostBox.position.x = targetX
    this.ghostBox.backgroundObj.tint = TIMING_EVENT_COLORS[type] ?? 0x000000
    this.ghostBox.backgroundObj.position.x =
      -this.ghostBox.backgroundObj.width / 2
    this.ghostBox.backgroundObj.position.y = -25 / 2
    this.ghostBox.guideLine!.anchor.x = targetX < 0 ? 0 : 1
    this.ghostBox.guideLine!.width =
      Math.abs(this.ghostBox.position.x) +
      192 -
      this.ghostBox.backgroundObj.width / 2
    this.ghostBox.guideLine!.position.x =
      ((targetX < 0 ? 1 : -1) * this.ghostBox.backgroundObj.width) / 2
    this.ghostBox.y = yPos

    this.ghostBox.selection.position = this.ghostBox.backgroundObj.position
    this.ghostBox.textObj.scale.y = Options.chart.reverse ? -1 : 1
  }

  placeGhostEvent() {
    if (!this.ghostBox) return
    this.renderer.chartManager.clearSelections()
    this.ghostBox.songTiming =
      this.renderer.chart.timingData.isTypeChartSpecific(
        this.ghostBox.event.type
      )
    new TimingEventPopup(this.ghostBox, this.renderer.chart.timingData, true)
    this.ghostBox.popup?.select()
    this.ghostBox.popup!.onConfirm = event => {
      this.renderer.chart.timingData.insert(
        this.ghostBox!.songTiming,
        event.type,
        event,
        event.beat
      )
    }
  }

  getClosestTrack(x: number) {
    let leastDist = Number.MAX_SAFE_INTEGER
    let best = this.tracks.children[0]
    for (const track of this.tracks.children) {
      const dist = Math.abs(track.x + (0.5 - track.anchor.x) * track.width - x)
      if (dist < leastDist) {
        best = track
        leastDist = dist
      }
    }
    if (leastDist > best.width) return undefined
    return best
  }

  getLabelFromEvent(event: TimingEvent) {
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
        label = `${event.mods}`
    }
    return label
  }
}
