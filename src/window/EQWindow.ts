import { App } from "../App"
import { Window } from "./Window"

export class EQWindow extends Window {
  app: App

  constructor(app: App) {
    super({
      title: "Audio Equalizer",
      width: 600,
      height: 200,
      win_id: "audio-eq",
    })
    this.app = app
    this.initView()
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
    const freqLines = [
      20, 30, 40, 50, 60, 70, 80, 90, 100, 200, 300, 400, 500, 600, 700, 800,
      900, 1000, 2000, 3000, 4000, 5000, 6000, 7000, 8000, 9000, 10000,
    ]
    const freqLabels = [
      "20",
      "30",
      "40",
      "50",
      "60",
      "",
      "80",
      "",
      "100",
      "200",
      "300",
      "400",
      "500",
      "600",
      "",
      "800",
      "",
      "1k",
      "2k",
      "3k",
      "4k",
      "5k",
      "6k",
      "",
      "8k",
      "",
      "10k",
    ]
    const freqLinesX: number[] = []
    for (const freq of freqLines) {
      freqLinesX.push(Math.floor((Math.log(freq / 20) / Math.log(500)) * 1170))
    }
    ctx.canvas.width = 1200
    ctx.canvas.height = 400
    const call = () => {
      if (!this.app.chartManager.chartAudio) return
      ctx.fillStyle = "rgba(0, 0, 0, 1)"
      ctx.fillRect(0, 0, canvas.width, canvas.height)
      const freqData = this.app.chartManager.chartAudio.getFrequencyData()
      ctx.fillStyle = "rgb(0, 50, 150)"
      for (let x = 0; x < 1200; x++) {
        const freq = Math.pow(500, x / 1170) * 20
        const bin =
          (freq / this.app.chartManager.chartAudio.getSampleRate()) *
          2 *
          this.app.chartManager.chartAudio.getFFTSize()
        const y = freqData[Math.floor(bin)] / 255
        ctx.fillRect(x, 400 - y * 500, 1, y * 500)
      }
      ctx.fillStyle = "rgba(0, 100, 150, 1)"
      ctx.font = "22px Assistant"
      for (let i = 0; i < freqLines.length; i++) {
        let x = freqLinesX[i]
        ctx.fillRect(x, 0, 1, 400)
        if (i == freqLines.length - 1) x -= 20
        ctx.fillText(freqLabels[i], x, 200)
      }
      for (let i = -10; i < 10; i += 2) {
        const y = -i * (400 / 20) + 200
        ctx.fillRect(0, y, 1200, 1)
        if (i != 0) ctx.fillText(i + "", 0, y)
      }
      ctx.fillRect(0, 200, 1200, 1)
      ctx.fillStyle = "rgba(0, 100, 150,0.5)"
      // let bodePlot = this.app.chartManager.songAudio.getBodePlot(1200)
      // for (let x = 0; x < 1200; x++) {
      //   let gain = bodePlot[x]
      //   ctx.fillRect(x, 200, 1, -gain*(400/20));
      // }
      if (canvas.closest("#windows")) requestAnimationFrame(call)
    }
    return call
  }
}
