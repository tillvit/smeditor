import {
  IDestroyOptions,
  Texture,
  Ticker,
  TilingSprite,
  UPDATE_PRIORITY,
} from "pixi.js"

export class HoldBody extends TilingSprite {
  constructor(texture: Texture, holdWidth = 64) {
    super(texture)
    this.tileScale.set(holdWidth / this.texture.width)
    this.texture.on("update", () => {
      this.tileScale.set(holdWidth / this.texture.width)
    })
    this.uvRespectAnchor = true
    this.anchor.y = 1
    this.x = -holdWidth / 2
    this.width = holdWidth
  }
}

export class AnimatedHoldBody extends HoldBody {
  private _playing = false
  private _autoUpdate = false
  private _isConnectedToTicker = false
  private _tickerUpdate = this.update.bind(this)
  private _currentTime = 0
  private _textures!: Texture[]
  private _previousFrame: number | null = null

  onComplete: (() => void) | null = null
  onLoop: (() => void) | null = null
  onFrameChange: ((frame: number) => void) | null = null
  animationSpeed = 1
  loop = false
  updateAnchor = false
  constructor(textures: Texture[], holdWidth: number) {
    super(textures[0], holdWidth)
    this.textures = textures
  }

  stop() {
    if (this._playing) {
      this._playing = false
      if (this._autoUpdate && this._isConnectedToTicker) {
        Ticker.shared.remove(this._tickerUpdate)
        this._isConnectedToTicker = false
      }
    }
  }
  play() {
    if (!this._playing) {
      this._playing = true
      if (this._autoUpdate && !this._isConnectedToTicker) {
        Ticker.shared.add(this._tickerUpdate, this, UPDATE_PRIORITY.HIGH)
        this._isConnectedToTicker = true
      }
    }
  }

  gotoAndStop(frameNumber: number) {
    this.stop()
    this.currentFrame = frameNumber
  }
  gotoAndPlay(frameNumber: number) {
    this.currentFrame = frameNumber
    this.play()
  }

  update(deltaTime: number) {
    if (!this._playing) return
    const elapsed = this.animationSpeed * deltaTime,
      previousFrame = this.currentFrame
    this._currentTime += elapsed
    this._currentTime < 0 && !this.loop
      ? (this.gotoAndStop(0), this.onComplete?.())
      : this._currentTime >= this._textures.length && !this.loop
      ? (this.gotoAndStop(this._textures.length - 1), this.onComplete?.())
      : previousFrame !== this.currentFrame &&
        (this.loop &&
          this.onLoop &&
          ((this.animationSpeed > 0 && this.currentFrame < previousFrame) ||
            (this.animationSpeed < 0 && this.currentFrame > previousFrame)) &&
          this.onLoop(),
        this.updateTexture())
  }

  updateTexture() {
    const currentFrame = this.currentFrame
    if (this._previousFrame !== currentFrame) {
      this._previousFrame = currentFrame
      this.texture = this._textures[currentFrame]
      this._textureID = -1
      this._textureTrimmedID = -1
      this._cachedTint = 16777215
      this.uvs = this._texture._uvs.uvsFloat32
      if (this.updateAnchor) this._anchor.copyFrom(this._texture.defaultAnchor)
      this.onFrameChange?.(this.currentFrame)
    }
  }

  destroy(options?: IDestroyOptions | boolean) {
    this.stop(),
      super.destroy(options),
      (this.onComplete = null),
      (this.onFrameChange = null),
      (this.onLoop = null)
  }

  get totalFrames() {
    return this._textures?.length ?? 0
  }

  get textures() {
    return this._textures ?? []
  }

  set textures(value: Texture[]) {
    this._textures = value
    this._previousFrame = null
    this.gotoAndStop(0)
    this.updateTexture()
  }

  get currentFrame() {
    let currentFrame = Math.floor(this._currentTime) % this._textures.length
    return (
      currentFrame < 0 && (currentFrame += this._textures.length), currentFrame
    )
  }

  set currentFrame(value) {
    if (value < 0 || value > this.totalFrames - 1)
      throw new Error(
        `[AnimatedSprite]: Invalid frame index value ${value}, expected to be between 0 and totalFrames ${this.totalFrames}.`
      )
    const previousFrame = this.currentFrame
    ;(this._currentTime = value),
      previousFrame !== this.currentFrame && this.updateTexture()
  }

  get playing() {
    return this._playing
  }

  get autoUpdate() {
    return this._autoUpdate
  }

  set autoUpdate(value) {
    value !== this._autoUpdate &&
      ((this._autoUpdate = value),
      !this._autoUpdate && this._isConnectedToTicker
        ? (Ticker.shared.remove(this._tickerUpdate),
          (this._isConnectedToTicker = !1))
        : this._autoUpdate &&
          !this._isConnectedToTicker &&
          this._playing &&
          (Ticker.shared.add(this._tickerUpdate),
          (this._isConnectedToTicker = !0)))
  }
}
