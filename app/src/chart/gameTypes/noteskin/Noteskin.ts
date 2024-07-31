import { Container, Sprite, Texture } from "pixi.js"
import { ChartRenderer } from "../../ChartRenderer"
import { NotedataEntry } from "../../sm/NoteTypes"

import missingTexUrl from "../../../../assets/missing.png"
import { WaterfallManager } from "../../../gui/element/WaterfallManager"
import { Options } from "../../../util/Options"
import { VertCropSprite } from "../../../util/VertCropSprite"
import { StandardMissTimingWindow } from "../../play/StandardMissTimingWindow"
import { StandardTimingWindow } from "../../play/StandardTimingWindow"

export const MISSING_TEX = Texture.from(missingTexUrl)

export interface NoteskinElementOptions {
  columnName: string
  columnNumber: number
  element: keyof NoteskinElements
}

export interface NoteskinElementCreationOptions {
  note: NotedataEntry
}

export type NoteskinElementCreationData =
  Partial<NoteskinElementCreationOptions> & {
    noteskin: Noteskin
    columnName: string
    columnNumber: number
  }

export type Generator<Element> = (data: NoteskinElementCreationData) => Element

export type NoteskinElements = {
  Tap: NoteskinSprite
  Fake: NoteskinSprite
  Lift: NoteskinSprite
  Mine: NoteskinSprite
  "Hold Inactive Head": NoteskinSprite
  "Hold Inactive TopCap": NoteskinSprite
  "Hold Inactive Body": NoteskinSprite
  "Hold Inactive BottomCap": NoteskinHoldTail
  "Hold Active Head": NoteskinSprite
  "Hold Active TopCap": NoteskinSprite
  "Hold Active Body": NoteskinSprite
  "Hold Active BottomCap": NoteskinHoldTail
  "Roll Inactive Head": NoteskinSprite
  "Roll Inactive TopCap": NoteskinSprite
  "Roll Inactive Body": NoteskinSprite
  "Roll Inactive BottomCap": NoteskinHoldTail
  "Roll Active Head": NoteskinSprite
  "Roll Active TopCap": NoteskinSprite
  "Roll Active Body": NoteskinSprite
  "Roll Active BottomCap": NoteskinHoldTail
  Receptor: NoteskinSprite
  NoteFlash: NoteskinSprite
}

export type NoteskinElementRedirect = {
  element: keyof NoteskinElements
  columnName?: string
  columnNumber?: number
}

export type NoteskinElementGenerators = {
  [K in keyof NoteskinElements]:
    | Generator<NoteskinElements[K]>
    | NoteskinElementRedirect
}

export type NoteskinMetrics = typeof DEFAULT_METRICS

export interface NoteskinOptions {
  elements: Record<string, Partial<NoteskinElementGenerators>>
  metrics?: Partial<NoteskinMetrics>
  load?: (
    this: Noteskin,
    element: NoteskinElementOptions,
    data: NoteskinElementCreationData
  ) => NoteskinSprite
  init?: (renderer: ChartRenderer) => void
  update?: (renderer: ChartRenderer) => void
  hideIcons?: string[]
}

export interface NoteskinElement {}

export type NoteskinSprite = NoteskinElement & Container

export type NoteskinHoldTail = NoteskinElement & VertCropSprite

export type NoteskinEvent =
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

export type NoteskinEventNames = NoteskinEvent["type"]

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

const DEFAULT_METRICS = {
  HoldBodyTopOffset: 0,
  HoldBodyBottomOffset: 0,
  RollBodyTopOffset: 0,
  RollBodyBottomOffset: 0,
}

export class Noteskin {
  protected readonly renderer
  protected readonly options

  protected objects: NoteskinSprite[] = []

  protected readonly updateHooks: Set<{
    item: NoteskinSprite
    cb: (renderer: ChartRenderer) => void
  }> = new Set()

  protected readonly hooks: {
    [Name in NoteskinEventNames]?: Set<{
      item: NoteskinSprite
      cb: (event: Extract<NoteskinEvent, { type: Name }>) => void
    }>
  } = {}

  readonly metrics: NoteskinMetrics

  constructor(renderer: ChartRenderer, options: NoteskinOptions) {
    this.renderer = renderer
    this.options = options
    this.options.init?.(renderer)
    this.metrics = {
      ...DEFAULT_METRICS,
      ...this.options.metrics,
    }
  }

  update(renderer: ChartRenderer) {
    this.options.update?.(renderer)
    this.updateHooks.forEach(({ item, cb }) => {
      if (item.destroyed) return
      cb(renderer)
    })
  }

  getPlaceholderSprite(): NoteskinSprite {
    const spr = new Sprite(MISSING_TEX)
    spr.anchor.set(0.5)
    return spr
  }

  getBlankSprite(): NoteskinSprite {
    const spr = new Sprite(Texture.EMPTY)
    return spr
  }

  getElement(
    element: NoteskinElementOptions,
    options: Partial<NoteskinElementCreationOptions> = {}
  ): NoteskinSprite {
    try {
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
    } catch (e: any) {
      console.error(e)
      if (Options.debug.showNoteskinErrors) {
        WaterfallManager.createFormatted("Noteskin Error: " + e, "error")
      }
      return this.getPlaceholderSprite()
    }
  }

  loadElement(
    element: NoteskinElementOptions,
    options: Partial<NoteskinElementCreationOptions> = {}
  ) {
    const func = this.followRedirs(element)
    if (func === undefined) {
      if (Options.debug.showNoteskinErrors)
        WaterfallManager.createFormatted(
          `Noteskin element ${element.columnName} ${element.element} failed to load for noteskin: Redirect loop`,
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

  followRedirs(element: NoteskinElementOptions) {
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

  on<Event extends NoteskinEventNames>(
    item: NoteskinSprite,
    event: Event,
    cb: (event: Extract<NoteskinEvent, { type: Event }>) => void
  ) {
    if (this.hooks[event] === undefined) this.hooks[event] = new Set<any>()
    const c = { item, cb }
    this.hooks[event]!.add(c)
    item.once("destroyed", () => this.hooks[event]!.delete(c))
  }

  onUpdate(item: NoteskinSprite, cb: (renderer: ChartRenderer) => void) {
    const c = { item, cb }
    this.updateHooks.add(c)
    item.once("destroyed", () => this.updateHooks.delete(c))
  }

  broadcast<Type extends NoteskinEventNames>(
    event: Extract<NoteskinEvent, { type: Type }>
  ) {
    if (this.hooks[event.type] === undefined) return
    const hooks = this.hooks[event.type]!
    hooks.forEach(({ item, cb }) => {
      if (item.destroyed) return
      ;(cb as (event: Extract<NoteskinEvent, { type: Type }>) => void)(event)
    })
  }
}
