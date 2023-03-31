// Will be deleted soon in favor of OfflineAudioContext

interface BiquadOptions {
  sampleRate: number
  frequency: number
  bandwidth: number
  gain: number
}

type BiquadType =
  | "lowpass"
  | "highpass"
  | "bandpass"
  | "notch"
  | "peaking"
  | "lowshelf"
  | "highshelf"

// https://www.musicdsp.org/en/latest/Filters/64-biquad-c-code.html
export class BiquadFilter {
  enabled = true

  private b0 = 0
  private b1 = 0
  private b2 = 0
  private a1 = 0
  private a2 = 0
  private x1 = 0
  private x2 = 0
  private y1 = 0
  private y2 = 0

  private options: BiquadOptions
  private type: BiquadType

  constructor(
    type: "lowpass" | "highpass" | "bandpass" | "notch",
    options: { sampleRate: number; frequency: number; bandwidth: number }
  )
  constructor(
    type: "peaking" | "lowshelf" | "highshelf",
    options: BiquadOptions
  )
  constructor(type: BiquadType, options: BiquadOptions) {
    if (!options.gain) options.gain = 0
    this.options = options
    this.type = type
    this.calculateCoefficients()
  }

  private calculateCoefficients() {
    const A = Math.pow(10, this.options.gain / 40)
    const omega =
      (2 * Math.PI * this.options.frequency) / this.options.sampleRate
    const sn = Math.sin(omega)
    const cs = Math.cos(omega)
    const alpha =
      sn * Math.sinh(((Math.LN2 / 2) * this.options.bandwidth * omega) / sn)
    const beta = Math.sqrt(A + A)
    let a0, a1, a2, b0, b1, b2

    switch (this.type) {
      case "lowpass":
        b0 = (1 - cs) / 2
        b1 = 1 - cs
        b2 = (1 - cs) / 2
        a0 = 1 + alpha
        a1 = -2 * cs
        a2 = 1 - alpha
        break
      case "highpass":
        b0 = (1 + cs) / 2
        b1 = -(1 + cs)
        b2 = (1 + cs) / 2
        a0 = 1 + alpha
        a1 = -2 * cs
        a2 = 1 - alpha
        break
      case "bandpass":
        b0 = alpha
        b1 = 0
        b2 = -alpha
        a0 = 1 + alpha
        a1 = -2 * cs
        a2 = 1 - alpha
        break
      case "notch":
        b0 = 1
        b1 = -2 * cs
        b2 = 1
        a0 = 1 + alpha
        a1 = -2 * cs
        a2 = 1 - alpha
        break
      case "peaking":
        b0 = 1 + alpha * A
        b1 = -2 * cs
        b2 = 1 - alpha * A
        a0 = 1 + alpha / A
        a1 = -2 * cs
        a2 = 1 - alpha / A
        break
      case "lowshelf":
        b0 = A * (A + 1 - (A - 1) * cs + beta * sn)
        b1 = 2 * A * (A - 1 - (A + 1) * cs)
        b2 = A * (A + 1 - (A - 1) * cs - beta * sn)
        a0 = A + 1 + (A - 1) * cs + beta * sn
        a1 = -2 * (A - 1 + (A + 1) * cs)
        a2 = A + 1 + (A - 1) * cs - beta * sn
        break
      case "highshelf":
        b0 = A * (A + 1 + (A - 1) * cs + beta * sn)
        b1 = -2 * A * (A - 1 + (A + 1) * cs)
        b2 = A * (A + 1 + (A - 1) * cs - beta * sn)
        a0 = A + 1 - (A - 1) * cs + beta * sn
        a1 = 2 * (A - 1 - (A + 1) * cs)
        a2 = A + 1 - (A - 1) * cs - beta * sn
    }

    this.b0 = b0 / a0
    this.b1 = b1 / a0
    this.b2 = b2 / a0
    this.a1 = a1 / a0
    this.a2 = a2 / a0

    this.reset()
  }

  reset() {
    this.x1 = this.x2 = this.y1 = this.y2 = 0
  }

  process(sample: number) {
    if (!this.enabled) return sample
    const y =
      this.b0 * sample +
      this.b1 * this.x1 +
      this.b2 * this.x2 -
      this.a1 * this.y1 -
      this.a2 * this.y2
    this.x2 = this.x1
    this.x1 = sample

    this.y2 = this.y1
    this.y1 = y
    return y
  }

  magnitude(bodePlot: number[]) {
    if (!this.enabled) return bodePlot
    for (let i = 0; i < bodePlot.length; i++) {
      const freq = Math.pow(5000, i / 1170) * 20
      const w = (2.0 * Math.PI * freq) / this.options.sampleRate
      const numerator =
        this.b0 * this.b0 +
        this.b1 * this.b1 +
        this.b2 * this.b2 +
        2.0 * (this.b0 * this.b1 + this.b1 * this.b2) * Math.cos(w) +
        2.0 * this.b0 * this.b2 * Math.cos(2.0 * w)
      const denominator =
        1.0 +
        this.a1 * this.a1 +
        this.a2 * this.a2 +
        2.0 * (this.a1 + this.a1 * this.a2) * Math.cos(w) +
        2.0 * this.a2 * Math.cos(2.0 * w)
      bodePlot[i] *= Math.sqrt(numerator / denominator)
    }
    return bodePlot
  }
}
