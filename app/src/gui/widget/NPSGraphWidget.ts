import {
  FederatedPointerEvent,
  ParticleContainer,
  RenderTexture,
  Sprite,
  Texture,
  Graphics,
} from "pixi.js"
import { EditMode } from "../../chart/ChartManager"
import { QUANT_COLORS } from "../../chart/component/edit/SnapContainer"
import { Chart } from "../../chart/sm/Chart"
import { isHoldNote } from "../../chart/sm/NoteTypes"
import { BetterRoundedRect } from "../../util/BetterRoundedRect"
import { EventHandler } from "../../util/EventHandler"
import { Flags } from "../../util/Flags"
import { clamp, lerp, unlerp } from "../../util/Math"
import { Options } from "../../util/Options"
import { destroyChildIf, getDivision } from "../../util/Util"
import { Widget } from "./Widget"
import { WidgetManager } from "./WidgetManager"

export class NPSGraphWidget extends Widget {
  barContainer = new ParticleContainer(
    1500,
    { position: true, scale: true, tint: true },
    16384,
    true
  )
  backing: BetterRoundedRect = new BetterRoundedRect()
  bars: Sprite
  barTexture: RenderTexture
  overlay: Sprite = new Sprite(Texture.WHITE)
  npsGraph: Graphics

  private lastHeight = 0
  private lastCMod
  private mouseDown = false
  private queued = false
  private graphGradient: Texture | null = null

  private graphWidth: number = 40

  constructor(manager: WidgetManager) {
    super(manager)
    this.graphGradient = this.makeGradient()
    this.addChild(this.backing)
    this.visible = false
    this.backing.tint = 0
    this.backing.alpha = 0.3
    this.barTexture = RenderTexture.create({
      resolution: this.manager.app.renderer.resolution,
    })
    this.bars = new Sprite(this.barTexture)
    this.bars.anchor.set(0.5)
    this.addChild(this.bars)

    this.npsGraph = new Graphics()
    this.addChild(this.npsGraph)

    this.overlay.anchor.x = 0.5
    this.overlay.anchor.y = 0
    this.overlay.alpha = 0.3
    this.lastCMod = Options.chart.CMod
    this.addChild(this.overlay)
    this.x = this.manager.app.renderer.screen.width / 2 - 20

    this.setupEventHandlers()
  }

  private setupEventHandlers() {
    EventHandler.on("chartLoaded", () => {
      this.queued = false
      this.populate()
    })
    EventHandler.on("chartModifiedAfter", () => {
      if (!this.queued) this.populate()
      this.queued = true
    })
    const interval = setInterval(() => {
      if (this.queued) {
        this.queued = false
        this.populate()
      }
    }, 3000)

    EventHandler.on("userOptionUpdated", optionId => {
      if (
        optionId == "chart.npsGraph.color1" ||
        optionId == "chart.npsGraph.color2"
      ) {
        this.graphGradient = this.makeGradient()
        this.populate()
      }
    })
    this.on("destroyed", () => clearInterval(interval))
    this.populate()

    this.eventMode = "static"
    this.on("mousedown", event => {
      this.mouseDown = true
      this.handleMouse(event)
    })
    this.on("mousemove", event => {
      if (this.mouseDown) this.handleMouse(event)
    })
    window.onmouseup = () => {
      this.mouseDown = false
    }
  }

  private handleMouse(event: FederatedPointerEvent) {
    if (this.manager.chartManager.getMode() == EditMode.Play) return
    if (!this.getChart()) return
    let t =
      (this.bars.toLocal(event.global).y + this.bars.height / 2) /
      this.bars.height
    t = clamp(t, 0, 1)
    const lastNote = this.getChart().getNotedata().at(-1)
    if (!lastNote) return
    const lastBeat = lastNote.beat + (isHoldNote(lastNote) ? lastNote.hold : 0)
    const lastSecond = this.getChart().getSecondsFromBeat(lastBeat)
    if (Options.chart.CMod) {
      this.manager.chartManager.setTime(
        lerp(-this.getChart().timingData.getOffset(), lastSecond, t)
      )
    } else {
      this.manager.chartManager.setBeat(lastBeat * t)
    }
  }

  update() {
    if (!Options.chart.npsGraph.enabled) {
      this.visible = false
      return
    }
    this.scale.y = Options.chart.reverse ? -1 : 1
    const height = this.manager.app.renderer.screen.height - 40
    this.backing.height = height + 10
    this.backing.position.y = -this.backing.height / 2
    this.backing.position.x = -this.backing.width / 2
    this.bars.height = height
    this.x = this.manager.app.renderer.screen.width / 2 - 60
    const chart = this.getChart()
    const chartView = this.manager.chartManager.chartView!
    if (!chart || !chartView || !Flags.layout) {
      this.visible = false
      return
    }
    this.visible = true
    const lastNote = chart.getNotedata().at(-1)
    if (!lastNote) {
      this.overlay.height = 0
      return
    }
    const lastBeat = lastNote.beat + (isHoldNote(lastNote) ? lastNote.hold : 0)
    const lastSecond = chart.getSecondsFromBeat(lastBeat)
    const start = Options.chart.CMod
      ? chartView.getSecondFromYPos(
          -this.manager.app.renderer.screen.height / 2
        )
      : chartView.getBeatFromYPos(
          -this.manager.app.renderer.screen.height / 2,
          true
        )
    const end = Options.chart.CMod
      ? chartView.getSecondFromYPos(this.manager.app.renderer.screen.height / 2)
      : chartView.getBeatFromYPos(
          this.manager.app.renderer.screen.height / 2,
          true
        )
    let t_startY = unlerp(0, lastBeat, start)
    let t_endY = unlerp(0, lastBeat, end)
    if (Options.chart.CMod) {
      t_startY = unlerp(-chart.timingData.getOffset(), lastSecond, start)
      t_endY = unlerp(-chart.timingData.getOffset(), lastSecond, end)
    }
    t_startY = clamp(t_startY, 0, 1)
    t_endY = clamp(t_endY, 0, 1)
    if (t_startY > t_endY) [t_startY, t_endY] = [t_endY, t_startY]
    const startY = (t_startY - 0.5) * (this.backing.height - 10)
    const endY = (t_endY - 0.5) * (this.backing.height - 10)
    this.overlay.y = startY
    this.overlay.height = endY - startY
    this.overlay.height = Math.max(2, this.overlay.height)
    if (
      this.manager.app.renderer.screen.height != this.lastHeight ||
      this.lastCMod != Options.chart.CMod
    ) {
      this.lastCMod = Options.chart.CMod
      this.lastHeight = this.manager.app.renderer.screen.height
      this.populate()
    }
  }

  populate() {
    const chart = this.getChart()
    if (!chart) {
      destroyChildIf(this.barContainer.children, () => true)

      this.manager.app.renderer.render(this.barContainer, {
        renderTexture: this.barTexture,
      })
      return
    }
    const childIndex = 0
    const lastNote = chart.getNotedata().at(-1)
    const firstNote = chart.getNotedata().at(0)

    const height = this.manager.app.renderer.screen.height - 40
    this.backing.height = height
    this.backing.width = this.graphWidth + 8
    this.overlay.width = this.graphWidth + 8
    this.pivot.x = this.backing.width / 2

    this.barTexture.resize(this.graphWidth, height)

    if (!lastNote || !firstNote) {
      destroyChildIf(this.barContainer.children, () => true)
      this.manager.app.renderer.render(this.barContainer, {
        renderTexture: this.barTexture,
      })
      return
    }
    const lastBeat = lastNote.beat + (isHoldNote(lastNote) ? lastNote.hold : 0)
    const lastSecond = chart.getSecondsFromBeat(lastBeat)
    const songOffset = chart.timingData.getOffset()

    const maxNps = chart.getMaxNPS()
    const npsGraph = chart.getNPSGraph()

    this.npsGraph.clear()
    // this.graph.lineStyle(2, 0xffffff, 1)
    if (this.graphGradient) {
      this.npsGraph.beginTextureFill({ texture: this.graphGradient })
    } else {
      this.npsGraph.beginFill(0x000000, 1)
    }

    this.npsGraph.pivot.x = this.backing.width / 2
    this.npsGraph.pivot.y = height / 2

    const lastMeasure = npsGraph.length

    const startY = this.getY(lastBeat, songOffset, lastSecond, 0, height)
    this.npsGraph.moveTo(0, startY)

    for (let measureIndex = 0; measureIndex < lastMeasure; measureIndex++) {
      const nps = npsGraph[measureIndex] || 0
      const beat = chart.timingData.getBeatFromMeasure(measureIndex)
      const endOfMeasureBeat = Math.min(
        lastBeat,
        chart.timingData.getBeatFromMeasure(measureIndex + 1)
      )
      const x = unlerp(0, maxNps, nps) * this.graphWidth
      const y = this.getY(lastBeat, songOffset, lastSecond, beat, height)
      const endOfMeasureY = this.getY(
        lastBeat,
        songOffset,
        lastSecond,
        endOfMeasureBeat,
        height
      )

      this.npsGraph.lineTo(x, y)
      this.npsGraph.lineTo(x, endOfMeasureY)
    }

    const lastnps = npsGraph.at(-1)!
    const lastX = unlerp(0, maxNps, lastnps) * this.graphWidth
    const lastY = this.getY(lastBeat, songOffset, lastSecond, lastBeat, height)
    this.npsGraph.lineTo(lastX, lastY)
    this.npsGraph.lineTo(0, lastY)
    this.npsGraph.endFill()
    destroyChildIf(
      this.barContainer.children,
      (_, index) => index >= childIndex
    )

    this.manager.app.renderer.render(this.barContainer, {
      renderTexture: this.barTexture,
    })
  }

  private getY(
    lastBeat: number,
    songOffset: number,
    lastSecond: number,
    beat: number,
    height: number
  ): number {
    let t = unlerp(0, lastBeat, beat)
    if (Options.chart.CMod) {
      const second = this.getChart().timingData.getSecondsFromBeat(beat)
      t = unlerp(songOffset, lastSecond, second)
    }
    return t * height
  }
  private getChart(): Chart {
    return this.manager.chartManager.loadedChart!
  }

  private makeGradient() {
    const quality = this.graphWidth
    const canvas = document.createElement("canvas")

    canvas.width = quality
    canvas.height = quality

    const ctx = canvas.getContext("2d")

    if (ctx == null) {
      return null
    }
    // use canvas2d API to create gradient
    const grd = ctx.createLinearGradient(0, 0, quality, 0)

    const color1 = `#${Options.chart.npsGraph.color1.toString(16)}`
    const color2 = `#${Options.chart.npsGraph.color2.toString(16)}`
    grd.addColorStop(0, color1)
    grd.addColorStop(0.8, color2)

    ctx.fillStyle = grd
    ctx.fillRect(0, 0, quality, quality)

    return Texture.from(canvas)
  }
}
