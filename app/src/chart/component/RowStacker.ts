import bezier from "bezier-easing"
import { DisplayObject } from "pixi.js"
import { BezierAnimator } from "../../util/BezierEasing"
import { Options } from "../../util/Options"
import { ChartRenderer } from "../ChartRenderer"

interface StackedSide {
  items: {
    object: StackableObject
    priority: number
    x: number | null
    width?: number
    beat: number
    second: number
    registerTime?: number
  }[]
}

interface StackedRow {
  left: StackedSide
  right: StackedSide
}

type StackableObject = DisplayObject & { width: number }

export class RowStacker {
  static instance: RowStacker

  renderer
  rows = new Map<string, StackedRow>()
  objectMap = new Map<
    StackableObject,
    { key: string; animationId?: string; align: string }
  >()

  constructor(renderer: ChartRenderer) {
    this.renderer = renderer
    RowStacker.instance = this
  }

  register(
    object: StackableObject,
    beat: number,
    second: number,
    align: "left" | "right",
    priority: number,
    animate = false
  ) {
    const key = Math.round(beat * 48) + ":" + second.toFixed(3)
    if (!this.rows.has(key)) {
      this.rows.set(key, {
        left: { items: [] },
        right: { items: [] },
      })
    }
    const row = this.rows.get(key)!
    if (align === "left") {
      row.left.items.push({
        object,
        priority,
        x: animate ? 0 : null,
        beat,
        second,
        registerTime: animate ? undefined : Date.now(),
      })
      row.left.items.sort((a, b) => a.priority - b.priority)
    } else {
      row.right.items.push({
        object,
        priority,
        x: animate ? 0 : null,
        beat,
        second,
        registerTime: animate ? undefined : Date.now(),
      })
      row.right.items.sort((a, b) => a.priority - b.priority)
    }
    this.objectMap.set(object, { key, align })

    object.on("destroyed", () => {
      this.deregister(object)
    })
    object.on("removed", () => {
      this.deregister(object)
    })
    this.updateX(key)
  }

  deregister(object: StackableObject) {
    const data = this.objectMap.get(object)
    if (!data?.key) return
    BezierAnimator.stop(data.animationId)
    this.objectMap.delete(object)
    const row = this.rows.get(data.key)
    if (!row) return
    row.left.items = row.left.items.filter(item => item.object != object)
    row.right.items = row.right.items.filter(item => item.object != object)
    this.updateX(data.key)
  }

  updatePriority(object: StackableObject, priority: number) {
    const data = this.objectMap.get(object)
    if (!data?.key) return
    const row = this.rows.get(data.key)
    if (!row) return
    for (const side of [row.left, row.right]) {
      for (const item of side.items) {
        if (item.object == object) {
          if (item.priority == priority) return
          item.priority = priority
        }
      }
      side.items.sort((a, b) => a.priority - b.priority)
    }
    this.updateX(data.key)
  }

  updateAlign(object: StackableObject, align: "left" | "right") {
    const data = this.objectMap.get(object)
    if (!data?.key) return
    if (data.align == align) return
    const row = this.rows.get(data.key)
    if (!row) return

    for (const side of [row.left, row.right]) {
      const index = side.items.findIndex(item => item.object == object)
      if (index == -1) continue
      const removedItem = side.items.splice(index, 1)[0]
      if (align == "left") {
        row.left.items.push(removedItem)
        row.left.items.sort((a, b) => a.priority - b.priority)
      } else {
        row.right.items.push(removedItem)
        row.right.items.sort((a, b) => a.priority - b.priority)
      }
      this.updateX(data.key)
    }
  }

  updateX(rowKey: string) {
    const row = this.rows.get(rowKey)
    if (!row) return
    let x = -this.renderer.chart.gameType.notefieldWidth * 0.5 - 80 - 30
    for (const item of row.left.items) {
      if (
        item.object.x != x &&
        item.x != null &&
        (item.registerTime === undefined ||
          Date.now() - item.registerTime > 100) // initial load grace period
      ) {
        this.objectMap.get(item.object)!.animationId = BezierAnimator.animate(
          item.object,
          {
            0: { x: "inherit", "pivot.x": "inherit" },
            1: { x: x, "pivot.x": item.object.width / 2 },
          },
          Options.general.smoothAnimations ? 0.3 : 0,
          bezier(0, 0, 0.16, 1.01),
          () => {},
          this.objectMap.get(item.object)?.animationId
        )
      } else {
        item.object.x = x
        item.object.pivot.x = item.object.width / 2
      }
      item.x = x
      x -= item.object.width + 5
    }
    x = this.renderer.chart.gameType.notefieldWidth * 0.5 + 80
    for (const item of row.right.items) {
      if (
        item.object.x != x &&
        item.x != null &&
        (item.registerTime === undefined ||
          Date.now() - item.registerTime > 100)
      ) {
        this.objectMap.get(item.object)!.animationId = BezierAnimator.animate(
          item.object,
          {
            0: { x: "inherit", "pivot.x": "inherit" },
            1: { x: x, "pivot.x": -item.object.width / 2 },
          },
          Options.general.smoothAnimations ? 0.3 : 0,
          bezier(0, 0, 0.16, 1.01),
          () => {},
          this.objectMap.get(item.object)?.animationId
        )
      } else {
        item.object.x = x
        item.object.pivot.x = -item.object.width / 2
      }
      item.x = x
      x += item.object.width + 5
    }
  }

  update() {
    for (const [key, row] of this.rows.entries()) {
      let updatedRow = false
      for (const item of row.left.items) {
        if (item.width != item.object.width) {
          item.width = item.object.width
          if (!updatedRow) {
            this.updateX(key)
          }
          updatedRow = true
        }
        item.object.y = Options.chart.CMod
          ? this.renderer.getYPosFromSecond(item.second)
          : this.renderer.getYPosFromBeat(item.beat)
      }
      for (const item of row.right.items) {
        if (item.width != item.object.width) {
          item.width = item.object.width
          if (!updatedRow) {
            this.updateX(key)
          }
          updatedRow = true
        }
        item.object.y = Options.chart.CMod
          ? this.renderer.getYPosFromSecond(item.second)
          : this.renderer.getYPosFromBeat(item.beat)
      }
    }
  }
}
