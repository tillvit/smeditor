// Generates foot parity given notedata
// Original algorithm by Jewel, polished by tillvit

import { App } from "../App"
import {
  HoldNotedataEntry,
  Notedata,
  NotedataEntry,
  isHoldNote,
} from "../chart/sm/NoteTypes"

const LAYOUT: Record<string, Point[]> = {
  "dance-single": [
    { x: -1, y: 0 },
    { x: 0, y: -1 },
    { x: 0, y: 1 },
    { x: 1, y: 0 },
  ],
}

const WEIGHTS = {
  DOUBLESTEP: 850,
  BRACKETJACK: 20,
  JACK: 30,
  JUMP: 30,
  BRACKETTAP: 400,
  HOLDSWITCH: 20,
  MINE: 10000,
  FOOTSWITCH: 5000,
  MISSED_FOOTSWITCH: 500,
  FACING: 2,
  DISTANCE: 6,
  SPIN: 1000,
  SIDESWITCH: 130,
}

interface Point {
  x: number
  y: number
}

enum Foot {
  NONE,
  LEFT_HEEL,
  LEFT_TOE,
  RIGHT_HEEL,
  RIGHT_TOE,
}

const FEET = [Foot.LEFT_HEEL, Foot.LEFT_TOE, Foot.RIGHT_HEEL, Foot.RIGHT_TOE]
const FEET_LABEL = "LlRr"

interface Action {
  head?: Action
  parent?: Action
  initialState: State
  resultState: State
  cost: number
}

interface State {
  columns: Foot[]
  movedFeet: Set<Foot>
  holdFeet: Set<Foot>
  second: number
}

interface Row {
  notes: (NotedataEntry | undefined)[]
  holds: (HoldNotedataEntry | undefined)[]
  holdTails: Set<number>
  mines: (number | undefined)[]
  fakeMines: (number | undefined)[]
  second: number
}

export class ParityGenerator {
  private readonly app

  private costCache: Map<string, number>[] = []
  private cacheCounter = 0
  private exploreCounter = 0

  private stop = false

  private readonly layout

  private SEARCH_DEPTH = 16
  private SEARCH_BREADTH = 30

  constructor(app: App, type: string) {
    this.app = app
    this.layout = LAYOUT[type]
  }

  help() {
    console.log(`Currently only compatible with dance-single.
Available commands: 
analyze(options): analyze the current chart
  options: {
    log = false: do logging with intermediate steps
    delay = 0: delay in ms between each row (set to 0 for instant)
    searchDepth = 16: number of lookahead rows
    searchBreadth = 30: number of candidates kept at each lookahead step
  }
  leave options blank for default
stopAnalyzing(): stop analysis in case something goes wrong
clear(): clear parity highlights`)
  }

  getActionCost(action: Action, rows: Row[], rowIndex: number) {
    const row = rows[rowIndex]
    const elapsedTime = action.resultState.second - action.initialState.second
    let cost = 0

    const combinedColumns: Foot[] = new Array(
      action.resultState.columns.length
    ).fill(Foot.NONE)

    // Merge initial + result position
    for (let i = 0; i < action.resultState.columns.length; i++) {
      // copy in data from b over the top which overrides it, as long as it's not nothing
      if (action.resultState.columns[i] != Foot.NONE) {
        combinedColumns[i] = action.resultState.columns[i]
        continue
      }

      // copy in data from a first, if it wasn't moved
      if (
        action.initialState.columns[i] == Foot.LEFT_HEEL ||
        action.initialState.columns[i] == Foot.RIGHT_HEEL
      ) {
        if (!action.resultState.movedFeet.has(action.initialState.columns[i])) {
          combinedColumns[i] = action.initialState.columns[i]
        }
      } else if (action.initialState.columns[i] == Foot.LEFT_TOE) {
        if (
          !action.resultState.movedFeet.has(Foot.LEFT_TOE) &&
          !action.resultState.movedFeet.has(Foot.LEFT_HEEL)
        ) {
          combinedColumns[i] = action.initialState.columns[i]
        }
      } else if (action.initialState.columns[i] == Foot.RIGHT_TOE) {
        if (
          !action.resultState.movedFeet.has(Foot.RIGHT_TOE) &&
          !action.resultState.movedFeet.has(Foot.RIGHT_HEEL)
        ) {
          combinedColumns[i] = action.initialState.columns[i]
        }
      }
    }

    const cacheKey = action.initialState.columns
      .concat(action.resultState.columns)
      .concat([...action.initialState.movedFeet.values()])
      .join("|")
    const cachedCost = this.costCache[rowIndex]?.get(cacheKey)
    if (cachedCost !== undefined) {
      this.cacheCounter++
      action.resultState.columns = combinedColumns
      action.cost = cachedCost

      return
    }

    // Mine weighting
    let [leftHeel, leftToe, rightHeel, rightToe] = new Array(4).fill(-1)
    for (let i = 0; i < action.resultState.columns.length; i++) {
      switch (action.resultState.columns[i]) {
        case Foot.NONE:
          break
        case Foot.LEFT_HEEL:
          leftHeel = i
          break
        case Foot.LEFT_TOE:
          leftToe = i
          break
        case Foot.RIGHT_HEEL:
          rightHeel = i
          break
        case Foot.RIGHT_TOE:
          rightToe = i
          break
      }
      if (combinedColumns[i] != Foot.NONE && row.mines[i] !== undefined) {
        cost += WEIGHTS.MINE
        break
      }
    }

    for (let c = 0; c < row.holds.length; c++) {
      if (row.holds[c] === undefined) continue
      if (
        ((combinedColumns[c] == Foot.LEFT_HEEL ||
          combinedColumns[c] == Foot.LEFT_TOE) &&
          action.initialState.columns[c] != Foot.LEFT_TOE &&
          action.initialState.columns[c] != Foot.LEFT_HEEL) ||
        ((combinedColumns[c] == Foot.RIGHT_HEEL ||
          combinedColumns[c] == Foot.RIGHT_TOE) &&
          action.initialState.columns[c] != Foot.RIGHT_TOE &&
          action.initialState.columns[c] != Foot.RIGHT_HEEL)
      ) {
        const previousFoot = action.initialState.columns.indexOf(
          combinedColumns[c]
        )
        cost +=
          WEIGHTS.HOLDSWITCH *
          (previousFoot == -1
            ? 1
            : Math.sqrt(
                this.getDistanceSq(this.layout[c], this.layout[previousFoot])
              ))
      }
    }

    // Small penalty for trying to jack a bracket during a hold
    if (leftHeel != -1 && leftToe != -1) {
      let jackPenalty = 1
      if (
        action.initialState.movedFeet.has(Foot.LEFT_HEEL) ||
        action.initialState.movedFeet.has(Foot.LEFT_TOE)
      )
        jackPenalty = 1 / elapsedTime
      if (
        row.holds[leftHeel] !== undefined &&
        row.holds[leftToe] === undefined
      ) {
        cost += WEIGHTS.BRACKETTAP * jackPenalty
      }
      if (
        row.holds[leftToe] !== undefined &&
        row.holds[leftHeel] === undefined
      ) {
        cost += WEIGHTS.BRACKETTAP * jackPenalty
      }
    }

    if (rightHeel != -1 && rightToe != -1) {
      let jackPenalty = 1
      if (
        action.initialState.movedFeet.has(Foot.RIGHT_TOE) ||
        action.initialState.movedFeet.has(Foot.RIGHT_HEEL)
      )
        jackPenalty = 1 / elapsedTime

      if (
        row.holds[rightHeel] !== undefined &&
        row.holds[rightToe] === undefined
      ) {
        cost += WEIGHTS.BRACKETTAP * jackPenalty
      }
      if (
        row.holds[rightToe] !== undefined &&
        row.holds[rightHeel] === undefined
      ) {
        cost += WEIGHTS.BRACKETTAP * jackPenalty
      }
    }

    // Weighting for moving a foot while the other isn't on the pad (so marked doublesteps are less bad than this)
    if (action.initialState.columns.some(x => x != Foot.NONE)) {
      for (const f of action.resultState.movedFeet) {
        switch (f) {
          case Foot.LEFT_HEEL:
          case Foot.LEFT_TOE:
            if (
              !(
                action.initialState.columns.includes(Foot.RIGHT_HEEL) ||
                action.initialState.columns.includes(Foot.RIGHT_TOE)
              )
            )
              cost += 500
            break
          case Foot.RIGHT_HEEL:
          case Foot.RIGHT_TOE:
            if (
              !(
                action.initialState.columns.includes(Foot.LEFT_HEEL) ||
                action.initialState.columns.includes(Foot.RIGHT_TOE)
              )
            )
              cost += 500
            break
        }
      }
    }

    const movedLeft =
      action.resultState.movedFeet.has(Foot.LEFT_HEEL) ||
      action.resultState.movedFeet.has(Foot.LEFT_TOE)
    const movedRight =
      action.resultState.movedFeet.has(Foot.RIGHT_HEEL) ||
      action.resultState.movedFeet.has(Foot.RIGHT_TOE)

    const didJump =
      ((action.initialState.movedFeet.has(Foot.LEFT_HEEL) &&
        !action.initialState.holdFeet.has(Foot.LEFT_HEEL)) ||
        (action.initialState.movedFeet.has(Foot.LEFT_TOE) &&
          !action.initialState.holdFeet.has(Foot.LEFT_TOE))) &&
      ((action.initialState.movedFeet.has(Foot.RIGHT_HEEL) &&
        !action.initialState.holdFeet.has(Foot.RIGHT_HEEL)) ||
        (action.initialState.movedFeet.has(Foot.RIGHT_TOE) &&
          !action.initialState.holdFeet.has(Foot.RIGHT_TOE)))

    // jacks don't matter if you did a jump before

    let jackedLeft = false
    let jackedRight = false

    if (!didJump) {
      if (leftHeel != -1 && movedLeft) {
        if (
          action.initialState.columns[leftHeel] == Foot.LEFT_HEEL &&
          !action.resultState.holdFeet.has(Foot.LEFT_HEEL) &&
          ((action.initialState.movedFeet.has(Foot.LEFT_HEEL) &&
            !action.initialState.holdFeet.has(Foot.LEFT_HEEL)) ||
            (action.initialState.movedFeet.has(Foot.LEFT_TOE) &&
              !action.initialState.holdFeet.has(Foot.LEFT_TOE)))
        )
          jackedLeft = true
        if (
          action.initialState.columns[leftToe] == Foot.LEFT_TOE &&
          !action.resultState.holdFeet.has(Foot.LEFT_TOE) &&
          ((action.initialState.movedFeet.has(Foot.LEFT_HEEL) &&
            !action.initialState.holdFeet.has(Foot.LEFT_HEEL)) ||
            (action.initialState.movedFeet.has(Foot.LEFT_TOE) &&
              !action.initialState.holdFeet.has(Foot.LEFT_TOE)))
        )
          jackedLeft = true
      }

      if (rightHeel != -1 && movedRight) {
        if (
          action.initialState.columns[rightHeel] == Foot.RIGHT_HEEL &&
          !action.resultState.holdFeet.has(Foot.RIGHT_HEEL) &&
          ((action.initialState.movedFeet.has(Foot.RIGHT_HEEL) &&
            !action.initialState.holdFeet.has(Foot.RIGHT_HEEL)) ||
            (action.initialState.movedFeet.has(Foot.RIGHT_TOE) &&
              !action.initialState.holdFeet.has(Foot.RIGHT_TOE)))
        )
          jackedRight = true
        if (
          action.initialState.columns[rightToe] == Foot.RIGHT_TOE &&
          !action.resultState.holdFeet.has(Foot.RIGHT_TOE) &&
          ((action.initialState.movedFeet.has(Foot.RIGHT_HEEL) &&
            !action.initialState.holdFeet.has(Foot.RIGHT_HEEL)) ||
            (action.initialState.movedFeet.has(Foot.RIGHT_TOE) &&
              !action.initialState.holdFeet.has(Foot.RIGHT_TOE)))
        )
          jackedRight = true
      }
    }

    // Doublestep weighting doesn't apply if you just did a jump or a jack

    if (
      movedLeft != movedRight &&
      (movedLeft || movedRight) &&
      action.resultState.holdFeet.size == 0 &&
      !didJump
    ) {
      let doublestepped = false

      if (
        movedLeft &&
        !jackedLeft &&
        ((action.initialState.movedFeet.has(Foot.LEFT_HEEL) &&
          !action.initialState.holdFeet.has(Foot.LEFT_HEEL)) ||
          (action.initialState.movedFeet.has(Foot.LEFT_TOE) &&
            !action.initialState.holdFeet.has(Foot.LEFT_TOE)))
      ) {
        doublestepped = true
      }
      if (
        movedRight &&
        !jackedRight &&
        ((action.initialState.movedFeet.has(Foot.RIGHT_HEEL) &&
          !action.initialState.holdFeet.has(Foot.RIGHT_HEEL)) ||
          (action.initialState.movedFeet.has(Foot.RIGHT_TOE) &&
            !action.initialState.holdFeet.has(Foot.RIGHT_TOE)))
      )
        doublestepped = true

      const lastRow = rows[rowIndex - 1]
      if (lastRow !== undefined) {
        for (const hold of lastRow.holds) {
          if (hold === undefined) continue
          const endBeat =
            this.app.chartManager.loadedChart!.timingData.getBeatFromSeconds(
              row.second
            )
          const startBeat =
            this.app.chartManager.loadedChart!.timingData.getBeatFromSeconds(
              lastRow.second
            )
          // if a hold tail extends past the last row & ends in between, we can doublestep
          if (
            hold.beat + hold.hold > startBeat &&
            hold.beat + hold.hold < endBeat
          )
            doublestepped = false
          // if the hold tail extends past this row, we can doublestep
          if (hold.beat + hold.hold >= endBeat) doublestepped = false
        }
      }

      // Jack detection is wrong, it's detecting a jack even if another foot moved after it
      /*if ((jackedLeft || jackedRight) && row_distance <= 12) {
					if (DoLogging||true) Console.WriteLine("[{0}->{1}] Penalty of 1000 for a fast jack given to {2} -> {3} with distance {4}", a.row, b.row, Stringify(a.panels), Stringify(newMovement.placement.panels), row_distance);
					newMovement.weighting += 1000;
				}*/

      if (doublestepped) {
        cost += WEIGHTS.DOUBLESTEP
      }

      if (
        jackedLeft &&
        action.resultState.movedFeet.has(Foot.LEFT_HEEL) &&
        action.resultState.movedFeet.has(Foot.LEFT_TOE)
      ) {
        cost += WEIGHTS.BRACKETJACK
      }

      if (
        jackedRight &&
        action.resultState.movedFeet.has(Foot.RIGHT_HEEL) &&
        action.resultState.movedFeet.has(Foot.RIGHT_TOE)
      ) {
        cost += WEIGHTS.BRACKETJACK
      }
    }

    if (
      movedLeft &&
      movedRight &&
      row.notes.filter(note => note !== undefined).length >= 2
    ) {
      cost += WEIGHTS.JUMP / elapsedTime
    }

    let endLeftHeel = -1
    let endLeftToe = -1
    let endRightHeel = -1
    let endRightToe = -1

    for (let i = 0; i < combinedColumns.length; i++) {
      switch (combinedColumns[i]) {
        case Foot.NONE:
          break
        case Foot.LEFT_HEEL:
          endLeftHeel = i
          break
        case Foot.LEFT_TOE:
          endLeftToe = i
          break
        case Foot.RIGHT_HEEL:
          endRightHeel = i
          break
        case Foot.RIGHT_TOE:
          endRightToe = i
          break
      }
    }

    if (endLeftToe == -1) endLeftToe = endLeftHeel
    if (endRightToe == -1) endRightToe = endRightHeel

    // facing backwards gives a bit of bad weight (scaled heavily the further back you angle, so crossovers aren't Too bad; less bad than doublesteps)
    const heelFacing =
      endLeftHeel != -1 && endRightHeel != -1
        ? this.getXDifference(endLeftHeel, endRightHeel)
        : 0
    const toeFacing =
      endLeftToe != -1 && endRightToe != -1
        ? this.getXDifference(endLeftToe, endRightToe)
        : 0
    const leftFacing =
      endLeftHeel != -1 && endLeftToe != -1
        ? this.getYDifference(endLeftHeel, endLeftToe)
        : 0
    const rightFacing =
      endRightHeel != -1 && endRightToe != -1
        ? this.getYDifference(endRightHeel, endRightToe)
        : 0
    const heelFacingPenalty = Math.pow(-Math.min(heelFacing, 0), 1.8) * 100
    const toesFacingPenalty = Math.pow(-Math.min(toeFacing, 0), 1.8) * 100
    const leftFacingPenalty = Math.pow(-Math.min(leftFacing, 0), 1.8) * 100
    const rightFacingPenalty = Math.pow(-Math.min(rightFacing, 0), 1.8) * 100

    if (heelFacingPenalty > 0) cost += heelFacingPenalty * WEIGHTS.FACING
    if (toesFacingPenalty > 0) cost += toesFacingPenalty * WEIGHTS.FACING
    if (leftFacingPenalty > 0) cost += leftFacingPenalty * WEIGHTS.FACING
    if (rightFacingPenalty > 0) cost += rightFacingPenalty * WEIGHTS.FACING

    // spin
    const previousLeftPos = this.averagePoint(
      action.initialState.columns.indexOf(Foot.LEFT_HEEL),
      action.initialState.columns.indexOf(Foot.LEFT_TOE)
    )
    const previousRightPos = this.averagePoint(
      action.initialState.columns.indexOf(Foot.RIGHT_HEEL),
      action.initialState.columns.indexOf(Foot.RIGHT_TOE)
    )
    const leftPos = this.averagePoint(endLeftHeel, endLeftToe)
    const rightPos = this.averagePoint(endRightHeel, endRightToe)

    if (
      rightPos.x < leftPos.x &&
      previousRightPos.x < previousLeftPos.x &&
      rightPos.y < leftPos.y &&
      previousRightPos.y > previousLeftPos.y
    ) {
      cost += WEIGHTS.SPIN
    }
    if (
      rightPos.x < leftPos.x &&
      previousRightPos.x < previousLeftPos.x &&
      rightPos.y > leftPos.y &&
      previousRightPos.y < previousLeftPos.y
    ) {
      cost += WEIGHTS.SPIN
    }

    // if (
    //   leftPos.y < rightPos.y &&
    //   previousLeftPos.y < previousRightPos.y &&
    //   rightPos.x > leftPos.x &&
    //   previousRightPos.x < previousLeftPos.x
    // ) {
    //   cost += WEIGHTS.SPIN
    // }

    // Footswitch penalty

    // ignore footswitch with 24 or less distance (8th note); penalise slower footswitches based on distance
    if (elapsedTime >= 0.25) {
      // footswitching has no penalty if there's a mine nearby
      if (
        !row.mines.some(x => x !== undefined) &&
        !row.fakeMines.some(x => x !== undefined)
      ) {
        const timeScaled = elapsedTime - 0.25

        for (let i = 0; i < combinedColumns.length; i++) {
          if (
            action.initialState.columns[i] == Foot.NONE ||
            action.resultState.columns[i] == Foot.NONE
          )
            continue

          if (
            action.initialState.columns[i] != action.resultState.columns[i] &&
            !action.resultState.movedFeet.has(action.initialState.columns[i])
          ) {
            cost += Math.pow(timeScaled / 2.0, 2) * WEIGHTS.FOOTSWITCH
            break
          }
        }
      }
    }

    if (
      action.initialState.columns[0] != action.resultState.columns[0] &&
      action.resultState.columns[0] != Foot.NONE &&
      action.initialState.columns[0] != Foot.NONE &&
      !action.resultState.movedFeet.has(action.initialState.columns[0])
    ) {
      cost += WEIGHTS.SIDESWITCH
    }

    if (
      action.initialState.columns[3] != action.resultState.columns[3] &&
      action.resultState.columns[3] != Foot.NONE &&
      action.initialState.columns[3] != Foot.NONE &&
      !action.resultState.movedFeet.has(action.initialState.columns[3])
    ) {
      cost += WEIGHTS.SIDESWITCH
    }

    // add penalty if jacked

    if (
      (jackedLeft || jackedRight) &&
      (row.mines.some(x => x !== undefined) ||
        row.fakeMines.some(x => x !== undefined))
    ) {
      cost += WEIGHTS.MISSED_FOOTSWITCH
    }

    // To do: small weighting for swapping heel with toe or toe with heel (both add up)

    // To do: huge weighting for having foot direction opposite of eachother (can't twist one leg 180 degrees)

    // weighting for jacking two notes too close to eachother
    if (elapsedTime <= 0.15 && movedLeft != movedRight) {
      const timeScaled = 0.15 - elapsedTime
      if (jackedLeft || jackedRight) {
        cost += (1 / timeScaled - 1 / 0.15) * WEIGHTS.JACK
      }
    }

    // To do: weighting for moving a foot a far distance in a fast time
    for (const foot of action.resultState.movedFeet) {
      const idxFoot = action.initialState.columns.indexOf(foot)
      if (idxFoot == -1) continue
      cost +=
        (Math.sqrt(
          this.getDistanceSq(
            this.layout[idxFoot],
            this.layout[action.resultState.columns.indexOf(foot)]
          )
        ) *
          WEIGHTS.DISTANCE) /
        elapsedTime
    }

    action.cost = cost
    action.resultState.columns = combinedColumns

    if (this.costCache[rowIndex] === undefined)
      this.costCache[rowIndex] = new Map()
    this.exploreCounter++
    this.costCache[rowIndex].set(cacheKey, cost)
  }

  getPossibleActions(
    initialState: State,
    rows: Row[],
    rowIndex: number
  ): Action[] {
    const row = rows[rowIndex]
    return this.permuteColumn(row, new Array(4).fill(Foot.NONE), 0).map(
      columns => {
        const action = {
          initialState,
          resultState: {
            columns,
            movedFeet: new Set(
              columns.filter((foot, idx) => {
                if (foot === Foot.NONE) return false
                if (!row.holds[idx]) return true
                return initialState.columns[idx] != foot
              })
            ),
            holdFeet: new Set(
              columns.filter((foot, idx) => {
                if (foot === Foot.NONE) return false
                return row.holds[idx] !== undefined
              })
            ),
            second: row.second,
          },
          cost: 0,
        }
        this.getActionCost(action, rows, rowIndex)
        return action
      }
    )
  }

  permuteColumn(row: Row, columns: Foot[], column: number): Foot[][] {
    if (column >= columns.length) {
      let leftHeelIndex = -1
      let leftToeIndex = -1
      let rightHeelIndex = -1
      let rightToeIndex = -1
      for (let i = 0; i < columns.length; i++) {
        if (columns[i] == Foot.NONE) continue
        if (columns[i] == Foot.LEFT_HEEL) leftHeelIndex = i
        if (columns[i] == Foot.LEFT_TOE) leftToeIndex = i
        if (columns[i] == Foot.RIGHT_HEEL) rightHeelIndex = i
        if (columns[i] == Foot.RIGHT_TOE) rightToeIndex = i
      }
      if (
        (leftHeelIndex == -1 && leftToeIndex != -1) ||
        (rightHeelIndex == -1 && rightToeIndex != -1)
      ) {
        return []
      }
      if (leftHeelIndex != -1 && leftToeIndex != -1) {
        if (!this.bracketCheck(leftHeelIndex, leftToeIndex)) return []
      }
      if (rightHeelIndex != -1 && rightToeIndex != -1) {
        if (!this.bracketCheck(rightHeelIndex, rightToeIndex)) return []
      }
      return [columns]
    }
    const permutations = []
    if (row.notes[column] !== undefined || row.holds[column] !== undefined) {
      for (const foot of FEET) {
        if (columns.includes(foot)) continue
        const newColumns = [...columns]
        newColumns[column] = foot
        permutations.push(...this.permuteColumn(row, newColumns, column + 1))
      }
      return permutations
    }
    return this.permuteColumn(row, columns, column + 1)
  }

  createRows(notedata: Notedata) {
    let activeHolds: (HoldNotedataEntry | undefined)[] = []
    let lastColumnSecond: number | null = null
    let notes: NotedataEntry[] = []
    let mines: (number | undefined)[] = []
    let fakeMines: (number | undefined)[] = []
    let nextMines: (number | undefined)[] = []
    let nextFakeMines: (number | undefined)[] = []
    const rows: Row[] = []
    for (const note of notedata) {
      if (note.type == "Mine") {
        if (note.second == lastColumnSecond && rows.length > 0) {
          if (note.fake) {
            nextFakeMines[note.col] = note.second
          } else {
            nextMines[note.col] = note.second
          }
        } else {
          if (note.fake) {
            fakeMines[note.col] = note.second
          } else {
            mines[note.col] = note.second
          }
        }
        continue
      }
      if (note.fake) continue
      if (lastColumnSecond != note.second) {
        if (lastColumnSecond != null) {
          rows.push({
            notes,
            holds: activeHolds.map(hold => {
              if (hold === undefined || hold.second >= lastColumnSecond!)
                return undefined
              return hold
            }),
            holdTails: new Set(
              activeHolds
                .filter(hold => {
                  if (hold === undefined) return false
                  if (
                    Math.abs(
                      hold.beat +
                        hold.hold -
                        this.app.chartManager.loadedChart!.timingData.getBeatFromSeconds(
                          lastColumnSecond!
                        )
                    ) > 0.0005
                  ) {
                    return false
                  }
                  return true
                })
                .map(hold => hold!.col)
            ),
            mines: nextMines,
            fakeMines: nextFakeMines,
            second: lastColumnSecond,
          })
        }
        lastColumnSecond = note.second
        notes = []
        nextMines = mines
        nextFakeMines = fakeMines
        mines = []
        fakeMines = []
        activeHolds = activeHolds.map(hold => {
          if (hold === undefined || note.beat > hold.beat + hold.hold)
            return undefined
          return hold
        })
      }
      notes[note.col] = note
      if (isHoldNote(note)) {
        activeHolds[note.col] = note
      }
    }
    rows.push({
      notes,
      holds: activeHolds.map(hold => {
        if (hold === undefined || hold.second >= lastColumnSecond!)
          return undefined
        return hold
      }),
      holdTails: new Set(
        activeHolds
          .filter(hold => {
            if (hold === undefined) return false
            if (
              Math.abs(
                hold.beat +
                  hold.hold -
                  this.app.chartManager.loadedChart!.timingData.getBeatFromSeconds(
                    lastColumnSecond!
                  )
              ) > 0.0005
            ) {
              return false
            }
            return true
          })
          .map(hold => hold!.col)
      ),
      mines: nextMines,
      fakeMines: nextFakeMines,
      second: lastColumnSecond!,
    })
    return rows
  }

  analyze(
    options: {
      log?: boolean
      delay?: number
      searchDepth?: number
      searchBreadth?: number
    } = {}
  ) {
    const {
      log = false,
      delay = 0,
      searchBreadth = 30,
      searchDepth = 16,
    } = options
    this.SEARCH_BREADTH = searchBreadth
    this.SEARCH_DEPTH = searchDepth
    if (log) console.time("Analyze")
    let state: State = {
      columns: [0, 0, 0, 0],
      movedFeet: new Set(),
      holdFeet: new Set(),
      second: -1,
    }
    this.costCache = []
    this.cacheCounter = 0
    this.exploreCounter = 0
    const notedata = this.app.chartManager.loadedChart?.getNotedata()
    if (!notedata) return
    const rows = this.createRows(notedata)
    let i = 0
    this.stop = false
    if (delay == 0) {
      while (i != rows.length && !this.stop) {
        const bestActions = this.getBestMoveLookahead(state, rows, i)
        const bestAction = bestActions[0].head ?? bestActions[0]
        if (log) console.log(i, bestActions, rows[i].second)

        for (let j = 0; j < bestAction.resultState.columns.length; j++) {
          if (rows[i].notes[j] !== undefined)
            rows[i].notes[j]!.parity =
              FEET_LABEL[FEET.indexOf(bestAction.resultState.columns[j])]
        }
        delete this.costCache[i]
        i++
        state = bestAction.resultState
      }
      if (log) {
        console.log(
          "Explored nodes:",
          this.exploreCounter,
          "Cached nodes:",
          this.cacheCounter
        )
        console.timeEnd("Analyze")
      }
    } else {
      const run = () => {
        const bestActions = this.getBestMoveLookahead(state, rows, i)
        const bestAction = bestActions[0].head ?? bestActions[0]
        if (log) console.log(i, bestActions, rows[i].second)
        for (let j = 0; j < bestAction.resultState.columns.length; j++) {
          if (rows[i].notes[j] !== undefined)
            rows[i].notes[j]!.parity =
              FEET_LABEL[FEET.indexOf(bestAction.resultState.columns[j])]
        }
        delete this.costCache[i]
        i++
        state = bestAction.resultState
        if (i == rows.length || this.stop) {
          if (log) {
            console.log(
              "Explored nodes:",
              this.exploreCounter,
              "Cached nodes:",
              this.cacheCounter
            )
            console.timeEnd("Analyze")
          }
          return
        }
        setTimeout(run, delay)
      }
      run()
    }
  }

  getBestMoveLookahead(state: State, rows: Row[], rowIndex: number) {
    let actions = this.getPossibleActions(state, rows, rowIndex).sort(
      (a, b) => a.cost - b.cost
    )
    for (let i = 1; i < this.SEARCH_DEPTH; i++) {
      if (rows[i + rowIndex] === undefined) break
      actions = actions
        .flatMap(action => {
          const results = this.getPossibleActions(
            action.resultState,
            rows,
            rowIndex + i
          )
          results.forEach(result => {
            result.cost = result.cost * Math.pow(0.95, i) + action.cost
            result.head = action.head ?? action
            result.parent = action
          })
          return results
        })
        .sort((a, b) => a.cost - b.cost)
        .slice(0, this.SEARCH_BREADTH)
    }
    return actions
  }

  bracketCheck(column1: number, column2: number) {
    const p1 = this.layout[column1]
    const p2 = this.layout[column2]
    return this.getDistanceSq(p1, p2) <= 2
  }

  getDistanceSq(p1: Point, p2: Point) {
    return (p1.y - p2.y) * (p1.y - p2.y) + (p1.x - p2.x) * (p1.x - p2.x)
  }

  getPosition(cols: number[]) {
    if (cols.length == 0) return undefined
    if (cols.length == 1) return this.layout[cols[0]]
    const p1 = this.layout[cols[0]]
    const p2 = this.layout[cols[1]]
    return { x: (p1.x + p2.x) / 2, y: (p1.y + p2.y) / 2 }
  }

  getPlayerAngle(left: Point, right: Point) {
    const x1 = right.x - left.x
    const y1 = right.y - left.y
    const x2 = 1
    const y2 = 0
    const dot = x1 * x2 + y1 * y2
    const det = x1 * y2 - y1 * x2
    return Math.atan2(det, dot)
  }

  compareCols(a: number[], b: number[]) {
    if (a === b) return true
    if (a == null || b == null) return false
    if (a.length !== b.length) return false

    for (let i = 0; i < a.length; ++i) {
      if (a[i] !== b[i]) return false
    }
    return true
  }

  getXDifference(leftIndex: number, rightIndex: number) {
    if (leftIndex == rightIndex) return 0
    let dx = this.layout[rightIndex].x - this.layout[leftIndex].x
    const dy = this.layout[rightIndex].y - this.layout[leftIndex].y

    const distance = Math.sqrt(dx * dx + dy * dy)
    dx /= distance

    const negative = dx <= 0

    dx = Math.pow(dx, 4)

    if (negative) dx = -dx

    return dx
  }

  getYDifference(leftIndex: number, rightIndex: number) {
    if (leftIndex == rightIndex) return 0
    const dx = this.layout[rightIndex].x - this.layout[leftIndex].x
    let dy = this.layout[rightIndex].y - this.layout[leftIndex].y

    const distance = Math.sqrt(dx * dx + dy * dy)
    dy /= distance

    const negative = dy <= 0

    dy = Math.pow(dy, 4)

    if (negative) dy = -dy

    return dy
  }

  averagePoint(leftIndex: number, rightIndex: number) {
    if (leftIndex == -1 && rightIndex == -1) return { x: 0, y: 0 }
    if (leftIndex == -1) return this.layout[rightIndex]
    if (rightIndex == -1) return this.layout[leftIndex]
    return {
      x: (this.layout[leftIndex].x + this.layout[rightIndex].x) / 2,
      y: (this.layout[leftIndex].y + this.layout[rightIndex].y) / 2,
    }
  }

  stopAnalyzing() {
    this.stop = true
  }

  clear() {
    const notedata = this.app.chartManager.loadedChart?.getNotedata()
    if (!notedata) return
    notedata.forEach(note => (note.parity = undefined))
  }
}
