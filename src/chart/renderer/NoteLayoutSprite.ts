import {
  Container,
  FederatedPointerEvent,
  ParticleContainer,
  RenderTexture,
  Sprite,
  Texture,
} from "pixi.js"
import { BetterRoundedRect } from "../../util/BetterRoundedRect"
import { Options } from "../../util/Options"
import { clamp, destroyChildIf, getQuant, lerp, unlerp } from "../../util/Util"
import { EditMode } from "../ChartManager"
import { ChartRenderer } from "../ChartRenderer"
import { isHoldNote } from "../sm/NoteTypes"

const QUANT_COLORS = [
  0xe74827, 0x3d89f7, 0xaa2df4, 0x82e247, 0xaa2df4, 0xeaa138, 0xaa2df4,
  0x6be88e,
]

export class NoteLayoutSprite extends Container {
  barContainer = new ParticleContainer(
    1500,
    { position: true, scale: true },
    16384,
    true
  )
  backing: BetterRoundedRect = new BetterRoundedRect()
  bars: Sprite
  barTexture: RenderTexture
  overlay: Sprite = new Sprite(Texture.WHITE)

  private renderer: ChartRenderer
  private lastHeight = 0
  private lastCMod
  private mouseDown = false
  private queued = false

  constructor(renderer: ChartRenderer) {
    super()
    this.renderer = renderer
    this.addChild(this.backing)
    this.backing.tint = 0
    this.backing.alpha = 0.3
    this.barTexture = RenderTexture.create({
      resolution: this.renderer.chartManager.app.renderer.resolution,
    })
    this.bars = new Sprite(this.barTexture)
    this.bars.anchor.set(0.5)
    this.addChild(this.bars)
    this.overlay.anchor.x = 0.5
    this.overlay.anchor.y = 0
    this.overlay.alpha = 0.3
    this.lastCMod = Options.chart.CMod
    this.addChild(this.overlay)
    this.x = this.renderer.chartManager.app.renderer.screen.width / 2 - 20
    window.onmessage = message => {
      if (message.data == "chartModified" && message.source == window) {
        if (!this.queued) this.populate()
        this.queued = true
      }
    }
    setInterval(() => {
      if (this.queued) {
        this.queued = false
        this.populate()
      }
    }, 3000)
    this.populate()

    this.bars.interactive = true
    this.overlay.interactive = true
    this.bars.on("mousedown", event => {
      this.mouseDown = true
      this.handleMouse(event)
    })
    this.bars.on("mousemove", event => {
      if (this.mouseDown) this.handleMouse(event)
    })
    this.overlay.on("mousedown", event => {
      this.mouseDown = true
      this.handleMouse(event)
    })
    this.overlay.on("mousemove", event => {
      if (this.mouseDown) this.handleMouse(event)
    })
    window.onmouseup = () => {
      this.mouseDown = false
    }
  }

  private handleMouse(event: FederatedPointerEvent) {
    if (this.renderer.chartManager.getMode() == EditMode.Play) return
    let t =
      (this.bars.toLocal(event.global).y + this.bars.height / 2) /
      this.bars.height
    t = clamp(t, 0, 1)
    const lastNote = this.renderer.chart.notedata.at(-1)
    if (!lastNote) return
    const lastBeat = lastNote.beat + (isHoldNote(lastNote) ? lastNote.hold : 0)
    const lastSecond = this.renderer.chart.getSeconds(lastBeat)
    if (Options.chart.CMod) {
      this.renderer.chartManager.setTime(
        lerp(
          -this.renderer.chart.timingData.getTimingData("OFFSET"),
          lastSecond,
          t
        )
      )
    } else {
      this.renderer.chartManager.setBeat(lastBeat * t)
    }
  }

  renderThis() {
    const height = this.renderer.chartManager.app.renderer.screen.height - 40
    this.backing.height = height + 10
    this.backing.position.y = -this.backing.height / 2
    this.backing.position.x = -this.backing.width / 2
    this.bars.height = height
    this.x = this.renderer.chartManager.app.renderer.screen.width / 2 - 20
    const lastNote = this.renderer.chart.notedata.at(-1)
    if (!lastNote) {
      this.overlay.height = 0
      return
    }
    const lastBeat = lastNote.beat + (isHoldNote(lastNote) ? lastNote.hold : 0)
    const lastSecond = this.renderer.chart.getSeconds(lastBeat)
    const start = Options.chart.CMod
      ? this.renderer.getTimeFromYPos(
          -this.renderer.chartManager.app.renderer.screen.height / 2
        )
      : this.renderer.getBeatFromYPos(
          -this.renderer.chartManager.app.renderer.screen.height / 2,
          true
        )
    const end = Options.chart.CMod
      ? this.renderer.getTimeFromYPos(
          this.renderer.chartManager.app.renderer.screen.height / 2
        )
      : this.renderer.getBeatFromYPos(
          this.renderer.chartManager.app.renderer.screen.height / 2,
          true
        )
    let t_startY = unlerp(0, lastBeat, start)
    let t_endY = unlerp(0, lastBeat, end)
    if (Options.chart.CMod) {
      t_startY = unlerp(
        -this.renderer.chart.timingData.getTimingData("OFFSET"),
        lastSecond,
        start
      )
      t_endY = unlerp(
        -this.renderer.chart.timingData.getTimingData("OFFSET"),
        lastSecond,
        end
      )
    }
    t_startY = clamp(t_startY, 0, 1)
    t_endY = clamp(t_endY, 0, 1)
    const startY = (t_startY - 0.5) * (this.backing.height - 10)
    const endY = (t_endY - 0.5) * (this.backing.height - 10)
    this.overlay.y = startY
    this.overlay.height = endY - startY
    if (
      this.renderer.chartManager.app.renderer.screen.height !=
        this.lastHeight ||
      this.lastCMod != Options.chart.CMod
    ) {
      this.lastCMod = Options.chart.CMod
      this.lastHeight = this.renderer.chartManager.app.renderer.screen.height
      this.populate()
    }
  }

  populate() {
    let childIndex = 0
    const numCols = this.renderer.chart.gameType.numCols
    const lastNote = this.renderer.chart.notedata.at(-1)

    const height = this.renderer.chartManager.app.renderer.screen.height - 40
    this.backing.height = height
    this.backing.width = numCols * 6 + 8
    this.overlay.width = numCols * 6 + 8
    this.pivot.x = this.backing.width / 2

    this.barTexture.resize(numCols * 6, height)

    if (!lastNote) {
      destroyChildIf(this.barContainer.children, () => true)
      this.renderer.chartManager.app.renderer.render(this.barContainer, {
        renderTexture: this.barTexture,
      })
      return
    }
    const lastBeat = lastNote.beat + (isHoldNote(lastNote) ? lastNote.hold : 0)
    const lastSecond = this.renderer.chart.getSeconds(lastBeat)

    const songOffset = this.renderer.chart.timingData.getTimingData("OFFSET")

    this.renderer.chart.notedata.forEach(note => {
      let obj = this.barContainer.children[childIndex]
      if (!obj) {
        obj = new Sprite(Texture.WHITE)
        obj.width = 4
        this.barContainer.addChild(obj)
      }
      obj.anchor.set(0.5)
      obj.height = 1
      obj.x = (note.col + 0.5) * 6
      let t = unlerp(0, lastBeat, note.beat)
      if (Options.chart.CMod) t = unlerp(songOffset, lastSecond, note.second)
      obj.y = t * height
      obj.tint = QUANT_COLORS[getQuant(note.beat)]
      if (note.type == "Mine") obj.tint = 0x808080
      childIndex++
      if (isHoldNote(note)) {
        let h_obj = this.barContainer.children[childIndex]
        if (!h_obj) {
          h_obj = new Sprite(Texture.WHITE)
          h_obj.width = 4
          h_obj.height = 2
          this.barContainer.addChild(h_obj)
        }
        h_obj.anchor.x = 0.5
        h_obj.anchor.y = 0
        h_obj.x = (note.col + 0.5) * 6
        const y_end =
          (Options.chart.CMod
            ? this.renderer.chart.getSeconds(note.beat + note.hold) / lastSecond
            : (note.beat + note.hold) / lastBeat) *
            height +
          1
        h_obj.y = obj.y
        h_obj.height = y_end - obj.y
        if (note.type == "Hold") h_obj.tint = 0xa0a0a0
        if (note.type == "Roll") h_obj.tint = 0xada382
        childIndex++
      }
    })

    destroyChildIf(
      this.barContainer.children,
      (_, index) => index >= childIndex
    )

    this.renderer.chartManager.app.renderer.render(this.barContainer, {
      renderTexture: this.barTexture,
    })
  }
}
