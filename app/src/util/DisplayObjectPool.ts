import { Container, DisplayObject, Renderer } from "pixi.js"

type PoolableObject<T extends DisplayObject> = T & { _disabledTime: number }

interface DisplayObjectPoolOptions<T> {
  create: () => T
  maxPoolSize?: number
  destroyTimer?: number
}

export class DisplayObjectPool<T extends DisplayObject> extends Container<T> {
  private pool: PoolableObject<T>[] = []
  private options

  constructor(options: DisplayObjectPoolOptions<T>) {
    super()
    this.options = options
  }

  createChild() {
    if (
      this.pool.length == 0 &&
      this.options.maxPoolSize !== undefined &&
      this.children.length >= this.options.maxPoolSize
    )
      return
    const object = this.pool.pop() ?? this.options.create()
    this.addChild(object)
    ;(object as PoolableObject<T>)._disabledTime = Date.now()
    return object
  }

  destroyChild(child: T) {
    if (!this.children.includes(child)) return
    child.removeFromParent()
    child.removeAllListeners()
    child.eventMode = "auto"
    ;(child as PoolableObject<T>)._disabledTime = Date.now()
    this.pool.push(child as PoolableObject<T>)
  }

  destroyAll() {
    this.children.forEach(
      child => ((child as PoolableObject<T>)._disabledTime = Date.now())
    )
    this.pool.push(...(this.children as PoolableObject<T>[]))
    this.children.forEach(child => {
      child.emit("removed", child.parent)
      child.removeAllListeners()
      child.eventMode = "auto"
    })
    this.removeChildren()
  }

  _render(renderer: Renderer) {
    super._render(renderer)
    const date = Date.now()
    while (
      date - this.pool[0]?._disabledTime >
      (this.options.destroyTimer ?? 5000)
    ) {
      this.pool.shift()!.destroy()
    }
  }
}
