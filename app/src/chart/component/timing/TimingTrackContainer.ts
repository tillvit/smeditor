import bezier from "bezier-easing"
import {
  BitmapText,
  Container,
  FederatedMouseEvent,
  Point,
  Sprite,
  Texture,
} from "pixi.js"
import { TimingColumnPopup } from "../../../gui/popup/TimingColumnPopup"
import { TimingEventPopup } from "../../../gui/popup/TimingEventPopup"
import { BetterRoundedRect } from "../../../util/BetterRoundedRect"
import { BezierAnimator } from "../../../util/BezierEasing"
import { assignTint, lighten } from "../../../util/Color"
import { DisplayObjectPool } from "../../../util/DisplayObjectPool"
import { EventHandler } from "../../../util/EventHandler"
import { roundDigit } from "../../../util/Math"
import { Options } from "../../../util/Options"
import { isRightClick } from "../../../util/Util"
import { EditMode, EditTimingMode } from "../../ChartManager"
import { ChartRenderer, ChartRendererComponent } from "../../ChartRenderer"
import { Cached, TimingEvent, TimingEventType } from "../../sm/TimingTypes"
import { TIMING_EVENT_COLORS } from "./TimingAreaContainer"

export interface TimingBox extends Container {
  event: Cached<TimingEvent>
  backgroundObj: BetterRoundedRect
  selection: BetterRoundedRect
  textObj: BitmapText
  guideLine?: Sprite
  lastX?: number
  lastAnchor?: number
  animationId?: string
}

interface TimingTrack extends Container {
  type: string
  timingMode: "chart" | "song"
  background: Sprite
  btns: Container
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
  private timingBoxMap: Map<Cached<TimingEvent>, TimingBox> = new Map()
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
  private tracksDirty = true

  constructor(renderer: ChartRenderer) {
    super()
    this.renderer = renderer
    this.boxPool.sortableChildren = true
    this.sortableChildren = true
    this.addChild(this.tracks, this.boxPool)

    const timingEventListener = () => {
      this.timingDirty = true
      this.tracksDirty = true
    }

    const userOptionListener = (option: string) => {
      if (option.startsWith("chart.timingEventOrder")) {
        this.tracksDirty = true
      }
    }

    EventHandler.on("timingModified", timingEventListener)
    EventHandler.on("userOptionUpdated", userOptionListener)
    this.on("destroyed", () => {
      EventHandler.off("timingModified", timingEventListener)
      EventHandler.off("userOptionUpdated", userOptionListener)
    })
  }

  update(firstBeat: number, lastBeat: number) {
    if (this.renderer.chartManager.editTimingMode != EditTimingMode.Add) {
      this.ghostBox?.removeFromParent()
      this.ghostBox?.destroy()
      this.ghostBox = undefined
    }

    this.updateTracks()
    this.updateBoxes(firstBeat, lastBeat)
  }

  private createTrack(type: string, x: number) {
    const track: TimingTrack = Object.assign(new Container(), {
      alpha: 0,
      name: type,
      x,
      type,
      timingMode: "song" as const,
      background: new Sprite(Texture.WHITE),
      btns: new Container(),
    })
    track.background = new Sprite(Texture.WHITE)
    track.background.width = TIMING_TRACK_WIDTHS[type]
    track.background.height = 5000
    track.background.tint = 0x263252
    track.background.anchor.y = 0.5
    track.background.alpha = 0
    track.btns.y =
      this.renderer.getActualReceptorYPos() + (Options.chart.reverse ? 50 : -50)

    const timingTypeBtn = new Container()
    const timingTypeBtnBg = new BetterRoundedRect()
    const timingTypeBtnText = new BitmapText(type, timingNumbers)

    timingTypeBtnBg.width = 20
    timingTypeBtnBg.height = 20
    assignTint(timingTypeBtnBg, "widget-bg")
    timingTypeBtnBg.pivot.set(10, 10)

    timingTypeBtnText.anchor.set(0.5, 0.55)
    timingTypeBtnText.text = "S"
    assignTint(timingTypeBtnText, "text-color")

    timingTypeBtn.alpha = 0.4
    timingTypeBtn.name = "timingTypeBtn"
    timingTypeBtn.eventMode = "static"

    timingTypeBtn.on("mouseenter", () => {
      if (!TimingColumnPopup.activePopup?.persistent)
        new TimingColumnPopup(
          timingTypeBtn,
          type as TimingEventType,
          this.renderer.chart.timingData
        )
    })
    timingTypeBtn.on("mouseleave", () => {
      if (!TimingColumnPopup.activePopup?.persistent)
        TimingColumnPopup.activePopup?.close()
    })

    timingTypeBtn.on("pointerdown", () => {
      if (!TimingColumnPopup.activePopup?.persistent) {
        TimingColumnPopup.activePopup?.select()
      } else {
        new TimingColumnPopup(
          timingTypeBtn,
          type as TimingEventType,
          this.renderer.chart.timingData
        )
        TimingColumnPopup.activePopup?.select()
      }
    })

    timingTypeBtn.addChild(timingTypeBtnBg, timingTypeBtnText)

    track.btns.addChild(timingTypeBtn)

    track.addChild(track.background, track.btns)

    this.tracks.addChild(track)
    return track
  }

  private initializeBox(box: TimingBox, event: Cached<TimingEvent>) {
    BezierAnimator.stop(box.animationId)
    Object.assign(box, {
      event,
      lastX: undefined,
      lastAnchor: undefined,
      animationId: undefined,
      zIndex: event.beat,
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

    if (TimingEventPopup.active) {
      // check if the event is the same as the one in the popup
      const currentEvent = TimingEventPopup.getEvent()
      if (
        currentEvent.type == "ATTACKS" &&
        event.type == "ATTACKS" &&
        currentEvent.second == event.second
      ) {
        TimingEventPopup.attach(box)
      }
      if (
        currentEvent.type != "ATTACKS" &&
        event.type != "ATTACKS" &&
        currentEvent.type == event.type &&
        currentEvent.beat == event.beat
      ) {
        TimingEventPopup.attach(box)
      }
    }
  }

  private addDragListeners(box: TimingBox, event: Cached<TimingEvent>) {
    box.on("mouseenter", () => {
      if (TimingEventPopup.persistent) return
      if (this.renderer.chartManager.eventSelection.timingEvents.length > 0)
        return
      if (this.renderer.isDragSelecting()) return

      if (TimingEventPopup.active) TimingEventPopup.close()
      if (this.renderer.chartManager.getMode() == EditMode.Edit) {
        TimingEventPopup.open({
          attach: box,
          timingData: this.getTargetTimingData(box.event),
          modifyBox: false,
          onConfirm: () => {
            this.renderer.chartManager.removeEventFromSelection(event)
          },
        })
      }
    })
    box.on("mouseleave", () => {
      if (!TimingEventPopup.persistent) TimingEventPopup.close()
    })

    let initialPosY = 0
    let movedEvent: Cached<TimingEvent> | undefined

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
      TimingEventPopup.close()
      const newBeat = this.renderer.getBeatFromYPos(position.y)
      const snap = Options.chart.snap == 0 ? 1 / 1000 : Options.chart.snap
      let snapBeat = Math.round(newBeat / snap) * snap
      if (Math.abs(snapBeat - newBeat) > Math.abs(newBeat - timingEvent.beat)) {
        snapBeat = timingEvent.beat!
      }
      this.renderer.chartManager.eventSelection.shift ||= {
        beatShift: 0,
      }
      this.renderer.chartManager.eventSelection.shift.beatShift = Math.max(
        -Math.min(
          ...this.renderer.chartManager.eventSelection.timingEvents.map(
            event => event.beat
          )
        ),
        snapBeat - timingEvent.beat
      )
    }
    box.on("pointerdown", e => {
      if (isRightClick(e)) {
        this.renderer.chartManager.clearSelections()
        this.renderer.chartManager.addEventToSelection(event)
        TimingEventPopup.close()
        return
      }
      e.stopImmediatePropagation()
      if (this.renderer.chartManager.isEventInSelection(event)) {
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
        if (TimingEventPopup.options?.attach != box) {
          TimingEventPopup.close()
          TimingEventPopup.open({
            attach: box,
            timingData: this.getTargetTimingData(box.event),
            modifyBox: false,
            onConfirm: () => {
              this.renderer.chartManager.removeEventFromSelection(event)
            },
          })
        }
      }
      if (
        TimingEventPopup.active &&
        !e.getModifierState("Control") &&
        !e.getModifierState("Meta") &&
        !e.getModifierState("Shift")
      )
        TimingEventPopup.select()
      else TimingEventPopup.close()
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
                event.beat +
                  this.renderer.chartManager.eventSelection.shift!.beatShift
              )
            }
            event.beat +=
              this.renderer.chartManager.eventSelection.shift!.beatShift
            return event
          })
        this.renderer.chartManager.eventSelection.shift = undefined
      }
      this.renderer.on("pointerup", mouseUp)
    })
  }

  private updateTracks() {
    const editingTiming =
      this.renderer.chartManager.editTimingMode != EditTimingMode.Off &&
      this.renderer.chartManager.getMode() == EditMode.Edit

    if (editingTiming) {
      this.tracks.children.forEach(track => {
        track.btns.y =
          this.renderer.getActualReceptorYPos() +
          (Options.chart.reverse ? 50 : -50)
      })
    }

    if (!this.tracksDirty && this.wasEditingTiming == editingTiming) {
      return
    }
    this.wasEditingTiming = editingTiming
    this.tracksDirty = false

    const leftTypes = Options.chart.timingEventOrder.left
    const rightTypes = Options.chart.timingEventOrder.right
    this.tracks.children.forEach(track => {
      track.visible = false
    })

    let x = -this.renderer.chart.gameType.notefieldWidth * 0.5 - 128

    const animate = (
      obj: Container,
      prop: string,
      value: number,
      time: number,
      id: string
    ) => {
      BezierAnimator.animate(
        obj,
        {
          0: { [prop]: "inherit" },
          1: { [prop]: value },
        },
        time,
        bezier(0, 0, 0.16, 1.01),
        () => {},
        id
      )
    }
    for (let i = leftTypes.length - 1; i >= 0; i--) {
      const type = leftTypes[i]
      const track =
        this.tracks.getChildByName<TimingTrack>(type) ??
        this.createTrack(type, x)
      track.visible = true
      const alpha = i % 2 == 0 ? 0.1 : 0
      animate(track, "x", x, 0.3, `track-${type}-x`)
      animate(
        track.btns,
        "x",
        -TIMING_TRACK_WIDTHS[type] / 2,
        0.3,
        `track-${type}-btn-x`
      )
      animate(track.background, "anchor.x", 1, 0.3, `track-${type}-anchor-x`)
      animate(
        track.background,
        "alpha",
        editingTiming ? alpha : 0,
        0.3,
        `track-${type}-bg-alpha`
      )

      x -= TIMING_TRACK_WIDTHS[type]
    }

    x = this.renderer.chart.gameType.notefieldWidth * 0.5 + 128
    for (let i = 0; i < rightTypes.length; i++) {
      const type = rightTypes[i]
      const track =
        this.tracks.getChildByName<TimingTrack>(type) ??
        this.createTrack(type, x)
      track.visible = true
      const alpha = i % 2 == 0 ? 0.1 : 0
      animate(track, "x", x, 0.3, `track-${type}-x`)
      animate(
        track.btns,
        "x",
        TIMING_TRACK_WIDTHS[type] / 2,
        0.3,
        `track-${type}-btn-x`
      )
      animate(track.background, "anchor.x", 0, 0.3, `track-${type}-anchor-x`)
      animate(
        track.background,
        "alpha",
        editingTiming ? alpha : 0,
        0.3,
        `track-${type}-bg-alpha`
      )
      x += TIMING_TRACK_WIDTHS[type]
    }

    for (const track of this.tracks.children) {
      animate(
        track,
        "alpha",
        editingTiming ? 1 : 0,
        0.3,
        `track-${track.type}-alpha`
      )
    }

    if (!editingTiming) {
      TimingColumnPopup.activePopup?.close()
    }

    this.tracks.children.forEach(track => {
      const timingBtn = track.btns.getChildByName<Container>("timingTypeBtn")
      const timingBtnText = timingBtn?.children[1] as BitmapText
      if (timingBtn) {
        timingBtn.eventMode = editingTiming ? "static" : "none"
      }
      if (timingBtnText) {
        timingBtnText.text =
          this.renderer.chart.timingData.isPropertyChartSpecific(
            track.type as TimingEventType
          )
            ? "C"
            : "S"
      }
    })
  }

  private updateBoxes(firstBeat: number, lastBeat: number) {
    if (this.timingDirty) {
      this.timingBoxMap.clear()
      this.boxPool.destroyAll()
      this.timingDirty = false
    }

    const editingTiming =
      this.renderer.chartManager.editTimingMode != EditTimingMode.Off &&
      this.renderer.chartManager.getMode() == EditMode.Edit

    this.boxPool.visible = this.renderer.shouldDisplayBarlines()
    if (this.ghostBox) {
      this.ghostBox.visible =
        this.renderer.shouldDisplayBarlines() && editingTiming
    }

    // Create all missing boxes
    for (const event of this.renderer.chart.timingData.getTimingData()) {
      if (lastBeat < event.beat) break
      if (
        !Options.chart.timingEventOrder.left.includes(event.type) &&
        !Options.chart.timingEventOrder.right.includes(event.type)
      )
        continue
      if (firstBeat > event.beat) continue

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
      if (
        event.beat < firstBeat ||
        event.beat > lastBeat ||
        (!Options.chart.timingEventOrder.left.includes(event.type) &&
          !Options.chart.timingEventOrder.right.includes(event.type))
      ) {
        this.timingBoxMap.delete(event)
        if (TimingEventPopup.options?.attach == box) {
          TimingEventPopup.detach()
        } else if (!TimingEventPopup.persistent) {
          TimingEventPopup.close()
        }
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
        box.x = targetX
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
          : this.renderer.getYPosFromBeat(event.beat)

      const inSelection =
        this.renderer.chartManager.getMode() != EditMode.Play &&
        this.renderer.chartManager.isEventInSelection(event)
      box.backgroundObj.tint = inSelection
        ? lighten(
            TIMING_EVENT_COLORS[event.type] ?? 0x000000,
            Math.sin(Date.now() / 320) * 0.4 + 1.5
          )
        : (TIMING_EVENT_COLORS[event.type] ?? 0x000000)
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
    const hasGhostPopup =
      TimingEventPopup.active &&
      TimingEventPopup.options?.attach == this.ghostBox
    const eventType = hasGhostPopup
      ? this.ghostBox!.event.type
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
      ghostBox.visible = this.renderer.shouldDisplayBarlines()
      ghostBox.textObj.anchor.set(0.5, 0.55)
      ghostBox.backgroundObj.height = 25
      ghostBox.selection.height = 25
      ghostBox.guideLine.height = 1
      ghostBox.guideLine.anchor.y = 0.5
      this.ghostBox = ghostBox
    }

    if (
      hasGhostPopup &&
      (this.ghostBox.event?.beat != snapBeat ||
        this.ghostBox.event?.type != eventType)
    ) {
      this.ghostBox.event =
        structuredClone(
          this.renderer.chart.timingData.getEventAtBeat(
            eventType as TimingEventType,
            snapBeat
          )
        ) ??
        this.renderer.chart.timingData.getDefaultEvent(
          eventType as TimingEventType,
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
    this.ghostBox.alpha = hasGhostPopup ? 1 : 0.4
    this.ghostBox.selection.alpha = hasGhostPopup ? 1 : 0

    this.ghostBox.name = eventType

    const yPos = this.renderer.getYPosFromBeat(
      hasGhostPopup ? this.ghostBox.event.beat : snapBeat
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
  }

  placeGhostEvent() {
    if (!this.ghostBox) return
    // Check if there is already an event there
    const possibleEvent = this.renderer.chart.timingData.getEventAtBeat(
      this.ghostBox.event.type,
      this.ghostBox.event.beat,
      false
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
    TimingEventPopup.open({
      attach: this.ghostBox,
      timingData: this.getTargetTimingData(this.ghostBox.event),
      modifyBox: true,
      onConfirm: event => {
        this.getTargetTimingData(this.ghostBox!.event).insert([event])
      },
    })
  }

  getClosestTrack(x: number) {
    let leastDist = Number.MAX_SAFE_INTEGER
    let best = this.tracks.children[0]
    for (const track of this.tracks.children) {
      const dist = Math.abs(
        track.x + (0.5 - track.background.anchor.x) * track.width - x
      )
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

  private getTargetTimingData(event: TimingEvent) {
    const isChartTiming =
      this.renderer.chart.timingData.isPropertyChartSpecific(event.type)
    return isChartTiming
      ? this.renderer.chart.timingData
      : this.renderer.chart.timingData.simfileTimingData
  }
}
