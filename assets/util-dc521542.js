import{_ as l}from"./index-94ad4b65.js";const E={INVALID:["seeking position failed.","InvalidStateError"],GONE:["A requested file or directory could not be found at the time an operation was processed.","NotFoundError"],MISMATCH:["The path supplied exists, but was not an entry of requested type.","TypeMismatchError"],MOD_ERR:["The object can not be modified in this way.","InvalidModificationError"],SYNTAX:e=>[`Failed to execute 'write' on 'UnderlyingSinkBase': Invalid params passed. ${e}`,"SyntaxError"],ABORT:["The operation was aborted","AbortError"],SECURITY:["It was determined that certain files are unsafe for access within a Web application, or that too many calls are being made on file resources.","SecurityError"],DISALLOWED:["The request is not allowed by the user agent or the platform in the current context.","NotAllowedError"]},y=e=>typeof e=="object"&&typeof e.type<"u";async function v(e){var r,o,a;const{FolderHandle:t,FileHandle:u}=await l(()=>import("./memory-29bc8b06.js"),["./memory-29bc8b06.js","./index-94ad4b65.js","./index-792f5fb4.css"],import.meta.url),{FileSystemDirectoryHandle:_}=await l(()=>import("./index-94ad4b65.js").then(i=>i.a),["./index-94ad4b65.js","./index-792f5fb4.css"],import.meta.url),p=(o=(r=e[0].webkitRelativePath)===null||r===void 0?void 0:r.split("/",1)[0])!==null&&o!==void 0?o:"",m=new t(p,!1);for(let i=0;i<e.length;i++){const n=e[i],d=!((a=n.webkitRelativePath)===null||a===void 0)&&a.length?n.webkitRelativePath.split("/"):["",n.name];d.shift();const f=d.pop(),w=d.reduce((c,s)=>(c._entries[s]||(c._entries[s]=new t(s,!1)),c._entries[s]),m);w._entries[f]=new u(n.name,n,!1)}return new _(m)}async function b(e){const{FileHandle:r}=await l(()=>import("./memory-29bc8b06.js"),["./memory-29bc8b06.js","./index-94ad4b65.js","./index-792f5fb4.css"],import.meta.url),{FileSystemFileHandle:o}=await l(()=>import("./index-94ad4b65.js").then(t=>t.F),["./index-94ad4b65.js","./index-792f5fb4.css"],import.meta.url);return Array.from(e).map(t=>new o(new r(t.name,t,!1)))}export{E as errors,y as isChunkObject,v as makeDirHandleFromFileList,b as makeFileHandlesFromFileList};