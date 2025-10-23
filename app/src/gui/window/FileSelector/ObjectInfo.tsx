import { ReactNode, useContext, useEffect, useRef, useState } from "react"
import scrollIntoView from "scroll-into-view-if-needed"
import { AUDIO_EXT, IMG_EXT } from "../../../data/FileData"
import { FileHandler } from "../../../util/file-handler/FileHandler"
import { WebFileHandler } from "../../../util/file-handler/WebFileHandler"
import { basename, dirname, extname } from "../../../util/Path"
import { ReactIcon } from "../../Icons"
import { FileSelectorContext, FileSelectorNode } from "./FileSelectorWindow"

interface ObjectInfoOptions {
  node: FileSelectorNode
  children?: ReactNode
  className?: string
  onClick?: () => void
  onDblClick?: () => void
}

export function ObjectInfo(props: ObjectInfoOptions) {
  const pickerData = useContext(FileSelectorContext)
  const titleRef = useRef<HTMLTextAreaElement>(null)
  const viewRef = useRef<HTMLDivElement>(null)
  const dragOffset = useRef<{ x: number; y: number } | null>(null)
  const dragElement = useRef<HTMLDivElement>(null)
  const [dragging, setDragging] = useState(false)
  const isEditing = pickerData?.editingPath == props.node.fullPath
  const isSelected = pickerData?.selectedItem?.path == props.node.fullPath

  function getIconId() {
    if (props.node.type == "directory") return "CHEVRON"
    const ext = extname(props.node.fullPath)
    if (IMG_EXT.includes(ext)) {
      return "IMAGE_FILE"
    }
    if (AUDIO_EXT.includes(ext)) {
      return "VOLUME"
    }
    if ([".sm", ".ssc"].includes(ext)) {
      return "SM_FILE"
    }

    return "UNKNOWN_FILE"
  }

  function isValid() {
    if (props.node.type == "directory") return true
    return pickerData!.isFileValid(props.node.fullPath)
  }

  function handleRename() {
    if (!titleRef.current) return
    const baseDir = dirname(props.node.fullPath)
    let newName = titleRef.current.value
    if (
      newName.startsWith(".") ||
      newName == props.node.name ||
      newName == ""
    ) {
      titleRef.current.value = props.node.name
      pickerData?.setEditingPath(null)
      window.getSelection()?.removeAllRanges()
      return
    }
    newName = newName.replaceAll("/", "")
    const newPath = baseDir == "" ? newName : baseDir + "/" + newName
    ;(FileHandler.getStandardHandler() as WebFileHandler)
      [
        props.node.type == "directory" ? "renameDirectory" : "renameFile"
      ](props.node.fullPath, newPath)
      .then(() => {
        pickerData?.setEditingPath(null)
        pickerData?.loadDirectory(baseDir)
      })
    window.getSelection()?.removeAllRanges()
  }

  function handleMouseEvent() {
    if (props.node.type != "directory") return
    pickerData!.setFileDropPath(props.node.fullPath)
  }

  async function stopDragging() {
    setDragging(false)
    if (!dragElement.current) return
    dragElement.current.remove()
    pickerData?.setDraggingPath(null)
    if (!pickerData?.fileDropPath) {
      return
    }
    const isFolder = props.node.type === "directory"
    const path = props.node.fullPath
    const targetPath =
      pickerData?.fileDropPath == ""
        ? basename(path)
        : pickerData?.fileDropPath + "/" + basename(path)
    if (path != targetPath)
      await (FileHandler.getStandardHandler() as WebFileHandler)[
        isFolder ? "renameDirectory" : "renameFile"
      ](path, targetPath)

    await pickerData.loadDirectory(dirname(path))
    await pickerData.loadDirectory(dirname(targetPath))
    pickerData.setFileDropPath(null)
  }

  function startDragging() {
    dragOffset.current = { x: 0, y: 0 }
    setDragging(true)
  }

  function onDrag(e: MouseEvent) {
    if (!dragOffset.current) return
    dragOffset.current.x += e.movementX
    dragOffset.current.y += e.movementY
    if (!dragElement.current) {
      if (Math.abs(dragOffset.current.x) + Math.abs(dragOffset.current.y) > 8) {
        pickerData!.setDraggingPath(props.node.fullPath)
        dragElement.current = viewRef.current!.cloneNode(true) as HTMLDivElement
        dragElement.current.style.position = "fixed"
        const bounds = viewRef.current!.getBoundingClientRect()
        dragElement.current.style.top = bounds.top + dragOffset.current.y + "px"
        dragElement.current.style.left =
          bounds.left + dragOffset.current.x + "px"
        dragElement.current.style.width = bounds.width + "px"
        dragElement.current.style.boxShadow = "3px 3px 3px #222"
        dragElement.current.style.pointerEvents = "none"
        if (dragElement.current.querySelector(".children"))
          dragElement.current.removeChild(
            dragElement.current.querySelector(".children")!
          )
        const windowView = viewRef.current!.closest(".window")!
        windowView.appendChild(dragElement.current)
      } else {
        return
      }
    }

    dragElement.current.style.top =
      parseFloat(dragElement.current.style.top.slice(0, -2)) +
      e.movementY +
      "px"
    dragElement.current.style.left =
      parseFloat(dragElement.current.style.left.slice(0, -2)) +
      e.movementX +
      "px"
  }

  useEffect(() => {
    if (dragging) {
      const endDragHandler = () => {
        stopDragging()
        window.removeEventListener("mouseup", endDragHandler)
        window.removeEventListener("mousemove", onDrag)
      }
      window.addEventListener("mouseup", endDragHandler)
      window.addEventListener("mousemove", onDrag)
      return () => {
        window.removeEventListener("mouseup", endDragHandler)
        window.removeEventListener("mousemove", onDrag)
      }
    }
  }, [dragging, pickerData!.fileDropPath])

  useEffect(() => {
    if (isEditing) {
      titleRef.current?.focus()
      titleRef.current?.select()
    }
  }, [isEditing])

  useEffect(() => {
    if (isSelected && titleRef.current) {
      scrollIntoView(titleRef.current, {
        scrollMode: "if-needed",
        block: "nearest",
        inline: "nearest",
      })
    }
  }, [pickerData?.selectedItem?.path])

  return (
    <div
      className={`item ${props.className ?? ""} ${props.node.type == "directory" ? "folder" : ""} ${pickerData!.fileDropPath == props.node.fullPath ? "outlined" : ""}`}
      onDragOverCapture={handleMouseEvent}
      onMouseOverCapture={() => {
        if (pickerData!.draggingPath) {
          handleMouseEvent()
        }
      }}
      ref={viewRef}
    >
      <span
        className={
          "info" +
          (isSelected ? " selected" : "") +
          (isValid() ? "" : " disabled")
        }
        onMouseDown={startDragging}
        onClick={props.onClick}
        onDoubleClick={() => {
          if (!isValid()) return
          props.onDblClick?.()
        }}
        style={{ cursor: "pointer" }}
      >
        <ReactIcon id={getIconId()} width={16} />
        <textarea
          ref={titleRef}
          className="title unselectable"
          rows={1}
          disabled={!isEditing}
          autoComplete="off"
          autoCapitalize="off"
          spellCheck={false}
          style={{ pointerEvents: isEditing ? undefined : "none" }}
          defaultValue={props.node.name}
          onKeyDown={e => {
            if (e.key == "Enter" || e.key == "Escape") {
              e.preventDefault()
              e.stopPropagation()
              if (e.key == "Escape") {
                titleRef.current!.value = props.node.name
              }
              titleRef.current?.blur()
            }
          }}
          onBlur={handleRename}
        />
      </span>
      {props.children}
    </div>
  )
}
