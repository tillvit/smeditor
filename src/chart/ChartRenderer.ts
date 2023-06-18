import {
  Container,
  DisplayObject,
  FederatedMouseEvent,
  Point,
  Rectangle,
  Sprite,
  Texture,
} from "pixi.js"
import { ContextMenuPopup } from "../gui/element/ContextMenu"
import { Options } from "../util/Options"
import { isRightClick } from "../util/Util"
import { ChartManager, EditMode, EditTimingMode } from "./ChartManager"
import { BarlineContainer } from "./component/BarlineContainer"
import { ComboNumber } from "./component/ComboNumber"
import { JudgmentSprite } from "./component/JudgmentSprite"
import { PreviewAreaContainer } from "./component/PreviewAreaContainer"
import { SelectionAreaContainer } from "./component/SelectionAreaContainer"
import { SelectionTimingEventContainer } from "./component/SelectionTimingEventContainer"
import { SnapContainer } from "./component/SnapContainer"
import { TimingAreaContainer } from "./component/TimingAreaContainer"
import { TimingBarContainer } from "./component/TimingBarContainer"
import { TimingTrackContainer } from "./component/TimingTrackContainer"
import { Waveform } from "./component/Waveform"
import { Notefield } from "./gameTypes/base/Notefield"
import { TimingWindow } from "./play/TimingWindow"
import { Chart } from "./sm/Chart"
import { NotedataEntry } from "./sm/NoteTypes"

interface SelectionBounds {
  start: Point
  end: Point
}

export class ChartRenderer extends Container {
  chartManager: ChartManager

  chart: Chart

  private speedMult = 1

  private lastMousePos?: Point
  private lastMouseBeat = -1
  private lastMouseCol = -1
  private lastNoteType = ""
  private editingCol = -1

  private waveform: Waveform
  private barlines: BarlineContainer
  private timingAreas: TimingAreaContainer
  private timingTracks: TimingTrackContainer
  private selectedEvents: SelectionTimingEventContainer
  private timingBar: TimingBarContainer
  notefield: Notefield
  private snapDisplay: SnapContainer
  private judgment: JudgmentSprite
  private combo: ComboNumber
  private selectionSprite: Sprite
  private selectionArea: SelectionAreaContainer
  private previewArea: PreviewAreaContainer

  private selectionBounds?: SelectionBounds

  constructor(chartManager: ChartManager) {
    super()
    this.chartManager = chartManager
    this.chart = chartManager.loadedChart!

    this.waveform = new Waveform(this)
    this.barlines = new BarlineContainer(this)
    this.timingAreas = new TimingAreaContainer(this)
    this.timingTracks = new TimingTrackContainer(this)
    this.selectedEvents = new SelectionTimingEventContainer(this)
    this.timingBar = new TimingBarContainer(this)
    this.notefield = new this.chart.gameType.notefield(this)
    this.snapDisplay = new SnapContainer(this)
    this.previewArea = new PreviewAreaContainer(this)
    this.selectionArea = new SelectionAreaContainer(this)
    this.judgment = new JudgmentSprite()
    this.combo = new ComboNumber(this)
    this.selectionSprite = new Sprite(Texture.WHITE)
    this.selectionSprite.visible = false
    this.selectionSprite.alpha = 0.2

    this.addChild(this.waveform)
    this.addChild(this.barlines)
    this.addChild(this.timingAreas)
    this.addChild(this.previewArea)
    this.addChild(this.selectionArea)
    this.addChild(this.timingTracks)
    this.addChild(this.selectedEvents)
    this.addChild(this.timingBar)
    this.addChild(this.combo)
    this.addChild(this.notefield)
    this.addChild(this.snapDisplay)
    this.addChild(this.judgment)
    this.addChild(this.selectionSprite)

    this.chartManager.app.stage.addChild(this)

    this.x = this.chartManager.app.renderer.screen.width / 2
    this.y = this.chartManager.app.renderer.screen.height / 2

    this.interactive = true
    this.hitArea = new Rectangle(-1e5, -1e5, 2e5, 2e5)

    const keyHandler = (event: KeyboardEvent) => {
      if (this.editingCol != -1) {
        const snap = Options.chart.snap == 0 ? 1 / 48 : Options.chart.snap
        const snapBeat =
          Math.round(this.getBeatFromYPos(this.lastMousePos!.y) / snap) * snap
        this.chartManager.editHoldBeat(
          this.editingCol,
          snapBeat,
          event.shiftKey
        )
      }
    }

    let selectionSpeed = 0
    const tickHandler = () => {
      if (
        (!this.chartManager.selection.shift && !this.selectionBounds) ||
        selectionSpeed == 0
      )
        return
      // Scroll the notefield if the cursor is near the edge of the screen
      const pos = this.getYPosFromBeat(
        Math.max(0, this.chartManager.getBeat() + selectionSpeed)
      )
      this.chartManager.setBeat(
        Math.max(0, this.chartManager.getBeat() + selectionSpeed)
      )
      if (this.selectionBounds)
        this.selectionBounds.start.y +=
          Options.chart.receptorYPos / Options.chart.zoom - pos
    }

    this.chartManager.app.ticker.add(tickHandler)

    window.addEventListener("keydown", keyHandler)
    this.on("destroyed", () => {
      window.removeEventListener("keydown", keyHandler)
      this.removeAllListeners()
      this.chartManager.app.ticker.remove(tickHandler)
    })

    this.on("pointerdown", event => {
      if (isRightClick(event)) return
      if (this.chartManager.getMode() == EditMode.Play) return
      if (
        this.chartManager.editTimingMode == EditTimingMode.Add &&
        this.lastMousePos
      ) {
        this.timingTracks.placeGhostEvent()
      } else if (
        this.chartManager.editTimingMode == EditTimingMode.Off &&
        Options.general.mousePlacement &&
        this.lastMouseBeat != -1 &&
        this.lastMouseCol != -1 &&
        !event.getModifierState("Shift")
      ) {
        // Place a note
        this.chartManager.clearSelections()
        this.editingCol = this.lastMouseCol
        this.chartManager.setNote(
          this.lastMouseCol,
          "mouse",
          this.lastMouseBeat
        )
      } else {
        // Start selecting
        if (
          !event.getModifierState("Control") &&
          !event.getModifierState("Meta") &&
          !event.getModifierState("Shift")
        ) {
          this.chartManager.clearSelections()
        }
        this.chartManager[
          this.chartManager.editTimingMode == EditTimingMode.Off
            ? "startDragSelection"
            : "startDragEventSelection"
        ]()
        this.selectionBounds = {
          start: this.toLocal(event.global),
          end: this.toLocal(event.global),
        }
      }
    })

    this.on("mousemove", event => {
      // Process selection
      this.lastMousePos = this.toLocal(event.global)
      if (this.editingCol != -1) {
        const snap = Options.chart.snap == 0 ? 1 / 48 : Options.chart.snap
        const snapBeat =
          Math.round(this.getBeatFromYPos(this.lastMousePos.y) / snap) * snap
        this.chartManager.editHoldBeat(
          this.editingCol,
          snapBeat,
          event.shiftKey
        )
      }
      if (this.selectionBounds) {
        this.selectionBounds.end = this.toLocal(event.global)
      }
      selectionSpeed =
        Math.max(0, this.lastMousePos.y - this.getLowerBound() + 100) / 600
      if (this.lastMousePos.y < 0) {
        selectionSpeed =
          Math.min(0, this.lastMousePos.y - this.getUpperBound() - 100) / 600
      }
    })

    this.on("pointerup", () => {
      // End selecting
      if (this.editingCol != -1) {
        this.chartManager.endEditing(this.editingCol)
        this.editingCol = -1
      }
      this.chartManager[
        this.chartManager.editTimingMode == EditTimingMode.Off
          ? "endDragSelection"
          : "endDragEventSelection"
      ]()
      this.selectionBounds = undefined
      selectionSpeed = 0
    })
  }

  isDragSelecting() {
    return !!this.selectionBounds
  }

  doJudgment(note: NotedataEntry, error: number, judgment: TimingWindow) {
    if (this.chartManager.getMode() == EditMode.Play) {
      this.judgment.doJudge(error, judgment)
      this.timingBar.addBar(error, judgment)
    }
    this.notefield.doJudge(note.col, judgment)
  }

  activateHold(col: number) {
    this.notefield.activateHold(col)
  }

  keyDown(col: number) {
    this.notefield.keyDown(col)
  }

  keyUp(col: number) {
    this.notefield.keyUp(col)
  }

  endPlay() {
    this.notefield.endPlay()
    this.timingBar.reset()
    this.judgment.reset()
  }

  update() {
    const beat = this.getVisualBeat()
    const time = this.getVisualTime()

    this.speedMult = Options.chart.doSpeedChanges
      ? this.chart.timingData.getSpeedMult(beat, time)
      : 1

    let renderBeatLimit = beat + Options.chart.maxDrawBeats
    let renderBeatLowerLimit = beat - Options.chart.maxDrawBeatsBack
    // let renderSecondLimit = this.chart.getSeconds(renderBeatLimit)
    let renderSecondLowerLimit =
      this.chart.getSecondsFromBeat(renderBeatLowerLimit)

    if (Options.chart.CMod) {
      renderBeatLimit = this.getBeatFromYPos(this.getLowerBound()) + 1
      renderBeatLowerLimit = this.getBeatFromYPos(this.getUpperBound())
      renderSecondLowerLimit = this.getSecondFromYPos(this.getUpperBound())
    }

    this.selectionSprite.visible = !!this.selectionBounds
    if (this.selectionBounds) {
      this.selectionSprite.position.x = Math.min(
        this.selectionBounds.start.x,
        this.selectionBounds.end.x
      )
      this.selectionSprite.position.y = Math.min(
        this.selectionBounds.start.y,
        this.selectionBounds.end.y
      )
      this.selectionSprite.width = Math.abs(
        this.selectionBounds.end.x - this.selectionBounds.start.x
      )
      this.selectionSprite.height = Math.abs(
        this.selectionBounds.end.y - this.selectionBounds.start.y
      )
    }

    this.scale.x = Options.chart.zoom
    this.scale.y = (Options.chart.reverse ? -1 : 1) * Options.chart.zoom

    this.barlines.update(beat, renderBeatLowerLimit, renderBeatLimit)
    this.timingAreas.update(
      beat,
      renderBeatLowerLimit,
      renderBeatLimit,
      renderSecondLowerLimit
    )
    this.timingTracks.update(beat, renderBeatLowerLimit, renderBeatLimit)
    this.selectedEvents.update(beat, renderBeatLimit)
    this.timingBar.update()
    this.judgment.update()
    this.combo.update()
    this.snapDisplay.update()
    this.selectionArea.update()
    this.previewArea.update()

    this.notefield.update(beat, renderBeatLowerLimit, renderBeatLimit)
    this.notefield.alpha =
      this.chartManager.editTimingMode == EditTimingMode.Off ||
      this.chartManager.getMode() == EditMode.Play
        ? 1
        : 0.3
    this.waveform.update(beat, time)

    // Move the ghost note for mouse placement
    if (
      Options.general.mousePlacement &&
      this.lastMousePos &&
      this.chartManager.getMode() != EditMode.Play
    ) {
      const snap = Options.chart.snap == 0 ? 1 / 48 : Options.chart.snap
      const snapBeat =
        Math.round(this.getBeatFromYPos(this.lastMousePos.y) / snap) * snap
      const col = Math.round((this.lastMousePos.x + 96) / 64)
      if (
        snapBeat != this.lastMouseBeat ||
        col != this.lastMouseCol ||
        this.chartManager.getEditingNoteType() != this.lastNoteType
      ) {
        this.lastMouseBeat = snapBeat
        this.lastMouseCol = col
        this.lastNoteType = this.chartManager.getEditingNoteType()
        if (this.editingCol != -1) {
          this.chartManager.editHoldBeat(this.editingCol, snapBeat, false)
        }
        if (col > 3 || col < 0) {
          this.lastMouseBeat = -1
          this.lastMouseCol = -1
          this.notefield.setGhostNote()
        } else {
          this.notefield.setGhostNote({
            beat: snapBeat,
            col: this.lastMouseCol,
            type: this.chartManager.getEditingNoteType(),
          })
        }
      }
    }

    // Move the ghost event when adding events
    if (
      this.lastMousePos &&
      this.chartManager.editTimingMode == EditTimingMode.Add
    ) {
      this.timingTracks.setGhostEvent(this.lastMousePos)
    }
  }

  /**
   * Gets the current time including play offset
   *
   * @return {*}  {number}
   * @memberof ChartRenderer
   */
  getTimeWithOffset(): number {
    let time = this.chartManager.getTime()
    if (
      this.chartManager.getMode() == EditMode.Play ||
      this.chartManager.getMode() == EditMode.Record
    ) {
      time += Options.play.offset
    }
    return time
  }

  /**
   * Gets the current beat including play offset
   *
   * @return {*}  {number}
   * @memberof ChartRenderer
   */
  getBeatWithOffset(): number {
    let beat = this.chartManager.getBeat()
    if (
      this.chartManager.getMode() == EditMode.Play ||
      this.chartManager.getMode() == EditMode.Record
    ) {
      beat = this.chart.getBeatFromSeconds(this.getTimeWithOffset())
    }
    return beat
  }

  /**
   * Gets the current time including play and visual offset
   *
   * @return {*}  {number}
   * @memberof ChartRenderer
   */
  getVisualTime(): number {
    let time = this.chartManager.getTime()
    if (
      this.chartManager.getMode() == EditMode.Play ||
      this.chartManager.getMode() == EditMode.Record
    ) {
      time += Options.play.offset + Options.play.visualOffset
    }
    return time
  }

  /**
   * Gets the current beat including play and visual offset
   *
   * @return {*}  {number}
   * @memberof ChartRenderer
   */
  getVisualBeat(): number {
    let beat = this.chartManager.getBeat()
    if (
      this.chartManager.getMode() == EditMode.Play ||
      this.chartManager.getMode() == EditMode.Record
    ) {
      beat = this.chart.getBeatFromSeconds(this.getVisualTime())
    }
    return beat
  }

  /**
   * Returns the y position for a note on the given beat.
   *
   * @param {number} beat
   * @return {*}  {number}
   * @memberof ChartRenderer
   */
  getYPosFromBeat(beat: number): number {
    const currentTime = this.getVisualTime()
    const currentBeat = this.getVisualBeat()
    if (Options.chart.CMod) {
      const deltaTime = this.chart.getSecondsFromBeat(beat) - currentTime
      const deltaY = deltaTime * this.getSecondsToPixelsRatio()
      return deltaY + this.getActualReceptorYPos()
    }
    if (currentBeat == beat) return this.getActualReceptorYPos()
    const deltaBeat = Options.chart.doSpeedChanges
      ? this.chart.timingData.getEffectiveBeat(beat) -
        this.chart.timingData.getEffectiveBeat(currentBeat)
      : beat - currentBeat
    const deltaY = deltaBeat * this.getEffectiveBeatsToPixelsRatio()
    return deltaY + this.getActualReceptorYPos()
  }

  /**
   * Returns the y position for a note at the given second.
   * Use this method to prevent calculating the current second (usually in CMod).
   *
   * @param {number} time
   * @return {*}  {number}
   * @memberof ChartRenderer
   */
  getYPosFromSecond(time: number): number {
    const currentTime = this.getVisualTime()
    if (Options.chart.CMod) {
      const deltaTime = time - currentTime
      const deltaY = deltaTime * this.getSecondsToPixelsRatio()
      return deltaY + this.getActualReceptorYPos()
    } else {
      return this.getYPosFromBeat(
        this.chart.timingData.getBeatFromSeconds(time)
      )
    }
  }

  /**
   * Returns the second for a note at the specified y position.
   * May return an incorrect value when negative scrolls are used.
   *
   * @param {number} yp
   * @return {*}  {number}
   * @memberof ChartRenderer
   */
  getSecondFromYPos(yp: number): number {
    if (Options.chart.CMod) {
      const pixelsToSeconds = this.getPixelsToSecondsRatio()
      const currentTime = this.getVisualTime()

      const deltaY = yp - Options.chart.receptorYPos / Options.chart.zoom
      const deltaTime = deltaY * pixelsToSeconds
      return currentTime + deltaTime
    }
    return this.chart.getSecondsFromBeat(this.getBeatFromYPos(yp))
  }

  /**
   * Returns the beat for a note at the specified y position.
   * May return an incorrect value when negative scrolls are used.
   *
   * @param {number} yp
   * @param {boolean} [ignoreScrolls] - Set to true to ignore scrolls
   * @return {*}  {number}
   * @memberof ChartRenderer
   */
  getBeatFromYPos(yp: number, ignoreScrolls?: boolean): number {
    const currentBeat = this.getVisualBeat()
    if (Options.chart.CMod) {
      return this.chart.getBeatFromSeconds(this.getSecondFromYPos(yp))
    }
    const deltaY = yp - this.getActualReceptorYPos()
    const deltaBeat = deltaY * this.getPixelsToEffectiveBeatsRatio()
    if (Options.chart.doSpeedChanges && !ignoreScrolls) {
      const effBeat =
        this.chart.timingData.getEffectiveBeat(currentBeat) + deltaBeat
      return this.chart.getBeatFromEffectiveBeat(effBeat)
    }
    return currentBeat + deltaBeat
  }

  /**
   * Returns the y position of the receptors after zooming.
   *
   * @return {*}  {number}
   * @memberof ChartRenderer
   */
  getActualReceptorYPos(): number {
    return Options.chart.receptorYPos / Options.chart.zoom
  }

  getEffectiveBeatsToPixelsRatio(): number {
    return (Options.chart.speed / 100) * 64 * this.speedMult
  }

  getPixelsToEffectiveBeatsRatio(): number {
    return 1 / this.getEffectiveBeatsToPixelsRatio()
  }

  getSecondsToPixelsRatio(): number {
    return (Options.chart.speed / 100) * 64 * 4
  }

  getPixelsToSecondsRatio(): number {
    return 1 / this.getSecondsToPixelsRatio()
  }

  /**
   * Returns true if the chart is current at a negative scroll.
   *
   * @param {number} beat
   * @return {*}
   * @memberof ChartRenderer
   */
  isNegScroll(beat: number) {
    return (
      Options.chart.doSpeedChanges &&
      (this.speedMult < 0 ||
        (this.chart.timingData.getTimingEventAtBeat("SCROLLS", beat)?.value ??
          1) < 0 ||
        this.chart.timingData.getBPM(beat) < 0)
    )
  }

  /**
   * Returns the maximum y position to render.
   *
   * @return {*}  {number}
   * @memberof ChartRenderer
   */
  getLowerBound(): number {
    return (
      (this.chartManager.app.renderer.screen.height - this.y) /
        Options.chart.zoom +
      32
    )
  }

  /**
   * Returns the minimum y position to render
   *
   * @return {*}  {number}
   * @memberof ChartRenderer
   */
  getUpperBound(): number {
    return -32 - this.y / Options.chart.zoom
  }

  /**
   * Tests if an object is in the selection sprite.
   *
   * @param {Container} object
   * @return {*}  {boolean}
   * @memberof ChartRenderer
   */
  selectionTest(object: Container): boolean {
    if (!this.selectionBounds) return false
    const ab = this.selectionSprite.getBounds()
    const bb = object.getBounds()
    return (
      ab.x + ab.width > bb.x + bb.width / 4 &&
      ab.x < bb.x + bb.width - bb.width / 4 &&
      ab.y + ab.height > bb.y + bb.height / 4 &&
      ab.y < bb.y + bb.height - bb.height / 4
    )
  }

  /**
   * Adds the selection and drag handlers to this object. Call this function when creating a new note object.
   *
   * @param {(DisplayObject & { note: NotedataEntry })} newChild
   * @memberof ChartRenderer
   */
  registerDragNote(newChild: DisplayObject & { note: NotedataEntry }) {
    newChild.interactive = true
    newChild.removeAllListeners()
    let lastTriedColumnShift = 0
    let initalPosX = 0
    let initalPosY = 0
    let movedNote: NotedataEntry | undefined

    const moveHandler = (event: FederatedMouseEvent) => {
      const note = movedNote!
      const position = this.toLocal(event.global)
      if (
        Math.abs(position.y - initalPosY) ** 2 +
          Math.abs(position.x - initalPosX) ** 2 <
        32 * 32
      ) {
        if (this.chartManager.selection.shift) {
          this.chartManager.selection.shift = {
            columnShift: 0,
            beatShift: 0,
          }
        }
        return
      }
      const newBeat = this.getBeatFromYPos(position.y)
      const snap = Options.chart.snap == 0 ? 1 / 48 : Options.chart.snap
      let snapBeat = Math.round(newBeat / snap) * snap
      if (Math.abs(snapBeat - newBeat) > Math.abs(newBeat - note.beat)) {
        snapBeat = note.beat
      }
      const col = Math.round((position.x + 96) / 64)
      this.chartManager.selection.shift ||= {
        columnShift: 0,
        beatShift: 0,
      }
      if (lastTriedColumnShift != col - note.col) {
        lastTriedColumnShift = col - note.col
        if (
          this.chartManager.selection.notes.every(note => {
            const newCol = note.col + lastTriedColumnShift
            return (
              newCol >= 0 &&
              newCol < this.chartManager.loadedChart!.gameType.numCols
            )
          })
        ) {
          this.chartManager.selection.shift.columnShift = col - note.col
        }
      }
      this.chartManager.selection.shift.beatShift = Math.max(
        -Math.min(...this.chartManager.selection.notes.map(note => note.beat)),
        snapBeat - note.beat
      )
    }
    newChild.on("pointerdown", event => {
      if (isRightClick(event)) {
        if (!this.chartManager.selection.notes.includes(newChild.note)) {
          this.chartManager.clearSelections()
          this.chartManager.addNoteToSelection(newChild.note)
        }
        ContextMenuPopup.open(this.chartManager.app, event)
        event.preventDefault()
        return
      }
      if (
        Options.general.mousePlacement &&
        !event.getModifierState("Meta") &&
        !event.getModifierState("Control") &&
        !event.getModifierState("Shift") &&
        !this.chartManager.selection.notes.includes(newChild.note)
      )
        return
      event.stopImmediatePropagation()
      if (this.chartManager.selection.notes.includes(newChild.note)) {
        if (event.getModifierState("Control") || event.getModifierState("Meta"))
          this.chartManager.removeNoteFromSelection(newChild.note)
      } else {
        if (
          !event.getModifierState("Control") &&
          !event.getModifierState("Meta") &&
          !event.getModifierState("Shift")
        ) {
          this.chartManager.clearSelections()
        }
        this.chartManager.addNoteToSelection(newChild.note)
      }
      initalPosX = newChild.x!
      initalPosY = newChild.y!
      movedNote = newChild.note!
      this.on("pointermove", moveHandler)
      const mouseUp = () => {
        this.off("pointermove", moveHandler)
        this.off("pointerup", mouseUp)
        newChild.visible = true
        if (
          (this.chartManager.selection.shift?.beatShift ?? 0) != 0 ||
          (this.chartManager.selection.shift?.columnShift ?? 0) != 0
        )
          this.chartManager.modifySelection(note => {
            note.beat += this.chartManager.selection.shift!.beatShift
            note.col += this.chartManager.selection.shift!.columnShift
            return note
          })
        this.chartManager.selection.shift = undefined
      }
      this.on("pointerup", mouseUp)
    })
    newChild.on("destroyed", () => {
      newChild?.removeAllListeners()
    })
  }
}
