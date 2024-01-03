import bezier from "bezier-easing"
import { Ticker } from "pixi.js"

export type BezierKeyFrames = {
  [key: string]: { [key: string]: number | string }
}

export interface BezierAnimation<T> {
  obj: T
  animation: BezierKeyFrames
  speed: number
  progress: number
  curve: bezier.EasingFunction
  onend: (obj: T) => void
}

const noEase = bezier(0, 0, 1, 1)

function getProperty(obj: any, path: string): any {
  const arr = path ? path.split(".") : []

  while (arr.length && obj) {
    const prop = arr.shift()!
    const match = new RegExp("(.+)\\[([0-9]*)\\]").exec(prop)

    // handle arrays
    if (match !== null && match.length == 3) {
      const arrayData = {
        arrName: match[1],
        arrIndex: match[2],
      }
      if (obj[arrayData.arrName] !== undefined) {
        obj = obj[arrayData.arrName][arrayData.arrIndex]
      } else {
        obj = undefined
      }
      continue
    }
    obj = obj[prop]
  }
  return obj
}

function setProperty(obj: any, path: string, value: any): any {
  const arr = path ? path.split(".") : []
  while (arr.length && obj) {
    const prop = arr.shift()!
    const match = new RegExp("(.+)\\[([0-9]*)\\]").exec(prop)

    if (match !== null && match.length == 3) {
      const arrayData = {
        arrName: match[1],
        arrIndex: match[2],
      }
      if (obj[arrayData.arrName] !== undefined && arr.length === 0) {
        obj[arrayData.arrName][arrayData.arrIndex] = value
      }
      continue
    }

    if (obj[prop] === undefined) obj[prop] = {}

    if (arr.length === 0) obj[prop] = value

    obj = obj[prop]
  }

  return obj
}

export class BezierAnimator {
  private static animations: Map<string, BezierAnimation<any>> = new Map()
  private static _id = 0

  static {
    Ticker.shared.add(ticker => {
      for (const [id, animation] of this.animations.entries()) {
        if (animation.obj._destroyed) {
          this.stop(id)
        } else {
          animation.progress = Math.min(
            1,
            animation.progress + animation.speed * ticker.deltaTime
          )
          this.updateObject(
            animation.obj,
            animation.animation,
            animation.curve(animation.progress)
          )
          if (animation.progress >= 1) {
            animation.onend(animation.obj)
            this.stop(id, 1)
          }
        }
      }
    })
  }
  static updateObject(obj: any, animation: BezierKeyFrames, time: number) {
    const keyframes = Object.keys(animation).sort(
      (e, t) => parseFloat(e) - parseFloat(t)
    )
    let startTime = "0"
    for (let e = keyframes.length - 2; e >= 0; e--)
      if (parseFloat(keyframes[e]) <= time) {
        startTime = keyframes[e]
        break
      }
    let endTime = "1"
    for (let e = 1; e < keyframes.length; e++)
      if (parseFloat(keyframes[e]) > time) {
        endTime = keyframes[e]
        break
      }
    Object.keys(animation[0]).forEach(prop => {
      let startValue = animation[startTime][prop],
        endValue = animation[endTime][prop]
      if ("inherit" === startValue) {
        animation[startTime][prop] = getProperty(obj, prop)
        startValue = animation[startTime][prop]
      }
      if ("inherit" === endValue) {
        animation[endTime][prop] = getProperty(obj, prop)
        endValue = animation[endTime][prop]
      }
      const newValue =
        (startValue as number) +
        ((time - parseFloat(startTime)) /
          (parseFloat(endTime) - parseFloat(startTime))) *
          ((endValue as number) - (startValue as number))
      setProperty(obj, prop, newValue)
    })
  }
  static stop(id: string | undefined, time: null | number = null) {
    if (id === undefined) return
    if (
      null !== time &&
      this.animations.get(id)?.obj &&
      !this.animations.get(id)!.obj.destroyed
    ) {
      this.updateObject(
        this.animations.get(id)!.obj,
        this.animations.get(id)!.animation,
        time
      )
    }
    this.animations.delete(id)
  }

  static animate(
    obj: any,
    animation: BezierKeyFrames,
    speed: number,
    curve?: bezier.EasingFunction,
    onend = () => {},
    id?: string
  ) {
    id ||= `${++this._id}`
    this.animations.set(id, {
      obj,
      animation,
      speed: 1 / (60 * speed),
      progress: 0,
      curve: void 0 !== curve ? curve : noEase,
      onend: onend,
    })
    return id
  }
}
