import { createOptionsWindow } from "./view/OptionsView.js";

const NavBarData = {
  file: {
    title: "File",
    options: [{
      title: "New Song...",
      type: "selection",
      callback: ()=>createOptionsWindow("select_sm"),
      disabled: true
    },
    {
      title: "Open Song...",
      type: "selection",
      callback: ()=>createOptionsWindow("select_sm"),
      disabled: false
    },{
      type: "seperator",
    },{
      title: "Save Song...",
      type: "selection",
      callback: ()=>createOptionsWindow("select_sm"),
      disabled: true
    },]
  },
  chart: {
    title: "Chart",
    options: [{
      title: "New/Open Chart...",
      type: "selection",
      callback: ()=>createOptionsWindow("select_sm"),
      disabled: true
    },{
      title: "Chart Properties...",
      type: "selection",
      callback: ()=>createOptionsWindow("select_sm"),
      disabled: true
    },{
      type: "seperator",
    },{
      title: "XMod (time-based)",
      type: "checkbox",
      checked: ()=>!window.options.chart.CMod,
      callback: ()=>createOptionsWindow("select_sm"),
      disabled: true
    },{
      title: "CMod (time-based)",
      type: "checkbox",
      checked: ()=>window.options.chart.CMod,
      callback: ()=>createOptionsWindow("select_sm"),
      disabled: true
    },{
      type: "seperator",
    },{
      title: "Allow Scroll Speed Changes",
      type: "checkbox",
      checked: ()=>window.options.chart.doSpeedChanges,
      callback: ()=>createOptionsWindow("select_sm"),
      disabled: true
    }]
  }
}