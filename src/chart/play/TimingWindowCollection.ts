import { Texture } from "pixi.js"
import { JudgmentTexture } from "../renderer/JudgmentTexture"
import { NotedataEntry, NoteType } from "../sm/NoteTypes"
import { HoldTimingWindow } from "./HoldTimingWindow"
import { MineTimingWindow } from "./MineTimingWindow"
import { TimingWindow } from "./TimingWindow"

export class TimingWindowCollection {

  static ITG: TimingWindowCollection = new TimingWindowCollection([
    new TimingWindow("Fantastic", 0x21cce8, 23, 5, 0.008, JudgmentTexture.ITG, Texture.from('assets/noteskin/flash/fantastic.png')),
    new TimingWindow("Excellent", 0xe29c18, 44.5, 4, 0.008, JudgmentTexture.ITG, Texture.from('assets/noteskin/flash/excellent.png')),
    new TimingWindow("Great", 0x66c955, 103.5, 2, 0.004, JudgmentTexture.ITG, Texture.from('assets/noteskin/flash/great.png')),
    new TimingWindow("Decent", 0xb45cff, 136.5, 0, 0, JudgmentTexture.ITG, Texture.from('assets/noteskin/flash/decent.png')),
    new TimingWindow("Way Off", 0xc9855e, 181.5, -6, -0.050, JudgmentTexture.ITG, Texture.from('assets/noteskin/flash/way_off.png')),
    new TimingWindow("Miss", 0xff3030, 0, -12, -0.1, JudgmentTexture.ITG),
    new HoldTimingWindow("Hold", 0xe29c18, 321.5, 5, -0.008),
    new HoldTimingWindow("Roll", 0xe29c18, 351.5, 5, -0.008),
    new HoldTimingWindow("Dropped", 0xff3030, 0, 0, -0.080),
    new MineTimingWindow(0x808080, 71.5, -6, -0.050, Texture.from('assets/noteskin/flash/mine.png'))
  ], 103.5)

  static FA: TimingWindowCollection = new TimingWindowCollection([
    new TimingWindow("Fantastic", 0x21cce8, 15, 3.5, 0.008, JudgmentTexture.ITG, Texture.from('assets/noteskin/flash/fantastic.png')),
    new TimingWindow("White Fantastic", 0xffffff, 23, 3, 0.008, JudgmentTexture.ITG, Texture.from('assets/noteskin/flash/white_fantastic.png')),
    new TimingWindow("Excellent", 0xe29c18, 44.5, 2, 0.008, JudgmentTexture.ITG, Texture.from('assets/noteskin/flash/excellent.png')),
    new TimingWindow("Great", 0x66c955, 103.5, 1, 0.004, JudgmentTexture.ITG, Texture.from('assets/noteskin/flash/great.png')),
    new TimingWindow("Decent", 0xb45cff, 136.5, 0, 0, JudgmentTexture.ITG, Texture.from('assets/noteskin/flash/decent.png')),
    new TimingWindow("Way Off", 0xc9855e, 181.5, 0, -0.050, JudgmentTexture.ITG, Texture.from('assets/noteskin/flash/way_off.png')),
    new TimingWindow("Miss", 0xff3030, 0, 0, -0.1, JudgmentTexture.ITG),
    new HoldTimingWindow("Hold", 0xe29c18, 321.5, 1, -0.008),
    new HoldTimingWindow("Roll", 0xe29c18, 351.5, 1, -0.008),
    new HoldTimingWindow("Dropped", 0xff3030, 0, 0, -0.080),
    new MineTimingWindow(0x808080, 71.5, -1, -0.050, Texture.from('assets/noteskin/flash/mine.png')),
  ], 103.5)

  static WATERFALL: TimingWindowCollection = new TimingWindowCollection([
    new TimingWindow("Masterful", 0xff00be, 15, 10, 0.008, JudgmentTexture.WATERFALL, Texture.from('assets/noteskin/flash/fantastic.png')),
    new TimingWindow("Awesome", 0xffff00, 30, 9, 0.008, JudgmentTexture.WATERFALL, Texture.from('assets/noteskin/flash/excellent.png')),
    new TimingWindow("Solid", 0x00c800, 50, 6, 0.008, JudgmentTexture.WATERFALL, Texture.from('assets/noteskin/flash/great.png')),
    new TimingWindow("OK", 0x0080ff, 100, 3, 0.004, JudgmentTexture.WATERFALL, Texture.from('assets/noteskin/flash/decent.png')),
    new TimingWindow("Fault", 0x808080, 160, 0, 0, JudgmentTexture.WATERFALL, Texture.from('assets/noteskin/flash/way_off.png')),
    new TimingWindow("Miss", 0xff3030, 0, 0, -0.1, JudgmentTexture.WATERFALL),
    new HoldTimingWindow("Hold", 0xe29c18, 300, 6, -0.008),
    new HoldTimingWindow("Roll", 0xe29c18, 350, 6, -0.008),
    new HoldTimingWindow("Dropped", 0xff3030, 0, 0, -0.080),
    new MineTimingWindow(0x808080, 71.5, -3, -0.050, Texture.from('assets/noteskin/flash/mine.png')),
  ], 100)


  private windows: TimingWindow[] =[]
  private holdWindows: Map<NoteType | "Dropped", HoldTimingWindow> = new Map
  private missWindow: TimingWindow
  private droppedWindow: HoldTimingWindow
  private mineWindow: MineTimingWindow
  private hideLimitMS: number

  constructor(windows: TimingWindow[], minHideMS: number) {
    for (let window of windows) {
      if ((window as HoldTimingWindow).noteType) {
        this.holdWindows.set((window as HoldTimingWindow).noteType, window as HoldTimingWindow)
      }else{
        this.windows.push(window)
      }
    }
    this.missWindow = this.getMissWindow()
    this.droppedWindow = this.getDroppedWindow()
    this.mineWindow = this.getMineWindow()
    this.windows = this.windows.filter(window => window != this.missWindow && window != this.mineWindow)
    this.holdWindows.delete("Dropped")
    this.windows.sort((a, b) => a.timingWindowMS - b.timingWindowMS)
    this.hideLimitMS = minHideMS
  }

  judgeInput(error: number): TimingWindow {
    for (let window of this.windows) {
      if (window.getTimingWindowMS()/1000 >= Math.abs(error)) {
        return window
      }
    }
    return this.missWindow
  }

  shouldDropHold(note: NotedataEntry, time: number): boolean {
    if (!note.hold || !note.lastActivation) return false
    let window = this.holdWindows.get(note.type)
    if (!window) return false
    return (time - note.lastActivation) >= window.getTimingWindowMS()/1000
  }

  getHeldJudgement(note: NotedataEntry): HoldTimingWindow {
    return this.holdWindows.get(note.type) ?? new HoldTimingWindow("Hold", 0xe29c18, 32, 5, -0.008)
  }

  getMissJudgment(): TimingWindow {
    return this.missWindow
  }

  getDroppedJudgment(): HoldTimingWindow {
    return this.droppedWindow
  }

  getMineJudgment(): MineTimingWindow {
    return this.mineWindow
  }

  shouldHideNote(judgment: TimingWindow) {
    return judgment.timingWindowMS <= this.hideLimitMS
  }

  maxWindowMS(): number {
    return this.windows.at(-1)?.getTimingWindowMS() ?? 0
  }

  getMaxDancePoints(): number {
    return Math.max(...this.windows.map(window => window.dancePoints), this.missWindow.dancePoints)
  }

  getMaxHoldDancePoints(noteType: NoteType): number {
    return Math.max(this.holdWindows.get(noteType)?.dancePoints ?? 0, this.droppedWindow.dancePoints)
  }

  private getMissWindow(): TimingWindow {
    return this.windows.filter(window => window.name.toLowerCase() == "miss")[0] ?? 
    new TimingWindow("Miss", 0xff3030, 0, -12, -0.1, JudgmentTexture.ITG)
  }

  private getMineWindow(): MineTimingWindow {
    return this.windows.filter(window => window.name.toLowerCase() == "mine")[0] ?? 
    new MineTimingWindow(0x808080, 71.5, -3, -0.050, Texture.from('assets/noteskin/flash/mine.png'))
  }

  private getDroppedWindow(): HoldTimingWindow {
    return Array.from(this.holdWindows.values()).filter(window => window.noteType == "Dropped")[0] ??
    new HoldTimingWindow("Dropped", 0xff3030, 0, 0, -0.08)
  }
}