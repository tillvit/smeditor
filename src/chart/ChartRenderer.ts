
import { ArrowContainer, NoteRenderer} from "./note/NoteRenderer";
import { getRotFromArrow, rgbtoHex, roundDigit } from "../util/Util";
import { Waveform } from "./audio/Waveform";
import { ChartManager } from "./ChartManager"
import { BitmapText, BLEND_MODES, Container, Graphics, Sprite, Texture } from "pixi.js"
import { Options } from "../util/Options"
import { TimingEventProperty, TIMING_EVENT_NAMES } from "./sm/TimingTypes"
import { Chart } from "./sm/Chart"
import { NoteTexture } from "./note/NoteTexture"

type TimedDisplayObject = (BitmapText | Container) & {dirtyTime: number}

const receptor_tex = Texture.from('assets/noteskin/receptor.png');
const flash_tex = Texture.from('assets/noteskin/flash.png');
const measureNumbers = {
  fontName: "Assistant",
  fontSize: 20,
  fill: ['#ffffff']
}
const timingNumbers = {
  fontName: "Assistant",
  fontSize: 15,
  fill: ['#ffffff']
}
const snapNumbers = {
  fontName: "Assistant",
  fontSize: 10,
  fill: ['#ffffff']
}

const SNAP_COLORS: {[key: number]: number} = {
  4: 0xE74827,
  8: 0x3D89F7,
  12:0xAA2DF4,
  16:0x82E247,
  24:0xAA2DF4,
  32:0xEAA138,
  48:0xAA2DF4,
  64:0x6BE88E,
  96:0x6BE88E,
  192:0x6BE88E
}
const TIMING_EVENT_DATA: {[key in TimingEventProperty]: ["right"|"left", number]} = {
  "BPMS": ["right",0x661320],
  "STOPS": ["left",0x9ea106],
  "DELAYS": ["left",0x06a2d6],
  "WARPS": ["right",0x800b55],
  "FAKES": ["left",0x888888],
  "COMBOS": ["right",0x0f5c25],
  "SPEEDS": ["right",0x2d4c75],
  "LABELS": ["right",0x6e331d],
  "SCROLLS": ["left",0x161f45],
  "TIMESIGNATURES": ["left",0x756941],
  "TICKCOUNTS": ["right",0x339c37],
  "BGCHANGES": ["left",0xad511c],
  "FGCHANGES": ["left",0xcf302d],
  "ATTACKS": ["left",0x08bf88],
}


export class ChartRenderer {

  chartManager: ChartManager
  options: Options
  waveform: Waveform
  chart: Chart

  private receptors: Container = new Container()
  private texts: Container = new Container()
  private graphics: Graphics = new Graphics()
  private timingBoxes: Graphics = new Graphics()
  private arrows: Container = new Container()
  private flashes: Container = new Container()
  private timings: Container = new Container()
  private snap_display: Container = new Container()

  private speedMult: number = 1
  private negScroll: boolean = false

  view: Container = new Container()
 

  constructor(chartManager: ChartManager) {
    this.chartManager = chartManager
    this.options = chartManager.app.options
    this.chart = chartManager.chart!

    this.waveform = new Waveform(this)
    this.graphics.lineStyle(2, 0x0000FF, 1);

    for (let i = 0; i < 4; i ++) {
      let receptor = new Sprite(receptor_tex)
      receptor.width = 69
      receptor.height = 69
      receptor.anchor.set(0.5)
      this.receptors.addChild(receptor)
    }

    for (let i = 0; i < 2; i ++) {
      let container = new Container()
      let graphic = new Graphics()
      let text = new BitmapText("4", snapNumbers)
      container.y = this.options.chart.receptorYPos
      container.x = (i-0.5)*318-32
      graphic.rotation = Math.PI / 4
      text.anchor.set(0.5)
      container.addChild(graphic)
      container.addChild(text)
      this.snap_display.addChild(container)
    }

    this.view.addChild(this.graphics)
    this.view.addChild(this.waveform.view)
    this.view.addChild(this.texts)
    this.view.addChild(this.timingBoxes)
    this.view.addChild(this.receptors)
    this.view.addChild(this.arrows)
    this.view.addChild(this.flashes)

    this.view.addChild(this.snap_display)
    this.view.addChild(this.timings)
    this.chartManager.app.pixi.stage.addChild(this.view)
    this.render()

    //Draw Noteflash
    this.chartManager.app.pixi.ticker.add(()=>{
      for (let flash of this.flashes.children) { 
        flash.alpha *= 0.87
        if (flash.alpha < 0.01) {
          this.flashes.removeChild(flash)
        }
      }
    })
  }


  addFlash(col: number) {
    if (!this.options.chart.drawNoteFlash) return
    let flash = new Sprite(flash_tex)
    flash.width = 108
    flash.height = 108
    flash.anchor.set(0.5)
    flash.blendMode = BLEND_MODES.ADD
    this.flashes.addChild(flash)
    flash.rotation = getRotFromArrow(col)
    flash.x = col*64-128
    flash.y = this.options.chart.receptorYPos
    flash.alpha = 1.3
  }

  render() {

    let beat = this.chartManager.getBeat()
    let time = this.chartManager.getTime()
    let currentMillis = Date.now()

    this.speedMult = this.options.chart.doSpeedChanges ? this.chart.timingData.getSpeedMult(beat, time) : 1

    let renderBeatLimit = beat + this.options.chart.maxDrawBeats
    let renderBeatLowerLimit = beat - this.options.chart.maxDrawBeatsBack
    // let renderSecondLimit = this.chart.getSeconds(renderBeatLimit)
    let renderSecondLowerLimit = this.chart.getSeconds(renderBeatLowerLimit)

    this.negScroll = this.options.chart.doSpeedChanges && (this.speedMult < 0 || (this.chart.timingData.getTimingEventAtBeat("SCROLLS",beat)?.value ?? 1) < 0)

    if (this.options.chart.CMod) {
      renderBeatLimit = this.chart.getBeat(this.getTimeFromYPos(this.chartManager.app.pixi.screen.height-this.view.y+32))
      renderBeatLowerLimit = this.chart.getBeat(this.getTimeFromYPos(-32 - this.view.y))
    }


    //Draw Snap Indicators
    for (let i = 0; i < 2; i++) {
      let container = this.snap_display.children[i] as Container
      let square = container.children[0] as Graphics
      square.clear()
      square.lineStyle(1, 0x000000, 1);
      let col = 0x707070
      if (SNAP_COLORS[4/this.options.chart.snap])
        col = SNAP_COLORS[4/this.options.chart.snap]
      square.beginFill(col);
      square.drawRect(-12, -12, 24, 24);
      square.endFill();
      let text = container.children[1] as BitmapText
      text.text = "" + ((this.options.chart.snap == 0 || 4/this.options.chart.snap%1 != 0) ? "" : (4/this.options.chart.snap))
    }

    this.waveform.view.visible = this.options.waveform.enabled
    if (this.options.waveform.enabled) this.waveform.render()
    
    //Draw Receptors
    for (let i = 0; i < this.receptors.children.length; i++) { 
      let receptor = this.receptors.children[i] as Sprite
      receptor.x = i*64-128
      receptor.y = this.options.chart.receptorYPos
      receptor.rotation = getRotFromArrow(i)
      let col = Math.max((1 - (beat % 1)), 0.5) * 255
      receptor.tint = rgbtoHex(col, col, col)
    }

    this.graphics.clear()
    this.timingBoxes.clear()

    //Draw Timing Text
    let num_timing = 0
    let same_beat = -1
    let last_length_left = 0
    let last_length_right = 0
    for (let event of this.chart.timingData.getTimingData(...TIMING_EVENT_NAMES.filter((key) => this.options.chart.renderTimingEvent[key]))) { 
      if (renderBeatLowerLimit > event.beat!) continue
      if (renderBeatLimit < event.beat!) break
      let y = this.getYPos(event.beat!)
      if (event.type == "ATTACKS" && this.options.chart.CMod) y = (event.second-time)*this.options.chart.speed/100*64*4 + this.options.chart.receptorYPos
      if (y < -32 - this.view.y) continue;
      if (y > this.chartManager.app.pixi.screen.height-this.view.y+32) {
        if (this.negScroll || event.beat! < beat) continue
        else break
      }
      if (num_timing >= this.timings.children.length) {
        let text = new BitmapText("", timingNumbers)
        text.anchor.y = 0.5 
        text.anchor.x = 0
        text.visible = true
        this.timings.addChild(text)
      }
      let textObject = this.timings.children[num_timing++] as BitmapText
      let text_style = TIMING_EVENT_DATA[event.type] ?? ["right", 0x000000]
      let x = text_style[0] == "right" ? 196 : -240
      if (same_beat != event.beat) {
        last_length_left = 0
        last_length_right = 0
      }
      if (text_style[0] == "left") x -= last_length_left
      if (text_style[0] == "right") x += last_length_right
      textObject.x = x
      textObject.y = y;
      (textObject as TimedDisplayObject).dirtyTime = currentMillis
      let label = ""
      switch (event.type) {
        case "BPMS":
        case "STOPS":
        case "WARPS":
        case "DELAYS":
        case "TICKCOUNTS":
        case "FAKES":
        case "SCROLLS":
          label = roundDigit(event.value,3).toString()
          break
        case "SPEEDS":
          label = roundDigit(event.value,3) + "/" + roundDigit(event.delay,3).toString() + "/" + event.unit
          break
        case "LABELS":
          label = event.value
          break
        case "TIMESIGNATURES":
          label = event.upper + "/" + event.lower
          break
        case "COMBOS":
          label = event.hitMult + "/" + event.missMult
          break
        case "BGCHANGES":
        case "FGCHANGES":
          label = event.file
          break
        case "ATTACKS":
          label = event.mods + " (" + event.endType + "=" + event.value + ")"
      }
      textObject.text = label;
      textObject.anchor.x = text_style[0] == "right" ? 0 : 1
      textObject.visible = true
      this.timingBoxes.beginFill(text_style[1]); 
      this.timingBoxes.lineStyle(1, 0x000000, 1);
      this.timingBoxes.drawRoundedRect(-5+x - (text_style[0] == "right" ? 0 : textObject.width),-10+y, textObject.width + 10, 25,5);
      if (text_style[0] == "left") last_length_left += textObject.width + 15
      if (text_style[0] == "right") last_length_right += textObject.width + 15 
      same_beat = event.beat!
      this.timingBoxes.endFill();
    }
    for (let i=num_timing; i < this.timings.children.length;i ++) {
      this.timings.children[i].visible = false
    }

    for (let event of this.chart.timingData.getTimingData("STOPS", "WARPS", "DELAYS", "FAKES")) { 
      if (!this.options.chart.renderTimingEvent[event.type]) continue
      if ((event.type == "STOPS" || event.type == "DELAYS") && event.second! + Math.abs(event.value) < renderSecondLowerLimit)
        continue
      if ((event.type == "WARPS" || event.type == "FAKES") && event.beat + event.value < renderBeatLowerLimit)
        continue
      if (event.beat > renderBeatLimit) break
      
      
      if (event.type == "STOPS" || event.type == "DELAYS") {
        if (!((!this.options.chart.CMod && event.value < 0) || (this.options.chart.CMod && event.value > 0))) continue
      }
      
      if (event.type == "WARPS" && this.options.chart.CMod) continue 
      let y_start = this.getYPos(event.beat)
      let length = this.getYPos(event.beat + event.value) - y_start
      if (event.type == "STOPS" || event.type == "DELAYS") {
        if (event.value < 0) length = this.getYPos(this.chart.getBeat(event.second!+0.0001))-y_start
        else length = event.value*this.options.chart.speed/100*64*4
      }
      if (y_start+length < -32 - this.view.y) continue
      if (y_start > this.chartManager.app.pixi.screen.height-this.view.y+32) {
        if (this.negScroll || event.beat < beat) continue
        else break
      }
      let td = TIMING_EVENT_DATA[event.type] ?? ["right", 0x000000]
      this.timingBoxes.beginFill(td[1], 0.2); 
      this.timingBoxes.lineStyle(0, 0x000000);
      this.timingBoxes.drawRect(-224,y_start,384,length);
      this.timingBoxes.endFill();
    }

    let bar_beat = Math.max(0,Math.floor(renderBeatLowerLimit))
    let num_bar = 0
    while(bar_beat < renderBeatLimit) {
      if (!this.options.chart.CMod || !this.chart.isBeatWarped(bar_beat)) {
        let y = this.getYPos(bar_beat)
        if (y < -32 - this.view.y){
          bar_beat++
          continue
        }
        if (y > this.chartManager.app.pixi.screen.height-this.view.y+32) {
          bar_beat++
          if (this.negScroll || bar_beat < beat) continue
          else break
        }
        if (bar_beat % 4 == 0) {
          if (num_bar >= this.texts.children.length) {
            this.texts.addChild(new BitmapText(bar_beat/4+"", measureNumbers))
          }
          let text = this.texts.children[num_bar++] as BitmapText
          text.text = "" + bar_beat/4
          text.anchor.y = 0.5 
          text.anchor.x = 1
          text.x = -128-32-64-16
          text.y = y
          text.visible = true;
          (text as TimedDisplayObject).dirtyTime = currentMillis
        }
        if (bar_beat % 4 == 0) {
          this.graphics.lineStyle(4, 0xffffff, 1);
        }else{
          this.graphics.lineStyle(1, 0xffffff, 1);
        }
        this.graphics.moveTo(-128-32-64, y);
        this.graphics.lineTo(128-32+64, y);
        this.graphics.closePath()
      }
      bar_beat++
    }
    for (let i=num_bar; i < this.texts.children.length; i++) {
      this.texts.children[i].visible = false
    }

    let childIndex = 0
    for (let note of this.chart.notedata) { 
      if (this.options.chart.CMod && this.options.chart.hideWarpedArrows && note.warped) continue
      if (note.beat + (note.hold ?? 0) < renderBeatLowerLimit) continue
      if (note.beat > renderBeatLimit) break
      let y = this.getYPos(note.beat)
      let y_hold = this.getYPos(note.beat + (note.hold ?? 0))
      if (y_hold < -32 - this.view.y) continue
      if (y > this.chartManager.app.pixi.screen.height-this.view.y+32) {
        if (this.negScroll || note.beat < beat) continue
        else break
      } 
      if (childIndex >= this.arrows.children.length) {
        this.arrows.addChild( NoteRenderer.createArrow(note))
      }
      let arrow = this.arrows.children[childIndex++] as Container
      NoteRenderer.setData(arrow as ArrowContainer, note)
      arrow.x = note.col*64-128
      arrow.y = y;
      (arrow as TimedDisplayObject).dirtyTime = currentMillis
      if (note.type == "Hold" || note.type == "Roll") {
        NoteRenderer.setHoldEnd(arrow as ArrowContainer, y_hold)
      }
      if (note.type == "Mine") {
        NoteRenderer.setMineTime(arrow as ArrowContainer, time)
      }
      arrow.visible = true
    }
    for (let i=childIndex; i < this.arrows.children.length;i ++) {
      this.arrows.children[i].visible = false
    }
    
    NoteTexture.setArrowTexTime(beat, this.chart.getSeconds(beat))

    //Prune
    this.prune(this.texts, this.arrows, this.timings)
  }

  prune(...parents: Container[]) {
    let time = Date.now()
    parents.forEach(parent=>parent.children.forEach(item => {
      let object = item as TimedDisplayObject
      if (time - object.dirtyTime > 5000) {
        parent.removeChild(item)
      }
    }))
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
    let currentBeat = this.chartManager.getBeat()
    if (this.options.chart.CMod) {
      let seconds = (yp - this.options.chart.receptorYPos)/this.options.chart.speed*100/64/4 + currentTime
      return seconds
    }
    if (this.options.chart.doSpeedChanges) return this.chart.getSeconds((yp - this.options.chart.receptorYPos)/64*100/this.options.chart.speed/this.speedMult+currentBeat)
    return this.chart.getSeconds((yp - this.options.chart.receptorYPos)/64*100/this.options.chart.speed+currentBeat)
  }

  isNegScroll() {
    return this.negScroll
  }
}
