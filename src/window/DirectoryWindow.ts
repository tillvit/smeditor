import { App } from "../App"
import { Window } from "./Window"
import scrollIntoView from "scroll-into-view-if-needed"
import { FileTree } from "../util/FileSystem"

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

  constructor(app: App, options: DirectoryWindowOptions) {
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
  }

  initView(viewElement: HTMLDivElement): void {
    // Create the window
    viewElement.replaceChildren()
    this.keyHandler = (event: KeyboardEvent) => {
      if (!this.windowElement.classList.contains("focused")) return
      const selected = viewElement.querySelector(".info.selected")
      if (selected == undefined) {
        viewElement.querySelector(".info")?.classList.add("selected")
        return
      }
      if (event.code == "ArrowUp") {
        event.preventDefault()
        event.stopImmediatePropagation()
        const item = selected.parentElement!
        let prev: HTMLElement = (<HTMLElement>(
          item.previousSibling
        ))!.querySelector(".info")!
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
          selected.classList.remove("selected")
          prev.classList.add("selected")
          this.changeSelectState(viewElement)
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
          ))!.querySelector(".info") as HTMLElement
        if (!next && item.parentElement!.classList.contains("children"))
          next = (<HTMLElement>(
            item.parentElement!.parentElement!.nextSibling
          ))!.querySelector(".info") as HTMLElement
        if (next) {
          selected.classList.remove("selected")
          next.classList.add("selected")
          this.changeSelectState(viewElement)
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
        if (selected.parentElement!.classList.contains("folder")) {
          selected.parentElement!.classList.add("collapsed")
        }
      }
      if (event.code == "ArrowRight") {
        event.preventDefault()
        event.stopImmediatePropagation()
        if (selected.parentElement!.classList.contains("folder")) {
          selected.parentElement!.classList.remove("collapsed")
        }
      }
      if (event.code == "Enter") {
        event.preventDefault()
        event.stopImmediatePropagation()
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
          queue.push(this.traverseFileTree(prefix, item!))
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
        const s_path = prefix.split("/")
        while (scroll == undefined) {
          s_path.pop()
          viewElement
            .querySelector(".dir-selector")
            ?.querySelector(
              "div[data-path='" + this.escapeSelector(s_path.join("/")) + "']"
            )
            ?.parentElement!.querySelector(".children")
          if (s_path.length == 0) {
            scroll = viewElement.querySelector(".dir-selector")
          }
        }
        this.reloadView(viewElement, s_path.join("/"))
        this.searchForAcceptableFile(viewElement, s_path.join("/"))
      }
      handler()
    }

    //Padding container
    const padding = document.createElement("div")
    padding.classList.add("padding")

    //Navbar
    const navbar = document.createElement("div")
    navbar.classList.add("navbar")
    const navbar_title = document.createElement("div")
    navbar_title.classList.add("title")
    navbar_title.innerText = "Files"
    const add_folder = document.createElement("img")
    add_folder.src =
      "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAABgAAAAYCAYAAADgdz34AAAABmJLR0QA/wD/AP+gvaeTAAAAvUlEQVRIie2UTQ7CIBBGnz8rb+Mt2hqv4TGMmt4Kexl7gUa3TXBRTAALQqGJJr5kNpR+r8ykwJ9vogJaQDrqlCrwhWeRfAoPrRYo5xRI4OYTpGLkLDMEevl9wXqGzC2wH3uQa8gGOVpUAALoVAmGW+GNKSc44v4XLqmCwgpcqfVeWzNOEisQAYJGfyHkspPARu3vrGCbHrjrQz4oSSiLiL2TuBLZoljKAMEuRQBwxj2rOjX8RcXQioeqBu3Ln4QChU8M4+FlAAAAAElFTkSuQmCC"
    add_folder.onclick = () => {
      const input = document.createElement("input")
      input.type = "file"
      input.multiple = true
      input.webkitdirectory = true

      input.onchange = event => {
        this.uploadDirectory(
          viewElement,
          "",
          (event.target! as HTMLInputElement).files!
        )
      }
      input.click()
    }
    navbar.appendChild(navbar_title)
    navbar.appendChild(add_folder)

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
    select_btn.onclick = () => this.confirm(viewElement)
    select_btn.disabled = true
    menu_options_left.appendChild(cancel)
    menu_options_right.appendChild(select_btn)

    //Create file explorer
    const scroll = document.createElement("div")
    scroll.classList.add("dir-selector")
    const divs = this.createDiv(viewElement, this.app.files.file_tree)
    scroll.replaceChildren(...divs)

    padding.appendChild(navbar)
    padding.appendChild(scroll)
    padding.appendChild(menu_options)
    viewElement.appendChild(padding)

    //Find a file with extensions
    if (this.dirOptions.initial_select)
      this.select(viewElement, this.dirOptions.initial_select)

    //Drag & drop
    window.addEventListener("keydown", this.keyHandler, true)

    viewElement.addEventListener("dragover", this.dragHandler)
    viewElement.addEventListener("dragend", () => {
      viewElement.querySelector(".outlined")?.classList.remove("outlined")
      this.highlightedPath = ""
    })

    window.addEventListener("drop", this.dropHandler, true)
  }

  traverseFileTree(
    prefix: string,
    item: FileSystemEntry,
    path?: string
  ): Promise<void> {
    return new Promise(resolve => {
      path = path || ""
      if (item.isFile) {
        ;(<FileSystemFileEntry>item).file(file => {
          this.app.files.addFile(prefix + "/" + path + file.name, file)
          resolve()
        })
      } else if (item.isDirectory) {
        const dirReader = (<FileSystemDirectoryEntry>item).createReader()
        dirReader.readEntries(entries => {
          const handler = async () => {
            for (let i = 0; i < entries.length; i++) {
              await this.traverseFileTree(
                prefix,
                entries[i],
                path + item.name + "/"
              )
            }
            resolve()
          }
          handler()
        })
      }
    })
  }

  select(viewElement: HTMLDivElement, path: string) {
    const scroll = viewElement.querySelector(".dir-selector")
    if (!scroll) return
    const info = scroll.querySelector(
      "div[data-path='" + this.escapeSelector(path) + "']"
    )
    if (info) {
      viewElement.querySelector(".info.selected")?.classList.remove("selected")
      info.classList.add("selected")
      this.changeSelectState(viewElement)
      let el = info.parentElement!
      while (el.parentElement!.parentElement!.classList.contains("folder")) {
        el = el.parentElement!.parentElement!
        el.classList.remove("collapsed")
      }
      scrollIntoView(info, {
        scrollMode: "if-needed",
        block: "nearest",
        inline: "nearest",
      })
    }
  }

  changeSelectState(viewElement: HTMLDivElement) {
    const item: HTMLElement | null = viewElement.querySelector(".info.selected")
    const button: HTMLButtonElement =
      viewElement.querySelector("button.confirm")!
    const path = item?.dataset.path
    button.disabled = true
    if (!path) return
    button.disabled = !this.dirOptions.accepted_file_types!.includes(
      path.split(".").pop()!
    )
  }

  createDiv(
    viewElement: HTMLDivElement,
    fileTree: FileTree,
    path?: string
  ): HTMLDivElement[] {
    path = path || ""
    const items = []
    //Folders first, then other files
    let keys = Object.keys(fileTree).filter(x => x.indexOf(".") == -1)
    keys.sort((a, b) => a.toLowerCase().localeCompare(b.toLowerCase()))
    const files = Object.keys(fileTree).filter(x => x.indexOf(".") > -1)
    files.sort((a, b) => a.toLowerCase().localeCompare(b.toLowerCase()))
    keys = keys.concat(files)
    for (const item of keys) {
      const new_div = document.createElement("div")
      new_div.classList.add("item")
      //File/Directory Info
      const info = document.createElement("div")
      info.classList.add("info")
      const folder_open = document.createElement("img")
      folder_open.classList.add("icon")
      folder_open.classList.add("folder-icon")
      folder_open.src =
        "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAABgAAAAYCAYAAADgdz34AAAABmJLR0QA/wD/AP+gvaeTAAAAbklEQVRIie2PMQqAMAxFXwfP6qJVPIjYzcOKdUkhQ0BaCoLkLS3k818CjuN8ztApYzIDl7xvmalFsAIZuIFozKPMMrC0CAJwKIkuGVX5KdkmLEm3ci1JSlLKU49yLSmXVG1es0EANvnvInKcP/AA784fpjlWwNQAAAAASUVORK5CYII="
      const icon = document.createElement("img")
      icon.src = this.getIcon(item)
      icon.classList.add("icon")
      const title = document.createElement("textarea")
      title.rows = 1
      title.disabled = true
      title.autocomplete = "off"
      title.autocapitalize = "off"
      title.spellcheck = false
      title.innerText = item
      title.style.pointerEvents = "none"
      title.classList.add("title")
      const rename = document.createElement("img")
      rename.classList.add("icon")
      rename.classList.add("options-icon")
      rename.src =
        "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAABgAAAAYCAYAAADgdz34AAAABmJLR0QA/wD/AP+gvaeTAAABqUlEQVRIia3VO2hUQRTG8d+GEC0sRMVKU4naKAQrESEoWBiwshALtREsLQQRGytNt2CvaCPiI52NaK92NlG0kFXw1fgIanztWsy57ma5l52b3APDcGfO+X+z5357h2ZiD9oYa4i3JPZjAT1cbVrkCH4F/HfMV5oSOYW/AZ3FXg3+krMB6uL0wPqKRVrSy+xJrTlakrNPv13tOvBxXI/C75ipyDsXOT8wnQtfhTtRuCA5pyyOSW37g8O58DW4H/APmKrIOyS1pouTufB1eBTwDrZW5E1LLenhfC58Es+j6BM2V+RN4UvkXc6Fb8frKHqr2hFb8D72b8i05S58jKKH0ju4NCDSiryNeBHrDyQjjIwd+BpF85gY2Cv838ZaPI3nx3GIrJiNomJcGNovRN7F/AwbcuFwcUhgWGQCr2L9jWSE7GjhZYlA8TFr4Vo8f8bOOnDSv7MMXownMX/D7rpwuDlCoPjAHVwOfD0WR8C7OFEXPB7zceU+7uBuHOA27tUVKGJe/6Q/cQsHNHD1jUnuWJQ8fQabpItkNeb079zljiWxTfJ9Z4XQ/+MfA5yyJxzqcDgAAAAASUVORK5CYII="
      rename.onclick = e => {
        e.preventDefault()
        this.startEditing(title)
        return false
      }
      const add_file = document.createElement("img")
      add_file.classList.add("icon")
      add_file.classList.add("options-icon")
      add_file.src =
        "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAADAAAAAwCAYAAABXAvmHAAAABmJLR0QA/wD/AP+gvaeTAAABiElEQVRoge2YMU7DMBSGvwQJVO7CwN1YYEFUMAMdYCpHYUMcgg49A3SgEggGE2GskNh5frYr+ZOsppWS93+q9WIbKpWKD4fAHFgBH8BX4NgCt0CbOjiY8M8BYYfGkgwS8wjBs0qsrOKnwH7g/dkl7DkfGh4K+CfsotL7lz3f1SViCjTAnfPbA8oSMQUgg0RsAUgsoSEACSW0BCCRhFRgrA23KHcnqYD9Ijwjg4RU4MJ5RshYSIJ3SAVmwNM/AcfGuyR4h1QAjMQ58EL4cnyQxqO4279T4F0zywYjJlUgN1VgF4jRRkM5Ag5+PgcptY16U+IUajFLiA2RzpJSTqEGuHdqipfXqQT6wkeRSCEwFF4soS3gE14koS2wcGr0bWxEewRtgTf+hm2dmu5u7TW0gLbAFaZl3vA7PdyaLaalboBL++ZSX2R1P7Az+Ah8WtdTjtdV8RFYW9cnFCgxhuRcJ3R0RO18knOdIgQ6iannOkUIpGaLCT96Mrenn2USM+AYuAYeM2epDPINL56D04/lX9sAAAAASUVORK5CYII="
      add_file.onclick = () => {
        const input = document.createElement("input")
        input.type = "file"
        input.multiple = true

        input.onchange = () => {
          const path = info.dataset.path!.split("/")
          if (path[path.length - 1].indexOf(".") > -1) {
            path.pop()
          }
          this.uploadFiles(viewElement, path.join("/"), input.files!)
        }
        input.click()
        return false
      }
      const add_folder = document.createElement("img")
      add_folder.classList.add("icon")
      add_folder.classList.add("options-icon")
      add_folder.src =
        "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAABgAAAAYCAYAAADgdz34AAAABmJLR0QA/wD/AP+gvaeTAAAAvUlEQVRIie2UTQ7CIBBGnz8rb+Mt2hqv4TGMmt4Kexl7gUa3TXBRTAALQqGJJr5kNpR+r8ykwJ9vogJaQDrqlCrwhWeRfAoPrRYo5xRI4OYTpGLkLDMEevl9wXqGzC2wH3uQa8gGOVpUAALoVAmGW+GNKSc44v4XLqmCwgpcqfVeWzNOEisQAYJGfyHkspPARu3vrGCbHrjrQz4oSSiLiL2TuBLZoljKAMEuRQBwxj2rOjX8RcXQioeqBu3Ln4QChU8M4+FlAAAAAElFTkSuQmCC"
      add_folder.onclick = () => {
        const input = document.createElement("input")
        input.type = "file"
        input.multiple = true
        input.webkitdirectory = true

        input.onchange = () => {
          const path = info.dataset.path!.split("/")
          if (path[path.length - 1].indexOf(".") > -1) {
            path.pop()
          }
          this.uploadDirectory(viewElement, path.join("/"), input.files!)
        }
        input.click()
        return false
      }
      const delete_file = document.createElement("img")
      delete_file.classList.add("icon")
      delete_file.classList.add("options-icon")
      delete_file.src =
        "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAADAAAAAwCAYAAABXAvmHAAAABmJLR0QA/wD/AP+gvaeTAAABdElEQVRoge2YsU7DMBRFDwxlgb0wlB9BLMDXtFvhE2BAogNDxR+1S+ETEBJiLqVSU6lVGOwoJsQhDnEc0DvSU63c+OXeuElVgyAIddMBBsAUWOqaAH2ttZoj4AmILfWoz2kleyiDNvNJzWjpSgxITUbAEDjUdamPJXo/kMdCpqQGhzn6laFPGvRVmg9Sg90cvWvoiyYM3QArfv5O+64VcG0zuVNwfAHsu+f2whI4yBN2LRNi4B714IUmQnnJxbYCecQV57ngfA3bCvwZJEBoJECGO9R7+9ZRawTzx8XGWutrR83lGl+o+zVadM5v5+ciz0BoJEBoJEBoJEBoJEBoJEBoJECGKPNZVqtM3QFGqD2ckaNWGdlWCY1LgK0x9rG/b/bcWs/K4BLgzRifOMwry6kxfvXQnwfSP9zPwDn1rEQHuNA9k/7jGvp+4xh4x21rvErNgZ6PAKDuus8Qc+DMl/mEHmqJX4BNDaY3utcYj3deEP4rn4hExm+tmh+HAAAAAElFTkSuQmCC"
      delete_file.onclick = () => {
        this.app.files.removeFile(info.dataset.path!)
        new_div.parentElement!.removeChild(new_div)
        return false
      }

      info.appendChild(folder_open)
      info.appendChild(icon)
      info.appendChild(title)
      info.appendChild(rename)
      info.appendChild(add_file)
      info.appendChild(add_folder)
      info.appendChild(delete_file)

      info.addEventListener("mousedown", e => {
        if (e.target == info) {
          const drag = info as DraggableDiv
          drag.mouseDown = true
          drag.totalMovementX = 0
          drag.totalMovementY = 0
        }
        viewElement
          .querySelector(".info.selected")
          ?.classList.remove("selected")
        info.classList.add("selected")
        this.changeSelectState(viewElement)
      })

      window.addEventListener("mousemove", e => {
        const drag = info as DraggableDiv
        if (drag.mouseDown) {
          drag.totalMovementX += e.movementX
          drag.totalMovementY += e.movementY
          let info2: HTMLDivElement = viewElement.querySelector(".drag-copy")!
          if (!info2) {
            if (
              Math.abs(drag.totalMovementX) + Math.abs(drag.totalMovementY) >
              8
            ) {
              viewElement.addEventListener("mousemove", this.dragHandler!)
              info2 = new_div.cloneNode(true) as HTMLDivElement
              info2.style.position = "fixed"
              const bounds = info.getBoundingClientRect()
              info2.style.top = bounds.top + drag.totalMovementY + "px"
              info2.style.left = bounds.left + drag.totalMovementX + "px"
              info2.style.width = bounds.width + "px"
              info2.style.boxShadow = "3px 3px 3px #222"
              info2.classList.add("drag-copy")
              if (info2.querySelector(".children"))
                info2.removeChild(info2.querySelector(".children")!)
              viewElement.appendChild(info2)
            } else {
              return
            }
          }
          info2.style.top =
            parseFloat(info2.style.top.slice(0, -2)) + e.movementY + "px"
          info2.style.left =
            parseFloat(info2.style.left.slice(0, -2)) + e.movementX + "px"
        }
      })

      window.addEventListener("mouseup", () => {
        const drag = info as DraggableDiv
        if (drag.mouseDown) {
          drag.mouseDown = false
          const drags = Array.from(viewElement.querySelectorAll(".drag-copy"))
          drags.forEach(x => viewElement.removeChild(x))
          viewElement.removeEventListener("mousemove", this.dragHandler!)
          if (
            Math.abs(drag.totalMovementX) + Math.abs(drag.totalMovementY) >
            8
          ) {
            this.app.files.move(info.dataset.path!, this.highlightedPath)
            const prefix1 = info.dataset.path!.split("/").slice(0, -1).join("/")
            const prefix2 = this.highlightedPath
            this.reloadView(viewElement, prefix1)
            this.reloadView(viewElement, prefix2)
            viewElement.querySelector(".outlined")?.classList.remove("outlined")
            this.highlightedPath = ""
          }
        }
      })

      new_div.appendChild(info)

      if (fileTree[item] instanceof File) {
        info.removeChild(folder_open)
        info.dataset.path = path + "/" + item
        if (
          this.dirOptions.accepted_file_types!.length > 0 &&
          !this.dirOptions.accepted_file_types!.includes(item.split(".").pop()!)
        ) {
          info.classList.add("disabled")
        }
        items.push(new_div)
      } else {
        info.removeChild(icon)
        const new_children = this.createDiv(
          viewElement,
          fileTree[item] as FileTree,
          (path ? path + "/" : "") + item
        )
        const children = document.createElement("div")
        children.classList.add("children")
        new_children.forEach(c => children.appendChild(c))
        new_div.appendChild(children)
        new_div.classList.add("folder")
        new_div.classList.add("collapsed")
        info.dataset.path = (path ? path + "/" : "") + item
        info.onclick = e => {
          viewElement
            .querySelector(".info.selected")
            ?.classList.remove("selected")
          info.classList.add("selected")
          const icon = e.target as HTMLElement
          if (!icon?.classList.contains("options-icon"))
            info.parentElement!.classList.toggle("collapsed")
          this.changeSelectState(viewElement)
        }
        items.push(new_div)
      }
      info.ondblclick = () => {
        this.confirm(viewElement)
      }
    }
    return items
  }

  confirm(viewElement: HTMLDivElement) {
    const selected: HTMLElement | null =
      viewElement.querySelector(".info.selected")
    const confirm = viewElement.querySelector(
      "button.confirm"
    ) as HTMLButtonElement
    const path = selected?.dataset.path
    confirm.disabled = true
    if (!path) return
    if (this.dirOptions.accepted_file_types!.includes(path.split(".").pop()!)) {
      this.dirOptions.callback?.(path)
      window.removeEventListener("keydown", this.keyHandler!, true)
      window.removeEventListener("drop", this.dropHandler!, true)
      this.closeWindow()
    }
  }

  getIcon(name: string): string {
    if (name.indexOf(".") == -1) {
      return "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAABgAAAAYCAYAAADgdz34AAAABmJLR0QA/wD/AP+gvaeTAAAAY0lEQVRIiWNgGAWDCXgwMDA8ZmBg+I8DN1BqwSM8hlPFEpgh2EA4AwPDbyIc8B/qUA9SLSDHEpItIBagmMNEBQPxglELRi0YtQDVgsdQmpiiAB9GNgsFeDAQV6KSXdiNgoEBAG+iU6T/ixEpAAAAAElFTkSuQmCC"
    }
    const type = name.split(".").at(-1)!
    if (
      ["bmp", "gif", "jpeg", "jpg", "png", "tif", "tiff", "webp"].includes(type)
    ) {
      return "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAACAAAAAgCAYAAABzenr0AAAABmJLR0QA/wD/AP+gvaeTAAAB8UlEQVRYhd3WTYjNURjH8c9IozRlwUITTbMRNlNWxksWjKxkYbJQY6mUTCKxmDSkZiezm421KQsRFkgpL7Eg2Si3RJOFl5SIzVicc5t7p/9xz//O/5r41el2nnOe83zv8/zPC4usrgLbBPrbXO8DTuHHQgBm8QjvSwZfg0HcxV58L+nfBDDcht9w9P2IO1ie47SkjUCttBMDuIWexQB4gV3YiJutIDoB0AixoRVEpwCyIaoE+BV/Zxvac6zCdlwoclpaIcBt7EN3wdhxrO40wE9cS4wlt3Unv4EslQE4g5nYTlcFkFuCAxjH2dg/hzeY/lsAQ7iH87G/A7sbAPqFe6VWFiC3BDXheF0v7OsBIQOwEvdxpWzwlIouox48Mbe/H0dbF67jU7RvSaw5LVGu3Ax8w9aGti3aTmCPcP0+xdHM9f6o1HXcHQPXoQeF0+9k7I/Efm+BbzIDZQDG4tjLGOwtbph71CwTXkTjZQByS7ACo5jCK1yOgQ9FKMJJOIXDEaZtFWVgDF8iCKxDX4Fvr1CGkXn2BWWg/u8v4mu0vRZKMF8zuIpjGetmA4zGeZcy15zEJukt2aSck/CIkIXPmQB1HcTDKgD2S9zlLfQsZ1IOwIM2gmfrn3oP/J8AqW9gc8Vx1uJd7uSa5qd1VW2iKNhvOK12/OBuEgoAAAAASUVORK5CYII="
    }
    if (
      [
        "aac",
        "mid",
        "midi",
        "mp3",
        "oga",
        "ogg",
        "opus",
        "wav",
        "webm",
        "weba",
        "flac",
        "aiff",
      ].includes(type)
    ) {
      return "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAADAAAAAwCAYAAABXAvmHAAAABmJLR0QA/wD/AP+gvaeTAAADFElEQVRoge2ZzWsTQQDFf200qVrBUBAURU/aVgTFSvUoXsQqgoIUFDx68SKieBILeujJFhH/AD0VRBD8REHBD/zCIqUm6kG0UqltE0FFqqkedif7Nuymm2bTbWUfLLy8+dj3kpndmQnEiBEjxv+KDuAx8BroBlLR2qkMx4BJ4K9c5yN1FBD1QA9u4+bKVdjXPOA6kAf2h+jRFymgD7fp+yWfK0GztPsKNIbm1ANp4AFus31YoaYbIAG8l7YnwzJbiuVAP26jvVjDCaYfAOCQtB0FFldrthTrgSG5ySTWBFYEDbAHa7zfBBpsLQFkpf2JUFzb2Gbf0HT+C+j0qBc0wFWpd1j0g6K/qc6yg04sw6bjPFYgLwQNcETqZXGGYAoYk7JN5TpZAHRhTZ4/JTf3u4awhpIfggZYhDXOTd1dUnZR9HPlzD8MaNpcA8DKKYxVMonPSN3Lom8V/aNf464KjBewXjLpAKa8AqSAO8AXYIfoLVI3DyRtvQ4YlrIVXjfSZ+5xYH4Ac0HgFaBNtIxt0GBAyraLrpN8rxHrpcJq4b3A7+q9+2IQ+GHztcAWKbstXCfsE+HthmiAhPCJKg1OhZ/ANfm8U/hL4RuFPxfeYogGmGlcEd4uvF/4GuHDwpsMiTKAvpTU6IhwfUiMCm/CA9WsWcrBr99G0b+JnsDZS+RK9IKtF0NG+Qso6ny435dZ1KMMsEr4uPAlOCHyoqdx/BbrRxmgWXhW+FLhOoR03M+KAPuEPxW+Qfhb4cuEjxmiAQrCk9QWC4Hd8vmGcH15vRK+WfigIRrgg/Cj1DZEK84eN4P7F9C10Qvh+rZ+5tXpaWZuMZcE7mI9DvUt3Cp1c7i/xM9S5rmYmw3L6bNS95Lo7aJ/KtdBA3AKeEc0GxrdeXVI2QXRfTc0laDWW8oMzvxM4t6ptVVjXDFTm/oDooe2qTcI+1glB9zCfaySkfahHqsYzOmDLYM5fbRoEPbh7jppN0KND3cNyh2vj5dp54UkcA/4jvfDoabw+oOjZ5p9Rbbg7AAeYT1Fuqn9AjFGjBgxIsA/jvJ6jenUZ2YAAAAASUVORK5CYII="
    }
    if (["sm", "ssc"].includes(type))
      return "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAEAAAABACAYAAACqaXHeAAAAAXNSR0IArs4c6QAAAcpJREFUeF7tmFGOwkAMQ+H+h95V2S2qqlKcsZ101PADQpPEfnFHgufj5q/nzf0/GkAn4OYE+hG4eQD6EuxHIOER+CFnWJdkbf5vfAEwOoephbiPCoOaN4A/AswWmVpoSZ0ACBN3iNkiUwup7gRAmLhDzBaZWkh1JwDCxB1itsjUQqo7ARAm7hCzRaYWUq1KwJlQxoSr7xuOAsD2x85RPweAbzOh7S+HWACrkKXP9vNWgBoAMjMFwJHhT9+Ngt7DQ2faAXza9vrjZ5suVQIiM60AzoSsg/cxZRMQnWkDgAjZQ2DumuhlF9H30hnZTLj5ycWIbsg+EwUwIgQ16TgH60UAwM0cToiekG4EwNHNTuhKKYXMZ9wBKW53Q2DzUQAzJCFkfgTAlSGEzY8CuCKEIfMMgCtBGDbPArgCBMq8AkAlBNq8CkAFBIl5JYBMCDLzagAZEKTmHQCcEOTmXQAcECzmnQCUEGzm3QAUEKzmMwAwEOzmswCMQEgxnwkgAiHNfDYABEKq+QoAZxDSzVcBOIJQYr4SwBbC8rlMC/qv8CpS/V62+VLqaopMv+oEMNoltQ1AgnHiJp2AiZcnkd4JkGCcuEknYOLlSaT/AqRIb0Fn6qw5AAAAAElFTkSuQmCC"
    return "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAEAAAABACAYAAACqaXHeAAAABmJLR0QA/wD/AP+gvaeTAAAA+UlEQVR4nO2awQqCQBgGv6KeM+rU+1/L7F4RreY/W86ABw/ujsMPImwiIiLSwlh0XZIcit6piaoAY5JbknPNa31OZYAuI1QH6C7Co9zS63cXgQrQTYTqAMOL+9MC+35MdYBjniOgk1AdIOksAhEg6SgCFSDpJAIZIOkgAvkZfHcNmfDvsJkoOHeNlvVbuCbZtzzwbwGSRp/tzM1+nh0t8ILWiZo1MaufAAPQAjQGoAVoDEAL0BiAFqAxAC1AYwBagMYAtACNAWgBGgPQAjQGoAVoDEAL0BiAFqAxAC1AYwBagMYAtADNN84HLHFOqIzVT4ABaAERERGOO8QV911rDPw7AAAAAElFTkSuQmCC"
  }

  startEditing(title: HTMLTextAreaElement) {
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
      this.app.files.rename(orig_path, title.value)
      if (title.value.length > 32)
        title.value = title.value.slice(0, 32) + "..."
    })
  }

  textAreaKeyHandler(event: KeyboardEvent) {
    if (event.code == "Enter") {
      event.preventDefault()
      event.stopImmediatePropagation()
      ;(<HTMLElement>event.target)?.blur()
    }
  }

  uploadDirectory(
    viewElement: HTMLDivElement,
    prefix: string,
    files: FileList
  ) {
    this.app.files.parseFiles(prefix, files)
    this.reloadView(viewElement, prefix)
    this.searchForAcceptableFile(viewElement, prefix)
  }

  uploadFiles(viewElement: HTMLDivElement, prefix: string, files: FileList) {
    for (const file of files) {
      this.app.files.addFile(prefix + "/" + file.name, file)
    }
    this.reloadView(viewElement, prefix)
    this.searchForAcceptableFile(viewElement, prefix)
  }

  reloadView(viewElement: HTMLDivElement, prefix: string) {
    let scroll = viewElement
      .querySelector(".dir-selector")
      ?.querySelector("div[data-path='" + this.escapeSelector(prefix) + "']")
      ?.parentElement?.querySelector(".children")
    if (prefix == "" || !scroll) {
      scroll = viewElement.querySelector(".dir-selector")!
    }
    const collapseCache = []
    for (const child of scroll.querySelectorAll(".folder:not(.collapsed)")) {
      const info: HTMLElement | null = child.querySelector(".info")
      collapseCache.push(info!.dataset.path!)
    }
    scroll.replaceChildren(
      ...this.createDiv(
        viewElement,
        this.app.files.getFilesAtPath(prefix),
        prefix
      )
    )
    for (const cache of collapseCache) {
      viewElement
        .querySelector(".dir-selector")
        ?.querySelector("div[data-path='" + this.escapeSelector(cache) + "']")
        ?.parentElement!.classList.remove("collapsed")
    }
  }

  searchForAcceptableFile(viewElement: HTMLDivElement, prefix: string) {
    let suggested = ""
    for (const file in this.app.files.files) {
      if (
        file.startsWith(prefix) &&
        this.dirOptions.accepted_file_types!.includes(file.split(".").pop()!)
      ) {
        suggested = file
      }
    }
    this.select(viewElement, suggested)
  }

  private escapeSelector(selector: string) {
    return selector.replaceAll(/'/g, "\\'")
  }
}
