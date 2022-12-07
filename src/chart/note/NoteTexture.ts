import { RenderTexture, Container, Geometry, Texture, Shader, Mesh, Sprite, Rectangle, BaseTexture } from "pixi.js"
import { App } from "../../App"

const arrow_tex = RenderTexture.create({ width: 192, height: 192, resolution: 4 })
const arrow_container = new Container();
const arrow_geometry = new Geometry()
.addAttribute('aVertexPosition',[0, 0, 64, 0, 64, 64, 0, 64], 2)
.addAttribute('aUvs', [0, 0, 1, 0, 1, 1, 0, 1], 2)
.addIndex([0, 1, 2, 0, 2, 3]);
const mine_geometry = new Geometry()
.addAttribute('aVertexPosition',[0, 0, 24, 0, 24, 24, 0, 24], 2)
.addAttribute('aUvs', [0, 0, 1, 0, 1, 1, 0, 1], 2)
.addIndex([0, 1, 2, 0, 2, 3]);

export class NoteTexture {
 
  static noop_vert: string
  static arrow_gradient_frag: string
  static mine_gradient_frag: string

  static arrow_body_texture = BaseTexture.from('assets/noteskin/tap/body.png');
  static arrow_parts_texture = BaseTexture.from('assets/noteskin/tap/parts.png');
  
  static mine_body_texture = BaseTexture.from('assets/noteskin/mine/body.png');
  static mine_parts_texture = BaseTexture.from('assets/noteskin/mine/parts.png');
  
  static async initArrowTex(app: App) {
    this.noop_vert = await fetch('assets/noteskin/shader/noop.vert').then(response => response.text())
    this.arrow_gradient_frag = await fetch('assets/noteskin/shader/arrow_gradient.frag').then(response => response.text())
    this.mine_gradient_frag = await fetch('assets/noteskin/shader/mine_gradient.frag').then(response => response.text())

    for (let i = 0; i < 8; i ++) {
      let shader_body = Shader.from(this.noop_vert, this.arrow_gradient_frag, 
        {sampler0: this.arrow_body_texture, 
        sampler1: this.arrow_parts_texture, 
        time: 0, quant: i})
      let arrow_body = new Mesh(arrow_geometry, shader_body);
      arrow_body.x = (i % 3) * 64
      arrow_body.y = Math.floor(i/3) * 64
      arrow_container.addChild(arrow_body)
    }
    let shader_body = Shader.from(this.noop_vert, this.mine_gradient_frag, 
      {sampler0: this.mine_body_texture, 
      sampler1: this.mine_parts_texture, 
      time: 0})
    let mine_body = new Mesh(mine_geometry, shader_body);
    mine_body.x = 128
    mine_body.y = 128
    arrow_container.addChild(mine_body)
    app.pixi.ticker.add(() => {
      app.pixi.renderer.render(arrow_container, {renderTexture: arrow_tex});
    });
  }

  static setArrowTexTime(beat: number, second: number) {
    for (let i = 0; i < 8; i ++) {
      (<Mesh>arrow_container.children[i]).shader.uniforms.time = beat
    }
    (<Mesh>arrow_container.children[8]).shader.uniforms.time = second
  }

  static getSpriteWithQuant(i: number) {
    i = Math.min(i,7)
    let tt = new Sprite(new Texture(arrow_tex.baseTexture, new Rectangle((i % 3) * 64, Math.floor(i/3) * 64, 64, 64)))
    tt.rotation = 0
    tt.anchor.set(0.5)
    // tt.scale.set(1/4)
    return tt
  }

  static getMine() {
    let tt = new Sprite(new Texture(arrow_tex.baseTexture, new Rectangle(128, 128, 24, 24)))
    tt.anchor.set(0.5)
    return tt
  }
}