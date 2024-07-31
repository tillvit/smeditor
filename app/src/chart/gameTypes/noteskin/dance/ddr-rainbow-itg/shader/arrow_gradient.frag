precision mediump float;

varying vec2 vUvs;

uniform sampler2D sampler0;
uniform float time;
uniform float quant;

void main() {
  vec4 col = texture2D(
    sampler0,
    vec2(vUvs.x + 0.0625 * quant, mod(vUvs.y - time, 2.0) / 2.0)
  );
  gl_FragColor = col;
}
