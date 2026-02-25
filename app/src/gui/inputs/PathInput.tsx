import { FocusEvent } from "react"
import { FileHandler } from "../../util/file-handler/FileHandler"
import { ReactIcon } from "../Icons"
import { FileSelectorWindow } from "../window/FileSelector/FileSelectorWindow"
import { WindowManager } from "../window/WindowManager"

export interface PathInputOptions {
  typeName: string
  accept: string[]
  style?: React.CSSProperties
  className?: string
  placeholder?: string
  baseDir?: string
  disabled?: boolean
}

export interface PathInputProps extends PathInputOptions {
  value: string
  autoSelect?: string
  onChange?: (value: string | undefined) => void
}

export function PathInput(props: PathInputProps) {
  function selectFile(event: FocusEvent<HTMLInputElement>) {
    event.preventDefault()
    event.currentTarget.blur()
    const dir = props.baseDir ?? ""
    if (window.nw) {
      const fileSelector = document.createElement("input")
      fileSelector.type = "file"
      fileSelector.accept = props.accept.join(",")
      fileSelector.nwworkingdir = dir
      fileSelector.onchange = () => {
        const newValue = FileHandler.getRelativePath(dir, fileSelector.value)
        props.onChange?.(newValue)
      }
      fileSelector.click()
    } else {
      WindowManager.openWindow(
        FileSelectorWindow({
          title: `Select a${
            props.typeName.match(/^[aieouAIEOU].*/) ? "n" : ""
          } ${props.typeName} file...`,
          accepted_file_types: props.accept,
          selectedPath: props.autoSelect ?? props.baseDir,
          disableClose: true,
          callback: (path: string) => {
            const newValue = FileHandler.getRelativePath(dir, path)
            props.onChange?.(newValue)
          },
        })
      )
    }
  }
  return (
    <div
      className={`flex-row flex-column-gap ${props.className ?? ""}`}
      style={props.style}
    >
      <input
        type="text"
        placeholder={props.placeholder ?? "click to select a file"}
        value={props.value}
        style={{ flex: 1 }}
        onFocus={selectFile}
        disabled={props.disabled}
        onKeyDown={e => {
          if (e.key == "Enter") e.currentTarget.blur()
        }}
      />
      <button
        className="delete"
        disabled={props.value == "" || props.disabled}
        onClick={() => props.onChange?.(undefined)}
      >
        <ReactIcon id="TRASH" width={12} />
      </button>
    </div>
  )
}
