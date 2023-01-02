import { Waveform } from "./renderer/Waveform";
import { ChartManager, EditMode } from "./ChartManager"
import { Container, Point, Rectangle } from "pixi.js"
import { Options } from "../util/Options"
import { Chart } from "./sm/Chart"
import { NotedataEntry } from "./sm/NoteTypes"
import { BarlineContainer } from "./renderer/BarlineContainer"
import { TimingAreaContainer } from "./renderer/TimingAreaContainer"
import { TimingBoxContainer } from "./renderer/TimingBoxContainer"
import { TimingWindow } from "./play/TimingWindow"
import { JudgmentContainer } from "./renderer/JudgmentContainer"
import { TimingBarContainer } from "./renderer/TimingBarContainer"
import { Notefield } from "./types/base/Notefield"
import { SnapContainer } from "./renderer/SnapContainer"
import { NoteLayoutSprite } from "./renderer/NoteLayoutSprite"

export class ChartRenderer extends Container {

  chartManager: ChartManager
  
  chart: Chart

  private speedMult: number = 1
  private negScroll: boolean = false

  private lastMousePos?: Point
  private lastMouseBeat: number = -1
  private lastMouseCol: number = -1
  private lastNoteType: string = ""
  private editingCol: number = -1

  private waveform: Waveform
  private barlines: BarlineContainer
  private timingAreas: TimingAreaContainer
  private timingBoxes: TimingBoxContainer
  private timingBar: TimingBarContainer
  private noteLayout: NoteLayoutSprite
  private notefield: Notefield
  private snapDisplay: SnapContainer
  private judgment: JudgmentContainer
  
 
  constructor(chartManager: ChartManager) {
    super()
    this.chartManager = chartManager
    this.chart = chartManager.chart!

    this.waveform = new Waveform(this)
    this.barlines = new BarlineContainer(this)
    this.timingAreas = new TimingAreaContainer(this)
    this.timingBoxes = new TimingBoxContainer(this)
    this.timingBar = new TimingBarContainer(this)
    this.noteLayout = new NoteLayoutSprite(this)
    this.notefield = new this.chart.gameType.notefield(this)
    this.snapDisplay = new SnapContainer(this)
    this.judgment = new JudgmentContainer()

    this.addChild(this.waveform)
    this.addChild(this.barlines)
    this.addChild(this.timingAreas)
    this.addChild(this.timingBoxes)
    this.addChild(this.timingBar)
    this.addChild(this.notefield)
    this.addChild(this.snapDisplay)
    this.addChild(this.judgment)
    this.addChild(this.noteLayout)

    this.chartManager.app.stage.addChild(this)

    this.x = this.chartManager.app.renderer.screen.width/2
    this.y = this.chartManager.app.renderer.screen.height/2

    this.interactive = true
    this.hitArea = new Rectangle(-1e5, -1e5, 2e5, 2e5);

    this.on("mousemove", (event) =>{
      this.lastMousePos = this.toLocal(event.global)
      if (this.editingCol != -1) {
        let snap = Options.chart.snap == 0 ? 1/48 : Options.chart.snap
        let snapBeat = Math.round(this.getBeatFromYPos(this.lastMousePos.y)/snap)*snap
        this.chartManager.editHoldBeat(this.editingCol, snapBeat, event.shiftKey)
      }
    })
    window.addEventListener("keydown", event =>{
      if (this.editingCol != -1) {
        let snap = Options.chart.snap == 0 ? 1/48 : Options.chart.snap
        let snapBeat = Math.round(this.getBeatFromYPos(this.lastMousePos!.y)/snap)*snap
        this.chartManager.editHoldBeat(this.editingCol, snapBeat, event.shiftKey)
      }
    })
    this.on("mousedown", () => {
      if (Options.editor.mousePlacement && this.lastMouseBeat != -1 && this.lastMouseCol != -1) {
        this.editingCol = this.lastMouseCol
        this.chartManager.setNote(this.lastMouseCol, "mouse", this.lastMouseBeat)
      }
    })
    this.on("mouseup", () => {
      if (this.editingCol != -1) {
        this.chartManager.endEditing(this.editingCol)
        this.editingCol = -1
      }
    })
  }


  doJudgment(note: NotedataEntry, error: number, judgment: TimingWindow) {
    if (this.chartManager.getMode() == EditMode.Play){
      this.judgment.doJudge(error, judgment)
      this.timingBar.addBar(error, judgment)
    }
    this.notefield.doJudge(note.col, judgment)
  }

  activateHold(col: number) {
    this.notefield.activateHold(col)
  }

  keyDown(col: number){
    this.notefield.keyDown(col)
  }

  keyUp(col: number){
    this.notefield.keyUp(col)
  }

  endPlay() {
    this.notefield.reset()
  }

  resetPlay() {
    this.timingBar.reset()
  }

  renderThis() {

    let beat = this.getBeat()
    let time = this.getTime()

    this.speedMult = Options.chart.doSpeedChanges ? this.chart.timingData.getSpeedMult(beat, time) : 1

    let renderBeatLimit = beat + Options.chart.maxDrawBeats
    let renderBeatLowerLimit = beat - Options.chart.maxDrawBeatsBack
    // let renderSecondLimit = this.chart.getSeconds(renderBeatLimit)
    let renderSecondLowerLimit = this.chart.getSeconds(renderBeatLowerLimit)

    this.negScroll = Options.chart.doSpeedChanges && (this.speedMult < 0 || (this.chart.timingData.getTimingEventAtBeat("SCROLLS",beat)?.value ?? 1) < 0)

    if (Options.chart.CMod) {
      renderBeatLimit = this.getBeatFromYPos(this.chartManager.app.renderer.screen.height-this.y+32)
      renderBeatLowerLimit = this.getBeatFromYPos(-32 - this.y)
      renderSecondLowerLimit = (-32 - this.y - Options.chart.receptorYPos)/4/64*100/Options.chart.speed + time
    }

    this.barlines.renderThis(beat, renderBeatLowerLimit, renderBeatLimit)
    this.timingAreas.renderThis(beat, renderBeatLowerLimit, renderBeatLimit, renderSecondLowerLimit)
    this.timingBoxes.renderThis(beat, renderBeatLowerLimit, renderBeatLimit)
    this.timingBar.renderThis()
    this.notefield.update(beat, renderBeatLowerLimit, renderBeatLimit)
    this.snapDisplay.renderThis()
    this.waveform.renderThis(beat)
    this.judgment.renderThis()
    this.noteLayout.renderThis()

    if (this.lastMousePos && this.chartManager.getMode() != EditMode.Play) {
      let snap = Options.chart.snap == 0 ? 1/48 : Options.chart.snap
      let snapBeat = Math.round(this.getBeatFromYPos(this.lastMousePos.y)/snap)*snap
      let col = Math.round((this.lastMousePos.x+96)/64)
      if (snapBeat != this.lastMouseBeat || col != this.lastMouseCol || this.chartManager.getEditingNoteType() != this.lastNoteType)  {
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
            type: this.chartManager.getEditingNoteType()
          })
        }
      }
    }
  }

  getTime(): number {
    let time = this.chartManager.getTime()
    if (this.chartManager.getMode() == EditMode.Play) {
      time += Options.play.offset
    }
    return time
  }

  getBeat(): number {
    let beat = this.chartManager.getBeat()
    if (this.chartManager.getMode() == EditMode.Play) {
      beat = this.chart.getBeat(this.getTime())
    }
    return beat
  }



  getYPos(beat: number): number {
    let currentTime = this.getTime() 
    let currentBeat = this.getBeat() 
    if (Options.chart.CMod) {
      return (this.chart.getSeconds(beat)-currentTime)*Options.chart.speed/100*64*4 + Options.chart.receptorYPos
    }
    if (currentBeat == beat) return Options.chart.receptorYPos
    if (Options.chart.doSpeedChanges) return (this.chart.timingData.getEffectiveBeat(beat) - this.chart.timingData.getEffectiveBeat(currentBeat)) * Options.chart.speed/100*64 * this.speedMult + Options.chart.receptorYPos
    return (beat - currentBeat)*Options.chart.speed/100*64 + Options.chart.receptorYPos
  }


  getTimeFromYPos(yp: number): number {
    let currentTime = this.getTime()
    if (Options.chart.CMod) {
      let seconds = (yp - Options.chart.receptorYPos)/Options.chart.speed*100/64/4 + currentTime
      return seconds
    }
    return this.chart.getSeconds(this.getBeatFromYPos(yp))
  }

  getBeatFromYPos(yp: number, ignoreSpeeds?: boolean): number {
    let currentBeat = this.getBeat()
    if (Options.chart.CMod) {
      return this.chart.getBeat(this.getTimeFromYPos(yp))
    }
    if (Options.chart.doSpeedChanges && !ignoreSpeeds) return this.chart.getBeatFromEffectiveBeat((yp - Options.chart.receptorYPos)/64*100/Options.chart.speed/this.speedMult+this.chart.timingData.getEffectiveBeat(currentBeat))
    return (yp - Options.chart.receptorYPos)/64*100/Options.chart.speed+currentBeat
  }

  isNegScroll() {
    return this.negScroll
  }
}
