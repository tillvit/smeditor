import { NineSlicePlane, Texture } from "pixi.js"

// More performant version to crop a sprite vertically in one way

export class VertCropSprite extends NineSlicePlane {
  private offsetY = 0
  private setY = 0

  private _last = 0
  private _lastTop = false

  constructor(texture: Texture) {
    super(texture, 0, 0, 0, 0)
    this.scale.cb = () => {
      this.refresh()
    }
  }

  cropBottom(pixels: number, force = false) {
    if (this._last == pixels && !this._lastTop && !force) {
      return
    }
    this._last = pixels
    this._lastTop = false
    this._height = this.texture.height - pixels / Math.abs(this.scale.y)
    this._bottomHeight = 0
    this.offsetY = 0
    this.topHeight = this.texture.height - pixels / Math.abs(this.scale.y)
    this._updateY()
  }

  cropTop(pixels: number, force = false) {
    if (this._last == pixels && this._lastTop && !force) {
      return
    }
    this._last = pixels
    this._lastTop = true
    this._height = this.texture.height - pixels / Math.abs(this.scale.y)
    this._topHeight = 0
    this.bottomHeight = this.texture.height - pixels / Math.abs(this.scale.y)
    this.offsetY = pixels / Math.abs(this.scale.y)
    this._updateY()
  }

  get y() {
    return this.setY
  }

  set y(value: number) {
    this.setY = value
    this._updateY()
  }

  private _updateY() {
    super.y = this.setY + this.offsetY * Math.abs(this.scale.y)
  }

  refresh() {
    if (this._lastTop) {
      this.cropTop(this._last, true)
    } else {
      this.cropBottom(this._last, true)
    }
  }
}
