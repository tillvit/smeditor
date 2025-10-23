import { FocusEvent } from "react"
import { ReactIcon } from "../Icons"

export interface FileUploadInputOptions {
  typeName: string
  accept: string[]
  style?: React.CSSProperties
  className?: string
}

export interface FileUploadInputProps extends FileUploadInputOptions {
  value: string
  baseDir?: string
  onChange?: (value: File | undefined) => void
}

export function FileUploadInput(props: FileUploadInputProps) {
  function selectFile(event: FocusEvent<HTMLInputElement>) {
    event.preventDefault()
    event.currentTarget.blur()
    const fileSelector = document.createElement("input")
    fileSelector.type = "file"
    fileSelector.accept = props.accept.join(",")
    fileSelector.onchange = () => {
      const file = fileSelector.files?.[0]
      if (!file) return
      props.onChange?.(file)
    }
    fileSelector.click()
  }
  return (
    <div
      className={`flex-row flex-column-gap ${props.className ?? ""}`}
      style={props.style}
    >
      <input
        type="text"
        placeholder="click to select a file"
        defaultValue={props.value}
        style={{ flex: 1 }}
        onFocus={selectFile}
        onKeyDown={e => {
          if (e.key == "Enter") e.currentTarget.blur()
        }}
      />
      <button
        className="delete"
        disabled={props.value == ""}
        onClick={() => props.onChange?.(undefined)}
      >
        <ReactIcon id="TRASH" width={12} />
      </button>
    </div>
  )
}
