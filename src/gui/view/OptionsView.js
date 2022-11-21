import { createWindow, getWindowById } from "../BaseWindow.js";
import { ViewData } from "./ViewData.js";


export function reloadData(id) {
  let view = getWindowById(id)?.view ?? undefined
  if (view) {
    view.innerHTML = ""
    makeOptionsView(view, ViewData[id].view)
  }
}

export function createOptionsWindow(id) {
  let dat = ViewData[id]
  let window = createWindow(dat.title, dat.window_width, dat.window_height, id, dat.closeable)
  makeOptionsView(window,dat.view)
  return window
}

function evalString(s) {
  if (typeof s == "function") return s()
  return s
}

function makeOptionsView(view, sections) {
  view.classList.add("options")
  let padding = document.createElement("div")
  padding.classList.add("padding")
  sections.forEach(s => {
    let title = document.createElement("div")
    title.innerText = evalString(s.title)
    title.classList.add("title")
    padding.appendChild(title)
    let section = document.createElement("div")
    section.classList.add("section")
    s.options.forEach(o => {
      let con = document.createElement("div")
      con.classList.add("container")
      let label = document.createElement("div")
      label.classList.add("label")
      let item = document.createElement(o.element)
      item.classList.add("item")
      if (o.classes && o.classes != "")
        item.classList.add(o.classes)
      for(var key in o.attributes) {
        item.setAttribute(key, o.attributes[key]);
      }
      for(var e in o.listeners) {
        item.addEventListener(e,o.listeners[e])
      }

      label.innerText = evalString(o.label)
      item.innerText = evalString(o.content)
      con.appendChild(label)
      con.appendChild(item)
      section.appendChild(con)
      con.dar = o.label
    })
    padding.appendChild(section)
    section.dat = s.title
  });
  view.appendChild(padding)
}

window.ow = createOptionsWindow