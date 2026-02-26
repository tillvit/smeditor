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
    beatsToEffectiveBeats: Map<number, number>
  }
  export type DeletableEvent = Partial<Cached<TimingEvent>> &
    Pick<TimingEvent, "type">
  export type TimingColumnType = "continuing" | "instant"
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
    snapToClosestTick(beat: number, snap: number): number
    snapToPreviousTick(beat: number, snap: number): number
    snapToNextTick(beat: number, snap: number): number
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
    recalculate(startBeat: number, endBeat: number): boolean
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
  export function requiresSMEData(sm: Simfile): boolean
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
