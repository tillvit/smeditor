precision mediump float;

varying vec2 vUvs;

uniform sampler2D sampler0;
uniform sampler2D sampler1;
uniform float time;
uniform float quant;

void main() {
  vec4 col = texture2D(sampler0, vUvs);
  if (col.a < 1.) {
    discard;
  }
  gl_FragColor = texture2D(sampler1, vec2(0.54+0.0625*quant, 1.-mod(col.r+time,2.)/2.));
}