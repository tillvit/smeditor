declare module "app/src/chart/stats/parity/ParityDataTypes" {
  import { HoldNotedataEntry, NotedataEntry } from "app/src/chart/sm/NoteTypes"
  export enum Foot {
    NONE = 0,
    LEFT_HEEL = 1,
    LEFT_TOE = 2,
    RIGHT_HEEL = 3,
    RIGHT_TOE = 4,
  }
  export const FEET: Foot[]
  export const OTHER_PART_OF_FOOT: Foot[]
  export const FEET_LABELS: string[]
  export const FEET_LABELS_LONG: string[]
  export const FEET_LABEL_TO_FOOT: {
    [key: string]: Foot
  }
  export type FootOverride = "Left" | "Right" | Foot
  export interface PlacementData {
    previousLeftPos: {
      x: number
      y: number
    }
    previousRightPos: {
      x: number
      y: number
    }
    leftPos: {
      x: number
      y: number
    }
    rightPos: {
      x: number
      y: number
    }
    movedLeft: boolean
    movedRight: boolean
    leftBracket: boolean
    rightBracket: boolean
    previousJumped: boolean
    jumped: boolean
    leftJack: boolean
    rightJack: boolean
    leftDoubleStep: boolean
    rightDoubleStep: boolean
    initialState: ParityState
    resultState: ParityState
  }
  export const DEFAULT_WEIGHTS: {
    [key: string]: number
  }
  export const WEIGHT_SHORT_NAMES: {
    [id: string]: string
  }
  export enum TechCategory {
    Crossovers = 0,
    Footswitches = 1,
    Sideswitches = 2,
    Jacks = 3,
    Brackets = 4,
    Doublesteps = 5,
    Holdswitch = 6,
  }
  export const TECH_STRINGS: Record<number, string>
  export enum TechErrors {
    UnmarkedDoublestep = 0,
    MissedFootswitch = 1,
    Ambiguous = 2,
  }
  export const TECH_DESCRIPTIONS: {
    [key in TechCategory]: {
      title: string
      description: string
    }
  }
  export const TECH_ERROR_STRINGS: Record<number, string>
  export const TECH_ERROR_STRING_REVERSE: Record<string, TechErrors>
  export const TECH_ERROR_DESCRIPTIONS: {
    [key in TechErrors]: {
      title: string
      description: string
    }
  }
  export class ParityState {
    action: Foot[]
    combinedColumns: Foot[]
    movedFeet: Set<Foot>
    holdFeet: Set<Foot>
    frontFoot: Foot | null
    second: number
    beat: number
    rowKey: string
    footColumns: number[]
    constructor(row: Row, action: Foot[], columns?: number[])
    get leftHeel(): number
    get leftToe(): number
    get rightHeel(): number
    get rightToe(): number
    toKey(): string
  }
  export interface Row {
    notes: (NotedataEntry | undefined)[]
    holds: (HoldNotedataEntry | undefined)[]
    holdTails: Set<number>
    mines: (number | undefined)[]
    fakeMines: (number | undefined)[]
    second: number
    beat: number
    columns: Foot[]
    overrides: FootOverride[]
    id: string
  }
}
declare module "app/src/chart/sm/NoteTypes" {
  import {
    Foot,
    FootOverride,
  } from "app/src/chart/stats/parity/ParityDataTypes"
  export type Notedata = NotedataEntry[]
  export type RowData = {
    notes: NotedataEntry[]
    beat: number
    second: number
    warped: boolean
    faked: boolean
  }
  export type PartialNotedata = PartialNotedataEntry[]
  export const HOLD_NOTE_TYPES: readonly ["Hold", "Roll"]
  export const TAP_NOTE_TYPES: readonly ["Tap", "Mine", "Lift", "Fake"]
  export type NoteType = TapNoteType | HoldNoteType
  export type HoldNoteType = (typeof HOLD_NOTE_TYPES)[number]
  export type TapNoteType = (typeof TAP_NOTE_TYPES)[number]
  export interface NotedataEntryBase {
    beat: number
    col: number
    notemods?: string
    keysounds?: string
  }
  export interface PartialTapNotedataEntry extends NotedataEntryBase {
    type: TapNoteType
  }
  export interface PartialHoldNotedataEntry extends NotedataEntryBase {
    hold: number
    type: HoldNoteType
  }
  export type PartialNotedataEntry =
    | PartialTapNotedataEntry
    | PartialHoldNotedataEntry
  interface ExtraNotedata {
    warped: boolean
    fake: boolean
    second: number
    quant: number
    gameplay?: {
      hideNote: boolean
      hasHit: boolean
    }
    parity?: {
      foot?: Foot
      override?: FootOverride
      tech?: string
    }
  }
  export type TapNotedataEntry = PartialTapNotedataEntry & ExtraNotedata
  export type HoldNotedataEntry = PartialHoldNotedataEntry &
    ExtraNotedata & {
      gameplay?: {
        lastHoldActivation?: number
        droppedHoldBeat?: number
      }
    }
  export type NotedataEntry = TapNotedataEntry | HoldNotedataEntry
  export function isTapNote<T extends PartialNotedataEntry>(
    note: T
  ): note is Exclude<
    T,
    {
      hold: number
    }
  >
  export function isHoldNote<T extends PartialNotedataEntry>(
    note: T
  ): note is Extract<
    T,
    {
      hold: number
    }
  >
}
declare module "app/src/chart/sm/TimingTypes" {
  export const TIMING_EVENT_NAMES: readonly [
    "BPMS",
    "STOPS",
    "WARPS",
    "DELAYS",
    "LABELS",
    "SPEEDS",
    "SCROLLS",
    "TICKCOUNTS",
    "TIMESIGNATURES",
    "COMBOS",
    "FAKES",
    "ATTACKS",
    "BGCHANGES",
    "FGCHANGES",
  ]
  export type TimingEventType = (typeof TIMING_EVENT_NAMES)[number]
  export type TimingType = "OFFSET" | TimingEventType
  export const BEAT_TIMING_EVENT_NAMES: readonly [
    "BPMS",
    "STOPS",
    "WARPS",
    "DELAYS",
    "WARP_DEST",
  ]
  export type BeatTimingEventType = (typeof BEAT_TIMING_EVENT_NAMES)[number]
  export interface BeatTimingCache {
    beat: number
    secondBefore: number
    secondOf: number
    secondAfter: number
    secondClamp: number
    bpm: number
    warped: boolean
  }
  export interface MeasureTimingCache {
    beat: number
    measure: number
    beatsPerMeasure: number
    divisionLength: number
    numDivisions: number
  }
  export interface ScrollCacheTimingEvent extends ScrollTimingEvent {
    effectiveBeat?: number
  }
  export interface BPMTimingEvent {
    type: "BPMS"
    beat: number
    value: number
  }
  export interface StopTimingEvent {
    type: "STOPS"
    beat: number
    value: number
  }
  export interface WarpTimingEvent {
    type: "WARPS"
    beat: number
    value: number
  }
  export interface WarpDestTimingEvent {
    type: "WARP_DEST"
    beat: number
    value: number
  }
  export interface DelayTimingEvent {
    type: "DELAYS"
    beat: number
    value: number
  }
  export interface ScrollTimingEvent {
    type: "SCROLLS"
    beat: number
    value: number
  }
  export interface TickCountTimingEvent {
    type: "TICKCOUNTS"
    beat: number
    value: number
  }
  export interface FakeTimingEvent {
    type: "FAKES"
    beat: number
    value: number
  }
  export interface LabelTimingEvent {
    type: "LABELS"
    beat: number
    value: string
  }
  export interface SpeedTimingEvent {
    type: "SPEEDS"
    beat: number
    value: number
    delay: number
    unit: "B" | "T"
  }
  export interface TimeSignatureTimingEvent {
    type: "TIMESIGNATURES"
    beat: number
    upper: number
    lower: number
  }
  export interface ComboTimingEvent {
    type: "COMBOS"
    beat: number
    hitMult: number
    missMult: number
  }
  export interface AttackTimingEvent {
    type: "ATTACKS"
    second: number
    endType: "LEN" | "END"
    value: number
    mods: string
  }
  export interface BGChangeTimingEvent {
    type: "BGCHANGES"
    beat: number
    file: string
    updateRate: number
    crossFade: boolean
    stretchRewind: boolean
    stretchNoLoop: boolean
    effect: string
    file2: string
    transition: string
    color1: string
    color2: string
  }
  export interface FGChangeTimingEvent {
    type: "FGCHANGES"
    beat: number
    file: string
    updateRate: number
    crossFade: boolean
    stretchRewind: boolean
    stretchNoLoop: boolean
    effect: string
    file2: string
    transition: string
    color1: string
    color2: string
  }
  export type TimingEvent =
    | BPMTimingEvent
    | StopTimingEvent
    | WarpTimingEvent
    | DelayTimingEvent
    | ScrollTimingEvent
    | TickCountTimingEvent
    | FakeTimingEvent
    | LabelTimingEvent
    | SpeedTimingEvent
    | TimeSignatureTimingEvent
    | ComboTimingEvent
    | AttackTimingEvent
    | BGChangeTimingEvent
    | FGChangeTimingEvent
  export type Cached<T extends TimingEvent> = T & {
    beat: number
    second: number
  }
  export type BeatTimingEvent =
    | BPMTimingEvent
    | StopTimingEvent
    | WarpTimingEvent
    | WarpDestTimingEvent
    | DelayTimingEvent
  export type TimingCache = {
    beatTiming?: BeatTimingCache[]
    effectiveBeatTiming?: ScrollCacheTimingEvent[]
    measureTiming?: MeasureTimingCache[]
    sortedEvents?: Cached<TimingEvent>[]
    warpedBeats: Map<number, boolean>
    beatsToSeconds: Map<string, number>
  }
  export type DeletableEvent = Partial<Cached<TimingEvent>> &
    Pick<TimingEvent, "type">
  export type TimingColumnType = "continuing" | "instant"
}
declare module "app/src/chart/play/JudgementTexture" {
  import { Texture } from "pixi.js"
  import { StandardTimingWindow } from "app/src/chart/play/StandardTimingWindow"
  export class JudgementTexture {
    static ITG: JudgementTexture
    static WATERFALL: JudgementTexture
    static PUMP: JudgementTexture
    private texHeight
    private texWidth
    private texture?
    private judgeNames
    private earlyLate
    private path
    constructor(path: string, judgeNames: string[], earlyLate?: boolean)
    private loadTex
    getTexture(
      error: number,
      judgment: StandardTimingWindow
    ): Promise<Texture | undefined>
  }
}
declare module "app/src/chart/play/TimingWindow" {
  export abstract class TimingWindow {
    timingWindowMS: number
    dancePoints: number
    lifeChange: number
    protected constructor(
      timingWindowMS: number,
      dancePoints: number,
      lifeChange: number
    )
    /**
     * Returns the calculated milliseconds to achieve this timing window.
     * Includes options timingWindowScale and timingWindowAdd.
     *
     * @return {*}
     * @memberof TimingWindow
     */
    getTimingWindowMS(): number
  }
}
declare module "app/src/chart/play/StandardTimingWindow" {
  import { JudgementTexture } from "app/src/chart/play/JudgementTexture"
  import { TimingWindow } from "app/src/chart/play/TimingWindow"
  export class StandardTimingWindow extends TimingWindow {
    id: string
    name: string
    color: number
    judgementTexture: JudgementTexture
    constructor(
      id: string,
      name: string,
      color: number,
      timingWindowMS: number,
      dancePoints: number,
      lifeChange: number,
      judgementTexture: JudgementTexture
    )
  }
  export const TIMING_WINDOW_AUTOPLAY: StandardTimingWindow
}
declare module "app/src/chart/play/HoldDroppedTimingWindow" {
  import { TimingWindow } from "app/src/chart/play/TimingWindow"
  export class HoldDroppedTimingWindow extends TimingWindow {
    readonly target = "dropped"
    constructor(dancePoints: number, lifeChange: number)
  }
}
declare module "app/src/chart/play/HoldTimingWindow" {
  import { TimingWindow } from "app/src/chart/play/TimingWindow"
  export class HoldTimingWindow extends TimingWindow {
    noteType: string
    constructor(
      noteType: string,
      timingWindowMS: number,
      dancePoints: number,
      lifeChange: number
    )
  }
}
declare module "app/src/chart/play/MineTimingWindow" {
  import { TimingWindow } from "app/src/chart/play/TimingWindow"
  export class MineTimingWindow extends TimingWindow {
    readonly target = "mine"
    constructor(timingWindowMS: number, dancePoints: number, lifeChange: number)
  }
}
declare module "app/src/chart/play/StandardMissTimingWindow" {
  import { JudgementTexture } from "app/src/chart/play/JudgementTexture"
  import { StandardTimingWindow } from "app/src/chart/play/StandardTimingWindow"
  export class StandardMissTimingWindow extends StandardTimingWindow {
    constructor(
      name: string,
      color: number,
      dancePoints: number,
      lifeChange: number,
      judgementTexture: JudgementTexture
    )
  }
}
declare module "app/src/chart/play/TimingWindowCollection" {
  import { HoldNotedataEntry } from "app/src/chart/sm/NoteTypes"
  import { HoldDroppedTimingWindow } from "app/src/chart/play/HoldDroppedTimingWindow"
  import { HoldTimingWindow } from "app/src/chart/play/HoldTimingWindow"
  import { MineTimingWindow } from "app/src/chart/play/MineTimingWindow"
  import { StandardMissTimingWindow } from "app/src/chart/play/StandardMissTimingWindow"
  import { StandardTimingWindow } from "app/src/chart/play/StandardTimingWindow"
  import { TimingWindow } from "app/src/chart/play/TimingWindow"
  export function isStandardTimingWindow(
    window: TimingWindow
  ): window is StandardTimingWindow
  export function isStandardMissTimingWindow(
    window: TimingWindow
  ): window is StandardMissTimingWindow
  export function isHoldTimingWindow(
    window: TimingWindow
  ): window is HoldTimingWindow
  export function isHoldDroppedTimingWindow(
    window: TimingWindow
  ): window is HoldDroppedTimingWindow
  export function isMineTimingWindow(
    window: TimingWindow
  ): window is MineTimingWindow
  export class TimingWindowCollection {
    private static COLLECTIONS
    private windows
    private holdWindows
    private readonly missWindow
    private readonly droppedWindow
    private readonly mineWindow
    private readonly hideLimitMS
    constructor(windows: TimingWindow[], minHideMS: number)
    /**
     * Returns the achieved judgement given an error in ms.
     *
     * @param {number} error
     * @return {*}  {StandardTimingWindow}
     * @memberof TimingWindowCollection
     */
    judgeInput(error: number): StandardTimingWindow
    /**
     * Gets the held judgement in this collection for a given note.
     *
     * @param {HoldNotedataEntry} note
     * @return {*}  {HoldTimingWindow}
     * @memberof TimingWindowCollection
     */
    getHeldJudgement(note: HoldNotedataEntry): HoldTimingWindow
    /**
     * Gets this miss judgement in this collection.
     *
     * @return {*}  {StandardMissTimingWindow}
     * @memberof TimingWindowCollection
     */
    getMissJudgement(): StandardMissTimingWindow
    /**
     * Gets the dropped judgement in this collection.
     *
     * @return {*}  {HoldDroppedTimingWindow}
     * @memberof TimingWindowCollection
     */
    getDroppedJudgement(): HoldDroppedTimingWindow
    /**
     * Gets the mine judgement in this collection.
     *
     * @return {*}  {MineTimingWindow}
     * @memberof TimingWindowCollection
     */
    getMineJudgement(): MineTimingWindow
    /**
     * Determines if a note should be hidden.
     *
     * @param {StandardTimingWindow} judgement
     * @return {*}  {boolean}
     * @memberof TimingWindowCollection
     */
    shouldHideNote(judgement: StandardTimingWindow): boolean
    /**
     * Returns the maximum MS to get a judgement (non-miss).
     *
     * @return {*}  {number}
     * @memberof TimingWindowCollection
     */
    maxWindowMS(): number
    /**
     * Returns the maximum dance points achievable for one judgement.
     *
     * @return {*}  {number}
     * @memberof TimingWindowCollection
     */
    getMaxDancePoints(): number
    /**
     * Returns the maximum dance points achievable for one hold judgement.
     *
     * @return {*}  {number}
     * @memberof TimingWindowCollection
     */
    getMaxHoldDancePoints(noteType: string): number
    /**
     * Returns the standard timing windows.
     *
     * @return {*}  {StandardTimingWindow[]}
     * @memberof TimingWindowCollection
     */
    getStandardWindows(): StandardTimingWindow[]
    /**
     * Returns the hold timing windows.
     *
     * @return {*}  {HoldTimingWindow[]}
     * @memberof TimingWindowCollection
     */
    getHoldWindows(): HoldTimingWindow[]
    /**
     * Returns the TimingWindowCollection with the given name.
     *
     * @static
     * @param {string} name
     * @return {*}  {TimingWindowCollection}
     * @memberof TimingWindowCollection
     */
    static getCollection(name: string): TimingWindowCollection
    /**
     * Returns all the TimingWindowCollections registered.
     *
     * @static
     * @return {*}
     * @memberof TimingWindowCollection
     */
    static getCollections(): any
  }
}
declare module "app/src/chart/sm/TimingData" {
  import {
    AttackTimingEvent,
    BGChangeTimingEvent,
    BPMTimingEvent,
    BeatTimingCache,
    Cached,
    ComboTimingEvent,
    DelayTimingEvent,
    DeletableEvent,
    FGChangeTimingEvent,
    FakeTimingEvent,
    LabelTimingEvent,
    ScrollTimingEvent,
    SpeedTimingEvent,
    StopTimingEvent,
    TickCountTimingEvent,
    TimeSignatureTimingEvent,
    TimingCache,
    TimingColumnType,
    TimingEvent,
    TimingEventType,
    TimingType,
    WarpTimingEvent,
  } from "app/src/chart/sm/TimingTypes"
  export const TIMING_DATA_PRECISION = 6
  export const TIMING_DATA_DISPLAY_PRECISION = 3
  export abstract class TimingData {
    protected readonly _cache: TimingCache
    protected columns: {
      [Type in TimingEventType]?: Cached<
        Extract<
          TimingEvent,
          {
            type: Type
          }
        >
      >[]
    }
    protected offset?: number
    protected callListeners(
      modifiedEvents?: {
        type: TimingEventType
      }[]
    ): void
    private buildBeatTimingDataCache
    private buildEffectiveBeatTimingDataCache
    private buildMeasureTimingCache
    private binarySearch
    private binarySearchIndex
    private mergeColumns
    private mergeTwoColumns
    private splitEvents
    private splitEventPairs
    abstract getColumn<Type extends TimingEventType>(
      type: Type
    ): Cached<
      Extract<
        TimingEvent,
        {
          type: Type
        }
      >
    >[]
    getAllColumns(): {
      BPMS?: Cached<BPMTimingEvent>[] | undefined
      STOPS?: Cached<StopTimingEvent>[] | undefined
      WARPS?: Cached<WarpTimingEvent>[] | undefined
      DELAYS?: Cached<DelayTimingEvent>[] | undefined
      LABELS?: Cached<LabelTimingEvent>[] | undefined
      SPEEDS?: Cached<SpeedTimingEvent>[] | undefined
      SCROLLS?: Cached<ScrollTimingEvent>[] | undefined
      TICKCOUNTS?: Cached<TickCountTimingEvent>[] | undefined
      TIMESIGNATURES?: Cached<TimeSignatureTimingEvent>[] | undefined
      COMBOS?: Cached<ComboTimingEvent>[] | undefined
      FAKES?: Cached<FakeTimingEvent>[] | undefined
      ATTACKS?: Cached<AttackTimingEvent>[] | undefined
      BGCHANGES?: Cached<BGChangeTimingEvent>[] | undefined
      FGCHANGES?: Cached<FGChangeTimingEvent>[] | undefined
    }
    parse(type: TimingType, data: string): void
    abstract getOffset(): number
    setOffset(offset: number): void
    serialize(fileType: "sm" | "ssc" | "smebak"): string
    private formatProperty
    protected createColumn(type: TimingEventType): void
    private getTime
    private isNullEvent
    private isSimilar
    private removeOverlapping
    private compareEvents
    protected insertEvents(
      type: TimingEventType,
      events: TimingEvent[]
    ): (
      | Cached<WarpTimingEvent>
      | Cached<BPMTimingEvent>
      | Cached<ScrollTimingEvent>
      | Cached<TimeSignatureTimingEvent>
      | Cached<StopTimingEvent>
      | Cached<DelayTimingEvent>
      | Cached<LabelTimingEvent>
      | Cached<SpeedTimingEvent>
      | Cached<TickCountTimingEvent>
      | Cached<ComboTimingEvent>
      | Cached<FakeTimingEvent>
      | Cached<AttackTimingEvent>
      | Cached<BGChangeTimingEvent>
      | Cached<FGChangeTimingEvent>
    )[]
    protected deleteEvents(
      type: TimingEventType,
      events: DeletableEvent[]
    ): Cached<TimingEvent>[]
    static getColumnType(type: TimingEventType): TimingColumnType
    protected findConflictingEvents(type: TimingEventType): TimingEvent[]
    protected parseEvents<Type extends TimingEventType>(
      type: Type,
      data: string
    ): void
    protected typeRequiresSSC(type: TimingEventType): boolean
    getDefaultEvent(type: TimingEventType, beat: number): Cached<TimingEvent>
    getEventAtBeat<Type extends TimingEventType>(
      type: Type,
      beat: number,
      useDefault?: boolean
    ):
      | Cached<
          Extract<
            TimingEvent,
            {
              type: Type
            }
          >
        >
      | undefined
    protected updateEvents(type: TimingEventType): void
    _insert(events: TimingEvent[]): {
      events: TimingEvent[]
      insertConflicts: TimingEvent[]
      errors: TimingEvent[]
    }
    _modify(events: [TimingEvent, TimingEvent][]): {
      newEvents: TimingEvent[]
      oldEvents: TimingEvent[]
      insertConflicts: TimingEvent[]
      errors: TimingEvent[]
    }
    _delete(events: DeletableEvent[]): {
      removedEvents: Cached<TimingEvent>[]
      errors: TimingEvent[]
    }
    insert(events: TimingEvent[]): void
    modify(events: [TimingEvent, TimingEvent][]): void
    delete(events: DeletableEvent[]): void
    findEvents(events: TimingEvent[]): Cached<TimingEvent>[]
    getBeatFromSeconds(seconds: number): number
    getSecondsFromBeat(
      beat: number,
      option?: "noclamp" | "before" | "after" | ""
    ): number
    isBeatWarped(beat: number): boolean
    isBeatFaked(beat: number): boolean
    getMeasure(beat: number): number
    getDivisionLength(beat: number): number
    getMeasureLength(beat: number): number
    getBeatOfMeasure(beat: number): number
    getBeatFromMeasure(measure: number): number
    getDivisionOfMeasure(beat: number): number
    getMeasureBeats(
      firstBeat: number,
      lastBeat: number
    ): Generator<[number, boolean], void>
    getEffectiveBeat(beat: number): number
    getBeatFromEffectiveBeat(effBeat: number): number
    getSpeedMult(beat: number, seconds: number): number
    reloadCache(types?: TimingType[]): void
    getBeatTiming(): BeatTimingCache[]
    getTimingData(): Cached<TimingEvent>[]
    getTimingData<Type extends TimingEventType>(
      ...props: Type[]
    ): Cached<
      Extract<
        TimingEvent,
        {
          type: Type
        }
      >
    >[]
    requiresSSC(): boolean
    destroy(): void
  }
}
declare module "app/src/chart/gameTypes/base/GameLogic" {
  import { ChartManager } from "app/src/chart/ChartManager"
  import { Notedata, NotedataEntry } from "app/src/chart/sm/NoteTypes"
  import { TimingData } from "app/src/chart/sm/TimingData"
  export abstract class GameLogic {
    /**
     * Called every frame to update the game logic
     *
     * @abstract
     * @param {ChartManager} chartManager
     * @memberof GameLogic
     */
    abstract update(chartManager: ChartManager): void
    /**
     * Called when play mode is started.
     *
     * @abstract
     * @param {ChartManager} chartManager
     * @memberof GameLogic
     */
    abstract startPlay(chartManager: ChartManager): void
    /**
     * Called when a column is pressed down.
     *
     * @abstract
     * @param chartManager
     * @param {number} col
     * @memberof GameLogic
     */
    abstract keyDown(chartManager: ChartManager, col: number): void
    /**
     * Called when a column is released.
     *
     * @abstract
     * @param chartManager
     * @param {number} col
     * @memberof GameLogic
     */
    abstract keyUp(chartManager: ChartManager, col: number): void
    /**
     * Determines whether a note should activate assist tick.
     *
     * @abstract
     * @param {NotedataEntry} note
     * @return {*}  {boolean}
     * @memberof GameLogic
     */
    abstract shouldAssistTick(note: NotedataEntry): boolean
    abstract calculateMaxDP(notedata: Notedata, timingData: TimingData): number
    abstract usesHoldTicks: boolean
    abstract comboIsPerRow: boolean
    abstract missComboIsPerRow: boolean
  }
}
declare module "app/src/chart/gameTypes/base/NotedataParser" {
  import { PartialNotedata } from "app/src/chart/sm/NoteTypes"
  import { GameType } from "app/src/chart/gameTypes/GameTypeRegistry"
  export abstract class NotedataParser {
    /**
     * Parses the string into Notedata.
     *
     * @abstract
     * @param {string} data
     * @param gameType
     * @return {*}  {PartialNotedata}
     * @memberof NotedataParser
     */
    abstract fromString(data: string, gameType: GameType): PartialNotedata
    /**
     * Converts Notedata into SM form.
     *
     * @abstract
     * @param {PartialNotedata} notedata
     * @param {GameType} gameType
     * @return {*}  {string}
     * @memberof NotedataParser
     */
    abstract serialize(notedata: PartialNotedata, gameType: GameType): string
  }
}
declare module "app/src/chart/gameTypes/common/BasicGameLogic" {
  import { ColHeldTracker } from "app/src/util/ColHeldTracker"
  import { ChartManager } from "app/src/chart/ChartManager"
  import { TimingWindowCollection } from "app/src/chart/play/TimingWindowCollection"
  import {
    HoldNotedataEntry,
    Notedata,
    NotedataEntry,
  } from "app/src/chart/sm/NoteTypes"
  import { TimingData } from "app/src/chart/sm/TimingData"
  import { GameLogic } from "app/src/chart/gameTypes/base/GameLogic"
  export class BasicGameLogic extends GameLogic {
    protected chordCohesion: Map<number, NotedataEntry[]>
    protected missNoteIndex: number
    protected holdProgress: HoldNotedataEntry[]
    protected heldCols: ColHeldTracker
    protected collection: TimingWindowCollection
    usesHoldTicks: boolean
    comboIsPerRow: boolean
    missComboIsPerRow: boolean
    update(chartManager: ChartManager): void
    startPlay(chartManager: ChartManager): void
    keyDown(chartManager: ChartManager, col: number): void
    keyUp(chartManager: ChartManager, col: number): void
    shouldAssistTick(note: NotedataEntry): boolean
    protected hitNote(
      chartManager: ChartManager,
      note: NotedataEntry,
      hitTime: number
    ): void
    protected getClosestNote(
      notedata: Notedata,
      hitTime: number,
      col: number,
      types: string[],
      windowMS?: number
    ): NotedataEntry | undefined
    protected shouldDropHold(note: HoldNotedataEntry, time: number): boolean
    calculateMaxDP(notedata: Notedata, _: TimingData): number
  }
}
declare module "app/src/chart/gameTypes/common/BasicNotedataParser" {
  import { PartialNotedata } from "app/src/chart/sm/NoteTypes"
  import { NotedataParser } from "app/src/chart/gameTypes/base/NotedataParser"
  import { GameType } from "app/src/chart/gameTypes/GameTypeRegistry"
  export class BasicNotedataParser extends NotedataParser {
    serialize(notedata: PartialNotedata, gameType: GameType): string
    fromString(data: string, gameType: GameType): PartialNotedata
  }
}
declare module "app/src/chart/gameTypes/pump/PumpGameLogic" {
  import { ChartManager } from "app/src/chart/ChartManager"
  import { TimingWindowCollection } from "app/src/chart/play/TimingWindowCollection"
  import {
    HoldNotedataEntry,
    Notedata,
    NotedataEntry,
  } from "app/src/chart/sm/NoteTypes"
  import { TimingData } from "app/src/chart/sm/TimingData"
  import { BasicGameLogic } from "app/src/chart/gameTypes/common/BasicGameLogic"
  interface Tick {
    beat: number
    note: HoldNotedataEntry
    second: number
    hit: boolean
    hitAll: boolean
  }
  interface HoldTickData {
    ticks: Tick[]
    missIndex: number
    hitIndex: number
    activeIndex: number
  }
  export class PumpGameLogic extends BasicGameLogic {
    protected tickProgress: Map<HoldNotedataEntry, HoldTickData>
    protected tickCohesion: Map<number, number>
    protected pendingTicks: Map<number, Tick[]>
    protected collection: TimingWindowCollection
    protected holdIndex: number
    usesHoldTicks: boolean
    comboIsPerRow: boolean
    missComboIsPerRow: boolean
    update(chartManager: ChartManager): void
    protected hitNote(
      chartManager: ChartManager,
      note: NotedataEntry,
      hitTime: number
    ): void
    startPlay(chartManager: ChartManager): void
    keyDown(chartManager: ChartManager, col: number): void
    protected shouldDropHold(note: HoldNotedataEntry, time: number): boolean
    protected generateHoldTicks(
      timingData: TimingData,
      hold: HoldNotedataEntry
    ): number[]
    calculateMaxDP(notedata: Notedata, timingData: TimingData): number
  }
}
declare module "app/src/chart/gameTypes/GameTypeRegistry" {
  import { TapNoteType } from "app/src/chart/sm/NoteTypes"
  import { NotedataParser } from "app/src/chart/gameTypes/base/NotedataParser"
  export interface GameType {
    id: string
    numCols: number
    columnWidths: number[]
    notefieldWidth: number
    columnNames: string[]
    parser: NotedataParser
    editNoteTypes: TapNoteType[]
    flipColumns: {
      horizontal: number[]
      vertical: number[]
    }
  }
  export class GameTypeRegistry {
    private static gameTypes
    private static priority
    static register(gameType: Omit<GameType, "notefieldWidth">): void
    static getPriority(): GameType[]
    static getGameType(id: string): GameType | undefined
    static getTypes(): Record<string, GameType>
  }
}
declare module "app/src/chart/stats/ChartAnalyzer" {
  import { Chart } from "app/src/chart/sm/Chart"
  export abstract class ChartAnalyzer {
    protected readonly chart: Chart
    constructor(chart: Chart)
    /**
     * Clear any caches used by this analyzer. Timing events that affect timing will trigger the entire chart to be analyzed
     *
     * @abstract
     * @memberof ChartAnalyzer
     */
    reset(): void
    /**
     * Calculate data for the entire chart. This method will be called after reset().
     * @abstract
     * @memberof ChartAnalyzer
     */
    abstract calculateAll(): void
    /**
     * Recalculate data for the chart for a given range of beats
     *
     * @abstract
     * @param {number} startBeat
     * @param {number} endBeat
     * @memberof ChartAnalyzer
     */
    abstract recalculate(startBeat: number, endBeat: number): void
    /**
     * Called when the chart is unloaded.
     *
     * @abstract
     * @memberof ChartAnalyzer
     */
    onUnload(): void
    /**
     * Called when the chart is loaded.
     *
     * @abstract
     * @memberof ChartAnalyzer
     */
    onLoad(): void
    /**
     * Called when the chart is destroyed.
     *
     * @abstract
     * @memberof ChartAnalyzer
     */
    destroy(): void
  }
}
declare module "app/src/chart/stats/NoteTypeAnalyzer" {
  import { ChartAnalyzer } from "app/src/chart/stats/ChartAnalyzer"
  export class NoteTypeAnalyzer extends ChartAnalyzer {
    calculateAll(): void
    recalculate(): void
  }
}
declare module "app/src/chart/stats/NPSAnalyzer" {
  import { ChartAnalyzer } from "app/src/chart/stats/ChartAnalyzer"
  export class NPSAnalyzer extends ChartAnalyzer {
    reset(): void
    private calculateNPS
    calculateAll(): void
    recalculate(startBeat: number, endBeat: number): void
  }
}
declare module "app/src/chart/stats/parity/ParityUtils" {
  export function doFeetOverlap(
    oldHeel: number,
    oldToe: number,
    newHeel: number,
    newToe: number
  ): boolean
  export function getPlayerAngle(
    left: {
      x: number
      y: number
    },
    right: {
      x: number
      y: number
    }
  ): number
}
declare module "app/src/chart/stats/parity/StageLayouts" {
  import {
    ParityState,
    PlacementData,
    Row,
  } from "app/src/chart/stats/parity/ParityDataTypes"
  export interface StagePoint {
    x: number
    y: number
    rotation: number
  }
  export class StageLayout {
    name: string
    layout: StagePoint[]
    columnCount: number
    upArrows: number[]
    downArrows: number[]
    sideArrows: number[]
    constructor(
      name: string,
      layout: StagePoint[],
      upArrows: number[],
      downArrows: number[],
      sideArrows: number[]
    )
    getFacingDirectionCosine(leftIndex: number, rightIndex: number): number
    getYDifference(leftIndex: number, rightIndex: number): number
    averagePoint(
      leftIndex: number,
      rightIndex: number
    ):
      | StagePoint
      | {
          x: number
          y: number
        }
    getDistanceSq(leftIndex: number, rightIndex: number): number
    getDistanceSqPoints(
      p1: {
        x: number
        y: number
      },
      p2: {
        x: number
        y: number
      }
    ): number
    bracketCheck(column1: number, column2: number): boolean
    getPlayerAngle(leftIndex: number, rightIndex: number): number
    getPlacementData(
      initialState: ParityState,
      resultState: ParityState,
      lastRow: Row,
      row: Row
    ): PlacementData
  }
  export const STAGE_LAYOUTS: {
    [id: string]: StageLayout
  }
}
declare module "app/src/chart/stats/parity/ParityCost" {
  import {
    ParityState,
    PlacementData,
    Row,
  } from "app/src/chart/stats/parity/ParityDataTypes"
  export class ParityCostCalculator {
    private readonly layout
    private WEIGHTS
    constructor(
      type: string,
      weights?:
        | {
            [key: string]: number
          }
        | undefined
    )
    setWeights(newWeights: { [key: string]: number }): void
    getActionCost(
      initialState: ParityState,
      resultState: ParityState,
      rows: Row[],
      rowIndex: number
    ): {
      [id: string]: number
    }
    doesLeftFootOverlapRight(data: PlacementData): boolean
    doesRightFootOverlapLeft(data: PlacementData): boolean
    calcMineCosts(data: PlacementData, row: Row): number
    calcHoldSwitchCosts(data: PlacementData, row: Row): number
    calcBracketTapCost(data: PlacementData, elapsedTime: number): number
    calcStartCrossover(data: PlacementData, rowIndex: number): number
    calcBracketJackCost(data: PlacementData): number
    calcXOBRCost(data: PlacementData): number
    calcDoublestepCost(
      data: PlacementData,
      lastRow: Row,
      row: Row,
      elapsedTime: number
    ): number
    calcJumpCost(data: PlacementData, elapsedTime: number): number
    private slowBracketThreshold
    private slowBracketCap
    calcSlowBracketCost(data: PlacementData, elapsedTime: number): number
    calcTwistedFoot(data: PlacementData): number
    calcFacingCost(data: PlacementData): number
    calcSpinCost(data: PlacementData): number
    private SlowFootswitchThreshold
    private SlowFootswitchIgnore
    calcSlowFootswitchCost(
      data: PlacementData,
      row: Row,
      elapsedTime: number
    ): number
    calcSideswitchCost(data: PlacementData): number
    calcMissedFootswitchCost(data: PlacementData, row: Row): number
    private JackMaxElapsedTime
    calcJackCost(data: PlacementData, elapsedTime: number): number
    calcDistanceCost(data: PlacementData, elapsedTime: number): number
    calcCrowdedBracketCost(data: PlacementData, elapsedTime: number): number
  }
}
declare module "app/src/chart/stats/parity/RowStatCalculator" {
  import {
    Foot,
    Row,
    TechCategory,
    TechErrors,
  } from "app/src/chart/stats/parity/ParityDataTypes"
  import { ParityGraphNode } from "app/src/chart/stats/parity/ParityInternals"
  import { StageLayout } from "app/src/chart/stats/parity/StageLayouts"
  export function calculateRowStats(
    nodes: ParityGraphNode[],
    rows: Row[],
    layout: StageLayout
  ): {
    techRows: (Set<TechCategory> | undefined)[]
    techErrors: Map<number, Set<TechErrors>>
    facingRows: number[]
    candles: Map<number, Foot>
    techCounts: number[]
    techErrorCounts: number[]
  }
}
declare module "app/src/chart/stats/parity/ParityInternals" {
  import { Notedata } from "app/src/chart/sm/NoteTypes"
  import {
    Foot,
    FootOverride,
    ParityState,
    Row,
  } from "app/src/chart/stats/parity/ParityDataTypes"
  import { ParityDebugStats } from "app/src/chart/stats/parity/ParityWebWorkerTypes"
  export class ParityGraphNode {
    children: Map<
      string,
      {
        [id: string]: number
      }
    >
    state: ParityState
    key: string
    constructor(state: ParityState, key?: string)
  }
  export class ParityInternals {
    private readonly costCalc
    private readonly layout
    private readonly initialRow
    private readonly endRow
    private readonly initialNode
    private readonly endNode
    private cachedEdges
    private cachedLowestCost
    edgeCacheSize: number
    private permuteCache
    nodeMap: Map<string, ParityGraphNode>
    private nEdges
    bestPath?: string[]
    bestPathCost: number
    bestPathSet?: Set<string>
    debugStats: ParityDebugStats
    notedataRows: Row[]
    nodeRows: {
      beat: number
      nodes: ParityGraphNode[]
    }[]
    constructor(gameType: string)
    compute(
      startBeat: number,
      endBeat: number,
      notedata: Notedata
    ): {
      techRows: (
        | Set<import("app/src/chart/stats/parity/ParityDataTypes").TechCategory>
        | undefined
      )[]
      techErrors: Map<
        number,
        Set<import("app/src/chart/stats/parity/ParityDataTypes").TechErrors>
      >
      facingRows: number[]
      candles: Map<number, Foot>
      techCounts: number[]
      techErrorCounts: number[]
      parityLabels: Map<string, Foot>
      states: ParityState[]
      rowTimestamps: {
        beat: number
        second: number
      }[]
    } | null
    recalculateRows(
      startBeat: number,
      endBeat: number,
      notedata: Notedata
    ): {
      startIdx: number
      newEndIdx: number
      oldEndIdx: number
    }
    recalculateStates(updatedRows: {
      startIdx: number
      newEndIdx: number
      oldEndIdx: number
    }): {
      firstUpdatedRow: number
      lastUpdatedRow: number
    }
    computeCosts(updatedStates: {
      firstUpdatedRow: number
      lastUpdatedRow: number
    }): {
      firstUpdatedCost: number
      lastUpdatedCost: number
    }
    computeBestPath(updatedCosts: {
      firstUpdatedCost: number
      lastUpdatedCost: number
    }): void
    calculatePermuteColumnKey(row: Row): string
    getPossibleActions(row: Row): Foot[][]
    generateActions(row: Row, columns: Foot[], column: number): Foot[][]
    filterActions(
      row: Row,
      permuteColumns: Foot[][],
      overrides: FootOverride[]
    ): Foot[][]
    initResultState(
      initialState: ParityState,
      row: Row,
      action: Foot[]
    ): ParityState
    rowToKey(row: Row): string
    private isSameSecond
    deleteCache(): void
    reset(): void
  }
}
declare module "app/src/chart/stats/parity/ParityWebWorkerTypes" {
  import { Notedata } from "app/src/chart/sm/NoteTypes"
  import {
    Foot,
    ParityState,
    Row,
    TechCategory,
    TechErrors,
  } from "app/src/chart/stats/parity/ParityDataTypes"
  import { ParityGraphNode } from "app/src/chart/stats/parity/ParityInternals"
  export interface ParityComputeData {
    parityLabels: Map<string, Foot>
    states: ParityState[]
    rowTimestamps: {
      beat: number
      second: number
    }[]
    techRows: (Set<TechCategory> | undefined)[]
    techErrors: Map<number, Set<TechErrors>>
    techCounts: number[]
    techErrorCounts: number[]
    facingRows: number[]
    candles: Map<number, Foot>
  }
  export type ParityDebugUpdateData = {
    removedRowsStart: number
    removedRowsEnd: number
    newRows: Row[]
    newStates: {
      beat: number
      nodes: ParityGraphNode[]
    }[]
    bestPath: string[]
    bestPathCost: number
    bestPathSet: Set<string>
    edgeCacheSize: number
    stats: ParityDebugStats
  }
  export type ParityDebugData = {
    edgeCacheSize: number
    nodeMap: Map<string, ParityGraphNode>
    bestPath: string[]
    bestPathCost: number
    bestPathSet: Set<string>
    notedataRows: Row[]
    nodeRows: {
      beat: number
      nodes: ParityGraphNode[]
    }[]
    stats: ParityDebugStats
  }
  export type ParityDebugStats = {
    lastUpdatedRowStart: number
    lastUpdatedOldRowEnd: number
    lastUpdatedRowEnd: number
    rowUpdateTime: number
    lastUpdatedNodeStart: number
    lastUpdatedNodeEnd: number
    nodeUpdateTime: number
    createdNodes: number
    createdEdges: number
    calculatedEdges: number
    cachedEdges: number
    edgeUpdateTime: number
    cachedBestRows: number
    pathUpdateTime: number
    rowStatsUpdateTime: number
  }
  export interface ParityBaseMessage {
    id: number
  }
  export interface ParityInboundInitMessage extends ParityBaseMessage {
    type: "init"
    gameType: string
  }
  export interface ParityOutboundInitMessage extends ParityBaseMessage {
    type: "init"
  }
  export interface ParityInboundComputeMessage extends ParityBaseMessage {
    type: "compute"
    startBeat: number
    endBeat: number
    notedata: Notedata
    debug: boolean
  }
  export interface ParityOutboundComputeMessage extends ParityBaseMessage {
    type: "compute"
    data: ParityComputeData
    debug?: ParityDebugUpdateData
  }
  export interface ParityInboundGetDebugMessage extends ParityBaseMessage {
    type: "getDebug"
  }
  export interface ParityOutboundErrorMessage extends ParityBaseMessage {
    type: "error"
    error: string
  }
  export interface ParityOutboundGetDebugMessage extends ParityBaseMessage {
    type: "getDebug"
    data: ParityDebugData | null
  }
  export type ParityInboundMessage =
    | ParityInboundInitMessage
    | ParityInboundComputeMessage
    | ParityInboundGetDebugMessage
  export type ParityOutboundMessage =
    | ParityOutboundInitMessage
    | ParityOutboundComputeMessage
    | ParityOutboundGetDebugMessage
    | ParityOutboundErrorMessage
}
declare module "app/src/chart/stats/parity/ParityAnalyzer" {
  import { Chart } from "app/src/chart/sm/Chart"
  import { ChartAnalyzer } from "app/src/chart/stats/ChartAnalyzer"
  import {
    ParityInboundMessage,
    ParityOutboundMessage,
  } from "app/src/chart/stats/parity/ParityWebWorkerTypes"
  export class ParityAnalyzer extends ChartAnalyzer {
    worker?: Worker
    active: boolean
    disabled: boolean
    private pendingJobs
    private messageId
    private eventHandler
    constructor(chart: Chart)
    recalculate(startBeat: number, endBeat: number): void
    calculateAll(): void
    workerCalculate(startBeat: number, endBeat: number): void
    onLoad(): Promise<void>
    onUnload(): void
    reset(): void
    destroy(): void
    initializeWorker(): Promise<void>
    terminateWorker(): void
    postMessage<Message extends Omit<ParityInboundMessage, "id">>(
      message: Message
    ): Promise<
      Extract<
        ParityOutboundMessage,
        {
          type: Message["type"]
        }
      >
    >
  }
}
declare module "app/src/chart/stats/StreamAnalyzer" {
  import { ChartAnalyzer } from "app/src/chart/stats/ChartAnalyzer"
  export interface StreamData {
    startBeat: number
    endBeat: number
    streamSpacing: number | null
  }
  export class StreamAnalyzer extends ChartAnalyzer {
    reset(): void
    private generateStreams
    calculateAll(): void
    recalculate(startBeat: number, endBeat: number): void
  }
}
declare module "app/src/chart/stats/ChartStats" {
  import { Chart } from "app/src/chart/sm/Chart"
  import {
    ParityComputeData,
    ParityDebugData,
  } from "app/src/chart/stats/parity/ParityWebWorkerTypes"
  import { StreamData } from "app/src/chart/stats/StreamAnalyzer"
  export class ChartStats {
    noteCounts: Record<string, number>
    npsGraph: number[]
    streams: StreamData[]
    parity?: ParityComputeData & {
      debug: ParityDebugData
      debugTime: number
    }
    readonly chart: Chart
    private analyzers
    private lastUpdate
    private queued
    private loaded
    private readonly loadHandler
    constructor(chart: Chart)
    calculate(): void
    private _recalculate
    recalculate(startBeat: number, endBeat: number): void
    reset(): void
    getMaxNPS(): number
    destroy(): void
  }
}
declare module "app/src/chart/sm/ChartTypes" {
  export const CHART_DIFFICULTIES: readonly ChartDifficulty[]
  export type ChartDifficulty =
    | "Beginner"
    | "Easy"
    | "Medium"
    | "Hard"
    | "Challenge"
    | "Edit"
}
declare module "app/src/chart/sm/SimfileTypes" {
  export const SIMFILE_PROPERTIES: readonly [
    "TITLE",
    "SUBTITLE",
    "ARTIST",
    "TITLETRANSLIT",
    "SUBTITLETRANSLIT",
    "ARTISTTRANSLIT",
    "GENRE",
    "CREDIT",
    "ORIGIN",
    "BACKGROUND",
    "BANNER",
    "MUSIC",
    "CDTITLE",
    "JACKET",
    "DISCIMAGE",
    "CDIMAGE",
    "PREVIEW",
    "LYRICSPATH",
    "SAMPLESTART",
    "SAMPLELENGTH",
    "SELECTABLE",
  ]
  export type SimfileProperty = (typeof SIMFILE_PROPERTIES)[number]
}
declare module "app/src/chart/sm/SMETypes" {
  import { FootOverride } from "app/src/chart/stats/parity/ParityDataTypes"
  export type SMEData = {
    version: number
    parity: Record<string, SMEParityData[]>
  }
  export type SMEParityData = {
    overrides: [number, number, FootOverride][]
    ignores: Record<number, string[]>
  }
}
declare module "app/src/chart/sm/SMEParser" {
  import { Chart } from "app/src/chart/sm/Chart"
  import { Simfile } from "app/src/chart/sm/Simfile"
  import { SMEParityData } from "app/src/chart/sm/SMETypes"
  export function serializeSMEData(sm: Simfile): string
  export function getParityData(chart: Chart): SMEParityData
  export function loadSMEData(
    string: string,
    sm: Simfile,
    isAutosave: boolean
  ): void
  export function loadChartParityData(data: SMEParityData, chart: Chart): void
}
declare module "app/src/chart/sm/Simfile" {
  import { Chart } from "app/src/chart/sm/Chart"
  import { SimfileProperty } from "app/src/chart/sm/SimfileTypes"
  import { SongTimingData } from "app/src/chart/sm/SongTimingData"
  export class Simfile {
    charts: Record<string, Chart>
    _type?: "sm" | "ssc"
    other_properties: {
      [key: string]: string
    }
    properties: {
      [key in SimfileProperty]?: string
    }
    timingData: SongTimingData
    unloadedCharts: (
      | string
      | {
          [key: string]: string
        }
    )[]
    loaded: Promise<void>
    constructor(file: File, dataFile?: File)
    addChart(chart: Chart): void
    private createChartID
    removeChart(chart: Chart): boolean
    getChartsByGameType(gameType: string): Chart[]
    getAllChartsByGameType(): Record<string, Chart[]>
    serialize(type: "sm" | "ssc" | "smebak"): string
    usesChartTiming(): boolean
    requiresSSC(): boolean
    recalculateAllStats(): void
    private formatProperty
    destroy(): void
  }
}
declare module "app/src/chart/sm/SongTimingData" {
  import { Chart } from "app/src/chart/sm/Chart"
  import { ChartTimingData } from "app/src/chart/sm/ChartTimingData"
  import { Simfile } from "app/src/chart/sm/Simfile"
  import { TimingData } from "app/src/chart/sm/TimingData"
  import { TimingEventType, TimingType } from "app/src/chart/sm/TimingTypes"
  export class SongTimingData extends TimingData {
    protected offset: number
    protected chartTimingDatas: ChartTimingData[]
    protected sm: Simfile
    constructor(simfile: Simfile)
    protected callListeners(
      modifiedEvents?: {
        type: TimingEventType
      }[]
    ): void
    createChartTimingData(chart: Chart): ChartTimingData
    getColumn<Type extends TimingEventType>(
      type: Type
    ): NonNullable<
      {
        BPMS?:
          | import("app/src/chart/sm/TimingTypes").Cached<
              import("app/src/chart/sm/TimingTypes").BPMTimingEvent
            >[]
          | undefined
        STOPS?:
          | import("app/src/chart/sm/TimingTypes").Cached<
              import("app/src/chart/sm/TimingTypes").StopTimingEvent
            >[]
          | undefined
        WARPS?:
          | import("app/src/chart/sm/TimingTypes").Cached<
              import("app/src/chart/sm/TimingTypes").WarpTimingEvent
            >[]
          | undefined
        DELAYS?:
          | import("app/src/chart/sm/TimingTypes").Cached<
              import("app/src/chart/sm/TimingTypes").DelayTimingEvent
            >[]
          | undefined
        LABELS?:
          | import("app/src/chart/sm/TimingTypes").Cached<
              import("app/src/chart/sm/TimingTypes").LabelTimingEvent
            >[]
          | undefined
        SPEEDS?:
          | import("app/src/chart/sm/TimingTypes").Cached<
              import("app/src/chart/sm/TimingTypes").SpeedTimingEvent
            >[]
          | undefined
        SCROLLS?:
          | import("app/src/chart/sm/TimingTypes").Cached<
              import("app/src/chart/sm/TimingTypes").ScrollTimingEvent
            >[]
          | undefined
        TICKCOUNTS?:
          | import("app/src/chart/sm/TimingTypes").Cached<
              import("app/src/chart/sm/TimingTypes").TickCountTimingEvent
            >[]
          | undefined
        TIMESIGNATURES?:
          | import("app/src/chart/sm/TimingTypes").Cached<
              import("app/src/chart/sm/TimingTypes").TimeSignatureTimingEvent
            >[]
          | undefined
        COMBOS?:
          | import("app/src/chart/sm/TimingTypes").Cached<
              import("app/src/chart/sm/TimingTypes").ComboTimingEvent
            >[]
          | undefined
        FAKES?:
          | import("app/src/chart/sm/TimingTypes").Cached<
              import("app/src/chart/sm/TimingTypes").FakeTimingEvent
            >[]
          | undefined
        ATTACKS?:
          | import("app/src/chart/sm/TimingTypes").Cached<
              import("app/src/chart/sm/TimingTypes").AttackTimingEvent
            >[]
          | undefined
        BGCHANGES?:
          | import("app/src/chart/sm/TimingTypes").Cached<
              import("app/src/chart/sm/TimingTypes").BGChangeTimingEvent
            >[]
          | undefined
        FGCHANGES?:
          | import("app/src/chart/sm/TimingTypes").Cached<
              import("app/src/chart/sm/TimingTypes").FGChangeTimingEvent
            >[]
          | undefined
      }[Type]
    >
    getOffset(): number
    reloadCache(types?: TimingType[]): void
    _setOffset(offset: number): void
  }
}
declare module "app/src/chart/sm/ChartTimingData" {
  import { Chart } from "app/src/chart/sm/Chart"
  import { SongTimingData } from "app/src/chart/sm/SongTimingData"
  import { TimingData } from "app/src/chart/sm/TimingData"
  import {
    DeletableEvent,
    TimingEvent,
    TimingEventType,
    TimingType,
  } from "app/src/chart/sm/TimingTypes"
  export class ChartTimingData extends TimingData {
    readonly songTimingData: SongTimingData
    private readonly chart
    constructor(simfileTimingData: SongTimingData, chart: Chart)
    protected callListeners(
      modifiedEvents?: {
        type: TimingEventType
      }[]
    ): void
    getColumn<Type extends TimingEventType>(
      type: Type
    ): NonNullable<
      {
        BPMS?:
          | import("app/src/chart/sm/TimingTypes").Cached<
              import("app/src/chart/sm/TimingTypes").BPMTimingEvent
            >[]
          | undefined
        STOPS?:
          | import("app/src/chart/sm/TimingTypes").Cached<
              import("app/src/chart/sm/TimingTypes").StopTimingEvent
            >[]
          | undefined
        WARPS?:
          | import("app/src/chart/sm/TimingTypes").Cached<
              import("app/src/chart/sm/TimingTypes").WarpTimingEvent
            >[]
          | undefined
        DELAYS?:
          | import("app/src/chart/sm/TimingTypes").Cached<
              import("app/src/chart/sm/TimingTypes").DelayTimingEvent
            >[]
          | undefined
        LABELS?:
          | import("app/src/chart/sm/TimingTypes").Cached<
              import("app/src/chart/sm/TimingTypes").LabelTimingEvent
            >[]
          | undefined
        SPEEDS?:
          | import("app/src/chart/sm/TimingTypes").Cached<
              import("app/src/chart/sm/TimingTypes").SpeedTimingEvent
            >[]
          | undefined
        SCROLLS?:
          | import("app/src/chart/sm/TimingTypes").Cached<
              import("app/src/chart/sm/TimingTypes").ScrollTimingEvent
            >[]
          | undefined
        TICKCOUNTS?:
          | import("app/src/chart/sm/TimingTypes").Cached<
              import("app/src/chart/sm/TimingTypes").TickCountTimingEvent
            >[]
          | undefined
        TIMESIGNATURES?:
          | import("app/src/chart/sm/TimingTypes").Cached<
              import("app/src/chart/sm/TimingTypes").TimeSignatureTimingEvent
            >[]
          | undefined
        COMBOS?:
          | import("app/src/chart/sm/TimingTypes").Cached<
              import("app/src/chart/sm/TimingTypes").ComboTimingEvent
            >[]
          | undefined
        FAKES?:
          | import("app/src/chart/sm/TimingTypes").Cached<
              import("app/src/chart/sm/TimingTypes").FakeTimingEvent
            >[]
          | undefined
        ATTACKS?:
          | import("app/src/chart/sm/TimingTypes").Cached<
              import("app/src/chart/sm/TimingTypes").AttackTimingEvent
            >[]
          | undefined
        BGCHANGES?:
          | import("app/src/chart/sm/TimingTypes").Cached<
              import("app/src/chart/sm/TimingTypes").BGChangeTimingEvent
            >[]
          | undefined
        FGCHANGES?:
          | import("app/src/chart/sm/TimingTypes").Cached<
              import("app/src/chart/sm/TimingTypes").FGChangeTimingEvent
            >[]
          | undefined
      }[Type]
    >
    getOffset(): number
    usesChartTiming(): boolean
    hasChartOffset(): boolean
    isPropertyChartSpecific(type: TimingEventType): boolean
    copyOffsetToSimfile(): void
    removeChartOffset(): void
    copyAllToSimfile(): void
    copyColumnsToSimfile(columns: TimingEventType[]): void
    copyColumnsFromSimfile(columns: TimingEventType[]): void
    copyAllFromSimfile(): void
    createChartColumns(columns: TimingEventType[]): void
    createEmptyData(): void
    deleteColumns(columns: TimingEventType[]): void
    deleteAllChartSpecific(): void
    reloadCache(types?: TimingType[]): void
    private splitSM
    private splitSMPairs
    insertColumnEvents(events: TimingEvent[]): void
    modifyColumnEvents(events: [TimingEvent, TimingEvent][]): void
    deleteColumnEvents(events: DeletableEvent[]): void
  }
}
declare module "app/src/chart/sm/Chart" {
  import { GameType } from "app/src/chart/gameTypes/GameTypeRegistry"
  import { ChartStats } from "app/src/chart/stats/ChartStats"
  import { ChartTimingData } from "app/src/chart/sm/ChartTimingData"
  import { ChartDifficulty } from "app/src/chart/sm/ChartTypes"
  import {
    Notedata,
    NotedataEntry,
    PartialNotedata,
    PartialNotedataEntry,
    RowData,
  } from "app/src/chart/sm/NoteTypes"
  import { Simfile } from "app/src/chart/sm/Simfile"
  export class Chart {
    readonly sm: Simfile
    readonly stats: ChartStats
    private notedata
    private notedataRows
    gameType: GameType
    timingData: ChartTimingData
    description: string
    difficulty: ChartDifficulty
    meter: number
    meterF: number
    radarValues: string
    chartName: string
    chartStyle: string
    credit: string
    music?: string
    other_properties: {
      [key: string]: string
    }
    private _lastBeat
    private _lastSecond
    private _startModify
    private _endModify
    /**
     * Creates a new Chart.
     * @param {Simfile} sm The Simfile this chart belongs to
     * @param {(string | { [key: string]: string })} [data] The data to load the chart from (used internally)
     * @memberof Chart
     */
    constructor(
      sm: Simfile,
      data?:
        | string
        | {
            [key: string]: string
          }
    )
    /**
     * Gets the last beat of this chart. If the last beat is a hold, it includes the hold length.
     *
     * @return {number} The last beat of the chart.
     * @memberof Chart
     */
    getLastBeat(): number
    /**
     * Gets the last second of this chart. If the last beat is a hold, it includes the hold length.
     *
     * @return {number} The last second of the chart.
     * @memberof Chart
     */
    getLastSecond(): number
    /**
     * Gets the second from a given beat.
     * Convenience method for this.timingData.getSecondsFromBeat
     *
     * @param {number} beat
     * @param {("noclamp" | "before" | "after" | "")} [option]
     * @return {*}  {number}
     * @memberof Chart
     */
    getSecondsFromBeat(
      beat: number,
      option?: "noclamp" | "before" | "after" | ""
    ): number
    /**
     * Gets the beat from a given second.
     * Convenience method for this.timingData.getBeatFromSeconds
     *
     * @param {number} seconds
     * @return {*}  {number}
     * @memberof Chart
     */
    getBeatFromSeconds(seconds: number): number
    /**
     * Gets the beat from a given effective beat.
     * Convenience method for this.timingData.getBeatFromEffectiveBeat
     *
     * @param {number} effBeat
     * @return {*}  {number}
     * @memberof Chart
     */
    getBeatFromEffectiveBeat(effBeat: number): number
    /**
     * Returns true if a beat is warped over (via WARPS, negative STOPS, etc.).
     * @param {number} beat
     * @return {*}  {boolean}
     * @memberof Chart
     */
    isBeatWarped(beat: number): boolean
    /**
     * Returns true if a beat is marked as fake.
     * @param {number} beat
     * @return {*}  {boolean}
     * @memberof Chart
     */
    isBeatFaked(beat: number): boolean
    private recalculateLastNote
    private getNoteIndex
    private insertNote
    private addEditRange
    private callEventListeners
    private markRecalculateAll
    /**
     * Adds a note to the notedata.
     * @param {PartialNotedataEntry} note
     * @param {boolean} [callListeners=true] Whether to call event listeners after adding the note
     * @return {NotedataEntry} The computed note that was added
     * @memberof Chart
     */
    addNote(note: PartialNotedataEntry, callListeners?: boolean): NotedataEntry
    /**
     * Adds notes to the notedata.
     * @param {PartialNotedataEntry[]} notes
     * @param {boolean} [callListeners=true] Whether to call event listeners after adding the notes
     * @return {NotedataEntry[]} The computed notes that were added
     * @memberof Chart
     */
    addNotes(
      notes: PartialNotedataEntry[],
      callListeners?: boolean
    ): NotedataEntry[]
    /**
     * Computes a note's eextra properties (second, quant, fake, warped).
     * @param {PartialNotedataEntry} note
     * @return {NotedataEntry} The computed note
     * @memberof Chart
     */
    computeNote(note: PartialNotedataEntry): NotedataEntry
    /**
     * Modifies a note in the notedata.
     * @param {PartialNotedataEntry} note
     * @return {NotedataEntry} The modified note
     * @memberof Chart
     */
    modifyNote(
      note: PartialNotedataEntry,
      properties: Partial<NotedataEntry>,
      callListeners?: boolean
    ): void
    /**
     * Removes a note from the notedata.
     * @param {PartialNotedataEntry} note
     * @param {boolean} [callListeners=true] Whether to call event listeners after removing the note
     * @return {NotedataEntry | undefined} The removed note, if it existed
     * @memberof Chart
     */
    removeNote(
      note: PartialNotedataEntry,
      callListeners?: boolean
    ): NotedataEntry | undefined
    /**
     * Removes notes from the notedata.
     * @param {PartialNotedataEntry[]} notes
     * @param {boolean} [callListeners=true] Whether to call event listeners after removing the notes
     * @return {NotedataEntry[]} The removed notes
     * @memberof Chart
     */
    removeNotes(
      notes: PartialNotedataEntry[],
      callListeners?: boolean
    ): NotedataEntry[]
    /**
     * Sets the notedata for the chart.
     * @param {PartialNotedata} notedata
     * @memberof Chart
     */
    setNotedata(notedata: PartialNotedata): void
    /**
     * Gets the notedata for the chart.
     * @returns {Notedata} The notedata of the chart.
     * @memberof Chart
     */
    getNotedata(): Notedata
    /**
     * Gets all rows in the chart.
     *
     * @return {RowData[]} The rows of the chart.
     * @memberof Chart
     */
    getRows(): RowData[]
    /**
     * Returns all notes within the given range (inclusive)
     *
     * @param {number} startBeat
     * @param {number} endBeat
     * @return {*}  {Notedata}
     * @memberof Chart
     */
    getNotedataInRange(startBeat: number, endBeat: number): Notedata
    /**
     * Returns all rows within the given range (inclusive)
     *
     * @param {number} startBeat
     * @param {number} endBeat
     * @return {*}  {RowData[]}
     * @memberof Chart
     */
    getRowsInRange(startBeat: number, endBeat: number): RowData[]
    /**
     * Recomputes all notes in the chart.
     * @memberof Chart
     */
    recalculateNotes(): void
    /**
     * Recalculates the rows in the chart.
     * @param startBeat The start beat of the range to recalculate.
     * @param endBeat The end beat of the range to recalculate.
     * @memberof Chart
     */
    recalculateRows(startBeat?: number | null, endBeat?: number | null): void
    /**
     * Gets the music path for this chart. If this chart does not have a music path, it returns the simfile's music path.
     *
     * @return {*}  {string}
     * @memberof Chart
     */
    getMusicPath(): string
    toString(): string
    /**
     * Serializes the chart to a string.
     *
     * @param {("sm" | "ssc" | "smebak")} type The type of serialization to perform.
     * @return {*}  {string} The serialized chart.
     * @memberof Chart
     */
    serialize(type: "sm" | "ssc" | "smebak"): string
    /**
     * Returns whether or not this chart has SSC features.
     * @return {boolean}
     * @memberof Chart
     */
    requiresSSC(): boolean
    /**
     * Returns the number of columns in this chart.
     * @return {number}
     * @memberof Chart
     */
    getColumnCount(): number
  }
}
declare module "app/src/chart/audio/ChartAudio" {
  class ToggleableBiquadFilterNode extends BiquadFilterNode {
    enabled: boolean
    static create(filter: BiquadFilterNode): ToggleableBiquadFilterNode
  }
  export class ChartAudio {
    private readonly _audioAnalyzer
    private readonly _filteredAudioAnalyzer
    private readonly _freqData
    private readonly _filteredFreqData
    private readonly _gainNode
    private readonly type
    private _audioContext
    private _source?
    private _playbackTime
    private _startTimestamp
    private _rate
    private _isPlaying
    private _buffer
    private _filteredBuffer
    private _loadedBuffer
    private _delay?
    private _loadListeners
    private _updateListeners
    private _volume
    private _destroyed
    private _renderTimeout?
    private _filters
    private _filtersEnabled
    onStop?: () => void
    loaded: Promise<void>
    constructor(data?: ArrayBuffer, type?: string)
    /**
     * Renders the specified AudioBuffer to the buffer of this ChartAudio
     *
     * @private
     * @param {(AudioBuffer | undefined)} buffer The buffer to render.
     * @return {*}  {Promise<void>}
     * @memberof ChartAudio
     */
    private renderBuffer
    /**
     * Renders the specified AudioBuffer to the buffer of this ChartAudio, applying filters set to this instance.
     *
     * @private
     * @param {(AudioBuffer | undefined)} buffer The buffer to render.
     * @return {*}  {Promise<void>}
     * @memberof ChartAudio
     */
    private renderFilteredBuffer
    private createFilter
    getFilters(): ToggleableBiquadFilterNode[]
    getFilter(filterIndex: number): ToggleableBiquadFilterNode
    updateFilter(
      filterIndex: number,
      properties: {
        Q?: number
        gain?: number
        frequency?: number
      }
    ): void
    enableFilter(filterIndex: number): void
    disableFilter(filterIndex: number): void
    hasFilters(): boolean
    /**
     * Add a listener that fires when the audio buffer is loaded.
     * @memberof ChartAudio
     */
    onLoad(callback: () => void): void
    /**
     * Removes a listener that fires when the audio buffer is loaded.
     * @memberof ChartAudio
     */
    offLoad(callback: () => void): void
    /**
     * Add a listener that fires when the filters are updated or the audio buffer is loaded.
     * @memberof ChartAudio
     */
    onUpdate(callback: () => void): void
    /**
     * Removes a listener that fires when the filters are updated or the audio buffer is loaded.
     * @memberof ChartAudio
     */
    offUpdate(callback: () => void): void
    /**
     * Returns the length of the audio in seconds.
     *
     * @return {*} {number}
     * @memberof ChartAudio
     */
    getSongLength(): number
    /**
     * Returns an array containing the byte frequency data.
     *
     * @return {*}  {Uint8Array}
     * @memberof ChartAudio
     */
    getFrequencyData(): Uint8Array
    /**
     * Returns an array containing the byte frequency data after audio filtering.
     *
     * @return {*}  {Uint8Array}
     * @memberof ChartAudio
     */
    getFilteredFrequencyData(): Uint8Array
    /**
     * Returns the sample rate of the audio
     *
     * @return {*}  {number}
     * @memberof ChartAudio
     */
    getSampleRate(): number
    /**
     * Returns the FFT size of the audio analyzer.
     *
     * @return {*}  {number}
     * @memberof ChartAudio
     */
    getFFTSize(): number
    /**
     * Returns the raw audio data. Each channel has its own Float32Array.
     *
     * @return {*}  {number[]}
     * @memberof ChartAudio
     */
    getRawData(): Float32Array[]
    /**
     * Returns the filtered raw audio data. Each channel has its own Float32Array.
     *
     * @return {*}  {number[]}
     * @memberof ChartAudio
     */
    getFilteredRawData(): Float32Array[]
    getBuffer(): AudioBuffer
    /**
     * Returns whether the audio is currently playing
     *
     * @return {*}  {boolean}
     * @memberof ChartAudio
     */
    isPlaying(): boolean
    reload(): void
    /**
     * Destroys this instance and frees up memory. Unbinds all bound waveforms.
     * Destroyed instances cannot be used again.
     * @memberof ChartAudio
     */
    destroy(): void
    getFrequencyResponse(frequencies: number[]): number[]
    private callLoadListeners
    private callUpdateListeners
    private decodeData
    private initSource
    /**
     * Sets the volume of this audio. 1 is 100%.
     *
     * @param {number} volume
     * @memberof ChartAudio
     */
    volume(volume: number): void
    /**
     * Sets the playback rate of this audio. 1 is 100%.
     * Changing the rate will change the pitch.
     * @param {number} rate
     * @memberof ChartAudio
     */
    rate(rate: number): void
    /**
     * Starts playing this audio.
     *
     * @memberof ChartAudio
     */
    play(): void
    /**
     * Seeks the audio to the specified location. If no time is provided, returns the current playback time.
     * @return {*}  {number}
     * @memberof ChartAudio
     */
    seek(): number
    seek(playbackTime: number): void
    /**
     * Pauses this audio.
     *
     * @memberof ChartAudio
     */
    pause(): void
    /**
     * Stops this audio.
     *
     * @param {boolean} [pause]
     * @memberof ChartAudio
     */
    stop(pause?: boolean): void
  }
}
declare module "app/src/chart/ChartRenderer" {
  import { Container, DisplayObject } from "pixi.js"
  import { ChartManager } from "app/src/chart/ChartManager"
  import { Notefield } from "app/src/chart/component/notefield/Notefield"
  import { TimingWindow } from "app/src/chart/play/TimingWindow"
  import { Chart } from "app/src/chart/sm/Chart"
  import { NotedataEntry } from "app/src/chart/sm/NoteTypes"
  import {
    Cached,
    ScrollTimingEvent,
    TimingEvent,
  } from "app/src/chart/sm/TimingTypes"
  interface SelectionBounds {
    startX: number
    startBeat: number
    endBeat: number
    endX: number
    lastKnownBeat: number
  }
  export interface ChartRendererComponent extends DisplayObject {
    update: (firstBeat: number, lastBeat: number) => void
    readonly isEditGUI: boolean
  }
  export class ChartRenderer extends Container<ChartRendererComponent> {
    chartManager: ChartManager
    chart: Chart
    private speedMult
    private lastMousePos?
    private lastMouseBeat
    private lastMouseCol
    private lastNoteType
    private lastHoldBeat
    private editingCol
    private cachedBeat
    private cachedTime
    private readonly waveform
    private readonly barlines
    private readonly timingAreas
    private readonly timingTracks
    private readonly techIndicators
    private readonly techErrors
    private readonly candleIndicator
    private readonly selectedEvents
    private readonly timingBar
    private notefield
    private readonly snapDisplay
    private readonly judgement
    private readonly combo
    private readonly selectionBoundary
    private readonly selectionArea
    private readonly previewArea
    private readonly scrollDebug
    private readonly parityDebug
    private selectionBounds?
    constructor(chartManager: ChartManager)
    isDragSelecting(): boolean
    doJudgement(
      note: NotedataEntry,
      error: number | null,
      judgement: TimingWindow
    ): void
    startPlay(): void
    endPlay(): void
    update(): void
    /**
     * Gets the current time including play offset
     *
     * @return {*}  {number}
     * @memberof ChartRenderer
     */
    getTimeWithOffset(): number
    /**
     * Gets the current beat including play offset
     *
     * @return {*}  {number}
     * @memberof ChartRenderer
     */
    getBeatWithOffset(): number
    /**
     * Gets the current time including play and visual offset
     *
     * @return {*}  {number}
     * @memberof ChartRenderer
     */
    getVisualTime(): number
    /**
     * Gets the current beat including play and visual offset
     *
     * @return {*}  {number}
     * @memberof ChartRenderer
     */
    getVisualBeat(): number
    getXPosFromColumn(col: number): number
    /**
     * Returns the y position for a note on the given beat.
     *
     * @param {number} beat
     * @return {*}  {number}
     * @memberof ChartRenderer
     */
    getYPosFromBeat(beat: number): number
    /**
     * Returns the y position for a note at the given second.
     * Use this method to prevent calculating the current second (usually in CMod).
     *
     * @param {number} time
     * @return {*}  {number}
     * @memberof ChartRenderer
     */
    getYPosFromSecond(time: number): number
    /**
     * Returns the second for a note at the specified y position.
     * May return an incorrect value when negative scrolls are used.
     *
     * @param {number} yp
     * @return {*}  {number}
     * @memberof ChartRenderer
     */
    getSecondFromYPos(yp: number): number
    /**
     * Returns the beat for a note at the specified y position.
     * May return an incorrect value when negative scrolls are used.
     *
     * @param {number} yp
     * @param {boolean} [ignoreScrolls] - Set to true to ignore scrolls
     * @return {*}  {number}
     * @memberof ChartRenderer
     */
    getBeatFromYPos(yp: number, ignoreScrolls?: boolean): number
    getColumnFromXPos(xp: number): number
    /**
     * Returns the y position of the receptors after zooming.
     *
     * @return {*}  {number}
     * @memberof ChartRenderer
     */
    getActualReceptorYPos(): number
    getEffectiveBeatsToPixelsRatio(): number
    getPixelsToEffectiveBeatsRatio(): number
    getSecondsToPixelsRatio(): number
    getPixelsToSecondsRatio(): number
    /**
     * Returns true if the chart is current at a negative scroll.
     *
     * @param {number} beat
     * @return {boolean}
     * @memberof ChartRenderer
     */
    isNegScroll(beat: number): boolean
    /**
     * Returns the y position of the top of the screen
     *
     * @return {*}  {number}
     * @memberof ChartRenderer
     */
    getUpperBound(): number
    /**
     * Returns the y position of the bottom of the screen
     *
     * @return {*}  {number}
     * @memberof ChartRenderer
     */
    getLowerBound(): number
    findFirstOnScreenScroll(): ScrollTimingEvent
    findLastOnScreenScroll(): ScrollTimingEvent
    getTopOnScreenBeat(): number
    getBottomOnScreenBeat(): number
    isAreaOnScreen(y1: number, y2: number): boolean
    getCurrentSpeedMult(): number
    getScrollDirection(scrollValue: number): number
    /**
     * Returns the minimum beat to render
     *
     * @return {*}  {number}
     * @memberof ChartRenderer
     */
    getUpperBoundBeat(): number
    /**
     * Returns the maximum beat to render.
     *
     * @return {*}  {number}
     * @memberof ChartRenderer
     */
    getLowerBoundBeat(): number
    /**
     * Tests if an object is in the selection sprite.
     *
     * @param {Container} object
     * @return {*}  {boolean}
     * @memberof ChartRenderer
     */
    selectionTest(object: DisplayObject): boolean
    /**
     * Adds the selection and drag handlers to this object. Call this function when creating a new note object.
     *
     * @param {DisplayObject} object
     * @param {NotedataEntry} notedata
     * @memberof ChartRenderer
     */
    registerDragNote(object: DisplayObject, notedata: NotedataEntry): void
    getNotefield(): Notefield
    swapNoteskin(name: string): void
    reloadNotefield(): void
    getSelectionBounds(): SelectionBounds | undefined
    shouldDisplayEditGUI(): boolean
    shouldDisplayNoteSelection(note: NotedataEntry): boolean
    shouldDisplayEventSelection(event: Cached<TimingEvent>): boolean
  }
}
declare module "app/src/chart/play/GameplayStats" {
  import { ChartManager } from "app/src/chart/ChartManager"
  import { HoldNotedataEntry, NotedataEntry } from "app/src/chart/sm/NoteTypes"
  import { HoldDroppedTimingWindow } from "app/src/chart/play/HoldDroppedTimingWindow"
  import { HoldTimingWindow } from "app/src/chart/play/HoldTimingWindow"
  import { StandardTimingWindow } from "app/src/chart/play/StandardTimingWindow"
  import { TimingWindow } from "app/src/chart/play/TimingWindow"
  interface JudgementDataPoint {
    second: number
    error: number | null
    judgement: TimingWindow
    notes: NotedataEntry[]
  }
  export class GameplayStats {
    private judgementCounts
    private holdJudgementCounts
    private dancePoints
    private maxCumulativeDancePoints
    private maxDancePoints
    private chartManager
    private readonly notedata
    private dataPoints
    private handlers
    private combo
    private missCombo
    private maxCombo
    private bestJudge?
    constructor(chartManager: ChartManager)
    onJudge(handler: (error: number | null, judge: TimingWindow) => void): void
    applyOffset(offset: number): void
    /**
     * Adds a new judgement.
     *
     * @param {NotedataEntry[]} notes - The notes in this row.
     * @param {TimingWindow} judge - The judgement received
     * @param {number} error - The timing error in ms
     * @memberof GameplayStats
     */
    addDataPoint(
      notes: NotedataEntry[],
      judge: TimingWindow,
      error: number | null
    ): void
    /**
     * Add a new judgement for holds
     *
     * @param {HoldNotedataEntry} note - The hold note
     * @param {(HoldTimingWindow | HoldDroppedTimingWindow)} judge - The judgement received
     * @memberof GameplayStats
     */
    addHoldDataPoint(
      note: HoldNotedataEntry,
      judge: HoldTimingWindow | HoldDroppedTimingWindow
    ): void
    /**
     * Returns the score. 1 is 100%.
     *
     * @return {*}  {number}
     * @memberof GameplayStats
     */
    getScore(): number
    /**
     * Returns the cumulative score.
     * Cumulative score is based on the number of arrows that have received a judgement.
     * 1 is 100%.
     *
     * @return {*}  {number}
     * @memberof GameplayStats
     */
    getCumulativeScore(): number
    getDataPoints(): JudgementDataPoint[]
    getMedian(): number
    /**
     * Returns the max combo.
     *
     * @return {*}  {number}
     * @memberof GameplayStats
     */
    getMaxCombo(): number
    private calculateMaxDP
    /**
     * Returns the number of judgements for a given judgement.
     *
     * @param {TimingWindow} window
     * @return {*}  {number}
     * @memberof GameplayStats
     */
    getCount(window: TimingWindow): number
    /**
     * Returns the current combo
     *
     * @return {*}  {number}
     * @memberof GameplayStats
     */
    getCombo(): number
    /**
     * Returns the current miss combo.
     *
     * @return {*}  {number}
     * @memberof GameplayStats
     */
    getMissCombo(): number
    /**
     * Returns the best judgement received
     *
     * @return {*}  {(StandardTimingWindow | undefined)}
     * @memberof GameplayStats
     */
    getBestJudge(): StandardTimingWindow | undefined
  }
}
declare module "app/src/chart/ChartManager" {
  import { Howl } from "howler/dist/howler.core.min.js"
  import { App } from "app/src/App"
  import { WidgetManager } from "app/src/gui/widget/WidgetManager"
  import { SchedulableSoundEffect } from "app/src/util/SchedulableSoundEffect"
  import { ChartRenderer } from "app/src/chart/ChartRenderer"
  import { ChartAudio } from "app/src/chart/audio/ChartAudio"
  import { GameplayStats } from "app/src/chart/play/GameplayStats"
  import { Chart } from "app/src/chart/sm/Chart"
  import {
    Notedata,
    NotedataEntry,
    PartialNotedata,
    PartialNotedataEntry,
    TapNoteType,
  } from "app/src/chart/sm/NoteTypes"
  import { Simfile } from "app/src/chart/sm/Simfile"
  import { Cached, TimingEvent } from "app/src/chart/sm/TimingTypes"
  interface Selection {
    notes: Notedata
    shift?: {
      columnShift: number
      beatShift: number
    }
    inProgressNotes: Notedata
  }
  interface EventSelection {
    shift?: {
      beatShift: number
    }
    timingEvents: Cached<TimingEvent>[]
    inProgressTimingEvents: Cached<TimingEvent>[]
  }
  export enum EditMode {
    View = "View Mode",
    Edit = "Edit Mode",
    Play = "Play Mode",
    Record = "Record Mode",
  }
  export enum EditTimingMode {
    Off = 0,
    Edit = 1,
    Add = 2,
  }
  export class ChartManager {
    app: App
    chartAudio: ChartAudio
    chartView?: ChartRenderer
    widgetManager: WidgetManager
    assistTick: SchedulableSoundEffect
    me_high: SchedulableSoundEffect
    me_low: SchedulableSoundEffect
    mine: Howl
    loadedSM?: Simfile
    smPath: string
    loadedChart?: Chart
    selection: Selection
    eventSelection: EventSelection
    editTimingMode: EditTimingMode
    private holdEditing
    private editNoteTypeIndex
    private partialScroll
    private noteFlashIndex
    private assistTickIndex
    private lastMetronomeDivision
    private lastMetronomeMeasure
    private holdFlashes
    private lastSong
    private mode
    private lastMode
    private _beat
    private cachedSecond
    private cachedBeat
    private readonly noChartTextA
    private readonly noChartTextB
    private readonly loadingText
    private shiftPressed
    private virtualClipboard
    private lastAutoSave
    startRegion?: number
    endRegion?: number
    gameStats?: GameplayStats
    constructor(app: App)
    get beat(): number
    set beat(beat: number)
    get time(): number
    set time(time: number)
    /**
     * Loads the SM from the specified path. If no path is specified, the current SM is hidden.
     *
     * @param {string} [path]
     * @memberof ChartManager
     */
    loadSM(path?: string): Promise<void>
    /**
     * Loads the specified chart. If no chart is loaded, the chart with the highest difficulty is loaded.
     *
     * @param {Chart} [chart]
     * @memberof ChartManager
     */
    loadChart(chart?: Chart): Promise<void>
    /**
     * Loads the audio of the current chart.
     *
     * @memberof ChartManager
     */
    loadAudio(): Promise<void>
    /**
     * Finds the audio file associated with the music path.
     * If none is found, attempt to find other audio files in the directory.
     *
     * @private
     * @param {string} musicPath
     * @return {Promise<FileSystemFileHandle | undefined>}
     * @memberof ChartManager
     */
    private getAudioHandle
    getAudio(): ChartAudio
    private updateSoundProperties
    setRate(rate: number): void
    setVolume(volume: number): void
    setEffectVolume(volume: number): void
    private setNoteIndex
    playPause(): void
    getClosestTick(beat: number, quant: number): number
    snapToNearestTick(beat: number): void
    snapToPreviousTick(): void
    snapToNextTick(): void
    previousSnap(): void
    nextSnap(): void
    private getSnapIndex
    private removeDuplicateBeats
    private getRows
    /**
     * Seeks to the previous note.
     *
     * @memberof ChartManager
     */
    previousNote(): void
    /**
     * Seeks to the next note.
     *
     * @memberof ChartManager
     */
    nextNote(): void
    /**
     * Seeks to the first note.
     *
     * @memberof ChartManager
     */
    firstNote(): void
    /**
     * Seeks to the last note.
     *
     * @memberof ChartManager
     */
    lastNote(): void
    private truncateHold
    /**
     * Places/removes a note at the specified beat and column
     *
     * @param {number} col - The column to place the note at
     * @param {("mouse" | "key")} type - The input type
     * @param {number} [beat] - The beat to place the note at. Defaults to the current beat.
     * @memberof ChartManager
     */
    setNote(col: number, type: "mouse" | "key", beat?: number): void
    /**
     * Extends the hold in the specified column to the current beat
     *
     * @param {number} col - The column of the hold.
     * @param {number} beat - The beat to extend to
     * @param {boolean} roll - Whether to convert holds into rolls
     * @memberof ChartManager
     */
    editHoldBeat(col: number, beat: number, roll: boolean): void
    /**
     * Stops editing in a column
     *
     * @param {number} col
     * @memberof ChartManager
     */
    endEditing(col: number): void
    previousNoteType(): void
    nextNoteType(): void
    getEditingNoteType(): TapNoteType | null
    setEditingNoteType(type: TapNoteType): void
    /**
     * Gets the current mode.
     *
     * @return {*}  {EditMode}
     * @memberof ChartManager
     */
    getMode(): EditMode
    /**
     * Sets the current mode to the specified mode.
     *
     * @param {EditMode} mode
     * @memberof ChartManager
     */
    setMode(mode: EditMode): void
    /**
     * Judges a key down on a certain column.
     * Places notes if the current mode is Record Mode.
     * @param {number} col
     * @memberof ChartManager
     */
    judgeCol(col: number): void
    /**
     * Judges a key up on a certain column.
     *
     * @param {number} col
     * @memberof ChartManager
     */
    judgeColUp(col: number): void
    /**
     * Saves the current chart to disk.
     *
     * @memberof ChartManager
     */
    save(): Promise<void>
    getDataPath(): string
    getSMPath(ext: string): string
    removeAutosaves(): Promise<void>
    /**
     * Autosaves the current chart to disk.
     *
     * @memberof ChartManager
     */
    autosave(): Promise<void>
    hasSelection(): boolean
    hasNoteSelection(): boolean
    hasEventSelection(): boolean
    hasRange(): boolean
    /**
     * Clears the current selection
     *
     * @memberof ChartManager
     */
    clearSelections(): void
    startDragSelection(): void
    endDragSelection(): void
    startDragEventSelection(): void
    endDragEventSelection(): void
    addNoteToDragSelection(note: NotedataEntry): void
    removeNoteFromDragSelection(note: NotedataEntry): void
    addEventToDragSelection(event: Cached<TimingEvent>): void
    removeEventFromDragSelection(event: Cached<TimingEvent>): void
    addNoteToSelection(note: NotedataEntry): void
    removeNoteFromSelection(note: NotedataEntry): void
    setNoteSelection(notes: NotedataEntry[]): void
    addEventToSelection(event: Cached<TimingEvent>): void
    removeEventFromSelection(event: Cached<TimingEvent>): void
    setEventSelection(notes: Cached<TimingEvent>[]): void
    isNoteInSelection(note: NotedataEntry): boolean
    isEventInSelection(event: Cached<TimingEvent>): boolean
    private addNoteSelection
    private removeNoteSelection
    private getNoteSelectionIndex
    private addEventSelection
    private removeEventSelection
    private getEventSelectionIndex
    selectRegion(): void
    modifySelection(
      modify: (note: NotedataEntry) => PartialNotedataEntry,
      clear?: boolean
    ): void
    private checkConflicts
    modifyEventSelection(
      modify: (event: Cached<TimingEvent>) => TimingEvent
    ): void
    deleteSelection(): void
    deleteEventSelection(): void
    paste(data: string, clear?: boolean): void
    pasteNotes(data: string, clear?: boolean): boolean
    insertNotes(notes: PartialNotedata, clear?: boolean): void
    pasteTempo(data: string): boolean
    copy(): string | undefined
  }
}
interface SecureFileSystemFileHandle extends FileSystemHandle {
  readonly kind: "file"
  /** [MDN Reference](https://developer.mozilla.org/docs/Web/API/FileSystemFileHandle/createSyncAccessHandle) */
  createSyncAccessHandle(): Promise<FileSystemSyncAccessHandle>
  /** [MDN Reference](https://developer.mozilla.org/docs/Web/API/FileSystemFileHandle/createWritable) */
  createWritable(
    options?: FileSystemCreateWritableOptions
  ): Promise<FileSystemWritableFileStream>
  /** [MDN Reference](https://developer.mozilla.org/docs/Web/API/FileSystemFileHandle/getFile) */
  getFile(): Promise<File>
}
interface FileSystemSyncAccessHandle {
  /** [MDN Reference](https://developer.mozilla.org/docs/Web/API/FileSystemSyncAccessHandle/close) */
  close(): void
  /** [MDN Reference](https://developer.mozilla.org/docs/Web/API/FileSystemSyncAccessHandle/flush) */
  flush(): void
  /** [MDN Reference](https://developer.mozilla.org/docs/Web/API/FileSystemSyncAccessHandle/getSize) */
  getSize(): number
  /** [MDN Reference](https://developer.mozilla.org/docs/Web/API/FileSystemSyncAccessHandle/read) */
  read(
    buffer: AllowSharedBufferSource,
    options?: FileSystemReadWriteOptions
  ): number
  /** [MDN Reference](https://developer.mozilla.org/docs/Web/API/FileSystemSyncAccessHandle/truncate) */
  truncate(newSize: number): void
  /** [MDN Reference](https://developer.mozilla.org/docs/Web/API/FileSystemSyncAccessHandle/write) */
  write(
    buffer: AllowSharedBufferSource,
    options?: FileSystemReadWriteOptions
  ): number
}
interface FileSystemReadWriteOptions {
  at?: number
}
declare function getDirectoryHandle(
  path: string,
  options?: FileSystemGetFileOptions,
  dir?: FileSystemDirectoryHandle
): Promise<FileSystemDirectoryHandle | undefined>
declare function getFileHandle(
  path: string,
  options?: FileSystemGetFileOptions
): Promise<SecureFileSystemFileHandle | undefined>
declare function resolvePath(path: string): string
