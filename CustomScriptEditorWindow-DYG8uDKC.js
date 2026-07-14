import{r as s,aC as G,j as o,W as X,R as L,D as Me,m as Y}from"./Simfile-BuAoBjS-.js";import{W as ce,T as Re,C as W,b as x,c as ye,V as Ae,d as me,f as le,g as ke}from"./app.js";function ue(e,t){(t==null||t>e.length)&&(t=e.length);for(var n=0,a=Array(t);n<t;n++)a[n]=e[n];return a}function Ie(e){if(Array.isArray(e))return e}function Oe(e,t,n){return(t=We(t))in e?Object.defineProperty(e,t,{value:n,enumerable:!0,configurable:!0,writable:!0}):e[t]=n,e}function Le(e,t){var n=e==null?null:typeof Symbol<"u"&&e[Symbol.iterator]||e["@@iterator"];if(n!=null){var a,r,i,c,l=[],u=!0,p=!1;try{if(i=(n=n.call(e)).next,t!==0)for(;!(u=(a=i.call(n)).done)&&(l.push(a.value),l.length!==t);u=!0);}catch(E){p=!0,r=E}finally{try{if(!u&&n.return!=null&&(c=n.return(),Object(c)!==c))return}finally{if(p)throw r}}return l}}function Be(){throw new TypeError(`Invalid attempt to destructure non-iterable instance.
In order to be iterable, non-array objects must have a [Symbol.iterator]() method.`)}function pe(e,t){var n=Object.keys(e);if(Object.getOwnPropertySymbols){var a=Object.getOwnPropertySymbols(e);t&&(a=a.filter(function(r){return Object.getOwnPropertyDescriptor(e,r).enumerable})),n.push.apply(n,a)}return n}function de(e){for(var t=1;t<arguments.length;t++){var n=arguments[t]!=null?arguments[t]:{};t%2?pe(Object(n),!0).forEach(function(a){Oe(e,a,n[a])}):Object.getOwnPropertyDescriptors?Object.defineProperties(e,Object.getOwnPropertyDescriptors(n)):pe(Object(n)).forEach(function(a){Object.defineProperty(e,a,Object.getOwnPropertyDescriptor(n,a))})}return e}function Fe(e,t){if(e==null)return{};var n,a,r=Ge(e,t);if(Object.getOwnPropertySymbols){var i=Object.getOwnPropertySymbols(e);for(a=0;a<i.length;a++)n=i[a],t.indexOf(n)===-1&&{}.propertyIsEnumerable.call(e,n)&&(r[n]=e[n])}return r}function Ge(e,t){if(e==null)return{};var n={};for(var a in e)if({}.hasOwnProperty.call(e,a)){if(t.indexOf(a)!==-1)continue;n[a]=e[a]}return n}function je(e,t){return Ie(e)||Le(e,t)||_e(e,t)||Be()}function He(e,t){if(typeof e!="object"||!e)return e;var n=e[Symbol.toPrimitive];if(n!==void 0){var a=n.call(e,t);if(typeof a!="object")return a;throw new TypeError("@@toPrimitive must return a primitive value.")}return(t==="string"?String:Number)(e)}function We(e){var t=He(e,"string");return typeof t=="symbol"?t:t+""}function _e(e,t){if(e){if(typeof e=="string")return ue(e,t);var n={}.toString.call(e).slice(8,-1);return n==="Object"&&e.constructor&&(n=e.constructor.name),n==="Map"||n==="Set"?Array.from(e):n==="Arguments"||/^(?:Ui|I)nt(?:8|16|32)(?:Clamped)?Array$/.test(n)?ue(e,t):void 0}}function ze(e,t,n){return t in e?Object.defineProperty(e,t,{value:n,enumerable:!0,configurable:!0,writable:!0}):e[t]=n,e}function he(e,t){var n=Object.keys(e);if(Object.getOwnPropertySymbols){var a=Object.getOwnPropertySymbols(e);t&&(a=a.filter(function(r){return Object.getOwnPropertyDescriptor(e,r).enumerable})),n.push.apply(n,a)}return n}function ge(e){for(var t=1;t<arguments.length;t++){var n=arguments[t]!=null?arguments[t]:{};t%2?he(Object(n),!0).forEach(function(a){ze(e,a,n[a])}):Object.getOwnPropertyDescriptors?Object.defineProperties(e,Object.getOwnPropertyDescriptors(n)):he(Object(n)).forEach(function(a){Object.defineProperty(e,a,Object.getOwnPropertyDescriptor(n,a))})}return e}function Ue(){for(var e=arguments.length,t=new Array(e),n=0;n<e;n++)t[n]=arguments[n];return function(a){return t.reduceRight(function(r,i){return i(r)},a)}}function _(e){return function t(){for(var n=this,a=arguments.length,r=new Array(a),i=0;i<a;i++)r[i]=arguments[i];return r.length>=e.length?e.apply(this,r):function(){for(var c=arguments.length,l=new Array(c),u=0;u<c;u++)l[u]=arguments[u];return t.apply(n,[].concat(r,l))}}}function Q(e){return{}.toString.call(e).includes("Object")}function Ve(e){return!Object.keys(e).length}function U(e){return typeof e=="function"}function $e(e,t){return Object.prototype.hasOwnProperty.call(e,t)}function Ke(e,t){return Q(t)||I("changeType"),Object.keys(t).some(function(n){return!$e(e,n)})&&I("changeField"),t}function Ye(e){U(e)||I("selectorType")}function qe(e){U(e)||Q(e)||I("handlerType"),Q(e)&&Object.values(e).some(function(t){return!U(t)})&&I("handlersType")}function Je(e){e||I("initialIsRequired"),Q(e)||I("initialType"),Ve(e)&&I("initialContent")}function Xe(e,t){throw new Error(e[t]||e.default)}var Qe={initialIsRequired:"initial state is required",initialType:"initial state should be an object",initialContent:"initial state shouldn't be an empty object",handlerType:"handler should be an object or a function",handlersType:"all handlers should be a functions",selectorType:"selector should be a function",changeType:"provided value of changes should be an object",changeField:'it seams you want to change a field in the state which is not specified in the "initial" state',default:"an unknown error accured in `state-local` package"},I=_(Xe)(Qe),q={changes:Ke,selector:Ye,handler:qe,initial:Je};function Ze(e){var t=arguments.length>1&&arguments[1]!==void 0?arguments[1]:{};q.initial(e),q.handler(t);var n={current:e},a=_(nt)(n,t),r=_(tt)(n),i=_(q.changes)(e),c=_(et)(n);function l(){var p=arguments.length>0&&arguments[0]!==void 0?arguments[0]:function(E){return E};return q.selector(p),p(n.current)}function u(p){Ue(a,r,i,c)(p)}return[l,u]}function et(e,t){return U(t)?t(e.current):t}function tt(e,t){return e.current=ge(ge({},e.current),t),t}function nt(e,t,n){return U(t)?t(e.current):Object.keys(n).forEach(function(a){var r;return(r=t[a])===null||r===void 0?void 0:r.call(t,e.current[a])}),n}var at={create:Ze},rt={paths:{vs:"https://cdn.jsdelivr.net/npm/monaco-editor@0.54.0/min/vs"}};function it(e){return function t(){for(var n=this,a=arguments.length,r=new Array(a),i=0;i<a;i++)r[i]=arguments[i];return r.length>=e.length?e.apply(this,r):function(){for(var c=arguments.length,l=new Array(c),u=0;u<c;u++)l[u]=arguments[u];return t.apply(n,[].concat(r,l))}}}function ot(e){return{}.toString.call(e).includes("Object")}function st(e){return e||fe("configIsRequired"),ot(e)||fe("configType"),e.urls?(ct(),{paths:{vs:e.urls.monacoBase}}):e}function ct(){console.warn(Te.deprecation)}function mt(e,t){throw new Error(e[t]||e.default)}var Te={configIsRequired:"the configuration object is required",configType:"the configuration object should be an object",default:"an unknown error accured in `@monaco-editor/loader` package",deprecation:`Deprecation warning!
    You are using deprecated way of configuration.

    Instead of using
      monaco.config({ urls: { monacoBase: '...' } })
    use
      monaco.config({ paths: { vs: '...' } })

    For more please check the link https://github.com/suren-atoyan/monaco-loader#config
  `},fe=it(mt)(Te),lt={config:st},ut=function(){for(var t=arguments.length,n=new Array(t),a=0;a<t;a++)n[a]=arguments[a];return function(r){return n.reduceRight(function(i,c){return c(i)},r)}};function ve(e,t){return Object.keys(t).forEach(function(n){t[n]instanceof Object&&e[n]&&Object.assign(t[n],ve(e[n],t[n]))}),de(de({},e),t)}var pt={type:"cancelation",msg:"operation is manually canceled"};function ae(e){var t=!1,n=new Promise(function(a,r){e.then(function(i){return t?r(pt):a(i)}),e.catch(r)});return n.cancel=function(){return t=!0},n}var dt=["monaco"],ht=at.create({config:rt,isInitialized:!1,resolve:null,reject:null,monaco:null}),Ee=je(ht,2),V=Ee[0],Z=Ee[1];function gt(e){var t=lt.config(e),n=t.monaco,a=Fe(t,dt);Z(function(r){return{config:ve(r.config,a),monaco:n}})}function ft(){var e=V(function(t){var n=t.monaco,a=t.isInitialized,r=t.resolve;return{monaco:n,isInitialized:a,resolve:r}});if(!e.isInitialized){if(Z({isInitialized:!0}),e.monaco)return e.resolve(e.monaco),ae(re);if(window.monaco&&window.monaco.editor)return Ce(window.monaco),e.resolve(window.monaco),ae(re);ut(bt,Tt)(vt)}return ae(re)}function bt(e){return document.body.appendChild(e)}function yt(e){var t=document.createElement("script");return e&&(t.src=e),t}function Tt(e){var t=V(function(a){var r=a.config,i=a.reject;return{config:r,reject:i}}),n=yt("".concat(t.config.paths.vs,"/loader.js"));return n.onload=function(){return e()},n.onerror=t.reject,n}function vt(){var e=V(function(n){var a=n.config,r=n.resolve,i=n.reject;return{config:a,resolve:r,reject:i}}),t=window.require;t.config(e.config),t(["vs/editor/editor.main"],function(n){var a=n.m;Ce(a),e.resolve(a)},function(n){e.reject(n)})}function Ce(e){V().monaco||Z({monaco:e})}function Et(){return V(function(e){var t=e.monaco;return t})}var re=new Promise(function(e,t){return Z({resolve:e,reject:t})}),Se={config:gt,init:ft,__getMonacoInstance:Et},Ct={wrapper:{display:"flex",position:"relative",textAlign:"initial"},fullWidth:{width:"100%"},hide:{display:"none"}},ie=Ct,St={container:{display:"flex",height:"100%",width:"100%",justifyContent:"center",alignItems:"center"}},wt=St;function xt({children:e}){return G.createElement("div",{style:wt.container},e)}var Nt=xt,Pt=Nt;function Dt({width:e,height:t,isEditorReady:n,loading:a,_ref:r,className:i,wrapperProps:c}){return G.createElement("section",{style:{...ie.wrapper,width:e,height:t},...c},!n&&G.createElement(Pt,null,a),G.createElement("div",{ref:r,style:{...ie.fullWidth,...!n&&ie.hide},className:i}))}var Mt=Dt,we=s.memo(Mt);function Rt(e){s.useEffect(e,[])}var xe=Rt;function At(e,t,n=!0){let a=s.useRef(!0);s.useEffect(a.current||!n?()=>{a.current=!1}:e,t)}var P=At;function z(){}function F(e,t,n,a){return kt(e,a)||It(e,t,n,a)}function kt(e,t){return e.editor.getModel(Ne(e,t))}function It(e,t,n,a){return e.editor.createModel(t,n,a?Ne(e,a):void 0)}function Ne(e,t){return e.Uri.parse(t)}function Ot({original:e,modified:t,language:n,originalLanguage:a,modifiedLanguage:r,originalModelPath:i,modifiedModelPath:c,keepCurrentOriginalModel:l=!1,keepCurrentModifiedModel:u=!1,theme:p="light",loading:E="Loading...",options:h={},height:A="100%",width:D="100%",className:M,wrapperProps:O={},beforeMount:R=z,onMount:j=z}){let[v,m]=s.useState(!1),[T,b]=s.useState(!0),y=s.useRef(null),g=s.useRef(null),N=s.useRef(null),C=s.useRef(j),d=s.useRef(R),B=s.useRef(!1);xe(()=>{let f=Se.init();return f.then(S=>(g.current=S)&&b(!1)).catch(S=>S?.type!=="cancelation"&&console.error("Monaco initialization: error:",S)),()=>y.current?H():f.cancel()}),P(()=>{if(y.current&&g.current){let f=y.current.getOriginalEditor(),S=F(g.current,e||"",a||n||"text",i||"");S!==f.getModel()&&f.setModel(S)}},[i],v),P(()=>{if(y.current&&g.current){let f=y.current.getModifiedEditor(),S=F(g.current,t||"",r||n||"text",c||"");S!==f.getModel()&&f.setModel(S)}},[c],v),P(()=>{let f=y.current.getModifiedEditor();f.getOption(g.current.editor.EditorOption.readOnly)?f.setValue(t||""):t!==f.getValue()&&(f.executeEdits("",[{range:f.getModel().getFullModelRange(),text:t||"",forceMoveMarkers:!0}]),f.pushUndoStop())},[t],v),P(()=>{y.current?.getModel()?.original.setValue(e||"")},[e],v),P(()=>{let{original:f,modified:S}=y.current.getModel();g.current.editor.setModelLanguage(f,a||n||"text"),g.current.editor.setModelLanguage(S,r||n||"text")},[n,a,r],v),P(()=>{g.current?.editor.setTheme(p)},[p],v),P(()=>{y.current?.updateOptions(h)},[h],v);let $=s.useCallback(()=>{if(!g.current)return;d.current(g.current);let f=F(g.current,e||"",a||n||"text",i||""),S=F(g.current,t||"",r||n||"text",c||"");y.current?.setModel({original:f,modified:S})},[n,t,r,e,a,i,c]),K=s.useCallback(()=>{!B.current&&N.current&&(y.current=g.current.editor.createDiffEditor(N.current,{automaticLayout:!0,...h}),$(),g.current?.editor.setTheme(p),m(!0),B.current=!0)},[h,p,$]);s.useEffect(()=>{v&&C.current(y.current,g.current)},[v]),s.useEffect(()=>{!T&&!v&&K()},[T,v,K]);function H(){let f=y.current?.getModel();l||f?.original?.dispose(),u||f?.modified?.dispose(),y.current?.dispose()}return G.createElement(we,{width:D,height:A,isEditorReady:v,loading:E,_ref:N,className:M,wrapperProps:O})}var Lt=Ot;s.memo(Lt);function Bt(e){let t=s.useRef();return s.useEffect(()=>{t.current=e},[e]),t.current}var Ft=Bt,J=new Map;function Gt({defaultValue:e,defaultLanguage:t,defaultPath:n,value:a,language:r,path:i,theme:c="light",line:l,loading:u="Loading...",options:p={},overrideServices:E={},saveViewState:h=!0,keepCurrentModel:A=!1,width:D="100%",height:M="100%",className:O,wrapperProps:R={},beforeMount:j=z,onMount:v=z,onChange:m,onValidate:T=z}){let[b,y]=s.useState(!1),[g,N]=s.useState(!0),C=s.useRef(null),d=s.useRef(null),B=s.useRef(null),$=s.useRef(v),K=s.useRef(j),H=s.useRef(),f=s.useRef(a),S=Ft(i),oe=s.useRef(!1),ee=s.useRef(!1);xe(()=>{let w=Se.init();return w.then(k=>(C.current=k)&&N(!1)).catch(k=>k?.type!=="cancelation"&&console.error("Monaco initialization: error:",k)),()=>d.current?De():w.cancel()}),P(()=>{let w=F(C.current,e||a||"",t||r||"",i||n||"");w!==d.current?.getModel()&&(h&&J.set(S,d.current?.saveViewState()),d.current?.setModel(w),h&&d.current?.restoreViewState(J.get(i)))},[i],b),P(()=>{d.current?.updateOptions(p)},[p],b),P(()=>{!d.current||a===void 0||(d.current.getOption(C.current.editor.EditorOption.readOnly)?d.current.setValue(a):a!==d.current.getValue()&&(ee.current=!0,d.current.executeEdits("",[{range:d.current.getModel().getFullModelRange(),text:a,forceMoveMarkers:!0}]),d.current.pushUndoStop(),ee.current=!1))},[a],b),P(()=>{let w=d.current?.getModel();w&&r&&C.current?.editor.setModelLanguage(w,r)},[r],b),P(()=>{l!==void 0&&d.current?.revealLine(l)},[l],b),P(()=>{C.current?.editor.setTheme(c)},[c],b);let se=s.useCallback(()=>{if(!(!B.current||!C.current)&&!oe.current){K.current(C.current);let w=i||n,k=F(C.current,a||e||"",t||r||"",w||"");d.current=C.current?.editor.create(B.current,{model:k,automaticLayout:!0,...p},E),h&&d.current.restoreViewState(J.get(w)),C.current.editor.setTheme(c),l!==void 0&&d.current.revealLine(l),y(!0),oe.current=!0}},[e,t,n,a,r,i,p,E,h,c,l]);s.useEffect(()=>{b&&$.current(d.current,C.current)},[b]),s.useEffect(()=>{!g&&!b&&se()},[g,b,se]),f.current=a,s.useEffect(()=>{b&&m&&(H.current?.dispose(),H.current=d.current?.onDidChangeModelContent(w=>{ee.current||m(d.current.getValue(),w)}))},[b,m]),s.useEffect(()=>{if(b){let w=C.current.editor.onDidChangeMarkers(k=>{let te=d.current.getModel()?.uri;if(te&&k.find(ne=>ne.path===te.path)){let ne=C.current.editor.getModelMarkers({resource:te});T?.(ne)}});return()=>{w?.dispose()}}return()=>{}},[b,T]);function De(){H.current?.dispose(),A?h&&J.set(i,d.current.saveViewState()):d.current.getModel()?.dispose(),d.current.dispose()}return G.createElement(we,{width:D,height:M,isEditorReady:b,loading:u,_ref:B,className:O,wrapperProps:R})}var jt=Gt,Ht=s.memo(jt);const Wt=`declare module "app/src/chart/stats/parity/ParityDataTypes" {
    import { HoldNotedataEntry, NotedataEntry } from "app/src/chart/sm/NoteTypes";
    export enum Foot {
        NONE = 0,
        LEFT_HEEL = 1,
        LEFT_TOE = 2,
        RIGHT_HEEL = 3,
        RIGHT_TOE = 4
    }
    export const FEET: Foot[];
    export const OTHER_PART_OF_FOOT: Foot[];
    export const FEET_LABELS: string[];
    export const FEET_LABELS_LONG: string[];
    export const FEET_LABEL_TO_FOOT: {
        [key: string]: Foot;
    };
    export type FootOverride = "Left" | "Right" | Foot;
    export interface PlacementData {
        previousLeftPos: {
            x: number;
            y: number;
        };
        previousRightPos: {
            x: number;
            y: number;
        };
        leftPos: {
            x: number;
            y: number;
        };
        rightPos: {
            x: number;
            y: number;
        };
        movedLeft: boolean;
        movedRight: boolean;
        leftBracket: boolean;
        rightBracket: boolean;
        previousJumped: boolean;
        jumped: boolean;
        leftJack: boolean;
        rightJack: boolean;
        leftDoubleStep: boolean;
        rightDoubleStep: boolean;
        initialState: ParityState;
        resultState: ParityState;
    }
    export const DEFAULT_WEIGHTS: {
        [key: string]: number;
    };
    export const WEIGHT_SHORT_NAMES: {
        [id: string]: string;
    };
    export enum TechCategory {
        Crossovers = 0,
        Footswitches = 1,
        Sideswitches = 2,
        Jacks = 3,
        Brackets = 4,
        Doublesteps = 5,
        Holdswitch = 6
    }
    export const TECH_STRINGS: Record<number, string>;
    export enum TechErrors {
        UnmarkedDoublestep = 0,
        MissedFootswitch = 1,
        Ambiguous = 2
    }
    export const TECH_DESCRIPTIONS: {
        [key in TechCategory]: {
            title: string;
            description: string;
        };
    };
    export const TECH_ERROR_STRINGS: Record<number, string>;
    export const TECH_ERROR_STRING_REVERSE: Record<string, TechErrors>;
    export const TECH_ERROR_DESCRIPTIONS: {
        [key in TechErrors]: {
            title: string;
            description: string;
        };
    };
    export class ParityState {
        action: Foot[];
        combinedColumns: Foot[];
        movedFeet: Set<Foot>;
        holdFeet: Set<Foot>;
        frontFoot: Foot | null;
        second: number;
        beat: number;
        rowKey: string;
        footColumns: number[];
        constructor(row: Row, action: Foot[], columns?: number[]);
        get leftHeel(): number;
        get leftToe(): number;
        get rightHeel(): number;
        get rightToe(): number;
        toKey(): string;
    }
    export interface Row {
        notes: (NotedataEntry | undefined)[];
        holds: (HoldNotedataEntry | undefined)[];
        holdTails: Set<number>;
        mines: (number | undefined)[];
        fakeMines: (number | undefined)[];
        second: number;
        beat: number;
        columns: Foot[];
        overrides: FootOverride[];
        id: string;
    }
}
declare module "app/src/chart/sm/NoteTypes" {
    import { Foot, FootOverride } from "app/src/chart/stats/parity/ParityDataTypes";
    export type Notedata = NotedataEntry[];
    export type RowData = {
        notes: NotedataEntry[];
        beat: number;
        second: number;
        warped: boolean;
        faked: boolean;
    };
    export type PartialNotedata = PartialNotedataEntry[];
    export const HOLD_NOTE_TYPES: readonly ["Hold", "Roll"];
    export const TAP_NOTE_TYPES: readonly ["Tap", "Mine", "Lift", "Fake"];
    export type NoteType = TapNoteType | HoldNoteType;
    export type HoldNoteType = (typeof HOLD_NOTE_TYPES)[number];
    export type TapNoteType = (typeof TAP_NOTE_TYPES)[number];
    export interface ExtraNoteData {
        attributes: ExtraNoteAttributes;
        computed?: {
            fake: boolean;
        };
    }
    export interface ExtraStepP1Attributes {
        type: "stepp1";
        holdEndType?: string;
        noteType: string;
        attribute: string;
        fake: boolean;
    }
    export interface ExtraXsanityAttributes {
        type: "xsanity";
        holdEndType?: string;
        noteType: string;
        skin: string;
        attribute: string;
    }
    export interface ExtraOutfoxAttributes {
        type: "outfox";
        holdEndType?: string;
        source: "fake" | "original";
        notemods: string;
        keysounds: string;
    }
    export type ExtraNoteAttributes = ExtraStepP1Attributes | ExtraXsanityAttributes | ExtraOutfoxAttributes;
    export interface NotedataEntryBase {
        beat: number;
        col: number;
        extra?: ExtraNoteData;
    }
    export interface PartialTapNotedataEntry extends NotedataEntryBase {
        type: TapNoteType;
    }
    export interface PartialHoldNotedataEntry extends NotedataEntryBase {
        hold: number;
        type: HoldNoteType;
    }
    export type PartialNotedataEntry = PartialTapNotedataEntry | PartialHoldNotedataEntry;
    interface ExtraNotedata {
        warped: boolean;
        fake: boolean;
        second: number;
        quant: number;
        gameplay?: {
            hideNote: boolean;
            hasHit: boolean;
        };
        parity?: {
            foot?: Foot;
            override?: FootOverride;
            tech?: string;
        };
    }
    export type TapNotedataEntry = PartialTapNotedataEntry & ExtraNotedata;
    export type HoldNotedataEntry = PartialHoldNotedataEntry & ExtraNotedata & {
        gameplay?: {
            lastHoldActivation?: number;
            droppedHoldBeat?: number;
        };
    };
    export type NotedataEntry = TapNotedataEntry | HoldNotedataEntry;
    export function isTapNote<T extends PartialNotedataEntry>(note: T): note is Exclude<T, {
        hold: number;
    }>;
    export function isHoldNote<T extends PartialNotedataEntry>(note: T): note is Extract<T, {
        hold: number;
    }>;
}
declare module "app/src/chart/sm/TimingTypes" {
    export const TIMING_EVENT_NAMES: readonly ["BPMS", "STOPS", "WARPS", "DELAYS", "LABELS", "SPEEDS", "SCROLLS", "TICKCOUNTS", "TIMESIGNATURES", "COMBOS", "FAKES", "ATTACKS", "BGCHANGES", "FGCHANGES"];
    export type TimingEventType = (typeof TIMING_EVENT_NAMES)[number];
    export type TimingType = "OFFSET" | TimingEventType;
    export const BEAT_TIMING_EVENT_NAMES: readonly ["BPMS", "STOPS", "WARPS", "DELAYS", "WARP_DEST"];
    export type BeatTimingEventType = (typeof BEAT_TIMING_EVENT_NAMES)[number];
    export interface BeatTimingCache {
        beat: number;
        secondBefore: number;
        secondOf: number;
        secondAfter: number;
        secondClamp: number;
        bpm: number;
        warped: boolean;
    }
    export interface MeasureTimingCache {
        beat: number;
        measure: number;
        beatsPerMeasure: number;
        divisionLength: number;
        numDivisions: number;
    }
    export interface ScrollCacheTimingEvent extends ScrollTimingEvent {
        effectiveBeat?: number;
    }
    export interface BPMTimingEvent {
        type: "BPMS";
        beat: number;
        value: number;
    }
    export interface StopTimingEvent {
        type: "STOPS";
        beat: number;
        value: number;
    }
    export interface WarpTimingEvent {
        type: "WARPS";
        beat: number;
        value: number;
    }
    export interface WarpDestTimingEvent {
        type: "WARP_DEST";
        beat: number;
        value: number;
    }
    export interface DelayTimingEvent {
        type: "DELAYS";
        beat: number;
        value: number;
    }
    export interface ScrollTimingEvent {
        type: "SCROLLS";
        beat: number;
        value: number;
    }
    export interface TickCountTimingEvent {
        type: "TICKCOUNTS";
        beat: number;
        value: number;
    }
    export interface FakeTimingEvent {
        type: "FAKES";
        beat: number;
        value: number;
    }
    export interface LabelTimingEvent {
        type: "LABELS";
        beat: number;
        value: string;
    }
    export interface SpeedTimingEvent {
        type: "SPEEDS";
        beat: number;
        value: number;
        delay: number;
        unit: "B" | "T";
    }
    export interface TimeSignatureTimingEvent {
        type: "TIMESIGNATURES";
        beat: number;
        upper: number;
        lower: number;
    }
    export interface ComboTimingEvent {
        type: "COMBOS";
        beat: number;
        hitMult: number;
        missMult: number;
    }
    export interface AttackTimingEvent {
        type: "ATTACKS";
        second: number;
        endType: "LEN" | "END";
        value: number;
        mods: string;
    }
    export interface BGChangeTimingEvent {
        type: "BGCHANGES";
        beat: number;
        file: string;
        updateRate: number;
        crossFade: boolean;
        stretchRewind: boolean;
        stretchNoLoop: boolean;
        effect: string;
        file2: string;
        transition: string;
        color1: string;
        color2: string;
    }
    export interface FGChangeTimingEvent {
        type: "FGCHANGES";
        beat: number;
        file: string;
        updateRate: number;
        crossFade: boolean;
        stretchRewind: boolean;
        stretchNoLoop: boolean;
        effect: string;
        file2: string;
        transition: string;
        color1: string;
        color2: string;
    }
    export type TimingEvent = BPMTimingEvent | StopTimingEvent | WarpTimingEvent | DelayTimingEvent | ScrollTimingEvent | TickCountTimingEvent | FakeTimingEvent | LabelTimingEvent | SpeedTimingEvent | TimeSignatureTimingEvent | ComboTimingEvent | AttackTimingEvent | BGChangeTimingEvent | FGChangeTimingEvent;
    export type Cached<T extends TimingEvent> = T & {
        beat: number;
        second: number;
    };
    export type BeatTimingEvent = BPMTimingEvent | StopTimingEvent | WarpTimingEvent | WarpDestTimingEvent | DelayTimingEvent;
    export type TimingCache = {
        beatTiming?: BeatTimingCache[];
        effectiveBeatTiming?: ScrollCacheTimingEvent[];
        measureTiming?: MeasureTimingCache[];
        sortedEvents?: Cached<TimingEvent>[];
        warpedBeats: Map<number, boolean>;
        beatsToSeconds: Map<string, number>;
        beatsToEffectiveBeats: Map<number, number>;
    };
    export type DeletableEvent = Partial<Cached<TimingEvent>> & Pick<TimingEvent, "type">;
    export type TimingColumnType = "continuing" | "instant";
}
declare module "app/src/chart/sm/TimingData" {
    import { AttackTimingEvent, BGChangeTimingEvent, BPMTimingEvent, BeatTimingCache, Cached, ComboTimingEvent, DelayTimingEvent, DeletableEvent, FGChangeTimingEvent, FakeTimingEvent, LabelTimingEvent, ScrollTimingEvent, SpeedTimingEvent, StopTimingEvent, TickCountTimingEvent, TimeSignatureTimingEvent, TimingCache, TimingColumnType, TimingEvent, TimingEventType, TimingType, WarpTimingEvent } from "app/src/chart/sm/TimingTypes";
    export const TIMING_DATA_PRECISION = 6;
    export const TIMING_DATA_DISPLAY_PRECISION = 3;
    export abstract class TimingData {
        protected readonly _cache: TimingCache;
        protected columns: {
            [Type in TimingEventType]?: Cached<Extract<TimingEvent, {
                type: Type;
            }>>[];
        };
        protected offset?: number;
        protected callListeners(modifiedEvents?: {
            type: TimingEventType;
        }[]): void;
        private buildBeatTimingDataCache;
        private buildEffectiveBeatTimingDataCache;
        private buildMeasureTimingCache;
        private binarySearch;
        private binarySearchIndex;
        private mergeColumns;
        private mergeTwoColumns;
        private splitEvents;
        private splitEventPairs;
        abstract getColumn<Type extends TimingEventType>(type: Type): Cached<Extract<TimingEvent, {
            type: Type;
        }>>[];
        getAllColumns(): {
            BPMS?: Cached<BPMTimingEvent>[] | undefined;
            STOPS?: Cached<StopTimingEvent>[] | undefined;
            WARPS?: Cached<WarpTimingEvent>[] | undefined;
            DELAYS?: Cached<DelayTimingEvent>[] | undefined;
            LABELS?: Cached<LabelTimingEvent>[] | undefined;
            SPEEDS?: Cached<SpeedTimingEvent>[] | undefined;
            SCROLLS?: Cached<ScrollTimingEvent>[] | undefined;
            TICKCOUNTS?: Cached<TickCountTimingEvent>[] | undefined;
            TIMESIGNATURES?: Cached<TimeSignatureTimingEvent>[] | undefined;
            COMBOS?: Cached<ComboTimingEvent>[] | undefined;
            FAKES?: Cached<FakeTimingEvent>[] | undefined;
            ATTACKS?: Cached<AttackTimingEvent>[] | undefined;
            BGCHANGES?: Cached<BGChangeTimingEvent>[] | undefined;
            FGCHANGES?: Cached<FGChangeTimingEvent>[] | undefined;
        };
        parse(type: TimingType, data: string): void;
        abstract getOffset(): number;
        setOffset(offset: number): void;
        /**
         * Serializes the timing data into a string that can be saved in an SM/SSC file.
         * @param fileType The format to serialize for.
         * @returns
         */
        serialize(fileType: "sm" | "ssc" | "smebak"): string;
        private formatProperty;
        protected createColumn(type: TimingEventType): void;
        private getTime;
        private isNullEvent;
        private isSimilar;
        private removeOverlapping;
        private compareEvents;
        protected insertEvents(type: TimingEventType, events: TimingEvent[]): (Cached<WarpTimingEvent> | Cached<BPMTimingEvent> | Cached<ScrollTimingEvent> | Cached<TimeSignatureTimingEvent> | Cached<StopTimingEvent> | Cached<DelayTimingEvent> | Cached<LabelTimingEvent> | Cached<SpeedTimingEvent> | Cached<TickCountTimingEvent> | Cached<ComboTimingEvent> | Cached<FakeTimingEvent> | Cached<AttackTimingEvent> | Cached<BGChangeTimingEvent> | Cached<FGChangeTimingEvent>)[];
        protected deleteEvents(type: TimingEventType, events: DeletableEvent[]): Cached<TimingEvent>[];
        /**
         * Returns the type of the column for a given timing event type.
         * "continuing" columns are columns where the most recent event takes precedence (BPMS, SCROLLS, etc).
         *
         * "instant" columns are columns where events have an instant effect (STOPS, WARPS, etc).
         * @param type
         * @returns
         */
        static getColumnType(type: TimingEventType): TimingColumnType;
        protected findConflictingEvents(type: TimingEventType): TimingEvent[];
        protected parseEvents<Type extends TimingEventType>(type: Type, data: string): void;
        protected typeRequiresSSC(type: TimingEventType): boolean;
        /**
         * Returns a default event for a given type and beat.
         * @param type
         * @param beat
         * @returns
         */
        getDefaultEvent(type: TimingEventType, beat: number): Cached<TimingEvent>;
        /**
         * Gets the event at a given beat with the given type.
         * For continuing events, will return the most recent event before the beat if there is no event at the beat. For instant events, will return undefined if there is no event at the beat.
         *
         * @param type The type of the event to get.
         * @param beat The beat to get the event at.
         * @param useDefault Whether to return a default event if there is no event at the beat. Only applies to continuing events.
         * @returns
         */
        getEventAtBeat<Type extends TimingEventType>(type: Type, beat: number, useDefault?: boolean): Cached<Extract<TimingEvent, {
            type: Type;
        }>> | undefined;
        protected updateEvents(type: TimingEventType): void;
        _insert(events: TimingEvent[]): {
            events: TimingEvent[];
            insertConflicts: TimingEvent[];
            errors: TimingEvent[];
        };
        _modify(events: [TimingEvent, TimingEvent][]): {
            newEvents: TimingEvent[];
            oldEvents: TimingEvent[];
            insertConflicts: TimingEvent[];
            errors: TimingEvent[];
        };
        _delete(events: DeletableEvent[]): {
            removedEvents: Cached<TimingEvent>[];
            errors: TimingEvent[];
        };
        /**
         * Inserts events into the timing data.
         * If you want to insert events while respecting split timing, use ChartTimingData.insertColumnEvents instead.
         * @param events The events to insert.
         */
        insert(events: TimingEvent[]): void;
        /**
         * Modifies events in the timing data.
         * If you want to modify events while respecting split timing, use ChartTimingData.modifyColumnEvents instead.
         * @param events The events to modify, represented as pairs of [oldEvent, newEvent].
         */
        modify(events: [TimingEvent, TimingEvent][]): void;
        /**
         * Deletes events from the timing data.
         * If you want to delete events while respecting split timing, use ChartTimingData.deleteColumnEvents instead.
         * @param events
         */
        delete(events: DeletableEvent[]): void;
        findEvents(events: TimingEvent[]): Cached<TimingEvent>[];
        /**
         * Returns the beat for a given second.
         * @param seconds
         * @returns
         */
        getBeatFromSeconds(seconds: number): number;
        /**
         * Returns the seconds for a given beat.
         * @param beat
         * @param option Determines how to calculate the seconds when the beat is exactly on an event. "" is the default, "before" will return the seconds before a DELAY event, "after" will return the seconds after STOPS/DELAYS, and "noclamp" will return the unclamped seconds when negative bpms are used
         * @returns
         */
        getSecondsFromBeat(beat: number, option?: "noclamp" | "before" | "after" | ""): number;
        /**
         * Returns whether a given beat is warped over with a WARP event or a negative BPM.
         * @param beat
         * @returns
         */
        isBeatWarped(beat: number): boolean;
        /**
         * Returns whether a given beat is faked using a FAKE event.
         * @param beat
         * @returns
         */
        isBeatFaked(beat: number): boolean;
        /**
         * Gets the measure for a given beat.
         * @param beat
         * @returns
         */
        getMeasure(beat: number): number;
        /**
         * Gets the length of a division for a given beat.
         * @param beat
         * @returns
         */
        getDivisionLength(beat: number): number;
        /**
         * Returns a length of a measure in beats at a given beat.
         * @param beat
         * @returns
         */
        getMeasureLength(beat: number): number;
        /**
         * Gets the beat of the measure for a given beat.
         * @param beat
         * @returns
         */
        getBeatOfMeasure(beat: number): number;
        /**
         * Returns the beat for a given measure.
         * @param measure
         * @returns
         */
        getBeatFromMeasure(measure: number): number;
        /**
         * Gets the division number for a given beat within its measure.
         * @param beat
         * @returns
         */
        getDivisionOfMeasure(beat: number): number;
        /**
         * Generates measure beats within a range of beats. Each beat is of the form [beat, isMeasure], where isMeasure is true if the beat is the start of a measure.
         * @param firstBeat
         * @param lastBeat
         */
        getMeasureBeats(firstBeat: number, lastBeat: number): Generator<[number, boolean], void>;
        /**
         * Returns the effective beat for a given beat, which is the beat adjusted for any SCROLL events.
         * @param beat
         * @returns
         */
        getEffectiveBeat(beat: number): number;
        /**
         * Returns the beat for a given effective beat, which is the beat adjusted for any SCROLL events. This is the inverse of getEffectiveBeat.
         * Because of negative SCROLLS, there can be multiple beats that map to the same effective beat. In this case, this function will return the earliest beat that maps to the effective beat.
         * @param effBeat
         * @returns
         */
        getBeatFromEffectiveBeat(effBeat: number): number;
        /**
         * Returns the speed multiplier for a given beat and second.
         * @param beat
         * @param seconds
         * @returns
         */
        getSpeedMult(beat: number, seconds: number): number;
        /**
         * Snaps a beat to the closest tick based on the given snap interval. This respects time signatures.
         * @param beat
         * @param snap
         * @returns
         */
        snapToClosestTick(beat: number, snap: number): number;
        /**
         * Snaps a beat to the previous tick based on the given snap interval. This respects time signatures.
         * @param beat
         * @param snap
         * @returns
         */
        snapToPreviousTick(beat: number, snap: number): number;
        /**
         * Snaps a beat to the next tick based on the given snap interval. This respects time signatures.
         * @param beat
         * @param snap
         * @returns
         */
        snapToNextTick(beat: number, snap: number): number;
        reloadCache(types?: TimingType[]): void;
        getBeatTiming(): BeatTimingCache[];
        /**
         * Returns all events of the given types, sorted by beat. If no types are given, returns all events of all types sorted by beat.
         * @param props
         * @returns
         */
        getTimingData(): Cached<TimingEvent>[];
        getTimingData<Type extends TimingEventType>(...props: Type[]): Cached<Extract<TimingEvent, {
            type: Type;
        }>>[];
        /**
         * Returns true if any SSC features are used.
         * @returns
         */
        requiresSSC(): boolean;
        destroy(): void;
    }
}
declare module "app/src/chart/gameTypes/base/GameLogic" {
    import { ChartManager } from "app/src/chart/ChartManager";
    import { Notedata, NotedataEntry } from "app/src/chart/sm/NoteTypes";
    import { TimingData } from "app/src/chart/sm/TimingData";
    export abstract class GameLogic {
        /**
         * Called every frame to update the game logic
         *
         * @abstract
         * @param {ChartManager} chartManager
         * @memberof GameLogic
         */
        abstract update(chartManager: ChartManager): void;
        /**
         * Called when play mode is started.
         *
         * @abstract
         * @param {ChartManager} chartManager
         * @memberof GameLogic
         */
        abstract startPlay(chartManager: ChartManager): void;
        /**
         * Called when a column is pressed down.
         *
         * @abstract
         * @param chartManager
         * @param {number} col
         * @memberof GameLogic
         */
        abstract keyDown(chartManager: ChartManager, col: number): void;
        /**
         * Called when a column is released.
         *
         * @abstract
         * @param chartManager
         * @param {number} col
         * @memberof GameLogic
         */
        abstract keyUp(chartManager: ChartManager, col: number): void;
        /**
         * Determines whether a note should activate assist tick.
         *
         * @abstract
         * @param {NotedataEntry} note
         * @return {*}  {boolean}
         * @memberof GameLogic
         */
        abstract shouldAssistTick(note: NotedataEntry): boolean;
        abstract calculateMaxDP(notedata: Notedata, timingData: TimingData): number;
        abstract usesHoldTicks: boolean;
        abstract comboIsPerRow: boolean;
        abstract missComboIsPerRow: boolean;
    }
}
declare module "app/src/chart/gameTypes/base/NotedataParser" {
    import { PartialNotedata } from "app/src/chart/sm/NoteTypes";
    import { GameType } from "app/src/chart/gameTypes/GameTypeRegistry";
    export abstract class NotedataParser {
        /**
         * Parses the string into Notedata.
         *
         * @abstract
         * @param {string} data
         * @param gameType
         * @return {*}  {PartialNotedata}
         * @memberof NotedataParser
         */
        abstract fromString(data: string, gameType: GameType): PartialNotedata;
        /**
         * Converts Notedata into SM form.
         *
         * @abstract
         * @param {PartialNotedata} notedata
         * @param {GameType} gameType
         * @return {*}  {string}
         * @memberof NotedataParser
         */
        abstract serialize(notedata: PartialNotedata, gameType: GameType): string;
    }
}
declare module "app/src/chart/gameTypes/common/BasicGameLogic" {
    import { ColHeldTracker } from "app/src/util/ColHeldTracker";
    import { ChartManager } from "app/src/chart/ChartManager";
    import { TimingWindowCollection } from "app/src/chart/play/TimingWindowCollection";
    import { HoldNotedataEntry, Notedata, NotedataEntry } from "app/src/chart/sm/NoteTypes";
    import { TimingData } from "app/src/chart/sm/TimingData";
    import { GameLogic } from "app/src/chart/gameTypes/base/GameLogic";
    export class BasicGameLogic extends GameLogic {
        protected chordCohesion: Map<number, NotedataEntry[]>;
        protected missNoteIndex: number;
        protected holdProgress: HoldNotedataEntry[];
        protected heldCols: ColHeldTracker;
        protected collection: TimingWindowCollection;
        usesHoldTicks: boolean;
        comboIsPerRow: boolean;
        missComboIsPerRow: boolean;
        update(chartManager: ChartManager): void;
        startPlay(chartManager: ChartManager): void;
        keyDown(chartManager: ChartManager, col: number): void;
        keyUp(chartManager: ChartManager, col: number): void;
        shouldAssistTick(note: NotedataEntry): boolean;
        protected hitNote(chartManager: ChartManager, note: NotedataEntry, hitTime: number): void;
        protected getClosestNote(notedata: Notedata, hitTime: number, col: number, types: string[], windowMS?: number): NotedataEntry | undefined;
        protected shouldDropHold(note: HoldNotedataEntry, time: number): boolean;
        calculateMaxDP(notedata: Notedata, _: TimingData): number;
    }
}
declare module "app/src/chart/gameTypes/common/BasicNotedataParser" {
    import { PartialHoldNotedataEntry, PartialNotedata, PartialNotedataEntry } from "app/src/chart/sm/NoteTypes";
    import { NotedataParser } from "app/src/chart/gameTypes/base/NotedataParser";
    import { GameType } from "app/src/chart/gameTypes/GameTypeRegistry";
    export class BasicNotedataParser extends NotedataParser {
        serialize(notedata: PartialNotedata, gameType: GameType): string;
        serializeNote(note: PartialNotedataEntry): string;
        serializeHoldEnd(note: PartialHoldNotedataEntry): string;
        parseNote(note: string, beat: number, col: number, holds: (PartialNotedataEntry | undefined)[]): PartialNotedataEntry | undefined;
        parseTokens(row: string): string[];
        parseRow(row: string, beat: number, gameType: GameType, holds: (PartialNotedataEntry | undefined)[]): PartialNotedata;
        fromString(data: string, gameType: GameType): PartialNotedata;
    }
}
declare module "app/src/chart/gameTypes/pump/PumpGameLogic" {
    import { ChartManager } from "app/src/chart/ChartManager";
    import { TimingWindowCollection } from "app/src/chart/play/TimingWindowCollection";
    import { HoldNotedataEntry, Notedata, NotedataEntry } from "app/src/chart/sm/NoteTypes";
    import { TimingData } from "app/src/chart/sm/TimingData";
    import { BasicGameLogic } from "app/src/chart/gameTypes/common/BasicGameLogic";
    interface Tick {
        beat: number;
        note: HoldNotedataEntry;
        second: number;
        hit: boolean;
        hitAll: boolean;
    }
    interface HoldTickData {
        ticks: Tick[];
        missIndex: number;
        hitIndex: number;
        activeIndex: number;
    }
    export class PumpGameLogic extends BasicGameLogic {
        protected tickProgress: Map<HoldNotedataEntry, HoldTickData>;
        protected tickCohesion: Map<number, number>;
        protected pendingTicks: Map<number, Tick[]>;
        protected collection: TimingWindowCollection;
        protected holdIndex: number;
        usesHoldTicks: boolean;
        comboIsPerRow: boolean;
        missComboIsPerRow: boolean;
        update(chartManager: ChartManager): void;
        protected hitNote(chartManager: ChartManager, note: NotedataEntry, hitTime: number): void;
        startPlay(chartManager: ChartManager): void;
        keyDown(chartManager: ChartManager, col: number): void;
        protected shouldDropHold(note: HoldNotedataEntry, time: number): boolean;
        protected generateHoldTicks(timingData: TimingData, hold: HoldNotedataEntry): number[];
        calculateMaxDP(notedata: Notedata, timingData: TimingData): number;
    }
}
declare module "app/src/chart/gameTypes/GameTypeRegistry" {
    import { TapNoteType } from "app/src/chart/sm/NoteTypes";
    import { NotedataParser } from "app/src/chart/gameTypes/base/NotedataParser";
    export interface GameType {
        id: string;
        numCols: number;
        columnWidths: number[];
        notefieldWidth: number;
        columnNames: string[];
        parser: NotedataParser;
        editNoteTypes: TapNoteType[];
        flipColumns: {
            horizontal: number[];
            vertical: number[];
        };
    }
    export class GameTypeRegistry {
        private static gameTypes;
        private static priority;
        static register(gameType: Omit<GameType, "notefieldWidth">): void;
        static getPriority(): GameType[];
        static getGameType(id: string): GameType | undefined;
        static getTypes(): Record<string, GameType>;
    }
}
declare module "app/src/chart/stats/ChartAnalyzer" {
    import { Chart } from "app/src/chart/sm/Chart";
    export abstract class ChartAnalyzer {
        protected readonly chart: Chart;
        constructor(chart: Chart);
        /**
         * Clear any caches used by this analyzer. Timing events that affect timing will trigger the entire chart to be analyzed
         *
         * @abstract
         * @memberof ChartAnalyzer
         */
        reset(): void;
        /**
         * Calculate data for the entire chart. This method will be called after reset().
         * @abstract
         * @memberof ChartAnalyzer
         */
        abstract calculateAll(): void;
        /**
         * Recalculate data for the chart for a given range of beats
         *
         * @abstract
         * @param {number} startBeat
         * @param {number} endBeat
         * @memberof ChartAnalyzer
         */
        abstract recalculate(startBeat: number, endBeat: number): void;
        /**
         * Called when the chart is unloaded.
         *
         * @abstract
         * @memberof ChartAnalyzer
         */
        onUnload(): void;
        /**
         * Called when the chart is loaded.
         *
         * @abstract
         * @memberof ChartAnalyzer
         */
        onLoad(): void;
        /**
         * Called when the chart is destroyed.
         *
         * @abstract
         * @memberof ChartAnalyzer
         */
        destroy(): void;
    }
}
declare module "app/src/chart/stats/NoteTypeAnalyzer" {
    import { ChartAnalyzer } from "app/src/chart/stats/ChartAnalyzer";
    export class NoteTypeAnalyzer extends ChartAnalyzer {
        calculateAll(): void;
        recalculate(): void;
    }
}
declare module "app/src/chart/stats/NPSAnalyzer" {
    import { ChartAnalyzer } from "app/src/chart/stats/ChartAnalyzer";
    export class NPSAnalyzer extends ChartAnalyzer {
        reset(): void;
        private calculateNPS;
        calculateAll(): void;
        recalculate(startBeat: number, endBeat: number): void;
    }
}
declare module "app/src/chart/stats/parity/ParityUtils" {
    export function doFeetOverlap(oldHeel: number, oldToe: number, newHeel: number, newToe: number): boolean;
    export function getPlayerAngle(left: {
        x: number;
        y: number;
    }, right: {
        x: number;
        y: number;
    }): number;
}
declare module "app/src/chart/stats/parity/StageLayouts" {
    import { ParityState, PlacementData, Row } from "app/src/chart/stats/parity/ParityDataTypes";
    export interface StagePoint {
        x: number;
        y: number;
        rotation: number;
    }
    export class StageLayout {
        name: string;
        layout: StagePoint[];
        columnCount: number;
        upArrows: number[];
        downArrows: number[];
        sideArrows: number[];
        constructor(name: string, layout: StagePoint[], upArrows: number[], downArrows: number[], sideArrows: number[]);
        getFacingDirectionCosine(leftIndex: number, rightIndex: number): number;
        getYDifference(leftIndex: number, rightIndex: number): number;
        averagePoint(leftIndex: number, rightIndex: number): StagePoint | {
            x: number;
            y: number;
        };
        getDistanceSq(leftIndex: number, rightIndex: number): number;
        getDistanceSqPoints(p1: {
            x: number;
            y: number;
        }, p2: {
            x: number;
            y: number;
        }): number;
        bracketCheck(column1: number, column2: number): boolean;
        getPlayerAngle(leftIndex: number, rightIndex: number): number;
        getPlacementData(initialState: ParityState, resultState: ParityState, lastRow: Row, row: Row): PlacementData;
    }
    export const STAGE_LAYOUTS: {
        [id: string]: StageLayout;
    };
}
declare module "app/src/chart/stats/parity/ParityCost" {
    import { ParityState, PlacementData, Row } from "app/src/chart/stats/parity/ParityDataTypes";
    export class ParityCostCalculator {
        private readonly layout;
        private WEIGHTS;
        constructor(type: string, weights?: {
            [key: string]: number;
        } | undefined);
        setWeights(newWeights: {
            [key: string]: number;
        }): void;
        getActionCost(initialState: ParityState, resultState: ParityState, rows: Row[], rowIndex: number): {
            [id: string]: number;
        };
        doesLeftFootOverlapRight(data: PlacementData): boolean;
        doesRightFootOverlapLeft(data: PlacementData): boolean;
        calcMineCosts(data: PlacementData, row: Row): number;
        calcHoldSwitchCosts(data: PlacementData, row: Row): number;
        calcBracketTapCost(data: PlacementData, elapsedTime: number): number;
        calcStartCrossover(data: PlacementData, rowIndex: number): number;
        calcBracketJackCost(data: PlacementData): number;
        calcXOBRCost(data: PlacementData): number;
        calcDoublestepCost(data: PlacementData, lastRow: Row, row: Row, elapsedTime: number): number;
        calcJumpCost(data: PlacementData, elapsedTime: number): number;
        private slowBracketThreshold;
        private slowBracketCap;
        calcSlowBracketCost(data: PlacementData, elapsedTime: number): number;
        calcTwistedFoot(data: PlacementData): number;
        calcFacingCost(data: PlacementData): number;
        calcSpinCost(data: PlacementData): number;
        private SlowFootswitchThreshold;
        private SlowFootswitchIgnore;
        calcSlowFootswitchCost(data: PlacementData, row: Row, elapsedTime: number): number;
        calcSideswitchCost(data: PlacementData): number;
        calcMissedFootswitchCost(data: PlacementData, row: Row): number;
        private JackMaxElapsedTime;
        calcJackCost(data: PlacementData, elapsedTime: number): number;
        calcDistanceCost(data: PlacementData, elapsedTime: number): number;
        calcCrowdedBracketCost(data: PlacementData, elapsedTime: number): number;
    }
}
declare module "app/src/chart/stats/parity/RowStatCalculator" {
    import { Foot, Row, TechCategory, TechErrors } from "app/src/chart/stats/parity/ParityDataTypes";
    import { ParityGraphNode } from "app/src/chart/stats/parity/ParityInternals";
    import { StageLayout } from "app/src/chart/stats/parity/StageLayouts";
    export function calculateRowStats(nodes: ParityGraphNode[], rows: Row[], layout: StageLayout): {
        techRows: (Set<TechCategory> | undefined)[];
        techErrors: Map<number, Set<TechErrors>>;
        facingRows: number[];
        candles: Map<number, Foot>;
        techCounts: number[];
        techErrorCounts: number[];
    };
}
declare module "app/src/chart/stats/parity/ParityInternals" {
    import { Notedata } from "app/src/chart/sm/NoteTypes";
    import { Foot, FootOverride, ParityState, Row } from "app/src/chart/stats/parity/ParityDataTypes";
    import { ParityDebugStats } from "app/src/chart/stats/parity/ParityWebWorkerTypes";
    export class ParityGraphNode {
        children: Map<string, {
            [id: string]: number;
        }>;
        state: ParityState;
        key: string;
        constructor(state: ParityState, key?: string);
    }
    export class ParityInternals {
        private readonly costCalc;
        private readonly layout;
        private readonly initialRow;
        private readonly endRow;
        private readonly initialNode;
        private readonly endNode;
        private cachedEdges;
        private cachedLowestCost;
        edgeCacheSize: number;
        private permuteCache;
        nodeMap: Map<string, ParityGraphNode>;
        private nEdges;
        bestPath?: string[];
        bestPathCost: number;
        bestPathSet?: Set<string>;
        debugStats: ParityDebugStats;
        notedataRows: Row[];
        nodeRows: {
            beat: number;
            nodes: ParityGraphNode[];
        }[];
        constructor(gameType: string);
        compute(startBeat: number, endBeat: number, notedata: Notedata): {
            techRows: (Set<import("app/src/chart/stats/parity/ParityDataTypes").TechCategory> | undefined)[];
            techErrors: Map<number, Set<import("app/src/chart/stats/parity/ParityDataTypes").TechErrors>>;
            facingRows: number[];
            candles: Map<number, Foot>;
            techCounts: number[];
            techErrorCounts: number[];
            parityLabels: Map<string, Foot>;
            states: ParityState[];
            rowTimestamps: {
                beat: number;
                second: number;
            }[];
        } | null;
        recalculateRows(startBeat: number, endBeat: number, notedata: Notedata): {
            startIdx: number;
            newEndIdx: number;
            oldEndIdx: number;
        };
        recalculateStates(updatedRows: {
            startIdx: number;
            newEndIdx: number;
            oldEndIdx: number;
        }): {
            firstUpdatedRow: number;
            lastUpdatedRow: number;
        };
        computeCosts(updatedStates: {
            firstUpdatedRow: number;
            lastUpdatedRow: number;
        }): {
            firstUpdatedCost: number;
            lastUpdatedCost: number;
        };
        computeBestPath(updatedCosts: {
            firstUpdatedCost: number;
            lastUpdatedCost: number;
        }): void;
        calculatePermuteColumnKey(row: Row): string;
        getPossibleActions(row: Row): Foot[][];
        generateActions(row: Row, columns: Foot[], column: number): Foot[][];
        filterActions(row: Row, permuteColumns: Foot[][], overrides: FootOverride[]): Foot[][];
        initResultState(initialState: ParityState, row: Row, action: Foot[]): ParityState;
        rowToKey(row: Row): string;
        private isSameSecond;
        deleteCache(): void;
        reset(): void;
    }
}
declare module "app/src/chart/stats/parity/ParityWebWorkerTypes" {
    import { Notedata } from "app/src/chart/sm/NoteTypes";
    import { Foot, ParityState, Row, TechCategory, TechErrors } from "app/src/chart/stats/parity/ParityDataTypes";
    import { ParityGraphNode } from "app/src/chart/stats/parity/ParityInternals";
    export interface ParityComputeData {
        parityLabels: Map<string, Foot>;
        states: ParityState[];
        rowTimestamps: {
            beat: number;
            second: number;
        }[];
        techRows: (Set<TechCategory> | undefined)[];
        techErrors: Map<number, Set<TechErrors>>;
        techCounts: number[];
        techErrorCounts: number[];
        facingRows: number[];
        candles: Map<number, Foot>;
    }
    export type ParityDebugUpdateData = {
        removedRowsStart: number;
        removedRowsEnd: number;
        newRows: Row[];
        newStates: {
            beat: number;
            nodes: ParityGraphNode[];
        }[];
        bestPath: string[];
        bestPathCost: number;
        bestPathSet: Set<string>;
        edgeCacheSize: number;
        stats: ParityDebugStats;
    };
    export type ParityDebugData = {
        edgeCacheSize: number;
        nodeMap: Map<string, ParityGraphNode>;
        bestPath: string[];
        bestPathCost: number;
        bestPathSet: Set<string>;
        notedataRows: Row[];
        nodeRows: {
            beat: number;
            nodes: ParityGraphNode[];
        }[];
        stats: ParityDebugStats;
    };
    export type ParityDebugStats = {
        lastUpdatedRowStart: number;
        lastUpdatedOldRowEnd: number;
        lastUpdatedRowEnd: number;
        rowUpdateTime: number;
        lastUpdatedNodeStart: number;
        lastUpdatedNodeEnd: number;
        nodeUpdateTime: number;
        createdNodes: number;
        createdEdges: number;
        calculatedEdges: number;
        cachedEdges: number;
        edgeUpdateTime: number;
        cachedBestRows: number;
        pathUpdateTime: number;
        rowStatsUpdateTime: number;
    };
    export interface ParityBaseMessage {
        id: number;
    }
    export interface ParityInboundInitMessage extends ParityBaseMessage {
        type: "init";
        gameType: string;
    }
    export interface ParityOutboundInitMessage extends ParityBaseMessage {
        type: "init";
    }
    export interface ParityInboundComputeMessage extends ParityBaseMessage {
        type: "compute";
        startBeat: number;
        endBeat: number;
        notedata: Notedata;
        debug: boolean;
    }
    export interface ParityOutboundComputeMessage extends ParityBaseMessage {
        type: "compute";
        data: ParityComputeData;
        debug?: ParityDebugUpdateData;
    }
    export interface ParityInboundGetDebugMessage extends ParityBaseMessage {
        type: "getDebug";
    }
    export interface ParityOutboundErrorMessage extends ParityBaseMessage {
        type: "error";
        error: string;
    }
    export interface ParityOutboundGetDebugMessage extends ParityBaseMessage {
        type: "getDebug";
        data: ParityDebugData | null;
    }
    export type ParityInboundMessage = ParityInboundInitMessage | ParityInboundComputeMessage | ParityInboundGetDebugMessage;
    export type ParityOutboundMessage = ParityOutboundInitMessage | ParityOutboundComputeMessage | ParityOutboundGetDebugMessage | ParityOutboundErrorMessage;
}
declare module "app/src/chart/stats/parity/ParityAnalyzer" {
    import { Chart } from "app/src/chart/sm/Chart";
    import { ChartAnalyzer } from "app/src/chart/stats/ChartAnalyzer";
    import { ParityInboundMessage, ParityOutboundMessage } from "app/src/chart/stats/parity/ParityWebWorkerTypes";
    export class ParityAnalyzer extends ChartAnalyzer {
        worker?: Worker;
        active: boolean;
        disabled: boolean;
        private pendingJobs;
        private messageId;
        private eventHandler;
        constructor(chart: Chart);
        recalculate(startBeat: number, endBeat: number): void;
        calculateAll(): void;
        workerCalculate(startBeat: number, endBeat: number): void;
        onLoad(): Promise<void>;
        onUnload(): void;
        reset(): void;
        destroy(): void;
        initializeWorker(): Promise<void>;
        terminateWorker(): void;
        postMessage<Message extends Omit<ParityInboundMessage, "id">>(message: Message): Promise<Extract<ParityOutboundMessage, {
            type: Message["type"];
        }>>;
    }
}
declare module "app/src/chart/stats/StreamAnalyzer" {
    import { ChartAnalyzer } from "app/src/chart/stats/ChartAnalyzer";
    export interface StreamData {
        startBeat: number;
        endBeat: number;
        streamSpacing: number | null;
    }
    export class StreamAnalyzer extends ChartAnalyzer {
        reset(): void;
        private generateStreams;
        calculateAll(): void;
        recalculate(startBeat: number, endBeat: number): void;
    }
}
declare module "app/src/chart/stats/ChartStats" {
    import { Chart } from "app/src/chart/sm/Chart";
    import { ParityComputeData, ParityDebugData } from "app/src/chart/stats/parity/ParityWebWorkerTypes";
    import { StreamData } from "app/src/chart/stats/StreamAnalyzer";
    export class ChartStats {
        noteCounts: Record<string, number>;
        npsGraph: number[];
        streams: StreamData[];
        parity?: ParityComputeData & {
            debug: ParityDebugData;
            debugTime: number;
        };
        readonly chart: Chart;
        private analyzers;
        private lastUpdate;
        private queued;
        private loaded;
        private readonly loadHandler;
        constructor(chart: Chart);
        calculate(): void;
        private _recalculate;
        recalculate(startBeat: number, endBeat: number): boolean;
        reset(): void;
        getMaxNPS(): number;
        destroy(): void;
    }
}
declare module "app/src/chart/sm/ChartTypes" {
    export const CHART_DIFFICULTIES: readonly ChartDifficulty[];
    export type ChartDifficulty = "Beginner" | "Easy" | "Medium" | "Hard" | "Challenge" | "Edit";
}
declare module "app/src/chart/sm/SimfileTypes" {
    export const SIMFILE_PROPERTIES: readonly ["TITLE", "SUBTITLE", "ARTIST", "TITLETRANSLIT", "SUBTITLETRANSLIT", "ARTISTTRANSLIT", "GENRE", "CREDIT", "ORIGIN", "BACKGROUND", "BANNER", "MUSIC", "CDTITLE", "JACKET", "DISCIMAGE", "CDIMAGE", "PREVIEW", "LYRICSPATH", "SAMPLESTART", "SAMPLELENGTH", "SELECTABLE"];
    export type SimfileProperty = (typeof SIMFILE_PROPERTIES)[number];
}
declare module "app/src/chart/sm/SMETypes" {
    import { FootOverride } from "app/src/chart/stats/parity/ParityDataTypes";
    export type SMEData = {
        version: number;
        parity: Record<string, SMEParityData[]>;
    };
    export type SMEParityData = {
        overrides: [number, number, FootOverride][];
        ignores: Record<number, string[]>;
    };
}
declare module "app/src/chart/sm/SMEParser" {
    import { Chart } from "app/src/chart/sm/Chart";
    import { Simfile } from "app/src/chart/sm/Simfile";
    import { SMEParityData } from "app/src/chart/sm/SMETypes";
    export function serializeSMEData(sm: Simfile): string;
    export function requiresSMEData(sm: Simfile): boolean;
    export function getParityData(chart: Chart): SMEParityData;
    export function loadSMEData(string: string, sm: Simfile, isAutosave: boolean): void;
    export function loadChartParityData(data: SMEParityData, chart: Chart): void;
}
declare module "app/src/chart/sm/Simfile" {
    import { Chart } from "app/src/chart/sm/Chart";
    import { SimfileProperty } from "app/src/chart/sm/SimfileTypes";
    import { SongTimingData } from "app/src/chart/sm/SongTimingData";
    export class Simfile {
        charts: Record<string, Chart>;
        _type?: "sm" | "ssc";
        other_properties: {
            [key: string]: string;
        };
        properties: {
            [key in SimfileProperty]?: string;
        };
        timingData: SongTimingData;
        unloadedCharts: (string | {
            [key: string]: string;
        })[];
        loaded: Promise<void>;
        constructor(file: File, dataFile?: File);
        addChart(chart: Chart): void;
        private createChartID;
        removeChart(chart: Chart): boolean;
        getChartsByGameType(gameType: string): Chart[];
        getAllChartsByGameType(): Record<string, Chart[]>;
        serialize(type: "sm" | "ssc" | "smebak"): string;
        usesChartTiming(): boolean;
        requiresSSC(): boolean;
        recalculateAllStats(): void;
        private formatProperty;
        destroy(): void;
    }
}
declare module "app/src/chart/sm/SongTimingData" {
    import { Chart } from "app/src/chart/sm/Chart";
    import { ChartTimingData } from "app/src/chart/sm/ChartTimingData";
    import { Simfile } from "app/src/chart/sm/Simfile";
    import { TimingData } from "app/src/chart/sm/TimingData";
    import { TimingEventType, TimingType } from "app/src/chart/sm/TimingTypes";
    export class SongTimingData extends TimingData {
        protected offset: number;
        protected chartTimingDatas: ChartTimingData[];
        protected sm: Simfile;
        constructor(simfile: Simfile);
        protected callListeners(modifiedEvents?: {
            type: TimingEventType;
        }[]): void;
        createChartTimingData(chart: Chart): ChartTimingData;
        /**
         * Return all events of a type in the song timing data. This will not include any chart-specific events.
         * If you want to respect chart-specific timing events, use \`ChartTimingData.getColumn()\` instead.
         */
        getColumn<Type extends TimingEventType>(type: Type): NonNullable<{
            BPMS?: import("app/src/chart/sm/TimingTypes").Cached<import("app/src/chart/sm/TimingTypes").BPMTimingEvent>[] | undefined;
            STOPS?: import("app/src/chart/sm/TimingTypes").Cached<import("app/src/chart/sm/TimingTypes").StopTimingEvent>[] | undefined;
            WARPS?: import("app/src/chart/sm/TimingTypes").Cached<import("app/src/chart/sm/TimingTypes").WarpTimingEvent>[] | undefined;
            DELAYS?: import("app/src/chart/sm/TimingTypes").Cached<import("app/src/chart/sm/TimingTypes").DelayTimingEvent>[] | undefined;
            LABELS?: import("app/src/chart/sm/TimingTypes").Cached<import("app/src/chart/sm/TimingTypes").LabelTimingEvent>[] | undefined;
            SPEEDS?: import("app/src/chart/sm/TimingTypes").Cached<import("app/src/chart/sm/TimingTypes").SpeedTimingEvent>[] | undefined;
            SCROLLS?: import("app/src/chart/sm/TimingTypes").Cached<import("app/src/chart/sm/TimingTypes").ScrollTimingEvent>[] | undefined;
            TICKCOUNTS?: import("app/src/chart/sm/TimingTypes").Cached<import("app/src/chart/sm/TimingTypes").TickCountTimingEvent>[] | undefined;
            TIMESIGNATURES?: import("app/src/chart/sm/TimingTypes").Cached<import("app/src/chart/sm/TimingTypes").TimeSignatureTimingEvent>[] | undefined;
            COMBOS?: import("app/src/chart/sm/TimingTypes").Cached<import("app/src/chart/sm/TimingTypes").ComboTimingEvent>[] | undefined;
            FAKES?: import("app/src/chart/sm/TimingTypes").Cached<import("app/src/chart/sm/TimingTypes").FakeTimingEvent>[] | undefined;
            ATTACKS?: import("app/src/chart/sm/TimingTypes").Cached<import("app/src/chart/sm/TimingTypes").AttackTimingEvent>[] | undefined;
            BGCHANGES?: import("app/src/chart/sm/TimingTypes").Cached<import("app/src/chart/sm/TimingTypes").BGChangeTimingEvent>[] | undefined;
            FGCHANGES?: import("app/src/chart/sm/TimingTypes").Cached<import("app/src/chart/sm/TimingTypes").FGChangeTimingEvent>[] | undefined;
        }[Type]>;
        /**
         * Returns the offset for the song timing data. This will not return the chart-specific offset if it exists.
         * If you want to get the effective offset for a chart, use \`ChartTimingData.getOffset()\` instead.
         * @returns
         */
        getOffset(): number;
        reloadCache(types?: TimingType[]): void;
        _setOffset(offset: number): void;
    }
}
declare module "app/src/chart/sm/ChartTimingData" {
    import { Chart } from "app/src/chart/sm/Chart";
    import { SongTimingData } from "app/src/chart/sm/SongTimingData";
    import { TimingData } from "app/src/chart/sm/TimingData";
    import { DeletableEvent, TimingEvent, TimingEventType, TimingType } from "app/src/chart/sm/TimingTypes";
    export class ChartTimingData extends TimingData {
        readonly songTimingData: SongTimingData;
        private readonly chart;
        constructor(simfileTimingData: SongTimingData, chart: Chart);
        protected callListeners(modifiedEvents?: {
            type: TimingEventType;
        }[]): void;
        /**
         * Return all events of a type for the chart. If there is chart-specific timing data for the type, this will return that. Otherwise, it will return the song timing data for the type.
         * @param type
         * @returns
         */
        getColumn<Type extends TimingEventType>(type: Type): NonNullable<{
            BPMS?: import("app/src/chart/sm/TimingTypes").Cached<import("app/src/chart/sm/TimingTypes").BPMTimingEvent>[] | undefined;
            STOPS?: import("app/src/chart/sm/TimingTypes").Cached<import("app/src/chart/sm/TimingTypes").StopTimingEvent>[] | undefined;
            WARPS?: import("app/src/chart/sm/TimingTypes").Cached<import("app/src/chart/sm/TimingTypes").WarpTimingEvent>[] | undefined;
            DELAYS?: import("app/src/chart/sm/TimingTypes").Cached<import("app/src/chart/sm/TimingTypes").DelayTimingEvent>[] | undefined;
            LABELS?: import("app/src/chart/sm/TimingTypes").Cached<import("app/src/chart/sm/TimingTypes").LabelTimingEvent>[] | undefined;
            SPEEDS?: import("app/src/chart/sm/TimingTypes").Cached<import("app/src/chart/sm/TimingTypes").SpeedTimingEvent>[] | undefined;
            SCROLLS?: import("app/src/chart/sm/TimingTypes").Cached<import("app/src/chart/sm/TimingTypes").ScrollTimingEvent>[] | undefined;
            TICKCOUNTS?: import("app/src/chart/sm/TimingTypes").Cached<import("app/src/chart/sm/TimingTypes").TickCountTimingEvent>[] | undefined;
            TIMESIGNATURES?: import("app/src/chart/sm/TimingTypes").Cached<import("app/src/chart/sm/TimingTypes").TimeSignatureTimingEvent>[] | undefined;
            COMBOS?: import("app/src/chart/sm/TimingTypes").Cached<import("app/src/chart/sm/TimingTypes").ComboTimingEvent>[] | undefined;
            FAKES?: import("app/src/chart/sm/TimingTypes").Cached<import("app/src/chart/sm/TimingTypes").FakeTimingEvent>[] | undefined;
            ATTACKS?: import("app/src/chart/sm/TimingTypes").Cached<import("app/src/chart/sm/TimingTypes").AttackTimingEvent>[] | undefined;
            BGCHANGES?: import("app/src/chart/sm/TimingTypes").Cached<import("app/src/chart/sm/TimingTypes").BGChangeTimingEvent>[] | undefined;
            FGCHANGES?: import("app/src/chart/sm/TimingTypes").Cached<import("app/src/chart/sm/TimingTypes").FGChangeTimingEvent>[] | undefined;
        }[Type]>;
        /**
         * Returns the offset for the chart. If there is a chart-specific offset, this will return that. Otherwise, it will return the song offset.
         * @returns
         */
        getOffset(): number;
        /**
         * Returns true if there is any chart-specific timing data, including the offset and any timing event columns.
         * @returns
         */
        usesChartTiming(): boolean;
        hasChartOffset(): boolean;
        /**
         * Returns whether the specified timing event type has a chart-specific column.
         * @param type
         * @returns
         */
        isPropertyChartSpecific(type: TimingEventType): boolean;
        /**
         * Copies the chart offset to the song timing data.
         * @returns
         */
        copyOffsetToSimfile(): void;
        /**
         * Removes the chart offset, making the timing data use the song offset.
         * @returns
         */
        removeChartOffset(): void;
        /**
         * Copies all chart-specific timing data into the song timing data, converting chart-specific columns into song-specific columns.
         * This will overwrite all timing data in the song timing data with the chart-specific timing data.
         */
        copyAllToSimfile(): void;
        /**
         * Copies the specified columns from the chart timing data into the song timing data, converting the column to a song-specific column.
         * This will overwrite the events in the song timing data for the specified columns.
         * @param columns
         */
        copyColumnsToSimfile(columns: TimingEventType[]): void;
        /**
         * Copies the specified columns from the song timing data into the chart timing data, converting the column to a chart-specific column.
         * This will remove existing chart-specific timing data for the specified columns.
         * @param columns
         */
        copyColumnsFromSimfile(columns: TimingEventType[]): void;
        /**
         * Copies all song timing data into the chart timing data. This will remove existing chart-specific timing data.
         */
        copyAllFromSimfile(): void;
        /**
         * Creates chart-specific columns for the specified timing event types, copying events from the song timing data.
         * @param columns
         */
        createChartColumns(columns: TimingEventType[]): void;
        /**
         * Creates empty chart-specific columns for the specified timing event types.
         */
        createEmptyData(): void;
        /**
         * Deletes the specified columns from the chart timing data, converting the column to a song-specific column.
         * @param columns
         */
        deleteColumns(columns: TimingEventType[]): void;
        /**
         * Deletes all chart-specific timing data, including all chart-specific columns and the chart offset if it exists.
         */
        deleteAllChartSpecific(): void;
        reloadCache(types?: TimingType[]): void;
        private splitSM;
        private splitSMPairs;
        /**
         * Inserts timing events into the chart timing data.
         * Events will be inserted into the song timing data if their column type is not chart-specific,
         * and into the chart timing data if it is.
         * @param events The events to be inserted.
         */
        insertColumnEvents(events: TimingEvent[]): void;
        /**
         * Modifies timing events in the chart timing data.
         * @param events The events to be modified. Each event is represented as a pair, where the first element is the original event and the second element is the modified event.
         */
        modifyColumnEvents(events: [TimingEvent, TimingEvent][]): void;
        /**
         * Deletes timing events from the chart timing data.
         * @param events The events to be deleted.
         */
        deleteColumnEvents(events: DeletableEvent[]): void;
    }
}
declare module "app/src/chart/sm/Chart" {
    import { GameType } from "app/src/chart/gameTypes/GameTypeRegistry";
    import { ChartStats } from "app/src/chart/stats/ChartStats";
    import { ChartTimingData } from "app/src/chart/sm/ChartTimingData";
    import { ChartDifficulty } from "app/src/chart/sm/ChartTypes";
    import { Notedata, NotedataEntry, PartialNotedata, PartialNotedataEntry, RowData } from "app/src/chart/sm/NoteTypes";
    import { Simfile } from "app/src/chart/sm/Simfile";
    export class Chart {
        readonly sm: Simfile;
        readonly stats: ChartStats;
        private notedata;
        private notedataRows;
        gameType: GameType;
        timingData: ChartTimingData;
        description: string;
        difficulty: ChartDifficulty;
        meter: number;
        meterF: number;
        radarValues: string;
        chartName: string;
        chartStyle: string;
        credit: string;
        music?: string;
        other_properties: {
            [key: string]: string;
        };
        private _lastBeat;
        private _lastSecond;
        private _startModify;
        private _endModify;
        /**
         * Creates a new Chart.
         * @param {Simfile} sm The Simfile this chart belongs to
         * @param {(string | { [key: string]: string })} [data] The data to load the chart from (used internally)
         * @memberof Chart
         */
        constructor(sm: Simfile, data?: string | {
            [key: string]: string;
        });
        /**
         * Gets the last beat of this chart. If the last beat is a hold, it includes the hold length.
         *
         * @return {number} The last beat of the chart.
         * @memberof Chart
         */
        getLastBeat(): number;
        /**
         * Gets the last second of this chart. If the last beat is a hold, it includes the hold length.
         *
         * @return {number} The last second of the chart.
         * @memberof Chart
         */
        getLastSecond(): number;
        /**
         * Gets the second from a given beat.
         * Convenience method for this.timingData.getSecondsFromBeat
         *
         * @param {number} beat
         * @param {("noclamp" | "before" | "after" | "")} [option]
         * @return {*}  {number}
         * @memberof Chart
         */
        getSecondsFromBeat(beat: number, option?: "noclamp" | "before" | "after" | ""): number;
        /**
         * Gets the beat from a given second.
         * Convenience method for this.timingData.getBeatFromSeconds
         *
         * @param {number} seconds
         * @return {*}  {number}
         * @memberof Chart
         */
        getBeatFromSeconds(seconds: number): number;
        /**
         * Gets the beat from a given effective beat.
         * Convenience method for this.timingData.getBeatFromEffectiveBeat
         *
         * @param {number} effBeat
         * @return {*}  {number}
         * @memberof Chart
         */
        getBeatFromEffectiveBeat(effBeat: number): number;
        /**
         * Returns true if a beat is warped over (via WARPS, negative STOPS, etc.).
         * @param {number} beat
         * @return {*}  {boolean}
         * @memberof Chart
         */
        isBeatWarped(beat: number): boolean;
        /**
         * Returns true if a beat is marked as fake.
         * @param {number} beat
         * @return {*}  {boolean}
         * @memberof Chart
         */
        isBeatFaked(beat: number): boolean;
        private recalculateLastNote;
        private getNoteIndex;
        private insertNote;
        private addEditRange;
        private callEventListeners;
        private markRecalculateAll;
        /**
         * Adds a note to the notedata.
         * @param {PartialNotedataEntry} note
         * @param {boolean} [callListeners=true] Whether to call event listeners after adding the note
         * @return {NotedataEntry} The computed note that was added
         * @memberof Chart
         */
        addNote(note: PartialNotedataEntry, callListeners?: boolean): NotedataEntry;
        /**
         * Adds notes to the notedata.
         * @param {PartialNotedataEntry[]} notes
         * @param {boolean} [callListeners=true] Whether to call event listeners after adding the notes
         * @return {NotedataEntry[]} The computed notes that were added
         * @memberof Chart
         */
        addNotes(notes: PartialNotedataEntry[], callListeners?: boolean): NotedataEntry[];
        /**
         * Computes a note's eextra properties (second, quant, fake, warped).
         * @param {PartialNotedataEntry} note
         * @return {NotedataEntry} The computed note
         * @memberof Chart
         */
        computeNote(note: PartialNotedataEntry): NotedataEntry;
        /**
         * Modifies a note in the notedata.
         * @param {PartialNotedataEntry} note
         * @return {NotedataEntry} The modified note
         * @memberof Chart
         */
        modifyNote(note: PartialNotedataEntry, properties: Partial<NotedataEntry>, callListeners?: boolean): void;
        /**
         * Removes a note from the notedata.
         * @param {PartialNotedataEntry} note
         * @param {boolean} [callListeners=true] Whether to call event listeners after removing the note
         * @return {NotedataEntry | undefined} The removed note, if it existed
         * @memberof Chart
         */
        removeNote(note: PartialNotedataEntry, callListeners?: boolean): NotedataEntry | undefined;
        /**
         * Removes notes from the notedata.
         * @param {PartialNotedataEntry[]} notes
         * @param {boolean} [callListeners=true] Whether to call event listeners after removing the notes
         * @return {NotedataEntry[]} The removed notes
         * @memberof Chart
         */
        removeNotes(notes: PartialNotedataEntry[], callListeners?: boolean): NotedataEntry[];
        /**
         * Sets the notedata for the chart.
         * @param {PartialNotedata} notedata
         * @memberof Chart
         */
        setNotedata(notedata: PartialNotedata): void;
        /**
         * Gets the notedata for the chart.
         * @returns {Notedata} The notedata of the chart.
         * @memberof Chart
         */
        getNotedata(): Notedata;
        /**
         * Gets all rows in the chart.
         *
         * @return {RowData[]} The rows of the chart.
         * @memberof Chart
         */
        getRows(): RowData[];
        /**
         * Returns all notes within the given range (inclusive)
         *
         * @param {number} startBeat
         * @param {number} endBeat
         * @return {*}  {Notedata}
         * @memberof Chart
         */
        getNotedataInRange(startBeat: number, endBeat: number): Notedata;
        /**
         * Returns all rows within the given range (inclusive)
         *
         * @param {number} startBeat
         * @param {number} endBeat
         * @return {*}  {RowData[]}
         * @memberof Chart
         */
        getRowsInRange(startBeat: number, endBeat: number): RowData[];
        /**
         * Recomputes all notes in the chart.
         * @memberof Chart
         */
        recalculateNotes(): void;
        /**
         * Recalculates the rows in the chart.
         * @param startBeat The start beat of the range to recalculate.
         * @param endBeat The end beat of the range to recalculate.
         * @memberof Chart
         */
        recalculateRows(startBeat?: number | null, endBeat?: number | null): void;
        /**
         * Gets the music path for this chart. If this chart does not have a music path, it returns the simfile's music path.
         *
         * @return {*}  {string}
         * @memberof Chart
         */
        getMusicPath(): string;
        toString(): string;
        /**
         * Serializes the chart to a string.
         *
         * @param {("sm" | "ssc" | "smebak")} type The type of serialization to perform.
         * @return {*}  {string} The serialized chart.
         * @memberof Chart
         */
        serialize(type: "sm" | "ssc" | "smebak"): string;
        /**
         * Returns whether or not this chart has SSC features.
         * @return {boolean}
         * @memberof Chart
         */
        requiresSSC(): boolean;
        /**
         * Returns the number of columns in this chart.
         * @return {number}
         * @memberof Chart
         */
        getColumnCount(): number;
    }
}
interface FileSystemSyncAccessHandle {
    /** [MDN Reference](https://developer.mozilla.org/docs/Web/API/FileSystemSyncAccessHandle/close) */
    close(): void;
    /** [MDN Reference](https://developer.mozilla.org/docs/Web/API/FileSystemSyncAccessHandle/flush) */
    flush(): void;
    /** [MDN Reference](https://developer.mozilla.org/docs/Web/API/FileSystemSyncAccessHandle/getSize) */
    getSize(): number;
    /** [MDN Reference](https://developer.mozilla.org/docs/Web/API/FileSystemSyncAccessHandle/read) */
    read(buffer: AllowSharedBufferSource, options?: FileSystemReadWriteOptions): number;
    /** [MDN Reference](https://developer.mozilla.org/docs/Web/API/FileSystemSyncAccessHandle/truncate) */
    truncate(newSize: number): void;
    /** [MDN Reference](https://developer.mozilla.org/docs/Web/API/FileSystemSyncAccessHandle/write) */
    write(buffer: AllowSharedBufferSource, options?: FileSystemReadWriteOptions): number;
}
interface FileSystemReadWriteOptions {
    at?: number;
}
declare function getDirectoryHandle(path: string, options?: FileSystemGetFileOptions, dir?: FileSystemDirectoryHandle): Promise<FileSystemDirectoryHandle | undefined>;
declare function getFileHandle(path: string, options?: FileSystemGetFileOptions): Promise<SecureFileSystemFileHandle | undefined>;
declare function resolvePath(path: string): string;
`;let be=!1;function _t(e){if(be)return;be=!0,e.languages.typescript.typescriptDefaults.addExtraLib(Wt,"file:///SMEditorLib.d.ts"),e.languages.typescript.typescriptDefaults.addExtraLib(`
    import { Chart } from "app/src/chart/sm/Chart"
    import { Simfile } from "app/src/chart/sm/Simfile"
    import { NotedataEntry, PartialNotedataEntry, PartialHoldNotedataEntry} from "app/src/chart/sm/NoteTypes"
    import { TimingEvent, BPMTimingEvent, StopTimingEvent, WarpTimingEvent, DelayTimingEvent, ScrollTimingEvent, TickcountTimingEvent, FakeTimingEvent, LabelTimingEvent, SpeedTimingEvent, TimeSignatureTimingEvent, ComboTimingEvent, AttackTimingEvent, FGChangeTimingEvent, BGChangeTimingEvent } from "app/src/chart/sm/TimingTypes"

    declare global {
      /**
       * The current chart being edited.
       */
      const CHART: Chart;
      /**
       * The current simfile being edited.
       */
      const SM: Simfile;

      type RangeData = {
        /** The start of the selection range in both beats and seconds. */
        start: { beat: number, second: number };
        /** The end of the selection range in both beats and seconds. */
        end: { beat: number, second: number };
      };

      type SelectionData = {
        /** The type of the current selection. "notes" if the selection is of notes, "timing" if the selection is of timing events */
        type: "notes";
        /** The array of selected objects. This will be a list of note objects or timing events. */
        selection: NotedataEntry[];
        /** The range of the selection in both beats and seconds. */
        range: RangeData;
      } | {
        /** The type of the current selection. "notes" if the selection is of notes, "timing" if the selection is of timing events */
        type: "timing";
        /** The array of selected objects. This will be a list of note objects or timing events. */
        selection: TimingEvent[];
        /** The range of the selection in both beats and seconds. */
        range: RangeData;
      };

      /**
       * Provides data about the current selection. If there is no selection, this will be null.

       * - \`SELECTION.type\`: "notes" if the selection is of notes, "timing" if the selection is of timing events

       * - \`SELECTION.selection\`: the array of selected objects, either NotedataEntry[] or TimingEvent[] depending on the type of selection

       * - \`SELECTION.range\`: the range of the selection in both beats and seconds
       */
      const SELECTION: SelectionData | null;
      /**
       * The arguments passed to the script.
       */
      const ARGS: (string | number | boolean)[];

      const Foot: typeof import("app/src/chart/stats/parity/ParityDataTypes").Foot;


      /**
       * Create a new BPM timing event. A BPM timing event changes the song's tempo.
       *
       * @param {number} beat The beat at which to place the BPM event.
       * @param {number} bpm The tempo in beats per minute.
       * @return BPMTimingEvent
       */
      function BPMEvent(beat: number, bpm: number): BPMTimingEvent
      /**
       * Create a new Stop timing event. A Stop timing event pauses the chart for a specified duration.
       * Notes placed on the same beat as a Stop timing event will be hit *before* the Stop.
       *
       * @param {number} beat The beat at which to place the Stop event.
       * @param {number} seconds The duration of the Stop event in seconds.
       * @return StopTimingEvent
       */
      function StopEvent(beat: number, seconds: number): StopTimingEvent
      /**
       * Create a new Warp timing event. A Warp timing event skips a specified number of beats.
       *
       * @param {number} beat The beat at which to place the Warp event.
       * @param {number} beats The number of beats to warp over.
       * @return WarpTimingEvent
       */
      function WarpEvent(beat: number, beats: number): WarpTimingEvent
      /**
       * Create a new Delay timing event. A Delay timing event delays the chart for a specified duration.
       * Notes placed on the same beat as a Delay timing event will be hit *after* the Delay.
       *
       * @param {number} beat The beat at which to place the Delay event.
       * @param {number} seconds The duration of the Delay event in seconds.
       * @return DelayTimingEvent
       */
      function DelayEvent(beat: number, seconds: number): DelayTimingEvent
      /**
       * Create a new Scroll timing event. A Scroll timing event changes the scroll speed of a part of the chart.
       *
       * @param {number} beat The beat at which to place the Scroll event.
       * @param {number} factor The scroll speed factor. A value of 1.0 is normal speed, 2.0 is double speed, and 0.5 is half speed.
       * @return ScrollTimingEvent
       */
      function ScrollEvent(beat: number, factor: number): ScrollTimingEvent
      /**
       * Create a new TickCount timing event. A TickCount timing event changes the number of hold ticks per beat for game modes that give combo on holds.
       *
       * @param {number} beat The beat at which to place the TickCount event.
       * @param {number} ticks The number of ticks per beat.
       * @return TickCountTimingEvent
       */
      function TickCountEvent(beat: number, ticks: number): TickCountTimingEvent
      /**
       * Create a new Fake timing event. A Fake timing event creates a section of the chart that is not played.
       *
       * @param {number} beat The beat at which to place the Fake event.
       * @param {number} beats The number of beats to fake.
       * @return FakeTimingEvent
       */
      function FakeEvent(beat: number, beats: number): FakeTimingEvent
      /**
       * Create a new Label timing event.
       *
       * @param {number}  beat The beat at which to place the Label event.
       * @param {string} label The text of the label.
       * @return LabelTimingEvent
       */
      function LabelEvent(beat: number, label: string): LabelTimingEvent
      /**
       * Create a new Speed timing event. A Speed timing event changes the scroll speed of the notefield.
       *
       * @param {number} beat The beat at which to place the Speed event.
       * @param {number} factor The scroll speed factor. A value of 1.0 is normal speed, 2.0 is double speed, and 0.5 is half speed.
       * @param {number} delay The number of beats or seconds that the change takes to occur.
       * @param {"Beats" | "Seconds"} unit The unit of the delay. "Beats" means the delay is in beats, "Seconds" means the delay is in seconds.
       * @return SpeedTimingEvent
       */
      function SpeedEvent(beat: number, factor: number, delay: number, unit: "Beats" | "Seconds"): SpeedTimingEvent
      /**
       * Create a new TimeSignature timing event.
       *
       * @param {number} beat The beat at which to place the TimeSignature event.
       * @param {number} upper The upper number of the time signature.
       * @param {number} lower The lower number of the time signature.
       * @return TimeSignatureTimingEvent
       */
      function TimeSignatureEvent(beat: number, upper: number, lower: number): TimeSignatureTimingEvent
      /**
       * Create a new Combo timing event. A Combo timing event changes the combo multiplier for hits and misses.
       *
       * @param {number} beat The beat at which to place the Combo event.
       * @param {number} hitMult The combo multiplier for hits.
       * @param {number} missMult The combo multiplier for misses.
       * @return ComboTimingEvent
       */
      function ComboEvent(beat: number, hitMult: number, missMult: number): ComboTimingEvent
      /**
       * Create a new Attack timing event. An Attack timing event applies modifiers to the notefield.
       *
       * @param {number} second The second at which to place the Attack event.
       * @param {"Length" | "End"} endType Whether the value is a length in seconds or an end time in seconds.
       * @param {number} value The length or end time of the Attack event in seconds.
       * @param {string} mods The modifiers to apply to the notefield.
       * @return AttackTimingEvent
       */
      function AttackEvent(second: number, endType: "Length" | "End", value: number, mods: string): AttackTimingEvent
      function BGChangeEvent(beat: number, file: string, updateRate: number, crossFade: boolean, stretchRewind: boolean, stretchNoLoop: boolean, effect: string, file2: string, transition: string, color1: string, color2: string): BGChangeTimingEvent
      function FGChangeEvent(beat: number, file: string, updateRate: number, crossFade: boolean, stretchRewind: boolean, stretchNoLoop: boolean, effect: string, file2: string, transition: string, color1: string, color2: string): FGChangeTimingEvent

      /**
       * Creates a tap note.
       *
       * @param {number} beat The beat at which to place the tap note.
       * @param {number} col The column of the tap note (0-indexed).
       * @return PartialNotedataEntry
       */
      function TapNote(beat: number, col: number): PartialNotedataEntry
      /**
       * Creates a hold note.
       *
       * @param {number} beat The beat at which to place the hold note.
       * @param {number} col The column of the hold note (0-indexed).
       * @param {number} length The length of the hold note in beats.
       * @return PartialHoldNotedataEntry
       */
      function HoldNote(beat: number, col: number, length: number): PartialHoldNotedataEntry
      /**
       * Creates a roll note.
       *
       * @param {number} beat The beat at which to place the roll note.
       * @param {number} col The column of the roll note (0-indexed).
       * @param {number} length The length of the roll note in beats.
       * @return PartialHoldNotedataEntry
       */
      function RollNote(beat: number, col: number, length: number): PartialHoldNotedataEntry
      /**
       * Creates a mine note.
       *
       * @param {number} beat The beat at which to place the mine note.
       * @param {number} col The column of the mine note (0-indexed).
       * @return PartialNotedataEntry
       */
      function MineNote(beat: number, col: number): PartialNotedataEntry
      /**
       * Creates a lift note.
       *
       * @param {number} beat The beat at which to place the lift note.
       * @param {number} col The column of the lift note (0-indexed).
       * @return PartialNotedataEntry
       */
      function LiftNote(beat: number, col: number): PartialNotedataEntry
      /**
       * Creates a fake note.
       *
       * @param {number} beat The beat at which to place the fake note.
       * @param {number} col The column of the fake note (0-indexed).
       * @return PartialNotedataEntry
       */
      function FakeNote(beat: number, col: number): PartialNotedataEntry
    }


    export {}
  `,"file:///ScriptUtils.d.ts");const t={"app/src/chart/sm/Chart":["Chart"],"app/src/chart/sm/Simfile":["Simfile"],"app/src/chart/sm/NoteTypes":["NotedataEntryBase","NotedataEntry","Notedata","PartialNotedataEntry","PartialHoldNotedataEntry","NoteType","HoldNoteType","TapNoteType","PartialTapNotedataEntry","PartialHoldNotedataEntry","TapNotedataEntry","HoldNotedataEntry","Foot","FootOverride"],"app/src/chart/sm/TimingTypes":["TIMING_EVENT_NAMES","TimingEvent","Cached","BPMTimingEvent","StopTimingEvent","WarpTimingEvent","DelayTimingEvent","ScrollTimingEvent","TickCountTimingEvent","FakeTimingEvent","LabelTimingEvent","SpeedTimingEvent","TimeSignatureTimingEvent","ComboTimingEvent","AttackTimingEvent","FGChangeTimingEvent","BGChangeTimingEvent"]},n={"app/src/chart/sm/NoteTypes":["isHoldNote","isTapNote"],"app/src/chart/sm/TimingTypes":["TIMING_EVENT_NAMES"]};let a="";for(const[c,l]of Object.entries(t))for(const u of l)a+=`type ${u} = import("${c}").${u};
`;for(const[c,l]of Object.entries(n))for(const u of l)a+=`const ${u}: typeof import("${c}").${u};
`;a=`declare global {
    ${a}
    }
    export {}`,e.languages.typescript.typescriptDefaults.addExtraLib(a,"file:///TypeImports.d.ts"),e.languages.typescript.typescriptDefaults.setDiagnosticsOptions({...e.languages.typescript.typescriptDefaults.getDiagnosticsOptions(),noSemanticValidation:!1,noSuggestionDiagnostics:!1,noSyntaxValidation:!1}),e.languages.typescript.typescriptDefaults.setCompilerOptions({...e.languages.typescript.typescriptDefaults.getCompilerOptions(),lib:["es2022","webworker"]});const r={tokenTypes:["variable"],tokenModifiers:["readonly"]},i=["SM","CHART","SELECTION","ARGS","RANGE"];e.languages.registerDocumentSemanticTokensProvider("typescript",{getLegend:function(){return r},provideDocumentSemanticTokens:function(c,l,u){const p=c.getLinesContent(),E=[];let h=0,A=0;for(let D=0;D<p.length;D++){const O=p[D].matchAll(/(?:[^.\w]?)(\w+)/g);for(const R of O)i.includes(R[1])&&(E.push(D-h,h===D?R.index-A:R.index,R[0].length,0,1),h=D,A=R.index)}return{data:new Uint32Array(E)}},releaseDocumentSemanticTokens:()=>{}}),e.editor.defineTheme("dark",{base:"vs-dark",inherit:!0,colors:{},rules:[{token:"variable.readonly",foreground:"#56ddffff",fontStyle:"bold"}]}),e.editor.defineTheme("light",{base:"vs",inherit:!0,colors:{},rules:[{token:"variable.readonly",foreground:"#006bb3",fontStyle:"bold"}]})}const zt={log:{background:"",text:""},error:{background:"#660000",text:"#ffaaaa"},warn:{background:"#665500",text:"#ffffaa"},info:{background:"",text:"#676767ff"}};function Ut(e){const t=s.useContext(ce),n=s.useRef(null),a=s.useRef(null),r=s.useContext(ce).app,i=s.useRef(null),[c,l]=s.useState(!1),[u,p]=s.useState([]),E=s.useRef(0),h=s.useRef(e.scriptIndex),[A,D]=s.useState(0),M=e.scriptIndex==null?null:e.scripts[e.scriptIndex];function O(m){if(typeof m=="string")return m;try{return JSON.stringify(m)}catch{return String(m)}}async function R(){const m=a.current;if(!m)return null;const T=await m.languages.typescript.getTypeScriptWorker().then(y=>y()).catch(()=>null);return T?(await T.getEmitOutput("file:///main.ts")).outputFiles[0].text:null}async function j(){const m=n.current,T=a.current;if(!m||!T||!M)return;i.current?.terminate(),p([["info","Running..."]]);const b=m.getModel()?.getValue()??"";if(b.length>W.MAX_LENGTH){p(N=>[...N,["error","Your script is too long!"]]);return}const y=await R();if(!y){p(N=>[...N,["error","An error occured while trying to compile this script!"]]);return}M.tsCode=b,M.jsCode=y;const g=await W.runPrompt(r,M,(N,...C)=>{p(d=>[...d,[N,C.map(O).join(" ")]])},()=>{p(N=>[...N,["info",`Finished running after ${(performance.now()-E.current).toFixed(2)} ms`]]),l(!1)},()=>{E.current=performance.now()});g&&(l(!0),i.current=g)}s.useEffect(()=>{const m=T=>{n.current?.getDomNode()?.contains(T.target)&&(T.key==="'"||T.key==='"')&&setTimeout(()=>{n.current?.trigger("","editor.action.triggerSuggest",{auto:!0})},100)};return document.addEventListener("keydown",m),()=>{document.removeEventListener("keydown",m)}},[n.current]);async function v(){if(h.current===null)return;const m=n.current?.getModel()?.getValue();if(e.scripts[h.current]){if(m!==void 0){if(m.length>W.MAX_LENGTH&&(e.scripts[h.current].tsCode=m,e.scripts[h.current].jsCode=null,X.createFormatted("Your script is too long! It will be saved, but you won't be able to run it.","warn")),m!=e.scripts[h.current].tsCode){const T=await R();T?e.scripts[h.current].jsCode=T:X.createFormatted("An error occured while trying to save this script!","error")}e.scripts[h.current].tsCode=m}else X.createFormatted("An error occured while trying to save this script!","error");x.saveCustomScripts()}}return s.useEffect(()=>{if(!n.current)return;i.current?.terminate(),(async()=>(h.current!==e.scriptIndex&&h.current!==null&&await v(),h.current=e.scriptIndex,n.current?.setValue(M?.tsCode??"")))()},[e.scriptIndex,n.current]),s.useEffect(()=>(window.addEventListener("beforeunload",v),t.beforeClose(async()=>v()),()=>{window.removeEventListener("beforeunload",v)}),[]),o.jsxs("div",{className:"flex-column-full",style:{display:M?"":"none"},children:[o.jsx(Ht,{defaultLanguage:"typescript",beforeMount:m=>{_t(m),a.current=m},onMount:m=>{n.current=m,m.setValue(M?.tsCode??""),m.addCommand(a.current.KeyMod.WinCtrl|a.current.KeyCode.KeyM,()=>n.current?.trigger("","editor.action.triggerSuggest",{}))},onChange:m=>{m&&D(m.length)},path:"main.ts",theme:Re.isDarkTheme()?"dark":"light",options:{fixedOverflowWidgets:!0,automaticLayout:!0,minimap:{enabled:!1},"semanticHighlighting.enabled":!0}}),o.jsxs("p",{style:{marginLeft:"auto",fontSize:"0.8rem",color:A>W.MAX_LENGTH?"red":"#676767"},children:[A,"/",W.MAX_LENGTH," chars"]}),o.jsx("div",{style:{marginTop:"1rem",marginBottom:"0.5rem"},children:"Console"}),o.jsx("pre",{className:"custom-console",style:{height:"10rem",overflowY:"auto",backgroundColor:"#1e1e1e",color:"white",margin:"0",padding:"0.5rem",fontSize:"0.675rem"},children:u.map(([m,T],b)=>{const{background:y,text:g}=zt[m];return o.jsx("div",{style:{backgroundColor:y,color:g,wordBreak:"break-word",whiteSpace:"pre-wrap",fontStyle:m==="info"?"italic":"normal"},children:T},b)})}),o.jsx("button",{className:c?"delete":"",onClick:()=>{if(c){i.current?.terminate(),p(m=>[...m,["info",`Interrupted after ${(performance.now()-E.current).toFixed(2)} ms`]]),l(!1);return}j()},children:c?"Stop":"Test"})]})}function Pe(e){const[t,n]=s.useState(e.value);return s.useEffect(()=>{n(e.value)},[e.value]),o.jsx("textarea",{autoComplete:"off",spellCheck:"false",placeholder:e.placeholder??"",className:`${e.className??""}`,disabled:e.disabled,style:e.style,value:t,onChange:a=>{n(a.target.value)},cols:20,rows:e.rows??5,onBlur:a=>e.onChange?.(a.target.value),onKeyDown:a=>{a.key=="Enter"&&a.currentTarget.blur()}})}const Vt={text:[{name:"Default value",key:"default",description:"Default value",getValue:e=>e.default,input:{type:"text",onChange:(e,t)=>{e.default=t}}}],checkbox:[{name:"Default value",description:"Default value",key:"default",getValue:e=>e.default,input:{type:"checkbox",onChange:(e,t)=>{e.default=t}}}],color:[{name:"Default value",key:"default",description:"Default value",getValue:e=>e.default,input:{type:"color",onChange:(e,t)=>{e.default=t}}}],number:[{name:"Minimum",key:"min",description:"Minimum value",getValue:e=>e.min,input:{type:"number",onChange:(e,t)=>{e.max!==void 0&&t>e.max&&(e.max=t),e.default!==void 0&&t>e.default&&(e.default=t),e.min=t}}},{name:"Maximum",key:"max",description:"Maximum value",getValue:e=>e.max,input:{type:"number",onChange:(e,t)=>{e.min!==void 0&&t<e.min&&(e.min=t),e.default!==void 0&&t<e.default&&(e.default=t),e.max=t}}},{name:"Step",key:"step",description:"Step value when the arrow buttons are pressed",getValue:e=>e.step,input:{type:"number",onChange:(e,t)=>{e.step=t}}},{name:"Default value",key:"default",description:"Default value",getValue:e=>e.default,input:e=>({type:"number",min:e.min??-Number.MAX_VALUE,max:e.max??Number.MAX_VALUE,precision:e.precision,onChange:(t,n)=>{t.default=n}})},{name:"Precision",key:"precision",description:"Number of decimal places to use",getValue:e=>e.precision,input:{type:"number",min:0,max:6,precision:0,onChange:(e,t)=>{e.precision=t}}}],slider:[{name:"Minimum",key:"min",description:"Minimum value",getValue:e=>e.min,input:{type:"number",onChange:(e,t)=>{e.max!==void 0&&t>e.max&&(e.max=t),e.min=t}}},{name:"Maximum",key:"max",description:"Maximum value",getValue:e=>e.max,input:{type:"number",onChange:(e,t)=>{e.min!==void 0&&t<e.min&&(e.min=t),e.max=t}}},{name:"Default value",key:"default",description:"Default value",getValue:e=>e.default,input:e=>({type:"slider",min:e.min,max:e.max,onChange:(t,n)=>{t.default=n}})}],dropdown:[{name:"Options",key:"values",description:"Dropdown options, separated by a comma.",getValue:e=>e.values.join(","),input:{type:"text",onChange:(e,t)=>{e.values=t.split(",").map(n=>n.trim()),e.values.includes(e.default)||(e.default=e.values[0])}}},{name:"Default value",key:"default",description:"Default selected option",getValue:e=>e.default,input:e=>({type:"dropdown",values:e.values||[],advanced:!1,onChange:(t,n)=>{t.default=n}})}]},$t={text:{type:"text",name:"Text Argument",description:"",default:"text"},checkbox:{type:"checkbox",name:"Checkbox Argument",description:"",default:!1},color:{type:"color",name:"Color Argument",description:"",default:"#ffffff"},number:{type:"number",name:"Number Argument",description:"",default:0,step:1,min:0,max:10,precision:3},slider:{type:"slider",name:"Slider Argument",description:"",default:0,min:0,max:10},dropdown:{type:"dropdown",name:"Dropdown Argument",description:"",values:["Option 1","Option 2","Option 3"],default:"Option 1"}};function Kt(e){const[t,n]=s.useState(!1);function a(r,i){return typeof r.input=="function"?r.input(i):r.input}return o.jsxs("div",{children:[o.jsxs("div",{className:"pref-item",style:{cursor:"pointer"},onClick:()=>n(!t),children:[o.jsx("span",{style:{width:"10rem",textOverflow:"ellipsis",whiteSpace:"nowrap",overflow:"hidden"},children:e.argument.name}),o.jsx("span",{style:{marginLeft:"0.5rem",marginRight:"auto",fontFamily:"monospace",fontSize:"0.8rem"},children:e.argument.type}),o.jsx(L,{id:"CHEVRON",width:16,height:16,style:{transform:"rotate(180deg)"}}),o.jsx(L,{id:"CHEVRON",width:16,height:16,style:{transform:"rotate(0deg)"}}),o.jsx(L,{id:"TRASH",width:16,height:16,className:"revert",onClick:()=>{e.removeArgument()}})]}),o.jsxs("div",{style:{display:t?"":"none",marginLeft:"1.5rem",marginTop:"0.5rem",backgroundColor:"var(--secondary-bg)",padding:"0.5rem",borderRadius:"4px"},children:[o.jsxs("div",{className:"pref-item",children:[o.jsx("div",{className:"pref-item-label label",children:"Name"}),o.jsx(ye,{style:{width:"15rem"},value:e.argument.name,onChange:r=>{e.argument.name=r,e.setArgument({...e.argument})}})]}),o.jsxs("div",{className:"pref-item",children:[o.jsx("div",{className:"pref-item-label label",children:"Description"}),o.jsx(Pe,{style:{width:"15rem"},value:e.argument.description,rows:2,onChange:r=>{e.argument.description=r}})]}),o.jsxs("div",{className:"pref-item",children:[o.jsx("div",{className:"pref-item-label label",children:"Type"}),o.jsx(Me,{values:["text","checkbox","color","number","dropdown","slider"],value:e.argument.type,onChange:r=>{e.setArgument({...$t[r],name:e.argument.name,description:e.argument.description})}})]}),Vt[e.argument.type].map(r=>{const i=r,c=a(i,e.argument);return o.jsxs("div",{className:"pref-item",children:[o.jsx("div",{className:"pref-item-label label",children:r.name}),o.jsx(Ae,{...c,value:e.argument[i.key],onChange:l=>{e.setArgument(u=>(c.onChange?.(u,l),{...u}))}})]},r.name)})]})]})}function Yt(e){const t=e.scriptIndex!==null?e.scripts[e.scriptIndex]:null;return t?o.jsxs("div",{className:"flex-column-full",children:[o.jsxs("div",{className:"",children:[o.jsx("div",{className:"property-title",children:"Metadata"}),o.jsxs("div",{className:"property-grid",children:[o.jsx("div",{className:"label",children:"Name"}),o.jsx(ye,{value:t.name,onChange:n=>{t.name=n,e.setScripts(a=>[...a]),x.saveCustomScripts()}}),o.jsx("div",{className:"label",children:"Description"}),o.jsx(Pe,{value:t.description,onChange:n=>{t.description=n,e.setScripts(a=>[...a]),x.saveCustomScripts()}})]})]}),o.jsxs("div",{className:"",style:{flex:1,height:0},children:[o.jsx("div",{className:"property-title",children:"Arguments"}),o.jsxs("div",{className:"flex-column-full",style:{overflowY:"auto",height:"100%",gap:"0.5rem",marginTop:"0.5rem"},children:[t.arguments.map((n,a)=>o.jsx(Kt,{argument:n,setArgument:r=>{e.setScripts(i=>{const c=[...i];return c[e.scriptIndex].arguments[a]=typeof r=="function"?r(c[e.scriptIndex].arguments[a]):r,x.saveCustomScripts(),c})},removeArgument:()=>{e.setScripts(r=>{const i=[...r];return i[e.scriptIndex].arguments.splice(a,1),x.saveCustomScripts(),i})}},a)),o.jsx("button",{onClick:()=>{e.setScripts(n=>{const a=[...n];let r=1;for(;a[e.scriptIndex].arguments.find(i=>i.name==="New Argument"+(r===1?"":" "+r));)r++;return a[e.scriptIndex].arguments.push({name:"New Argument"+(r===1?"":" "+r),description:"",type:"number",default:0,min:0,max:10,step:1,precision:0}),x.saveCustomScripts(),a})},children:"Add Argument"})]})]})]}):o.jsx("div",{className:"flex-column-full center",children:"No script selected"})}function qt(e){return o.jsxs("div",{className:"flex-column-full",style:{width:"10rem",gap:"0.5rem"},children:[o.jsx("div",{className:"custom-script-selector",onClick:()=>e.setScriptIndex(null),children:e.scripts.map((t,n)=>o.jsx("div",{className:`custom-script-option ${e.scriptIndex===n?"selected":""}`,onClick:a=>{e.setScriptIndex(n),a.stopPropagation()},children:t.name},n+"-"+t.name))}),o.jsxs("div",{style:{display:"flex",flexDirection:"row",gap:"0.5rem"},children:[o.jsx("button",{ref:t=>{t&&Y(t,{content:"New script"})},onClick:()=>{e.setScripts(t=>{let n=1;for(;t.some(i=>i.name==="New Script"+(n>1?` ${n}`:""));)n++;const a={name:"New Script"+(n>1?` ${n}`:""),description:"",arguments:[],tsCode:"",jsCode:"",code:""},r=[...t,a];return x.scripts.push(a),x.saveCustomScripts(),e.setScriptIndex(r.length-1),r})},children:o.jsx(L,{id:"PLUS",width:16,height:16})}),o.jsx("button",{ref:t=>{t&&Y(t,{content:"Delete script"})},className:"delete",disabled:e.scriptIndex===null,onClick:()=>{const t=me({title:"Delete Script",message:"Are you sure you want to delete this script?",buttonOptions:[{label:"Cancel",callback:()=>{},type:"default"},{label:"Delete",callback:()=>{e.setScripts(()=>(x.scripts.splice(e.scriptIndex,1),e.setScriptIndex(null),x.saveCustomScripts(),[...x.scripts]))},type:"delete"}]});le.openWindow(t)},children:o.jsx(L,{id:"TRASH",width:16,height:16})}),o.jsx("button",{ref:t=>{t&&Y(t,{content:"Upload script"})},onClick:()=>{const t=me({title:"Upload Script",message:"Script files contain arbitrary code and can be dangerous. Only upload scripts from sources you trust.Are you sure you want to upload a script?",buttonOptions:[{label:"Cancel",callback:()=>{},type:"default"},{label:"Ok",callback:()=>{const n=document.createElement("input");n.type="file",n.accept=".json",n.onchange=a=>{const r=a.target.files?.[0];if(!r)return;const i=new FileReader;i.onload=()=>{try{const c=JSON.parse(i.result),l=ke.parse(c),u={name:l.name,description:l.description,arguments:l.arguments,tsCode:l.code,jsCode:null};e.setScripts(p=>{const E=[...p,u];return x.scripts.push(u),x.saveCustomScripts(),e.setScriptIndex(E.length-1),E})}catch(c){X.createFormatted("Invalid script file!","error"),console.error(c)}},i.readAsText(r)},n.click()},type:"confirm"}]});le.openWindow(t)},children:o.jsx(L,{id:"UPLOAD",width:16,height:16})}),o.jsx("button",{ref:t=>{t&&Y(t,{content:"Download script"})},onClick:()=>{if(!e.scriptIndex)return;const t=e.scripts[e.scriptIndex];if(!t)return;const n=document.createElement("a"),a=new Blob([JSON.stringify({name:t.name,description:t.description,arguments:t.arguments,code:t.tsCode},null,2)],{type:"application/json"});n.href=URL.createObjectURL(a),n.download=t.name+".json",document.body.appendChild(n),n.click(),n.remove()},disabled:e.scriptIndex===null,children:o.jsx(L,{id:"DOWNLOAD",width:16,height:16})})]})]})}function Jt(){const[e,t]=s.useState(x.scripts),[n,a]=s.useState(0),[r,i]=s.useState("metadata");return o.jsxs("div",{className:"flex-row",style:{gap:"1rem"},children:[o.jsx(qt,{scriptIndex:n,setScriptIndex:a,scripts:e,setScripts:t}),o.jsxs("div",{className:"custom-script-container",children:[n==null&&o.jsx("div",{className:"detail",style:{width:"100%",height:"100%",display:"flex",alignItems:"center",justifyContent:"center",fontSize:"1rem"},children:"No script selected"}),o.jsxs("div",{className:"custom-script-tab",style:{display:n!==null?"":"none"},children:[o.jsx("div",{className:`tab-option ${r=="metadata"?"active":""}`,onClick:()=>i("metadata"),children:"Metadata"}),o.jsx("div",{className:`tab-option ${r=="editor"?"active":""}`,onClick:()=>i("editor"),children:"Editor"})]}),o.jsxs(o.Fragment,{children:[o.jsx("div",{className:"custom-script-metadata",style:{display:r=="metadata"?"block":"none",flex:1,height:0,overflow:"hidden"},children:o.jsx(Yt,{scriptIndex:n,scripts:e,setScripts:t})}),o.jsx("div",{style:{display:r=="editor"?"block":"none",flex:1},children:o.jsx(Ut,{scriptIndex:n,scripts:e})})]})]})]})}function Zt(){return{title:"Edit Custom Scripts",width:800,height:600,id:"custom-scripts",content:o.jsx(Jt,{})}}export{Zt as CustomScriptEditorWindow};
