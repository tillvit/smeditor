import { Options } from "../../util/Options"
import { ChartManager } from "../ChartManager"
import { isHoldNote, Notedata, NotedataEntry } from "../sm/NoteTypes"
import { HoldDroppedTimingWindow } from "./HoldDroppedTimingWindow"
import { HoldTimingWindow } from "./HoldTimingWindow"
import { StandardTimingWindow } from "./StandardTimingWindow"
import { TimingWindow } from "./TimingWindow"
import {
  isHoldDroppedTimingWindow,
  isMineTimingWindow,
  isStandardMissTimingWindow,
  isStandardTimingWindow,
  TimingWindowCollection,
} from "./TimingWindowCollection"

interface JudgmentDataPoint {
  second: number
  error: number
  judgment: TimingWindow
  notes: NotedataEntry[]
}

export class GameplayStats {
  private judgmentCounts: Map<TimingWindow, number> = new Map()
  private dancePoints = 0
  private maxCumulativeDancePoints = 0
  private maxDancePoints = 0
  private chartManager: ChartManager
  private notedata: Notedata
  private dataPoints: JudgmentDataPoint[] = []
  private handlers: ((error: number, judge: TimingWindow) => void)[] = []
  private combo = 0
  private missCombo = 0
  private maxCombo = 0
  private bestJudge?: StandardTimingWindow

  constructor(chartManager: ChartManager) {
    this.notedata = chartManager.chart!.notedata
    this.chartManager = chartManager
    this.bestJudge = TimingWindowCollection.getCollection(
      Options.play.timingCollection
    ).getStandardWindows()[0]
    this.calculateMaxDP()
  }

  onJudge(handler: (error: number, judge: TimingWindow) => void) {
    this.handlers.push(handler)
  }

  addDataPoint(notes: NotedataEntry[], judge: TimingWindow, error: number) {
    if (!this.judgmentCounts.has(judge)) this.judgmentCounts.set(judge, 0)
    this.judgmentCounts.set(judge, this.judgmentCounts.get(judge)! + 1)
    this.dancePoints += judge.dancePoints

    const comboMult = this.chartManager.chart!.timingData.getTimingEventAtBeat(
      "COMBOS",
      notes[0].beat
    )
    const hitMult = comboMult?.hitMult ?? 1
    const missMult = comboMult?.missMult ?? 1

    if (!isMineTimingWindow(judge))
      this.maxCumulativeDancePoints += TimingWindowCollection.getCollection(
        Options.play.timingCollection
      ).getMaxDancePoints()
    if (isStandardMissTimingWindow(judge)) {
      this.maxCumulativeDancePoints += notes
        .filter(isHoldNote)
        .reduce((totalDP, note) => {
          return (
            totalDP +
            TimingWindowCollection.getCollection(
              Options.play.timingCollection
            ).getMaxHoldDancePoints(note.type)
          )
        }, 0)
      this.combo = 0
      this.missCombo += missMult
      this.bestJudge = undefined
    } else if (isStandardTimingWindow(judge)) {
      if (
        TimingWindowCollection.getCollection(
          Options.play.timingCollection
        ).shouldHideNote(judge)
      ) {
        this.combo += notes.length * hitMult
        if (this.combo > this.maxCombo) this.maxCombo = this.combo
        this.missCombo = 0
        if (
          this.bestJudge &&
          judge.getTimingWindowMS() > this.bestJudge.getTimingWindowMS()
        )
          this.bestJudge = judge
      } else {
        this.bestJudge = undefined
        this.combo = 0
      }
    }
    this.handlers.forEach(handler => handler(error, judge))
    this.dataPoints.push({
      second: notes[0].second,
      error,
      judgment: judge,
      notes,
    })
  }

  addHoldDataPoint(
    note: NotedataEntry,
    judge: HoldTimingWindow | HoldDroppedTimingWindow
  ) {
    if (!this.judgmentCounts.has(judge)) this.judgmentCounts.set(judge, 0)
    this.judgmentCounts.set(judge, this.judgmentCounts.get(judge)! + 1)
    this.dancePoints += judge.dancePoints
    this.maxCumulativeDancePoints += TimingWindowCollection.getCollection(
      Options.play.timingCollection
    ).getMaxHoldDancePoints(note.type)
    this.handlers.forEach(handler => handler(0, judge))
    if (isHoldDroppedTimingWindow(judge)) {
      this.bestJudge = undefined
    }
  }

  getScore(): number {
    if (this.maxDancePoints == 0) return 0
    return this.dancePoints / this.maxDancePoints
  }

  getCumulativeScore(): number {
    if (this.maxCumulativeDancePoints == 0) return 0
    return this.dancePoints / this.maxCumulativeDancePoints
  }

  getDataPoints(): JudgmentDataPoint[] {
    return this.dataPoints
  }

  getMaxCombo(): number {
    return this.maxCombo
  }

  recalculate() {
    this.calculateMaxDP()
    this.dancePoints = 0
    this.maxCumulativeDancePoints = 0
    for (const entry of this.judgmentCounts.entries()) {
      if ((entry[0] as HoldTimingWindow).noteType) {
        const judge: HoldTimingWindow = entry[0] as HoldTimingWindow
        this.dancePoints += entry[0].dancePoints
        this.maxCumulativeDancePoints +=
          entry[1] +
          TimingWindowCollection.getCollection(
            Options.play.timingCollection
          ).getMaxHoldDancePoints(judge.noteType)
      }
    }
    for (const dataPoint of this.dataPoints) {
      const judge = TimingWindowCollection.getCollection(
        Options.play.timingCollection
      ).judgeInput(dataPoint.error)
      if (!this.judgmentCounts.has(judge)) this.judgmentCounts.set(judge, 0)
      this.judgmentCounts.set(judge, this.judgmentCounts.get(judge)! + 1)
      this.dancePoints += judge.dancePoints
      this.maxCumulativeDancePoints += TimingWindowCollection.getCollection(
        Options.play.timingCollection
      ).getMaxDancePoints()
      if (isStandardMissTimingWindow(judge)) {
        this.maxCumulativeDancePoints += dataPoint.notes
          .filter(isHoldNote)
          .reduce((totalDP, note) => {
            return (
              totalDP +
              TimingWindowCollection.getCollection(
                Options.play.timingCollection
              ).getMaxHoldDancePoints(note.type)
            )
          }, 0)
      }
    }
  }

  private calculateMaxDP() {
    const chordCohesion: Map<number, NotedataEntry[]> = new Map()
    const numHoldsMap: Map<string, number> = new Map()
    for (const note of this.notedata) {
      if (note.type == "Mine" || note.fake) continue
      if (isHoldNote(note)) {
        if (!numHoldsMap.has(note.type)) numHoldsMap.set(note.type, 0)
        numHoldsMap.set(note.type, numHoldsMap.get(note.type)! + 1)
      }
      if (!chordCohesion.has(note.beat)) chordCohesion.set(note.beat, [])
      chordCohesion.get(note.beat)!.push(note)
    }
    this.maxDancePoints =
      chordCohesion.size *
      TimingWindowCollection.getCollection(
        Options.play.timingCollection
      ).getMaxDancePoints()
    this.maxDancePoints += Array.from(numHoldsMap.entries()).reduce(
      (totalDP, entry) => {
        return (
          totalDP +
          entry[1] *
            TimingWindowCollection.getCollection(
              Options.play.timingCollection
            ).getMaxHoldDancePoints(entry[0])
        )
      },
      0
    )
  }

  getCount(window: TimingWindow): number {
    return this.judgmentCounts.get(window) ?? 0
  }

  getCombo(): number {
    return this.combo
  }

  getMissCombo(): number {
    return this.missCombo
  }

  getBestJudge(): StandardTimingWindow | undefined {
    return this.bestJudge
  }
}
