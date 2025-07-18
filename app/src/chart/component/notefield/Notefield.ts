import { Container, Sprite, Texture } from "pixi.js"
import { WaterfallManager } from "../../../gui/element/WaterfallManager"
import { rgbtoHex } from "../../../util/Color"
import { EventHandler } from "../../../util/EventHandler"
import { Options } from "../../../util/Options"
import { EditMode, EditTimingMode } from "../../ChartManager"
import { ChartRenderer, ChartRendererComponent } from "../../ChartRenderer"
import {
  MISSING_TEX,
  Noteskin,
  NoteskinElementCreationOptions,
  NoteskinElementOptions,
  NoteskinElements,
  NoteskinHoldTail,
  NoteskinOptions,
  NoteskinSprite,
} from "../../gameTypes/noteskin/Noteskin"
import { NoteskinRegistry } from "../../gameTypes/noteskin/NoteskinRegistry"
import { TimingWindow } from "../../play/TimingWindow"
import {
  isHoldDroppedTimingWindow,
  isHoldTimingWindow,
  isMineTimingWindow,
  isStandardMissTimingWindow,
  isStandardTimingWindow,
} from "../../play/TimingWindowCollection"
import {
  HoldNotedataEntry,
  HoldNoteType,
  isHoldNote,
  NotedataEntry,
  TapNotedataEntry,
  TapNoteType,
} from "../../sm/NoteTypes"
import { HoldJudgementContainer } from "./HoldJudgementContainer"
import { NoteContainer } from "./NoteContainer"
import { NoteFlashContainer } from "./NoteFlashContainer"
import { ReceptorContainer } from "./ReceptorContainer"
import { SelectionNoteContainer } from "./SelectionNoteContainer"

import fakeIcon from "../../../../assets/icon/fake.png"
import liftIcon from "../../../../assets/icon/lift.png"
import { HoldTail } from "../../gameTypes/noteskin/_template/HoldTail"

const ICONS: Record<string, Texture> = {
  Fake: Texture.from(fakeIcon),
  Lift: Texture.from(liftIcon),
}

export type NotefieldObject = NoteObject | HoldObject

export class NoteWrapper extends Container {
  object: NotefieldObject
  icon
  constructor(object: NotefieldObject) {
    super()
    this.object = object

    this.icon = new Sprite(ICONS[object.note.type])
    this.icon.anchor.set(0.5)
    this.icon.scale.set(0.3)
    this.icon.alpha = 0.8
    this.icon.visible = false

    this.addChild(object, this.icon)

    if (object.nf.noteskin === undefined) {
      EventHandler.on("noteskinLoaded", () => this.loadEventHandler())
    } else {
      this.loadEventHandler()
    }
  }

  loadEventHandler() {
    this.object.nf.noteskin!.onUpdate(this, cr => {
      if (!Options.chart.drawIcons) {
        this.icon.visible = false
        return
      }
      if (
        this.object.nf.noteskinOptions?.hideIcons?.includes(
          this.object.note.type
        )
      ) {
        this.icon.visible = false
        return
      }
      this.icon.visible = true
      if (this.object.note.type == "Fake") {
        this.icon.visible = cr.chartManager.getMode() != EditMode.Play
      }
    })
  }
}

export class NoteObject extends Container {
  type = "note"
  note: NotedataEntry
  readonly nf: Notefield

  constructor(notefield: Notefield, note: TapNotedataEntry) {
    super()
    this.note = note
    this.nf = notefield

    this.on("destroyed", () => {
      this.removeAllListeners()
    })

    if (this.nf.noteskin === undefined) {
      EventHandler.on("noteskinLoaded", () => {
        this.loadElement(note)
      })
    } else {
      this.loadElement(note)
    }
  }

  loadElement(note: TapNotedataEntry) {
    const element = this.nf.noteskin!.getElement(
      {
        element: note.type as TapNoteType,
        columnName: this.nf.getColumnName(note.col),
        columnNumber: note.col,
      },
      { note }
    )
    this.addChild(element)
  }
}

interface HoldElements {
  Active: {
    Body: NoteskinSprite
    TopCap: NoteskinSprite
    BottomCap: NoteskinHoldTail
    Head: NoteskinSprite
  }
  Inactive: {
    Body: NoteskinSprite
    TopCap: NoteskinSprite
    BottomCap: NoteskinHoldTail
    Head: NoteskinSprite
  }
}

function isHoldTail(tail: NoteskinSprite): tail is NoteskinHoldTail {
  return (tail as any).cropTop !== undefined
}

export class HoldObject extends Container {
  type = "hold"

  note: HoldNotedataEntry

  private active
  private inactive

  private wasActive = false
  private lastLength: number | null = null

  private elements!: HoldElements

  private readonly metrics
  private readonly ns
  readonly nf
  private loaded = false

  constructor(notefield: Notefield, note: HoldNotedataEntry) {
    super()
    const active = new Container()
    const inactive = new Container()

    this.note = note
    this.ns = notefield.noteskin!
    this.nf = notefield
    this.metrics = this.ns.metrics

    active.visible = false

    this.active = active
    this.inactive = inactive

    this.addChild(inactive, active)

    if (notefield.noteskin === undefined) {
      EventHandler.on("noteskinLoaded", () => {
        this.loadElements()
      })
    } else {
      this.loadElements()
    }
  }

  loadElements() {
    if (this.loaded) return
    ;(this.elements as any) = {}
    for (const state of ["Active", "Inactive"] as const) {
      ;(this.elements[state] as any) = {}
      for (const part of ["BottomCap", "Body", "TopCap", "Head"] as const) {
        const element = this.getNoteskinElement(`${state} ${part}`)
        if (part == "BottomCap") {
          if (isHoldTail(element)) {
            this.elements[state][part] = element
          } else {
            if (Options.debug.showNoteskinErrors) {
              WaterfallManager.createFormatted(
                `Noteskin Error: invalid tail found for ${state} ${part}!`,
                "error"
              )
            }
            this.elements[state][part] = new HoldTail(MISSING_TEX, 64)
          }
        } else {
          this.elements[state][part] = element
        }
        ;(state == "Active" ? this.active : this.inactive).addChild(
          this.elements[state][part]
        )
      }
    }
    this.loaded = true
  }

  getNoteskinElement(element: string) {
    return this.ns.getElement(
      {
        element: `${this.note.type} ${element}` as keyof NoteskinElements,
        columnName: this.nf.getColumnName(this.note.col),
        columnNumber: this.note.col,
      },
      { note: this.note }
    )
  }

  setActive(active: boolean) {
    if (this.wasActive != active) {
      this.wasActive = active
      this.active.visible = active
      this.inactive.visible = !active
    }
  }

  setBrightness(brightness: number) {
    if (!this.loaded) return
    const states = ["Active", "Inactive"] as const
    const items = ["Body", "TopCap", "BottomCap"] as const
    for (const state of states) {
      for (const item of items) {
        if ("tint" in this.elements[state][item]) {
          ;(this.elements[state][item] as Sprite).tint = rgbtoHex(
            brightness * 255,
            brightness * 255,
            brightness * 255
          )
        }
      }
    }
  }

  setLength(length: number) {
    if (!this.loaded) return
    if (this.lastLength == length) return
    this.lastLength = length
    const bbO =
      this.metrics[`${this.note.type as HoldNoteType}BodyBottomOffset`]
    const btO = this.metrics[`${this.note.type as HoldNoteType}BodyTopOffset`]

    const states = ["Active", "Inactive"] as const
    const sign = length >= 0 ? 1 : -1
    const absLength = Math.abs(length)
    for (const state of states) {
      this.elements[state].Body.height = Math.max(0, absLength + bbO - btO)
      this.elements[state].Body.y = absLength + bbO

      this.elements[state].BottomCap.y = absLength + bbO

      if (this.elements[state].BottomCap.y < 0) {
        this.elements[state].BottomCap.cropTop(
          -this.elements[state].BottomCap.y
        )
        if (length < 0) {
          this.elements[state].BottomCap.y -=
            this.elements[state].BottomCap.y /
            Math.abs(this.elements[state].BottomCap.scale.y)
        }
      } else {
        this.elements[state].BottomCap.cropTop(0)
      }

      this.elements[state].TopCap.y = btO
      const bottomCapScale = Math.abs(this.elements[state].BottomCap.scale.y)
      this.elements[state].BottomCap.scale.y =
        length < 0 ? -bottomCapScale : bottomCapScale
      const topCapScale = Math.abs(this.elements[state].TopCap.scale.y)
      this.elements[state].TopCap.scale.y =
        length < 0 ? -topCapScale : topCapScale

      this.elements[state].Body.height *= sign
      this.elements[state].Body.y *= sign
      this.elements[state].BottomCap.y *= sign
      this.elements[state].TopCap.y *= sign
    }
  }
}

export class Notefield extends Container implements ChartRendererComponent {
  readonly isEditGUI = false
  noteskinOptions?: NoteskinOptions
  noteskin?: Noteskin
  readonly gameType
  readonly renderer
  private receptors?: ReceptorContainer
  private notes?: NoteContainer
  private selectionNotes?: SelectionNoteContainer
  private flashes?: NoteFlashContainer
  private holdJudges?: HoldJudgementContainer
  private ghostNote?: NoteWrapper
  private ghostNoteEntry?: NotedataEntry

  private readonly columnX: number[] = []

  constructor(renderer: ChartRenderer) {
    super()

    this.renderer = renderer
    this.gameType = renderer.chart.gameType
    NoteskinRegistry.getNoteskin(
      this.gameType,
      Options.chart.noteskin.name
    ).then(noteskinOptions => {
      if (!noteskinOptions) {
        WaterfallManager.createFormatted(
          "Couldn't find an available noteskin!",
          "error"
        )
        return
      }

      // Calculate column x positions
      let accumulatedWidth = 0

      for (let colNum = 0; colNum < this.gameType.numCols; colNum++) {
        const colWidth = this.gameType.columnWidths[colNum]
        this.columnX.push(
          accumulatedWidth - this.gameType.notefieldWidth / 2 + colWidth / 2
        )
        accumulatedWidth += colWidth
      }

      this.noteskinOptions = noteskinOptions
      this.noteskin = new Noteskin(this.renderer, noteskinOptions)

      this.receptors = new ReceptorContainer(this)
      this.flashes = new NoteFlashContainer(this)
      this.notes = new NoteContainer(this)
      this.selectionNotes = new SelectionNoteContainer(this)

      this.holdJudges = new HoldJudgementContainer(this)
      this.addChild(
        this.receptors,
        this.notes,
        this.selectionNotes,
        this.flashes,
        this.holdJudges
      )

      EventHandler.emit("noteskinLoaded")
    })
  }

  setGhostNote(note?: NotedataEntry): void {
    this.ghostNote?.destroy()
    this.ghostNote = undefined
    this.ghostNoteEntry = note
    if (!note) return
    this.ghostNote = this.createNote(note)
    this.addChildAt(this.ghostNote, 1)
    this.ghostNote.alpha = 0.4
    this.ghostNote.x = this.getColumnX(note.col)
    this.ghostNote.y = this.renderer.getYPosFromBeat(note.beat)
  }

  getElement(
    element: NoteskinElementOptions,
    options: Partial<NoteskinElementCreationOptions> = {}
  ): NoteskinSprite {
    return this.noteskin!.getElement(element, options)
  }

  update(firstBeat: number, lastBeat: number): void {
    if (this.noteskin === undefined) return
    this.noteskin.update(this.renderer)
    this.receptors!.update()
    this.flashes!.update()
    this.notes!.update(firstBeat, lastBeat)
    this.selectionNotes!.update(firstBeat, lastBeat)
    this.holdJudges!.update()

    if (this.ghostNote) {
      this.ghostNote.y = this.renderer.getYPosFromBeat(
        this.ghostNoteEntry!.beat
      )
      this.ghostNote.visible =
        Options.chart.mousePlacement &&
        this.renderer.chartManager.getMode() == EditMode.Edit &&
        this.renderer.chartManager.editTimingMode == EditTimingMode.Off &&
        this.ghostNoteEntry!.beat >= firstBeat &&
        this.ghostNoteEntry!.beat <= lastBeat &&
        this.ghostNoteEntry!.beat >= 0
    }
  }

  onJudgement(col: number, judge: TimingWindow): void {
    if (this.noteskin === undefined) return
    if (this.renderer.chartManager.getMode() == EditMode.Play) {
      this.holdJudges!.addJudge(col, judge)
    }
    if (isStandardTimingWindow(judge)) {
      this.noteskin.broadcast({
        type: "hit",
        judgement: judge,
        columnName: this.getColumnName(col),
        columnNumber: col,
      })
    }
    if (isHoldTimingWindow(judge)) {
      this.noteskin.broadcast({
        type: "held",
        columnName: this.getColumnName(col),
        columnNumber: col,
      })
    }
    if (isHoldDroppedTimingWindow(judge)) {
      this.noteskin.broadcast({
        type: "letgo",
        columnName: this.getColumnName(col),
        columnNumber: col,
      })
    }
    if (isStandardMissTimingWindow(judge)) {
      this.noteskin.broadcast({
        type: "miss",
        judgement: judge,
        columnName: this.getColumnName(col),
        columnNumber: col,
      })
    }
    if (isMineTimingWindow(judge)) {
      this.noteskin.broadcast({
        type: "hitmine",
        columnName: this.getColumnName(col),
        columnNumber: col,
      })
    }
  }

  startPlay(): void {}

  endPlay(): void {
    if (this.noteskin === undefined) return
    for (let i = 0; i < this.gameType.numCols; i++) {
      this.noteskin.broadcast({
        type: "holdoff",
        columnName: this.getColumnName(i),
        columnNumber: i,
      })
      this.noteskin.broadcast({
        type: "rolloff",
        columnName: this.getColumnName(i),
        columnNumber: i,
      })
      this.noteskin.broadcast({
        type: "lift",
        columnName: this.getColumnName(i),
        columnNumber: i,
      })
    }
  }

  press(col: number): void {
    if (this.noteskin === undefined) return
    this.noteskin.broadcast({
      type: "press",
      columnName: this.getColumnName(col),
      columnNumber: col,
    })
  }

  lift(col: number): void {
    if (this.noteskin === undefined) return
    this.noteskin.broadcast({
      type: "lift",
      columnName: this.getColumnName(col),
      columnNumber: col,
    })
  }

  ghostTap(col: number): void {
    if (this.noteskin === undefined) return
    this.noteskin.broadcast({
      type: "ghosttap",
      columnName: this.getColumnName(col),
      columnNumber: col,
    })
  }

  activateHold(col: number): void {
    if (this.noteskin === undefined) return
    this.noteskin.broadcast({
      type: "holdon",
      columnName: this.getColumnName(col),
      columnNumber: col,
    })
  }

  releaseHold(col: number): void {
    if (this.noteskin === undefined) return
    this.noteskin.broadcast({
      type: "holdoff",
      columnName: this.getColumnName(col),
      columnNumber: col,
    })
  }

  activateRoll(col: number): void {
    if (this.noteskin === undefined) return
    this.noteskin.broadcast({
      type: "rollon",
      columnName: this.getColumnName(col),
      columnNumber: col,
    })
  }

  releaseRoll(col: number): void {
    if (this.noteskin === undefined) return
    this.noteskin.broadcast({
      type: "rolloff",
      columnName: this.getColumnName(col),
      columnNumber: col,
    })
  }

  getColumnX(col: number) {
    return this.columnX[col] ?? 0
  }

  getColumnWidth(col: number) {
    return this.gameType.columnWidths[col]
  }

  getColumnName(col: number) {
    return this.gameType.columnNames[col]
  }

  createNote(note: NotedataEntry): NoteWrapper {
    if (isHoldNote(note)) {
      return new NoteWrapper(new HoldObject(this, note))
    } else {
      return new NoteWrapper(new NoteObject(this, note))
    }
  }
}
