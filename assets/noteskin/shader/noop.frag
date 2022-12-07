precision mediump float;

varying vec2 vUvs;

uniform sampler2D sampler0;

void main() {

  vec4 col = texture2D(sampler0, vUvs);
 
  gl_FragColor = col;

}