import { useContext, useEffect, useMemo, useState } from "react"
import tippy from "tippy.js"
import { isHoldNote } from "../../../chart/sm/NoteTypes"
import { WindowContext, WindowData } from "../WindowManager"

const OPTION_NAMES: Record<string, { label: string; tooltip?: string }> = {
  columnOneBased: {
    label: "1-indexed column numbers",
    tooltip: "Start counting column numbers from 0 instead of 1.",
  },
  lengthAsNumberIndex: {
    label: "Store length in integer keys",
    tooltip:
      'Store the length of holds as the last item in each table, instead of using the "length" key.',
  },
  padNumbers: {
    label: "Pad numbers",
    tooltip: "Pad decimals with trailing zeros.",
  },
  minify: { label: "Minify", tooltip: "Remove all newlines and spaces." },
  notitgNoteTypes: {
    label: "Use NotITG Note Types",
    tooltip: 'Use NotITG note types. (Tap = 1, Hold = 2, Mine = "M")',
  },
}

const NOTITG_TYPES: Record<string, string> = {
  Tap: "1",
  Hold: "2",
  Roll: "4",
  Mine: '"M"',
  Lift: '"L"',
  Fake: '"F"',
}

function ExportNotedataWindowContent() {
  const windowData = useContext(WindowContext)!
  const [data, setData] = useState<string>("")
  const [exportOptions, setExportOptions] = useState({
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
      notitgNoteTypes: false,
    },
  })
  const selection = useMemo(
    () =>
      windowData.app.chartManager.selection.notes.length == 0
        ? windowData.app.chartManager.loadedChart!.getNotedata()
        : windowData.app.chartManager.selection.notes,
    []
  )

  function exportData() {
    let exportText =
      "{\n" +
      selection
        .map(note => {
          let str = "\t{"
          if (exportOptions.include.Beat) str += padNum(note.beat) + ","
          if (exportOptions.include.Second) str += padNum(note.second) + ","
          if (exportOptions.include.Column) {
            if (exportOptions.options.columnOneBased) str += note.col + 1 + ","
            else str += note.col + ","
          }
          if (exportOptions.include.Type) {
            if (
              exportOptions.options.notitgNoteTypes &&
              NOTITG_TYPES[note.type] !== undefined
            ) {
              str += NOTITG_TYPES[note.type] + ","
            } else {
              str += '"' + note.type + '",'
            }
          }
          if (exportOptions.include.Quantization) str += note.quant + ","
          if (exportOptions.include.Length && isHoldNote(note)) {
            if (exportOptions.options.lengthAsNumberIndex)
              str += padNum(note.hold) + ","
            else str += "length=" + padNum(note.hold) + ","
          }

          if (str.endsWith(",")) str = str.slice(0, -1)

          str += "}"

          if (getNumIncludes() == 1) {
            str = str.replaceAll("{", "")
            str = str.replaceAll("}", "")
          }

          return str
        })
        .join(",\n") +
      "\n}"
    if (exportOptions.options.minify)
      exportText = exportText.replaceAll(/\s/g, "")
    setData(exportText)
  }

  function getNumIncludes() {
    return Object.values(exportOptions.include)
      .map(option => +option)
      .reduce((a, b) => a + b, 0)
  }

  function padNum(val: number) {
    if (exportOptions.options.padNumbers)
      return (Math.round(val * 1000) / 1000).toFixed(3)
    return Math.round(val * 1000) / 1000
  }

  useEffect(() => {
    exportData()
  }, [exportOptions])

  return (
    <div className="flex-column-full">
      <div className="export-container">
        <div className="export-options">
          <div className="export-section-label">Include</div>
          {Object.keys(exportOptions.include).map(name => (
            <div className="export-option" key={name}>
              <input
                type="checkbox"
                checked={
                  exportOptions.include[
                    name as keyof typeof exportOptions.include
                  ]
                }
                id={"en-i-" + name}
                onChange={e => {
                  const checkbox = e.currentTarget
                  setExportOptions(prev => ({
                    ...prev,
                    include: {
                      ...prev.include,
                      [name]: checkbox.checked,
                    },
                  }))
                }}
              />
              <label className="export-label" htmlFor={"en-i-" + name}>
                {name}
              </label>
            </div>
          ))}
          <div className="export-section-label">Options</div>
          {Object.keys(exportOptions.options).map(name => (
            <div className="export-option" key={name}>
              <input
                type="checkbox"
                checked={
                  exportOptions.options[
                    name as keyof typeof exportOptions.options
                  ]
                }
                id={"en-o-" + name}
                onChange={e => {
                  const checkbox = e.currentTarget
                  setExportOptions(prev => ({
                    ...prev,
                    options: {
                      ...prev.options,
                      [name]: checkbox.checked,
                    },
                  }))
                }}
              />
              <label
                className="export-label"
                htmlFor={"en-o-" + name}
                ref={el => {
                  if (!el) return
                  const tooltip = OPTION_NAMES[name].tooltip
                  if (!tooltip) return
                  tippy(el, { content: tooltip })
                }}
              >
                {OPTION_NAMES[name].label}
              </label>
            </div>
          ))}
        </div>
        <pre
          className="export-output"
          ref={el => {
            if (!el) return
            tippy(el, { content: "Click to copy to clipboard" })
            tippy(el, {
              content: "Copied!",
              trigger: "click",
              onShow(instance) {
                instance.setProps({ trigger: "mouseenter" })
              },
              onHide(instance) {
                instance.setProps({ trigger: "click" })
              },
            })
          }}
          onClick={() => {
            navigator.clipboard.writeText(data)
          }}
        >
          {data}
        </pre>
      </div>
    </div>
  )
}

export function ExportNotedataWindow(): WindowData {
  return {
    title: "Export Notedata",
    width: 600,
    height: 400,
    id: "export_notedata",
    content: <ExportNotedataWindowContent />,
  }
}
