import { App } from "../App"
import { Simfile } from "../chart/sm/Simfile"
import { SimfileProperty } from "../chart/sm/SimfileTypes"
import { Icons } from "../gui/Icons"
import { NumberSpinner } from "../gui/element/NumberSpinner"
import { DirectoryWindow } from "../gui/window/DirectoryWindow"
import { ActionHistory } from "../util/ActionHistory"
import { dirname } from "../util/Path"
import { FileHandler } from "../util/file-handler/FileHandler"
import { AUDIO_EXT, IMG_EXT } from "./FileData"

type SMPropertyGroupData = {
  title: string
  items: SMPropertyData[]
}
// we have an extra history since we don't want new song prompt to interfere with the current one
type SMPropertyCustomInput = {
  type: "custom"
  create: (app: App, sm: Simfile, history: ActionHistory) => HTMLElement
}
type SMPropertyStringInput = {
  type: "string"
}
type SMPropertyFileInput = {
  type: "file"
  typeName: string
  accept: string[]
  onChange?: (app: App) => void
}
type SMPropertyNumberInput = {
  type: "number"
  step?: number
  precision?: number
  min?: number
  max?: number
}

type SMPropertyInput =
  | SMPropertyStringInput
  | SMPropertyFileInput
  | SMPropertyNumberInput
  | SMPropertyCustomInput

type SMPropertyData = {
  title: string
  propName: SimfileProperty
  input: SMPropertyInput
}

export const SM_PROPERTIES_DATA: SMPropertyGroupData[] = [
  {
    title: "Metadata",
    items: [
      {
        title: "Title",
        propName: "TITLE",
        input: {
          type: "string",
        },
      },
      {
        title: "Subtitle",
        propName: "SUBTITLE",
        input: {
          type: "string",
        },
      },
      {
        title: "Artist",
        propName: "ARTIST",
        input: {
          type: "string",
        },
      },
      {
        title: "Credit",
        propName: "CREDIT",
        input: {
          type: "string",
        },
      },
      {
        title: "Genre",
        propName: "GENRE",
        input: {
          type: "string",
        },
      },
      {
        title: "Origin",
        propName: "ORIGIN",
        input: {
          type: "string",
        },
      },
    ],
  },
  {
    title: "Resources",
    items: [
      {
        title: "Audio Track",
        propName: "MUSIC",
        input: {
          type: "file",
          typeName: "audio",
          accept: AUDIO_EXT,
          onChange: app => app.chartManager.loadAudio(),
        },
      },
      {
        title: "Background Image",
        propName: "BACKGROUND",
        input: { type: "file", typeName: "image", accept: IMG_EXT },
      },
      {
        title: "Banner Image",
        propName: "BANNER",
        input: { type: "file", typeName: "image", accept: IMG_EXT },
      },
      {
        title: "CD Title",
        propName: "CDTITLE",
        input: { type: "file", typeName: "image", accept: IMG_EXT },
      },
      {
        title: "CD Image",
        propName: "CDIMAGE",
        input: { type: "file", typeName: "image", accept: IMG_EXT },
      },
      {
        title: "Jacket",
        propName: "JACKET",
        input: { type: "file", typeName: "image", accept: IMG_EXT },
      },
      {
        title: "Disc Image",
        propName: "DISCIMAGE",
        input: { type: "file", typeName: "image", accept: IMG_EXT },
      },
    ],
  },
  {
    title: "Song",
    items: [
      {
        title: "Song Preview",
        propName: "SAMPLESTART",
        input: {
          type: "custom",
          create: (_, sm, history) => {
            const updateValues = () => {
              if (toSpinner.value < fromSpinner.value) {
                toSpinner.value = fromSpinner.value
              }
              const lastStart = sm.properties.SAMPLESTART ?? "0"
              const lastLength = sm.properties.SAMPLELENGTH ?? "10"
              const newStart = fromSpinner.value.toString()
              const newLength = (toSpinner.value - fromSpinner.value).toString()
              history.run({
                action: () => {
                  sm.properties.SAMPLESTART = newStart
                  sm.properties.SAMPLELENGTH = newLength
                  fromSpinner.value = parseFloat(newStart)
                  toSpinner.value = parseFloat(newStart) + parseFloat(newLength)
                },
                undo: () => {
                  sm.properties.SAMPLESTART = lastStart
                  sm.properties.SAMPLELENGTH = lastLength
                  fromSpinner.value = parseFloat(lastStart)
                  toSpinner.value =
                    parseFloat(lastStart) + parseFloat(lastLength)
                },
              })
            }
            const fromSpinner = NumberSpinner.create({
              value: parseFloat(sm.properties.SAMPLESTART ?? "0"),
              precision: 3,
              min: 0,
            })
            fromSpinner.onchange = value => {
              if (value === undefined) {
                fromSpinner.value = parseFloat(sm.properties.SAMPLESTART ?? "0")
                return
              }
              updateValues()
            }
            const toSpinner = NumberSpinner.create({
              value:
                parseFloat(sm.properties.SAMPLESTART ?? "0") +
                parseFloat(sm.properties.SAMPLELENGTH ?? "10"),
              precision: 3,
              min: 0,
            })
            toSpinner.onchange = value => {
              if (value === undefined) {
                toSpinner.value =
                  parseFloat(sm.properties.SAMPLESTART ?? "0") +
                  parseFloat(sm.properties.SAMPLELENGTH ?? "10")
                return
              }
              updateValues()
            }

            const container = document.createElement("div")
            const to = document.createElement("div")
            to.innerText = "to"
            container.classList.add("flex-row", "flex-column-gap")
            container.replaceChildren(fromSpinner.view, to, toSpinner.view)
            return container
          },
        },
      },
    ],
  },
]

export function createInputElement(
  app: App,
  sm: Simfile,
  history: ActionHistory,
  data: SMPropertyData
) {
  switch (data.input.type) {
    case "custom":
      return data.input.create(app, sm, history)
    case "string": {
      const input = document.createElement("input")
      input.type = "text"
      input.autocomplete = "off"
      input.spellcheck = false
      input.onkeydown = ev => {
        if (ev.key == "Enter") input.blur()
      }
      input.onblur = () => {
        const lastValue = sm.properties[data.propName]
        const newValue = input.value
        history.run({
          action: () => {
            sm.properties[data.propName] = newValue
            input.value = newValue
          },
          undo: () => {
            sm.properties[data.propName] = lastValue
            input.value = lastValue ?? ""
          },
        })
      }
      input.value = sm.properties[data.propName] ?? ""
      return input
    }
    case "number": {
      const inputData = data.input
      const spinner = NumberSpinner.create({
        value: parseFloat(sm.properties[data.propName] ?? "15"),
        ...inputData,
      })
      spinner.onchange = value => {
        if (value === undefined) {
          spinner.value = parseFloat(sm.properties[data.propName] ?? "0")
          return
        }
        const lastValue = sm.properties[data.propName]
        const newValue = value.toString()
        history.run({
          action: () => {
            sm.properties[data.propName] = newValue
            spinner.value = parseFloat(newValue)
          },
          undo: () => {
            sm.properties[data.propName] = lastValue
            spinner.value = parseFloat(lastValue ?? "0")
          },
        })
      }
      return spinner.view
    }
    case "file": {
      const inputData = data.input
      const callback = data.input.onChange
      const container = document.createElement("div")
      container.classList.add("flex-row", "flex-column-gap")
      const input = document.createElement("input")
      input.type = "text"
      input.autocomplete = "off"
      input.spellcheck = false
      input.placeholder = "click to select a file"
      input.onclick = ev => {
        ev.preventDefault()
        input.blur()
        const dir = dirname(app.chartManager.smPath)
        if (window.nw) {
          const fileSelector = document.createElement("input")
          fileSelector.type = "file"
          fileSelector.accept = inputData.accept.join(",")
          fileSelector.nwworkingdir = dir
          fileSelector.onchange = () => {
            const newValue = FileHandler.getRelativePath(
              dir,
              fileSelector.value
            )
            setValue(newValue)
          }
          fileSelector.click()
        } else {
          app.windowManager.openWindow(
            new DirectoryWindow(
              app,
              {
                title: `Select a${
                  inputData.typeName.match(/^[aieouAIEOU].*/) ? "n" : ""
                } ${inputData.typeName} file...`,
                accepted_file_types: inputData.accept,
                disableClose: true,
                callback: (path: string) => {
                  const newValue = FileHandler.getRelativePath(dir, path)
                  setValue(newValue)
                },
              },
              sm.properties[data.propName]
                ? dir + "/" + sm.properties[data.propName]
                : app.chartManager.smPath
            )
          )
        }
      }
      input.value = sm.properties[data.propName] ?? ""
      container.appendChild(input)
      const deleteButton = document.createElement("button")
      deleteButton.style.height = "100%"
      deleteButton.classList.add("delete")
      deleteButton.disabled = !sm.properties[data.propName]
      deleteButton.onclick = () => {
        setValue(undefined)
        deleteButton.disabled = true
      }
      const icon = Icons.getIcon("TRASH", 12)
      deleteButton.appendChild(icon)
      container.appendChild(deleteButton)

      const setValue = (value: string | undefined) => {
        const lastValue = sm.properties[data.propName] ?? ""
        history.run({
          action: () => {
            sm.properties[data.propName] = value
            input.value = value ?? ""
            deleteButton.disabled = input.value == ""
          },
          undo: () => {
            sm.properties[data.propName] = lastValue
            input.value = lastValue
            deleteButton.disabled = input.value == ""
          },
        })
        callback?.(app)
      }
      return container
    }
  }
}
