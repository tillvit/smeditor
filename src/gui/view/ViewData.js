import { loadAudio, loadSM } from "../chart/ChartManager.js";
import { FileSystem } from "../../util/FileSystem.js";
import { closeWindow } from "../BaseWindow.js";
import { createDirectoryWindow } from "./DirectoryView.js";
import { createOptionsWindow, reloadData } from "./OptionsView.js";

const DEFAULT_SM = `#TITLE:New Song;
#SUBTITLE:;
#ARTIST:;
#TITLETRANSLIT:;
#SUBTITLETRANSLIT:;
#ARTISTTRANSLIT:;
#GENRE:;
#CREDIT:;
#BANNER:;
#BACKGROUND:;
#LYRICSPATH:;
#CDTITLE:;
#MUSIC:;
#OFFSET:0;
#SAMPLESTART:0.000000;
#SAMPLELENGTH:0.000000;
#SELECTABLE:YES;
#BPMS:0.000000=120.000000;
#STOPS:;
#BGCHANGES:;
#FGCHANGES:;
#KEYSOUNDS:;
#ATTACKS:;
`


export const ViewData = {
  select_sm_initial: {
    title: "Open a Song",
    window_width: 300,
    window_height: 160,
    closeable: false,
    view: [{
      title: "Import",
      options: [{
          label: "Import a song folder",
          content: "Upload...",
          element: "button",
          classes: "",
          attributes: {},
          listeners: {
            click: (e) => {
              createDirectoryWindow("Select an sm/ssc file...",["sm","ssc"], false, "", (file) => {
                window.selected_sm = file
                closeWindow("select_sm_initial")
                loadSM()
                reloadData("song_properties")
              })
            }
          }
      }]
    },
    {
      title: "New",
      options: [{
          label: "Create a new song",
          content: "New Song",
          element: "button",
          classes: "",
          attributes: {},
          listeners: {
            click: (e) => {
              let folder = "New Song"
              if (window.files.file_tree[folder]) {
                let i = 2
                while (window.files.file_tree[folder + " " + i]) i++
              }
              var file = new File([DEFAULT_SM], "song.sm", {type: ""});
              window.files.addFile(folder + "/song.sm",file)
              window.selected_sm = folder + "/song.sm"
              closeWindow("select_sm_initial")
              loadSM()
              createOptionsWindow("song_properties")
            }
          }
      }]
    }]
  },

  select_sm: {
    title: "Open a Song",
    window_width: 300,
    window_height: 200,
    closeable: false,
    view: [{
      title: "Import",
      options: [{
          label: "Import files from folder",
          content: "Upload folder...",
          element: "button",
          classes: "",
          attributes: {},
          listeners: {
            click: (e) => {
              var input = document.createElement('input');
              input.type = 'file';
              input.multiple = true
              input.webkitdirectory = true
    
              input.onchange = e => { 
                let file = e.target.files; 
                window.files = new FileSystem()
                window.files.parseFiles(file)
                for (let f in window.files.files) {
                  if (f.endsWith(".sm") || f.endsWith(".ssc")) {
                    window.selected_sm = f
                    break;
                  }
                }
                closeWindow("select_sm")
                loadSM()
                reloadData("song_properties")
              }
              input.click()
            }
          }
      },
      {
        label: "Select another sm/ssc file",
        content: "Select File...",
        element: "button",
        classes: "",
        attributes: {},
        listeners: {
          click: (e) => {
            createDirectoryWindow(window.files.file_tree,["sm","ssc"])
          }
        }
    }]
    },
    {
      title: "New",
      options: [{
          label: "Create a new song",
          content: "New Song",
          element: "button",
          classes: "",
          attributes: {},
          listeners: {
            click: (e) => {
              window.files = new FileSystem()
              var data = new File([DEFAULT_SM], "song.sm", {type: ""});
              window.files.addFile("_default/song.sm",data)
              window.selected_sm = "_default/song.sm"
              closeWindow("select_sm")
              loadSM()
              reloadData("song_properties")
            }
          }
      }]
    }]
  },

  song_properties: {
    title: "Song Properties",
    window_width: 400,
    window_height: 300,
    closeable: true,
    view: [{
      options: [
      {
        label: ()=>"Song File: " + (window.sm?.MUSIC ?? ""),
        content: "Choose File...",
        element: "button",
        classes: "",
        attributes: {},
        listeners: {
          click: (e) => {
            var input = document.createElement('input');
            input.type = 'file';
            input.accept = ".sm,.ssc"
  
            input.onchange = e => { 
              if (Object.keys(window.files.file_tree).length == 0) window.files.addFile("song",{})
              let dir = Object.keys(window.files.getFilesAtPath(""))[0]
              console.log(dir)
              window.files.addFile(dir+"/"+e.target.files[0].name,e.target.files[0])
              window.selected_sm = dir+"/"+e.target.files[0].name
              loadAudio()
              reloadData("song_properties")
            }
            input.click()
          }
        }
      }]
    }]
  }
}