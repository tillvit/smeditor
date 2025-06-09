import { getRangeInSortedArray } from "../../../util/Util"
import { Chart } from "../../sm/Chart"
import {
  HoldNotedataEntry,
  NotedataEntry,
  isHoldNote,
} from "../../sm/NoteTypes"
import { ParityCostCalculator } from "./ParityCost"
import { FEET, Foot, Row, State } from "./ParityDataTypes"
import { STAGE_LAYOUTS, StageLayout } from "./StageLayouts"

const SECOND_EPSILON = 0.0005

export class ParityGraphNode {
  children: Map<string, { [id: string]: number }> = new Map()

  state: State
  key: string

  constructor(state: State, key?: string) {
    this.state = state
    if (key) {
      this.key = key
    } else {
      this.key = state.toKey()
    }
  }
}

export class ParityInternals {
  private readonly chart: Chart
  private readonly costCalc: ParityCostCalculator
  private readonly layout: StageLayout

  // Start and end nodes of the graph
  private readonly initialNode: ParityGraphNode = new ParityGraphNode(
    new State(-1, -1, -1, [])
  )
  private readonly endNode: ParityGraphNode = new ParityGraphNode(
    new State(-2, -2, -2, [])
  )

  // Store cost calculations between two nodes by key
  private cachedEdges = new Map<string, Map<string, { [id: string]: number }>>()
  // Store the lowest cost for each node by key
  private cachedLowestCost = new Map<string, { cost: number; path: string }>()
  // Keep track of the size of the edge cache, prune when too large
  edgeCacheSize = 0
  // Cache for foot permutations
  private permuteCache = new Map<string, Foot[][]>()
  // Map of state keys to ParityGraphNodes
  private nodeMap = new Map<string, ParityGraphNode>()

  // The best path found so far
  bestPath?: string[]
  bestPathCost = 0
  bestPathSet?: Set<string>

  debugStats = {
    lastUpdatedRowStart: -1,
    lastUpdatedRowEnd: -1,
    rowUpdateTime: -1,
    lastUpdatedNodeStart: -1,
    lastUpdatedNodeEnd: -1,
    nodeUpdateTime: -1,
    createdNodes: 0,
    createdEdges: 0,
    calculatedEdges: 0,
    cachedEdges: 0,
    edgeUpdateTime: -1,
    cachedBestNodes: 0,
    pathUpdateTime: -1,
  }

  notedataRows: Row[] = []
  nodeRows: { beat: number; nodes: ParityGraphNode[] }[] = []

  constructor(chart: Chart) {
    this.notedataRows = []
    this.chart = chart
    this.layout =
      STAGE_LAYOUTS[chart.gameType.id] ?? STAGE_LAYOUTS["dance-single"]
    this.costCalc = new ParityCostCalculator(chart.gameType.id)
  }

  compute(startBeat: number, endBeat: number) {
    const updatedRows = this.recalculateRows(startBeat, endBeat)
    const updatedStates = this.recalculateStates(updatedRows)
    const updatedCost = this.computeCosts(updatedStates)
    this.computeBestPath(updatedCost)

    // assign notes
    if (this.bestPath) {
      this.notedataRows.forEach((row, idx) => {
        const bestOption = this.nodeMap.get(this.bestPath![idx + 1])!
        bestOption.state.combinedColumns.forEach((foot, col) => {
          if (foot == Foot.NONE) return
          if (!row.notes[col]) return
          row.notes[col].parity = {
            foot: foot,
            override: false,
          }
        })
      })
    }
  }

  /**
   * Regenerates the rows for the given range of beats.
   *
   * @param {number} startBeat
   * @param {number} endBeat
   * @memberof ParityInternals
   */
  recalculateRows(startBeat: number, endBeat: number) {
    const rowTimeStart = performance.now()

    // Remove previous rows in the range
    const [startIdx, endIdx] = getRangeInSortedArray(
      this.notedataRows,
      Math.round(startBeat * 48), // prevent rounding errors
      Math.round(endBeat * 48),
      a => Math.round(a.beat * 48)
    )

    const notedata = this.chart.getNotedata()
    const [noteStartIdx, noteEndIdx] = getRangeInSortedArray(
      notedata,
      Math.round(startBeat * 48),
      Math.round(endBeat * 48),
      a => Math.round(a.beat * 48)
    )
    const rangeNotes = notedata.slice(noteStartIdx, noteEndIdx)

    let activeHolds: (HoldNotedataEntry | undefined)[] = []
    let nextMines: (number | undefined)[] = []
    let nextFakeMines: (number | undefined)[] = []
    let mines: (number | undefined)[] = []
    let fakeMines: (number | undefined)[] = []

    // Search backwards to populate holds + mines
    let curIdx = noteStartIdx - 1
    const columnStatus = new Array<number>(this.layout.columnCount).fill(0)
    let fulfilledColumns = 0
    while (curIdx >= 0 && fulfilledColumns < columnStatus.length) {
      const note = notedata[curIdx]
      if (columnStatus[note.col] == 1) {
        curIdx--
        continue
      }
      if (note.type == "Mine") {
        if (note.fake) {
          if (nextFakeMines[note.col] === undefined)
            fakeMines[note.col] = note.second
        } else {
          if (nextMines[note.col] === undefined) mines[note.col] = note.second
        }
        curIdx--
        continue
      }

      if (note.fake || note.warped) continue

      columnStatus[note.col] = 1
      fulfilledColumns++

      if (isHoldNote(note)) {
        activeHolds[note.col] = note
      }

      curIdx--
    }

    let lastColumnSecond: number | null = null
    let lastColumnBeat: number | null = null
    let notes: NotedataEntry[] = []

    // Create rows in the new section
    const rows: Row[] = []
    for (const note of rangeNotes) {
      if (note.type == "Mine") {
        if (
          this.isSameSecond(note.second, lastColumnSecond) &&
          rows.length > 0
        ) {
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
      if (note.fake || note.warped) continue
      if (!this.isSameSecond(lastColumnSecond, note.second)) {
        if (lastColumnSecond != null && lastColumnBeat != null) {
          rows.push({
            notes,
            holds: activeHolds.map(hold => {
              if (
                hold === undefined ||
                this.isSameSecond(hold.second, lastColumnSecond) ||
                hold.second > lastColumnSecond!
              )
                return undefined
              return hold
            }),
            holdTails: new Set(
              activeHolds
                .filter(hold => {
                  if (hold === undefined) return false
                  if (
                    Math.abs(hold.beat + hold.hold - lastColumnBeat!) > 0.0005
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
            beat: lastColumnBeat,
            columns: [],
            id: "",
          })
          rows.at(-1)!.id = this.rowToKey(rows.at(-1)!)
        }
        lastColumnSecond = note.second
        lastColumnBeat = note.beat
        notes = []
        nextMines = mines
        nextFakeMines = fakeMines
        mines = []
        fakeMines = []
        activeHolds = activeHolds.map(hold => {
          if (
            hold === undefined ||
            Math.round(note.beat * 48) >
              Math.round((hold.beat + hold.hold) * 48)
          )
            return undefined
          return hold
        })
      }
      notes[note.col] = note
      if (isHoldNote(note)) {
        activeHolds[note.col] = note
      }
    }
    if (notes.length != 0) {
      rows.push({
        notes,
        holds: activeHolds.map(hold => {
          if (
            hold === undefined ||
            this.isSameSecond(hold.second, lastColumnSecond) ||
            hold.second > lastColumnSecond!
          )
            return undefined
          return hold
        }),
        holdTails: new Set(
          activeHolds
            .filter(hold => {
              if (hold === undefined) return false
              if (Math.abs(hold.beat + hold.hold - lastColumnBeat!) > 0.0005) {
                return false
              }
              return true
            })
            .map(hold => hold!.col)
        ),
        mines: nextMines,
        fakeMines: nextFakeMines,
        second: lastColumnSecond!,
        beat: lastColumnBeat!,
        columns: [],
        id: "",
      })
      rows.at(-1)!.id = this.rowToKey(rows.at(-1)!)
    }

    this.debugStats.lastUpdatedRowStart = startIdx
    this.debugStats.lastUpdatedRowEnd = startIdx + rows.length

    // Update the next row if needed
    if (this.notedataRows[endIdx]) {
      this.notedataRows[endIdx].mines = mines
      this.notedataRows[endIdx].fakeMines = fakeMines
      const oldID = this.notedataRows[endIdx].id
      this.notedataRows[endIdx].id = this.rowToKey(this.notedataRows[endIdx])
      if (oldID != this.notedataRows[endIdx].id) {
        this.debugStats.lastUpdatedRowEnd++
      }
    }

    // Clear old node rows

    this.notedataRows.splice(startIdx, endIdx - startIdx, ...rows)
    this.debugStats.rowUpdateTime = performance.now() - rowTimeStart

    return {
      startIdx: startIdx,
      newEndIdx: startIdx + rows.length,
      oldEndIdx: endIdx,
    }
  }

  // Regenerates the possible states/nodes given the range of updated rows
  recalculateStates(updatedRows: {
    startIdx: number
    newEndIdx: number
    oldEndIdx: number
  }) {
    this.debugStats.createdNodes = 0
    this.debugStats.createdEdges = 0
    const stateTimeStart = performance.now()

    // Get rid of old node rows
    const removedRows = this.nodeRows.splice(
      updatedRows.startIdx,
      updatedRows.oldEndIdx - updatedRows.startIdx
    )
    removedRows.forEach(row => {
      row.nodes.forEach(node => {
        this.nodeMap.delete(node.key)
      })
    })

    // Previous node must also be affected by new row
    let rowIndex = updatedRows.startIdx ?? 0
    rowIndex -= 1
    this.debugStats.lastUpdatedNodeStart = rowIndex

    while (rowIndex < this.notedataRows.length - 1) {
      let nodes = this.nodeRows[rowIndex]?.nodes ?? [this.initialNode]
      const newNodes = new Set<ParityGraphNode>()

      for (const node of nodes) {
        node.children.clear()
        const permutations = this.getPermuteColumns(
          this.notedataRows[rowIndex + 1]
        )
        for (const permutation of permutations) {
          const newState = this.initResultState(
            node.state,
            this.notedataRows[rowIndex + 1],
            rowIndex + 1,
            permutation
          )
          const newKey = newState.toKey()
          let newNode
          if (this.nodeMap.has(newKey)) {
            newNode = this.nodeMap.get(newKey)!
          } else {
            newNode = new ParityGraphNode(newState, newKey)
            this.nodeMap.set(newKey, newNode)
          }
          newNodes.add(newNode)
          this.debugStats.createdEdges += 1
          node.children.set(newNode.key, {})
        }
      }
      const newNodesArray = Array.from(newNodes)
      this.debugStats.createdNodes += newNodesArray.length

      // Stop when we end up with the same nodes as before and we are out of the new range
      if (rowIndex + 1 >= updatedRows.newEndIdx) {
        const curRow = this.nodeRows[rowIndex + 1]

        if (curRow && curRow.nodes.length == newNodes.size) {
          curRow.nodes.sort()
          newNodesArray.sort()
          let same = true
          for (let i = 0; i < curRow.nodes.length; i++) {
            if (curRow.nodes[i].key != newNodesArray[i].key) {
              same = false
              break
            }
          }
          if (same) break
        }
        // Replace the new row
        this.nodeRows[rowIndex + 1] = {
          beat: this.notedataRows[rowIndex + 1].beat,
          nodes: newNodesArray,
        }
      } else {
        // Insert the new row
        this.nodeRows.splice(rowIndex + 1, 0, {
          beat: this.notedataRows[rowIndex + 1].beat,
          nodes: newNodesArray,
        })
      }

      nodes = newNodesArray
      rowIndex++
    }

    this.debugStats.lastUpdatedNodeEnd = rowIndex + 1
    this.debugStats.nodeUpdateTime = performance.now() - stateTimeStart

    return {
      firstUpdatedRow: this.debugStats.lastUpdatedNodeStart,
      lastUpdatedRow: this.debugStats.lastUpdatedNodeEnd,
    }
  }

  // Computes the edges for the nodes within the rows that were updated
  computeCosts(updatedStates: {
    firstUpdatedRow: number
    lastUpdatedRow: number
  }) {
    this.debugStats.calculatedEdges = 0
    this.debugStats.cachedEdges = 0

    const edgeTimeStart = performance.now()

    let rowIndex = updatedStates.firstUpdatedRow - 1
    if (rowIndex < -1) {
      rowIndex = -1
    }
    while (
      rowIndex < this.notedataRows.length - 1 &&
      rowIndex < updatedStates.lastUpdatedRow
    ) {
      const nodes = this.nodeRows[rowIndex]?.nodes ?? [this.initialNode]
      for (const node of nodes) {
        for (const childKey of node.children.keys()) {
          const childNode = this.nodeMap.get(childKey)
          if (!childNode) {
            console.warn("Child node not found for key:", childKey)
            continue
          }
          const childState = childNode.state
          const parentState = node.state

          this.debugStats.calculatedEdges++

          // If the edge is already cached, reuse it
          if (
            this.cachedEdges.has(node.key) &&
            this.cachedEdges.get(node.key)!.has(childKey)
          ) {
            this.debugStats.cachedEdges++
            node.children.set(
              childKey,
              this.cachedEdges.get(node.key)!.get(childKey)!
            )
            continue
          }

          this.edgeCacheSize++
          const costs = this.costCalc.getActionCost(
            parentState,
            childState,
            this.notedataRows,
            rowIndex + 1
          )
          if (!this.cachedEdges.has(node.key)) {
            this.cachedEdges.set(node.key, new Map())
          }
          this.cachedEdges.get(node.key)!.set(childKey, costs)

          node.children.set(childKey, costs)
        }
      }
      rowIndex++
    }

    this.debugStats.edgeUpdateTime = performance.now() - edgeTimeStart
    return Math.max(-1, updatedStates.firstUpdatedRow - 1)
  }

  // Finds the best path through the graph
  computeBestPath(firstUpdatedEdge: number) {
    const pathTimeStart = performance.now()
    this.debugStats.cachedBestNodes = 0

    // we use string for path because list creation is slow
    // a bit jank, but performance!
    const lowestCosts = new Map<string, { cost: number; path: string }>()
    lowestCosts.set(this.initialNode.key, {
      cost: 0,
      path: this.initialNode.key,
    })

    let rowIndex = -1

    while (rowIndex <= firstUpdatedEdge) {
      // We can reuse the shortest paths up to the first updated edge
      // Unforunately, we can't reuse anything after that (at least i think so)
      let nodes = this.nodeRows[rowIndex]?.nodes
      if (rowIndex == -1) {
        nodes = [this.initialNode]
      }
      if (!nodes) break
      for (const node of nodes) {
        if (this.cachedLowestCost.has(node.key)) {
          this.debugStats.cachedBestNodes++
          lowestCosts.set(node.key, this.cachedLowestCost.get(node.key)!)
          continue
        }
      }
      rowIndex++
    }
    rowIndex--

    while (rowIndex < this.notedataRows.length) {
      const nodes = this.nodeRows[rowIndex]?.nodes ?? [this.initialNode]
      for (const node of nodes) {
        const currentCost = lowestCosts.get(node.key)?.cost
        if (currentCost === undefined) {
          // how
          console.warn("No cost found for node:", node.key)
          continue
        }

        if (rowIndex == this.notedataRows.length - 1) {
          node.children.set(this.endNode.key, {
            TOTAL: 0,
          })
        }
        for (const [child, costs] of node.children.entries()) {
          if (
            !lowestCosts.has(child) ||
            currentCost + costs["TOTAL"] < lowestCosts.get(child)!.cost
          ) {
            lowestCosts.set(child, {
              cost: currentCost + costs["TOTAL"],
              path: lowestCosts.get(node.key)!.path + "*" + child,
            })
          }
        }
      }
      rowIndex++
    }

    this.cachedLowestCost = lowestCosts

    this.bestPath = lowestCosts.get(this.endNode.key)?.path.split("*") ?? []
    this.bestPathCost = lowestCosts.get(this.endNode.key)?.cost ?? 0

    if (!this.bestPath) {
      console.error("No best path found")
    }

    this.bestPathSet = new Set(this.bestPath ?? [])

    this.debugStats.pathUpdateTime = performance.now() - pathTimeStart
  }

  calculatePermuteColumnKey(row: Row): string {
    let s = ""
    for (let i = 0; i < this.layout.columnCount; i++) {
      if (row.notes[i] || row.holds[i]) s += i
    }
    return s
  }

  getPermuteColumns(row: Row): Foot[][] {
    const cacheKey = this.calculatePermuteColumnKey(row)
    let permuteColumns = this.permuteCache.get(cacheKey)
    if (permuteColumns == undefined) {
      permuteColumns = this.permuteColumn(
        row,
        new Array(this.layout.columnCount).fill(Foot.NONE),
        0
      )
      this.permuteCache.set(cacheKey, permuteColumns)
    }
    return this.permuteCache.get(cacheKey)!
  }

  // Recursively generates all permutations of Foot positions given a Row
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
        if (!this.layout.bracketCheck(leftHeelIndex, leftToeIndex)) return []
      }
      if (rightHeelIndex != -1 && rightToeIndex != -1) {
        if (!this.layout.bracketCheck(rightHeelIndex, rightToeIndex)) return []
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

  // Creates the resulting state after applying the action (columns) to the initial state
  initResultState(
    initialState: State,
    row: Row,
    rowIndex: number,
    columns: Foot[]
  ): State {
    const resultState: State = new State(
      rowIndex,
      row.second,
      row.beat,
      columns
    )

    for (let i = 0; i < this.layout.columnCount; i++) {
      resultState.combinedColumns.push(Foot.NONE)
      if (columns[i] == undefined) {
        continue
      }

      if (row.holds[i] == undefined) {
        resultState.movedFeet.add(columns[i])
      } else if (initialState.combinedColumns[i] != columns[i]) {
        resultState.movedFeet.add(columns[i])
      }
      if (row.holds[i] != undefined) {
        resultState.holdFeet.add(columns[i])
      }
    }

    resultState.combinedColumns = this.combineColumns(initialState, resultState)

    return resultState
  }

  // Computes the final columns (takes old position and applies action, keeping old feet in place)
  combineColumns(initialState: State, resultState: State) {
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
        initialState.combinedColumns[i] == Foot.LEFT_HEEL ||
        initialState.combinedColumns[i] == Foot.RIGHT_HEEL
      ) {
        if (!resultState.movedFeet.has(initialState.combinedColumns[i])) {
          combinedColumns[i] = initialState.combinedColumns[i]
        }
      } else if (initialState.combinedColumns[i] == Foot.LEFT_TOE) {
        if (
          !resultState.movedFeet.has(Foot.LEFT_TOE) &&
          !resultState.movedFeet.has(Foot.LEFT_HEEL)
        ) {
          combinedColumns[i] = initialState.combinedColumns[i]
        }
      } else if (initialState.combinedColumns[i] == Foot.RIGHT_TOE) {
        if (
          !resultState.movedFeet.has(Foot.RIGHT_TOE) &&
          !resultState.movedFeet.has(Foot.RIGHT_HEEL)
        ) {
          combinedColumns[i] = initialState.combinedColumns[i]
        }
      }
    }
    return combinedColumns
  }

  rowToKey(row: Row): string {
    let noteString = ""
    for (let i = 0; i < this.layout.columnCount; i++) {
      if (row.notes[i]) {
        noteString += i + "|"
      }
    }
    const fakeString = row.fakeMines
      .map((note, col) => {
        if (note === undefined) return "0"
        return col + "|" + note.toFixed(3)
      })
      .join("^")
    const mineString = row.mines
      .map((note, col) => {
        if (note === undefined) return "0"
        return col + "|" + note.toFixed(3)
      })
      .join("^")
    let holdString = ""
    for (let i = 0; i < this.layout.columnCount; i++) {
      if (row.holdTails.has(i)) {
        holdString += i + "T"
      } else if (row.holds[i] !== undefined) {
        holdString += i + "H"
      }
    }
    holdString = holdString.replace(/0+$/, "")
    return `${row.beat.toFixed(3)}-${noteString}-${fakeString}-${mineString}-${holdString}`
  }

  private isSameSecond(
    second1: number | null,
    second2: number | null
  ): boolean {
    if (second1 === null || second2 === null) {
      return false
    }
    return Math.abs(second1 - second2) < SECOND_EPSILON
  }

  deleteCache() {
    this.cachedEdges.clear()
    this.cachedLowestCost.clear()
    this.edgeCacheSize = 0
    this.permuteCache.clear()
  }
}
