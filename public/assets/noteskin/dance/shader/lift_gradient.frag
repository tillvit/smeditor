precision mediump float;

varying vec2 vUvs;

uniform sampler2D sampler0;
uniform float time;
uniform float quant;

void main() {
  vec4 col = texture2D(
    sampler0,
    vec2(vUvs.x + 0.0625 * quant, mod(1.2 - vUvs.y - time, 2.0) / 2.0)
  );
  if (vUvs.x < 0.375) {
    col = texture2D(sampler0, vUvs);
  }
  gl_FragColor = col;
}
