import { Options } from "../../../util/Options"
import { bsearch } from "../../../util/Util"
import { ChartManager } from "../../ChartManager"
import { TimingWindowCollection } from "../../play/TimingWindowCollection"
import { HoldNotedataEntry } from "../../sm/NoteTypes"
import { BasicGameLogic } from "../common/BasicGameLogic"

export class PumpGameLogic extends BasicGameLogic {
  protected collection: TimingWindowCollection =
    TimingWindowCollection.getCollection("ITG")

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
          0,
          this.collection.getMissJudgement()
        )
        const chord = this.chordCohesion.get(note.beat)!
        chartManager.gameStats?.addDataPoint(
          chord,
          this.collection.getMissJudgement(),
          0
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
          0,
          this.collection.getDroppedJudgement()
        )
        hold.gameplay!.droppedHoldBeat =
          chartManager.chartView.getBeatWithOffset()
        this.holdProgress.splice(this.holdProgress.indexOf(hold), 1)
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
          0,
          this.collection.getHeldJudgement(hold)
        )
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

  endPlay(chartManager: ChartManager): void {
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

  protected shouldDropHold(note: HoldNotedataEntry, time: number): boolean {
    if (!note.gameplay?.lastHoldActivation) return false
    const window = this.collection.getHeldJudgement(note)
    if (!window) return false
    return time - note.gameplay.lastHoldActivation >= window.getTimingWindowMS()
  }
}
