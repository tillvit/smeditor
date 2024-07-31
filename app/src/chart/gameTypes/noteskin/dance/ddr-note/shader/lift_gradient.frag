precision mediump float;

varying vec2 vUvs;

uniform sampler2D sampler0;
uniform float time;
uniform float quant;

void main() {
  vec4 col = texture2D(
    sampler0,
    vec2(mod(vUvs.x - time, 2.0) / 2.0, vUvs.y)
  );
  gl_FragColor = col;
}
