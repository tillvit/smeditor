import { App } from "../App"
import { SimfileProperty } from "../chart/sm/SimfileTypes"
import { FileSystem } from "../util/FileSystem"
import { capitalize } from "../util/Util"
import { DirectoryWindow } from "../window/DirectoryWindow"
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
      const sm = app.chartManager.sm!
      const input = document.createElement("input")
      input.type = "text"
      input.autocomplete = "off"
      input.spellcheck = false
      input.onkeydown = ev => {
        if (ev.key == "Enter") input.blur()
      }
      input.onblur = () => {
        sm.properties[prop] = input.value
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
      const sm = app.chartManager.sm!

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
        const dir = app.chartManager.sm_path.split("/").slice(0, -1).join("/")
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
                input.value = FileSystem.relPath(dir, path)
                handleInput()
              },
            },
            sm.properties[prop]
              ? dir + "/" + sm.properties[prop]
              : app.chartManager.sm_path
          )
        )
      }
      const icon = document.createElement("img")
      icon.classList.add("icon")
      icon.style.height = "12px"
      icon.src =
        "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAADAAAAAwCAYAAABXAvmHAAAACXBIWXMAAAsTAAALEwEAmpwYAAAArUlEQVR4nO3YQQ6CQBBE0X8PXKrn9DqGcDNNZC5QhGR2agQk6Z5QL+l9FwULGszMzN6dgB4ogFbOjQTLPzcsniZE/+fy4SHKTgHCQijZFGAALq0GUJ35u+xaDiDg3nqA15YA0bR2HwfYmdxAMLmBYHIDweQGgskNBJMbCCY3EExuIJgO18DY+k/9kGBRfZn57PnTFXgkWFYfDltnFurqESnD6zTWJ794eTMzO44JY84XrlhT/UgAAAAASUVORK5CYII="
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
  cdtitle: fileOption("CDTITLE", "image", "CD Jacket"),
}
