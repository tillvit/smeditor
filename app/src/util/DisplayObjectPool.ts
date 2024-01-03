import { Container } from "pixi.js"

type PoolableObject<T extends Container> = T & { _disabledTime: number }

interface ContainerPoolOptions<T> {
  create: () => T
  maxPoolSize?: number
  destroyTimer?: number
}

export class DisplayObjectPool<T extends Container> extends Container {
  private pool: PoolableObject<T>[] = []
  private options

  constructor(options: ContainerPoolOptions<T>) {
    super()
    this.options = options
    this.onRender = () => {
      const date = Date.now()
      while (
        date - this.pool[0]?._disabledTime >
        (this.options.destroyTimer ?? 5000)
      ) {
        this.pool.shift()!.destroy()
      }
    }
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
      child.removeAllListeners()
      child.eventMode = "auto"
    })
    this.removeChildren()
  }
}
