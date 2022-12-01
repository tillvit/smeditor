export class BiquadFilter {
  enabled = true
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

    this.b0 = b0 / a0;
    this.b1 = b1 / a0;
    this.b2 = b2 / a0;
    this.a1 = a1 / a0;
    this.a2 = a2 / a0;

    this.reset()
  }

  reset() {
    this.x1 = this.x2 = this.y1 = this.y2 = 0
  }


  process(sample) {
    if (!this.enabled) return sample
    let y = this.b0 * sample + this.b1 * this.x1 + this.b2 * this.x2 - this.a1 * this.y1 - this.a2 * this.y2;
    this.x2 = this.x1;
    this.x1 = sample;

    this.y2 = this.y1;
    this.y1 = y;
    return y
  }

  magnitude(freqs, sampleRate) {
    if (!this.enabled) return freqs
    for (let i = 0; i < freqs.length; i ++) {
      let freq = Math.pow(10,3/1170*i)*20
      let w = 2.0*Math.PI*freq / sampleRate;  
      let numerator = this.b0*this.b0 + this.b1*this.b1 + this.b2*this.b2 + 2.0*(this.b0*this.b1 + this.b1*this.b2)*Math.cos(w) + 2.0*this.b0*this.b2*Math.cos(2.0*w);
      let denominator = 1.0 + this.a1*this.a1 + this.a2*this.a2 + 2.0*(this.a1 + this.a1*this.a2)*Math.cos(w) + 2.0*this.a2*Math.cos(2.0*w);
      freqs[i] *= Math.sqrt(numerator / denominator);  
    }
    return freqs
  }
}

window.BiquadFilter = BiquadFilter