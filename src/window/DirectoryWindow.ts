import scrollIntoView from "scroll-into-view-if-needed"
import { App } from "../App"
import { AUDIO_EXT, IMG_EXT } from "../data/FileData"
import { Icons } from "../gui/Icons"
import { FileHandler } from "../util/FileHandler"
import { extname } from "../util/Util"
import { Window } from "./Window"

interface DirectoryWindowOptions {
  title: string
  accepted_file_types?: string[]
  callback?: (path: string) => void
  disableClose?: boolean
  initial_select?: string
}

type DraggableDiv = HTMLDivElement & {
  mouseDown?: boolean
  totalMovementX: number
  totalMovementY: number
}

export class DirectoryWindow extends Window {
  app: App
  dirOptions: DirectoryWindowOptions
  keyHandler?: (event: KeyboardEvent) => void
  dragHandler?: (event: MouseEvent) => void
  dropHandler?: (event: DragEvent) => void
  highlightedPath = ""

  constructor(
    app: App,
    options: DirectoryWindowOptions,
    highlightedPath?: string
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
    this.initView(this.viewElement)
    // if (highlightedPath) this.select(this.viewElement, highlightedPath)
  }

  initView(viewElement: HTMLDivElement): void {
    // Create the window
    viewElement.replaceChildren()

    this.keyHandler = (event: KeyboardEvent) => {
      if (!this.windowElement.classList.contains("focused")) return
      const selected = viewElement.querySelector(
        ".info.selected"
      ) as HTMLElement
      if (selected == undefined) {
        viewElement.querySelector(".info")?.classList.add("selected")
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
        if (selected.parentElement!.classList.contains("folder")) return
        this.startEditing(
          selected.parentElement!.querySelector(".title") as HTMLTextAreaElement
        )
      }
    }
    this.dragHandler = (event: MouseEvent) => {
      const scroll = viewElement.querySelector(".dir-selector")!
      let items = Array.from(scroll.querySelectorAll("div.item.folder"))!
      const prevOwner = viewElement.querySelector(".outlined")
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
          this.highlightedPath = item?.dataset.path ?? ""
          if (folder.classList.contains("dir-selector")) {
            this.highlightedPath = ""
          }
          folder.classList.add("outlined")
          return
        }
      }
      viewElement.querySelector(".outlined")?.classList.remove("outlined")
      this.highlightedPath = ""
    }

    this.dropHandler = event => {
      event.preventDefault()
      event.stopImmediatePropagation()
      const handler = async () => {
        if (!(<HTMLElement>event.target!).closest(".dir-selector")) {
          return
        }
        let prefix = this.highlightedPath
        const items = event.dataTransfer!.items
        if (prefix == "") {
          for (let i = 0; i < items.length; i++) {
            const item = items[i].webkitGetAsEntry()
            if (item?.isFile) {
              if (item.name.endsWith(".sm") || item.name.endsWith(".ssc")) {
                prefix = "New Song"
                break
              }
            }
          }
        }

        const queue = []
        for (let i = 0; i < items.length; i++) {
          const item = items[i].webkitGetAsEntry()
          queue.push(FileHandler.uploadFiles(item!, prefix))
        }
        await Promise.all(queue)
        let scroll = viewElement
          .querySelector(".dir-selector")
          ?.querySelector(
            "div[data-path='" + this.escapeSelector(prefix) + "']"
          )
          ?.parentElement!.querySelector(".children")
        if (prefix == "") {
          scroll = viewElement.querySelector(".dir-selector")
        }
        this.refreshDirectory(this.highlightedPath)
        // const s_path = prefix.split("/")
        // while (scroll == undefined) {
        //   s_path.pop()
        //   viewElement
        //     .querySelector(".dir-selector")
        //     ?.querySelector(
        //       "div[data-path='" + this.escapeSelector(s_path.join("/")) + "']"
        //     )
        //     ?.parentElement!.querySelector(".children")
        //   if (s_path.length == 0) {
        //     scroll = viewElement.querySelector(".dir-selector")
        //   }
        // }
        // this.reloadView(viewElement, s_path.join("/"))
        // this.searchForAcceptableFile(viewElement, s_path.join("/"))
      }
      handler()
    }

    //Padding container
    const padding = document.createElement("div")
    padding.classList.add("padding")

    //Navbar
    // const navbar = document.createElement("div")
    // navbar.classList.add("navbar")
    // const navbar_title = document.createElement("div")
    // navbar_title.classList.add("title")
    // navbar_title.innerText = "Files"
    // const add_folder = document.createElement("img")
    // add_folder.src = Icons.ADD_FOLDER
    // add_folder.onclick = async () => {
    //   const dirHandle = await showDirectoryPicker({ id: 1 })
    //   await FileHandler.uploadDir(dirHandle)
    //   this.refreshDirectory("")
    //   console.log(this.getAcceptableFile(dirHandle.name))
    // }
    // navbar.appendChild(navbar_title)
    // navbar.appendChild(add_folder)

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
      window.removeEventListener("keydown", this.keyHandler!, true)
      window.removeEventListener("drop", this.dropHandler!, true)
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
    this.createDiv("").then(elements => scroll.replaceChildren(...elements))

    // padding.appendChild(navbar)
    padding.appendChild(scroll)
    padding.appendChild(menu_options)
    viewElement.appendChild(padding)

    //Find a file with extensions
    // if (this.dirOptions.initial_select)
    //   this.select(viewElement, this.dirOptions.initial_select)

    //Drag & drop
    window.addEventListener("keydown", this.keyHandler, true)

    viewElement.addEventListener("dragover", this.dragHandler)
    viewElement.addEventListener("dragend", () => {
      viewElement.querySelector(".outlined")?.classList.remove("outlined")
      this.highlightedPath = ""
    })

    window.addEventListener("drop", this.dropHandler, true)
  }

  private expand(element: HTMLElement) {
    if (!element.dataset.path || extname(element.dataset.path) != "") return
    element.parentElement!.classList.remove("collapsed")
    const children = element.nextSibling as HTMLDivElement
    this.createDiv(element.dataset.path).then(elements =>
      children.replaceChildren(...elements)
    )
  }

  private collapse(element: HTMLElement) {
    if (!element.dataset.path || extname(element.dataset.path) != "") return
    element.parentElement!.classList.add("collapsed")
    const children = element.nextSibling as HTMLDivElement
    children.replaceChildren()
  }

  private selectElement(element: HTMLElement) {
    this.viewElement
      .querySelector(".info.selected")
      ?.classList.remove("selected")
    element.classList.add("selected")
    const button: HTMLButtonElement =
      this.viewElement.querySelector("button.confirm")!
    const path = element.dataset.path
    button.disabled = true
    if (!path) return
    button.disabled = !this.acceptableFileType(path)
  }

  // private selectPath(path: string) {
  //   const scroll = this.viewElement.querySelector(".dir-selector")
  //   if (!scroll) return
  //   const pathParts = dirname(path).split("/")
  //   let folder = scroll
  //   let walkPath = ""
  //   for (const part of pathParts) {

  //     folder = folder.querySelector("div[data-path='" + this.escapeSelector(path) + "']")
  //   }

  //   const info = scroll.querySelector(
  //     "div[data-path='" + this.escapeSelector(path) + "']"
  //   )
  //   if (!info) return
  //   this.selectElement(info)
  //   let el = info.parentElement!
  //   while (el.parentElement!.parentElement!.classList.contains("folder")) {
  //     el = el.parentElement!.parentElement!
  //     el.classList.remove("collapsed")
  //   }
  //   scrollIntoView(info, {
  //     scrollMode: "if-needed",
  //     block: "nearest",
  //     inline: "nearest",
  //   })
  // }

  async createDiv(path: string): Promise<HTMLDivElement[]> {
    const dirHandle = await FileHandler.getDirectoryHandle(path)
    if (!dirHandle) return []
    const folders: FileSystemHandle[] = []
    const files: FileSystemHandle[] = []
    for await (const fileHandle of dirHandle.values()) {
      if (fileHandle.kind == "directory") folders.push(fileHandle)
      else files.push(fileHandle)
    }
    folders.sort((a, b) =>
      a.name.toLowerCase().localeCompare(b.name.toLowerCase())
    )
    files.sort((a, b) =>
      a.name.toLowerCase().localeCompare(b.name.toLowerCase())
    )
    return folders
      .concat(files)
      .map(handle => this.createBaseElement(path, handle))
    // const rename = document.createElement("img")
    // rename.classList.add("icon")
    // rename.classList.add("options-icon")
    // rename.src =
    //   Icons.EDIT
    // rename.onclick = e => {
    //   e.preventDefault()
    //   this.startEditing(title)
    //   return false
    // }
    // const add_file = document.createElement("img")
    // add_file.classList.add("icon")
    // add_file.classList.add("options-icon")
    // add_file.src =
    //   Icons.ADD_FILE
    // add_file.onclick = () => {
    //   const input = document.createElement("input")
    //   input.type = "file"
    //   input.multiple = true

    //   input.onchange = () => {
    //     const path = info.dataset.path!.split("/")
    //     if (path[path.length - 1].indexOf(".") > -1) {
    //       path.pop()
    //     }
    //     this.uploadFiles(viewElement, path.join("/"), input.files!)
    //   }
    //   input.click()
    //   return false
    // }
    // const add_folder = document.createElement("img")
    // add_folder.classList.add("icon")
    // add_folder.classList.add("options-icon")
    // add_folder.src =
    //   "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAABgAAAAYCAYAAADgdz34AAAABmJLR0QA/wD/AP+gvaeTAAAAvUlEQVRIie2UTQ7CIBBGnz8rb+Mt2hqv4TGMmt4Kexl7gUa3TXBRTAALQqGJJr5kNpR+r8ykwJ9vogJaQDrqlCrwhWeRfAoPrRYo5xRI4OYTpGLkLDMEevl9wXqGzC2wH3uQa8gGOVpUAALoVAmGW+GNKSc44v4XLqmCwgpcqfVeWzNOEisQAYJGfyHkspPARu3vrGCbHrjrQz4oSSiLiL2TuBLZoljKAMEuRQBwxj2rOjX8RcXQioeqBu3Ln4QChU8M4+FlAAAAAElFTkSuQmCC"
    // adIcons.ADD_FOLDER
    //   const input = document.createElement("input")
    //   input.type = "file"
    //   input.multiple = true
    //   input.webkitdirectory = true

    //   input.onchange = () => {
    //     const path = info.dataset.path!.split("/")
    //     if (path[path.length - 1].indexOf(".") > -1) {
    //       path.pop()
    //     }
    //     this.uploadDirectory(viewElement, path.join("/"), input.files!)
    //   }
    //   input.click()
    //   return false
    // }
    // const delete_file = document.createElement("img")
    // delete_file.classList.add("icon")
    // delete_file.classList.add("options-icon")
    // delete_file.src =
    //   Icons.TRASH
    // delete_file.onclick = () => {
    //   this.app.files.removeFile(info.dataset.path!)
    //   new_div.parentElement!.removeChild(new_div)
    //   return false
    // }
    // window.addEventListener("mousemove", e => {
    //   const drag = info as DraggableDiv
    //   if (drag.mouseDown) {
    //     drag.totalMovementX += e.movementX
    //     drag.totalMovementY += e.movementY
    //     let info2: HTMLDivElement = viewElement.querySelector(".drag-copy")!
    //     if (!info2) {
    //       if (
    //         Math.abs(drag.totalMovementX) + Math.abs(drag.totalMovementY) >
    //         8
    //       ) {
    //         viewElement.addEventListener("mousemove", this.dragHandler!)
    //         info2 = new_div.cloneNode(true) as HTMLDivElement
    //         info2.style.position = "fixed"
    //         const bounds = info.getBoundingClientRect()
    //         info2.style.top = bounds.top + drag.totalMovementY + "px"
    //         info2.style.left = bounds.left + drag.totalMovementX + "px"
    //         info2.style.width = bounds.width + "px"
    //         info2.style.boxShadow = "3px 3px 3px #222"
    //         info2.classList.add("drag-copy")
    //         if (info2.querySelector(".children"))
    //           info2.removeChild(info2.querySelector(".children")!)
    //         viewElement.appendChild(info2)
    //       } else {
    //         return
    //       }
    //     }
    //     info2.style.top =
    //       parseFloat(info2.style.top.slice(0, -2)) + e.movementY + "px"
    //     info2.style.left =
    //       parseFloat(info2.style.left.slice(0, -2)) + e.movementX + "px"
    //   }
    // })

    // window.addEventListener("mouseup", () => {
    //   const drag = info as DraggableDiv
    //   if (drag.mouseDown) {
    //     drag.mouseDown = false
    //     const drags = Array.from(viewElement.querySelectorAll(".drag-copy"))
    //     drags.forEach(x => viewElement.removeChild(x))
    //     viewElement.removeEventListener("mousemove", this.dragHandler!)
    //     if (
    //       Math.abs(drag.totalMovementX) + Math.abs(drag.totalMovementY) >
    //       8
    //     ) {
    //       this.app.files.move(info.dataset.path!, this.highlightedPath)
    //       const prefix1 = info.dataset.path!.split("/").slice(0, -1).join("/")
    //       const prefix2 = this.highlightedPath
    //       this.reloadView(viewElement, prefix1)
    //       this.reloadView(viewElement, prefix2)
    //       viewElement.querySelector(".outlined")?.classList.remove("outlined")
    //       this.highlightedPath = ""
    //     }
    //   }
    // })

    // new_div.appendChild(info)
  }

  private createBaseElement(path: string, handle: FileSystemHandle) {
    if (path != "") path += "/"
    const ext = extname(handle.name)
    const new_div = document.createElement("div")
    new_div.classList.add("item")
    //File/Directory Info
    const info = document.createElement("div")
    info.classList.add("info")
    new_div.appendChild(info)
    if (ext == "" && !handle.name.startsWith(".")) {
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
        const icon = e.target as HTMLElement
        if (!icon?.classList.contains("options-icon")) {
          if (new_div.classList.contains("collapsed")) this.expand(info)
          else this.collapse(info)
        }
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

    info.ondblclick = () => this.confirmFile()
    return new_div
  }

  confirmFile() {
    const selected: HTMLElement | null =
      this.viewElement.querySelector(".info.selected")
    const path = selected?.dataset.path
    if (!path) return
    if (this.acceptableFileType(path)) {
      this.dirOptions.callback?.(path)
      window.removeEventListener("keydown", this.keyHandler!, true)
      window.removeEventListener("drop", this.dropHandler!, true)
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
    window.removeEventListener("keydown", this.keyHandler!, true)
    title.disabled = false
    title.style.pointerEvents = ""
    title.value = title.parentElement!.dataset.path!.split("/").pop()!
    title.focus()
    title.addEventListener("keypress", e => this.textAreaKeyHandler(e), true)
    title.addEventListener("blur", () => {
      window.addEventListener("keydown", this.keyHandler!, true)
      title.disabled = true
      title.style.pointerEvents = "none"
      const path = title.parentElement!.dataset.path!.split("/")
      const orig_path = title.parentElement!.dataset.path!
      const isFolder = orig_path.indexOf(".") == -1
      title.value = title.value.replaceAll("/", "")
      if (isFolder) title.value = title.value.replaceAll(".", "")
      path[path.length - 1] = title.value
      title.parentElement!.dataset.path = path.join("/")
      // this.app.files.rename(orig_path, title.value)
      if (title.value.length > 32)
        title.value = title.value.slice(0, 32) + "..."
    })
  }

  private textAreaKeyHandler(event: KeyboardEvent) {
    if (event.code == "Enter") {
      event.preventDefault()
      event.stopImmediatePropagation()
      ;(<HTMLElement>event.target)?.blur()
    }
  }

  private refreshDirectory(path: string) {
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
    ).map(element => (<HTMLElement>element).dataset.path)
    this.createDiv(path).then(elements => element.replaceChildren(...elements))
  }

  private async getAcceptableFile(path: string): Promise<string | undefined> {
    const baseDirHandle = await FileHandler.getDirectoryHandle(path)
    if (!baseDirHandle) return
    const queue = [{ path, handle: baseDirHandle }]
    while (queue.length > 0) {
      const directory = queue.shift()!
      const handle = directory.handle
      for await (const entry of handle.values()) {
        if (entry.kind == "directory") {
          queue.push({ path: directory.path + "/" + entry.name, handle: entry })
        } else if (this.acceptableFileType(entry.name)) {
          return directory.path + "/" + entry.name
        }
      }
    }
    return undefined
  }

  private escapeSelector(selector: string) {
    return selector.replaceAll(/'/g, "\\'")
  }
}
