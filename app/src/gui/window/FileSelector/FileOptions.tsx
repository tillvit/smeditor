import { showDirectoryPicker, showOpenFilePicker } from "file-system-access"
import { useContext } from "react"
import { FileHandler } from "../../../util/file-handler/FileHandler"
import { WebFileHandler } from "../../../util/file-handler/WebFileHandler"
import { dirname } from "../../../util/Path"
import { ReactIcon } from "../../Icons"
import { FileSelectorContext } from "./FileSelectorWindow"

export function FileOptions() {
  const pickerData = useContext(FileSelectorContext)
  const selectedPath = getSelectedFolder()

  function getSelectedFolder() {
    if (!pickerData?.selectedItem) return ""
    if (pickerData.selectedItem.type === "directory")
      return pickerData.selectedItem.path
    return dirname(pickerData.selectedItem.path)
  }

  const handleUploadFiles = async () => {
    const fileHandlers = await showOpenFilePicker({
      _preferPolyfill: true,
      excludeAcceptAllOption: false,
      multiple: true,
    })
    pickerData!.setBusy(true)

    const promises = []
    for (const handle of fileHandlers) {
      promises.push(
        (FileHandler.getStandardHandler() as WebFileHandler).uploadHandle(
          handle,
          selectedPath
        )
      )
    }

    await Promise.all(promises)

    await pickerData!.loadDirectory(selectedPath)
    pickerData!.selectAcceptableFile(selectedPath)
    pickerData!.setBusy(false)
  }

  const handleUploadFolder = async () => {
    const directoryHandle = await showDirectoryPicker({
      _preferPolyfill: true,
    })

    pickerData!.setBusy(true)

    await (FileHandler.getStandardHandler() as WebFileHandler).uploadHandle(
      directoryHandle,
      selectedPath
    )

    await pickerData!.loadDirectory(selectedPath)
    pickerData!.selectAcceptableFile(
      selectedPath == ""
        ? directoryHandle.name
        : selectedPath + "/" + directoryHandle.name
    )
    pickerData!.setBusy(false)
  }

  const handleRename = () => {
    pickerData!.setEditingPath(pickerData!.selectedItem!.path)
  }

  const handleDelete = () => {
    const isFolder = pickerData!.selectedItem?.type === "directory"
    pickerData!.setBusy(true)
    ;(FileHandler.getStandardHandler() as WebFileHandler)
      [
        isFolder ? "removeDirectory" : "removeFile"
      ](pickerData!.selectedItem!.path)
      .then(() => {
        const path = dirname(pickerData!.selectedItem!.path)
        pickerData!.setSelectedItem(null)
        pickerData!.loadDirectory(path)
        pickerData!.setBusy(false)
      })
  }

  return (
    <div className="file-options">
      <button onClick={handleUploadFiles}>
        <ReactIcon id="ADD_FILE" width={16} /> Upload files
      </button>
      <button onClick={handleUploadFolder}>
        <ReactIcon id="FOLDER" width={16} /> Upload folder
      </button>
      <button
        className="rename"
        onClick={handleRename}
        disabled={pickerData!.selectedItem == null}
      >
        <ReactIcon id="EDIT" width={16} /> Rename
      </button>
      <button
        className="delete"
        onClick={handleDelete}
        disabled={pickerData!.selectedItem == null}
      >
        <ReactIcon id="TRASH" width={16} /> Delete
      </button>
    </div>
  )
}
