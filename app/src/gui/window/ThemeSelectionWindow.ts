import { showOpenFilePicker } from "file-system-access"
import { App } from "../../App"
import { DEFAULT_THEMES, THEME_GRID_PROPS } from "../../data/ThemeData"
import { Options } from "../../util/Options"
import { basename } from "../../util/Path"
import { Themes } from "../../util/Theme"
import { WaterfallManager } from "../element/WaterfallManager"
import { Icons } from "../Icons"
import { ConfirmationWindow } from "./ConfirmationWindow"
import { ThemeEditorWindow } from "./ThemeEditorWindow"
import { Window } from "./Window"

export class ThemeSelectionWindow extends Window {
  app: App

  private grid!: HTMLDivElement
  private actions: Record<string, HTMLButtonElement> = {}

  constructor(app: App) {
    super({
      title: "Themes",
      width: 600,
      height: 400,
      disableClose: false,
      win_id: "theme-selection",
      blocking: false,
    })
    this.app = app

    this.initView()
    this.loadGrid()
  }

  initView(): void {
    // Create the window
    this.viewElement.replaceChildren()

    //Padding container
    const padding = document.createElement("div")
    padding.classList.add("padding")

    const searchContainer = document.createElement("div")
    searchContainer.classList.add("pref-search")

    const searchBar = document.createElement("input")
    searchBar.classList.add("pref-search-bar")
    searchBar.type = "text"
    searchBar.placeholder = "Search for a theme..."

    searchBar.oninput = () => {
      this.filterGrid(searchBar.value)
    }
    searchContainer.appendChild(searchBar)

    const grid = document.createElement("div")
    grid.classList.add("theme-grid")
    this.grid = grid

    const optionTray = this.createOptionTray()

    padding.replaceChildren(searchContainer, grid, optionTray)

    this.viewElement.appendChild(padding)
  }

  createOptionTray() {
    const optionTray = document.createElement("div")
    optionTray.classList.add("theme-tray")

    const add = document.createElement("button")
    add.appendChild(Icons.getIcon("PLUS", 16))
    add.appendChild(document.createTextNode("New"))
    add.onclick = () => {
      const themeName = this.getNonConflictingName("new-theme")
      Themes.createUserTheme(themeName)
      Themes.loadTheme(themeName)
      this.loadGrid()
    }
    this.actions.add = add
    optionTray.appendChild(add)

    const copy = document.createElement("button")
    copy.appendChild(Icons.getIcon("COPY", 16))
    copy.appendChild(document.createTextNode("Duplicate"))
    copy.onclick = () => {
      const themeName = this.getNonConflictingName(Options.general.theme)
      Themes.createUserTheme(themeName, Themes.getCurrentTheme())
      Themes.loadTheme(themeName)
      this.loadGrid()
    }
    copy.disabled = true
    this.actions.copy = copy
    optionTray.appendChild(copy)

    const edit = document.createElement("button")
    edit.classList.add("confirm")
    edit.appendChild(Icons.getIcon("EDIT", 16))
    edit.appendChild(document.createTextNode("Edit"))
    edit.onclick = () => {
      this.closeWindow()
      this.app.windowManager.openWindow(new ThemeEditorWindow(this.app))
    }
    edit.disabled = true
    this.actions.edit = edit
    optionTray.appendChild(edit)

    const del = document.createElement("button")
    del.classList.add("delete")
    del.appendChild(Icons.getIcon("TRASH", 16))
    del.appendChild(document.createTextNode("Delete"))
    del.onclick = () => {
      this.app.windowManager.openWindow(
        new ConfirmationWindow(
          this.app,
          "Delete theme",
          "Are you sure you want to delete this theme?",
          [
            {
              type: "default",
              label: "Cancel",
            },
            {
              type: "delete",
              label: "Delete",
              callback: () => {
                Themes.deleteUserTheme(Options.general.theme)
                this.loadGrid()
              },
            },
          ]
        )
      )
    }
    del.disabled = true
    this.actions.del = del
    optionTray.appendChild(del)

    const imp = document.createElement("button")
    imp.appendChild(Icons.getIcon("UPLOAD", 16))
    imp.appendChild(document.createTextNode("Import"))
    imp.onclick = async () => {
      const fileHandlers = await showOpenFilePicker({
        _preferPolyfill: false,
        excludeAcceptAllOption: false,
        multiple: true,
        accepts: [{ extensions: ["txt"] }],
      })
      fileHandlers.forEach(handle => {
        handle
          .getFile()
          .then(file => file.text())
          .then(text => {
            const theme = Themes.parseThemeText(text)
            let themeName = basename(handle.name, ".txt")
            if (!theme) {
              WaterfallManager.createFormatted(
                "Failed to load theme " + themeName,
                "error"
              )
              return
            }
            themeName = this.getNonConflictingName(themeName)
            Themes.createUserTheme(themeName, theme)
            this.loadGrid()
          })
      })
    }
    this.actions.imp = imp
    optionTray.appendChild(imp)

    const exp = document.createElement("button")
    exp.appendChild(Icons.getIcon("DOWNLOAD", 16))
    exp.appendChild(document.createTextNode("Export"))
    exp.onclick = () => {
      const str = Themes.exportCurrentTheme({ spaces: true })
      const file = new File([str], Options.general.theme + ".txt", {
        type: "text/plain",
      })
      const a = document.createElement("a")
      const url = URL.createObjectURL(file)

      a.href = url
      a.download = file.name
      document.body.appendChild(a)
      a.click()
      document.body.removeChild(a)
      window.URL.revokeObjectURL(url)
    }
    this.actions.exp = exp
    exp.disabled = true
    optionTray.appendChild(exp)

    return optionTray
  }

  loadGrid() {
    this.grid.replaceChildren()

    const themes = Themes.getThemes()
    if (!themes) return

    for (const [id, theme] of Object.entries(themes)) {
      let currentId = id
      const isDefault = DEFAULT_THEMES[id] !== undefined

      const container = document.createElement("div")
      const title = document.createElement("div")
      title.classList.add("inlineEdit")
      if (!isDefault) {
        title.contentEditable = "true"
        let lastValue = id
        title.onfocus = () => {
          lastValue = title.innerText
        }
        title.onkeydown = e => {
          if (e.key == "Enter") {
            title.blur()
            e.preventDefault()
          }
          if (e.key == "Escape") {
            title.innerText = lastValue
            title.blur()
            e.stopImmediatePropagation()
          }
        }
        title.onblur = () => {
          if (title.innerText == lastValue) return
          const newName = this.getNonConflictingName(title.innerText)
          Themes.renameUserTheme(lastValue, newName)
          Themes.loadTheme(newName)
          title.innerText = newName
          currentId = newName
          container.dataset.id = newName
        }
      } else {
        title.style.fontWeight = "bold"
      }

      const colorGrid = document.createElement("div")
      colorGrid.classList.add("theme-preview-grid")

      for (const prop of THEME_GRID_PROPS) {
        const cell = document.createElement("div")
        cell.style.backgroundColor = theme[prop].toHex()
        colorGrid.appendChild(cell)
      }

      title.innerText = id

      container.classList.add("theme-cell")
      title.classList.add("theme-title")

      container.replaceChildren(title, colorGrid)
      this.grid.appendChild(container)

      if (id == Options.general.theme) {
        container.classList.add("selected")
        setTimeout(() => {
          container.scrollIntoView({
            behavior: Options.general.smoothAnimations ? "smooth" : "instant",
            block: "center",
          })
        })
        this.actions.edit.disabled = isDefault
        this.actions.del.disabled = isDefault
        this.actions.copy.disabled = false
        this.actions.exp.disabled = false
      }

      container.dataset.id = id

      container.onclick = () => {
        if (Options.general.theme == currentId) return
        Themes.loadTheme(currentId)
        this.removeAllSelections()
        container.classList.add("selected")

        this.actions.edit.disabled = isDefault
        this.actions.del.disabled = isDefault
        this.actions.copy.disabled = false
        this.actions.exp.disabled = false
      }
    }
  }

  removeAllSelections() {
    ;[...this.grid.querySelectorAll(".selected")].forEach(e =>
      e.classList.remove("selected")
    )
  }

  filterGrid(query: string) {
    ;[...this.grid.children].forEach(element => {
      if (!(element instanceof HTMLDivElement)) return
      const div: HTMLDivElement = element
      const shouldDisplay = this.containsQuery(query, div.dataset.id)
      div.style.display = shouldDisplay ? "" : "none"
    })
  }

  containsQuery(query: string, string: string | undefined) {
    if (!string) return false
    return string.toLowerCase().includes(query.trim().toLowerCase())
  }

  getNonConflictingName(base: string) {
    const themes = Themes.getThemes()
    if (themes[base] == undefined) return base

    let i = 2
    const m = /([^]+)-(\d+)$/.exec(base)

    if (m) {
      base = m[1]
      i = parseInt(m[2])
    }
    let name = `${base}-${i}`
    while (themes[name] !== undefined) {
      name = `${base}-${i}`
      i++
    }
    return name
  }
}
