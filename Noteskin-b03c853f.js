import{s as a,u as h,v as d,b as u,w as x,O as g,x as w,y as f,z as p,H as s,J as E,L as A,P as F,Q as I,V as G,X as v,Y as H}from"./ChartManager-a0d943d0.js";import{H as B}from"./HoldBody-32ada90b.js";const P="/smeditor/assets/frame-d599a2fe.png",N="/smeditor/assets/parts-b37af2cf.png",k="data:image/png;base64,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",O="data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAIAAAACCAIAAAD91JpzAAAAAXNSR0IArs4c6QAAAARnQU1BAACxjwv8YQUAAAAJcEhZcwAAFiUAABYlAUlSJPAAAAAMSURBVBhXY0ACDAwAAA4AAXqxuTAAAAAASUVORK5CYII=",Y="/smeditor/assets/frameChrome-2ea8bbf3.png",L="data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAIAAAACCAIAAAD91JpzAAAAAXNSR0IArs4c6QAAAARnQU1BAACxjwv8YQUAAAAJcEhZcwAAFiUAABYlAUlSJPAAAAAMSURBVBhXY0ACDAwAAA4AAXqxuTAAAAAASUVORK5CYII=",V="/smeditor/assets/frameChrome-2ea8bbf3.png",T=`precision mediump float;

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
`,S=`precision mediump float;

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
`,y=`precision mediump float;

varying vec2 vUvs;

uniform sampler2D sampler0;

void main() {
  vec4 col = texture2D(sampler0, vUvs);

  gl_FragColor = col;

}
`,C=`precision mediump float;

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
`,K=`14\r
0.000000 1.500000 0.046875 0.187500\r
-5.000000 1.500000 0.015625 0.125000\r
-0.000000 -3.500000 0.015625 0.250000\r
-5.000000 20.000000 0.015625 -0.187500\r
0.000000 20.000000 0.046875 -0.125000\r
0.000000 25.000000 0.046875 -0.187500\r
-25.000000 -0.000000 0.046875 -0.187500\r
0.000000 -25.000000 0.015625 -0.187500\r
0.000000 -15.000000 0.015625 -0.062500\r
-20.000000 5.000000 0.046875 -0.062500\r
5.000000 1.499999 0.015625 0.125000\r
5.000000 20.000000 0.015625 -0.187500\r
25.000000 -0.000000 0.046875 -0.187500\r
20.000000 5.000000 0.046875 -0.062500\r
12\r
0 1 2\r
3 1 0\r
3 0 4\r
4 5 3\r
6 7 8\r
6 8 9\r
0 2 10\r
11 4 0\r
11 0 10\r
4 11 5\r
12 13 8\r
12 8 7`,Q=`24\r
-20.000000 5.000000 0.953125 0.500000\r
-20.000000 7.000003 0.953125 0.500000\r
-27.000000 0.000005 0.953125 0.500000\r
-25.000000 -0.000000 0.953125 0.500000\r
0.000002 27.000000 0.953125 0.500000\r
-6.499996 20.500000 0.953125 0.500000\r
-5.000000 20.000000 0.953125 0.500000\r
0.000000 25.000000 0.953125 0.500000\r
-0.000002 -27.000000 0.953125 0.500000\r
0.000000 -25.000000 0.953125 0.500000\r
0.000000 -15.000000 0.953125 0.500000\r
-0.000001 -13.000000 0.953125 0.500000\r
-5.000000 1.500000 0.953125 0.500000\r
-6.500000 1.000001 0.953125 0.500000\r
-0.000000 -5.500000 0.953125 0.500000\r
-0.000000 -3.500000 0.953125 0.500000\r
20.000000 5.000000 0.953125 0.500000\r
25.000000 -0.000000 0.953125 0.500000\r
27.000000 -0.000000 0.953125 0.500000\r
20.000000 7.000000 0.953125 0.500000\r
5.000000 20.000000 0.953125 0.500000\r
6.500000 20.500000 0.953125 0.500000\r
5.000000 1.499999 0.953125 0.500000\r
6.500000 1.000000 0.953125 0.500000\r
24\r
0 1 2\r
0 2 3\r
4 5 6\r
4 6 7\r
2 8 9\r
2 9 3\r
0 10 11\r
0 11 1\r
12 6 5\r
12 5 13\r
13 14 15\r
13 15 12\r
16 17 18\r
16 18 19\r
4 7 20\r
4 20 21\r
18 17 9\r
18 9 8\r
16 19 11\r
16 11 10\r
22 23 21\r
22 21 20\r
23 22 15\r
23 15 14`,J=`92\r
-0.000000 -32.000000 0.898438 0.000000\r
-0.000000 -30.000000 0.601562 0.000000\r
-30.000000 -0.000000 0.601562 1.000000\r
-32.000000 -0.000000 0.898438 1.000000\r
-32.000000 -0.000000 0.898438 0.000000\r
-30.000000 -0.000000 0.601562 0.000000\r
-20.000000 10.000000 0.601562 1.000000\r
-20.000000 12.000000 0.898438 1.000000\r
-10.000000 22.000000 0.898438 1.000000\r
-10.000000 2.000002 0.898438 0.000000\r
-8.500000 0.500001 0.601562 0.000000\r
-8.500000 21.500000 0.601562 1.000000\r
-20.000000 10.000000 0.398438 1.000000\r
-20.000000 7.000003 0.101562 1.000000\r
-0.000001 -13.000000 0.101562 0.000000\r
-0.000001 -10.000000 0.398438 0.000000\r
0.000000 30.000000 0.398438 0.000000\r
-8.500000 21.500000 0.398438 1.000000\r
-6.499996 20.500000 0.101562 1.000000\r
0.000002 27.000000 0.101562 0.000000\r
-30.000000 -0.000000 0.398438 0.000000\r
-0.000000 -30.000000 0.398438 1.000000\r
-0.000002 -27.000000 0.101562 1.000000\r
-27.000000 0.000005 0.101562 0.000000\r
-6.500000 1.000001 0.101562 1.000000\r
-6.499996 20.500000 0.101562 0.000000\r
-8.500000 21.500000 0.398438 0.000000\r
-8.500000 0.500001 0.398438 1.000000\r
-27.000000 0.000005 0.101562 1.000000\r
-20.000000 7.000003 0.101562 0.000000\r
-20.000000 10.000000 0.398438 0.000000\r
-30.000000 -0.000000 0.398438 1.000000\r
-6.500000 1.000001 0.101562 0.000000\r
-8.500000 0.500001 0.398438 0.000000\r
-0.000001 -8.000000 0.398438 1.000000\r
-0.000000 -5.500000 0.101562 1.000000\r
-8.500000 0.500001 0.898438 0.500000\r
-10.000000 2.000002 0.898438 0.500000\r
-20.000000 12.000000 0.898438 0.000000\r
-20.000000 10.000000 0.601562 0.000000\r
-0.000001 -10.000000 0.601562 1.000000\r
-0.000001 -8.000000 0.898438 1.000000\r
-8.500000 21.500000 0.601562 0.000000\r
0.000000 30.000000 0.601562 1.000000\r
0.000000 32.000000 0.898438 1.000000\r
-10.000000 22.000000 0.898438 0.000000\r
-0.000000 -32.000000 0.898438 1.000000\r
32.000000 0.000000 0.898438 0.000000\r
30.000000 0.000000 0.601562 0.000000\r
-0.000000 -30.000000 0.601562 1.000000\r
32.000000 0.000000 0.898438 1.000000\r
20.000000 12.000000 0.898438 0.000000\r
20.000000 10.000000 0.601562 0.000000\r
30.000000 0.000000 0.601562 1.000000\r
10.000000 22.000000 0.898438 0.000000\r
8.500000 21.500000 0.601562 0.000000\r
8.500000 0.500000 0.601562 1.000000\r
10.000000 2.000000 0.898438 1.000000\r
20.000000 10.000000 0.398438 0.000000\r
-0.000001 -10.000000 0.398438 1.000000\r
-0.000001 -13.000000 0.101562 1.000000\r
20.000000 7.000000 0.101562 0.000000\r
0.000000 30.000000 0.398438 1.000000\r
0.000002 27.000000 0.101562 1.000000\r
6.500000 20.500000 0.101562 0.000000\r
8.500000 21.500000 0.398438 0.000000\r
30.000000 0.000000 0.398438 1.000000\r
27.000000 -0.000000 0.101562 1.000000\r
-0.000002 -27.000000 0.101562 0.000000\r
-0.000000 -30.000000 0.398438 0.000000\r
6.500000 1.000000 0.101562 0.000000\r
8.500000 0.500000 0.398438 0.000000\r
8.500000 21.500000 0.398438 1.000000\r
6.500000 20.500000 0.101562 1.000000\r
27.000000 -0.000000 0.101562 0.000000\r
30.000000 0.000000 0.398438 0.000000\r
20.000000 10.000000 0.398438 1.000000\r
20.000000 7.000000 0.101562 1.000000\r
6.500000 1.000000 0.101562 1.000000\r
-0.000000 -5.500000 0.101562 0.000000\r
-0.000001 -8.000000 0.398438 0.000000\r
8.500000 0.500000 0.398438 1.000000\r
8.500000 21.500000 0.601562 1.000000\r
10.000000 22.000000 0.898438 1.000000\r
0.000000 32.000000 0.898438 0.000000\r
0.000000 30.000000 0.601562 0.000000\r
-0.000001 -10.000000 0.601562 0.000000\r
20.000000 10.000000 0.601562 1.000000\r
20.000000 12.000000 0.898438 1.000000\r
10.000000 2.000000 0.898438 0.500000\r
8.500000 0.500000 0.898438 0.375000\r
-0.000001 -8.000000 0.898438 0.000000\r
48\r
0 1 2\r
0 2 3\r
4 5 6\r
4 6 7\r
8 9 10\r
8 10 11\r
12 13 14\r
12 14 15\r
16 17 18\r
16 18 19\r
20 21 22\r
20 22 23\r
24 25 26\r
24 26 27\r
28 29 30\r
28 30 31\r
32 33 34\r
32 34 35\r
36 37 38\r
36 38 39\r
36 39 40\r
36 40 41\r
42 43 44\r
42 44 45\r
46 47 48\r
46 48 49\r
50 51 52\r
50 52 53\r
54 55 56\r
54 56 57\r
58 59 60\r
58 60 61\r
62 63 64\r
62 64 65\r
66 67 68\r
66 68 69\r
70 71 72\r
70 72 73\r
74 75 76\r
74 76 77\r
78 79 80\r
78 80 81\r
82 83 84\r
82 84 85\r
86 87 88\r
86 88 89\r
86 89 90\r
86 90 91`,W=`24
-20.000000 5.000000 0.953125 0.500000
-20.000000 7.000003 0.953125 0.500000
-27.000000 0.000005 0.953125 0.500000
-25.000000 -0.000000 0.953125 0.500000
0.000002 27.000000 0.953125 0.500000
-6.499996 20.500000 0.953125 0.500000
-5.000000 20.000000 0.953125 0.500000
0.000000 25.000000 0.953125 0.500000
-0.000002 -27.000000 0.953125 0.500000
0.000000 -25.000000 0.953125 0.500000
0.000000 -15.000000 0.953125 0.500000
-0.000001 -13.000000 0.953125 0.500000
-5.000000 1.500000 0.953125 0.500000
-6.500000 1.000001 0.953125 0.500000
-0.000000 -5.500000 0.953125 0.500000
-0.000000 -3.500000 0.953125 0.500000
20.000000 5.000000 0.953125 0.500000
25.000000 -0.000000 0.953125 0.500000
27.000000 -0.000000 0.953125 0.500000
20.000000 7.000000 0.953125 0.500000
5.000000 20.000000 0.953125 0.500000
6.500000 20.500000 0.953125 0.500000
5.000000 1.499999 0.953125 0.500000
6.500000 1.000000 0.953125 0.500000
24
0 1 2
0 2 3
4 5 6
4 6 7
2 8 9
2 9 3
0 10 11
0 11 1
12 6 5
12 5 13
13 14 15
13 15 12
16 17 18
16 18 19
4 7 20
4 20 21
18 17 9
18 9 8
16 19 11
16 11 10
22 23 21
22 21 20
23 22 15
23 15 14`,z=`92
-0.000000 -32.000000 0.898438 0.000000
-0.000000 -30.000000 0.601562 0.000000
-30.000000 -0.000000 0.601562 1.000000
-32.000000 -0.000000 0.898438 1.000000
-32.000000 -0.000000 0.898438 0.000000
-30.000000 -0.000000 0.601562 0.000000
-20.000000 10.000000 0.601562 1.000000
-20.000000 12.000000 0.898438 1.000000
-10.000000 22.000000 0.898438 1.000000
-10.000000 2.000002 0.898438 0.000000
-8.500000 0.500001 0.601562 0.000000
-8.500000 21.500000 0.601562 1.000000
-20.000000 10.000000 0.398438 1.000000
-20.000000 7.000003 0.101562 1.000000
-0.000001 -13.000000 0.101562 0.000000
-0.000001 -10.000000 0.398438 0.000000
0.000000 30.000000 0.398438 0.000000
-8.500000 21.500000 0.398438 1.000000
-6.499996 20.500000 0.101562 1.000000
0.000002 27.000000 0.101562 0.000000
-30.000000 -0.000000 0.398438 0.000000
-0.000000 -30.000000 0.398438 1.000000
-0.000002 -27.000000 0.101562 1.000000
-27.000000 0.000005 0.101562 0.000000
-6.500000 1.000001 0.101562 1.000000
-6.499996 20.500000 0.101562 0.000000
-8.500000 21.500000 0.398438 0.000000
-8.500000 0.500001 0.398438 1.000000
-27.000000 0.000005 0.101562 1.000000
-20.000000 7.000003 0.101562 0.000000
-20.000000 10.000000 0.398438 0.000000
-30.000000 -0.000000 0.398438 1.000000
-6.500000 1.000001 0.101562 0.000000
-8.500000 0.500001 0.398438 0.000000
-0.000001 -8.000000 0.398438 1.000000
-0.000000 -5.500000 0.101562 1.000000
-8.500000 0.500001 0.898438 0.500000
-10.000000 2.000002 0.898438 0.500000
-20.000000 12.000000 0.898438 0.000000
-20.000000 10.000000 0.601562 0.000000
-0.000001 -10.000000 0.601562 1.000000
-0.000001 -8.000000 0.898438 1.000000
-8.500000 21.500000 0.601562 0.000000
0.000000 30.000000 0.601562 1.000000
0.000000 32.000000 0.898438 1.000000
-10.000000 22.000000 0.898438 0.000000
-0.000000 -32.000000 0.898438 1.000000
32.000000 0.000000 0.898438 0.000000
30.000000 0.000000 0.601562 0.000000
-0.000000 -30.000000 0.601562 1.000000
32.000000 0.000000 0.898438 1.000000
20.000000 12.000000 0.898438 0.000000
20.000000 10.000000 0.601562 0.000000
30.000000 0.000000 0.601562 1.000000
10.000000 22.000000 0.898438 0.000000
8.500000 21.500000 0.601562 0.000000
8.500000 0.500000 0.601562 1.000000
10.000000 2.000000 0.898438 1.000000
20.000000 10.000000 0.398438 0.000000
-0.000001 -10.000000 0.398438 1.000000
-0.000001 -13.000000 0.101562 1.000000
20.000000 7.000000 0.101562 0.000000
0.000000 30.000000 0.398438 1.000000
0.000002 27.000000 0.101562 1.000000
6.500000 20.500000 0.101562 0.000000
8.500000 21.500000 0.398438 0.000000
30.000000 0.000000 0.398438 1.000000
27.000000 -0.000000 0.101562 1.000000
-0.000002 -27.000000 0.101562 0.000000
-0.000000 -30.000000 0.398438 0.000000
6.500000 1.000000 0.101562 0.000000
8.500000 0.500000 0.398438 0.000000
8.500000 21.500000 0.398438 1.000000
6.500000 20.500000 0.101562 1.000000
27.000000 -0.000000 0.101562 0.000000
30.000000 0.000000 0.398438 0.000000
20.000000 10.000000 0.398438 1.000000
20.000000 7.000000 0.101562 1.000000
6.500000 1.000000 0.101562 1.000000
-0.000000 -5.500000 0.101562 0.000000
-0.000001 -8.000000 0.398438 0.000000
8.500000 0.500000 0.398438 1.000000
8.500000 21.500000 0.601562 1.000000
10.000000 22.000000 0.898438 1.000000
0.000000 32.000000 0.898438 0.000000
0.000000 30.000000 0.601562 0.000000
-0.000001 -10.000000 0.601562 0.000000
20.000000 10.000000 0.601562 1.000000
20.000000 12.000000 0.898438 1.000000
10.000000 2.000000 0.898438 0.500000
8.500000 0.500000 0.898438 0.375000
-0.000001 -8.000000 0.898438 0.000000
48
0 1 2
0 2 3
4 5 6
4 6 7
8 9 10
8 10 11
12 13 14
12 14 15
16 17 18
16 18 19
20 21 22
20 22 23
24 25 26
24 26 27
28 29 30
28 30 31
32 33 34
32 34 35
36 37 38
36 38 39
36 39 40
36 40 41
42 43 44
42 44 45
46 47 48
46 48 49
50 51 52
50 52 53
54 55 56
54 56 57
58 59 60
58 60 61
62 63 64
62 64 65
66 67 68
66 68 69
70 71 72
70 72 73
74 75 76
74 76 77
78 79 80
78 80 81
82 83 84
82 84 85
86 87 88
86 88 89
86 89 90
86 90 91`,X=`45
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
20 32 43`,q=a.from(P);class o{static arrowBodyTex=h.from(k,{mipmap:d.OFF});static arrowFrameChromeTex=h.from(Y,{mipmap:d.OFF});static arrowFrameBlackTex=h.from(O,{mipmap:d.OFF});static minePartsTex=h.from(N,{mipmap:d.OFF});static liftFrameChromeTex=h.from(V,{mipmap:d.OFF});static liftFrameBlackTex=h.from(L,{mipmap:d.OFF});static arrowBodyGeom;static arrowFrameBlackGeom;static arrowFrameChromeGeom;static liftFrameBlackGeom;static liftFrameChromeGeom;static mineBodyGeom;static arrowFrameTex;static arrowChrome;static arrowBlack;static arrowFrameContainer=new u;static arrowTex;static arrowContainer=new u;static liftTex;static liftChrome;static liftBlack;static liftContainer=new u;static mineTex;static mineContainer=new u;static loaded=!1;static async initArrowTex(){if(!this.loaded){o.arrowFrameTex=x.create({width:64,height:64,resolution:g.performance.resolution}),o.arrowTex=x.create({width:256,height:320,resolution:g.performance.resolution}),o.liftTex=x.create({width:64,height:64,resolution:g.performance.resolution}),o.mineTex=x.create({width:64,height:64,resolution:g.performance.resolution}),this.arrowBodyGeom=await w(K),this.arrowFrameChromeGeom=await w(J),this.arrowFrameBlackGeom=await w(Q),this.mineBodyGeom=await w(X),this.liftFrameChromeGeom=await w(z),this.liftFrameBlackGeom=await w(W);{const t=f.from(C,T,{sampler0:this.arrowFrameChromeTex,time:0,quant:0}),r=new p(o.arrowFrameChromeGeom,t);r.x=32,r.y=32,r.rotation=-Math.PI/2,this.arrowChrome=r;const n=f.from(C,y,{sampler0:this.arrowFrameBlackTex}),e=new p(o.arrowFrameBlackGeom,n);e.x=32,e.y=32,e.rotation=-Math.PI/2,this.arrowBlack=e,this.arrowFrameContainer.addChild(r,e)}for(let t=0;t<10;t++){const r=f.from(C,T,{sampler0:this.arrowBodyTex,time:0,quant:t}),n=new s(o.arrowFrameTex);n.x=t%3*64,n.y=Math.floor(t/3)*64;const e=new p(o.arrowBodyGeom,r);e.x=t%3*64+32,e.y=Math.floor(t/3)*64+32,e.rotation=-Math.PI/2,e.name="body"+t,o.arrowContainer.addChild(n),o.arrowContainer.addChild(e)}{const t=f.from(C,T,{sampler0:this.liftFrameChromeTex,time:0,quant:0}),r=new p(o.liftFrameChromeGeom,t);r.x=32,r.y=32,r.rotation=-Math.PI/2,this.liftChrome=r;const n=f.from(C,y,{sampler0:this.liftFrameBlackTex}),e=new p(o.liftFrameBlackGeom,n);e.x=32,e.y=32,e.rotation=-Math.PI/2,this.liftBlack=e,this.liftContainer.addChild(r,e)}{const t=f.from(C,S,{sampler0:this.minePartsTex,time:0}),r=new p(o.mineBodyGeom,t),n=new s(q);n.width=64,n.height=64,n.anchor.set(.5),n.pivot.y=3,o.mineContainer.position.set(32),o.mineContainer.addChild(r),o.mineContainer.addChild(n)}this.loaded=!0}}static setArrowTexTime(t){if(!this.loaded)return;const r=t.chartManager.chartView.getVisualBeat(),n=t.chartManager.chartView.getVisualTime();for(let e=0;e<10;e++){const m=o.arrowContainer.getChildByName("body"+e);m.shader.uniforms.time=r}this.arrowChrome.shader.uniforms.time=r,this.liftChrome.shader.uniforms.time=r,o.mineContainer.children[0].shader.uniforms.time=n,o.mineContainer.rotation=n%1*Math.PI*2,t.renderer.render(o.arrowFrameContainer,{renderTexture:o.arrowFrameTex}),t.renderer.render(o.arrowContainer,{renderTexture:o.arrowTex}),t.renderer.render(o.mineContainer,{renderTexture:o.mineTex}),t.renderer.render(o.liftContainer,{renderTexture:o.liftTex})}static setNoteTex(t,r){if(r!==void 0&&r.type=="Mine")t.texture=o.mineTex;else if(r!==void 0&&r.type=="Lift")t.texture=o.liftTex;else{const n=[4,8,12,16,24,32,48,64,96,192].indexOf(r?.quant??4);t.texture=new a(r?.type=="Lift"?o.liftTex.baseTexture:o.arrowTex.baseTexture,new E(n%3*64,Math.floor(n/3)*64,64,64))}}}const j="/smeditor/assets/decent-79d4c208.png",M="/smeditor/assets/excellent-30398c95.png",Z="/smeditor/assets/fantastic-65c1c0cf.png",R="/smeditor/assets/great-f56818a7.png",$="/smeditor/assets/hold-3f899175.png",_="/smeditor/assets/mine-590d445e.png",n0="/smeditor/assets/way_off-cc9a5377.png",r0="/smeditor/assets/white_fantastic-9f83da7a.png",c={hold:a.from($),w0:a.from(Z),w1:a.from(r0),w2:a.from(M),w3:a.from(R),w4:a.from(j),w5:a.from(n0),mine:a.from(_)};class t0 extends u{holdExplosion=new s(c.hold);standard={w0:new s(c.w0),w1:new s(c.w1),w2:new s(c.w2),w3:new s(c.w3),w4:new s(c.w4),w5:new s(c.w5)};anims=new Set;constructor(t,r){super(),this.scale.set(.5),t.on(this,"hit",n=>{if(r==n.columnNumber&&this.standard[n.judgement.id]){this.anims.forEach(m=>A.finish(m)),this.anims.clear();const e=this.standard[n.judgement.id];this.anims.add(A.animate(e,{0:{alpha:1.2,"scale.x":1.1,"scale.y":1.1},1:{alpha:0,"scale.x":1,"scale.y":1}},.15,F(.11,0,.5,0)))}}),t.on(this,"held",n=>{if(r==n.columnNumber){this.anims.forEach(m=>A.finish(m)),this.anims.clear();const e=this.standard.w2;A.animate(e,{0:{alpha:1.2,"scale.x":1.1,"scale.y":1.1},1:{alpha:0,"scale.x":1,"scale.y":1}},.09,F(.11,0,.5,0))}}),t.on(this,"holdon",n=>{r==n.columnNumber&&(this.holdExplosion.visible=!0)}),t.on(this,"holdoff",n=>{r==n.columnNumber&&(this.holdExplosion.visible=!1)}),t.on(this,"rollon",n=>{r==n.columnNumber&&(this.holdExplosion.visible=!0)}),t.on(this,"rolloff",n=>{r==n.columnNumber&&(this.holdExplosion.visible=!1)}),t.on(this,"hitmine",n=>{if(r==n.columnNumber){const e=new s(c.mine);e.alpha=0,e.anchor.set(.5),e.blendMode=I.ADD,this.addChild(e),A.animate(e,{0:{alpha:1,rotation:0},"0.5":{alpha:1,rotation:90*Math.PI/180},1:{alpha:0,rotation:180*Math.PI/180}},.4,void 0,()=>e.destroy())}}),t.onUpdate(this,()=>{this.holdExplosion.alpha=Math.sin(Date.now()/1e3*Math.PI*2*20)*.1+1}),this.holdExplosion.visible=!1,this.holdExplosion.anchor.set(.5),this.addChild(this.holdExplosion);for(const n of Object.values(this.standard))n.alpha=0,n.anchor.set(.5),this.addChild(n)}}const e0="/smeditor/assets/receptor-d5ef8593.png",o0="/smeditor/assets/bodyActive-105f1d12.png",a0="/smeditor/assets/bodyInactive-e5ca65be.png",i0="/smeditor/assets/bottomCapActive-50553ab4.png",s0="/smeditor/assets/bottomCapInactive-e990106f.png",m0="/smeditor/assets/bodyActive-56c9977a.png",c0="/smeditor/assets/bodyInactive-1234f594.png",l0="/smeditor/assets/bottomCapActive-58c18c0b.png",A0="/smeditor/assets/bottomCapInactive-177e377e.png",U=a.from(e0),l={hold:{active:{body:a.from(o0),bottomCap:a.from(i0)},inactive:{body:a.from(a0),bottomCap:a.from(s0)}},roll:{active:{body:a.from(m0),bottomCap:a.from(l0)},inactive:{body:a.from(c0),bottomCap:a.from(A0)}}},h0={Left:0,Down:-90,Up:90,Right:180,UpLeft:45,UpRight:135,DownRight:-135,DownLeft:-45},d0=["Receptor","Tap","Lift","Fake","Hold Inactive Head","Hold Active Head","Roll Inactive Head","Roll Active Head","NoteFlash"],p0={elements:{Left:{Receptor:i=>{let t;const r=new u,n=new s(U);n.width=64,n.height=64,n.anchor.set(.5);const e=new s(U);return e.width=64,e.height=64,e.alpha=0,e.blendMode=I.ADD,e.anchor.set(.5),r.addChild(n,e),i.noteskin.on(r,"press",m=>m.columnNumber==i.columnNumber&&(e.alpha=.2)),i.noteskin.on(r,"lift",m=>m.columnNumber==i.columnNumber&&(e.alpha=0)),i.noteskin.on(r,"ghosttap",m=>{m.columnNumber==i.columnNumber&&(A.finish(t),t=A.animate(r,{0:{"scale.x":.75,"scale.y":.75},1:{"scale.x":1,"scale.y":1}},.11))}),i.noteskin.onUpdate(r,m=>{const D=(m.getVisualBeat()%1+1)%1,b=H(1-D,.5,1)*255;n.tint=G(b,b,b)}),r},Tap:i=>{const t=new s(a.WHITE);return o.setNoteTex(t,i.note),t.anchor.set(.5),t},NoteFlash:i=>new t0(i.noteskin,i.columnNumber),Fake:{element:"Tap"},Lift:{element:"Tap"},Mine:{element:"Tap"},"Hold Active Head":{element:"Tap"},"Hold Inactive Head":{element:"Tap"},"Hold Active Body":()=>new B(l.hold.active.body),"Hold Inactive Body":()=>new B(l.hold.inactive.body),"Hold Active TopCap":()=>new s(a.EMPTY),"Hold Inactive TopCap":()=>new s(a.EMPTY),"Hold Active BottomCap":()=>new v(l.hold.active.bottomCap),"Hold Inactive BottomCap":()=>new v(l.hold.inactive.bottomCap),"Roll Active Head":{element:"Tap"},"Roll Inactive Head":{element:"Tap"},"Roll Active Body":()=>new B(l.roll.active.body),"Roll Inactive Body":()=>new B(l.roll.inactive.body),"Roll Active TopCap":()=>new s(a.EMPTY),"Roll Inactive TopCap":()=>new s(a.EMPTY),"Roll Active BottomCap":()=>new v(l.roll.active.bottomCap),"Roll Inactive BottomCap":()=>new v(l.roll.inactive.bottomCap)}},load:function(i,t){const r=i.columnName;i.columnName="Left";const n=this.loadElement(i,t);return d0.includes(i.element)&&(n.rotation=h0[r]*Math.PI/180),n},init(){o.initArrowTex()},update(i){o.setArrowTexTime(i.chartManager.app)},hideIcons:["Lift"]};export{p0 as default};
