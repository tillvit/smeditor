import { App } from "../App"
import { SimfileProperty } from "../chart/sm/SimfileTypes"
import { Icons } from "../gui/Icons"
import { DirectoryWindow } from "../gui/window/DirectoryWindow"
import { ActionHistory } from "../util/ActionHistory"
import { FileHandler } from "../util/FileHandler"
import { capitalize } from "../util/Util"
import { AUDIO_EXT, IMG_EXT } from "./FileData"

type SMPropertiesWindowData = {
  title: string
  element: (app: App) => HTMLElement
}

function simpleTextOption(
  prop: SimfileProperty,
  name?: string
): SMPropertiesWindowData {
  return {
    title: name ?? capitalize(prop),
    element: app => {
      const sm = app.chartManager.loadedSM!
      const input = document.createElement("input")
      input.type = "text"
      input.autocomplete = "off"
      input.spellcheck = false
      input.onkeydown = ev => {
        if (ev.key == "Enter") input.blur()
      }
      input.onblur = () => {
        const lastValue = sm.properties[prop]
        ActionHistory.instance.run({
          action: () => (sm.properties[prop] = input.value),
          undo: () => (sm.properties[prop] = lastValue),
        })
      }
      input.value = sm.properties[prop] ?? ""
      return input
    },
  }
}

function fileOption(
  prop: SimfileProperty,
  type: string,
  name?: string,
  onChange?: (app: App, path: string) => void
): SMPropertiesWindowData {
  return {
    title: name ?? capitalize(prop),
    element: app => {
      const sm = app.chartManager.loadedSM!

      const container = document.createElement("div")
      container.classList.add("flex-row", "flex-column-gap", "flex-static")

      const handleInput = () => {
        sm.properties[prop] = input.value
        onChange?.(app, input.value)
      }
      const input = document.createElement("input")
      input.type = "text"
      input.autocomplete = "off"
      input.spellcheck = false
      input.onkeydown = ev => {
        if (ev.key == "Enter") input.blur()
      }
      input.onblur = handleInput
      input.value = sm.properties[prop] ?? ""

      const dirButton = document.createElement("button")
      dirButton.style.height = "100%"
      dirButton.onclick = () => {
        const dir = app.chartManager.smPath.split("/").slice(0, -1).join("/")

        if (window.nw) {
          const fileSelector = document.createElement("input")
          fileSelector.type = "file"
          fileSelector.accept = type == "audio" ? "audio/*" : "image/*"
          fileSelector.onchange = () => {
            input.value = FileHandler.getRelativePath(dir, fileSelector.value)
            handleInput()
          }
          fileSelector.click()
        } else {
          app.windowManager.openWindow(
            new DirectoryWindow(
              app,
              {
                title:
                  type == "audio"
                    ? "Select an audio file..."
                    : "Select an image file...",
                accepted_file_types: type == "audio" ? AUDIO_EXT : IMG_EXT,
                disableClose: true,
                callback: (path: string) => {
                  input.value = FileHandler.getRelativePath(dir, path)
                  handleInput()
                },
              },
              sm.properties[prop]
                ? dir + "/" + sm.properties[prop]
                : app.chartManager.smPath
            )
          )
        }
      }
      const icon = document.createElement("img")
      icon.classList.add("icon")
      icon.style.height = "12px"
      icon.src = Icons.SELECT_FILE
      dirButton.appendChild(icon)
      container.appendChild(input)
      container.appendChild(dirButton)
      return container
    },
  }
}

export const SM_PROPERTIES_WINDOW_DATA: {
  [key: string]: SMPropertiesWindowData
} = {
  title: simpleTextOption("TITLE", "Song Title"),
  subtitle: simpleTextOption("SUBTITLE", "Song Subtitle"),
  artist: simpleTextOption("ARTIST", "Song Artist"),
  credit: simpleTextOption("CREDIT"),
  genre: simpleTextOption("GENRE"),
  origin: simpleTextOption("ORIGIN"),
  music: fileOption("MUSIC", "audio", "Music File", app =>
    app.chartManager.loadAudio()
  ),
  bg: fileOption("BACKGROUND", "image", "BG Image"),
  banner: fileOption("BANNER", "image", "Banner Image"),
  cdtitle: fileOption("CDTITLE", "image", "CD Title"),
  cdimage: fileOption("CDIMAGE", "image", "CD Image"),
  jacket: fileOption("JACKET", "image", "Jacket"),
  discImage: fileOption("DISCIMAGE", "image", "Disc Image"),
}
