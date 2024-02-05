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
  rowIndex: number
}

interface Row {
  notes: (NotedataEntry | undefined)[]
  holds: (HoldNotedataEntry | undefined)[]
  holdTails: Set<number>
  mines: (number | undefined)[]
  fakeMines: (number | undefined)[]
  second: number
  cost: number
  selectedAction?: Action
}

class StepParityNode {
  id: number = 0
  neighbors: Map<number, number> = new Map()
  state: State

  constructor(state: State, id: number) {
    this.state = state
    this.id = id
  }
}

class StepParityGraph {
  nodes: Array<StepParityNode> = []
  states: Array<State> = []

  startNode: number = 0
  endNode: number = 0
  // A nested map to keep track of states and associated nodes
  // first key is row number,
  // second key is index of state
  // resulting value is index of node
  stateNodeMap: Map<number, Map<number, number>> = new Map()

  addOrGetExistingNode(state: State): StepParityNode {
    if (this.stateNodeMap.get(state.rowIndex) == undefined) {
      this.stateNodeMap.set(state.rowIndex, new Map<number, number>())
    }

    for (const [stateIdx, nodeIdx] of this.stateNodeMap.get(state.rowIndex)!) {
      if (compareStates(state, this.states[stateIdx])) {
        return this.nodes[nodeIdx]
      }
    }
    const stateIdx = this.states.length
    const nodeIdx = this.nodes.length
    this.states.push(state)
    const newNode = new StepParityNode(state, nodeIdx)
    this.nodes.push(newNode)
    this.stateNodeMap.get(state.rowIndex)?.set(stateIdx, nodeIdx)
    return newNode
  }

  addEdge(from: StepParityNode, to: StepParityNode, cost: number) {
    from.neighbors.set(to.id, cost)
  }
}

export class ParityGenerator {
  private readonly app

  private costCache: Map<string, number>[] = []
  private cacheCounter = 0
  private exploreCounter = 0
  private permuteCache: Map<number, Foot[][]> = new Map()

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

  getActionCost(
    initialState: State,
    resultState: State,
    rows: Row[],
    rowIndex: number
  ): number {
    const row = rows[rowIndex]
    const elapsedTime = resultState.second - initialState.second
    let cost = 0

    const combinedColumns: Foot[] = new Array(resultState.columns.length).fill(
      Foot.NONE
    )

    // Merge initial + result position
    for (let i = 0; i < resultState.columns.length; i++) {
      // copy in data from b over the top which overrides it, as long as it's not nothing
      if (resultState.columns[i] != Foot.NONE) {
        combinedColumns[i] = resultState.columns[i]
        continue
      }

      // copy in data from a first, if it wasn't moved
      if (
        initialState.columns[i] == Foot.LEFT_HEEL ||
        initialState.columns[i] == Foot.RIGHT_HEEL
      ) {
        if (!resultState.movedFeet.has(initialState.columns[i])) {
          combinedColumns[i] = initialState.columns[i]
        }
      } else if (initialState.columns[i] == Foot.LEFT_TOE) {
        if (
          !resultState.movedFeet.has(Foot.LEFT_TOE) &&
          !resultState.movedFeet.has(Foot.LEFT_HEEL)
        ) {
          combinedColumns[i] = initialState.columns[i]
        }
      } else if (initialState.columns[i] == Foot.RIGHT_TOE) {
        if (
          !resultState.movedFeet.has(Foot.RIGHT_TOE) &&
          !resultState.movedFeet.has(Foot.RIGHT_HEEL)
        ) {
          combinedColumns[i] = initialState.columns[i]
        }
      }
    }

    // Mine weighting
    let [leftHeel, leftToe, rightHeel, rightToe] = new Array(4).fill(-1)
    for (let i = 0; i < resultState.columns.length; i++) {
      switch (resultState.columns[i]) {
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
          initialState.columns[c] != Foot.LEFT_TOE &&
          initialState.columns[c] != Foot.LEFT_HEEL) ||
        ((combinedColumns[c] == Foot.RIGHT_HEEL ||
          combinedColumns[c] == Foot.RIGHT_TOE) &&
          initialState.columns[c] != Foot.RIGHT_TOE &&
          initialState.columns[c] != Foot.RIGHT_HEEL)
      ) {
        const previousFoot = initialState.columns.indexOf(combinedColumns[c])
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
        initialState.movedFeet.has(Foot.LEFT_HEEL) ||
        initialState.movedFeet.has(Foot.LEFT_TOE)
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
        initialState.movedFeet.has(Foot.RIGHT_TOE) ||
        initialState.movedFeet.has(Foot.RIGHT_HEEL)
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
    if (initialState.columns.some(x => x != Foot.NONE)) {
      for (const f of resultState.movedFeet) {
        switch (f) {
          case Foot.LEFT_HEEL:
          case Foot.LEFT_TOE:
            if (
              !(
                initialState.columns.includes(Foot.RIGHT_HEEL) ||
                initialState.columns.includes(Foot.RIGHT_TOE)
              )
            )
              cost += 500
            break
          case Foot.RIGHT_HEEL:
          case Foot.RIGHT_TOE:
            if (
              !(
                initialState.columns.includes(Foot.LEFT_HEEL) ||
                initialState.columns.includes(Foot.RIGHT_TOE)
              )
            )
              cost += 500
            break
        }
      }
    }

    const movedLeft =
      resultState.movedFeet.has(Foot.LEFT_HEEL) ||
      resultState.movedFeet.has(Foot.LEFT_TOE)
    const movedRight =
      resultState.movedFeet.has(Foot.RIGHT_HEEL) ||
      resultState.movedFeet.has(Foot.RIGHT_TOE)

    const didJump =
      ((initialState.movedFeet.has(Foot.LEFT_HEEL) &&
        !initialState.holdFeet.has(Foot.LEFT_HEEL)) ||
        (initialState.movedFeet.has(Foot.LEFT_TOE) &&
          !initialState.holdFeet.has(Foot.LEFT_TOE))) &&
      ((initialState.movedFeet.has(Foot.RIGHT_HEEL) &&
        !initialState.holdFeet.has(Foot.RIGHT_HEEL)) ||
        (initialState.movedFeet.has(Foot.RIGHT_TOE) &&
          !initialState.holdFeet.has(Foot.RIGHT_TOE)))

    // jacks don't matter if you did a jump before

    let jackedLeft = false
    let jackedRight = false

    if (!didJump) {
      if (leftHeel != -1 && movedLeft) {
        if (
          initialState.columns[leftHeel] == Foot.LEFT_HEEL &&
          !resultState.holdFeet.has(Foot.LEFT_HEEL) &&
          ((initialState.movedFeet.has(Foot.LEFT_HEEL) &&
            !initialState.holdFeet.has(Foot.LEFT_HEEL)) ||
            (initialState.movedFeet.has(Foot.LEFT_TOE) &&
              !initialState.holdFeet.has(Foot.LEFT_TOE)))
        )
          jackedLeft = true
        if (
          initialState.columns[leftToe] == Foot.LEFT_TOE &&
          !resultState.holdFeet.has(Foot.LEFT_TOE) &&
          ((initialState.movedFeet.has(Foot.LEFT_HEEL) &&
            !initialState.holdFeet.has(Foot.LEFT_HEEL)) ||
            (initialState.movedFeet.has(Foot.LEFT_TOE) &&
              !initialState.holdFeet.has(Foot.LEFT_TOE)))
        )
          jackedLeft = true
      }

      if (rightHeel != -1 && movedRight) {
        if (
          initialState.columns[rightHeel] == Foot.RIGHT_HEEL &&
          !resultState.holdFeet.has(Foot.RIGHT_HEEL) &&
          ((initialState.movedFeet.has(Foot.RIGHT_HEEL) &&
            !initialState.holdFeet.has(Foot.RIGHT_HEEL)) ||
            (initialState.movedFeet.has(Foot.RIGHT_TOE) &&
              !initialState.holdFeet.has(Foot.RIGHT_TOE)))
        )
          jackedRight = true
        if (
          initialState.columns[rightToe] == Foot.RIGHT_TOE &&
          !resultState.holdFeet.has(Foot.RIGHT_TOE) &&
          ((initialState.movedFeet.has(Foot.RIGHT_HEEL) &&
            !initialState.holdFeet.has(Foot.RIGHT_HEEL)) ||
            (initialState.movedFeet.has(Foot.RIGHT_TOE) &&
              !initialState.holdFeet.has(Foot.RIGHT_TOE)))
        )
          jackedRight = true
      }
    }

    // Doublestep weighting doesn't apply if you just did a jump or a jack

    if (
      movedLeft != movedRight &&
      (movedLeft || movedRight) &&
      resultState.holdFeet.size == 0 &&
      !didJump
    ) {
      let doublestepped = false

      if (
        movedLeft &&
        !jackedLeft &&
        ((initialState.movedFeet.has(Foot.LEFT_HEEL) &&
          !initialState.holdFeet.has(Foot.LEFT_HEEL)) ||
          (initialState.movedFeet.has(Foot.LEFT_TOE) &&
            !initialState.holdFeet.has(Foot.LEFT_TOE)))
      ) {
        doublestepped = true
      }
      if (
        movedRight &&
        !jackedRight &&
        ((initialState.movedFeet.has(Foot.RIGHT_HEEL) &&
          !initialState.holdFeet.has(Foot.RIGHT_HEEL)) ||
          (initialState.movedFeet.has(Foot.RIGHT_TOE) &&
            !initialState.holdFeet.has(Foot.RIGHT_TOE)))
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
        resultState.movedFeet.has(Foot.LEFT_HEEL) &&
        resultState.movedFeet.has(Foot.LEFT_TOE)
      ) {
        cost += WEIGHTS.BRACKETJACK
      }

      if (
        jackedRight &&
        resultState.movedFeet.has(Foot.RIGHT_HEEL) &&
        resultState.movedFeet.has(Foot.RIGHT_TOE)
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
      initialState.columns.indexOf(Foot.LEFT_HEEL),
      initialState.columns.indexOf(Foot.LEFT_TOE)
    )
    const previousRightPos = this.averagePoint(
      initialState.columns.indexOf(Foot.RIGHT_HEEL),
      initialState.columns.indexOf(Foot.RIGHT_TOE)
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
            initialState.columns[i] == Foot.NONE ||
            resultState.columns[i] == Foot.NONE
          )
            continue

          if (
            initialState.columns[i] != resultState.columns[i] &&
            !resultState.movedFeet.has(initialState.columns[i])
          ) {
            cost += Math.pow(timeScaled / 2.0, 2) * WEIGHTS.FOOTSWITCH
            break
          }
        }
      }
    }

    if (
      initialState.columns[0] != resultState.columns[0] &&
      resultState.columns[0] != Foot.NONE &&
      initialState.columns[0] != Foot.NONE &&
      !resultState.movedFeet.has(initialState.columns[0])
    ) {
      cost += WEIGHTS.SIDESWITCH
    }

    if (
      initialState.columns[3] != resultState.columns[3] &&
      resultState.columns[3] != Foot.NONE &&
      initialState.columns[3] != Foot.NONE &&
      !resultState.movedFeet.has(initialState.columns[3])
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
    for (const foot of resultState.movedFeet) {
      const idxFoot = initialState.columns.indexOf(foot)
      if (idxFoot == -1) continue
      cost +=
        (Math.sqrt(
          this.getDistanceSq(
            this.layout[idxFoot],
            this.layout[resultState.columns.indexOf(foot)]
          )
        ) *
          WEIGHTS.DISTANCE) /
        elapsedTime
    }

    resultState.columns = combinedColumns

    return cost
  }

  calculatePermuteColumnKey(row: Row): number {
    let permuteCacheKey = 0
    for (let i = 0; i < 4; i++) {
      if (row.notes[i] !== undefined || row.holds[i] !== undefined) {
        permuteCacheKey += Math.pow(2, i)
      }
    }
    return permuteCacheKey
  }

  getPermuteColumns(row: Row): Foot[][] {
    const cacheKey = this.calculatePermuteColumnKey(row)
    let permuteColumns = this.permuteCache.get(cacheKey)
    if (permuteColumns == undefined) {
      permuteColumns = this.permuteColumn(row, new Array(4).fill(Foot.NONE), 0)
      this.permuteCache.set(cacheKey, permuteColumns)
    }
    return this.permuteCache.get(cacheKey)!
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
    if (row.notes[column] || row.holds[column]) {
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
            cost: 0,
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
      cost: 0,
    })
    return rows
  }

  manuallySetParity(parityRows: Foot[][]) {
    const notedata = this.app.chartManager.loadedChart?.getNotedata()
    if (!notedata) {
      console.log("Could not load notedata from chartManager")
      return
    }
    const rows = this.createRows(notedata)

    if (rows.length != parityRows.length) {
      console.log("parityRows.length != rows.length!")
      return
    }

    for (let i = 0; i < rows.length; i++) {
      for (let c = 0; c < rows[i].notes.length; c++) {
        if (rows[i].notes[c] == undefined) {
          continue
        }
        rows[i].notes[c]!.parity = FEET_LABEL[FEET.indexOf(parityRows[i][c])]
      }
    }
  }

  analyze(
    options: {
      log?: boolean
      delay?: number
      searchDepth?: number
      searchBreadth?: number
    } = {}
  ): Row[] {
    const {
      log = false,
      delay = 0,
      searchBreadth = 30,
      searchDepth = 16,
    } = options
    this.SEARCH_BREADTH = searchBreadth
    this.SEARCH_DEPTH = searchDepth
    if (log) console.time("Analyze")
    const state: State = {
      columns: [0, 0, 0, 0],
      movedFeet: new Set(),
      holdFeet: new Set(),
      second: -1,
      rowIndex: -1,
    }
    this.costCache = []
    this.cacheCounter = 0
    this.exploreCounter = 0
    const notedata = this.app.chartManager.loadedChart?.getNotedata()
    if (!notedata) return []
    const rows = this.createRows(notedata)

    const graph = this.buildStateGraph(rows)
    this.analyzeGraph(rows, graph)
    return rows
  }

  // Analyzes the given graph to find the least costly path from the
  // beginnning to the end of the stepchart.
  // Sets the `parity` for the relevant notes of each row in rows.
  analyzeGraph(rows: Row[], graph: StepParityGraph) {
    const nodes_for_rows = this.computeCheapestPath(graph)
    for (let i = 0; i < rows.length; i++) {
      const node = graph.nodes[nodes_for_rows[i]]
      for (let j = 0; j < 4; j++) {
        if (rows[i].notes[j]) {
          rows[i].notes[j]!.parity =
            FEET_LABEL[FEET.indexOf(node.state.columns[j])]
        }
      }
    }
  }

  // Generates a StepParityGraph from the given array of Rows.
  // The graph inserts two additional nodes: one that represent the beginning of the song, before the first note,
  // and one that represents the end of the song, after the final note.
  buildStateGraph(rows: Row[]): StepParityGraph {
    const graph: StepParityGraph = new StepParityGraph()
    const beginningState: State = {
      rowIndex: -1,
      second: rows[0].second - 1,
      columns: [],
      movedFeet: new Set(),
      holdFeet: new Set(),
    }

    const startNode: StepParityNode = graph.addOrGetExistingNode(beginningState)
    graph.startNode = startNode.id

    const previousStates: Array<State> = []
    previousStates.push(beginningState)

    for (let i = 0; i < rows.length; i++) {
      const uniqueNodeIdxs = new Set<number>()
      while (previousStates.length > 0) {
        const state = previousStates.shift()!
        const initialNode = graph.addOrGetExistingNode(state)
        const permuteColumns = this.getPermuteColumns(rows[i])
        for (const columns of permuteColumns) {
          const resultState: State = this.initResultState(
            state,
            rows[i],
            i,
            columns
          )
          const cost = this.getActionCost(state, resultState, rows, i)
          const resultNode = graph.addOrGetExistingNode(resultState)
          graph.addEdge(initialNode, resultNode, cost)

          uniqueNodeIdxs.add(resultNode.id)
        }
      }

      for (const nodeIdx of uniqueNodeIdxs) {
        previousStates.push(graph.nodes[nodeIdx].state)
      }
    }

    // at this point, previousStates holds all of the states for the very last row,
    // which just get connected to the endState

    const endState: State = {
      rowIndex: rows.length,
      second: rows[rows.length - 1].second + 1,
      columns: [],
      movedFeet: new Set(),
      holdFeet: new Set(),
    }
    const endNode = graph.addOrGetExistingNode(endState)
    graph.endNode = endNode.id
    while (previousStates.length > 0) {
      const state = previousStates.shift()!
      const node = graph.addOrGetExistingNode(state)
      graph.addEdge(node, endNode, 0)
    }

    return graph
  }

  // Creates a new State, which is the result of moving from the given
  // initialState to the steps of the given row with the given foot
  // placements in columns.
  initResultState(
    initialState: State,
    row: Row,
    rowIndex: number,
    columns: Foot[]
  ): State {
    const resultState: State = {
      rowIndex: rowIndex,
      second: row.second,
      columns: columns,
      movedFeet: new Set(),
      holdFeet: new Set(),
    }

    for (let i = 0; i < 4; i++) {
      if (columns[i] == undefined) {
        continue
      }

      if (row.holds[i] == undefined) {
        resultState.movedFeet.add(columns[i])
      } else if (initialState.columns[i] != columns[i]) {
        resultState.movedFeet.add(columns[i])
      }
      if (row.holds[i] != undefined) {
        resultState.holdFeet.add(columns[i])
      }
    }

    return resultState
  }

  computeCheapestPath(graph: StepParityGraph): number[] {
    const start = graph.startNode
    const end = graph.endNode
    const shortest_path: number[] = []
    const cost = Array(graph.nodes.length).fill(Number.MAX_VALUE)
    const predecessor = Array(graph.nodes.length).fill(-1)

    cost[start] = 0
    for (let i = 0; i <= end; i++) {
      const node = graph.nodes[i]!
      for (const [neighborNodeIdx, weight] of node.neighbors) {
        if (cost[i] + weight < cost[neighborNodeIdx]) {
          cost[neighborNodeIdx] = cost[i] + weight
          predecessor[neighborNodeIdx] = i
        }
      }
    }

    let current_node = end
    while (current_node != start) {
      if (current_node != end) {
        shortest_path.push(current_node)
      }
      current_node = predecessor[current_node]
    }
    shortest_path.reverse()
    return shortest_path
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

function compareStates(state1: State, state2: State): boolean {
  if (state1.second !== state2.second) {
    return false
  }
  if (state1.rowIndex !== state2.rowIndex) {
    return false
  }
  if (!arraysAreEqual(state1.columns, state2.columns)) {
    return false
  }
  if (!setsAreEqual(state1.movedFeet, state2.movedFeet)) {
    return false
  }
  if (!setsAreEqual(state1.holdFeet, state2.holdFeet)) {
    return false
  }
  return true
}

function arraysAreEqual<T>(array1: T[], array2: T[]): boolean {
  if (array1.length !== array2.length) {
    return false
  }

  for (let i = 0; i < array1.length; i++) {
    if (array1[i] !== array2[i]) {
      return false
    }
  }

  return true
}

function setsAreEqual<T>(set1: Set<T>, set2: Set<T>): boolean {
  if (set1.size !== set2.size) {
    return false
  }
  for (const item of set1) {
    if (!set2.has(item)) {
      return false
    }
  }
  return true
}
