import { Container, Sprite, Texture } from "pixi.js"
import { WaterfallManager } from "../../../gui/element/WaterfallManager"
import { rgbtoHex } from "../../../util/Color"
import { EventHandler } from "../../../util/EventHandler"
import { Options } from "../../../util/Options"
import { EditMode, EditTimingMode } from "../../ChartManager"
import { ChartRenderer, ChartRendererComponent } from "../../ChartRenderer"
import {
  NoteSkin,
  NoteSkinElementCreationOptions,
  NoteSkinElementOptions,
  NoteSkinOptions,
  NoteSkinSprite,
} from "../../gameTypes/noteskin/NoteSkin"
import { NoteSkinRegistry } from "../../gameTypes/noteskin/NoteSkinRegistry"
import { TimingWindow } from "../../play/TimingWindow"
import {
  isHoldDroppedTimingWindow,
  isHoldTimingWindow,
  isMineTimingWindow,
  isStandardMissTimingWindow,
  isStandardTimingWindow,
} from "../../play/TimingWindowCollection"
import { NotedataEntry, PartialNotedataEntry } from "../../sm/NoteTypes"
import { HoldJudgementContainer } from "./HoldJudgementContainer"
import { NoteContainer } from "./NoteContainer"
import { NoteFlashContainer } from "./NoteFlashContainer"
import { ReceptorContainer } from "./ReceptorContainer"
import { SelectionNoteContainer } from "./SelectionNoteContainer"

import fakeIcon from "../../../../assets/icon/fake.png"
import liftIcon from "../../../../assets/icon/lift.png"

const ICONS: Record<string, Texture> = {
  Fake: Texture.from(fakeIcon),
  Lift: Texture.from(liftIcon),
}

export type NotefieldObject = NoteObject | HoldObject

export class NoteWrapper extends Container {
  object: NotefieldObject
  icon
  constructor(
    object: NotefieldObject,
    note: PartialNotedataEntry,
    notefield: Notefield
  ) {
    super()
    this.object = object

    this.icon = new Sprite(ICONS[note.type])
    this.icon.anchor.set(0.5)
    this.icon.scale.set(0.3)
    this.icon.alpha = 0.8

    this.addChild(object, this.icon)

    notefield.noteskin?.onUpdate(this, cr => {
      if (!Options.chart.drawIcons) {
        this.icon.visible = false
        return
      }
      if (notefield.noteskinOptions?.hideIcons?.includes(note.type)) {
        this.icon.visible = false
        return
      }
      this.icon.visible = true
      if (note.type == "Fake") {
        this.icon.visible = cr.chartManager.getMode() != EditMode.Play
      }
    })
  }
}

export interface NoteObject extends Container {
  type: "note"
}

interface HoldObjectOptions {
  Active: {
    Body: NoteSkinSprite
    TopCap: NoteSkinSprite
    BottomCap: NoteSkinSprite
    Head: NoteSkinSprite
  }
  Inactive: {
    Body: NoteSkinSprite
    TopCap: NoteSkinSprite
    BottomCap: NoteSkinSprite
    Head: NoteSkinSprite
  }
}

export class HoldObject extends Container {
  type = "hold"

  private active
  private inactive

  private wasActive = false

  private options

  constructor(options: HoldObjectOptions) {
    super()
    const active = new Container()
    const inactive = new Container()

    active.addChild(
      options.Active.BottomCap,
      options.Active.Body,
      options.Active.TopCap,
      options.Active.Head
    )
    inactive.addChild(
      options.Inactive.BottomCap,
      options.Inactive.Body,
      options.Inactive.TopCap,
      options.Inactive.Head
    )

    this.options = options

    active.visible = false

    this.active = active
    this.inactive = inactive

    this.addChild(inactive, active)
  }

  setActive(active: boolean) {
    if (this.wasActive != active) {
      this.wasActive = active
      this.active.visible = active
      this.inactive.visible = !active
    }
  }

  setBrightness(brightness: number) {
    const states = ["Active", "Inactive"] as const
    const items = ["Body", "TopCap", "BottomCap"] as const
    for (const state of states) {
      for (const item of items) {
        if ("tint" in this.options[state][item]) {
          ;(this.options[state][item] as Sprite).tint = rgbtoHex(
            brightness * 255,
            brightness * 255,
            brightness * 255
          )
        }
      }
    }
  }

  setLength(length: number) {
    const states = ["Active", "Inactive"] as const
    for (const state of states) {
      this.options[state].Body.height = length
      this.options[state].Body.y = length
      this.options[state].BottomCap.y = length
      const bottomCapScale = Math.abs(this.options[state].BottomCap.scale.y)

      this.options[state].BottomCap.scale.y =
        length < 0 ? -bottomCapScale : bottomCapScale
    }
  }
}

export class Notefield extends Container implements ChartRendererComponent {
  noteskinOptions?: NoteSkinOptions
  noteskin?: NoteSkin
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
    NoteSkinRegistry.getNoteSkin(
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
      this.noteskin = new NoteSkin(this.renderer, noteskinOptions)

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
    element: NoteSkinElementOptions,
    options: Partial<NoteSkinElementCreationOptions> = {}
  ): NoteSkinSprite {
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
    this.holdJudges!.addJudge(col, judge)
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
    if (this.noteskin === undefined) {
      const a = new Container() as NoteObject
      a.type = "note"
      return new NoteWrapper(a, { beat: 0, type: "Tap", col: 0 }, this)
    }
    const ns = this.noteskin
    const col = this.getColumnName(note.col)
    const opts = { note, columnName: col, columnNumber: note.col }
    switch (note.type) {
      case "Tap":
      case "Lift":
      case "Fake":
      case "Mine": {
        const element = ns.getElement(
          { element: note.type, columnName: col, columnNumber: note.col },
          opts
        ) as NotefieldObject
        element.type = "note"
        return new NoteWrapper(element, note, this)
      }
      case "Hold":
      case "Roll": {
        return new NoteWrapper(
          new HoldObject({
            Active: {
              Body: ns.getElement(
                {
                  element: `${note.type} Active Body`,
                  columnName: col,
                  columnNumber: note.col,
                },
                opts
              ),
              TopCap: ns.getElement(
                {
                  element: `${note.type} Active TopCap`,
                  columnName: col,
                  columnNumber: note.col,
                },
                opts
              ),
              BottomCap: ns.getElement(
                {
                  element: `${note.type} Active BottomCap`,
                  columnName: col,
                  columnNumber: note.col,
                },
                opts
              ),
              Head: ns.getElement(
                {
                  element: `${note.type} Active Head`,
                  columnName: col,
                  columnNumber: note.col,
                },
                opts
              ),
            },
            Inactive: {
              Body: ns.getElement(
                {
                  element: `${note.type} Inactive Body`,
                  columnName: col,
                  columnNumber: note.col,
                },
                opts
              ),
              TopCap: ns.getElement(
                {
                  element: `${note.type} Inactive TopCap`,
                  columnName: col,
                  columnNumber: note.col,
                },
                opts
              ),
              BottomCap: ns.getElement(
                {
                  element: `${note.type} Inactive BottomCap`,
                  columnName: col,
                  columnNumber: note.col,
                },
                opts
              ),
              Head: ns.getElement(
                {
                  element: `${note.type} Inactive Head`,
                  columnName: col,
                  columnNumber: note.col,
                },
                opts
              ),
            },
          }),
          note,
          this
        )
      }
    }
  }
}
