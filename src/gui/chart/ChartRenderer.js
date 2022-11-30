import { app } from "../../App.js";
import { createArrow, setData, setHoldEnd, setMineTime } from "../../note/NoteRenderer.js";
import { setArrowTexTime } from "../../note/NoteTexture.js";
import { getRotFromArrow, rgbtoHex, roundDigit } from "../../util/Util.js";
import { createWaveform, loadAudio, renderWaveform, setWaveformZoom } from "./Waveform.js";

const receptor_tex = PIXI.Texture.from('assets/noteskin/receptor.png');
const flash_tex = PIXI.Texture.from('assets/noteskin/flash.png');
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

const SNAP_COLORS = {
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
const TIMING_EVENT_DATA = {
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
  constructor(chart) {
    this.chart = chart
    this.beat = 0
    this.time = 0

    this.waveform = createWaveform(this)
    this.view = new PIXI.Container();
    this.receptors = new PIXI.Container();
    this.texts = new PIXI.Container();
    this.graphics = new PIXI.Graphics();
    this.timingBoxes = new PIXI.Graphics();
    this.graphics.lineStyle(2, 0x0000FF, 1);
    this.arrows = new PIXI.Container();
    this.flashes = new PIXI.Container();
    this.timings = new PIXI.Container();
    this.snap_display = new PIXI.Container();
    this.lastReZoom = 0
    this.lastZoom = 250
    this.speedMult = 1
    for (let i = 0; i < 4; i ++) {
      let receptor = new PIXI.Sprite(receptor_tex)
      receptor.width = 69
      receptor.height = 69
      receptor.anchor.set(0.5)
      this.receptors.addChild(receptor)
    }
    for (let i = 0; i < 2; i ++) {
      let container = new PIXI.Container()
      let graphic = new PIXI.Graphics()
      let text = new PIXI.BitmapText("4", snapNumbers)
      container.y = window.options.chart.receptorYPos
      container.x = (i-0.5)*318-32
      graphic.rotation = Math.PI / 4
      text.anchor.set(0.5)
      container.addChild(graphic)
      container.addChild(text)
      this.snap_display.addChild(container)
    }
    this.view.addChild(this.graphics)
    this.view.addChild(this.waveform)
    this.view.addChild(this.texts)
    this.view.addChild(this.timingBoxes)
    this.view.addChild(this.receptors)
    this.view.addChild(this.arrows)
    this.view.addChild(this.flashes)

    this.view.addChild(this.snap_display)
    this.view.addChild(this.timings)
    app.stage.addChild(this.view)
    this.render()

    //Draw Noteflash
    app.ticker.add(()=>{
      for (let flash of this.flashes.children) { 
        flash.alpha *= 0.87
        if (flash.alpha < 0.01) {
          this.flashes.removeChild(flash)
        }
      }
    })
  }

  loadAudio(aw) {
    loadAudio(aw)
  }

  setTime(time) {
    this.time = time
    this.beat = this.chart.getBeat(this.time)
  }

  setBeat(beat) {
    this.beat = beat
    this.time = this.chart.getSeconds(this.beat)
  }

  setZoom(zoom) {
    window.options.chart.speed = zoom
  }

  addFlash(col) {
    if (!window.options.chart.drawNoteFlash) return
    let flash = new PIXI.Sprite(flash_tex)
    flash.width = 108
    flash.height = 108
    flash.anchor.set(0.5)
    flash.blendMode = PIXI.BLEND_MODES.ADD
    this.flashes.addChild(flash)
    flash.rotation = getRotFromArrow(col)
    flash.x = col*64-128
    flash.y = window.options.chart.receptorYPos
    flash.alpha = 1.3
  }

  render() {

    this.speedMult = window.options.chart.doSpeedChanges ? this.chart.timingData.getSpeedMult(this.beat, this.time) : 1

    let renderBeatLimit = this.beat + window.options.chart.maxDrawBeats
    let renderBeatLowerLimit = this.beat - window.options.chart.maxDrawBeatsBack
    let renderSecondLimit = this.chart.getSeconds(renderBeatLimit)
    let renderSecondLowerLimit = this.chart.getSeconds(renderBeatLowerLimit)

    let negScroll = window.options.chart.doSpeedChanges && (this.speedMult < 0 || (this.chart.timingData.getTimingEventAtBeat("SCROLLS",this.beat)?.value ?? 1) < 0)

    if (window.options.chart.CMod) {
      renderBeatLimit = this.chart.getBeat(this.getTimeFromYPos(app.screen.height-this.view.y+32))
      renderBeatLowerLimit = this.chart.getBeat(this.getTimeFromYPos(-32 - this.view.y))
    }

    let time = new Date()

    //Draw Snap Indicators
    for (let i = 0; i < 2; i++) {
      let container = this.snap_display.children[i]

      let square = container.children[0]
      square.clear()
      square.lineStyle(1, 0x000000, 1);
      let col = 0x707070
      if (SNAP_COLORS[4/window.options.chart.snap])
        col = SNAP_COLORS[4/window.options.chart.snap]
      square.beginFill(col);
      square.drawRect(-12, -12, 24, 24);
      square.endFill();
      let text = container.children[1]
      text.text = "" + ((window.options.chart.snap == 0 || 4/window.options.chart.snap%1 != 0) ? "" : (4/window.options.chart.snap))
    }

    //Update Waveform 
    if (window.options.waveform.enabled) {
      if (Date.now() - this.lastReZoom > 40 && this.lastZoom != window.options.chart.speed) {
        this.lastZoom = window.options.chart.speed
        this.lastReZoom = Date.now()
        setWaveformZoom(window.options.chart.speed)
      }

      renderWaveform()
    }
    this.waveform.visible = window.options.waveform.enabled
    
    //Draw Receptors
    for (let i = 0; i < this.receptors.children.length; i++) { 
      let receptor = this.receptors.children[i]
      receptor.x = i*64-128
      receptor.y = window.options.chart.receptorYPos
      receptor.rotation = getRotFromArrow(i)
      let col = Math.max((1 - (this.beat % 1)), 0.5) * 255
      receptor.tint = rgbtoHex(col, col, col)
    }

    this.graphics.clear()
    this.timingBoxes.clear()

    //Draw Timing Text
    let num_timing = 0
    let same_beat = -1
    let last_length_left = 0
    let last_length_right = 0
    for (let event of this.chart.timingData.getTimingData(...Object.keys(window.options.chart.renderTimingEvent).filter(key=>window.options.chart.renderTimingEvent[key]))) { 
      if (renderBeatLowerLimit > event.beat) continue
      if (renderBeatLimit < event.beat) break
      let y = this.getYPos(event.beat)
      if (event.type == "ATTACKS" && window.options.chart.CMod) y = (event.second-this.time)*window.options.chart.speed/100*64*4 + window.options.chart.receptorYPos
      if (y < -32 - this.view.y) continue;
      if (y > app.screen.height-this.view.y+32) {
        if (negScroll || event.beat < this.beat) continue
        else break
      }
      if (num_timing >= this.timings.children.length) {
        let container = new PIXI.Container()
        let text = new PIXI.BitmapText("", timingNumbers)
        text.anchor.y = 0.5 
        text.anchor.x = 0
        text.visible = true
        text.name = "bpm"
        container.addChild(text)
        this.timings.addChild(container)
      }
      let bp = this.timings.children[num_timing++]
      let td = TIMING_EVENT_DATA[event.type] ?? ["right", 0x000000]
      let x = td[0] == "right" ? 196 : -240
      if (same_beat != event.beat) {
        last_length_left = 0
        last_length_right = 0
      }
      if (td[0] == "left") x -= last_length_left
      if (td[0] == "right") x += last_length_right
      bp.x = x
      bp.y = y
      bp.dirtyTime = time
      let label = roundDigit(event.value,3) ?? JSON.stringify(event);
      if (event.type == "LABELS" || event.type == "BGCHANGES" || event.type == "FGCHANGES") label = event.value
      if (event.type == "TIMESIGNATURES") label = event.upper + "/" + event.lower
      if (event.type == "SPEEDS") label = event.value + "/" + event.delay + "/" + event.unit
      if (event.type == "COMBOS") label = event.hitMult + "/" + event.missMult
      if (event.type == "ATTACKS") label = event.mods + " (" + event.endType + "=" + event.value + ")"
      bp.getChildByName("bpm").text = label;
      bp.getChildByName("bpm").anchor.x = td[0] == "right" ? 0 : 1
      this.timingBoxes.beginFill(td[1]); 
      this.timingBoxes.lineStyle(1, 0x000000, 1);
      this.timingBoxes.drawRoundedRect(-5+x - (td[0] == "right" ? 0 : bp.getChildByName("bpm").width),-10+y, bp.getChildByName("bpm").width + 10, 25,5);
      if (td[0] == "left") last_length_left += bp.getChildByName("bpm").width + 15
      if (td[0] == "right") last_length_right += bp.getChildByName("bpm").width + 15 
      same_beat = event.beat
      this.timingBoxes.endFill();
      bp.visible = true
    }
    for (let i=num_timing; i < this.timings.children.length;i ++) {
      this.timings.children[i].visible = false
    }

    for (let event of this.chart.timingData.getTimingData("STOPS", "WARPS", "DELAYS", "FAKES")) { 
      if (!window.options.chart.renderTimingEvent[event.type]) continue
      if ((event.type == "STOPS" || event.type == "DELAYS") && event.second + Math.abs(event.value) < renderSecondLowerLimit)
        continue
      if ((event.type == "WARPS" || event.type == "FAKES") && event.beat + event.value < renderBeatLowerLimit)
        continue
      if (event.beat > renderBeatLimit) break
      
      
      if (event.type == "STOPS" || event.type == "DELAYS") {
        if (!((!window.options.chart.CMod && event.value < 0) || (window.options.chart.CMod && event.value > 0))) continue
      }
      
      if (event.type == "WARPS" && window.options.chart.CMod) continue 
      let y_start = this.getYPos(event.beat)
      let length = this.getYPos(event.beat + event.value) - y_start
      if (event.type == "STOPS" || event.type == "DELAYS") {
        if (event.value < 0) length = this.getYPos(this.chart.getBeat(event.second+0.0001))-y_start
        else length = event.value*window.options.chart.speed/100*64*4
      }
      if (y_start+length < -32 - this.view.y) continue
      if (y_start > app.screen.height-this.view.y+32) {
        if (negScroll || event.beat < this.beat) continue
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
      if (!window.options.chart.CMod || !this.chart.isBeatWarped(bar_beat)) {
        let y = this.getYPos(bar_beat)
        if (y < -32 - this.view.y){
          bar_beat++
          continue
        }
        if (y > app.screen.height-this.view.y+32) {
          bar_beat++
          if (negScroll || bar_beat < this.beat) continue
          else break
        }
        if (bar_beat % 4 == 0) {
          if (num_bar >= this.texts.children.length) {
            this.texts.addChild(new PIXI.BitmapText(bar_beat/4, measureNumbers))
          }
          let text = this.texts.children[num_bar++]
          text.text = "" + bar_beat/4
          text.anchor.y = 0.5 
          text.anchor.x = 1
          text.x = -128-32-64-16
          text.y = y
          text.visible = true
          text.dirtyTime = time
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
      if (window.options.chart.CMod && window.options.chart.hideWarpedArrows && note.warped) continue
      if (note.beat + (note.hold ?? 0) < renderBeatLowerLimit) continue
      if (note.beat > renderBeatLimit) break
      let y = this.getYPos(note.beat)
      let y_hold = this.getYPos(note.beat + (note.hold ?? 0))
      if (y_hold < -32 - this.view.y) continue
      if (y > app.screen.height-this.view.y+32) {
        if (negScroll || note.beat < this.beat) continue
        else break
      } 
      if (childIndex >= this.arrows.children.length) {
        this.arrows.addChild(createArrow(note))
      }
      let arrow = this.arrows.children[childIndex++]
      setData(arrow, note)
      arrow.x = note.col*64-128
      arrow.y = y
      arrow.dirtyTime = time
      if (note.type == "Hold" || note.type == "Roll") {
        setHoldEnd(arrow, y_hold)
      }
      if (note.type == "Mine") {
        setMineTime(arrow, this.time)
      }
      arrow.visible = true
    }
    for (let i=childIndex; i < this.arrows.children.length;i ++) {
      this.arrows.children[i].visible = false
    }
    
    setArrowTexTime(this.beat, this.chart.getSeconds(this.beat))

    //Prune
    this.prune(this.texts, this.arrows, this.timings)
  }

  prune(...parents) {
    let time = new Date()
    parents.forEach(parent=>parent.children.filter(item => (time - item.dirtyTime > 5000)).forEach(x=>parent.removeChild(x)))
  }

  getYPos(beat) {
    if (window.options.chart.CMod) {
      return (this.chart.getSeconds(beat)-this.time)*window.options.chart.speed/100*64*4 + window.options.chart.receptorYPos
    }
    if (window.options.chart.doSpeedChanges) return (chart.timingData.getEffectiveBeat(beat) - chart.timingData.getEffectiveBeat(this.beat)) * window.options.chart.speed/100*64 * this.speedMult + window.options.chart.receptorYPos
    return (beat - this.beat)*window.options.chart.speed/100*64 + window.options.chart.receptorYPos
  }


  getTimeFromYPos(yp) {
    if (window.options.chart.CMod) {
      let seconds = (yp - window.options.chart.receptorYPos)/window.options.chart.speed*100/64/4 + this.time
      return seconds
    }
    // bokren: if (window.options.chart.doSpeedChanges) return this.chart.getSeconds((yp - window.options.chart.receptorYPos)/64*100/window.options.chart.speed / this.speedMult+chart.timingData.getEffectiveBeat(this.beat))
    //less bokrne:
    // console.log((yp - window.options.chart.receptorYPos)/64*100/window.options.chart.speed/this.speedMult+this.beat)
    if (window.options.chart.doSpeedChanges) return this.chart.getSeconds((yp - window.options.chart.receptorYPos)/64*100/window.options.chart.speed/this.speedMult+this.beat)
    return this.chart.getSeconds((yp - window.options.chart.receptorYPos)/64*100/window.options.chart.speed+this.beat)
  }

}
