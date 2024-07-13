import { Container, Sprite, Texture } from "pixi.js"
import { ChartRenderer } from "../../ChartRenderer"
import { NotedataEntry } from "../../sm/NoteTypes"

import missingTexUrl from "../../../../assets/missing.png"
import { WaterfallManager } from "../../../gui/element/WaterfallManager"
import { Options } from "../../../util/Options"
import { StandardMissTimingWindow } from "../../play/StandardMissTimingWindow"
import { StandardTimingWindow } from "../../play/StandardTimingWindow"

export const MISSING_TEX = Texture.from(missingTexUrl)

export interface NoteSkinElementOptions {
  columnName: string
  columnNumber: number
  element: keyof NoteSkinElements
}

export interface NoteSkinElementCreationOptions {
  note: NotedataEntry
}

export type NoteSkinElementCreationData =
  Partial<NoteSkinElementCreationOptions> & {
    noteskin: NoteSkin
    columnName: string
    columnNumber: number
  }

export type Generator<Element> = (data: NoteSkinElementCreationData) => Element

export type NoteSkinElements = {
  Tap: NoteSkinSprite
  Fake: NoteSkinSprite
  Lift: NoteSkinSprite
  Mine: NoteSkinSprite
  "Hold Inactive Head": NoteSkinSprite
  "Hold Inactive TopCap": NoteSkinSprite
  "Hold Inactive Body": NoteSkinSprite
  "Hold Inactive BottomCap": NoteSkinSprite
  "Hold Active Head": NoteSkinSprite
  "Hold Active TopCap": NoteSkinSprite
  "Hold Active Body": NoteSkinSprite
  "Hold Active BottomCap": NoteSkinSprite
  "Roll Inactive Head": NoteSkinSprite
  "Roll Inactive TopCap": NoteSkinSprite
  "Roll Inactive Body": NoteSkinSprite
  "Roll Inactive BottomCap": NoteSkinSprite
  "Roll Active Head": NoteSkinSprite
  "Roll Active TopCap": NoteSkinSprite
  "Roll Active Body": NoteSkinSprite
  "Roll Active BottomCap": NoteSkinSprite
  Receptor: NoteSkinSprite
  NoteFlash: NoteSkinSprite
}

export type NoteSkinElementRedirect = {
  element: keyof NoteSkinElements
  columnName?: string
  columnNumber?: number
}

export type NoteSkinElementGenerators = {
  [K in keyof NoteSkinElements]:
    | Generator<NoteSkinElements[K]>
    | NoteSkinElementRedirect
}

export interface NoteSkinOptions {
  elements: Record<string, Partial<NoteSkinElementGenerators>>
  load?: (
    this: NoteSkin,
    element: NoteSkinElementOptions,
    data: NoteSkinElementCreationData
  ) => NoteSkinSprite
  init?: (renderer: ChartRenderer) => void
  update?: (renderer: ChartRenderer) => void
}

export interface NoteSkinElement {}

export type NoteSkinSprite = NoteSkinElement & Container

export type NoteSkinEvent =
  | PressEvent
  | LiftEvent
  | GhostTapEvent
  | HitEvent
  | AvoidMineEvent
  | HitMineEvent
  | MissEvent
  | HoldOffEvent
  | HoldOnEvent
  | RollOffEvent
  | RollOnEvent
  | HoldLetGoEvent
  | HoldHeldEvent

export type NoteSkinEventNames = NoteSkinEvent["type"]

// Button presses

type PressEvent = {
  type: "press"
  columnName: string
  columnNumber: number
}

type LiftEvent = {
  type: "lift"
  columnName: string
  columnNumber: number
}

type GhostTapEvent = {
  type: "ghosttap"
  columnName: string
  columnNumber: number
}

// Judgements

type HitEvent = {
  type: "hit"
  judgement: StandardTimingWindow
  columnName: string
  columnNumber: number
}

type AvoidMineEvent = {
  type: "avoidmine"
  columnName: string
  columnNumber: number
}

type HitMineEvent = {
  type: "hitmine"
  columnName: string
  columnNumber: number
}

type MissEvent = {
  type: "miss"
  judgement: StandardMissTimingWindow
  columnName: string
  columnNumber: number
}

// Holding

type HoldOnEvent = {
  type: "holdon"
  columnName: string
  columnNumber: number
}

type HoldOffEvent = {
  type: "holdoff"
  columnName: string
  columnNumber: number
}

type RollOnEvent = {
  type: "rollon"
  columnName: string
  columnNumber: number
}

type RollOffEvent = {
  type: "rolloff"
  columnName: string
  columnNumber: number
}

type HoldLetGoEvent = {
  type: "letgo"
  columnName: string
  columnNumber: number
}

type HoldHeldEvent = {
  type: "held"
  columnName: string
  columnNumber: number
}

export class NoteSkin {
  protected readonly renderer
  protected readonly options

  protected objects: NoteSkinSprite[] = []

  protected readonly updateHooks: Set<{
    item: NoteSkinSprite
    cb: (renderer: ChartRenderer) => void
  }> = new Set()

  protected readonly hooks: {
    [Name in NoteSkinEventNames]?: Set<{
      item: NoteSkinSprite
      cb: (event: Extract<NoteSkinEvent, { type: Name }>) => void
    }>
  } = {}

  constructor(renderer: ChartRenderer, options: NoteSkinOptions) {
    this.renderer = renderer
    this.options = options
    this.options.init?.(renderer)
  }

  update(renderer: ChartRenderer) {
    this.options.update?.(renderer)
    this.updateHooks.forEach(({ item, cb }) => {
      if (item.destroyed) return
      cb(renderer)
    })
  }

  getPlaceholderSprite(): NoteSkinSprite {
    const spr = new Sprite(MISSING_TEX)
    spr.anchor.set(0.5)
    return spr
  }

  getBlankSprite(): NoteSkinSprite {
    const spr = new Sprite(Texture.EMPTY)
    return spr
  }

  getElement(
    element: NoteSkinElementOptions,
    options: Partial<NoteSkinElementCreationOptions> = {}
  ): NoteSkinSprite {
    if (this.options.load) {
      const spr = this.options.load.bind(this)(element, {
        noteskin: this,
        columnName: element.columnName,
        columnNumber: element.columnNumber,
        ...options,
      })
      return spr ?? this.getPlaceholderSprite()
    }
    return this.loadElement(element, options) ?? this.getPlaceholderSprite()
  }

  loadElement(
    element: NoteSkinElementOptions,
    options: Partial<NoteSkinElementCreationOptions> = {}
  ) {
    const func = this.followRedirs(element)
    if (func === undefined) {
      if (Options.debug.showNoteSkinErrors)
        WaterfallManager.createFormatted(
          `NoteSkin element ${element.columnName} ${element.element} failed to load for noteskin: Redirect loop`,
          "error"
        )
      return this.getPlaceholderSprite()
    }
    return func({
      noteskin: this,
      columnName: element.columnName,
      columnNumber: element.columnNumber,
      ...options,
    })
  }

  followRedirs(element: NoteSkinElementOptions) {
    const visited = [element]
    let current = element
    while (true) {
      const next = this.options.elements[current.columnName]?.[current.element]
      if (next === undefined) return undefined
      if (typeof next == "function") {
        return next
      } else {
        current = {
          columnName: next.columnName ?? current.columnName,
          columnNumber: next.columnNumber ?? current.columnNumber,
          element: next.element,
        }
        if (
          visited.some(
            seen =>
              current.columnName == seen.columnName &&
              current.element == seen.element
          )
        ) {
          return undefined
        }
        visited.push(current)
      }
    }
  }

  on<Event extends NoteSkinEventNames>(
    item: NoteSkinSprite,
    event: Event,
    cb: (event: Extract<NoteSkinEvent, { type: Event }>) => void
  ) {
    if (this.hooks[event] === undefined) this.hooks[event] = new Set<any>()
    const c = { item, cb }
    this.hooks[event]!.add(c)
    item.once("destroyed", () => this.hooks[event]!.delete(c))
  }

  onUpdate(item: NoteSkinSprite, cb: (renderer: ChartRenderer) => void) {
    const c = { item, cb }
    this.updateHooks.add(c)
    item.once("destroyed", () => this.updateHooks.delete(c))
  }

  broadcast<Type extends NoteSkinEventNames>(
    event: Extract<NoteSkinEvent, { type: Type }>
  ) {
    if (this.hooks[event.type] === undefined) return
    const hooks = this.hooks[event.type]!
    hooks.forEach(({ item, cb }) => {
      if (item.destroyed) return
      ;(cb as (event: Extract<NoteSkinEvent, { type: Type }>) => void)(event)
    })
  }
}
