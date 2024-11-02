import { Howl } from "howler/dist/howler.core.min.js"
import { App } from "../../App"
import { lerp, median, stdDev } from "../../util/Math"
import { Options } from "../../util/Options"
import { Window } from "./Window"

import metronomeHigh from "../../../assets/sound/metronome_high.wav"
import metronomeLow from "../../../assets/sound/metronome_low.wav"

interface TickLine {
  time: number
  beat: number
}
interface ResultLine {
  startTime: number
  offset: number
}

export class OffsetWindow extends Window {
  app: App
  metronomeInterval: NodeJS.Timeout
  startTime: number

  me_high: Howl = new Howl({
    src: metronomeHigh,
    volume: Options.audio.soundEffectVolume,
  })
  me_low: Howl = new Howl({
    src: metronomeLow,
    volume: Options.audio.soundEffectVolume,
  })

  tickLines: TickLine[] = []
  resultLines: ResultLine[] = []
  previousOffsets: number[] = []

  keyHandler: (e: KeyboardEvent) => void

  constructor(app: App) {
    super({
      title: "Offset Adjuster",
      width: 300,
      height: 200,
      win_id: "offset",
      blocking: true,
    })
    this.app = app
    this.initView()

    this.startTime = performance.now()
    let lastBeat = this.startTime + 500
    this.tickLines.push({ time: lastBeat + 500, beat: 0 })
    this.tickLines.push({ time: lastBeat + 500 * 2, beat: 1 })
    this.tickLines.push({ time: lastBeat + 500 * 3, beat: 2 })
    this.tickLines.push({ time: lastBeat + 500 * 4, beat: 3 })
    let beatNum = 0
    this.metronomeInterval = setInterval(() => {
      const time = performance.now()
      if (time - lastBeat > 500) {
        lastBeat = time
        const sound = beatNum % 4 == 0 ? this.me_high : this.me_low
        sound.play()
        while (this.tickLines[0]?.time + 1000 < time) this.tickLines.shift()
        this.tickLines.push({ time: lastBeat + 500 * 4, beat: beatNum + 4 })
        beatNum++
      }
      this.resultLines = this.resultLines.filter(
        line => time - line.startTime < 8000
      )
    }, 5)

    this.keyHandler = e => {
      if (
        e.code.startsWith("Digit") ||
        e.code.startsWith("Key") ||
        e.code == "Space"
      ) {
        let bestTick = this.tickLines[0]
        const time = performance.now()
        for (const tick of this.tickLines) {
          const offset = time - tick.time + Options.play.offset * 1000
          if (offset < 300) {
            bestTick = tick
            break
          }
        }
        e.preventDefault()
        const offset = time - bestTick.time + Options.play.offset * 1000
        if (offset > -300) {
          this.tickLines.splice(this.tickLines.indexOf(bestTick), 1)
          this.resultLines.push({
            startTime: performance.now(),
            offset,
          })
          this.previousOffsets.push(offset)
          if (this.previousOffsets.length == 16) {
            if (stdDev(this.previousOffsets) < 70) {
              Options.play.offset -= median(this.previousOffsets) / 1000
            }
            this.previousOffsets = []
          }
        }
      }
    }
    window.addEventListener("keydown", this.keyHandler)
  }

  initView() {
    this.viewElement.replaceChildren()
    const canvas = document.createElement("canvas")
    this.viewElement.appendChild(canvas)
    const frameDraw = this.drawEQ(canvas)
    requestAnimationFrame(frameDraw)
  }

  drawEQ(canvas: HTMLCanvasElement) {
    const ctx = canvas.getContext("2d")!
    ctx.canvas.width = 250
    ctx.canvas.height = 100
    const call = () => {
      ctx.fillStyle = "rgba(0, 0, 0, 1)"
      ctx.fillRect(0, 0, canvas.width, canvas.height)
      ctx.fillStyle = "rgb(255, 255, 255)"
      ctx.fillRect(canvas.width / 2 - 1, 8, 2, canvas.height - 16)
      const time = performance.now()
      for (const line of this.resultLines) {
        ctx.fillStyle = "rgba(255, 255, 255, 1)"
        const alpha = Math.min(1, 4 - (time - line.startTime) / 2000)
        if (line.offset < 0) {
          ctx.fillStyle = `rgba(160, ${lerp(
            160,
            0,
            -line.offset / 250
          )}, ${lerp(160, 0, -line.offset / 250)}, ${alpha})`
        }
        if (line.offset > 0) {
          ctx.fillStyle = `rgba(${lerp(160, 0, line.offset / 250)}, ${lerp(
            160,
            0,
            line.offset / 250
          )}, 160, ${alpha})`
        }
        ctx.fillRect(
          canvas.width / 2 - 0.5 + line.offset / 4,
          12,
          1,
          canvas.height - 24
        )
        if (time - line.startTime < 250) {
          const t = (time - line.startTime) / 250
          ctx.globalAlpha = 1 - t
          ctx.fillRect(
            canvas.width / 2 - 0.5 - t * 3 + line.offset / 4,
            12 - t * 10,
            1 + t * 6,
            canvas.height - 24 + t * 20
          )
        }
        ctx.globalAlpha = 1
      }
      for (const line of this.tickLines) {
        const delta = line.time - time - Options.play.offset * 1000
        ctx.fillStyle = "rgba(255, 255, 255, 0.8)"
        if (line.beat % 4 != 0) {
          ctx.fillRect(
            canvas.width / 2 - 1 - delta / 4,
            12,
            2,
            canvas.height - 24
          )
        } else {
          ctx.fillRect(
            canvas.width / 2 - 2 - delta / 4,
            12,
            4,
            canvas.height - 24
          )
        }
      }
      if (canvas.closest("#windows")) requestAnimationFrame(call)
    }
    return call
  }

  onClose(): void {
    clearInterval(this.metronomeInterval)
    window.removeEventListener("keydown", this.keyHandler)
  }
}
