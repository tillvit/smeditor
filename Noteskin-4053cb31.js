import{v as a,a0 as T,w as u,x as Q,b as d,y as C,O as f,z as E,H as N,J as y,L as r,P as D,Y as B,Q as c,X as v,Z as p,$ as H}from"./ChartManager-5a2a44b0.js";import{A as I}from"./AnimatedSprite-d48830bd.js";import{H as h}from"./HoldBody-bc627ac1.js";const P="/smeditor/assets/frame-d599a2fe.png",Y="/smeditor/assets/parts-b37af2cf.png",Z=`precision mediump float;

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
`,G=`precision mediump float;

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
`,b=`45
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
20 32 43`,L="/smeditor/assets/lift-6db682e7.png",V="/smeditor/assets/tap-c1e36633.png",U=a.from(P),R=T(a.from(V),8,8,64,64),K=T(a.from(L),4,1,64,64)[0];class e{static minePartsTex=u.from(Y,{mipmap:Q.OFF});static mineBodyGeom;static arrowTex;static arrowContainer=new d;static mineTex;static mineContainer=new d;static liftTex;static liftContainer=new d;static loaded=!1;static async initArrowTex(){if(!this.loaded){e.arrowTex=C.create({width:256,height:256,resolution:f.performance.resolution}),e.mineTex=C.create({width:64,height:64,resolution:f.performance.resolution}),e.liftTex=C.create({width:64,height:64,resolution:f.performance.resolution}),this.mineBodyGeom=await E(b);for(let A=0;A<8;A++){const n=new I(R[A]);n.x=A%3*64+32,n.y=Math.floor(A/3)*64+32,n.anchor.set(.5),n.name="note"+A,e.arrowContainer.addChild(n)}{const A=new I(K);A.x=32,A.y=32,A.anchor.set(.5),A.name="note",e.liftContainer.addChild(A)}{const A=N.from(G,Z,{sampler0:this.minePartsTex,time:0}),n=new y(e.mineBodyGeom,A),t=new r(U);t.width=64,t.height=64,t.anchor.set(.5),t.pivot.y=3,e.mineContainer.position.set(32),e.mineContainer.addChild(n),e.mineContainer.addChild(t)}this.loaded=!0}}static setArrowTexTime(A){if(!this.loaded)return;const n=A.chartManager.chartView.getVisualBeat(),t=A.chartManager.chartView.getVisualTime(),o=(n%4+4)%4;for(let g=0;g<8;g++){const m=e.arrowContainer.getChildByName("note"+g);m.currentFrame=Math.floor(o*2)}const s=e.liftContainer.children[0];s.currentFrame=Math.floor(o),e.mineContainer.children[0].shader.uniforms.time=t,e.mineContainer.rotation=t%1*Math.PI*2,A.renderer.render(e.arrowContainer,{renderTexture:e.arrowTex}),A.renderer.render(e.mineContainer,{renderTexture:e.mineTex}),A.renderer.render(e.liftContainer,{renderTexture:e.liftTex})}static setNoteTex(A,n){if(n!==void 0&&n.type=="Mine")A.texture=e.mineTex;else if(n!==void 0&&n.type=="Lift")A.texture=e.liftTex;else{const t=Math.min([4,8,12,16,24,32,48,64,96,192].indexOf(n?.quant??4),7);A.texture=new a(e.arrowTex.baseTexture,new D(t%3*64,Math.floor(t/3)*64,64,64))}}}const O="data:image/png;base64,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",J="/smeditor/assets/hold-5651661d.png",q="/smeditor/assets/mine-590d445e.png",F=a.from(J),k=a.from(q),X=a.from(O),x={w0:[1,1,1,1],w2:[1,1,.3,1],w3:[0,1,.4,1],w4:[.3,.8,1,1],w5:[.8,0,.6,1],held:[1,1,1,1]};class z extends d{holdExplosion=new I(T(F,2,1,128,128)[0]);standard=new r(X);anims=new Set;constructor(A,n){super(),A.on(this,"hit",t=>{if(n==t.columnNumber){const o=x[t.judgement.id]??[1,1,1,1];this.standard.tint=B(o[0]*255,o[1]*255,o[2]*255),this.anims.forEach(s=>c.finish(s)),this.anims.clear(),this.anims.add(c.animate(this.standard,{0:{alpha:1,"scale.x":1,"scale.y":1},"0.5":{alpha:1,"scale.x":1.1,"scale.y":1.1},1:{alpha:0,"scale.x":1.1,"scale.y":1.1}},.12))}}),A.on(this,"held",t=>{if(n==t.columnNumber){const o=x.w2;this.standard.tint=B(o[0]*255,o[1]*255,o[2]*255),this.anims.forEach(s=>c.finish(s)),this.anims.clear(),this.anims.add(c.animate(this.standard,{0:{alpha:1,"scale.x":1,"scale.y":1},"0.5":{alpha:1,"scale.x":1.1,"scale.y":1.1},1:{alpha:0,"scale.x":1.1,"scale.y":1.1}},.12))}}),A.on(this,"holdon",t=>{n==t.columnNumber&&(this.holdExplosion.visible=!0)}),A.on(this,"holdoff",t=>{n==t.columnNumber&&(this.holdExplosion.visible=!1)}),A.on(this,"rollon",t=>{n==t.columnNumber&&(this.holdExplosion.visible=!0)}),A.on(this,"rolloff",t=>{n==t.columnNumber&&(this.holdExplosion.visible=!1)}),A.on(this,"hitmine",t=>{if(n==t.columnNumber){const o=new r(k);o.alpha=0,o.anchor.set(.5),o.blendMode=v.ADD,this.addChild(o),c.animate(o,{0:{alpha:1,rotation:0},"0.5":{alpha:1,rotation:90*Math.PI/180},1:{alpha:0,rotation:180*Math.PI/180}},.4,void 0,()=>o.destroy())}}),A.onUpdate(this,()=>{this.holdExplosion.rotation=-this.rotation}),this.holdExplosion.visible=!1,this.holdExplosion.anchor.set(.5),this.holdExplosion.play(),this.addChild(this.holdExplosion),this.standard.alpha=0,this.standard.anchor.set(.5),this.addChild(this.standard)}}const j="/smeditor/assets/receptor-13e43ffb.png",M="data:image/png;base64,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",S="data:image/png;base64,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",W="/smeditor/assets/bottomCapActive-32ba7c5b.png",$="/smeditor/assets/bottomCapInactive-d8fa251d.png",_="data:image/png;base64,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",AA="data:image/png;base64,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",tA="/smeditor/assets/bottomCapActive-75c2fd66.png",nA="/smeditor/assets/bottomCapInactive-d275b2b2.png",w=a.from(j),l={hold:{active:{body:a.from(M),bottomCap:a.from(W)},inactive:{body:a.from(S),bottomCap:a.from($)}},roll:{active:{body:a.from(_),bottomCap:a.from(tA)},inactive:{body:a.from(AA),bottomCap:a.from(nA)}}},oA={Left:90,Down:0,Up:180,Right:-90,UpLeft:135,UpRight:-135,DownRight:-45,DownLeft:45},eA=["Receptor","Tap","Lift","Fake","Hold Inactive Head","Hold Active Head","Roll Inactive Head","Roll Active Head","NoteFlash"],rA={elements:{Left:{Receptor:i=>{let A;const n=new d,t=new r(w);t.width=64,t.height=64,t.anchor.set(.5);const o=new r(w);return o.width=64,o.height=64,o.alpha=0,o.blendMode=v.ADD,o.anchor.set(.5),n.addChild(t,o),i.noteskin.on(n,"press",s=>s.columnNumber==i.columnNumber&&(o.alpha=.2)),i.noteskin.on(n,"lift",s=>s.columnNumber==i.columnNumber&&(o.alpha=0)),i.noteskin.on(n,"ghosttap",s=>{s.columnNumber==i.columnNumber&&(c.finish(A),A=c.animate(n,{0:{"scale.x":.75,"scale.y":.75},1:{"scale.x":1,"scale.y":1}},.11))}),i.noteskin.onUpdate(n,s=>{const g=(s.getVisualBeat()%1+1)%1,m=H(1-g,.5,1)*255;t.tint=B(m,m,m)}),n},Tap:i=>{const A=new r(a.WHITE);return e.setNoteTex(A,i.note),A.anchor.set(.5),A},NoteFlash:i=>new z(i.noteskin,i.columnNumber),Fake:{element:"Tap"},Lift:{element:"Tap"},Mine:{element:"Tap"},"Hold Active Head":{element:"Tap"},"Hold Inactive Head":{element:"Tap"},"Hold Active Body":()=>new h(l.hold.active.body),"Hold Inactive Body":()=>new h(l.hold.inactive.body),"Hold Active TopCap":()=>new r(a.EMPTY),"Hold Inactive TopCap":()=>new r(a.EMPTY),"Hold Active BottomCap":()=>new p(l.hold.active.bottomCap),"Hold Inactive BottomCap":()=>new p(l.hold.inactive.bottomCap),"Roll Active Head":{element:"Tap"},"Roll Inactive Head":{element:"Tap"},"Roll Active Body":()=>new h(l.roll.active.body),"Roll Inactive Body":()=>new h(l.roll.inactive.body),"Roll Active TopCap":()=>new r(a.EMPTY),"Roll Inactive TopCap":()=>new r(a.EMPTY),"Roll Active BottomCap":()=>new p(l.roll.active.bottomCap),"Roll Inactive BottomCap":()=>new p(l.roll.inactive.bottomCap)}},load:function(i,A){const n=i.columnName;i.columnName="Left";const t=this.loadElement(i,A);return eA.includes(i.element)&&(t.rotation=oA[n]*Math.PI/180),t},init(){e.initArrowTex()},update(i){e.setArrowTexTime(i.chartManager.app)},hideIcons:["Lift"],metrics:{HoldBodyBottomOffset:-32,RollBodyBottomOffset:-32}};export{rA as default};