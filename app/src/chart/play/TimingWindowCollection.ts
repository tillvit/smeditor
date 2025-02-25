import { HoldNotedataEntry } from "../sm/NoteTypes"
import { HoldDroppedTimingWindow } from "./HoldDroppedTimingWindow"
import { HoldTimingWindow } from "./HoldTimingWindow"
import { JudgementTexture } from "./JudgementTexture"
import { MineTimingWindow } from "./MineTimingWindow"
import { StandardMissTimingWindow } from "./StandardMissTimingWindow"
import { StandardTimingWindow } from "./StandardTimingWindow"
import { TimingWindow } from "./TimingWindow"

export function isStandardTimingWindow(
  window: TimingWindow
): window is StandardTimingWindow {
  return (
    (window as StandardTimingWindow).color != undefined &&
    (window as StandardMissTimingWindow).id != "miss"
  )
}

export function isStandardMissTimingWindow(
  window: TimingWindow
): window is StandardMissTimingWindow {
  return (
    (window as StandardMissTimingWindow).color != undefined &&
    (window as StandardMissTimingWindow).id == "miss"
  )
}

export function isHoldTimingWindow(
  window: TimingWindow
): window is HoldTimingWindow {
  return !!(window as HoldTimingWindow).noteType
}

export function isHoldDroppedTimingWindow(
  window: TimingWindow
): window is HoldDroppedTimingWindow {
  return (window as HoldDroppedTimingWindow).target == "dropped"
}

export function isMineTimingWindow(
  window: TimingWindow
): window is MineTimingWindow {
  return (window as MineTimingWindow).target == "mine"
}

export class TimingWindowCollection {
  private static COLLECTIONS: Record<string, TimingWindowCollection> = {
    ITG: new TimingWindowCollection(
      [
        new StandardTimingWindow(
          "w0",
          "Fantastic",
          0x21cce8,
          23,
          5,
          0.008,
          JudgementTexture.ITG
        ),
        new StandardTimingWindow(
          "w2",
          "Excellent",
          0xe29c18,
          44.5,
          4,
          0.008,
          JudgementTexture.ITG
        ),
        new StandardTimingWindow(
          "w3",
          "Great",
          0x66c955,
          103.5,
          2,
          0.004,
          JudgementTexture.ITG
        ),
        new StandardTimingWindow(
          "w4",
          "Decent",
          0xb45cff,
          136.5,
          0,
          0,
          JudgementTexture.ITG
        ),
        new StandardTimingWindow(
          "w5",
          "Way Off",
          0xc9855e,
          181.5,
          -6,
          -0.05,
          JudgementTexture.ITG
        ),
        new StandardMissTimingWindow(
          "Miss",
          0xff3030,
          -12,
          -0.1,
          JudgementTexture.ITG
        ),
        new HoldTimingWindow("Hold", 321.5, 5, -0.008),
        new HoldTimingWindow("Roll", 351.5, 5, -0.008),
        new HoldDroppedTimingWindow(0, -0.08),
        new MineTimingWindow(71.5, -6, -0.05),
      ],
      103.5
    ),

    FA: new TimingWindowCollection(
      [
        new StandardTimingWindow(
          "w0",
          "Fantastic",
          0x21cce8,
          15,
          3.5,
          0.008,
          JudgementTexture.ITG
        ),
        new StandardTimingWindow(
          "w1",
          "Fantastic",
          0xffffff,
          23,
          3,
          0.008,
          JudgementTexture.ITG
        ),
        new StandardTimingWindow(
          "w2",
          "Excellent",
          0xe29c18,
          44.5,
          2,
          0.008,
          JudgementTexture.ITG
        ),
        new StandardTimingWindow(
          "w3",
          "Great",
          0x66c955,
          103.5,
          1,
          0.004,
          JudgementTexture.ITG
        ),
        new StandardTimingWindow(
          "w4",
          "Decent",
          0xb45cff,
          136.5,
          0,
          0,
          JudgementTexture.ITG
        ),
        new StandardTimingWindow(
          "w5",
          "Way Off",
          0xc9855e,
          181.5,
          0,
          -0.05,
          JudgementTexture.ITG
        ),
        new StandardMissTimingWindow(
          "Miss",
          0xff3030,
          0,
          -0.1,
          JudgementTexture.ITG
        ),
        new HoldTimingWindow("Hold", 321.5, 1, -0.008),
        new HoldTimingWindow("Roll", 351.5, 1, -0.008),
        new HoldDroppedTimingWindow(0, -0.08),
        new MineTimingWindow(71.5, -1, -0.05),
      ],
      103.5
    ),

    WATERFALL: new TimingWindowCollection(
      [
        new StandardTimingWindow(
          "w0",
          "Masterful",
          0xff00be,
          15,
          10,
          0.008,
          JudgementTexture.WATERFALL
        ),
        new StandardTimingWindow(
          "w2",
          "Awesome",
          0xffff00,
          30,
          9,
          0.008,
          JudgementTexture.WATERFALL
        ),
        new StandardTimingWindow(
          "w3",
          "Solid",
          0x00c800,
          50,
          6,
          0.008,
          JudgementTexture.WATERFALL
        ),
        new StandardTimingWindow(
          "w4",
          "OK",
          0x0080ff,
          100,
          3,
          0.004,
          JudgementTexture.WATERFALL
        ),
        new StandardTimingWindow(
          "w5",
          "Fault",
          0x808080,
          160,
          0,
          0,
          JudgementTexture.WATERFALL
        ),
        new StandardMissTimingWindow(
          "Miss",
          0xff3030,
          0,
          -0.1,
          JudgementTexture.WATERFALL
        ),
        new HoldTimingWindow("Hold", 300, 6, -0.008),
        new HoldTimingWindow("Roll", 350, 6, -0.008),
        new HoldDroppedTimingWindow(0, -0.08),
        new MineTimingWindow(71.5, -3, -0.05),
      ],
      100
    ),
    PUMP: new TimingWindowCollection(
      [
        new StandardTimingWindow(
          "w0",
          "Perfect",
          0x21cce8,
          102.167,
          10,
          0.008,
          JudgementTexture.PUMP
        ),
        new StandardTimingWindow(
          "w3",
          "Great",
          0x66c955,
          143.833,
          6,
          0.008,
          JudgementTexture.PUMP
        ),
        new StandardTimingWindow(
          "w4",
          "Good",
          0xfac32a,
          185.5,
          3,
          0.004,
          JudgementTexture.PUMP
        ),
        new StandardTimingWindow(
          "w5",
          "Bad",
          0xb45cff,
          227.166,
          0,
          0,
          JudgementTexture.PUMP
        ),
        new StandardMissTimingWindow(
          "Miss",
          0xff3030,
          0,
          -0.1,
          JudgementTexture.PUMP
        ),
        new HoldTimingWindow("Hold", 102.167, 6, -0.008),
        new HoldTimingWindow("Roll", 350, 6, -0.008),
        new HoldDroppedTimingWindow(0, -0.08),
        new MineTimingWindow(71.5, -3, -0.05),
      ],
      185.5
    ),
  }

  private windows: StandardTimingWindow[] = []
  private holdWindows: Record<string, HoldTimingWindow> = {}
  private readonly missWindow: StandardMissTimingWindow
  private readonly droppedWindow: HoldDroppedTimingWindow
  private readonly mineWindow: MineTimingWindow
  private readonly hideLimitMS: number

  constructor(windows: TimingWindow[], minHideMS: number) {
    this.missWindow = new StandardMissTimingWindow(
      "Miss",
      0xff3030,
      -12,
      -0.1,
      JudgementTexture.ITG
    )
    this.droppedWindow = new HoldDroppedTimingWindow(0, -0.08)
    this.mineWindow = new MineTimingWindow(71.5, -1, -0.05)
    for (const window of windows) {
      if (isStandardTimingWindow(window)) this.windows.push(window)
      else if (isStandardMissTimingWindow(window)) this.missWindow = window
      else if (isHoldTimingWindow(window))
        this.holdWindows[window.noteType] = window
      else if (isHoldDroppedTimingWindow(window)) this.droppedWindow = window
      else if (isMineTimingWindow(window)) this.mineWindow = window
    }
    this.windows.sort((a, b) => a.timingWindowMS - b.timingWindowMS)
    this.hideLimitMS = minHideMS
  }

  /**
   * Returns the achieved judgement given an error in ms.
   *
   * @param {number} error
   * @return {*}  {StandardTimingWindow}
   * @memberof TimingWindowCollection
   */
  judgeInput(error: number): StandardTimingWindow {
    for (const window of this.windows) {
      if (window.getTimingWindowMS() / 1000 >= Math.abs(error)) {
        return window
      }
    }
    return this.missWindow
  }

  /**
   * Gets the held judgement in this collection for a given note.
   *
   * @param {HoldNotedataEntry} note
   * @return {*}  {HoldTimingWindow}
   * @memberof TimingWindowCollection
   */
  getHeldJudgement(note: HoldNotedataEntry): HoldTimingWindow {
    return this.holdWindows[note.type]
  }

  /**
   * Gets this miss judgement in this collection.
   *
   * @return {*}  {StandardMissTimingWindow}
   * @memberof TimingWindowCollection
   */
  getMissJudgement(): StandardMissTimingWindow {
    return this.missWindow
  }

  /**
   * Gets the dropped judgement in this collection.
   *
   * @return {*}  {HoldDroppedTimingWindow}
   * @memberof TimingWindowCollection
   */
  getDroppedJudgement(): HoldDroppedTimingWindow {
    return this.droppedWindow
  }

  /**
   * Gets the mine judgement in this collection.
   *
   * @return {*}  {MineTimingWindow}
   * @memberof TimingWindowCollection
   */
  getMineJudgement(): MineTimingWindow {
    return this.mineWindow
  }

  /**
   * Determines if a note should be hidden.
   *
   * @param {StandardTimingWindow} judgement
   * @return {*}  {boolean}
   * @memberof TimingWindowCollection
   */
  shouldHideNote(judgement: StandardTimingWindow): boolean {
    return (
      judgement.id != "miss" && judgement.timingWindowMS <= this.hideLimitMS
    )
  }

  /**
   * Returns the maximum MS to get a judgement (non-miss).
   *
   * @return {*}  {number}
   * @memberof TimingWindowCollection
   */
  maxWindowMS(): number {
    return this.windows.at(-1)?.getTimingWindowMS() ?? 0
  }

  /**
   * Returns the maximum dance points achievable for one judgement.
   *
   * @return {*}  {number}
   * @memberof TimingWindowCollection
   */
  getMaxDancePoints(): number {
    return Math.max(
      ...this.windows.map(window => window.dancePoints),
      this.missWindow.dancePoints
    )
  }

  /**
   * Returns the maximum dance points achievable for one hold judgement.
   *
   * @return {*}  {number}
   * @memberof TimingWindowCollection
   */
  getMaxHoldDancePoints(noteType: string): number {
    return Math.max(
      this.holdWindows[noteType].dancePoints ?? 0,
      this.droppedWindow.dancePoints
    )
  }

  /**
   * Returns the standard timing windows.
   *
   * @return {*}  {StandardTimingWindow[]}
   * @memberof TimingWindowCollection
   */
  getStandardWindows(): StandardTimingWindow[] {
    return [...this.windows]
  }

  /**
   * Returns the hold timing windows.
   *
   * @return {*}  {HoldTimingWindow[]}
   * @memberof TimingWindowCollection
   */
  getHoldWindows(): HoldTimingWindow[] {
    return [...Object.values(this.holdWindows)]
  }

  /**
   * Returns the TimingWindowCollection with the given name.
   *
   * @static
   * @param {string} name
   * @return {*}  {TimingWindowCollection}
   * @memberof TimingWindowCollection
   */
  static getCollection(name: string): TimingWindowCollection {
    return this.COLLECTIONS[name] ?? this.COLLECTIONS.ITG
  }

  /**
   * Returns all the TimingWindowCollections registered.
   *
   * @static
   * @return {*}
   * @memberof TimingWindowCollection
   */
  static getCollections(): any {
    return TimingWindowCollection.COLLECTIONS
  }
}
