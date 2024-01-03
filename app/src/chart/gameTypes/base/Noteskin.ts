import { Assets, Container, Sprite, Texture, TilingSprite } from "pixi.js"
import { ChartRenderer } from "../../ChartRenderer"
import { TimingWindow } from "../../play/TimingWindow"
import { NotedataEntry } from "../../sm/NoteTypes"

export abstract class NoteSkin {
  protected readonly renderer
  textures: Record<string, Texture> = {}
  protected abstract readonly textureBundle: [string, string][]

  constructor(renderer: ChartRenderer) {
    this.renderer = renderer
  }

  async loadAssets() {
    this.textures = {}

    await Promise.all(
      this.textureBundle.map(([name, url]) => {
        console.log(url)
        return Assets.load({ src: url }).then(texture => {
          this.textures[name] = texture
        })
      })
    )
  }

  /**
   * Creates a receptor sprite given a column number.
   *
   * @abstract
   * @param {number} columnNumber
   * @return {*}  {Container}
   * @memberof Notefield
   */
  abstract createReceptor(columnNumber: number): Receptor

  /**
   * Creates a note flash sprite given a judgement.
   *
   * @abstract
   * @param {TimingWindow} judgement
   * @return {*}  {NoteFlash | undefined}
   * @memberof Notefield
   */
  abstract createNoteFlash(judgement: TimingWindow): NoteFlash | undefined

  /**
   * Creates a note flash sprite when a hold is pressed.
   *
   * @abstract
   * @return {*}  {NoteFlash | undefined}
   * @memberof Notefield
   */
  abstract createHoldNoteFlash(): NoteFlash

  /**
   * Called every frame to update the noteskin.
   *
   * @abstract
   * @memberof Notefield
   */
  abstract update(): void

  /**
   * Creates a note sprite given a note entry.
   *
   * @abstract
   * @param {NotedataEntry} note
   * @return {*}  {NoteObject}
   * @memberof Notefield
   */
  abstract createNote(note: NotedataEntry): NoteObject
}

export interface Receptor extends Container {
  update(renderer: ChartRenderer, beat: number): void
  keyDown(): void
  keyUp(): void
}

export interface NoteFlash extends Container {
  update(renderer: ChartRenderer): void
}

export interface NoteObject extends Container {
  hold?: NoteObjectHold
  note: Container
  update(renderer: ChartRenderer): void
}

export interface NoteObjectHold extends Container {
  holdBody: TilingSprite
  holdCap: Sprite
}

type NoteSkinConstructor = new (renderer: ChartRenderer) => NoteSkin

export interface NoteSkinOptions {
  name: string
  object: NoteSkinConstructor
  gameTypes: string[]
  rotateColumns: boolean
}
