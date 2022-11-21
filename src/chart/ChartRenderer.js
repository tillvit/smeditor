import { app } from "../index.js";
import { createArrow, setData, setHoldEnd, setMineTime } from "../note/NoteRenderer.js";
import { setArrowTexTime } from "../note/NoteTexture.js";
import { getBeat, getBPM, getRotFromArrow, getSeconds, getSecondsNoTiming, isWarped, rgbtoHex, roundDigit } from "../util/util.js";
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

const snapColors = {
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

const timingData = {
  "BPMS": ["right",0x661320],
  "STOPS": ["left",0x9ea106],
  "WARPS": ["right",0x800b55],
}

export class Chart {
  constructor(sm, chartIndex) {
    this.sm = sm;
    this.chartIndex = chartIndex
    this.speed = 250
    this.beat = 0
    this.time = 0
    this.receptorYPos = -200
    this.snap = 1
    this.hideWarpedArrows = false

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
    this.CMod = true
    this.assistTick = false
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
      container.y = this.receptorYPos
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
    this.beat = getBeat(this.time, this.sm)
    // this.render()
  }

  setBeat(beat) {
    this.beat = beat
    // if (this.CMod) {
    //   this.time = getSeconds(this.beat, this.sm)
    // }else{
    //   this.time = getSecondsNoTiming(this.beat, this.sm)
    // }
    this.time = getSeconds(this.beat, this.sm)
    // this.render()
  }

  setZoom(zoom) {
    this.speed = zoom
    // this.render()
  }

  addFlash(col) {
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
    f.y = this.receptorYPos
    f.alpha = 1.3
  }

  render() {

    //Draw Snap Indicators
    for (let i = 0; i < 2; i++) {
      let container = this.snap_display.children[i]

      let square = container.children[0]
      square.clear()
      square.lineStyle(1, 0x000000, 1);
      let col = 0x707070
      if (snapColors[4/this.snap])
        col = snapColors[4/this.snap]
      square.beginFill(col);
      square.drawRect(-12, -12, 24, 24);
      square.endFill();
      let text = container.children[1]
      text.text = "" + ((this.snap == 0 || 4/this.snap%1 != 0) ? "" : (4/this.snap))
    }

    //Update Waveform
    if (Date.now() - this.lastReZoom > 40 && this.lastZoom != this.speed) {
      this.lastZoom = this.speed
      this.lastReZoom = Date.now()
      setWaveformZoom(this.speed)
    }

    renderWaveform()

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
      receptor.y = this.receptorYPos
      receptor.rotation = getRotFromArrow(i)
      let col = Math.max((1 - (this.beat % 1)), 0.5) * 255
      receptor.tint = rgbtoHex(col, col, col)
    }

    this.graphics.clear()
    this.timingBoxes.clear()

    //Draw Timing Text
    let num_timing = 0
    for (let en of this.sm._events) { 
      let b = en[0]
      let value = en[1]
      let type = en[2]
      if (this.getYPos(b) < -32 - this.view.y || this.getYPos(b) > app.screen.height-this.view.y+32 || type=="WARP_DEST") {
        continue;
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
      let td = timingData[type]
      let x = td[0] == "right" ? 196 : -240
      let y = this.getYPos(b)
      bp.x = x
      bp.y = y
      bp.getChildByName("bpm").text = roundDigit(value,3);
      bp.getChildByName("bpm").anchor.x = td[0] == "right" ? 0 : 1
      this.timingBoxes.beginFill(td[1]); 
      this.timingBoxes.lineStyle(1, 0x000000, 1);
      this.timingBoxes.drawRoundedRect(-5+x - (td[0] == "right" ? 0 : bp.getChildByName("bpm").width),-10+y, bp.getChildByName("bpm").width + 10, 25,5);
      this.timingBoxes.endFill();
      // bp.getChildByName("box").width = bp.getChildByName("bpm").width + 10
      
      bp.visible = true
    }
    for (let i=num_timing; i < this.timings.children.length;i ++) {
      this.timings.children[i].visible = false
    }

    for (let en of this.sm._events) { 
      if (!((!this.CMod && en[2] == "STOPS" && en[1] < 0) || (this.CMod && en[2] == "STOPS") || (!this.CMod && en[2] == "WARPS"))) {
        continue;
      } 
      let y_start = this.getYPos(en[0])
      let length = en[1]*this.speed/100*64*4
      if (en[2] == "WARPS") {
        length =en[1]*this.speed/100*64
      }
      if (!this.CMod && en[2] == "STOPS" && en[1] < 0) {
        length =  this.getYPos(getBeat(en[3]+0.0001,this.sm))-y_start
      }
      // console.log(en[0],y_start,y_end)
      if (y_start+length < -32 - this.view.y) {
        continue
      }
      if (y_start > app.screen.height-this.view.y+32) {
        break
      }
      let td = timingData[en[2]]
      this.timingBoxes.beginFill(td[1], 0.2); 
      this.timingBoxes.drawRect(-224,y_start,384,length);
      this.timingBoxes.endFill();
    }


    let bar_beat = 0
    let num_bar = 0
    let num_lines = 0
    while(this.getYPos(bar_beat+1) < -32 - this.view.y) {
      bar_beat++
    }
    while(true) {
      if (!isWarped(bar_beat, this.sm) || !this.CMod) {
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
        num_lines++
      }
      if (this.getYPos(bar_beat) > app.screen.height-this.view.y+32){
        break
      }
      bar_beat++
    }
    for (let i=num_bar; i < this.texts.children.length;i ++) {
      this.texts.children[i].visible = false
    }

    let childIndex = 0
    let nd = this.getNoteData()
    for (let i = 0; i < nd.length; i++) { 
      let note = nd[i]
      let beat = note[0]
      if (nd[i].warped && this.hideWarpedArrows)
        continue
      if (!(nd[i][2] == "Hold" || nd[i][2] == "Roll")  && (this.getYPos(beat) < -32 - this.view.y || this.getYPos(beat) > app.screen.height-this.view.y+32)) {
        continue;
      }
      if ((nd[i][2] == "Hold" || nd[i][2] == "Roll")  && (this.getYPos(beat+nd[i].hold) < -32 - this.view.y || this.getYPos(beat) > app.screen.height-this.view.y+32)) {
        continue;
      }
      if (childIndex >= this.arrows.children.length) {
        this.arrows.addChild(createArrow(nd[i]))
      }
      let arrow = this.arrows.children[childIndex++]
      setData(arrow, note)
      arrow.x = nd[i][1]*64-128
      arrow.y = this.getYPos(beat)
      if (nd[i][2] == "Hold" || nd[i][2] == "Roll") {
        setHoldEnd(arrow, this.getYPos(beat+nd[i].hold))
      }
      if (nd[i][2] == "Mine") {
        setMineTime(arrow, this.time)
      }
      arrow.visible = true
    }
    for (let i=childIndex; i < this.arrows.children.length;i ++) {
      this.arrows.children[i].visible = false
    }
    
    setArrowTexTime(this.beat, getSeconds(this.beat, this.sm))
  }

  getYPos(beat) {
    if (this.CMod) {
      return (getSeconds(beat, this.sm)-this.time)*this.speed/100*64*4 + this.receptorYPos
    }
    return (beat - this.beat)*this.speed/100*64 + this.receptorYPos
  }


  getTimeFromYPos(yp) {
    if (this.CMod) {
      let seconds = (yp - this.receptorYPos)/this.speed*100/64/4 + this.time
      return seconds
    }
    return getSeconds((yp - this.receptorYPos)/64*100/this.speed+this.beat,this.sm)
  }

  getNoteData() {
    return this.sm["NOTES"][this.chartIndex]["Notedata"]
  }
}




export function buildChart(sm, chartIndex) {
  if (sm["NOTES"][chartIndex]) {
    return new Chart(sm, chartIndex)
  }
  return null
}
