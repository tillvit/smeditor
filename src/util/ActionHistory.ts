import { App } from "../App"
import { EventHandler } from "./EventHandler"

interface UndoableAction {
  action: (app: App) => void
  undo: (app: App) => void
  redo?: (app: App) => void
}

export class ActionHistory {
  private items: UndoableAction[] = []
  private itemIndex = 0
  private app: App
  static instance: ActionHistory

  constructor(app: App) {
    this.app = app
    ActionHistory.instance = this
  }

  run(action: UndoableAction) {
    action.action(this.app)
    this.items.splice(
      this.itemIndex,
      this.items.length - this.itemIndex,
      action
    )
    this.itemIndex++
  }

  undo() {
    if (!this.items[this.itemIndex - 1]) return
    this.items[this.itemIndex - 1].undo(this.app)
    this.itemIndex--
    EventHandler.emit("undo")
  }

  redo() {
    if (!this.items[this.itemIndex]) return
    if (this.items[this.itemIndex].redo)
      this.items[this.itemIndex].redo!(this.app)
    else this.items[this.itemIndex].action(this.app)
    this.itemIndex++
    EventHandler.emit("redo")
  }

  reset() {
    this.itemIndex = 0
    this.items = []
  }

  canUndo(): boolean {
    return this.itemIndex != 0
  }

  canRedo(): boolean {
    return this.itemIndex != this.items.length
  }
}
