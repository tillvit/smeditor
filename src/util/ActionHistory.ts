import { App } from "../App"

interface UndoableAction {
  action: (app: App) => void,
  undo: (app: App) => void,
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
    this.items.splice(this.itemIndex, this.items.length - this.itemIndex, action)
    this.itemIndex++
  }

  undo() {
    if (!this.items[this.itemIndex - 1]) return
    this.items[this.itemIndex - 1].undo(this.app)
    this.itemIndex--
  }
}