import { getKeybindString, KEYBIND_OPTIONS } from "../util/Keybinds.js"

const MENU_BAR_DATA = {
  file: {
    type: "menu",
    title: "File",
    options: [{
      type: "selection",
      id: "newSong",
    },
    {
      type: "selection",
      id: "openSong",
    },{
      type: "seperator",
    },{
      type: "selection",
      id: "save",
    }]
  },
  audio: {
    type: "menu",
    title: "Audio",
    options: [{
      type: "checkbox",
      id: "assistTick",
      checked: () => options.audio.assistTick,
    },{
      type: "checkbox",
      id: "metronome",
      checked: () => options.audio.metronome,
    },{
      type: "seperator",
    },{
      type: "dropdown",
      title: "Volume",
      options: [{
        type: "selection",
        id: "volumeUp",
      },
      {
        type: "selection",
        id: "volumeDown",
      }]
    },{
      type: "dropdown",
      title: "Effect Volume",
      options: [{
        type: "selection",
        id: "effectvolumeUp",
      },
      {
        type: "selection",
        id: "effectvolumeDown",
      }]
    },{
      type: "dropdown",
      title: "Rate",
      options: [{
        type: "selection",
        id: "rateUp",
      },
      {
        type: "selection",
        id: "rateDown",
      }]
    },]
  },
  chart: {
    type: "menu",
    title: "Chart",
    options: [{
      type: "selection",
      id: "chartList",
    },{
      type: "selection",
      id: "chartProperties",
    },{
      type: "seperator",
    },]
  },
  view: {
    type: "menu",
    title: "View",
    options: [{
      type: "dropdown",
      title: "Cursor",
      options: [{
        type: "selection",
        id: "cursorUp",
      },
      {
        type: "selection",
        id: "cursorDown",
      },{
        type: "seperator",
      },{
        type: "selection",
        id: "previousMeasure",
      },{
        type: "selection",
        id: "nextMeasure",
      },{
        type: "seperator",
      },{
        type: "selection",
        id: "jumpBeat",
      }]
    },{
      type: "dropdown",
      title: "Snap",
      options: [{
        type: "selection",
        id: "decreaseSnap",
      },
      {
        type: "selection",
        id: "increaseSnap",
      }]
    },{
      type: "dropdown",
      title: "Scroll",
      options: [{
        type: "checkbox",
        id: "XMod",
        checked: () => !options.chart.CMod,
      },
      {
        type: "checkbox",
        id: "CMod",
        checked: () => options.chart.CMod
      },{
        type: "seperator",
      },{
        type: "selection",
        id: "increaseScrollSpeed",
      },
      {
        type: "selection",
        id: "decreaseScrollSpeed",
      }]
    },{
      type: "dropdown",
      title: "Waveform",
      options: [{
        type: "checkbox",
        id: "renderWaveform",
        checked: () => options.waveform.enabled
      },{
        type: "selection",
        id: "waveformOptions",
      }]
    },{
      type: "seperator",
    },{
      type: "checkbox",
      id: "hideWarpedArrows",
      checked: () => options.chart.hideWarpedArrows
    },
    {
      type: "checkbox",
      id: "doSpeedChanges",
      checked: () => options.chart.doSpeedChanges
    }]
  }
}

export function createMenuBar() {
  let menubar = document.createElement("div")
  menubar.classList.add("menubar")
  Object.values(MENU_BAR_DATA).forEach(value=>{
    menubar.appendChild(createElement(value))
  })
  return menubar
}

function createElement(data) {
  if (data.type == "seperator") {
    let seperator = document.createElement("div") 
    seperator.classList.add("seperator")
    return seperator
  }
  if (data.type == "selection" || data.type == "checkbox" || data.type == "dropdown") {
    let meta = KEYBIND_OPTIONS[data.id]
    let item = document.createElement("div") 
    let title_bar = document.createElement("div")
    let title = document.createElement("div")
    let title_bar_right;
    if (data.type == "selection" || data.type == "checkbox"){
      title_bar_right = document.createElement("div")
      title_bar_right.innerText = getKeybindString(data.id)
      title_bar_right.classList.add("keybind", "unselectable")
      title.innerText = meta.label

      let disabled = meta.disabled
      if (typeof disabled == "function") disabled = disabled()
      if (disabled) item.classList.add("disabled")

      item.onclick = () => {
        meta.callback()
        let dropdown = item.closest(".menu-main").querySelector(".dropdown")
        dropdown.replaceChildren()
      }
    } else {
      title_bar_right = document.createElement("img")
      title_bar_right.classList.add("icon")
      title_bar_right.src = "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAABgAAAAYCAYAAADgdz34AAAABmJLR0QA/wD/AP+gvaeTAAAAlklEQVRIie3UsQ3CUAyE4U/MQKCCYUCipSFMEwYKFYvAFCAhGCIUoUieoLMrOMmddb98z8/8FaQlLrhhnQFo0L3rgSoasBkAOhyjAdAWkDoaMMV9AHhiHg3ZGk9xigbQ558aVaXfpNStqo2nOHxrnESTI5QeUeoj7wvzNtL800ebRQLKaHaR5unHLv1cL3DGFato8x/XCwFMPpf5ayxcAAAAAElFTkSuQmCC"
      title.innerText = data.title
    }

    title_bar.appendChild(title)
    title_bar.appendChild(title_bar_right)
    item.appendChild(title_bar)
    item.classList.add("menu-item")
    title_bar.classList.add("menu-item-title", "menu-hover")
    title.classList.add("title", "unselectable")

    if (data.type == "dropdown") {
      let dropdown = document.createElement("div")
      item.appendChild(dropdown)
      dropdown.classList.add("dropdown")
      data.options.map(x=>createElement(x)).forEach(x=>dropdown.appendChild(x))
    }
    if (data.type == "checkbox") {
      let checked = data.checked
      if (typeof checked == "function") checked = checked()
      if (checked) title.innerText = "✓ " + meta.label
    }
    return item
  }
  if (data.type == "menu") {
    let menuitem = document.createElement("div")
    let title = document.createElement("div")
    let dropdown = document.createElement("div")
    menuitem.appendChild(title)
    title.innerText = data.title
    menuitem.appendChild(dropdown)
    title.classList.add("title", "unselectable")
    menuitem.classList.add("menu-item","menu-main")
    title.classList.add("menu-hover")
    dropdown.classList.add("dropdown")
    menuitem.onmouseenter = () => { 
      dropdown.replaceChildren(...data.options.map(x=>createElement(x)))
    }
    menuitem.onmouseleave = () => { 
      dropdown.replaceChildren()
    }
   
    return menuitem
  }
  return document.createElement("div")
}
