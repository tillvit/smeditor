import{s,u as v,v as w,b as h,w as x,O as B,x as u,y as D,z as b,H as r,L as l,P as A,Q as H,Z as T,X as d}from"./ChartManager-aa9fb96b.js";import{A as C}from"./AnimatedSprite-c021bab5.js";import{H as m}from"./HoldBody-85eba27e.js";const I="/smeditor/assets/0-c5249fef.png",U="/smeditor/assets/1-0e354907.png",M="/smeditor/assets/2-ce5f7b2f.png",P="/smeditor/assets/3-648105cf.png",y="/smeditor/assets/4-da345826.png",F="/smeditor/assets/5-f6bb9779.png",O="/smeditor/assets/6-12d00670.png",Y="/smeditor/assets/7-00801dd0.png",G="/smeditor/assets/8-9a73d4f3.png",Q="/smeditor/assets/0-0543793c.png",z="/smeditor/assets/1-84dd19f7.png",L="/smeditor/assets/2-3b873573.png",_="/smeditor/assets/3-e5952ffa.png",N="/smeditor/assets/4-1f9a4a43.png",E="/smeditor/assets/5-b9acdc27.png",j="/smeditor/assets/6-565a7261.png",W="/smeditor/assets/7-dd1c0ecf.png",R="/smeditor/assets/8-94163432.png",X="/smeditor/assets/frame-d599a2fe.png",S="/smeditor/assets/parts-b37af2cf.png",k=`precision mediump float;

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
`,K=`precision mediump float;

attribute vec2 aVertexPosition;
attribute vec2 aUvs;

uniform mat3 translationMatrix;
uniform mat3 projectionMatrix;
uniform float time;

varying vec2 vUvs;

float rand(vec2 co) {
  return fract(sin(dot(co, vec2(12.9898, 78.233))) * 43758.5453);
}

void main() {
  vUvs = aUvs;
  gl_Position = vec4(
    (projectionMatrix * translationMatrix * vec3(aVertexPosition.xy, 1.0)).xy,
    0.0,
    1.0
  );

}
`,V=`45
-16.0    0.0  0 0.75
-11.31 -11.31 0 0.75
  0.0  -16.0  0 0.75
 11.31 -11.31 0 0.75
 16.0    0.0  0 0.75
 11.31  11.31 0 0.75
 -0.0   16.0  0 0.75
-11.31  11.31 0 0.75
29.422066 0.009519 -0.999500 0.25
25.401829 14.852878 -0.931249 0.1240015
14.843359 25.411350 -0.751997 0.0343755
-0.000001 29.431583 -0.500000 0.00025
-14.843361 25.411348 -0.248003 0.0343755
-25.401833 14.852878 -0.068751 0.1240015
-29.422066 0.009516 -0.000500 0.25
-25.401827 -14.833844 -0.068751 0.3759985
-14.843357 -25.392317 -0.248003 0.4656245
0.000004 -29.412546 -0.500000 0.49975
14.843363 -25.392307 -0.751997 0.4656245
25.401833 -14.833840 -0.931249 0.3759985
19.921448 0.009518 0.838208 0.25
17.189407 10.096646 0.791826 0.164375
10.087127 17.198929 0.671250 0.104087
-0.000000 19.930965 0.500000 0.080896
-10.087129 17.198925 0.328750 0.104087
-17.189411 10.096646 0.208174 0.164375
-19.921448 0.009518 0.161792 0.25
-17.189405 -10.077612 0.208174 0.335625
-10.087127 -17.179895 0.328750 0.395913
0.000001 -19.911928 0.500000 0.419104
10.087130 -17.179886 0.671250 0.395913
17.189411 -10.077609 0.791826 0.335625
10.420829 0.009516 -0.676915 0.25
8.976986 5.340415 -0.652403 0.2047485
5.330894 8.986506 -0.590503 0.1737985
0.000001 10.430347 -0.500000 0.1615425
-5.330897 8.986505 -0.409497 0.1737985
-8.976989 5.340414 -0.347597 0.2047485
-10.420829 0.009520 -0.323085 0.25
-8.976985 -5.321381 -0.347597 0.2952515
-5.330895 -8.967473 -0.409497 0.3262015
-0.000003 -10.411310 -0.500000 0.3384575
5.330898 -8.967464 -0.590503 0.3262015
8.976988 -5.321376 -0.652403 0.2952515
0 0 0.5 0.75
56
44 0 1
44 1 2
44 2 3
44 3 4
44 4 5
44 5 6
44 6 7
44 7 0
8 9 20
9 21 20
9 10 21
10 22 21
10 11 22
11 23 22
11 12 23
12 24 23
12 13 24
13 25 24
13 14 25
14 26 25
14 15 26
15 27 26
15 16 27
16 28 27
16 17 28
17 29 28
17 18 29
18 30 29
18 19 30
19 31 30
19 8 31 
8 20 31 
20 21 32
21 33 32
21 22 33
22 34 33
22 23 34
23 35 34
23 24 35
24 36 35
24 25 36
25 37 36
25 26 37
26 38 37
26 27 38
27 39 38
27 28 39
28 40 39
28 29 40
29 41 40
29 30 41
30 42 41
30 31 42
31 43 42
31 20 43
20 32 43`,Z=s.from(X);class a{static minePartsTex=v.from(S,{mipmap:w.OFF});static mineBodyGeom;static mineTex;static mineContainer=new h;static loaded=!1;static async initArrowTex(){if(this.loaded)return;a.mineTex=x.create({width:64,height:64,resolution:B.performance.resolution}),this.mineBodyGeom=await u(V);const o=D.from(K,k,{sampler0:this.minePartsTex,time:0}),t=new b(a.mineBodyGeom,o),e=new r(Z);e.width=64,e.height=64,e.anchor.set(.5),e.pivot.y=3,a.mineContainer.position.set(32),a.mineContainer.addChild(t),a.mineContainer.addChild(e),this.loaded=!0}static setArrowTexTime(o){if(!this.loaded)return;const t=o.chartManager.chartView.getVisualTime();a.mineContainer.children[0].shader.uniforms.time=t,a.mineContainer.rotation=t%1*Math.PI*2,o.renderer.render(a.mineContainer,{renderTexture:a.mineTex})}}const q="/smeditor/assets/flash-be9c0562.png",J="/smeditor/assets/mine-590d445e.png",g=s.from(q),$=s.from(J);class nn extends h{standard=new r(g);hold=new r(g);anims=new Set;constructor(o,t){super(),o.on(this,"hit",e=>{t==e.columnNumber&&(this.anims.forEach(i=>l.finish(i)),this.anims.clear(),this.anims.add(l.animate(this.standard,{0:{alpha:1.2,"scale.x":1.1,"scale.y":1.1},1:{alpha:0,"scale.x":1,"scale.y":1}},.15,A(.11,0,.5,0))))}),o.on(this,"held",e=>{t==e.columnNumber&&(this.anims.forEach(i=>l.finish(i)),this.anims.clear(),this.anims.add(l.animate(this.standard,{0:{alpha:1.2,"scale.x":1.1,"scale.y":1.1},1:{alpha:0,"scale.x":1,"scale.y":1}},.09,A(.11,0,.5,0))))}),o.on(this,"holdon",e=>{t==e.columnNumber&&(this.hold.visible=!0)}),o.on(this,"holdoff",e=>{t==e.columnNumber&&(this.hold.visible=!1)}),o.on(this,"rollon",e=>{t==e.columnNumber&&(this.hold.visible=!0)}),o.on(this,"rolloff",e=>{t==e.columnNumber&&(this.hold.visible=!1)}),o.on(this,"hitmine",e=>{if(t==e.columnNumber){const i=new r($);i.alpha=0,i.anchor.set(.5),i.blendMode=H.ADD,this.addChild(i),l.animate(i,{0:{alpha:1,rotation:0},"0.5":{alpha:1,rotation:90*Math.PI/180},1:{alpha:0,rotation:180*Math.PI/180}},.4,void 0,()=>i.destroy())}}),this.standard.alpha=0,this.standard.anchor.set(.5),this.addChild(this.standard),o.onUpdate(this,()=>{this.hold.alpha=Math.sin(Date.now()/1e3*Math.PI*2*20)*.1+1}),this.hold.visible=!1,this.hold.anchor.set(.5),this.addChild(this.hold)}}const tn="/smeditor/assets/receptor-3e38f29b.png",en="/smeditor/assets/body-0862c984.png",on="/smeditor/assets/cap-8cc2992c.png",sn="data:image/png;base64,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",an="/smeditor/assets/cap-e2813a45.png",rn=s.from(tn),p=[];for(let n=0;n<9;n++)p[n]=s.from(new URL(Object.assign({"./tap/0.png":I,"./tap/1.png":U,"./tap/2.png":M,"./tap/3.png":P,"./tap/4.png":y,"./tap/5.png":F,"./tap/6.png":O,"./tap/7.png":Y,"./tap/8.png":G})[`./tap/${n}.png`],self.location).href);const f=[];for(let n=0;n<9;n++)f[n]=s.from(new URL(Object.assign({"./lift/0.png":Q,"./lift/1.png":z,"./lift/2.png":L,"./lift/3.png":_,"./lift/4.png":N,"./lift/5.png":E,"./lift/6.png":j,"./lift/7.png":W,"./lift/8.png":R})[`./lift/${n}.png`],self.location).href);const c={hold:{body:s.from(sn),cap:s.from(an)},roll:{body:s.from(en),cap:s.from(on)}},ln={Left:90,Down:0,Up:180,Right:-90,UpLeft:135,UpRight:-135,DownRight:-45,DownLeft:45},cn=["Receptor","Tap","Lift","Fake","Hold Inactive Head","Hold Active Head","Roll Inactive Head","Roll Active Head","NoteFlash"],gn={elements:{Left:{Receptor:n=>{let o;const t=new C(T(rn,2,1,128,128)[0]);return t.width=64,t.height=64,t.anchor.set(.5),n.noteskin.on(t,"ghosttap",e=>{e.columnNumber==n.columnNumber&&(l.finish(o),o=l.animate(t,{0:{alpha:1.2,width:48,height:48},1:{alpha:1,width:64,height:64}},.06))}),n.noteskin.onUpdate(t,e=>{const i=(e.getVisualBeat()%1+1)%1;t.currentFrame=i<.2?0:1}),t},Tap:n=>{const o=p[[4,8,12,16,24,32,48,64,96,192].indexOf(n.note?.quant??4)??0],t=new r(o);return t.anchor.set(.5),t.width=64,t.height=64,t},NoteFlash:n=>new nn(n.noteskin,n.columnNumber),Fake:{element:"Tap"},Lift:n=>{const o=f[[4,8,12,16,24,32,48,64,96,192].indexOf(n.note?.quant??4)??0],t=new r(o);return t.anchor.set(.5),t.width=64,t.height=64,t},Mine:()=>{const n=new r(a.mineTex);return n.anchor.set(.5),n.width=64,n.height=64,n},"Hold Active Head":{element:"Tap"},"Hold Inactive Head":{element:"Tap"},"Hold Active Body":()=>new m(c.hold.body),"Hold Inactive Body":{element:"Hold Active Body"},"Hold Active TopCap":()=>new r(s.EMPTY),"Hold Inactive TopCap":()=>new r(s.EMPTY),"Hold Active BottomCap":()=>new d(c.hold.cap),"Hold Inactive BottomCap":{element:"Hold Active BottomCap"},"Roll Active Head":{element:"Tap"},"Roll Inactive Head":{element:"Tap"},"Roll Active Body":()=>new m(c.roll.body),"Roll Inactive Body":{element:"Roll Active Body"},"Roll Active TopCap":()=>new r(s.EMPTY),"Roll Inactive TopCap":()=>new r(s.EMPTY),"Roll Active BottomCap":()=>new d(c.roll.cap),"Roll Inactive BottomCap":{element:"Roll Active BottomCap"}}},load:function(n,o){const t=n.columnName;n.columnName="Left";const e=this.loadElement(n,o);return cn.includes(n.element)&&(e.rotation=ln[t]*Math.PI/180),e},init(){a.initArrowTex()},update(n){a.setArrowTexTime(n.chartManager.app)},hideIcons:["Lift"]};export{gn as default};
