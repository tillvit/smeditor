import { WindowOptions } from "../window/Window"
import { App } from "../App"
import { DirectoryWindow } from "../window/DirectoryWindow"



type OptionsWindowOption = {
  label: string | ((app: App) => string),
  element: (app: App) => HTMLElement,
}

type OptionsWindowEntry = {
  title: string | ((app: App) => string),
  options: OptionsWindowOption[]
}

type OptionsWindowData = {
  window_options: WindowOptions,
  view: OptionsWindowEntry[]
}

export const OPTIONS_WINDOW_DATA: {[key: string]: OptionsWindowData} = {
  select_sm_initial: {
    window_options: {
      title: "Open a Song",
      width: 300,
      height: 160,
      disableClose: true,
      win_id: "select_sm_initial"
    },
    view: [{
      title: "Import",
      options: [{
        label: "Import a song folder",
        element: (app) => {
          let el = document.createElement("button")
          el.innerHTML = "Upload..."
          el.onclick = () => {
            app.windowManager.openWindow(new DirectoryWindow(app, {
              title: "Select an sm/ssc file...",
              accepted_file_types: ["sm","ssc"],
              disableClose: true,
              callback: (path: string) => {
                app.chartManager.loadSM(path)
                app.windowManager.getWindowById("select_sm_initial")!.closeWindow()
              }
            }))
          }
          return el
        }
      }]
    },
    {
      title: "New (not implemented)",
      options: [{
          label: "Create a new song",
          element: () => {
            let el = document.createElement("button")
            el.innerHTML = "New Song"
            // el.onclick = () => {
            //   let folder = "New Song"
            //   if (window.files.file_tree[folder]) {
            //     let i = 2
            //     while (window.files.file_tree[folder + " " + i]) i++
            //   }
            //   var file = new File([DEFAULT_SM], "song.sm", {type: ""});
            //   window.files.addFile(folder + "/song.sm",file)
            //   window.selected_sm = folder + "/song.sm"
            //   closeWindow("select_sm_initial")
            //   loadSM()
            //   createOptionsWindow("song_properties")
            // }
            return el
          }
      }]
    }]
  }
}