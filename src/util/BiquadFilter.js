export class BiquadFilter {
  constructor(type, gain, freq, sampleRate, bandwidth){
    let A = Math.pow(10, gain/40);
    let omega = 2 * Math.PI * freq /sampleRate;
    let sn = Math.sin(omega);
    let cs = Math.cos(omega);
    let alpha = sn * Math.sinh(Math.LN2 /2 * bandwidth * omega / sn);
    let beta = Math.sqrt(A + A);
    let a0, a1, a2, b0, b1, b2;

    //https://www.musicdsp.org/en/latest/Filters/64-biquad-c-code.html
    switch (type) {
      case "lowpass":
        b0 = (1 - cs) /2;
        b1 = 1 - cs;
        b2 = (1 - cs) /2;
        a0 = 1 + alpha;
        a1 = -2 * cs;
        a2 = 1 - alpha;
        break;
      case "highpass":
        b0 = (1 + cs) /2;
        b1 = -(1 + cs);
        b2 = (1 + cs) /2;
        a0 = 1 + alpha;
        a1 = -2 * cs;
        a2 = 1 - alpha;
        break;
      case "bandpass":
        b0 = alpha;
        b1 = 0;
        b2 = -alpha;
        a0 = 1 + alpha;
        a1 = -2 * cs;
        a2 = 1 - alpha;
        break;
      case "notch":
        b0 = 1;
        b1 = -2 * cs;
        b2 = 1;
        a0 = 1 + alpha;
        a1 = -2 * cs;
        a2 = 1 - alpha;
        break;
      case "peaking":
        b0 = 1 + (alpha * A);
        b1 = -2 * cs;
        b2 = 1 - (alpha * A);
        a0 = 1 + (alpha /A);
        a1 = -2 * cs;
        a2 = 1 - (alpha /A);
        break;
      case "lowshelf":
        b0 = A * ((A + 1) - (A - 1) * cs + beta * sn);
        b1 = 2 * A * ((A - 1) - (A + 1) * cs);
        b2 = A * ((A + 1) - (A - 1) * cs - beta * sn);
        a0 = (A + 1) + (A - 1) * cs + beta * sn;
        a1 = -2 * ((A - 1) + (A + 1) * cs);
        a2 = (A + 1) + (A - 1) * cs - beta * sn;
        break;
      case "highshelf":
        b0 = A * ((A + 1) + (A - 1) * cs + beta * sn);
        b1 = -2 * A * ((A - 1) + (A + 1) * cs);
        b2 = A * ((A + 1) + (A - 1) * cs - beta * sn);
        a0 = (A + 1) - (A - 1) * cs + beta * sn;
        a1 = 2 * ((A - 1) - (A + 1) * cs);
        a2 = (A + 1) - (A - 1) * cs - beta * sn;
    }

    this.a0 = b0 /a0;
    this.a1 = b1 /a0;
    this.a2 = b2 /a0;
    this.a3 = a1 /a0;
    this.a4 = a2 /a0;

    this.reset()
  }

  reset() {
    this.x1 = this.x2 = this.y1 = this.y2 = 0
  }


  process(sample) {
    let y = this.a0 * sample + this.a1 * this.x1 + this.a2 * this.x2 - this.a3 * this.y1 - this.a4 * this.y2;
    this.x2 = this.x1;
    this.x1 = sample;

    this.y2 = this.y1;
    this.y1 = y;
    return y
  }
}

window.BiquadFilter = BiquadFilter