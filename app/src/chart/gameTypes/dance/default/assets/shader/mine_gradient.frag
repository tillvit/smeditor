precision mediump float;

varying vec2 vUvs;

uniform sampler2D sampler0;
uniform sampler2D sampler1;
uniform float time;

void main() {
  vec4 col = texture2D(sampler0, vUvs);
  if (col.a < 1.0) {
    discard;
  }
  gl_FragColor = texture2D(sampler1, vec2(mod(col.r - time, 1.0), 0.625));
}
