
import { NoteRenderer} from "./note/NoteRenderer";
import { Waveform } from "./renderer/Waveform";
import { ChartManager } from "./ChartManager"
import { Container, Point, Rectangle} from "pixi.js"
import { Options } from "../util/Options"
import { Chart } from "./sm/Chart"
import { NoteType } from "./sm/NoteTypes"
import { BarlineContainer } from "./renderer/BarlineContainer"
import { TimingAreaContainer } from "./renderer/TimingAreaContainer"
import { TimingBoxContainer } from "./renderer/TimingBoxContainer"
import { ReceptorContainer } from "./renderer/ReceptorContainer"
import { NoteContainer } from "./renderer/NoteContainer"
import { Judgment } from "./play/Judgment"
import { NoteFlashContainer } from "./renderer/NoteFlashContainer"

export class ChartRenderer extends Container {

  chartManager: ChartManager
  options: Options
  
  chart: Chart

  private speedMult: number = 1
  private negScroll: boolean = false

  private lastMousePos?: Point
  private lastMouseBeat: number = -1
  private lastMouseCol: number = -1
  private lastNoteType: NoteType = "Tap"
  private editingCol: number = -1

  private waveform: Waveform
  private barlines: BarlineContainer
  private timingAreas: TimingAreaContainer
  private receptors: ReceptorContainer
  private timingBoxes: TimingBoxContainer
  private editingArrow: Container
  private notes: NoteContainer
  private noteFlashes: NoteFlashContainer
 
  constructor(chartManager: ChartManager) {
    super()
    this.chartManager = chartManager
    this.options = chartManager.app.options
    this.chart = chartManager.chart!

    this.waveform = new Waveform(this)
    this.barlines = new BarlineContainer(this)
    this.timingAreas = new TimingAreaContainer(this)
    this.receptors = new ReceptorContainer(this)
    this.timingBoxes = new TimingBoxContainer(this)
    this.editingArrow = NoteRenderer.createArrow({beat: 0, col: 1, type: "Tap"})
    this.editingArrow.alpha = 0.4
    this.notes = new NoteContainer(this)
    this.noteFlashes = new NoteFlashContainer(this)

    this.addChild(this.waveform)
    this.addChild(this.barlines)
    this.addChild(this.timingAreas)
    this.addChild(this.receptors)
    this.addChild(this.timingBoxes)
    this.addChild(this.editingArrow)
    this.addChild(this.notes)
    this.addChild(this.noteFlashes)

    this.chartManager.app.pixi.stage.addChild(this)

    this.x = this.chartManager.app.pixi.screen.width/2
    this.y = this.chartManager.app.pixi.screen.height/2

    this.interactive = true
    this.hitArea = new Rectangle(-1e5, -1e5, 2e5, 2e5);

    this.on("mousemove", (event) =>{
      this.lastMousePos = this.toLocal(event.global)
      if (this.editingCol != -1) {
        let snap = this.options.chart.snap == 0 ? 1/48 : this.options.chart.snap
        let snapBeat = Math.round(this.getBeatFromYPos(this.lastMousePos.y)/snap)*snap
        this.chartManager.editHoldBeat(this.editingCol, snapBeat, event.shiftKey)
      }
    })
    window.addEventListener("keydown", event =>{
      if (this.editingCol != -1) {
        let snap = this.options.chart.snap == 0 ? 1/48 : this.options.chart.snap
        let snapBeat = Math.round(this.getBeatFromYPos(this.lastMousePos!.y)/snap)*snap
        this.chartManager.editHoldBeat(this.editingCol, snapBeat, event.shiftKey)
      }
    })
    this.on("mousedown", () => {
      if (this.options.editor.mousePlacement && this.lastMouseBeat != -1 && this.lastMouseCol != -1) {
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


  addFlash(col: number, judgment: Judgment) {
    this.noteFlashes.addFlash(col, judgment)
  }

  renderThis() {

    let beat = this.chartManager.getBeat()
    let time = this.chartManager.getTime()

    this.speedMult = this.options.chart.doSpeedChanges ? this.chart.timingData.getSpeedMult(beat, time) : 1

    let renderBeatLimit = beat + this.options.chart.maxDrawBeats
    let renderBeatLowerLimit = beat - this.options.chart.maxDrawBeatsBack
    // let renderSecondLimit = this.chart.getSeconds(renderBeatLimit)
    let renderSecondLowerLimit = this.chart.getSeconds(renderBeatLowerLimit)

    this.negScroll = this.options.chart.doSpeedChanges && (this.speedMult < 0 || (this.chart.timingData.getTimingEventAtBeat("SCROLLS",beat)?.value ?? 1) < 0)

    if (this.options.chart.CMod) {
      renderBeatLimit = this.getBeatFromYPos(this.chartManager.app.pixi.screen.height-this.y+32)
      renderBeatLowerLimit = this.getBeatFromYPos(-32 - this.y)
      renderSecondLowerLimit = (-32 - this.y - this.options.chart.receptorYPos)/4/64*100/this.options.chart.speed + time
    }

    this.receptors.renderThis(beat)
    this.barlines.renderThis(beat, renderBeatLowerLimit, renderBeatLimit)
    this.timingAreas.renderThis(beat, renderBeatLowerLimit, renderBeatLimit, renderSecondLowerLimit)
    this.timingBoxes.renderThis(beat, renderBeatLowerLimit, renderBeatLimit)
    this.notes.renderThis(beat, renderBeatLowerLimit, renderBeatLimit)
    this.waveform.renderThis(beat)
    this.noteFlashes.renderThis()

    if (this.lastMousePos) {
      let snap = this.options.chart.snap == 0 ? 1/48 : this.options.chart.snap
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
        } else {
          
          NoteRenderer.setData(this.editingArrow, {
            beat: snapBeat,
            col: this.lastMouseCol,
            type: this.chartManager.getEditingNoteType()
          })
        }
      }
    }

    this.editingArrow.visible = this.options.editor.mousePlacement && this.lastMouseCol != -1 && this.lastMouseBeat != -1 && this.editingCol == -1 && this.lastMouseBeat >= renderBeatLowerLimit && this.lastMouseBeat <= renderBeatLimit && this.lastMouseBeat >= 0 
    this.editingArrow.x = this.lastMouseCol*64-96
    this.editingArrow.y = this.getYPos(this.lastMouseBeat)
    if (this.chartManager.getEditingNoteType() == "Mine") {
      NoteRenderer.setMineTime(this.editingArrow, time)
    }
  }


  getYPos(beat: number): number {
    let currentTime = this.chartManager.getTime() 
    let currentBeat = this.chartManager.getBeat() 
    if (this.options.chart.CMod) {
      return (this.chart.getSeconds(beat)-currentTime)*this.options.chart.speed/100*64*4 + this.options.chart.receptorYPos
    }
    if (this.options.chart.doSpeedChanges) return (this.chart.timingData.getEffectiveBeat(beat) - this.chart.timingData.getEffectiveBeat(currentBeat)) * this.options.chart.speed/100*64 * this.speedMult + this.options.chart.receptorYPos
    return (beat - currentBeat)*this.options.chart.speed/100*64 + this.options.chart.receptorYPos
  }


  getTimeFromYPos(yp: number): number {
    let currentTime = this.chartManager.getTime()
    if (this.options.chart.CMod) {
      let seconds = (yp - this.options.chart.receptorYPos)/this.options.chart.speed*100/64/4 + currentTime
      return seconds
    }
    return this.chart.getSeconds(this.getBeatFromYPos(yp))
  }

  getBeatFromYPos(yp: number): number {
    let currentBeat = this.chartManager.getBeat()
    if (this.options.chart.CMod) {
      return this.chart.getBeat(this.getTimeFromYPos(yp))
    }
    if (this.options.chart.doSpeedChanges) return this.chart.getBeatFromEffectiveBeat((yp - this.options.chart.receptorYPos)/64*100/this.options.chart.speed/this.speedMult+this.chart.timingData.getEffectiveBeat(currentBeat))
    return (yp - this.options.chart.receptorYPos)/64*100/this.options.chart.speed+currentBeat
  }

  isNegScroll() {
    return this.negScroll
  }
}
