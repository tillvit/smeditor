import type { App } from "../App"
import { EventHandler } from "./EventHandler"

export interface UndoableAction {
  action: (app?: App) => void
  undo: (app?: App) => void
  redo?: (app?: App) => void
}

export class ActionHistory {
  private items: UndoableAction[] = []
  private itemIndex = 0
  private limit = 0
  private readonly app?: App
  static instance: ActionHistory

  constructor(app?: App) {
    this.app = app
    if (!ActionHistory.instance) ActionHistory.instance = this
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
    this.limit = 0
    this.items = []
  }

  canUndo(): boolean {
    return this.itemIndex > 0
  }

  canRedo(): boolean {
    return this.itemIndex != this.items.length
  }

  setLimit() {
    this.limit = this.itemIndex
  }

  isDirty(): boolean {
    return this.itemIndex != this.limit
  }

  merge(n: number) {
    const items = this.items.splice(-n)
    const reversed = items.reverse()
    this.itemIndex -= n
    this.run({
      action: () => {},
      redo: app => {
        items.forEach(item => item.action(app))
      },
      undo: app => {
        reversed.forEach(item => item.undo(app))
      },
    })
  }
}
