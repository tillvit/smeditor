import { createOptionsWindow } from "./view/OptionsView";

const NavBarData = {
  file: {
    title: "File",
    options: [{
      title: "New/Open Song...",
      type: "selection",
      callback: ()=>createOptionsWindow("select_sm")
    },{
      type: "seperator",
    },{
      title: "Save Song...",
      type: "selection",
      callback: ()=>createOptionsWindow("select_sm")
    },]
  },
  chart: {
    title: "Chart",
    options: [{
      title: "Open Chart...",
      type: "selection",
      callback: ()=>createOptionsWindow("select_sm")
    },{
      type: "seperator",
    },{
      title: "Save...",
      type: "selection",
      callback: ()=>createOptionsWindow("select_sm")
    },]
  }
}