import tippy from "tippy.js"
import { App } from "../../App"
import { Notedata, isHoldNote } from "../../chart/sm/NoteTypes"
import { Window } from "./Window"

interface ExportNotedataOptions {
  include: Record<string, boolean>
  options: Record<string, boolean>
}

const OPTION_NAMES: Record<string, string> = {
  columnOneBased: "1-indexed column numbers",
  lengthAsNumberIndex: "Store length in integer keys",
  padNumbers: "Pad numbers",
  minify: "Minify",
}

export class ExportNotedataWindow extends Window {
  app: App
  private selection
  private outputDiv?: HTMLPreElement
  private exportOptions: ExportNotedataOptions = {
    include: {
      Beat: true,
      Second: false,
      Column: true,
      Type: true,
      Quantization: false,
      Length: true,
    },
    options: {
      columnOneBased: false,
      lengthAsNumberIndex: false,
      padNumbers: false,
      minify: false,
    },
  }

  constructor(app: App, selection: Notedata = []) {
    super({
      title: "Export Notedata",
      width: 600,
      height: 400,
      disableClose: false,
      win_id: "export_notedata",
      blocking: false,
    })
    this.app = app
    if (selection.length == 0)
      selection = this.app.chartManager.loadedChart!.getNotedata()
    this.selection = selection

    this.initView()
    this.export()
  }

  initView(): void {
    // Create the window
    this.viewElement.replaceChildren()

    //Padding container
    const padding = document.createElement("div")
    padding.classList.add("padding")

    const container = document.createElement("div")
    container.classList.add("export-container")

    const options = document.createElement("div")
    options.classList.add("export-options")

    const output = document.createElement("pre")
    output.classList.add("export-output")

    tippy(output, {
      content: "Click to copy to clipboard",
    })

    tippy(output, {
      content: "Copied!",
      trigger: "click",
      onShow(instance) {
        instance.setProps({ trigger: "mouseenter" })
      },
      onHide(instance) {
        instance.setProps({ trigger: "click" })
      },
    })

    output.addEventListener("click", () => {
      navigator.clipboard.writeText(output.innerText)
    })

    this.outputDiv = output

    const includeLabel = document.createElement("div")
    includeLabel.classList.add("export-section-label")
    includeLabel.innerText = "Include"

    options.appendChild(includeLabel)

    Object.keys(this.exportOptions.include).forEach(name => {
      const checkbox = document.createElement("input")
      checkbox.type = "checkbox"
      checkbox.checked = this.exportOptions.include[name]
      checkbox.onchange = () => {
        this.exportOptions.include[name] = checkbox.checked
        this.export()
      }
      const optionLabel = document.createElement("div")
      optionLabel.classList.add("export-label")
      optionLabel.innerText = name

      const container = document.createElement("div")
      container.replaceChildren(checkbox, optionLabel)
      container.classList.add("export-option")
      options.appendChild(container)
    })

    const optionLabel = document.createElement("div")
    optionLabel.classList.add("export-section-label")
    optionLabel.innerText = "Options"

    options.appendChild(optionLabel)

    Object.keys(this.exportOptions.options).forEach(name => {
      const checkbox = document.createElement("input")
      checkbox.type = "checkbox"
      checkbox.checked = this.exportOptions.options[name]
      checkbox.onchange = () => {
        this.exportOptions.options[name] = checkbox.checked
        this.export()
      }
      const optionLabel = document.createElement("div")
      optionLabel.classList.add("export-label")
      optionLabel.innerText = OPTION_NAMES[name]

      const container = document.createElement("div")
      container.replaceChildren(checkbox, optionLabel)
      container.classList.add("export-option")
      options.appendChild(container)
    })

    container.replaceChildren(options, output)

    padding.appendChild(container)
    this.viewElement.appendChild(padding)
  }

  private export() {
    let exportText =
      "{\n" +
      this.selection
        .map(note => {
          let str = "\t{"
          if (this.exportOptions.include.Beat)
            str += this.padNum(note.beat) + ","
          if (this.exportOptions.include.Second)
            str += this.padNum(note.second) + ","
          if (this.exportOptions.include.Column) {
            if (this.exportOptions.options.columnOneBased)
              str += note.col + 1 + ","
            else str += note.col + ","
          }
          if (this.exportOptions.include.Type) str += '"' + note.type + '",'
          if (this.exportOptions.include.Quantization) str += note.quant + ","
          if (this.exportOptions.include.Length && isHoldNote(note)) {
            if (this.exportOptions.options.lengthAsNumberIndex)
              str += this.padNum(note.hold) + ","
            else str += "length=" + this.padNum(note.hold) + ","
          }

          if (str.endsWith(",")) str = str.slice(0, -1)

          str += "}"

          return str
        })
        .join(",\n") +
      "\n}"
    if (this.exportOptions.options.minify)
      exportText = exportText.replaceAll(/\s/g, "")
    this.outputDiv!.innerText = exportText
  }

  private padNum(val: number) {
    if (this.exportOptions.options.padNumbers)
      return (Math.round(val * 1000) / 1000).toFixed(3)
    return Math.round(val * 1000) / 1000
  }
}
