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
  }

  loadAudio(url) {
    loadAudio(url)
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
    let f;
    for (let i = 0; i < this.flashes.children.length; i++) { 
      let flash = this.flashes.children[i]
      if (flash.alpha == 0) {
        f = flash
        break;
      }
    }
    if (f == undefined) {
      let flash = new PIXI.Sprite(flash_tex)
      flash.width = 108
      flash.height = 108
      flash.anchor.set(0.5)
      flash.blendMode = PIXI.BLEND_MODES.ADD
      this.flashes.addChild(flash)
      f = flash
    }
    f.rotation = getRotFromArrow(col)
    f.x = col*64-128
    f.y = window.options.chart.receptorYPos
    f.alpha = 1.3
  }

  render() {
    this.speedMult = this.chart.timingData.getSpeedMult(this.beat, this.time)

    let renderBeatLimit = this.chart.getBeat(this.time + window.options.chart.maxDrawSeconds)
    let renderBeatLowerLimit = this.chart.getBeat(this.time - window.options.chart.maxDrawSeconds)

    //Draw Snap Indicators
    for (let i = 0; i < 2; i++) {
      let container = this.snap_display.children[i]

      let square = container.children[0]
      square.clear()
      square.lineStyle(1, 0x000000, 1);
      let col = 0x707070
      if (window.options.chart.snapColors[4/window.options.chart.snap])
        col = window.options.chart.snapColors[4/window.options.chart.snap]
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

    //Draw Noteflash
    for (let i = 0; i < this.flashes.children.length; i++) { 
      let flash = this.flashes.children[i]
      flash.alpha *= 0.87
      if (flash.alpha < 0.01) {
        flash.alpha = 0
      }
    }
    
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
    for (let event of this.chart.timingData.getTimingData()) { 
      if (this.getYPos(event.beat) < -32 - this.view.y) {
        continue;
      }
      if (this.getYPos(event.beat) > app.screen.height-this.view.y+32) {
        break
      }
      if (event.beat > renderBeatLimit)
        break
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
      let td = window.options.chart.timingData[event.type] ?? ["right", 0x000000]
      let x = td[0] == "right" ? 196 : -240
      if (same_beat != event.beat) {
        last_length_left = 0
        last_length_right = 0
      }
      if (td[0] == "left") x -= last_length_left
      if (td[0] == "right") x += last_length_right
      let y = this.getYPos(event.beat)
      bp.x = x
      bp.y = y
      let label = roundDigit(event.value,3) ?? JSON.stringify(event);
      if (event.type == "LABELS") label = event.value
      if (event.type == "TIMESIGNATURES") label = event.upper + "/" + event.lower
      if (event.type == "SPEEDS") label = event.value + "/" + event.delay + "/" + event.unit
      if (event.type == "COMBOS") label = event.hitMult + "/" + event.missMult
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
      if (event.beat > renderBeatLimit)
        break
      if (event.type == "STOPS" || event.type == "DELAYS") {
        if (!((!window.options.chart.CMod && event.value < 0) || (window.options.chart.CMod && event.value > 0))) continue
      }
      if (event.type == "WARPS" && window.options.chart.CMod) continue 
      let y_start = this.getYPos(event.beat)
      let length = this.getYPos(event.beat + event.value) - y_start
      if (event.type == "STOPS" || event.type == "DELAYS") length = this.getYPos(this.chart.getBeat(event.second+0.0001))-y_start
      if (y_start+length < -32 - this.view.y) continue
      if (y_start > app.screen.height-this.view.y+32) break
      let td = window.options.chart.timingData[event.type] ?? ["right", 0x000000]
      this.timingBoxes.beginFill(td[1], 0.2); 
      this.timingBoxes.lineStyle(0, 0x000000);
      this.timingBoxes.drawRect(-224,y_start,384,length);
      this.timingBoxes.endFill();
    }

    let bar_beat = 0
    let num_bar = 0
    while(this.getYPos(bar_beat+1) < -32 - this.view.y) {
      bar_beat++
    }
    while(bar_beat < renderBeatLimit) {
      if (!this.chart.isBeatWarped(bar_beat) || !window.options.chart.CMod) {
        if (bar_beat % 4 == 0) {
          if (num_bar >= this.texts.children.length) {
            this.texts.addChild(new PIXI.BitmapText(bar_beat/4, measureNumbers))
          }
          let text = this.texts.children[num_bar++]
          text.text = "" + bar_beat/4
          text.anchor.y = 0.5 
          text.anchor.x = 1
          text.x = -128-32-64-16
          text.y = this.getYPos(bar_beat)
          text.visible = true
        }
        if (bar_beat % 4 == 0) {
          this.graphics.lineStyle(4, 0xffffff, 1);
        }else{
          this.graphics.lineStyle(1, 0xffffff, 1);
        }
        this.graphics.moveTo(-128-32-64, this.getYPos(bar_beat));
        this.graphics.lineTo(128-32+64, this.getYPos(bar_beat));
        this.graphics.closePath()
      }
      if (this.getYPos(bar_beat) > app.screen.height-this.view.y+32){
        break
      }
      bar_beat++
    }
    for (let i=num_bar; i < this.texts.children.length; i++) {
      this.texts.children[i].visible = false
    }

    let childIndex = 0
    for (let note of this.chart.notedata) { 
      if (note.warped && window.options.chart.hideWarpedArrows && window.options.chart.CMod)
        continue
      if (note.beat < renderBeatLowerLimit && note.hold == undefined)
        continue
      if (this.getYPos(note.beat + (note.hold ?? 0)) < -32 - this.view.y) {
        continue;
      }
      if (this.getYPos(note.beat) > app.screen.height-this.view.y+32) {
        break;
      }
      if (note.beat + (note.hold ?? 0) > renderBeatLimit)
        break
      if (childIndex >= this.arrows.children.length) {
        this.arrows.addChild(createArrow(note))
      }
      let arrow = this.arrows.children[childIndex++]
      setData(arrow, note)
      arrow.x = note.col*64-128
      arrow.y = this.getYPos(note.beat)
      if (note.type == "Hold" || note.type == "Roll") {
        setHoldEnd(arrow, this.getYPos(note.beat+note.hold))
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
    if (window.options.chart.doSpeedChanges) return this.chart.getSeconds((yp - window.options.chart.receptorYPos)/64*100/window.options.chart.speed/this.speedMult+this.beat)
    return this.chart.getSeconds((yp - window.options.chart.receptorYPos)/64*100/window.options.chart.speed+this.beat)
  }

}
