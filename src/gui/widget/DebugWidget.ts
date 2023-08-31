import {
  BitmapText,
  Container,
  ParticleContainer,
  Sprite,
  Texture,
} from "pixi.js"
import { BetterRoundedRect } from "../../util/BetterRoundedRect"
import { Options } from "../../util/Options"
import { clamp, getFPS, getTPS, roundDigit } from "../../util/Util"
import { Widget } from "./Widget"
import { WidgetManager } from "./WidgetManager"

const GRAPH_HEIGHT = 50

export class DebugWidget extends Widget {
  static instance?: DebugWidget

  private frameTimeGraph = new DebugGraph({
    width: 300,
    height: GRAPH_HEIGHT,
    color: 0x174523,
    min: 0,
    unit: "ms",
    label: "Draw",
    precision: 1,
    sublabel: () => getFPS() + " FPS",
  })

  private drawUpdateTimeGraph = new DebugGraph({
    width: 300,
    height: GRAPH_HEIGHT,
    color: 0x5c1626,
    min: 0,
    unit: "ms",
    label: "DrawUpdate",
    precision: 1,
  })

  private updateTimeGraph = new DebugGraph({
    width: 300,
    height: GRAPH_HEIGHT,
    color: 0x172245,
    min: 0,
    unit: "ms",
    label: "Update",
    precision: 1,
    sublabel: () => getTPS() + " TPS",
  })

  private memoryTimeGraph = new DebugGraph({
    width: 300,
    height: GRAPH_HEIGHT,
    color: 0x651c66,
    min: 0,
    formatter: value => Math.round(value / 1048576) + " MB",
    label: "Memory",
  })

  private cpuGraph = new DebugGraph({
    width: 300,
    height: GRAPH_HEIGHT,
    color: 0x4f341d,
    min: 0,
    label: "CPU",
  })

  private graphs = new Container<DebugGraph>()
  private fpsCounter = new Container()

  private fpsBg = new BetterRoundedRect()
  private fpsText = new BitmapText("", {
    fontName: "Main",
    fontSize: 12,
  })
  private lastFrameTime = 0

  constructor(manager: WidgetManager) {
    super(manager)
    this.drawUpdateTimeGraph.y += GRAPH_HEIGHT + 5
    this.updateTimeGraph.y += (GRAPH_HEIGHT + 5) * 2
    this.memoryTimeGraph.y += (GRAPH_HEIGHT + 5) * 3
    this.cpuGraph.y += (GRAPH_HEIGHT + 5) * 4
    DebugWidget.instance = this

    this.fpsBg.tint = 0
    this.fpsBg.alpha = 0.5
    this.fpsText.x = 5
    this.fpsBg.y = -5

    this.graphs.addChild(
      this.frameTimeGraph,
      this.drawUpdateTimeGraph,
      this.updateTimeGraph
    )

    if (performance.memory) this.graphs.addChild(this.memoryTimeGraph)
    this.fpsCounter.addChild(this.fpsBg, this.fpsText)

    this.addChild(this.graphs, this.fpsCounter)
  }
  update() {
    this.x = -this.manager.app.renderer.screen.width / 2 + 20
    this.y = -this.manager.app.renderer.screen.height / 2 + 20

    this.graphs.children.forEach(graph => graph.update())

    this.graphs.visible = Options.debug.showTimers
    this.fpsCounter.visible = Options.debug.showFPS

    this.fpsText.text = `${getFPS()} FPS\n${getTPS()} TPS\n${this.lastFrameTime.toFixed(
      2
    )} ms\n`
    this.fpsBg.width = this.fpsText.width + 10
    this.fpsBg.height = this.fpsText.height + 10
    if (Options.debug.showTimers) {
      this.fpsBg.y = (GRAPH_HEIGHT + 5) * (this.children.length + 2) - 5
      this.fpsText.y = (GRAPH_HEIGHT + 5) * (this.children.length + 2)
    } else {
      this.fpsBg.y = -5
      this.fpsText.y = 0
    }
  }

  addMemoryTimeValue(value: number) {
    this.memoryTimeGraph.addValue(value)
  }

  addFrameTimeValue(value: number) {
    this.lastFrameTime = value
    this.frameTimeGraph.addValue(value)
  }

  addUpdateTimeValue(value: number) {
    this.updateTimeGraph.addValue(value)
  }

  addDrawUpdateTimeValue(value: number) {
    this.drawUpdateTimeGraph.addValue(value)
  }
}

interface DebugLine extends Sprite {
  value: number
}

interface DebugGraphOptions {
  width: number
  height: number
  color?: number
  unit?: string
  min?: number
  max?: number
  precision?: number
  formatter?: (value: number) => string
  label?: string
  sublabel?: () => string
}

class DebugGraph extends Container {
  private graphWidth
  private graphHeight
  private color
  private unit
  private precision
  private formatter
  private sublabel

  private maxEase = 1
  private targetMax = 1
  private minEase = 1
  private targetMin = 1
  private constrainedMin: number | null = null
  private constrainedMax: number | null = null
  private dataPoints: number[] = []
  private linePool: DebugLine[] = []
  private lineContainer
  private labelText
  private sublabelText
  private topText
  private bottomText
  constructor(options: DebugGraphOptions) {
    super()
    const {
      width,
      height,
      color = 0xffffff,
      unit = "",
      label = "",
      min = null,
      max = null,
      precision = 0,
      formatter = null,
      sublabel = () => "",
    } = options
    this.graphWidth = width
    this.graphHeight = height
    this.color = color
    this.unit = unit
    this.constrainedMax = max
    this.constrainedMin = min
    this.precision = precision
    this.formatter = formatter
    this.sublabel = sublabel

    this.lineContainer = new ParticleContainer(
      width,
      { position: true },
      16384,
      true
    )
    const bg = new BetterRoundedRect()
    bg.tint = 0
    bg.alpha = 0.3
    bg.width = this.graphWidth
    bg.height = this.graphHeight

    this.labelText = new BitmapText(label, {
      fontName: "Main",
      fontSize: Math.min(height / 5, 16),
    })

    this.labelText.alpha = 0.8

    this.sublabelText = new BitmapText("", {
      fontName: "Main",
      fontSize: Math.min(height / 5, 16),
    })

    this.topText = new BitmapText("", {
      fontName: "Main",
      fontSize: Math.min(height / 7, 12),
    })
    this.topText.anchor.x = 1
    this.topText.alpha = 0.5
    this.topText.x = this.graphWidth
    this.bottomText = new BitmapText("", {
      fontName: "Main",
      fontSize: Math.min(height / 7, 12),
    })
    this.bottomText.anchor.x = 1
    this.bottomText.anchor.y = 1
    this.bottomText.alpha = 0.5
    this.bottomText.x = this.graphWidth
    this.bottomText.y = this.graphHeight
    this.sublabelText.y = this.graphHeight
    this.sublabelText.anchor.y = 1
    this.sublabelText.alpha = 0.5
    this.addChild(
      bg,
      this.lineContainer,
      this.labelText,
      this.sublabelText,
      this.topText,
      this.bottomText
    )
  }

  addValue(value: number) {
    if (this.lineContainer.children[0]?.x + this.lineContainer.x < 0) {
      const line = this.lineContainer.children[0]
      this.dataPoints.shift()
      this.removeChild(line)
      this.linePool.push(line as DebugLine)
    }
    this.lineContainer.x -= 1
    if (this.lineContainer.x < -1e7) {
      this.lineContainer.children.forEach(line => {
        line.x -= 1e7
      })
      this.lineContainer.x += 1e7
    }
    const line =
      this.linePool.shift() ?? (new Sprite(Texture.WHITE) as DebugLine)
    line.width = 1
    line.anchor.x = 0.5
    line.anchor.y = 1
    line.tint = this.color
    line.alpha = 0.6
    line.x = this.graphWidth - this.lineContainer.x
    line.y = this.graphHeight
    line.value = value
    this.dataPoints.push(value)
    this.targetMax =
      this.constrainedMax !== null
        ? this.constrainedMax
        : Math.max(...this.dataPoints)
    this.targetMin =
      this.constrainedMin !== null
        ? this.constrainedMin
        : Math.min(...this.dataPoints)
    this.lineContainer.addChild(line)
  }

  update() {
    if (this.dataPoints.length == 0) return
    this.maxEase = (this.maxEase - this.targetMax) * 0.1 + this.targetMax
    this.minEase = (this.minEase - this.targetMin) * 0.1 + this.targetMin
    this.lineContainer.children.forEach(line => {
      line.height =
        clamp(((line as DebugLine).value - this.minEase) / this.maxEase, 0, 1) *
        this.graphHeight
    })
    this.topText.text =
      this.formatter?.(this.maxEase) ??
      `${roundDigit(this.maxEase, this.precision)} ${this.unit}`
    this.bottomText.text =
      this.formatter?.(this.minEase) ??
      `${roundDigit(this.minEase, this.precision)} ${this.unit}`
    this.sublabelText.text = this.sublabel()
  }
}
