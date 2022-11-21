import { clamp } from "../util/Util.js";

var dragging;

document.getElementById("pixi").onclick = ()=>{unfocusAll()}

export function createWindow(title, width, height, win_id, window_options) {
  if (getWindowById(win_id)) {
    focusWindow(getWindowById(win_id))
    return getWindowById(win_id).view
  }

  let win = document.createElement("div")
  let tit = document.createElement("div")
  let navbar = document.createElement("div")
  win.view = document.createElement("div")
  win.win_id = win_id
  let close = document.createElement("img")
  let minimize = document.createElement("img")

  win.appendChild(navbar)
  win.appendChild(win.view)
  win.style.width = width
  win.style.left = window.innerWidth/2-width/2
  win.style.top = window.innerHeight/2-height/2
  for (let i = 0; i < 6; i ++) {
    if (!hasWindowsNearPoint(window.innerWidth/2-width/2+i*20,window.innerHeight/2-height/2+i*20,6)) {
      win.style.left = window.innerWidth/2-width/2 + i * 20
      win.style.top = window.innerHeight/2-height/2 + i * 20
      break
    }
  }
  win.classList.add("unselectable")
  win.classList.add("window")

  win.view.classList.add("view")
  win.view.style.height = height
  win.view.style.width = width
  win.view.cachedHeight = height

  navbar.appendChild(tit)
  if (window_options) {
    navbar.appendChild(minimize)
    navbar.appendChild(close)
  }
  navbar.classList.add("navbar")

  tit.innerText = title
  tit.classList.add("title")

  minimize.classList.add("unselectable")
  minimize.draggable = false
  minimize.src = "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAADAAAAAwCAYAAABXAvmHAAAAAXNSR0IArs4c6QAAANtJREFUaEPtlbsNwlAQBMcRLQC10QZEiAAi0wa0xqcMdIiICGmejZ60znfPN3OWBzp/hs7fnyzwb4MxEAOSQE5IAtTxGNAIZUEMSIA6HgMaoSyIAQlQx2NAI5QFMSAB6ngMaISyIAYkQB2PAY1QFsSABKjjMaARyoIYkAB1PAY0QlkQAxKgjseARigLysACOAEbYCX75oo/gCuwrwXOwHauyY3njLVAbbNsXDxX3bMWuHd0Ot9gbrXACOzmQtZ4zvuE6iM+fj7ideMBU9XV1VyAQ/4DUyH+tbd7Ay+Srg0YYU5a1gAAAABJRU5ErkJggg=="
  minimize.onclick = () => {
    if (win.view.style.height != "0px") {
      win.view.style.height = 0
    }else{
      win.view.style.height = win.view.cachedHeight
    } 
    clampPosition(win)
  }

  close.classList.add("unselectable")
  close.draggable = false
  close.src = "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAADAAAAAwCAYAAABXAvmHAAAAAXNSR0IArs4c6QAAA35JREFUaEPtmbfrFUEQxz+/0pwwFNoqmMCcc46olY1/m7U2Ys45IWIuDFiJCYyYC0X5ypwcx93t7O57yIO37c3Ofr8zszvhBujxNdDj+OkT+N8e7HugVzywGtgLPAB2A1+6BHw4sB+YBuwBLoTO8YTQMuAYMNSUXQM2AZ9CyiO/jwBOAAtt3zdgG3CuTU+IwFLgeAl8oesWsA74EAmySVzgTwILKgJBEm0ElpvlhzScegPYCHzMJDEKOAXMbdDzFdgMXKr73kbgFTAhAO4msCHDE6OB08DswDkvgImxBK4ASxzWVTitB947ZMsiYwz8LMc+XeZVsQRGmmvnOQ64a3firUNWIgobWX6OQ/6O6X4XS0DyIqHLNd9x0D076E1AdixwBpjp0HnbdDZ6N/QK6YymF6Lu/IfAGkD3p26NM/AzHOBdoekhUJAov9Ft5z8ClPiqJAT+LDDdAd6da7wEdKaypEgscgB4bCRemux4A68MG1pu8FIUQ0DyyglHgJUhFMATI/HTsulUx56rluU/O2T/isQS0J5hluCUpUNLJLQmhwSBi8AWQInLvVIISPlg4LBZ2H1Yi+Bly7bRRWIqgYLEIXt1ckioRJDlo8GnhlAZrDxxEFibyEA10A7ge+L+pDtQPWuQkVB1GrOUIHfmgO+EBwrAInHACjsPCZXou4AfHuE2mZw7UNYbk621TyWCwi67n+gEASU4hUPRSXmN2pGmKJdAKviCZDaJHALKyuqV1bnlrOvW2SX12KkEOgW+IJ5MIoWASgkVdYsdZlfLqeVpilTEqcd210Epz6gsfxRY4QCvTkovza+GiUOdimgSMR6IqUQL8EUnpWdWWdfT2UWR8BKIAa/+WJav9rBdIeEhoHpHYePpAZrAF+ESQ8LVG4QICLwamNqRRiWIQ+AL8ZhpR5BEG4EY8JpIqJmvHX3U3NaOkWgjoFpfw9XQ8lq+qsc7ldM+NU/b64C0EXgGTAqgj7V8HQnNiELTuedNWNoIKO4V/wqluiXwem2807gmW8gTbSQ0od4KnI/1gOSr/wYKHfct5nPBly+2Ro3VCbU6NYWx5km1K/QKaVN1zK7BlbzzOnQ5Ir/rYpdJCLziXt5pXB4C2qxQ2Qc8NXeG5p+R2P+Ja2Ktx2OK/cpqBa9dXgKF7O9UZN3aF0OgWxiy9PYJZJmvA5v7HuiAEbNU/AEymbExfA8cowAAAABJRU5ErkJggg=="
  close.onclick = () => {
    win.classList.add("exiting")
    setTimeout(function() {
      document.getElementById("windows").removeChild(win)
    },40)
  }
  
  win.addEventListener('mousedown', ()=>{
    focusWindow(win)
  }, false);

  //dragging
  tit.addEventListener('mousedown', ()=>{
    dragging = win
    focusWindow(win)
    window.addEventListener('mousemove', handleMove, true);
  }, false);
  window.addEventListener('mouseup', ()=>{
    dragging = undefined
    window.removeEventListener('mousemove',handleMove, true)
  }, false);

  document.getElementById("windows").appendChild(win)
  focusWindow(win)
 
  return win.view
}

function handleMove(e) {
  if (dragging != undefined) {
    let x = parseInt(dragging.style.left.slice(0,-2)) + e.movementX
    let y = parseInt(dragging.style.top.slice(0,-2)) + e.movementY
    dragging.style.left = x
    dragging.style.top = y
    clampPosition(dragging)
  }
}

function clampPosition(win) {
  let x = parseInt(win.style.left.slice(0,-2))
  let y = parseInt(win.style.top.slice(0,-2))
  let w = win.clientWidth
  let h = win.clientHeight
  win.style.left = clamp(x,0,window.innerWidth-w)
  win.style.top = clamp(y,0,window.innerHeight-h)
}

function hasWindowsNearPoint(x,y,dist) {
  for (let win of document.getElementById("windows").children) {
    let a = parseInt(win.style.left.slice(0,-2))-x
    let b = parseInt(win.style.top.slice(0,-2))-y
    if (a*a+b*b < dist * dist) return true
  }
  return false
}

export function getWindowById(win_id) {
  for (let win of document.getElementById("windows").children) {
    if (win.win_id == win_id) return win
  }
  return undefined
}

export function closeWindow(id) {
  let win = getWindowById(id) ?? undefined
  if (win) {
    win.classList.add("exiting")
    setTimeout(function() {
      document.getElementById("windows").removeChild(win)
    },40)
  }
}

function focusWindow(wind) {
  unfocusAll()
  wind.classList.add("focused")
  let windows = []
  for (let win of document.getElementById("windows").children) {
    if (win == wind) continue
    windows.push(win)
  }
  windows.sort((a,b)=>a.style.zIndex - b.style.zIndex)
  windows.push(wind)
  for (let i = 0; i < windows.length; i ++) {
    windows[i].style.zIndex = i
  }
}

function unfocusAll() {
  for (let win of document.getElementsByClassName("focused")) {
    win.classList.remove("focused")
  }
}

window.cw = createWindow