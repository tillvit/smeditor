import { Simfile } from "../chart/sm/Simfile"
import { FileHandler } from "./FileHandler"

interface RecentFileEntry {
  name: string
  path: string
}

export class RecentFileHandler {
  private static _model?: RecentFileEntry[]
  private static get model() {
    if (!this._model) this._load()
    return this._model!
  }
  private static _load() {
    this._model = []
    const data = localStorage.getItem("recentFiles")
    if (!data) return
    try {
      const arr = JSON.parse(data)
      if (!Array.isArray(arr)) return
      // parse each entry
      for (const entry of arr) {
        if (typeof entry != "object" || Array.isArray(entry)) continue
        if (typeof entry?.name != "string" || typeof entry?.path != "string")
          continue
        if (this._model.find(e => e.path == entry.path)) continue

        this._model.push({
          name: entry.name,
          path: entry.path,
        })
      }
      this.saveEntries()
    } catch {
      return
    }
  }

  public static getRecents() {
    return this.model
  }

  public static addSM(path: string, sm: Simfile) {
    const model = this.model
    // Remove the old entry
    const idx = model.findIndex(entry => entry.path == path)
    if (idx != -1) model.splice(idx, 1)
    this.model.unshift({
      name: sm.properties.TITLE ?? "Untitled Song",
      path,
    })
    this.saveEntries()
  }

  private static limitEntries() {
    this.model.splice(15)
  }

  private static saveEntries() {
    this.limitEntries()
    this._model = this._model!.filter(entry => {
      return FileHandler.getFileHandle(entry.path).then(file => {
        if (file == undefined) return false
        return true
      })
    })
    localStorage.setItem("recentFiles", JSON.stringify(this._model))
  }
}
