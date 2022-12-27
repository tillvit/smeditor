import { Options } from "../../util/Options"
import { Notedata, NotedataEntry, NoteType } from "../sm/NoteTypes"
import { HoldTimingWindow } from "./HoldTimingWindow"
import { TimingWindow } from "./TimingWindow"

interface JudgmentDataPoint {
  second: number,
  error: number,
  judgment: TimingWindow
  notes: NotedataEntry[]
}

export class GameplayStats {
  private judgmentCounts: Map<TimingWindow, number> = new Map
  private dancePoints = 0
  private maxCumulativeDancePoints = 0
  private maxDancePoints = 0
  private notedata: Notedata
  private dataPoints: JudgmentDataPoint[] = []

  constructor(notedata: Notedata) {
    this.notedata = notedata
    this.calculateMaxDP()
  }

  addDataPoint(notes: NotedataEntry[], judge: TimingWindow, error: number) {
    if (!this.judgmentCounts.has(judge)) this.judgmentCounts.set(judge, 0)
    this.judgmentCounts.set(judge, this.judgmentCounts.get(judge)! + 1)
    this.dancePoints += judge.dancePoints
    this.maxCumulativeDancePoints += Options.play.timingCollection.getMaxDancePoints()
    if (judge.name == "Miss") {
      this.maxCumulativeDancePoints += notes.filter(note => note.hold).reduce((totalDP, note) => {
        return totalDP + Options.play.timingCollection.getMaxHoldDancePoints(note.type)
      }, 0)
    }
    this.dataPoints.push({
      second: notes[0].second,
      error,
      judgment: judge,
      notes
    })
  }

  addHoldDataPoint(note: NotedataEntry, judge: HoldTimingWindow) {
    if (!this.judgmentCounts.has(judge)) this.judgmentCounts.set(judge, 0)
    this.judgmentCounts.set(judge, this.judgmentCounts.get(judge)! + 1)
    this.dancePoints += judge.dancePoints
    this.maxCumulativeDancePoints += Options.play.timingCollection.getMaxHoldDancePoints(note.type)
  }

  getScore(): number {
    if (this.maxDancePoints == 0) return 0
    return this.dancePoints / this.maxDancePoints
  }

  getCumulativeScore(): number {
    if (this.maxCumulativeDancePoints == 0) return 0
    return this.dancePoints / this.maxCumulativeDancePoints
  }

  recalculate(){
    this.calculateMaxDP()
    this.dancePoints = 0
    this.maxCumulativeDancePoints = 0
    for (let entry of this.judgmentCounts.entries()) {
      if ((entry[0] as HoldTimingWindow).noteType) {
        let judge: HoldTimingWindow = (entry[0] as HoldTimingWindow)
        this.dancePoints += entry[0].dancePoints
        if (judge.noteType != "Dropped")
          this.maxCumulativeDancePoints += entry[1] + Options.play.timingCollection.getMaxHoldDancePoints(judge.noteType)
      }
    }
    for (let dataPoint of this.dataPoints) {
      let judge = Options.play.timingCollection.judgeInput(dataPoint.error)
      if (!this.judgmentCounts.has(judge)) this.judgmentCounts.set(judge, 0)
      this.judgmentCounts.set(judge, this.judgmentCounts.get(judge)! + 1)
      this.dancePoints += judge.dancePoints
      this.maxCumulativeDancePoints += Options.play.timingCollection.getMaxDancePoints()
      if (judge.name == "Miss") {
        this.maxCumulativeDancePoints += dataPoint.notes.filter(note => note.hold).reduce((totalDP, note) => {
          return totalDP + Options.play.timingCollection.getMaxHoldDancePoints(note.type)
        }, 0)
      }
    }
  }

  private calculateMaxDP() {
    let chordCohesion: Map<number, NotedataEntry[]> = new Map
    let numHoldsMap: Map<NoteType, number> = new Map
    for (let note of this.notedata) {
      if (note.type == "Mine" || note.fake) continue
      if (note.hold) {
        if (!numHoldsMap.has(note.type)) numHoldsMap.set(note.type, 0)
        numHoldsMap.set(note.type, numHoldsMap.get(note.type)! + 1)
      }
      if (!chordCohesion.has(note.beat)) chordCohesion.set(note.beat, [])
      chordCohesion.get(note.beat)!.push(note)
    }
    this.maxDancePoints = chordCohesion.size * Options.play.timingCollection.getMaxDancePoints()
    this.maxDancePoints += Array.from(numHoldsMap.entries()).reduce((totalDP, entry) => {
      return totalDP + entry[1] * Options.play.timingCollection.getMaxHoldDancePoints(entry[0])
    }, 0)
  }
}