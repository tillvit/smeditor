import { App } from "../App"
import { FileHandler } from "../util/FileHandler"
import { DirectoryWindow } from "../window/DirectoryWindow"
import { SMPropertiesWindow } from "../window/SMPropertiesWindow"
import { WindowOptions } from "../window/Window"
import { DEFAULT_SM } from "./SMData"

type OptionsWindowOption = {
  label: string | ((app: App) => string)
  element: (app: App) => HTMLElement
}

type OptionsWindowEntry = {
  title: string | ((app: App) => string)
  options: OptionsWindowOption[]
}

type OptionsWindowData = {
  window_options: WindowOptions
  view: OptionsWindowEntry[]
}

export const OPTIONS_WINDOW_DATA: { [key: string]: OptionsWindowData } = {
  select_sm_initial: {
    window_options: {
      title: "Open a Song",
      width: 300,
      height: 160,
      disableClose: true,
      win_id: "select_sm_initial",
    },
    view: [
      {
        title: "Import",
        options: [
          {
            label: "Import a song folder",
            element: app => {
              const el = document.createElement("button")
              el.innerHTML = "Upload..."
              el.onclick = () => {
                app.windowManager.openWindow(
                  new DirectoryWindow(app, {
                    title: "Select an sm/ssc file...",
                    accepted_file_types: [".sm", ".ssc"],
                    disableClose: true,
                    callback: (path: string) => {
                      app.chartManager.loadSM(path)
                      app.windowManager
                        .getWindowById("select_sm_initial")!
                        .closeWindow()
                    },
                  })
                )
              }
              return el
            },
          },
        ],
      },
      {
        title: "New",
        options: [
          {
            label: "Create a new song",
            element: app => {
              const el = document.createElement("button")
              el.innerHTML = "New Song"
              el.onclick = async () => {
                let folder = "New Song"
                if (await FileHandler.getDirectoryHandle(folder)) {
                  let i = 2
                  while (await FileHandler.getDirectoryHandle(folder)) {
                    folder = `New Song ${i++}`
                  }
                }
                await FileHandler.writeFile(folder + "/song.sm", DEFAULT_SM)
                await app.chartManager.loadSM(folder + "/song.sm")
                app.windowManager.openWindow(
                  new SMPropertiesWindow(app, true, async success => {
                    if (success) {
                      app.windowManager
                        .getWindowById("select_sm_initial")!
                        .closeWindow()
                    } else {
                      await FileHandler.removeDirectory(folder)
                      app.chartManager.loadSM()
                    }
                  })
                )
              }
              return el
            },
          },
        ],
      },
    ],
  },
}
