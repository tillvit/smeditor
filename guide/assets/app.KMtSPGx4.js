import{R as p}from"./chunks/theme.jg51iPrg.js";import{U as o,a6 as u,a7 as c,a8 as l,d as f,u as d,y as m,x as h,a9 as g,aa as A,ab as y,a4 as P,ac as v,ad as w,ae as C,af as R,ag as b,ah as E,ai as S}from"./chunks/framework.uWQxBauq.js";function i(e){if(e.extends){const a=i(e.extends);return{...a,...e,async enhanceApp(t){a.enhanceApp&&await a.enhanceApp(t),e.enhanceApp&&await e.enhanceApp(t)}}}return e}const s=i(p),T=f({name:"VitePressApp",setup(){const{site:e,lang:a,dir:t}=d();return m(()=>{h(()=>{document.documentElement.lang=a.value,document.documentElement.dir=t.value})}),e.value.router.prefetchLinks&&g(),A(),y(),s.setup&&s.setup(),()=>P(s.Layout)}});async function x(){globalThis.__VITEPRESS__=!0;const e=_(),a=D();a.provide(v,e);const t=w(e.route);return a.provide(C,t),a.component("Content",R),a.component("ClientOnly",b),Object.defineProperties(a.config.globalProperties,{$frontmatter:{get(){return t.frontmatter.value}},$params:{get(){return t.page.value.params}}}),s.enhanceApp&&await s.enhanceApp({app:a,router:e,siteData:E}),{app:a,router:e,data:t}}function D(){return l(T)}function _(){let e=o,a;return u(t=>{let n=c(t),r=null;return n&&(e&&(a=n),(e||a===n)&&(n=n.replace(/\.js$/,".lean.js")),r=import(n)),o&&(e=!1),r},s.NotFound)}o&&x().then(({app:e,router:a,data:t})=>{a.go().then(()=>{S(a.route,t.site),e.mount("#app")})});export{x as createApp};