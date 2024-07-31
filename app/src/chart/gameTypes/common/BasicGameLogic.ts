import { ColHeldTracker } from "../../../util/ColHeldTracker"
import { Options } from "../../../util/Options"
import { bsearch } from "../../../util/Util"
import { ChartManager } from "../../ChartManager"
import { TimingWindowCollection } from "../../play/TimingWindowCollection"
import {
  HoldNotedataEntry,
  isHoldNote,
  isTapNote,
  Notedata,
  NotedataEntry,
} from "../../sm/NoteTypes"
import { TimingData } from "../../sm/TimingData"
import { GameLogic } from "../base/GameLogic"

export class BasicGameLogic extends GameLogic {
  protected chordCohesion: Map<number, NotedataEntry[]> = new Map()
  protected missNoteIndex = 0
  protected holdProgress: HoldNotedataEntry[] = []
  protected heldCols: ColHeldTracker = new ColHeldTracker()
  protected collection: TimingWindowCollection =
    TimingWindowCollection.getCollection("ITG")
  usesHoldTicks = false

  update(chartManager: ChartManager): void {
    if (!chartManager.loadedChart || !chartManager.chartView) return
    const hitTime = chartManager.chartView.getTimeWithOffset()
    const hitWindowStart =
      hitTime - (this.collection.maxWindowMS() / 1000) * Options.audio.rate
    let lastChord = -1
    // Do Misses
    while (
      chartManager.loadedChart.getNotedata()[this.missNoteIndex] &&
      chartManager.loadedChart.getNotedata()[this.missNoteIndex].second <
        hitWindowStart
    ) {
      const note = chartManager.loadedChart.getNotedata()[this.missNoteIndex]
      if (
        note.beat != lastChord &&
        note.type != "Mine" &&
        !note.fake &&
        !note.warped &&
        !note.gameplay!.hasHit
      ) {
        lastChord = note.beat
        chartManager.chartView.doJudgement(
          note,
          null,
          this.collection.getMissJudgement()
        )
        const chord = this.chordCohesion.get(note.beat)!
        chartManager.gameStats?.addDataPoint(
          chord,
          this.collection.getMissJudgement(),
          null
        )
      }
      this.missNoteIndex++
    }

    // Do Holds/Rolls
    for (const hold of this.holdProgress) {
      if (!hold.hold || !hold.gameplay!.lastHoldActivation) continue
      if (this.heldCols.isPressed(hold.col) && hold.type == "Hold")
        hold.gameplay!.lastHoldActivation = Date.now()
      if (this.shouldDropHold(hold, Date.now())) {
        chartManager.chartView.doJudgement(
          hold,
          null,
          this.collection.getDroppedJudgement()
        )
        hold.gameplay!.droppedHoldBeat =
          chartManager.chartView.getBeatWithOffset()
        this.holdProgress.splice(this.holdProgress.indexOf(hold), 1)
        if (hold.type == "Roll") {
          chartManager.chartView.getNotefield().releaseRoll(hold.col)
        } else {
          chartManager.chartView.getNotefield().releaseHold(hold.col)
        }
        chartManager.gameStats?.addHoldDataPoint(
          hold,
          this.collection.getDroppedJudgement()
        )
        continue
      }
      if (
        chartManager.chartView.getTimeWithOffset() >=
        chartManager.chartView.chart.getSecondsFromBeat(hold.beat + hold.hold)
      ) {
        hold.gameplay!.hideNote = true
        chartManager.chartView.doJudgement(
          hold,
          null,
          this.collection.getHeldJudgement(hold)
        )
        chartManager.chartView.getNotefield().releaseHold(hold.col)
        this.holdProgress.splice(this.holdProgress.indexOf(hold), 1)
        chartManager.gameStats?.addHoldDataPoint(
          hold,
          this.collection.getHeldJudgement(hold)
        )
      }
    }

    // Do Mines
    for (const col of this.heldCols.getHeldCols()) {
      const mine = this.getClosestNote(
        chartManager.loadedChart.getNotedata(),
        chartManager.chartView.getTimeWithOffset() -
          this.collection.getMineJudgement().getTimingWindowMS() / 2000,
        col,
        ["Mine"],
        this.collection.getMineJudgement().getTimingWindowMS() / 2
      )
      if (mine) {
        mine.gameplay!.hasHit = true
        mine.gameplay!.hideNote = true
        chartManager.chartView.doJudgement(
          mine,
          null,
          this.collection.getMineJudgement()
        )
        chartManager.gameStats?.addDataPoint(
          [mine],
          this.collection.getMineJudgement(),
          null
        )
        chartManager.mine.play()
      }
    }
  }

  startPlay(chartManager: ChartManager): void {
    if (!chartManager.loadedChart || !chartManager.chartView) return
    this.collection = TimingWindowCollection.getCollection(
      Options.play.timingCollection
    )
    this.chordCohesion.clear()
    for (const note of chartManager.loadedChart.getNotedata()) {
      if (note.type == "Mine" || note.fake || note.warped) continue
      if (!this.chordCohesion.has(note.beat))
        this.chordCohesion.set(note.beat, [])
      this.chordCohesion.get(note.beat)!.push(note)
    }
    const hitTime = chartManager.chartView.getTimeWithOffset()
    const hitWindowStart =
      hitTime - (this.collection.maxWindowMS() / 1000) * Options.audio.rate
    let firstHittableNote =
      bsearch(
        chartManager.loadedChart.getNotedata(),
        hitWindowStart,
        a => a.second
      ) + 1
    if (
      firstHittableNote >= 1 &&
      hitWindowStart <=
        chartManager.loadedChart.getNotedata()[firstHittableNote - 1].second
    )
      firstHittableNote--
    this.missNoteIndex = firstHittableNote
    this.holdProgress = []
    this.heldCols.reset()
  }

  keyDown(chartManager: ChartManager, col: number): void {
    if (!chartManager.loadedChart || !chartManager.chartView) return
    const hitTime = chartManager.chartView.getTimeWithOffset()
    const closestNote = this.getClosestNote(
      chartManager.loadedChart.getNotedata(),
      hitTime,
      col,
      ["Tap", "Hold", "Roll"]
    )
    this.heldCols.keyDown(col)
    chartManager.chartView.getNotefield().press(col)
    for (const hold of this.holdProgress) {
      if (hold.type == "Roll" && hold.col == col)
        hold.gameplay!.lastHoldActivation = Date.now()
    }
    if (closestNote) this.hitNote(chartManager, closestNote, hitTime)
    else chartManager.chartView.getNotefield().ghostTap(col)
  }

  keyUp(chartManager: ChartManager, col: number): void {
    if (!chartManager.loadedChart || !chartManager.chartView) return
    const hitTime = chartManager.chartView.getTimeWithOffset()
    const closestNote = this.getClosestNote(
      chartManager.loadedChart.getNotedata(),
      hitTime,
      col,
      ["Lift"]
    )
    this.heldCols.keyUp(col)
    chartManager.chartView.getNotefield().lift(col)
    if (closestNote) this.hitNote(chartManager, closestNote, hitTime)
  }

  shouldAssistTick(note: NotedataEntry): boolean {
    return !note.fake && !note.warped && note.type != "Mine"
  }

  protected hitNote(
    chartManager: ChartManager,
    note: NotedataEntry,
    hitTime: number
  ) {
    note.gameplay!.hasHit = true
    if (isHoldNote(note)) {
      note.gameplay!.lastHoldActivation = Date.now()
      if (note.type == "Roll") {
        chartManager.chartView!.getNotefield().activateRoll(note.col)
      } else {
        chartManager.chartView!.getNotefield().activateHold(note.col)
      }
      this.holdProgress.push(note)
    }
    const chord = this.chordCohesion.get(note.beat)!
    if (chord.every(note => note.gameplay!.hasHit)) {
      const judge = this.collection.judgeInput(
        (hitTime - note.second) / Options.audio.rate
      )
      const hideNote = this.collection.shouldHideNote(judge)
      chord.forEach(note => {
        chartManager.chartView!.doJudgement(
          note,
          (hitTime - note.second) / Options.audio.rate,
          judge
        )
        if (hideNote && isTapNote(note)) note.gameplay!.hideNote = true
      })
      chartManager.gameStats?.addDataPoint(
        chord,
        judge,
        (hitTime - note.second) / Options.audio.rate
      )
    }
  }

  protected getClosestNote(
    notedata: Notedata,
    hitTime: number,
    col: number,
    types: string[],
    windowMS?: number
  ): NotedataEntry | undefined {
    windowMS = windowMS ?? this.collection.maxWindowMS()
    windowMS *= Options.audio.rate
    const hitWindowStart = hitTime - windowMS / 1000
    const hitWindowEnd = hitTime + windowMS / 1000
    let firstHittableNote = bsearch(notedata, hitWindowStart, a => a.second) + 1
    if (
      firstHittableNote >= 1 &&
      hitWindowStart <= notedata[firstHittableNote - 1].second
    )
      firstHittableNote--
    let closestNote: NotedataEntry | undefined = undefined
    while (
      notedata[firstHittableNote] &&
      notedata[firstHittableNote].second <= hitWindowEnd
    ) {
      const note = notedata[firstHittableNote]
      if (
        note.gameplay!.hasHit ||
        note.col != col ||
        note.fake ||
        note.warped ||
        !types.includes(note.type)
      ) {
        firstHittableNote++
        continue
      }
      if (
        !closestNote ||
        Math.abs(note.second - hitTime) < Math.abs(closestNote.second - hitTime)
      ) {
        closestNote = note
      }
      firstHittableNote++
    }
    return closestNote
  }

  protected shouldDropHold(note: HoldNotedataEntry, time: number): boolean {
    if (!note.gameplay?.lastHoldActivation) return false
    const window = this.collection.getHeldJudgement(note)
    if (!window) return false
    return time - note.gameplay.lastHoldActivation >= window.getTimingWindowMS()
  }

  calculateMaxDP(notedata: Notedata, _: TimingData) {
    const chordCohesion: Map<number, NotedataEntry[]> = new Map()
    const numHoldsMap: Map<string, number> = new Map()
    for (const note of notedata) {
      if (note.type == "Mine" || note.fake || note.warped) continue
      if (isHoldNote(note)) {
        if (!numHoldsMap.has(note.type)) numHoldsMap.set(note.type, 0)
        numHoldsMap.set(note.type, numHoldsMap.get(note.type)! + 1)
      }
      if (!chordCohesion.has(note.beat)) chordCohesion.set(note.beat, [])
      chordCohesion.get(note.beat)!.push(note)
    }
    let maxDancePoints =
      chordCohesion.size *
      TimingWindowCollection.getCollection(
        Options.play.timingCollection
      ).getMaxDancePoints()
    maxDancePoints += Array.from(numHoldsMap.entries()).reduce(
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
    return maxDancePoints
  }
}
