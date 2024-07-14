import { Options } from "../../../util/Options"
import { bsearch, getNoteEnd } from "../../../util/Util"
import { ChartManager } from "../../ChartManager"
import { TimingWindowCollection } from "../../play/TimingWindowCollection"
import {
  HoldNotedataEntry,
  Notedata,
  NotedataEntry,
  isHoldNote,
  isTapNote,
} from "../../sm/NoteTypes"
import { TimingData } from "../../sm/TimingData"
import { BasicGameLogic } from "../common/BasicGameLogic"

export class PumpGameLogic extends BasicGameLogic {
  protected tickProgress: {
    ticks: number[]
    hold: HoldNotedataEntry
    nextTick: number
    hitLast: boolean
  }[] = []
  protected collection: TimingWindowCollection =
    TimingWindowCollection.getCollection("ITG")

  protected holdIndex = 0
  usesHoldTicks = true

  update(chartManager: ChartManager): void {
    if (!chartManager.loadedChart || !chartManager.chartView) return
    const beat = chartManager.chartView.getBeatWithOffset()
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

    while (
      chartManager.loadedChart.getNotedata()[this.holdIndex] &&
      chartManager.loadedChart.getNotedata()[this.holdIndex].beat < beat
    ) {
      const note = chartManager.loadedChart.getNotedata()[this.holdIndex]
      if (isHoldNote(note) && !note.fake && !note.warped) {
        this.tickProgress.push({
          ticks: this.generateHoldTicks(
            chartManager.loadedChart.timingData,
            note
          ),
          hold: note,
          nextTick: 0,
          hitLast: false,
        })
      }
      this.holdIndex++
    }

    // Do Holds/Rolls
    for (const dat of this.tickProgress) {
      const hold = dat.hold
      const ticks = dat.ticks
      if (hold.type == "Hold") {
        if (this.heldCols.isPressed(hold.col)) {
          hold.gameplay!.lastHoldActivation = Date.now()
          hold.gameplay!.droppedHoldBeat = undefined
          if (hold.gameplay?.droppedHoldBeat !== undefined) {
            chartManager.chartView.getNotefield().activateHold(hold.col)
          }
        } else if (hold.gameplay!.droppedHoldBeat === undefined) {
          hold.gameplay!.droppedHoldBeat =
            chartManager.chartView.getBeatWithOffset()
          chartManager.chartView.getNotefield().releaseHold(hold.col)
        }
      }
      if (hold.type == "Roll") {
        if (
          this.shouldDropHold(hold, Date.now()) &&
          hold.gameplay!.droppedHoldBeat === undefined
        ) {
          hold.gameplay!.droppedHoldBeat =
            chartManager.chartView.getBeatWithOffset()
          chartManager.chartView.getNotefield().releaseRoll(hold.col)
        }
      }
      while (ticks[dat.nextTick] !== undefined && ticks[dat.nextTick] < beat) {
        if (hold.type == "Hold") {
          if (this.heldCols.isPressed(hold.col)) {
            chartManager.chartView.doJudgement(
              hold,
              null,
              this.collection.getStandardWindows()[0]
            )
            chartManager.gameStats?.addDataPoint(
              [hold],
              this.collection.getStandardWindows()[0],
              null
            )
            if (dat.nextTick == ticks.length - 1) {
              dat.hitLast = true
            }
          } else {
            chartManager.chartView.doJudgement(
              hold,
              null,
              this.collection.getMissJudgement()
            )
            chartManager.gameStats?.addDataPoint(
              [hold],
              this.collection.getMissJudgement(),
              null
            )
          }
        }
        dat.nextTick++
      }

      if (
        chartManager.chartView.getTimeWithOffset() >=
        chartManager.chartView.chart.getSecondsFromBeat(hold.beat + hold.hold)
      ) {
        hold.gameplay!.hideNote = dat.hitLast
        this.tickProgress.splice(this.tickProgress.indexOf(dat), 1)
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
          0,
          this.collection.getMineJudgement()
        )
        chartManager.gameStats?.addDataPoint(
          [mine],
          this.collection.getMineJudgement(),
          0
        )
        chartManager.mine.play()
      }
    }
  }

  protected hitNote(
    chartManager: ChartManager,
    note: NotedataEntry,
    hitTime: number
  ) {
    note.gameplay!.hasHit = true
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
    this.holdIndex = firstHittableNote
    this.tickProgress = []
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
    for (const { hold } of this.tickProgress) {
      if (hold.type == "Roll" && hold.col == col) {
        hold.gameplay!.lastHoldActivation = Date.now()
        hold.gameplay!.droppedHoldBeat = undefined
        chartManager.chartView.getNotefield().activateRoll(hold.col)
      }
    }
    if (closestNote) this.hitNote(chartManager, closestNote, hitTime)
    else chartManager.chartView.getNotefield().ghostTap(col)
  }

  protected shouldDropHold(note: HoldNotedataEntry, time: number): boolean {
    if (!note.gameplay?.lastHoldActivation) return false
    const window = this.collection.getHeldJudgement(note)
    if (!window) return false
    return time - note.gameplay.lastHoldActivation >= window.getTimingWindowMS()
  }

  protected generateHoldTicks(timingData: TimingData, hold: HoldNotedataEntry) {
    // Jump to start of hold

    const tickCounts = timingData.getTimingData("TICKCOUNTS")
    let tickIndex = bsearch(tickCounts, hold.beat, a => a.beat)
    const latestEvent = tickCounts[tickIndex] ?? {
      type: "TICKCOUNTS",
      beat: 0,
      value: 4,
    }
    let tickLength = 1 / latestEvent.value
    let currentTick = Math.round(hold.beat / tickLength) * tickLength
    if (currentTick == hold.beat) currentTick += tickLength
    const ticks = []
    if ((tickCounts[tickIndex]?.value ?? 4) != 0) ticks.push(currentTick)
    while (currentTick < getNoteEnd(hold)) {
      if ((tickCounts[tickIndex]?.value ?? 4) == 0) {
        currentTick = tickCounts[tickIndex + 1]?.beat
        if (currentTick === undefined) {
          return ticks
        }
      } else {
        currentTick += tickLength
      }
      if (tickCounts[tickIndex + 1]?.beat <= currentTick) {
        tickIndex += 1
        currentTick = tickCounts[tickIndex].beat
        tickLength = 1 / tickCounts[tickIndex].value
      }
      if (
        (tickCounts[tickIndex]?.value ?? 4) != 0 &&
        currentTick < getNoteEnd(hold)
      )
        ticks.push(currentTick)
    }
    return ticks
  }

  calculateMaxDP(notedata: Notedata, timingData: TimingData): number {
    const chordCohesion: Map<number, NotedataEntry[]> = new Map()
    let maxDancePoints = 0
    for (const note of notedata) {
      if (note.type == "Mine" || note.fake || note.warped) continue
      if (isHoldNote(note)) {
        maxDancePoints +=
          TimingWindowCollection.getCollection(
            Options.play.timingCollection
          ).getMaxDancePoints() *
          this.generateHoldTicks(timingData, note).length
      }
      if (!chordCohesion.has(note.beat)) chordCohesion.set(note.beat, [])
      chordCohesion.get(note.beat)!.push(note)
    }
    maxDancePoints +=
      chordCohesion.size *
      TimingWindowCollection.getCollection(
        Options.play.timingCollection
      ).getMaxDancePoints()
    return maxDancePoints
  }
}
