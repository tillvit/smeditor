import { Color } from "pixi.js"
import {
  Dispatch,
  RefObject,
  SetStateAction,
  useContext,
  useEffect,
  useRef,
} from "react"
import { average, blendPixiColors } from "../../../util/Color"
import { Options } from "../../../util/Options"
import { Themes } from "../../../util/Theme"
import { WindowContext } from "../WindowManager"
import { EQPoint } from "./EQPoint"
import {
  EQGraphHeight,
  EQGraphLeft,
  EQGraphTop,
  EQGraphWidth,
  freqToX,
  gainToY,
  xToFreq,
} from "./EQWindow"

const FREQUENCY_LINES = [
  { freq: 20, label: "20" },
  { freq: 30, label: "30" },
  { freq: 40, label: "40" },
  { freq: 50, label: "50" },
  { freq: 60, label: "60" },
  { freq: 70, label: "" },
  { freq: 80, label: "80" },
  { freq: 90, label: "" },
  { freq: 100, label: "100" },
  { freq: 200, label: "200" },
  { freq: 300, label: "300" },
  { freq: 400, label: "400" },
  { freq: 500, label: "500" },
  { freq: 600, label: "600" },
  { freq: 700, label: "" },
  { freq: 800, label: "800" },
  { freq: 900, label: "" },
  { freq: 1000, label: "1k" },
  { freq: 2000, label: "2k" },
  { freq: 3000, label: "3k" },
  { freq: 4000, label: "4k" },
  { freq: 5000, label: "5k" },
  { freq: 6000, label: "6k" },
  { freq: 7000, label: "" },
  { freq: 8000, label: "8k" },
  { freq: 9000, label: "" },
  { freq: 10000, label: "10k" },
  { freq: 15000, label: "" },
  { freq: 20000, label: "20k" },
]

export function EQCanvas(props: {
  response: RefObject<number[]>
  points: RefObject<EQPoint[]>
  setFilterIndex: Dispatch<SetStateAction<number | null>>
}) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const app = useContext(WindowContext)!.app

  function drawEQ(canvas: HTMLCanvasElement) {
    const ctx = canvas.getContext("2d")!
    ctx.canvas.width = 1200
    ctx.canvas.height = 400
    const call = () => {
      if (!app.chartManager.chartAudio) return

      const gradient = ctx.createRadialGradient(
        canvas.width / 2,
        canvas.height / 2,
        0,
        canvas.width / 2,
        canvas.height / 2,
        canvas.width / 2
      )

      let targetColor
      let reverseColor
      const accentColor = Themes.getColor("accent-color")
      if (average(Themes.getColor("primary-bg")) > 0.5) {
        targetColor = new Color("white")
        reverseColor = new Color("black")
      } else {
        targetColor = new Color("black")
        reverseColor = new Color("white")
      }
      const bgColor = blendPixiColors(accentColor, targetColor, 0.95)

      gradient.addColorStop(
        0,
        blendPixiColors(accentColor, targetColor, 0.9).toHexa()
      )
      gradient.addColorStop(1, bgColor.toHexa())

      // Set the fill style and draw a rectangle
      ctx.fillStyle = gradient
      ctx.fillRect(0, 0, canvas.width, canvas.height)

      ctx.fillStyle = blendPixiColors(accentColor, targetColor, 0.2).toHex()
      drawFrequencies(ctx, app.chartManager.chartAudio.getFrequencyData())
      if (app.chartManager.chartAudio.hasFilters()) {
        ctx.fillStyle =
          blendPixiColors(accentColor, reverseColor, 0.2).toHex() + "50"
        drawFrequencies(
          ctx,
          app.chartManager.chartAudio.getFilteredFrequencyData()
        )
      }

      ctx.fillStyle = "rgba(200, 200, 200, 0.5)"
      drawResponse(ctx)
      ctx.fillStyle =
        blendPixiColors(accentColor, reverseColor, 0.2).toHex() + "80"
      ctx.font = "22px Assistant"
      drawGrid(ctx)
      props.points.current.forEach(point => point.draw(ctx))
      if (canvas.closest("#windows")) requestAnimationFrame(call)
    }
    return call
  }

  function drawFrequencies(ctx: CanvasRenderingContext2D, data: Uint8Array) {
    for (let x = 0; x < EQGraphWidth; x++) {
      const bin =
        (xToFreq(x) / app.chartManager.chartAudio.getSampleRate()) *
        app.chartManager.chartAudio.getFFTSize()
      const y = data[Math.floor(bin)] / 255
      ctx.fillRect(
        EQGraphLeft + x,
        EQGraphTop + EQGraphHeight - y * EQGraphHeight,
        1,
        y * EQGraphHeight
      )
    }
  }

  function drawResponse(ctx: CanvasRenderingContext2D) {
    for (let x = 0; x < EQGraphWidth; x++) {
      const gain = Math.log(props.response.current[x]) / 0.115241
      const y = gainToY(gain)
      ctx.fillRect(
        x + EQGraphLeft,
        Math.min(y, EQGraphHeight / 2) + EQGraphTop,
        1,
        Math.max(y, EQGraphHeight / 2) - Math.min(y, EQGraphHeight / 2)
      )
    }
  }

  function drawGrid(ctx: CanvasRenderingContext2D) {
    for (const freqLine of FREQUENCY_LINES) {
      ctx.fillRect(
        EQGraphLeft + freqToX(freqLine.freq),
        EQGraphTop,
        1,
        EQGraphHeight
      )

      ctx.fillText(
        freqLine.label,
        EQGraphLeft +
          freqToX(freqLine.freq) -
          (freqLine == FREQUENCY_LINES.at(-1) ? 20 : 0),
        EQGraphTop + EQGraphHeight / 2
      )
    }
    for (let i = -25; i <= 25; i += 5) {
      const y = EQGraphTop + gainToY(i)
      ctx.fillRect(0, y, 1200, 1)
      if (i != 0) ctx.fillText(i + "", EQGraphLeft, y)
    }
  }

  function handleMouseMove(event: React.MouseEvent) {
    const hitPoint = props.points.current
      .filter(point =>
        point.hitTest(
          (event.nativeEvent.offsetX * 2) / Options.general.uiScale,
          (event.nativeEvent.offsetY * 2) / Options.general.uiScale
        )
      )
      .at(-1)
    props.points.current.forEach(point => point.unhighlight())
    hitPoint?.highlight()
    if (hitPoint) {
      props.setFilterIndex(hitPoint.filterIndex)
    }
  }

  function handleMouseDown(event: React.MouseEvent) {
    const hitPoint = props.points.current
      .filter(point =>
        point.hitTest(
          (event.nativeEvent.offsetX * 2) / Options.general.uiScale,
          (event.nativeEvent.offsetY * 2) / Options.general.uiScale
        )
      )
      .at(-1)
    if (hitPoint) {
      props.setFilterIndex(hitPoint.filterIndex)
    } else {
      props.setFilterIndex(null)
    }
    hitPoint?.mouseDown(event.nativeEvent)
  }

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext("2d")
    if (!ctx) return
    const frameDraw = drawEQ(canvas)
    requestAnimationFrame(frameDraw)
  }, [canvasRef])

  return (
    <canvas
      ref={canvasRef}
      style={{ width: "37.5rem", height: "12.5rem" }}
      onMouseMove={handleMouseMove}
      onMouseDown={handleMouseDown}
    ></canvas>
  )
}
