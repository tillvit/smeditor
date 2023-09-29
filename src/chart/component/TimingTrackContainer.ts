import bezier from "bezier-easing"
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
import { BezierAnimator } from "../../util/BezierEasing"
import { lighten } from "../../util/Color"
import { DisplayObjectPool } from "../../util/DisplayObjectPool"
import { EventHandler } from "../../util/EventHandler"
import { roundDigit } from "../../util/Math"
import { Options } from "../../util/Options"
import { isRightClick } from "../../util/Util"
import { EditMode, EditTimingMode } from "../ChartManager"
import { ChartRenderer, ChartRendererComponent } from "../ChartRenderer"
import { TimingEvent, TimingEventProperty } from "../sm/TimingTypes"
import { TIMING_EVENT_COLORS } from "./TimingAreaContainer"

export interface TimingBox extends Container {
  event: TimingEvent
  songTiming: boolean
  backgroundObj: BetterRoundedRect
  selection: BetterRoundedRect
  textObj: BitmapText
  guideLine?: Sprite
  lastX?: number
  lastAnchor?: number
  animationId?: string
  popup?: TimingEventPopup
}

interface TimingTrack extends Sprite {
  lastX: number
  targetAlpha: number
  type: string
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

export class TimingTrackContainer
  extends Container
  implements ChartRendererComponent
{
  private tracks = new Container<TimingTrack>()

  private renderer: ChartRenderer
  private timingBoxMap: Map<TimingEvent, TimingBox> = new Map()
  private wasEditingTiming = false

  private boxPool = new DisplayObjectPool({
    create: () => {
      const newChild = new Container() as TimingBox
      newChild.textObj = new BitmapText("", timingNumbers)
      newChild.backgroundObj = new BetterRoundedRect()
      newChild.selection = new BetterRoundedRect("onlyBorder")
      newChild.selection.tint = 0x3a9bf0
      newChild.addChild(
        newChild.backgroundObj,
        newChild.textObj,
        newChild.selection
      )
      return newChild
    },
  })

  private ghostBox?: TimingBox

  private timingDirty = false

  constructor(renderer: ChartRenderer) {
    super()
    this.renderer = renderer
    this.boxPool.sortableChildren = true
    this.sortableChildren = true
    this.addChild(this.tracks, this.boxPool)

    const timingEventListener = () => (this.timingDirty = true)

    EventHandler.on("timingModified", timingEventListener)
    this.on("destroyed", () =>
      EventHandler.off("timingModified", timingEventListener)
    )
  }

  update(fromBeat: number, toBeat: number) {
    if (this.renderer.chartManager.editTimingMode != EditTimingMode.Add) {
      this.ghostBox?.removeFromParent()
      this.ghostBox?.destroy()
      this.ghostBox = undefined
    }

    this.updateTracks()
    this.updateBoxes(fromBeat, toBeat)
  }

  private createTrack(type: string, x: number) {
    const track: TimingTrack = Object.assign(new Sprite(Texture.WHITE), {
      alpha: 0,
      width: TIMING_TRACK_WIDTHS[type],
      name: type,
      height: 5000,
      x,
      type,
      lastX: 0,
      tint: 0x263252,
      targetAlpha: 0,
    })
    track.anchor.y = 0.5
    this.tracks.addChild(track)
    return track
  }

  private initializeBox(box: TimingBox, event: TimingEvent) {
    Object.assign(box, {
      event,
      songTiming: this.renderer.chart.timingData.isTypeChartSpecific(
        event.type
      ),
      lastX: undefined,
      lastAnchor: undefined,
      animationId: undefined,
      zIndex: event.beat!,
      eventMode: "static",
    })
    box.textObj.text = this.getLabelFromEvent(event)
    box.textObj.anchor.set(0.5, 0.55)
    box.backgroundObj.width = box.textObj.width + 10
    box.backgroundObj.height = 25
    box.backgroundObj.position.x = -box.backgroundObj.width / 2
    box.backgroundObj.position.y = -25 / 2

    box.selection.width = box.textObj.width + 10
    box.selection.height = 25
    box.selection.position = box.backgroundObj.position

    if (box?.popup?.persistent !== true) box.popup?.close()
    box.popup = undefined
  }

  private addDragListeners(box: TimingBox, event: TimingEvent) {
    box.on("mouseenter", () => {
      if (box?.popup?.persistent === true) return
      if (this.renderer.chartManager.eventSelection.timingEvents.length > 0)
        return
      if (this.renderer.isDragSelecting()) return

      box.popup?.close()
      if (this.renderer.chartManager.getMode() == EditMode.Edit) {
        new TimingEventPopup(box, this.renderer.chart.timingData)
        if (box.popup)
          box.popup.onConfirm = () => {
            this.renderer.chartManager.removeEventFromSelection(event)
          }
      }
    })
    box.on("mouseleave", () => {
      if (box?.popup?.persistent === true) return
      box.popup?.close()
    })

    let initialPosY = 0
    let movedEvent: TimingEvent | undefined

    const moveHandler = (event: FederatedMouseEvent) => {
      const timingEvent = movedEvent!
      const position = this.toLocal(event.global)
      if (Math.abs(position.y - initialPosY) < 32) {
        if (this.renderer.chartManager.eventSelection.shift) {
          this.renderer.chartManager.eventSelection.shift = {
            beatShift: 0,
          }
        }
        return
      }
      box.popup?.close()
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
    box.on("pointerdown", e => {
      if (isRightClick(e)) {
        this.renderer.chartManager.clearSelections()
        this.renderer.chartManager.addEventToSelection(event)
        TimingEventPopup.activePopup?.close()
        return
      }
      e.stopImmediatePropagation()
      if (
        this.renderer.chartManager.eventSelection.timingEvents.includes(event)
      ) {
        if (e.getModifierState("Control") || e.getModifierState("Meta"))
          this.renderer.chartManager.removeEventFromSelection(event)
      } else {
        if (
          !e.getModifierState("Control") &&
          !e.getModifierState("Meta") &&
          !e.getModifierState("Shift")
        )
          this.renderer.chartManager.clearSelections()
        this.renderer.chartManager.addEventToSelection(event)
      }
      if (
        this.renderer.chartManager.getMode() == EditMode.Edit &&
        this.renderer.chartManager.eventSelection.timingEvents.length == 1
      ) {
        if (!box?.popup) {
          TimingEventPopup.activePopup?.close()
          new TimingEventPopup(box, this.renderer.chart.timingData)
          box.popup!.onConfirm = () => {
            this.renderer.chartManager.removeEventFromSelection(event)
          }
        }
      }
      if (
        box.popup &&
        !e.getModifierState("Control") &&
        !e.getModifierState("Meta") &&
        !e.getModifierState("Shift")
      )
        box.popup.select()
      else box.popup?.close()
      initialPosY = box.y!
      movedEvent = event
      if (this.renderer.chartManager.editTimingMode == EditTimingMode.Add)
        return
      this.renderer.on("pointermove", moveHandler)
      const mouseUp = () => {
        this.renderer.off("pointermove", moveHandler)
        this.renderer.off("pointerup", mouseUp)
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
      this.renderer.on("pointerup", mouseUp)
    })
  }

  private updateTracks() {
    const leftTypes = Options.chart.timingEventOrder.left
    const rightTypes = Options.chart.timingEventOrder.right
    const editingTiming =
      this.renderer.chartManager.editTimingMode != EditTimingMode.Off &&
      this.renderer.chartManager.getMode() == EditMode.Edit

    let x = -this.renderer.chart.gameType.notefieldWidth * 0.5 - 128
    for (let i = leftTypes.length - 1; i >= 0; i--) {
      const type = leftTypes[i]
      const track =
        this.tracks.getChildByName<TimingTrack>(type) ??
        this.createTrack(type, x)
      if (track.lastX != x) {
        track.lastX = x
        track.targetAlpha = i % 2 == 0 ? 0.1 : 0
        BezierAnimator.animate(
          track,
          {
            0: { x: "inherit", "anchor.x": "inherit" },
            1: { x, "anchor.x": 1 },
          },
          0.3,
          bezier(0, 0, 0.16, 1.01),
          () => {},
          `track-${type}-x`
        )
        BezierAnimator.animate(
          track,
          {
            0: { alpha: "inherit" },
            1: { alpha: editingTiming ? track.targetAlpha : 0 },
          },
          0.3,
          bezier(0, 0, 0.16, 1.01),
          () => {},
          `track-${type}-alpha`
        )
      }
      x -= TIMING_TRACK_WIDTHS[type]
    }

    x = this.renderer.chart.gameType.notefieldWidth * 0.5 + 128
    for (let i = 0; i < rightTypes.length; i++) {
      const type = rightTypes[i]
      const track =
        this.tracks.getChildByName<TimingTrack>(type) ??
        this.createTrack(type, x)
      if (track.lastX != x) {
        track.lastX = x
        track.targetAlpha = i % 2 == 0 ? 0.1 : 0
        BezierAnimator.animate(
          track,
          {
            0: { x: "inherit", "anchor.x": "inherit" },
            1: { x, "anchor.x": 0 },
          },
          0.3,
          bezier(0, 0, 0.16, 1.01),
          () => {},
          `track-${type}-x`
        )
        BezierAnimator.animate(
          track,
          {
            0: { alpha: "inherit" },
            1: { alpha: editingTiming ? track.targetAlpha : 0 },
          },
          0.3,
          bezier(0, 0, 0.16, 1.01),
          () => {},
          `track-${type}-alpha`
        )
      }
      x += TIMING_TRACK_WIDTHS[type]
    }
    if (this.wasEditingTiming != editingTiming) {
      this.wasEditingTiming = editingTiming
      for (const track of this.tracks.children) {
        BezierAnimator.animate(
          track,
          {
            0: { alpha: "inherit" },
            1: { alpha: editingTiming ? track.targetAlpha : 0 },
          },
          0.3,
          bezier(0, 0, 0.16, 1.01),
          () => {},
          `track-${track.type}-alpha`
        )
      }
    }
  }

  private updateBoxes(fromBeat: number, toBeat: number) {
    if (this.timingDirty) {
      this.timingBoxMap.clear()
      this.boxPool.destroyAll()
      this.timingDirty = false
      TimingEventPopup.activePopup?.close()
    }

    const editingTiming =
      this.renderer.chartManager.editTimingMode != EditTimingMode.Off &&
      this.renderer.chartManager.getMode() == EditMode.Edit

    this.boxPool.visible =
      this.renderer.chartManager.getMode() != EditMode.Play ||
      !Options.play.hideBarlines

    // Create all missing boxes
    for (const event of this.renderer.chart.timingData.getTimingData()) {
      if (toBeat < event.beat!) break
      if (
        !Options.chart.timingEventOrder.left.includes(event.type) &&
        !Options.chart.timingEventOrder.right.includes(event.type)
      )
        continue
      if (fromBeat > event.beat!) continue

      if (!this.timingBoxMap.has(event)) {
        const box = this.boxPool.createChild()
        if (!box) break
        this.initializeBox(box, event)
        this.addDragListeners(box, event)
        this.timingBoxMap.set(event, box)
      }
    }

    // Update boxes

    const currentRow: TimingRow | undefined = {
      beat: -Number.MAX_SAFE_INTEGER,
      second: -Number.MAX_SAFE_INTEGER,
      leftOffset: 0,
      rightOffset: 0,
    }

    for (const [event, box] of this.timingBoxMap.entries()) {
      if (event.beat! < fromBeat || event.beat! > toBeat) {
        this.timingBoxMap.delete(event)
        this.boxPool.destroyChild(box)
        continue
      }

      let targetX = 0
      let targetAnchor = 0
      const boxWidth = box.backgroundObj.width
      const side = Options.chart.timingEventOrder.right.includes(event.type)
        ? "right"
        : "left"
      if (editingTiming) {
        targetX =
          this.tracks.getChildByName<TimingTrack>(event.type)?.x ?? box.x
        targetX +=
          (TIMING_TRACK_WIDTHS[event.type] / 2) * (targetX > 0 ? 1 : -1)
        targetAnchor = 0.5
      } else {
        targetX =
          (side == "right" ? 1 : -1) *
          (this.renderer.chart.gameType.notefieldWidth * 0.5 + 80)
        if (side == "left") targetX -= 30
        if (
          currentRow.beat != event.beat ||
          (event.second && currentRow.second != event.second)
        ) {
          currentRow.leftOffset = 0
          currentRow.rightOffset = 0
          currentRow.beat = event.beat!
          currentRow.second = event.second!
        }
        if (side == "left") {
          targetX -= currentRow.leftOffset
          currentRow.leftOffset += boxWidth + 5
        } else {
          targetX += currentRow.rightOffset
          currentRow.rightOffset += boxWidth + 5
        }
        targetAnchor = side == "right" ? 0 : 1
      }

      if (box.lastX === undefined || box.lastAnchor === undefined) {
        box.position.x = targetX
        box.pivot.x = (targetAnchor - 0.5) * boxWidth
      } else if (box.lastX != targetX || box.lastAnchor != targetAnchor) {
        box.animationId = BezierAnimator.animate(
          box,
          {
            0: { x: "inherit", "pivot.x": "inherit" },
            1: { x: targetX, "pivot.x": (targetAnchor - 0.5) * boxWidth },
          },
          0.3,
          bezier(0, 0, 0.16, 1.01),
          () => {},
          box.animationId
        )
      }
      box.lastX = targetX
      box.lastAnchor = targetAnchor
      box.y =
        Options.chart.CMod && event.type == "ATTACKS"
          ? this.renderer.getYPosFromSecond(event.second)
          : this.renderer.getYPosFromBeat(event.beat!)

      box.textObj.scale.y = Options.chart.reverse ? -1 : 1

      const inSelection =
        this.renderer.chartManager.getMode() != EditMode.Play &&
        (this.renderer.chartManager.eventSelection.timingEvents.includes(
          event
        ) ||
          this.renderer.chartManager.eventSelection.inProgressTimingEvents.includes(
            event
          ))
      box.backgroundObj.tint = inSelection
        ? lighten(
            TIMING_EVENT_COLORS[event.type] ?? 0x000000,
            Math.sin(Date.now() / 320) * 0.4 + 1.5
          )
        : TIMING_EVENT_COLORS[event.type] ?? 0x000000
      box.selection.alpha = inSelection ? 1 : 0
      box.visible =
        !inSelection || !this.renderer.chartManager.eventSelection.shift
      if (this.renderer.chartManager.editTimingMode != EditTimingMode.Off) {
        const inSelectionBounds = this.renderer.selectionTest(box)
        if (!inSelection && inSelectionBounds) {
          this.renderer.chartManager.addEventToDragSelection(event)
        }
        if (inSelection && !inSelectionBounds) {
          this.renderer.chartManager.removeEventFromDragSelection(event)
        }
      }
    }
  }

  updateGhostEvent(pos: Point) {
    const snap = Options.chart.snap == 0 ? 1 / 1000 : Options.chart.snap
    const snapBeat =
      Math.round(this.renderer.getBeatFromYPos(pos.y) / snap) * snap
    const eventType = this.ghostBox?.popup
      ? this.ghostBox.event.type
      : this.getClosestTrack(pos.x)?.name
    if (!eventType) {
      this.ghostBox?.removeFromParent()
      this.ghostBox?.destroy()
      this.ghostBox = undefined
      return
    }
    if (!this.ghostBox) {
      const ghostBox = new Container() as TimingBox
      ghostBox.textObj = new BitmapText("", timingNumbers)
      ghostBox.backgroundObj = new BetterRoundedRect()
      ghostBox.selection = new BetterRoundedRect("onlyBorder")
      ghostBox.guideLine = new Sprite(Texture.WHITE)
      ghostBox.selection.tint = 0x3a9bf0
      ghostBox.selection.alpha = 0
      ghostBox.addChild(
        ghostBox.guideLine,
        ghostBox.backgroundObj,
        ghostBox.textObj,
        ghostBox.selection
      )
      this.addChild(ghostBox)
      ghostBox.visible = true
      ghostBox.textObj.anchor.set(0.5, 0.55)
      ghostBox.backgroundObj.height = 25
      ghostBox.selection.height = 25
      ghostBox.guideLine.height = 1
      ghostBox.guideLine.anchor.y = 0.5
      this.ghostBox = ghostBox
    }
    if (
      !this.ghostBox?.popup &&
      (this.ghostBox.event?.beat != snapBeat ||
        this.ghostBox.event?.type != eventType)
    ) {
      this.ghostBox.event =
        structuredClone(
          this.renderer.chart.timingData.getTimingEventAtBeat(
            eventType as TimingEventProperty,
            snapBeat
          )
        ) ??
        this.renderer.chart.timingData.getDefaultEvent(
          eventType as TimingEventProperty,
          snapBeat
        )
      this.ghostBox.event.beat = snapBeat
      if (eventType == "ATTACKS") {
        this.ghostBox.event.second =
          this.renderer.chart.getSecondsFromBeat(snapBeat)
      }
      this.ghostBox.textObj.text = this.getLabelFromEvent(this.ghostBox.event)
      this.ghostBox.backgroundObj.width = this.ghostBox.textObj.width + 10
      this.ghostBox.selection.width = this.ghostBox.textObj.width + 10
    }
    this.ghostBox.alpha = this.ghostBox?.popup ? 1 : 0.4
    this.ghostBox.selection.alpha = this.ghostBox?.popup ? 1 : 0

    this.ghostBox.name = eventType

    const yPos = this.renderer.getYPosFromBeat(
      this.ghostBox?.popup ? this.ghostBox.event.beat! : snapBeat
    )

    let targetX = this.tracks.getChildByName<TimingTrack>(eventType)!.x
    targetX += (TIMING_TRACK_WIDTHS[eventType] / 2) * (targetX > 0 ? 1 : -1)
    this.ghostBox.position.x = targetX
    this.ghostBox.backgroundObj.tint =
      TIMING_EVENT_COLORS[eventType] ?? 0x000000
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
    //Check if there is already an event there
    const possibleEvent = this.renderer.chart.timingData.getTimingEventAtBeat(
      this.ghostBox.event.type,
      this.ghostBox.event.beat!
    )
    if (
      (this.ghostBox.event.type == "ATTACKS" &&
        this.ghostBox.event.second == possibleEvent?.second) ||
      (this.ghostBox.event.type != "ATTACKS" &&
        this.ghostBox.event.beat == possibleEvent?.beat)
    ) {
      return
    }
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
