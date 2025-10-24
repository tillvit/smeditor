import { Color, Sprite, Texture } from "pixi.js"
import { EditMode, EditTimingMode } from "../../chart/ChartManager"
import { NoteskinSprite } from "../../chart/gameTypes/noteskin/Noteskin"
import {
  HOLD_NOTE_TYPES,
  HoldNoteType,
  TapNoteType,
} from "../../chart/sm/NoteTypes"
import { BetterRoundedRect } from "../../util/BetterRoundedRect"
import { assignTint, blendPixiColors } from "../../util/Color"
import { EventHandler } from "../../util/EventHandler"
import { Options } from "../../util/Options"
import { Themes } from "../../util/Theme"
import { Widget } from "./Widget"
import { WidgetManager } from "./WidgetManager"

interface NoteArrow {
  sprite: NoteskinSprite
  bg: Sprite
  highlight: BetterRoundedRect
  type: string
  hovered: boolean
}

export class StatusWidget extends Widget {
  private noteArrows: NoteArrow[] = []
  private readonly noteArrowMask: Sprite

  private trackingMovement = true
  private idleFrames = 0
  private lastMode: EditMode | null = null
  private lastTimingMode: EditTimingMode | null = null
  private lastBounds?: DOMRect

  constructor(manager: WidgetManager) {
    super(manager)

    EventHandler.on("resize", () => {
      this.trackingMovement = true
      this.idleFrames = 5
    })

    EventHandler.on("noteskinLoaded", () => {
      this.noteArrows.forEach(noteArrow => {
        this.removeChild(noteArrow.sprite)
        this.removeChild(noteArrow.bg)
        this.removeChild(noteArrow.highlight)
      })
      this.noteArrows = []
      if (!this.manager.chartManager.loadedChart) return
      for (const type of this.manager.chartManager.loadedChart.gameType
        .editNoteTypes) {
        if (HOLD_NOTE_TYPES.includes(type as HoldNoteType)) continue
        const sprite = this.manager.chartManager
          .chartView!.getNotefield()
          .createNote({
            type: type as TapNoteType,
            beat: 0,
            col: 0,
            quant: 4,
            second: 0,
            warped: false,
            fake: false,
          })
        sprite.scale.set(0.5)
        const bg = new Sprite(Texture.WHITE)
        assignTint(bg, "widget-bg")
        bg.width = 48
        bg.height = 48
        bg.anchor.set(0.5)
        const highlight = new BetterRoundedRect("noBorder")
        highlight.alpha = 0
        highlight.width = 48
        highlight.height = 48
        highlight.pivot.x = 24
        highlight.pivot.y = 24
        const noteArrow = {
          sprite,
          type,
          bg,
          highlight,
          hovered: false,
        }
        this.addChild(bg)
        this.addChild(sprite)
        this.addChild(highlight)
        bg.position = sprite.position
        this.noteArrows.push(noteArrow)
      }
      this.trackingMovement = true
      this.idleFrames = 5
    })

    this.noteArrowMask = new Sprite(Texture.WHITE)
    this.noteArrowMask.height = 48
    this.noteArrowMask.width = 2500
    this.noteArrowMask.anchor.y = 1
    this.noteArrowMask.anchor.x = 0.5
    this.addChild(this.noteArrowMask)
    this.mask = this.noteArrowMask
  }

  update(): void {
    this.scale.set(1 / this.manager.chartManager.app.stage.scale.x)
    this.visible = true

    const mode = this.manager.chartManager.getMode()
    const timingMode = this.manager.chartManager.editTimingMode
    const view = document.getElementById("status-widget")
    if (this.lastMode != mode || this.lastTimingMode != timingMode) {
      this.trackingMovement = true
      this.idleFrames = 5
      this.lastMode = mode
      this.lastTimingMode = timingMode
    }

    if (this.trackingMovement && view) {
      let placeholderSize = 48

      const firstArrow = this.noteArrows[0]
      if (firstArrow) {
        const element = view.querySelector(
          `.note-placeholder[data-note-type="${firstArrow.type}"]`
        ) as HTMLElement
        if (!element) return
        const bounds = element.getBoundingClientRect()
        placeholderSize = bounds.width
        this.noteArrows.forEach((noteArrow, index) => {
          noteArrow.sprite.position.y =
            bounds.top -
            this.manager.app.view.clientHeight / 2 -
            this.manager.app.view.getBoundingClientRect().top +
            placeholderSize / 2
          noteArrow.sprite.position.x =
            bounds.left -
            this.manager.app.view.clientWidth / 2 +
            placeholderSize / 2 +
            index * placeholderSize
          noteArrow.sprite.scale.set(placeholderSize / 96)
          noteArrow.bg.width = placeholderSize
          noteArrow.bg.height = placeholderSize
          // noteArrow.bg.pivot.set(placeholderSize / 2)
          noteArrow.bg.position = noteArrow.sprite.position
          noteArrow.highlight.width = placeholderSize
          noteArrow.highlight.height = placeholderSize
          noteArrow.highlight.position = noteArrow.sprite.position
          noteArrow.highlight.pivot.set(placeholderSize / 2)
        })
        if (this.lastBounds) {
          const delta =
            Math.abs(this.lastBounds.top - bounds.top) +
            Math.abs(this.lastBounds.left - bounds.left)
          if (delta == 0) {
            this.idleFrames--
            if (this.idleFrames < 0) {
              this.trackingMovement = false
              this.lastBounds = undefined
              if (timingMode != EditTimingMode.Off) {
                this.visible = false
              }
            }
          }
        }
        this.lastBounds = bounds
      }
      const viewbounds = view.getBoundingClientRect()
      this.noteArrowMask.y =
        viewbounds.bottom -
        this.manager.app.view.clientHeight / 2 -
        this.manager.app.view.getBoundingClientRect().top
      this.noteArrowMask.height = placeholderSize
    }

    const noteType = this.manager.chartManager.getEditingNoteType()
    const hoverColor = Themes.getColor("editable-overlay-hover")
    const activeColor = Themes.getColor("editable-overlay-active")
    const emptyColor = new Color(hoverColor).setAlpha(0)
    this.noteArrows.forEach(arrow => {
      let color =
        noteType == arrow.type
          ? activeColor
          : arrow.hovered
            ? hoverColor
            : emptyColor
      if (Options.general.smoothAnimations) {
        color = new Color(
          blendPixiColors(
            new Color(arrow.highlight.tint).setAlpha(arrow.highlight.alpha),
            color,
            0.3
          )
        )
      }
      arrow.highlight.tint = color.toNumber()
      arrow.highlight.alpha = color.alpha
    })
  }
}
