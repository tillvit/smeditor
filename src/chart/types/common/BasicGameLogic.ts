import { ColHeldTracker } from "../../../util/ColHeldTracker"
import { Options } from "../../../util/Options"
import { bsearch, roundDigit } from "../../../util/Util"
import { ChartManager } from "../../ChartManager"
import { HoldNotedataEntry, isHoldNote, isTapNote, Notedata, NotedataEntry } from "../../sm/NoteTypes"
import { GameLogic } from "../base/GameLogic"

export class BasicGameLogic extends GameLogic {

  private chordCohesion: Map<number, NotedataEntry[]> = new Map
  private missNoteIndex: number = 0
  private holdProgress: HoldNotedataEntry[] = []
  private heldCols: ColHeldTracker = new ColHeldTracker()

  update(chartManager: ChartManager): void {
    if (!chartManager.chart || !chartManager.chartView) return
    let hitTime = chartManager.getTime() + Options.play.offset
    let hitWindowStart = hitTime - Options.play.timingCollection.maxWindowMS()/1000 * Options.audio.rate
    let lastChord = -1
    // Do Misses
    while (chartManager.chart.notedata[this.missNoteIndex] && chartManager.chart.notedata[this.missNoteIndex].second < hitWindowStart) {
      let note = chartManager.chart.notedata[this.missNoteIndex]
      if (note.beat != lastChord && note.type != "Mine" && !note.fake && !note.gameplay!.hasHit) {
        lastChord = note.beat
        chartManager.chartView.doJudgment(note, 0, Options.play.timingCollection.getMissJudgment())
        let chord = this.chordCohesion.get(note.beat)!
        chartManager.gameStats?.addDataPoint(chord, Options.play.timingCollection.getMissJudgment(), 0)
      }
      this.missNoteIndex++
    }

    //Do Holds/Rolls
    for (let hold of this.holdProgress) {
      if (!hold.hold || !hold.gameplay!.lastHoldActivation) continue
      if (this.heldCols.isPressed(hold.col) && hold.type == "Hold") hold.gameplay!.lastHoldActivation = Date.now()
      if (this.shouldDropHold(hold, Date.now())) {
        chartManager.chartView.doJudgment(hold, 0, Options.play.timingCollection.getDroppedJudgment())
        hold.gameplay!.droppedHoldBeat = chartManager.getBeat()
        this.holdProgress.splice(this.holdProgress.indexOf(hold), 1)
        chartManager.gameStats?.addHoldDataPoint(hold, Options.play.timingCollection.getDroppedJudgment())
        continue
      }
      if (roundDigit(chartManager.getBeat(),3) >= roundDigit(hold.beat + hold.hold!, 3)) {
        chartManager.chartView.doJudgment(hold, 0, Options.play.timingCollection.getHeldJudgement(hold))
        this.holdProgress.splice(this.holdProgress.indexOf(hold), 1)
        chartManager.gameStats?.addHoldDataPoint(hold, Options.play.timingCollection.getHeldJudgement(hold))
      }
    }

    //Do Mines
    for (let col of this.heldCols.getHeldCols()) { 
      let mine = this.getClosestNote(chartManager.chart.notedata, chartManager.getTime()-Options.play.timingCollection.getMineJudgment().getTimingWindowMS()/2000, col, ["Mine"], Options.play.timingCollection.getMineJudgment().getTimingWindowMS()/2)
      if (mine) {
        mine.gameplay!.hasHit = true
        mine.gameplay!.hideNote = true
        chartManager.chartView.doJudgment(mine, 0, Options.play.timingCollection.getMineJudgment())
        chartManager.gameStats?.addDataPoint([mine], Options.play.timingCollection.getMineJudgment(), 0)
        chartManager.mine.play()
      }
    }
  }

  reset(chartManager: ChartManager): void {
    if (!chartManager.chart) return
    this.chordCohesion.clear()
    for (let note of chartManager.chart.notedata) {
      if (note.type == "Mine" || note.fake) continue
      if (!this.chordCohesion.has(note.beat)) this.chordCohesion.set(note.beat, [])
      this.chordCohesion.get(note.beat)!.push(note)
    }
    let hitTime = chartManager.getTime() + Options.play.offset
    let hitWindowStart = hitTime - Options.play.timingCollection.maxWindowMS()/1000 * Options.audio.rate
    let firstHittableNote = bsearch(chartManager.chart.notedata, hitWindowStart, a => a.second) + 1
    if (firstHittableNote >= 1 && hitWindowStart <= chartManager.chart.notedata[firstHittableNote-1].second) firstHittableNote--
    this.missNoteIndex = firstHittableNote
    this.holdProgress = []
    this.heldCols.reset()
  }

  keyDown(chartManager: ChartManager, col: number): void {
    if (!chartManager.chart || !chartManager.chartView) return
    let hitTime = chartManager.getTime() + Options.play.offset
    let closestNote = this.getClosestNote(chartManager.chart.notedata, hitTime, col, ["Tap", "Hold", "Roll"])
    this.heldCols.keyDown(col)
    for (let hold of this.holdProgress) {
      if (hold.type == "Roll" && hold.col == col) hold.gameplay!.lastHoldActivation = Date.now()
    }
    if (closestNote) this.hitNote(chartManager, closestNote, hitTime)
    else chartManager.chartView.keyDown(col)
  }

  keyUp(chartManager: ChartManager, col: number): void {
    if (!chartManager.chart || !chartManager.chartView) return
    let hitTime = chartManager.getTime() + Options.play.offset
    let closestNote = this.getClosestNote(chartManager.chart.notedata, hitTime, col, ["Lift"])
    this.heldCols.keyUp(col)
    chartManager.chartView.keyUp(col)
    if (closestNote) this.hitNote(chartManager, closestNote, hitTime)
  }

  shouldAssistTick(note: NotedataEntry): boolean {
    return !note.fake && note.type != "Mine"
  }

  private hitNote(chartManager: ChartManager, note: NotedataEntry, hitTime: number) {
    note.gameplay!.hasHit = true
    if (isHoldNote(note)) {
      note.gameplay!.lastHoldActivation = Date.now()
      chartManager.chartView!.activateHold(note.col)
      this.holdProgress.push(note)
    }
    let chord = this.chordCohesion.get(note.beat)!
    if (chord.every(note => note.gameplay!.hasHit)) {
      let judge = Options.play.timingCollection.judgeInput((hitTime-note.second)/Options.audio.rate)
      let hideNote = Options.play.timingCollection.shouldHideNote(judge)
      chord.forEach(note => {
        chartManager.chartView!.doJudgment(note, hitTime-note.second, judge)
        if (hideNote && isTapNote(note)) note.gameplay!.hideNote = true
      })
      chartManager.gameStats?.addDataPoint(chord, judge, hitTime-note.second)
    }
  }

  private getClosestNote(notedata: Notedata, hitTime: number, col: number, types: string[], windowMS?: number): NotedataEntry | undefined {
    windowMS = windowMS ?? Options.play.timingCollection.maxWindowMS()
    windowMS *= Options.audio.rate
    let hitWindowStart = hitTime - windowMS/1000
    let hitWindowEnd = hitTime + windowMS/1000
    let firstHittableNote = bsearch(notedata, hitWindowStart, a => a.second) + 1
    if (firstHittableNote >= 1 && hitWindowStart <= notedata[firstHittableNote-1].second) firstHittableNote--
    let closestNote: NotedataEntry | undefined = undefined
    while (notedata[firstHittableNote] && notedata[firstHittableNote].second <= hitWindowEnd) {
      let note = notedata[firstHittableNote]
      if (note.gameplay!.hasHit || note.col != col || note.fake || !types.includes(note.type)) {
        firstHittableNote++
        continue
      }
      if (!closestNote || Math.abs(note.second-hitTime) < Math.abs(closestNote.second-hitTime)) {
        closestNote = note
      }
      firstHittableNote++
    }
    return closestNote
  }

  private shouldDropHold(note: HoldNotedataEntry, time: number): boolean {
    if (!note.gameplay?.lastHoldActivation) return false
    let window = Options.play.timingCollection.getHeldJudgement(note)
    if (!window) return false
    return (time - note.gameplay.lastHoldActivation) >= window.getTimingWindowMS()
  }

}