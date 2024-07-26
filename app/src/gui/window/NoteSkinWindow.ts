import { App } from "../../App"
import { NoteskinRegistry } from "../../chart/gameTypes/noteskin/NoteskinRegistry"
import { EventHandler } from "../../util/EventHandler"
import { Options } from "../../util/Options"
import { Window } from "./Window"

import placeholderPreview from "../../../assets/preview.png"

export class NoteskinWindow extends Window {
  app: App

  private grid!: HTMLDivElement
  private lastGameType: string | null = null

  constructor(app: App) {
    super({
      title: "Noteskin Selection",
      width: 600,
      height: 400,
      disableClose: false,
      win_id: "noteskin-selection",
      blocking: false,
    })
    this.app = app

    this.initView()
    this.loadGrid()

    EventHandler.on("chartLoaded", () => {
      const gameType = app.chartManager.loadedChart!.gameType.id
      if (this.lastGameType != gameType) {
        this.loadGrid()
      }
    })
  }

  initView(): void {
    // Create the window
    this.viewElement.replaceChildren()

    //Padding container
    const padding = document.createElement("div")
    padding.classList.add("padding")

    const searchBar = document.createElement("input")
    searchBar.classList.add("pref-search-bar")
    searchBar.type = "text"
    searchBar.placeholder = "Search for a noteskin..."

    searchBar.oninput = () => {
      this.filterGrid(searchBar.value)
    }

    const grid = document.createElement("div")
    grid.classList.add("noteskin-grid")
    this.grid = grid

    padding.replaceChildren(searchBar, grid)

    this.viewElement.appendChild(padding)
  }

  loadGrid() {
    this.grid.replaceChildren()
    if (!this.app.chartManager.loadedChart) return
    const gameType = this.app.chartManager.loadedChart.gameType
    this.lastGameType = gameType.id
    const noteskins = NoteskinRegistry.getNoteskins().get(gameType.id)
    if (!noteskins) return
    for (const [id, options] of noteskins.entries()) {
      const container = document.createElement("div")
      const image = document.createElement("img")
      const labelContainer = document.createElement("div")
      const title = document.createElement("div")
      const subtitle = document.createElement("div")

      container.classList.add("noteskin-cell")
      labelContainer.classList.add("noteskin-label")
      title.classList.add("noteskin-title")
      subtitle.classList.add("noteskin-subtitle")

      title.innerText = options.title ?? id
      subtitle.innerText = options.subtitle ?? "subtitle"

      image.src = NoteskinRegistry.getPreviewUrl(gameType, id)
      image.onerror = () => {
        image.src = placeholderPreview
      }

      container.replaceChildren(image, labelContainer)
      labelContainer.replaceChildren(title, subtitle)

      if (id == Options.chart.noteskin.name) container.classList.add("selected")
      this.grid.appendChild(container)

      container.dataset.id = id
      container.dataset.title = options.title ?? ""
      container.dataset.subtitle = options.subtitle ?? ""

      container.onclick = () => {
        if (Options.chart.noteskin.name == id) return
        this.app.chartManager.chartView?.swapNoteskin(id)
        this.removeAllSelections()
        container.classList.add("selected")
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
      const shouldDisplay =
        this.containsQuery(query, div.dataset.id) ||
        this.containsQuery(query, div.dataset.title) ||
        this.containsQuery(query, div.dataset.subtitle)
      div.style.display = shouldDisplay ? "" : "none"
    })
  }

  containsQuery(query: string, string: string | undefined) {
    if (!string) return false
    return string.toLowerCase().includes(query.trim().toLowerCase())
  }
}
