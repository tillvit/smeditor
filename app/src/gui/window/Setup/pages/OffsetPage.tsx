import { Howl } from "howler/dist/howler.core.min.js"
import { useEffect, useRef, useState } from "react"
import metronomeHigh from "../../../../../assets/sound/metronome_high.wav"
import metronomeLow from "../../../../../assets/sound/metronome_low.wav"
import { useOption } from "../../../../util/Hooks"
import { lerp, median, stdDev } from "../../../../util/Math"
import { Options } from "../../../../util/Options"
import { SliderInput } from "../../../inputs/SliderInput"
import { SetupPageProps } from "../SetupWindow"

interface TickLine {
  time: number
  beat: number
}
interface ResultLine {
  startTime: number
  offset: number
}

const me_high = new Howl({
  src: metronomeHigh,
  volume: Options.audio.soundEffectVolume,
})
const me_low = new Howl({
  src: metronomeLow,
  volume: Options.audio.soundEffectVolume,
})

function OffsetSetup(props: {
  className?: string
  style?: React.CSSProperties
  update?: (numPresses: number) => void
}) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const ctx = useRef<CanvasRenderingContext2D | null>(null)
  const animId = useRef<number | null>(null)

  const startTime = useRef<number>(0)
  const lastBeat = useRef<number>(0)
  const tickLines = useRef<TickLine[]>([])
  const resultLines = useRef<ResultLine[]>([])
  const previousOffsets = useRef<number[]>([])

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    ctx.current = canvas.getContext("2d")
  }, [])

  const draw = () => {
    const context = ctx.current
    if (!context) return
    const speed = 0.7
    const height = canvasRef.current!.clientHeight * devicePixelRatio
    const width = canvasRef.current!.clientWidth * devicePixelRatio
    if (context.canvas.width != width || context.canvas.height != height) {
      context.canvas.width = width
      context.canvas.height = height
    }
    context.clearRect(0, 0, context.canvas.width, context.canvas.height)
    context.fillStyle = "rgba(0, 0, 0, 1)"
    context.fillRect(0, 0, context.canvas.width, context.canvas.height)
    context.fillStyle = "rgb(255, 255, 255)"
    context.fillRect(
      context.canvas.width / 2 - 1,
      8,
      2,
      context.canvas.height - 16
    )
    const time = performance.now()
    for (const line of resultLines.current) {
      context.fillStyle = "rgba(255, 255, 255, 1)"
      const alpha = Math.min(1, 4 - (time - line.startTime) / 2000)
      if (line.offset < 0) {
        context.fillStyle = `rgba(160, ${lerp(
          160,
          0,
          -line.offset / 250
        )}, ${lerp(160, 0, -line.offset / 250)}, ${alpha})`
      }
      if (line.offset > 0) {
        context.fillStyle = `rgba(${lerp(160, 0, line.offset / 250)}, ${lerp(
          160,
          0,
          line.offset / 250
        )}, 160, ${alpha})`
      }
      context.fillRect(
        context.canvas.width / 2 - 0.5 + line.offset * speed,
        12,
        1,
        context.canvas.height - 24
      )
      if (time - line.startTime < 250) {
        const t = (time - line.startTime) / 250
        context.globalAlpha = 1 - t
        context.fillRect(
          context.canvas.width / 2 - 0.5 - t * 3 + line.offset * speed,
          12 - t * 10,
          1 + t * 6,
          context.canvas.height - 24 + t * 20
        )
      }
      context.globalAlpha = 1
    }
    for (const line of tickLines.current) {
      const delta = line.time - time - Options.play.offset * 1000
      context.fillStyle = "rgba(255, 255, 255, 0.8)"
      if (line.beat % 4 != 0) {
        context.fillRect(
          context.canvas.width / 2 - 1 - delta * speed,
          12,
          2,
          context.canvas.height - 24
        )
      } else {
        context.fillRect(
          context.canvas.width / 2 - 2 - delta * speed,
          12,
          4,
          context.canvas.height - 24
        )
      }
    }

    animId.current = requestAnimationFrame(draw)
  }

  useEffect(() => {
    animId.current = requestAnimationFrame(draw)
    startTime.current = performance.now()
    lastBeat.current = startTime.current + 500
    tickLines.current.push({ time: lastBeat.current + 500, beat: 0 })
    tickLines.current.push({ time: lastBeat.current + 500 * 2, beat: 1 })
    tickLines.current.push({ time: lastBeat.current + 500 * 3, beat: 2 })
    tickLines.current.push({ time: lastBeat.current + 500 * 4, beat: 3 })
    let beatNum = 0
    const metronomeInterval = setInterval(() => {
      const time = performance.now()
      if (time - lastBeat.current > 500) {
        lastBeat.current = time
        const sound = beatNum % 4 == 0 ? me_high : me_low
        sound.play()
        while (tickLines.current[0]?.time + 1000 < time)
          tickLines.current.shift()
        tickLines.current.push({
          time: lastBeat.current + 500 * 4,
          beat: beatNum + 4,
        })
        beatNum++
      }
      resultLines.current = resultLines.current.filter(
        line => time - line.startTime < 8000
      )
    }, 5)
    return () => {
      clearInterval(metronomeInterval)
      if (animId.current !== null) {
        cancelAnimationFrame(animId.current)
      }
    }
  }, [])

  useEffect(() => {
    const keyHandler = (e: KeyboardEvent) => {
      if (
        e.code.startsWith("Digit") ||
        e.code.startsWith("Key") ||
        e.code == "Space"
      ) {
        let bestTick = tickLines.current[0]
        const time = performance.now()
        for (const tick of tickLines.current) {
          const offset = time - tick.time + Options.play.offset * 1000
          if (offset < 300) {
            bestTick = tick
            break
          }
        }
        e.preventDefault()
        const offset = time - bestTick.time + Options.play.offset * 1000
        if (offset > -300) {
          tickLines.current.splice(tickLines.current.indexOf(bestTick), 1)
          resultLines.current.push({
            startTime: performance.now(),
            offset,
          })
          previousOffsets.current.push(offset)

          if (previousOffsets.current.length == 16) {
            if (stdDev(previousOffsets.current) < 70) {
              Options.play.offset -= median(previousOffsets.current) / 1000
            }
            previousOffsets.current = []
          }
          props.update?.(previousOffsets.current.length)
        }
      }
    }
    window.addEventListener("keydown", keyHandler)
    return () => {
      window.removeEventListener("keydown", keyHandler)
    }
  }, [props.update])

  return (
    <canvas
      ref={canvasRef}
      style={props.style}
      className={props.className}
    ></canvas>
  )
}

export function OffsetPage(props: SetupPageProps) {
  const [numPresses, setNumPresses] = useState(0)
  const offset = useOption<number>("play.offset")

  useEffect(() => {
    props.setValid(true)
  }, [])

  return (
    <div className="flex-column-full" style={{ flex: 1, height: 0 }}>
      <h3>Set up your offset</h3>
      Press any key when you hear the metronome.
      <div
        style={{
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          width: "100%",
        }}
      >
        <OffsetSetup
          style={{
            height: "5rem",
            marginTop: "0.5rem",
            marginBottom: "0.5rem",
            width: "100%",
          }}
          update={p => setNumPresses(p)}
        />
        <p>{numPresses}/16 presses</p>
      </div>
      <div
        className="pref-item"
        style={{
          marginTop: "1.5rem",
        }}
      >
        <label>Current offset:</label>
        <SliderInput
          value={offset}
          min={-1}
          max={1}
          step={0.001}
          precision={3}
          hardMin={-(2 ** 31 - 1)}
          hardMax={2 ** 31 - 1}
          onChange={v => (Options.play.offset = v!)}
        />
      </div>
      <div className="detail">
        Turn down if you are hitting late and up if you are hitting early.
      </div>
    </div>
  )
}
