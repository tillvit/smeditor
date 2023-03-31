import { showDirectoryPicker, showOpenFilePicker } from "file-system-access"
import scrollIntoView from "scroll-into-view-if-needed"
import { App } from "../../App"
import { AUDIO_EXT, IMG_EXT } from "../../data/FileData"
import { FileHandler } from "../../util/FileHandler"
import { basename, dirname, extname } from "../../util/Util"
import { Icons } from "../Icons"
import { Window } from "./Window"

interface DirectoryWindowOptions {
  title: string
  accepted_file_types?: string[]
  callback?: (path: string) => void
  onload?: () => void
  disableClose?: boolean
}

type DraggableDiv = HTMLDivElement & {
  totalMovementX: number
  totalMovementY: number
}

export class DirectoryWindow extends Window {
  app: App
  dirOptions: DirectoryWindowOptions
  private fileDropPath = ""
  private draggedElement?: DraggableDiv
  private draggedCopy?: HTMLDivElement

  private keyHandler
  private dropHandler
  private mouseHandler
  private dragHandler

  constructor(
    app: App,
    options: DirectoryWindowOptions,
    selectedPath?: string
  ) {
    super({
      title: options.title,
      width: 500,
      height: 400,
      disableClose: options.disableClose,
      win_id: "file_selector" + Math.random(),
      blocking: true,
    })
    this.app = app
    this.dirOptions = options
    options.accepted_file_types ||= []

    this.keyHandler = this.handleKeyEvent.bind(this)
    this.dropHandler = this.handleDropEvent.bind(this)
    this.mouseHandler = this.handleMouseEvent.bind(this)
    this.dragHandler = this.handleDragEvent.bind(this)

    this.initView().then(() => {
      if (selectedPath) this.selectPath(selectedPath)
      options.onload?.()
    })
  }

  async initView() {
    // Create the window
    this.viewElement.replaceChildren()

    //Padding container
    const padding = document.createElement("div")
    padding.classList.add("padding")

    //Menu Button Options
    const menu_options = document.createElement("div")
    menu_options.classList.add("menu-options")

    const menu_options_left = document.createElement("div")
    menu_options_left.classList.add("menu-left")
    const menu_options_right = document.createElement("div")
    menu_options_right.classList.add("menu-right")
    menu_options.appendChild(menu_options_left)
    menu_options.appendChild(menu_options_right)

    const cancel = document.createElement("button")
    cancel.innerText = "Cancel"
    cancel.onclick = () => {
      window.removeEventListener("keydown", this.keyHandler, true)
      window.removeEventListener("drop", this.dropHandler, true)
      this.closeWindow()
    }

    const select_btn = document.createElement("button")
    select_btn.innerText = "Select"
    select_btn.classList.add("confirm")
    select_btn.onclick = () => this.confirmFile()
    select_btn.disabled = true
    menu_options_left.appendChild(cancel)
    menu_options_right.appendChild(select_btn)

    //Create file explorer
    const scroll = document.createElement("div")
    scroll.classList.add("dir-selector")

    scroll.onclick = e => {
      if (e.target != scroll) return
      this.selectElement(undefined)
    }

    const file_options = document.createElement("div")
    file_options.classList.add("file-options")

    const add_file = document.createElement("button")
    const add_file_icon = document.createElement("img")
    add_file_icon.src = Icons.ADD_FILE
    add_file_icon.classList.add("icon")
    add_file.appendChild(add_file_icon)
    add_file.appendChild(document.createTextNode("Upload files"))
    file_options.appendChild(add_file)
    add_file.onclick = async () => {
      const dropPath = this.fileDropPath
      const fileHandlers = await showOpenFilePicker({
        _preferPolyfill: false,
        excludeAcceptAllOption: false,
        multiple: true,
      })

      const selected: HTMLElement | null =
        this.viewElement.querySelector(".info.selected")
      const path = selected?.dataset.path ?? ""

      const promises = []
      for (const handle of fileHandlers) {
        promises.push(FileHandler.uploadHandle(handle, path))
      }

      await Promise.all(promises)

      await this.refreshDirectory(dropPath)
      this.getAcceptableFile(dropPath).then(path => this.selectPath(path))
    }

    const add_dir = document.createElement("button")
    const add_dir_icon = document.createElement("img")
    add_dir_icon.src = Icons.ADD_FOLDER
    add_dir_icon.classList.add("icon")
    add_dir.appendChild(add_dir_icon)
    add_dir.appendChild(document.createTextNode("Upload folder"))
    file_options.appendChild(add_dir)

    add_dir.onclick = async () => {
      const dropPath = this.fileDropPath
      const directoryHandle = await showDirectoryPicker({
        _preferPolyfill: false,
      })

      const selected: HTMLElement | null =
        this.viewElement.querySelector(".info.selected")
      const path = selected?.dataset.path ?? ""

      await FileHandler.uploadHandle(directoryHandle, path)

      await this.refreshDirectory(dropPath)
      this.getAcceptableFile(
        dropPath == ""
          ? directoryHandle.name
          : dropPath + "/" + directoryHandle.name
      ).then(path => this.selectPath(path))
    }

    const rename_file = document.createElement("button")
    rename_file.classList.add("rename")
    const rename_file_icon = document.createElement("img")
    rename_file_icon.src = Icons.EDIT
    rename_file_icon.classList.add("icon")
    rename_file.appendChild(rename_file_icon)
    rename_file.appendChild(document.createTextNode("Rename"))
    rename_file.disabled = true
    rename_file.onclick = () => {
      const selected: HTMLElement | null =
        this.viewElement.querySelector(".info.selected")
      const path = selected?.dataset.path
      if (!path) return
      this.startEditing(selected.querySelector("textarea")!)
    }
    file_options.appendChild(rename_file)

    const delete_file = document.createElement("button")
    delete_file.classList.add("delete")
    const delete_file_icon = document.createElement("img")
    delete_file_icon.src = Icons.TRASH
    delete_file_icon.classList.add("icon")
    delete_file.appendChild(delete_file_icon)
    delete_file.appendChild(document.createTextNode("Delete"))
    delete_file.disabled = true
    delete_file.onclick = () => {
      const selected: HTMLElement | null =
        this.viewElement.querySelector(".info.selected")
      const path = selected?.dataset.path
      if (!path) return
      const isFolder = selected.parentElement!.classList.contains("folder")
      FileHandler[isFolder ? "removeDirectory" : "removeFile"](path).then(
        () => {
          const el = this.getElement(path)
          if (!el) return
          el.parentElement?.remove()
          delete_file.disabled = true
          rename_file.disabled = true
        }
      )
    }
    file_options.appendChild(delete_file)

    padding.appendChild(scroll)
    padding.appendChild(file_options)
    padding.appendChild(menu_options)
    this.viewElement.appendChild(padding)

    //Drag & drop
    window.addEventListener("keydown", this.keyHandler, true)
    window.addEventListener("drop", this.dropHandler, true)
    window.addEventListener("mousemove", this.dragHandler, true)

    this.viewElement.addEventListener("dragover", this.mouseHandler)

    await this.createDiv("").then(elements =>
      scroll.replaceChildren(...elements)
    )
  }

  private async expand(element: HTMLElement) {
    if (!element.parentElement!.classList.contains("folder")) return
    element.parentElement!.classList.remove("collapsed")
    const children = element.nextSibling as HTMLDivElement
    await this.createDiv(element.dataset.path!).then(elements => {
      children.replaceChildren(...elements)
    })
  }

  private collapse(element: HTMLElement) {
    if (!element.parentElement!.classList.contains("folder")) return
    element.parentElement!.classList.add("collapsed")
    const children = element.nextSibling as HTMLDivElement
    children.replaceChildren()
  }

  private selectElement(element: HTMLElement | undefined) {
    this.viewElement
      .querySelector(".info.selected")
      ?.classList.remove("selected")
    if (!element) {
      this.viewElement.querySelector<HTMLButtonElement>(".delete")!.disabled =
        true
      this.viewElement.querySelector<HTMLButtonElement>(".rename")!.disabled =
        true
      return
    }
    element.classList.add("selected")
    scrollIntoView(element, {
      scrollMode: "if-needed",
      block: "nearest",
      inline: "nearest",
    })
    const button: HTMLButtonElement =
      this.viewElement.querySelector("button.confirm")!
    const path = element.dataset.path
    button.disabled = true
    if (!path) return
    button.disabled = !this.acceptableFileType(path)
    this.viewElement.querySelector<HTMLButtonElement>(".delete")!.disabled =
      false
    this.viewElement.querySelector<HTMLButtonElement>(".rename")!.disabled =
      false
  }

  private async createDiv(path: string): Promise<HTMLDivElement[]> {
    const folders = await FileHandler.getDirectoryFolders(path)
    let files = await FileHandler.getDirectoryFiles(path)
    folders.sort((a, b) =>
      a.name.toLowerCase().localeCompare(b.name.toLowerCase())
    )
    files.sort((a, b) =>
      a.name.toLowerCase().localeCompare(b.name.toLowerCase())
    )
    files = files.filter(file => extname(file.name) != ".crswap")
    return folders
      .map(handle => this.createBaseElement(path, handle))
      .concat(files.map(handle => this.createBaseElement(path, handle)))
  }

  private createBaseElement(path: string, handle: FileSystemHandle) {
    if (path != "") path += "/"
    const new_div = document.createElement("div")
    new_div.classList.add("item")
    //File/Directory Info
    const info = document.createElement("div")
    info.classList.add("info")
    new_div.appendChild(info)
    if (handle.kind == "directory") {
      const folder_open = document.createElement("img")
      folder_open.classList.add("icon")
      folder_open.classList.add("folder-icon")
      folder_open.src =
        "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAABgAAAAYCAYAAADgdz34AAAABmJLR0QA/wD/AP+gvaeTAAAAbklEQVRIie2PMQqAMAxFXwfP6qJVPIjYzcOKdUkhQ0BaCoLkLS3k818CjuN8ztApYzIDl7xvmalFsAIZuIFozKPMMrC0CAJwKIkuGVX5KdkmLEm3ci1JSlLKU49yLSmXVG1es0EANvnvInKcP/AA784fpjlWwNQAAAAASUVORK5CYII="
      info.appendChild(folder_open)
      const children = document.createElement("div")
      children.classList.add("children")
      new_div.appendChild(children)
      new_div.classList.add("folder")
      new_div.classList.add("collapsed")

      info.addEventListener("click", e => {
        const target = e.target as HTMLElement
        if (target?.classList.contains("options-icon")) return
        if (
          target.tagName == "TEXTAREA" &&
          !(<HTMLTextAreaElement>target).disabled
        )
          return
        if (new_div.classList.contains("collapsed")) this.expand(info)
        else this.collapse(info)
      })
    } else {
      if (!this.acceptableFileType(handle.name)) info.classList.add("disabled")
      const icon = document.createElement("img")
      icon.src = this.getIcon(handle.name)
      icon.classList.add("icon")
      info.appendChild(icon)
    }
    info.dataset.path = path + handle.name

    const title = document.createElement("textarea")
    title.rows = 1
    title.disabled = true
    title.autocomplete = "off"
    title.autocapitalize = "off"
    title.spellcheck = false
    title.innerText = handle.name
    title.style.pointerEvents = "none"
    title.classList.add("title")
    info.appendChild(title)

    info.addEventListener("click", () => this.selectElement(info))

    info.addEventListener("mousedown", () => this.startDragging(info))

    info.ondblclick = () => this.confirmFile()
    return new_div
  }

  private confirmFile() {
    const selected: HTMLElement | null =
      this.viewElement.querySelector(".info.selected")
    const path = selected?.dataset.path
    if (!path) return
    if (this.acceptableFileType(path)) {
      this.dirOptions.callback?.(path)
      window.removeEventListener("keydown", this.keyHandler, true)
      window.removeEventListener("drop", this.dropHandler, true)
      window.removeEventListener("mousemove", this.dragHandler, true)
      this.closeWindow()
    }
  }

  private acceptableFileType(name: string) {
    return (
      this.dirOptions.accepted_file_types!.length == 0 ||
      this.dirOptions.accepted_file_types!.includes(extname(name))
    )
  }

  private getIcon(name: string): string {
    const ext = extname(name)
    if (ext == "" && !name.startsWith(".")) {
      return "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAABgAAAAYCAYAAADgdz34AAAABmJLR0QA/wD/AP+gvaeTAAAAY0lEQVRIiWNgGAWDCXgwMDA8ZmBg+I8DN1BqwSM8hlPFEpgh2EA4AwPDbyIc8B/qUA9SLSDHEpItIBagmMNEBQPxglELRi0YtQDVgsdQmpiiAB9GNgsFeDAQV6KSXdiNgoEBAG+iU6T/ixEpAAAAAElFTkSuQmCC"
    }
    if (IMG_EXT.includes(ext)) {
      return Icons.IMAGE_FILE
    }
    if (AUDIO_EXT.includes(ext)) {
      return Icons.AUDIO_FILE
    }
    if ([".sm", ".ssc"].includes(ext)) return Icons.SM_FILE
    return Icons.UNKNOWN_FILE
  }

  private startEditing(title: HTMLTextAreaElement) {
    const initialValue = title.value
    const isFolder =
      !!title.parentElement?.parentElement?.classList.contains("folder")
    const path = title.parentElement?.dataset.path ?? ""
    const basedir = dirname(path)
    title.value = path.split("/").at(-1) ?? ""
    window.removeEventListener("keydown", this.keyHandler, true)
    title.disabled = false
    title.style.pointerEvents = ""
    title.focus()
    title.addEventListener(
      "keypress",
      event => {
        if (event.code == "Enter") {
          event.preventDefault()
          event.stopImmediatePropagation()
          title.blur()
        }
      },
      true
    )
    title.addEventListener("blur", async () => {
      window.addEventListener("keydown", this.keyHandler, true)
      title.disabled = true
      title.style.pointerEvents = "none"
      if (title.value.startsWith(".")) {
        title.value = initialValue
        return
      }
      title.value = title.value.replaceAll("/", "")
      const newPath = basedir == "" ? title.value : basedir + "/" + title.value
      if (newPath == path) return
      title.parentElement!.dataset.path = newPath
      await FileHandler[isFolder ? "renameDirectory" : "renameFile"](
        path,
        newPath
      )
      this.refreshDirectory(basedir)
      if (title.value.length > 32)
        title.value = title.value.slice(0, 32) + "..."
    })
  }

  private async refreshDirectory(path: string) {
    const scroll = this.viewElement.querySelector(
      ".dir-selector"
    ) as HTMLElement
    if (!scroll) return
    let element = scroll.querySelector(
      "div[data-path='" + this.escapeSelector(path) + "']"
    )?.nextSibling as HTMLElement
    if (path == "") element = scroll
    if (!element) return
    const openedFolders = Array.from(
      element.parentElement!.querySelectorAll(".folder:not(.collapsed)")
    ).map(element => {
      const infoEl = element.children[0] as HTMLElement
      return infoEl.dataset.path!
    })
    await this.createDiv(path).then(elements =>
      element.replaceChildren(...elements)
    )
    await Promise.all(
      openedFolders.map(path =>
        this.expand(
          scroll.querySelector(
            "div[data-path='" + this.escapeSelector(path) + "']"
          )!
        )
      )
    )
  }

  private getElement(path: string): HTMLElement | null {
    const scroll = this.viewElement.querySelector(
      ".dir-selector"
    ) as HTMLElement
    if (!scroll) return null
    return scroll.querySelector(
      "div[data-path='" + this.escapeSelector(path) + "']"
    )
  }

  async getAcceptableFile(path: string): Promise<string | undefined> {
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
        } else if (this.acceptableFileType(entry.name)) {
          return prepend + entry.name
        }
      }
    }
    return undefined
  }

  async selectPath(path: string | undefined) {
    if (!path) return
    const scroll = this.viewElement.querySelector<HTMLElement>(".dir-selector")
    if (!scroll) return
    const parts = path.split("/")
    parts.pop()
    const pathBuild = []
    while (parts.length > 0) {
      pathBuild.push(parts.shift())
      const element = scroll.querySelector<HTMLElement>(
        "div[data-path='" + this.escapeSelector(pathBuild.join("/")) + "']"
      )
      if (!element) return
      await this.expand(element)
    }
    const finalElement = scroll.querySelector<HTMLElement>(
      "div[data-path='" + this.escapeSelector(path) + "']"
    )
    if (!finalElement) return
    this.selectElement(finalElement)
  }

  private handleKeyEvent(event: KeyboardEvent) {
    if (!this.windowElement.classList.contains("focused")) return
    const selected = this.viewElement.querySelector(
      ".info.selected"
    ) as HTMLElement
    if (selected == undefined) {
      if (event.code.startsWith("Arrow")) {
        const first: HTMLElement | null =
          this.viewElement.querySelector(".info")
        if (first) this.selectElement(first)
      }
      return
    }
    if (event.code == "ArrowUp") {
      event.preventDefault()
      event.stopImmediatePropagation()
      const item = selected.parentElement!
      let prev: HTMLElement | null = (<HTMLElement>(
        item.previousSibling
      ))?.querySelector(".info")
      if (
        prev &&
        !prev.parentElement!.classList.contains("collapsed") &&
        prev.parentElement!.classList.contains("folder")
      ) {
        prev = (<HTMLElement>(
          prev.parentElement!.querySelector(".children")!.lastChild!
        )).querySelector(".info")!
      }
      if (!prev && item.parentElement!.classList.contains("children")) {
        prev = item.parentElement!.parentElement!.querySelector(".info")!
      }
      if (prev) {
        this.selectElement(prev)
        scrollIntoView(prev, {
          scrollMode: "if-needed",
          block: "nearest",
          inline: "nearest",
        })
      }
    }
    if (event.code == "ArrowDown") {
      event.preventDefault()
      event.stopImmediatePropagation()
      const item = selected.parentElement!
      let next: HTMLElement | undefined = undefined
      if (
        item.classList.contains("folder") &&
        !item.classList.contains("collapsed")
      ) {
        const children = item.querySelector(".children")!
        next = <HTMLElement>children.children[0].querySelector(".info")
      }
      if (!next)
        next = (<HTMLElement>(
          selected.parentElement!.nextSibling
        ))?.querySelector(".info") as HTMLElement
      if (!next && item.parentElement!.classList.contains("children"))
        next = (<HTMLElement>(
          item.parentElement!.parentElement!.nextSibling
        ))!.querySelector(".info") as HTMLElement
      if (next) {
        this.selectElement(next)
        scrollIntoView(next, {
          scrollMode: "if-needed",
          block: "nearest",
          inline: "nearest",
        })
      }
    }
    if (event.code == "ArrowLeft") {
      event.preventDefault()
      event.stopImmediatePropagation()
      this.collapse(selected)
    }
    if (event.code == "ArrowRight") {
      event.preventDefault()
      event.stopImmediatePropagation()
      this.expand(selected)
    }
    if (event.code == "Enter") {
      event.preventDefault()
      event.stopImmediatePropagation()
      const textarea = selected.parentElement?.querySelector(
        ".title"
      ) as HTMLTextAreaElement | null
      if (textarea)
        this.startEditing(
          selected.parentElement?.querySelector(".title") as HTMLTextAreaElement
        )
    }
    if (event.code == "Delete" || event.code == "Backspace") {
      const selected: HTMLElement | null =
        this.viewElement.querySelector(".info.selected")
      const path = selected?.dataset.path
      if (!path) return
      const isFolder = selected.parentElement!.classList.contains("folder")
      FileHandler[isFolder ? "removeDirectory" : "removeFile"](path).then(
        () => {
          const el = this.getElement(path)
          if (!el) return
          el.parentElement?.remove()
          this.viewElement.querySelector<HTMLButtonElement>(
            ".delete"
          )!.disabled = true
          this.viewElement.querySelector<HTMLButtonElement>(
            ".rename"
          )!.disabled = true
        }
      )
    }
  }

  private startDragging(element: HTMLDivElement) {
    const drag = element as DraggableDiv
    drag.totalMovementX = 0
    drag.totalMovementY = 0
    this.draggedElement = drag

    const endDragHandler = () => {
      this.stopDragging()
      window.removeEventListener("mouseup", endDragHandler)
    }
    window.addEventListener("mouseup", endDragHandler)
  }

  private handleDragEvent(event: MouseEvent) {
    if (!this.draggedElement) return
    this.draggedElement.totalMovementX += event.movementX
    this.draggedElement.totalMovementY += event.movementY
    if (!this.draggedCopy) {
      if (
        Math.abs(this.draggedElement.totalMovementX) +
          Math.abs(this.draggedElement.totalMovementY) >
        8
      ) {
        this.viewElement.addEventListener("mousemove", this.mouseHandler)
        this.draggedCopy = this.draggedElement.parentElement!.cloneNode(
          true
        ) as HTMLDivElement
        this.draggedCopy.style.position = "fixed"
        const bounds = this.draggedElement.getBoundingClientRect()
        this.draggedCopy.style.top =
          bounds.top + this.draggedElement.totalMovementY + "px"
        this.draggedCopy.style.left =
          bounds.left + this.draggedElement.totalMovementX + "px"
        this.draggedCopy.style.width = bounds.width + "px"
        this.draggedCopy.style.boxShadow = "3px 3px 3px #222"
        if (this.draggedCopy.querySelector(".children"))
          this.draggedCopy.removeChild(
            this.draggedCopy.querySelector(".children")!
          )
        this.viewElement.appendChild(this.draggedCopy)
      } else {
        return
      }
    }

    this.draggedCopy.style.top =
      parseFloat(this.draggedCopy.style.top.slice(0, -2)) +
      event.movementY +
      "px"
    this.draggedCopy.style.left =
      parseFloat(this.draggedCopy.style.left.slice(0, -2)) +
      event.movementX +
      "px"
  }

  private async stopDragging() {
    if (this.draggedCopy) {
      this.draggedCopy.remove()
      this.viewElement.removeEventListener("mousemove", this.mouseHandler)
      const isFolder = this.draggedCopy.classList.contains("folder")
      const path = this.draggedElement!.dataset.path!
      const targetPath =
        this.fileDropPath == ""
          ? basename(this.draggedElement!.dataset.path!)
          : this.fileDropPath +
            "/" +
            basename(this.draggedElement!.dataset.path!)
      await FileHandler[isFolder ? "renameDirectory" : "renameFile"](
        path,
        targetPath
      )

      await this.refreshDirectory(dirname(path))
      await this.refreshDirectory(dirname(targetPath))

      this.viewElement.querySelector(".outlined")?.classList.remove("outlined")
      this.fileDropPath = ""
    }
    this.draggedCopy = undefined
    this.draggedElement = undefined
  }

  private handleDropEvent(event: DragEvent) {
    event.preventDefault()
    event.stopImmediatePropagation()
    this.viewElement.querySelector(".outlined")?.classList.remove("outlined")

    if (!(<HTMLElement>event.target!).closest(".dir-selector")) {
      return
    }
    FileHandler.handleDropEvent(event, this.fileDropPath).then(async folder => {
      await this.refreshDirectory(this.fileDropPath)
      this.getAcceptableFile(folder ?? this.fileDropPath).then(path =>
        this.selectPath(path)
      )
      this.fileDropPath = ""
    })
  }

  private handleMouseEvent(event: MouseEvent) {
    const scroll = this.viewElement.querySelector(".dir-selector")!
    let items = Array.from(scroll.querySelectorAll("div.item.folder"))!
    const prevOwner = this.viewElement.querySelector(".outlined")
    items = items.filter(x => !x.parentElement!.closest(".collapsed"))
    items.reverse()
    items.push(scroll)
    for (const folder of items) {
      const bounds = folder.getBoundingClientRect()
      if (
        event.clientX >= bounds.x &&
        event.clientX <= bounds.x + bounds.width &&
        event.clientY >= bounds.y &&
        event.clientY <= bounds.y + bounds.height
      ) {
        if (prevOwner != folder) {
          prevOwner?.classList.remove("outlined")
        }
        const item = <HTMLElement>folder.querySelector(".info")
        this.fileDropPath = item?.dataset.path ?? ""
        if (folder.classList.contains("dir-selector")) {
          this.fileDropPath = ""
        }
        folder.classList.add("outlined")
        return
      }
    }
    this.viewElement.querySelector(".outlined")?.classList.remove("outlined")
    this.fileDropPath = ""
  }

  private escapeSelector(selector: string) {
    return selector.replaceAll(/'/g, "\\'")
  }
}
