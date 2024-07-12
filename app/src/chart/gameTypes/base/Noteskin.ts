import { Container, DisplayObject, Sprite, TilingSprite } from "pixi.js"
import { ChartRenderer } from "../../ChartRenderer"
import { TimingWindow } from "../../play/TimingWindow"
import { NotedataEntry } from "../../sm/NoteTypes"

export abstract class NoteSkin {
  protected readonly renderer

  constructor(renderer: ChartRenderer) {
    this.renderer = renderer
  }

  /**
   * Creates a receptor sprite given a column number.
   *
   * @abstract
   * @param {number} columnNumber
   * @return {*}  {Container}
   * @memberof Notefield
   */
  abstract createReceptor(columnName: string): Receptor

  /**
   * Creates a note flash sprite given a judgement.
   *
   * @abstract
   * @param {TimingWindow} judgement
   * @return {*}  {NoteFlash | undefined}
   * @memberof Notefield
   */
  abstract createNoteFlash(
    judgement: TimingWindow,
    columnName: string
  ): NoteFlash | undefined

  /**
   * Creates a note flash sprite when a hold is pressed.
   *
   * @abstract
   * @return {*}  {NoteFlash | undefined}
   * @memberof Notefield
   */
  abstract createHoldNoteFlash(columnName: string): NoteFlash

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
  abstract createNote(note: NotedataEntry, columnName: string): NoteObject
}

export interface Receptor extends DisplayObject {
  update(renderer: ChartRenderer, beat: number): void
  keyDown(): void
  keyUp(): void
}

export interface NoteFlash extends DisplayObject {
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
  setActive: (active: boolean) => void
}

type NoteSkinConstructor = new (renderer: ChartRenderer) => NoteSkin

export interface NoteSkinOptions {
  name: string
  object: NoteSkinConstructor
  gameTypes: string[]
}
