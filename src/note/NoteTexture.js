import { app } from "../App.js";

const arrow_tex = PIXI.RenderTexture.create({ width: 192, height: 192, resolution: 4 })
const arrow_container = new PIXI.Container();
const arrow_geometry = new PIXI.Geometry()
.addAttribute('aVertexPosition',[0, 0, 64, 0, 64, 64, 0, 64], 2)
.addAttribute('aUvs', [0, 0, 1, 0, 1, 1, 0, 1], 2)
.addIndex([0, 1, 2, 0, 2, 3]);
const mine_geometry = new PIXI.Geometry()
.addAttribute('aVertexPosition',[0, 0, 24, 0, 24, 24, 0, 24], 2)
.addAttribute('aUvs', [0, 0, 1, 0, 1, 1, 0, 1], 2)
.addIndex([0, 1, 2, 0, 2, 3]);
const noop_vert = await fetch('assets/noteskin/shader/noop.vert').then(response => response.text())
const arrow_gradient_frag = await fetch('assets/noteskin/shader/arrow_gradient.frag').then(response => response.text())
const arrow_body_texture = PIXI.Texture.from('assets/noteskin/tap/body.png');
const arrow_parts_texture = PIXI.Texture.from('assets/noteskin/tap/parts.png');
const mine_gradient_frag = await fetch('assets/noteskin/shader/mine_gradient.frag').then(response => response.text())
const mine_body_texture = PIXI.Texture.from('assets/noteskin/mine/body.png');
const mine_parts_texture = PIXI.Texture.from('assets/noteskin/mine/parts.png');

export function createArrowTex() {
  // arrow_tex = PIXI.RenderTexture.create({ width: 192, height: 192, resolution: 4 });
  for (let i = 0; i < 8; i ++) {
    let shader_body = PIXI.Shader.from(noop_vert, arrow_gradient_frag, 
      {sampler0: arrow_body_texture, 
      sampler1: arrow_parts_texture, 
      time: 0, quant: i})
    let arrow_body = new PIXI.Mesh(arrow_geometry, shader_body);
    arrow_body.x = (i % 3) * 64
    arrow_body.y = Math.floor(i/3) * 64
    arrow_container.addChild(arrow_body)
  }
  let shader_body = PIXI.Shader.from(noop_vert, mine_gradient_frag, 
    {sampler0: mine_body_texture, 
    sampler1: mine_parts_texture, 
    time: 0})
  let mine_body = new PIXI.Mesh(mine_geometry, shader_body);
  mine_body.x = 128
  mine_body.y = 128
  arrow_container.addChild(mine_body)
  // let tt = new PIXI.Sprite(arrow_tex)
  // tt.x = app.screen.width/2
  // tt.y = app.screen.height/2
  // app.stage.addChild(tt)
  app.ticker.add(() => {
    app.renderer.render(arrow_container, {renderTexture: arrow_tex});
  });
}

export function setArrowTexTime(beat, second) {
  for (let i = 0; i < 8; i ++) {
    arrow_container.children[i].shader.uniforms.time = beat
  }
  arrow_container.children[8].shader.uniforms.time = second
}

export function getSpriteWithQuant(i) {
  i = Math.min(i,7)
  let tt = new PIXI.Sprite(new PIXI.Texture (arrow_tex, new PIXI.Rectangle((i % 3) * 64, Math.floor(i/3) * 64, 64, 64)))
  // tt.x = app.screen.width/2
  // tt.y = app.screen.height/2
  tt.rotation = 0
  tt.anchor.set(0.5)
  // tt.scale.set(1/4)
  return tt
}

export function getMine() {
  let tt = new PIXI.Sprite(new PIXI.Texture (arrow_tex, new PIXI.Rectangle(128, 128, 24, 24)))
  tt.anchor.set(0.5)
  return tt
}