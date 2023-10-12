import { Simfile } from "../chart/sm/Simfile"
import { FileHandler } from "./file-handler/FileHandler"

interface RecentFileEntry {
  name: string
  path: string
}

export class RecentFileHandler {
  private static _model?: RecentFileEntry[]
  private static async getModel() {
    if (!this._model) await this._load()
    return this._model!
  }
  private static async _load() {
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
    } catch {
      console.log("Failed to load recent file entries")
      return
    }
    await this.saveEntries()
  }

  public static async getRecents() {
    return await this.getModel()
  }

  public static async addSM(path: string, sm: Simfile) {
    const model = await this.getModel()
    // Remove the old entry
    const idx = model.findIndex(entry => entry.path == path)
    if (idx != -1) model.splice(idx, 1)
    model.unshift({
      name: sm.properties.TITLE ?? "Untitled Song",
      path,
    })
    this.saveEntries()
  }

  private static async limitEntries() {
    ;(await this.getModel()).splice(15)
  }

  private static async saveEntries() {
    this.limitEntries()
    const results = await Promise.all(
      this._model!.map(async entry => await FileHandler.hasFile(entry.path))
    )
    this._model = this._model!.filter((_v, index) => results[index])
    localStorage.setItem("recentFiles", JSON.stringify(this._model))
  }
}
