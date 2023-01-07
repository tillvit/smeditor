import { App } from "../App"

interface UndoableAction {
  action: (app: App) => void
  undo: (app: App) => void
  redo?: (app: App) => void
}

export class ActionHistory {
  private items: UndoableAction[] = []
  private itemIndex = 0
  private app: App

  constructor(app: App) {
    this.app = app
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
  }

  redo() {
    if (!this.items[this.itemIndex]) return
    if (this.items[this.itemIndex].redo)
      this.items[this.itemIndex].redo!(this.app)
    else this.items[this.itemIndex].action(this.app)
    this.itemIndex++
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
