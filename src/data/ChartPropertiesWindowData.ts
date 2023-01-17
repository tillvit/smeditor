import { App } from "../App"
import { CHART_DIFFICULTIES } from "../chart/sm/ChartTypes"
import { Dropdown } from "../gui/Dropdown"
import { NumberSpinner } from "../gui/NumberSpinner"
import { FileSystem } from "../util/FileSystem"
import { DirectoryWindow } from "../window/DirectoryWindow"
import { AUDIO_EXT } from "./FileData"

type ChartPropertiesWindowData = {
  title: string
  element: (app: App) => HTMLElement
}

export const CHART_PROPERTIES_WINDOW_DATA: {
  [key: string]: ChartPropertiesWindowData
} = {
  type: {
    title: "Chart Type",
    element: app => {
      const chart = app.chartManager.chart!
      const container = document.createElement("div")
      container.classList.add("flex-row", "flex-column-gap", "flex-static")
      const dropdown = Dropdown.create([chart.gameType.id])
      dropdown.disabled = true
      container.appendChild(dropdown.view)
      return container
    },
  },
  difficulty: {
    title: "Difficulty",
    element: app => {
      const chart = app.chartManager.chart!
      const container = document.createElement("div")
      container.classList.add("flex-row", "flex-column-gap", "flex-static")
      const dropdown = Dropdown.create(CHART_DIFFICULTIES, chart.difficulty)
      dropdown.onChange(value => {
        chart.difficulty = value
      })
      const input = NumberSpinner.create(chart.meter, 1, 0, 1)
      input.input.classList.add("short", "right")
      input.onChange = value => {
        if (!value) {
          input.setValue(chart.meter)
          return
        }
        chart.meter = value
      }
      container.appendChild(dropdown.view)
      container.appendChild(input.view)
      return container
    },
  },
  credit: {
    title: "Chart Artist",
    element: app => {
      const chart = app.chartManager.chart!
      const input = document.createElement("input")
      input.type = "text"
      input.autocomplete = "off"
      input.spellcheck = false
      input.onkeydown = ev => {
        if (ev.key == "Enter") input.blur()
      }
      input.onblur = () => {
        chart.credit = input.value
      }
      input.value = chart.credit
      return input
    },
  },
  name: {
    title: "Chart Name",
    element: app => {
      const chart = app.chartManager.chart!
      const input = document.createElement("input")
      input.type = "text"
      input.autocomplete = "off"
      input.spellcheck = false
      input.onkeydown = ev => {
        if (ev.key == "Enter") input.blur()
      }
      input.onblur = () => {
        chart.chartName = input.value
      }
      input.value = chart.chartName
      return input
    },
  },
  description: {
    title: "Description",
    element: app => {
      const chart = app.chartManager.chart!
      const input = document.createElement("input")
      input.type = "text"
      input.autocomplete = "off"
      input.spellcheck = false
      input.onkeydown = ev => {
        if (ev.key == "Enter") input.blur()
      }
      input.onblur = () => {
        chart.description = input.value
      }
      input.value = chart.description
      return input
    },
  },
  style: {
    title: "Chart Style",
    element: app => {
      const chart = app.chartManager.chart!
      const input = document.createElement("input")
      input.type = "text"
      input.autocomplete = "off"
      input.spellcheck = false
      input.onkeydown = ev => {
        if (ev.key == "Enter") input.blur()
      }
      input.onblur = () => {
        chart.chartStyle = input.value
      }
      input.value = chart.chartStyle
      return input
    },
  },
  music: {
    title: "Music File",
    element: app => {
      const chart = app.chartManager.chart!

      const container = document.createElement("div")
      container.classList.add("flex-row", "flex-column-gap", "flex-static")

      const handleInput = () => {
        const playing = app.chartManager.songAudio.isPlaying()
        if (
          input.value == "" ||
          input.value == app.chartManager.sm!.properties.MUSIC
        ) {
          chart.music = undefined
          input.value = ""
          app.chartManager.loadAudio()
          if (playing) app.chartManager.songAudio.play()
          return
        }
        chart.music = input.value
        app.chartManager.loadAudio()
        if (playing) app.chartManager.songAudio.play()
      }
      const input = document.createElement("input")
      input.type = "text"
      input.autocomplete = "off"
      input.spellcheck = false
      input.onkeydown = ev => {
        if (ev.key == "Enter") input.blur()
      }
      input.onblur = handleInput
      input.value = chart.music ?? ""
      input.placeholder = app.chartManager.sm!.properties.MUSIC ?? ""

      const dirButton = document.createElement("button")
      dirButton.style.height = "100%"
      dirButton.onclick = () => {
        const dir = app.chartManager.sm_path.split("/").slice(0, -1).join("/")
        app.windowManager.openWindow(
          new DirectoryWindow(
            app,
            {
              title: "Select an audio file...",
              accepted_file_types: AUDIO_EXT,
              disableClose: true,
              callback: (path: string) => {
                input.value = FileSystem.relPath(dir, path)
                handleInput()
              },
            },
            dir +
              "/" +
              (chart.music ?? app.chartManager.sm!.properties.MUSIC ?? "")
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
  },
}
