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

interface Tick {
  beat: number
  note: HoldNotedataEntry
  second: number
  hit: boolean
  hitAll: boolean
}

interface HoldTickData {
  ticks: Tick[]
  missIndex: number // index to check for miss
  hitIndex: number // index to check for pressed + grace window
  activeIndex: number // index to check for activating hold flash
}

export class PumpGameLogic extends BasicGameLogic {
  protected tickProgress = new Map<HoldNotedataEntry, HoldTickData>()
  protected tickCohesion: Map<number, number> = new Map()
  protected pendingTicks = new Map<number, Tick[]>()
  protected collection: TimingWindowCollection =
    TimingWindowCollection.getCollection("ITG")

  protected holdIndex = 0
  usesHoldTicks = true
  comboIsPerRow = false
  missComboIsPerRow = false

  update(chartManager: ChartManager): void {
    if (!chartManager.loadedChart || !chartManager.chartView) return
    const timingData = chartManager.loadedChart.timingData
    const beat = chartManager.chartView.getBeatWithOffset()
    const time = chartManager.chartView.getTimeWithOffset()
    const hitWindowStart =
      time - (this.collection.maxWindowMS() / 1000) * Options.audio.rate
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
        !isHoldNote(note) &&
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
      if (isHoldNote(note) && !note.fake) {
        const tickBeats = this.generateHoldTicks(timingData, note)
        const ticks = tickBeats.map(beat => ({
          beat,
          second: timingData.getSecondsFromBeat(beat),
          hit: false,
          hitAll: false,
          note,
        }))
        for (const tick of ticks) {
          if (!this.pendingTicks.has(tick.beat))
            this.pendingTicks.set(tick.beat, [])
          this.pendingTicks.get(tick.beat)?.push(tick)
        }
        this.tickProgress.set(note, {
          ticks,
          hitIndex: 0,
          missIndex: 0,
          activeIndex: 0,
        })
      }
      this.holdIndex++
    }

    // Do Holds/Rolls
    const holdGrace =
      (this.collection.getStandardWindows()[0].getTimingWindowMS() / 1000) *
      Options.audio.rate

    for (const [hold, data] of this.tickProgress.entries()) {
      // Hit ticks if pressed
      if (this.heldCols.isPressed(hold.col)) {
        while (
          data.ticks[data.hitIndex] &&
          data.ticks[data.hitIndex].second - holdGrace <= time
        ) {
          data.ticks[data.hitIndex].hit = true
          data.hitIndex++
        }
        if (beat < hold.beat + hold.hold) {
          if (hold.gameplay?.droppedHoldBeat !== undefined) {
            if (hold.type == "Hold")
              chartManager.chartView.getNotefield().activateHold(hold.col)
            else chartManager.chartView.getNotefield().activateRoll(hold.col)
          }
          hold.gameplay!.lastHoldActivation = Date.now()
          hold.gameplay!.droppedHoldBeat = undefined
        }
      } else {
        if (
          this.shouldDropHold(hold, Date.now()) &&
          beat < hold.beat + hold.hold &&
          hold.gameplay?.droppedHoldBeat == undefined
        ) {
          hold.gameplay!.droppedHoldBeat = beat
          if (hold.type == "Hold")
            chartManager.chartView.getNotefield().releaseHold(hold.col)
          else chartManager.chartView.getNotefield().releaseRoll(hold.col)
        }
      }

      if (data.ticks.length == 0) {
        if (beat > hold.beat + hold.hold) {
          hold.gameplay!.hideNote = true
          this.tickProgress.delete(hold)
        }
      } else {
        if (
          beat > hold.beat + hold.hold &&
          (data.ticks.at(-1)?.hitAll ||
            hold.gameplay!.droppedHoldBeat === undefined)
        ) {
          hold.gameplay!.hideNote = true
        }
        if (
          beat > hold.beat + hold.hold &&
          data.ticks.at(-1)!.second + holdGrace < time
        ) {
          this.tickProgress.delete(hold)
        }
      }
    }

    // Check ticks
    const tickList = Array.from(this.pendingTicks.entries()).sort(
      (a, b) => a[0] - b[0]
    )
    for (const [tickBeat, ticks] of tickList) {
      // Miss ticks that were not hit
      const hitAllTicks =
        ticks.filter(tick => tick.hit).length == this.tickCohesion.get(tickBeat)
      if (hitAllTicks && tickBeat <= beat) {
        ticks.forEach(tick => {
          chartManager.chartView!.doJudgement(
            tick.note,
            null,
            this.collection.getStandardWindows()[0]
          )
          tick.hitAll = true
        })

        chartManager.gameStats?.addDataPoint(
          ticks.map(tick => tick.note),
          this.collection.getStandardWindows()[0],
          null
        )
        this.pendingTicks.delete(tickBeat)
        continue
      } else if (ticks[0].second + holdGrace < time) {
        ticks.forEach(tick => {
          chartManager.chartView!.doJudgement(
            tick.note,
            null,
            this.collection.getMissJudgement()
          )
        })
        chartManager.gameStats?.addDataPoint(
          ticks.map(tick => tick.note),
          this.collection.getMissJudgement(),
          null
        )
        this.pendingTicks.delete(tickBeat)
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
    this.tickCohesion.clear()
    this.pendingTicks.clear()
    this.tickProgress.clear()
    for (const note of chartManager.loadedChart.getNotedata()) {
      if (note.type == "Mine" || note.fake) continue
      if (isHoldNote(note)) {
        const ticks = this.generateHoldTicks(
          chartManager.loadedChart.timingData,
          note
        )
        for (const tick of ticks) {
          if (!this.tickCohesion.has(tick)) this.tickCohesion.set(tick, 0)
          this.tickCohesion.set(tick, this.tickCohesion.get(tick)! + 1)
        }
        continue
      }
      if (note.warped) continue
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
    this.heldCols.reset()
  }

  keyDown(chartManager: ChartManager, col: number): void {
    if (!chartManager.loadedChart || !chartManager.chartView) return
    const hitTime = chartManager.chartView.getTimeWithOffset()
    const closestNote = this.getClosestNote(
      chartManager.loadedChart.getNotedata(),
      hitTime,
      col,
      ["Tap"]
    )
    this.heldCols.keyDown(col)
    chartManager.chartView.getNotefield().press(col)
    // for (const { hold } of this.tickProgress) {
    //   if (hold.type == "Roll" && hold.col == col) {
    //     hold.gameplay!.lastHoldActivation = Date.now()
    //     hold.gameplay!.droppedHoldBeat = undefined
    //     chartManager.chartView.getNotefield().activateRoll(hold.col)
    //   }
    // }
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
    const ticks = []
    if ((tickCounts[tickIndex]?.value ?? 4) != 0) ticks.push(currentTick)
    else currentTick = hold.beat
    while (currentTick < getNoteEnd(hold)) {
      if (
        (tickCounts[tickIndex]?.value ?? 4) == 0 ||
        tickCounts[tickIndex + 1]?.beat <= currentTick + tickLength
      ) {
        tickIndex += 1
        currentTick = tickCounts[tickIndex].beat
        tickLength = 1 / tickCounts[tickIndex].value
        if (currentTick === undefined) {
          return ticks.filter(
            tick => tick <= getNoteEnd(hold) && !timingData.isBeatWarped(tick)
          )
        }
      } else {
        currentTick += tickLength
      }
      if (
        (tickCounts[tickIndex]?.value ?? 4) != 0 &&
        ticks.at(-1) != currentTick
      )
        ticks.push(currentTick)
    }
    return ticks.filter(
      tick => tick <= getNoteEnd(hold) && !timingData.isBeatWarped(tick)
    )
  }

  calculateMaxDP(notedata: Notedata, timingData: TimingData): number {
    const chordCohesion: Map<number, NotedataEntry[]> = new Map()
    const tickCohesion: Map<number, number> = new Map()
    let maxDancePoints = 0
    for (const note of notedata) {
      if (note.type == "Mine" || note.fake) continue
      if (isHoldNote(note)) {
        const holdTicks = this.generateHoldTicks(timingData, note)
        for (const tick of holdTicks) {
          if (!tickCohesion.has(tick)) tickCohesion.set(tick, 0)
          tickCohesion.set(tick, tickCohesion.get(tick)! + 1)
        }
        continue
      }
      if (note.warped) continue
      if (!chordCohesion.has(note.beat)) chordCohesion.set(note.beat, [])
      chordCohesion.get(note.beat)!.push(note)
    }
    maxDancePoints +=
      chordCohesion.size *
      TimingWindowCollection.getCollection(
        Options.play.timingCollection
      ).getMaxDancePoints()
    maxDancePoints +=
      tickCohesion.size *
      TimingWindowCollection.getCollection(
        Options.play.timingCollection
      ).getMaxDancePoints()
    return maxDancePoints
  }
}
