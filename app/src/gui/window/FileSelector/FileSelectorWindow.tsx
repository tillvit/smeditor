import {
  createContext,
  Dispatch,
  SetStateAction,
  useContext,
  useEffect,
  useState,
} from "react"
import { FileHandler } from "../../../util/file-handler/FileHandler"
import { WebFileHandler } from "../../../util/file-handler/WebFileHandler"
import { extname } from "../../../util/Path"
import { WindowContext, WindowData } from "../WindowManager"
import { DirectoryObject } from "./DirectoryObject"
import { FileObject } from "./FileObject"
import { FileOptions } from "./FileOptions"

interface FileSelectorOptions {
  title: string
  accepted_file_types?: string[]
  callback?: (path: string) => void
  disableClose?: boolean
  selectedPath?: string
  autoSearchPath?: string
}

export interface FileSelectorFile {
  type: "file"
  name: string
  fullPath: string
  parent: FileSelectorDirectory | null
}
export interface FileSelectorDirectory {
  type: "directory"
  name: string
  fullPath: string
  children: FileSelectorNode[] | null
  parent: FileSelectorDirectory | null
}
export type FileSelectorNode = FileSelectorFile | FileSelectorDirectory

type FileSelectorData = {
  editingPath: string | null
  setEditingPath: Dispatch<SetStateAction<string | null>>
  selectedItem: { path: string; type: "file" | "directory" } | null
  setSelectedItem: Dispatch<
    SetStateAction<{ path: string; type: "file" | "directory" } | null>
  >
  draggingPath: string | null
  setDraggingPath: Dispatch<SetStateAction<string | null>>
  fileDropPath: string | null
  setFileDropPath: Dispatch<SetStateAction<string | null>>
  setBusy: Dispatch<SetStateAction<boolean>>
  isFileValid: (path: string) => boolean
  selectAcceptableFile: (path: string) => void
  confirmFile: (path: string) => void
  loadDirectory: (path: string) => Promise<void>
  unloadDirectory: (path: string) => Promise<void>
}

export const FileSelectorContext = createContext<FileSelectorData | undefined>(
  undefined
)

export function FileSelectorWindowContent(props: FileSelectorOptions) {
  const windowData = useContext(WindowContext)
  const [editingPath, setEditingPath] = useState<string | null>(null)
  const [draggingPath, setDraggingPath] = useState<string | null>(null)
  const [selectedItem, setSelectedItem] = useState<{
    path: string
    type: "file" | "directory"
  } | null>(null)
  const [fileTree, setFileTree] = useState<FileSelectorDirectory>({
    type: "directory",
    name: "",
    fullPath: "",
    children: [],
    parent: null,
  })
  const [fileDropPath, setFileDropPath] = useState<string | null>(null)
  const [busy, setBusy] = useState(false)

  function isFileValid(path: string) {
    return (
      !props.accepted_file_types ||
      props.accepted_file_types.includes(extname(path))
    )
  }

  function getTreeNodeFromPath(path: string) {
    if (path == "") return fileTree
    const parts = path.split("/")
    let curNode = fileTree
    for (const part of parts) {
      const node = curNode.children?.find(node => node.name === part)
      if (!node) return null
      if (node.type === "file") return node
      curNode = node
    }
    return curNode
  }

  async function expandNode(node: FileSelectorDirectory) {
    const path = node.fullPath
    const folders = await FileHandler.getDirectoryFolders(path)
    let files = await FileHandler.getDirectoryFiles(path)
    folders.sort((a, b) =>
      a.name.toLowerCase().localeCompare(b.name.toLowerCase())
    )
    files.sort((a, b) =>
      a.name.toLowerCase().localeCompare(b.name.toLowerCase())
    )
    files = files.filter(file => extname(file.name) != ".crswap")
    const oldChildren = node.children ?? []
    node.children = [
      ...(folders.map(f => ({
        type: "directory",
        name: f.name,
        fullPath: path == "" ? f.name : path + "/" + f.name,
        children: null,
        parent: node,
      })) as FileSelectorDirectory[]),
      ...(files.map(f => ({
        type: "file",
        name: f.name,
        fullPath: path == "" ? f.name : path + "/" + f.name,
        parent: node,
      })) as FileSelectorFile[]),
    ]
    for (const child of oldChildren) {
      if (child.type === "directory" && child.children != null) {
        const newNode = node.children.find(
          n => n.name === child.name && n.type === "directory"
        )
        if (!newNode) continue
        ;(newNode as FileSelectorDirectory).children = child.children
        child.children.forEach(
          c => (c.parent = newNode as FileSelectorDirectory)
        )
      }
    }
  }

  async function loadDirectory(path: string) {
    const node = getTreeNodeFromPath(path)
    if (node?.type !== "directory") return
    await expandNode(node)
    setFileTree(structuredClone(fileTree))
  }

  async function loadDirectoryRecursive(path: string) {
    const pathParts = path.split("/")
    let node = fileTree
    let currentPath = ""
    for (const part of pathParts) {
      currentPath = currentPath == "" ? part : currentPath + "/" + part
      await expandNode(node)
      node = node.children!.find(
        n => n.name === part && n.type === "directory"
      )! as FileSelectorDirectory
      if (!node) break
    }
    setFileTree(structuredClone(fileTree))
  }

  async function unloadDirectory(path: string) {
    const node = getTreeNodeFromPath(path)
    if (node?.type !== "directory") return
    node.children = null
    setFileTree(structuredClone(fileTree))
  }

  function isSelectedValid() {
    return (
      selectedItem?.type == "file" &&
      props.accepted_file_types?.includes(extname(selectedItem.path))
    )
  }

  function flattenTree() {
    const result: FileSelectorNode[] = []
    function traverse(node: FileSelectorNode) {
      result.push(node)
      if (node.type === "directory") {
        for (const child of node.children ?? []) {
          traverse(child)
        }
      }
    }
    traverse(fileTree)
    return result
  }

  function handleKeyEvent(event: KeyboardEvent) {
    if (!windowData?.isFocused || editingPath) return
    if (event.code.startsWith("Arrow") || event.code == "Enter") {
      event.preventDefault()
      event.stopImmediatePropagation()
      if (document.activeElement instanceof HTMLElement) {
        document.activeElement.blur()
      }
    }

    if (selectedItem == null && event.code.startsWith("Arrow")) {
      const firstNode = fileTree.children![0]
      if (!firstNode) return
      setSelectedItem({ path: firstNode.fullPath, type: firstNode.type })
      return
    }
    if (!selectedItem) return
    const currentNode = getTreeNodeFromPath(selectedItem.path)
    if (currentNode?.parent == null) return

    const flattenedTree = flattenTree().slice(1) // Remove root
    const childIndex = flattenedTree.indexOf(currentNode)
    if (childIndex < 0) return

    switch (event.code) {
      case "ArrowUp": {
        const prev = flattenedTree[childIndex - 1]
        if (prev) {
          setSelectedItem({ path: prev.fullPath, type: prev.type })
        }
        break
      }
      case "ArrowDown": {
        const next = flattenedTree[childIndex + 1]
        if (next) {
          setSelectedItem({ path: next.fullPath, type: next.type })
        }
        break
      }
      case "ArrowLeft": {
        if (currentNode.type === "directory") {
          currentNode.children = null
          setFileTree(structuredClone(fileTree))
        }
        break
      }
      case "ArrowRight": {
        if (currentNode.type === "directory" && currentNode.children == null) {
          loadDirectory(currentNode.fullPath)
        }
        break
      }
      case "Enter": {
        setEditingPath(selectedItem?.path)
      }
    }
  }

  function handleDropEvent(event: DragEvent) {
    event.preventDefault()
    event.stopImmediatePropagation()
    setFileDropPath(null)
    setBusy(true)
    ;(FileHandler.getStandardHandler() as WebFileHandler)
      .handleDropEvent(event, fileDropPath ?? "")
      .then(async items => {
        if (!items || items.length == 0) return
        items = items.sort((a, b) =>
          a.path.toLowerCase().localeCompare(b.path.toLowerCase())
        )
        const firstFolder = items.find(item => item.type === "directory")
        let checkPath = fileDropPath ?? ""
        if (firstFolder) checkPath = firstFolder.path

        await loadDirectory(checkPath)
        selectAcceptableFile(checkPath)
      })
      .then(() => {
        setBusy(false)
      })
  }

  async function getAcceptableFile(path: string): Promise<string | undefined> {
    const baseDirHandle = await FileHandler.getDirectoryHandle(path)
    if (!baseDirHandle) return
    const queue = [{ path, handle: baseDirHandle }]
    while (queue.length > 0) {
      const directory = queue.shift()!
      const handle = directory.handle
      for await (const entry of handle.values()) {
        const prepend = directory.path == "" ? "" : directory.path + "/"
        if (entry.kind == "directory") {
          queue.push({ path: prepend + entry.name, handle: entry })
        } else if (isFileValid(entry.name)) {
          return prepend + entry.name
        }
      }
    }
    return undefined
  }

  function selectAcceptableFile(path: string) {
    getAcceptableFile(path ?? "").then(filePath => {
      if (!filePath) {
        setSelectedItem(null)
        return
      }
      loadDirectoryRecursive(filePath).then(() =>
        setSelectedItem({ path: filePath, type: "file" })
      )
    })
  }

  useEffect(() => {
    loadDirectory("")
  }, [])

  useEffect(() => {
    if (!props.selectedPath || props.selectedPath == "") return
    loadDirectoryRecursive(props.selectedPath)
    setSelectedItem({ path: props.selectedPath, type: "file" })
  }, [props.selectedPath])

  useEffect(() => {
    if (!props.autoSearchPath) return
    selectAcceptableFile(props.autoSearchPath)
  }, [props.autoSearchPath])

  useEffect(() => {
    window.addEventListener("keydown", handleKeyEvent)
    window.addEventListener("drop", handleDropEvent)
    return () => {
      window.removeEventListener("keydown", handleKeyEvent)
      window.removeEventListener("drop", handleDropEvent)
    }
  }, [
    windowData?.isFocused,
    selectedItem,
    fileTree,
    fileDropPath,
    props.accepted_file_types,
    editingPath,
  ])

  return (
    <FileSelectorContext.Provider
      value={{
        editingPath,
        setEditingPath,
        selectedItem,
        setSelectedItem,
        draggingPath,
        setDraggingPath,
        fileDropPath,
        setFileDropPath,
        setBusy,
        isFileValid,
        selectAcceptableFile,
        confirmFile: (path: string) => {
          props.callback?.(path)
          windowData?.close()
        },
        loadDirectory,
        unloadDirectory,
      }}
    >
      <div
        className="flex-column-full"
        onDragOverCapture={() => setFileDropPath("")}
        onMouseOverCapture={() => {
          if (draggingPath) {
            setFileDropPath("")
          }
        }}
      >
        <div
          className={`dir-selector ${fileDropPath === "" ? "outlined" : ""}`}
          onClick={e => {
            if (e.target !== e.currentTarget) return
            setSelectedItem(null)
          }}
        >
          {fileTree.children?.map(folder => {
            if (folder.type == "directory") {
              return <DirectoryObject key={folder.name} node={folder} />
            } else {
              return <FileObject key={folder.name} node={folder} />
            }
          })}
          {busy && <div className="dir-loading-overlay">Loading...</div>}
        </div>

        <FileOptions />
        <div className="menu-options">
          <div className="menu-left">
            <button onClick={() => windowData?.close()}>Cancel</button>
          </div>
          <div className="menu-right">
            <button
              className="confirm"
              disabled={!isSelectedValid()}
              onClick={() => {
                if (!selectedItem) return
                props.callback?.(selectedItem.path)
                windowData?.close()
              }}
            >
              Select
            </button>
          </div>
        </div>
      </div>
    </FileSelectorContext.Provider>
  )
}

export function FileSelectorWindow(options: FileSelectorOptions): WindowData {
  options
  return {
    title: options.title,
    width: 500,
    height: 400,
    disableClose: options.disableClose,
    id: "file_selector",
    blocking: true,
    content: <FileSelectorWindowContent {...options} />,
  }
}
