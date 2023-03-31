import { App } from "../App"
import { DirectoryWindow } from "../gui/window/DirectoryWindow"
import { SMPropertiesWindow } from "../gui/window/SMPropertiesWindow"
import { WindowOptions } from "../gui/window/Window"
import { FileHandler } from "../util/FileHandler"
import { DEFAULT_SM } from "./SMData"

type InitialWindowOption = {
  label: string | ((app: App) => string)
  element: (app: App) => HTMLElement
}

type InitialWindowEntry = {
  title: string | ((app: App) => string)
  options: InitialWindowOption[]
}

type InitialWindowData = {
  window_options: WindowOptions
  view: InitialWindowEntry[]
}

export const INITIAL_WINDOW_DATA: InitialWindowData = {
  window_options: {
    title: "Open a Song",
    width: 300,
    height: 160,
    disableClose: true,
    win_id: "select_sm_initial",
  },
  view: [
    {
      title: "Open",
      options: [
        {
          label: window.nw ? "Open an existing song" : "Import a song folder",
          element: app => {
            const el = document.createElement("button")
            el.innerHTML = window.nw ? "Open..." : "Upload..."
            el.onclick = () => {
              if (window.nw) {
                const fileSelector = document.createElement("input")
                fileSelector.type = "file"
                fileSelector.accept = ".sm,.ssc"
                fileSelector.onchange = () => {
                  app.chartManager.loadSM(fileSelector.value)
                  app.windowManager
                    .getWindowById("select_sm_initial")!
                    .closeWindow()
                }
                fileSelector.click()
              } else {
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
}
