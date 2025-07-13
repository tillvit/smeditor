// Parity generation algorithm
// Original algorithm by Jewel, improved by tillvit, improved further by mjvotaw, improved furtherer by tillvit

// This file, ParityDataTypes, ParityCost, and StageLayouts have been written in a way that can
// be extracted from SMEditor (some chart/note types/functions will need to be recreated)

import { getRangeInSortedArray } from "../../../util/Util"
import {
  HoldNotedataEntry,
  Notedata,
  NotedataEntry,
  isHoldNote,
} from "../../sm/NoteTypes"
import { ParityCostCalculator } from "./ParityCost"
import { FEET, Foot, FootOverride, ParityState, Row } from "./ParityDataTypes"
import {
  ParityDebugData,
  ParityDebugUpdateData,
  ParityInboundMessage,
  ParityOutboundComputeMessage,
  ParityOutboundGetDebugMessage,
  ParityOutboundInitMessage,
} from "./ParityWebWorkerTypes"
import { STAGE_LAYOUTS, StageLayout } from "./StageLayouts"
import { calculateTechLabels } from "./TechCounts"

const SECOND_EPSILON = 0.0005

export class ParityGraphNode {
  // map from ids to costs
  children: Map<string, { [id: string]: number }> = new Map()

  state: ParityState
  key: string

  constructor(state: ParityState, key?: string) {
    this.state = state
    if (key) {
      this.key = key
    } else {
      this.key = state.toKey()
    }
  }
}

export class ParityInternals {
  private readonly costCalc: ParityCostCalculator
  private readonly layout: StageLayout

  private readonly initialRow = {
    notes: [],
    holds: [],
    holdTails: new Set<number>(),
    mines: [],
    fakeMines: [],
    second: -1,
    beat: -1,
    columns: [],
    overrides: [],
    id: "start",
  }
  private readonly endRow = {
    notes: [],
    holds: [],
    holdTails: new Set<number>(),
    mines: [],
    fakeMines: [],
    second: -1,
    beat: -1,
    columns: [],
    overrides: [],
    id: "end",
  }

  // Start and end nodes of the graph
  private readonly initialNode: ParityGraphNode
  private readonly endNode: ParityGraphNode

  // Rows are identified by keys (includes beat/second/other data)
  // If two rows have the same key, they are considered the same row
  // Because of this, we can use the key to cache rows (because the calculation is the same)

  // Store cost calculations between two nodes by key
  private cachedEdges = new Map<string, Map<string, { [id: string]: number }>>()

  // Store the lowest cost for each node by key
  private cachedLowestCost = new Map<string, { cost: number; path: string }>()

  // Keep track of the size of the edge cache, prune when too large
  edgeCacheSize = 0

  // Cache for foot permutations
  private permuteCache = new Map<string, Foot[][]>()

  // Map of state keys to ParityGraphNodes
  nodeMap = new Map<string, ParityGraphNode>()

  private nEdges = 0

  // The best path found so far
  bestPath?: string[]
  bestPathCost = 0
  bestPathSet?: Set<string>

  debugStats = {
    lastUpdatedRowStart: -1,
    lastUpdatedOldRowEnd: -1,
    lastUpdatedRowEnd: -1,
    rowUpdateTime: 0,
    lastUpdatedNodeStart: -1,
    lastUpdatedNodeEnd: -1,
    nodeUpdateTime: 0,
    createdNodes: 0,
    createdEdges: 0,
    calculatedEdges: 0,
    cachedEdges: 0,
    edgeUpdateTime: 0,
    cachedBestRows: 0,
    pathUpdateTime: 0,
  }

  notedataRows: Row[] = []
  nodeRows: { beat: number; nodes: ParityGraphNode[] }[] = []

  constructor(gameType: string) {
    this.notedataRows = []
    this.layout = STAGE_LAYOUTS[gameType]
    if (!this.layout) {
      throw new Error(`Unsupported game type: ${gameType}`)
    }

    this.costCalc = new ParityCostCalculator(gameType)
    this.initialNode = new ParityGraphNode(
      new ParityState(this.initialRow, [], new Array(5).fill(-1))
    )
    this.endNode = new ParityGraphNode(
      new ParityState(this.endRow, [], new Array(5).fill(-1))
    )
  }

  compute(startBeat: number, endBeat: number, notedata: Notedata) {
    if (this.layout == undefined) return null
    const updatedRows = this.recalculateRows(startBeat, endBeat, notedata)
    const updatedStates = this.recalculateStates(updatedRows)
    const updatedCost = this.computeCosts(updatedStates)
    this.computeBestPath(updatedCost)

    // Prune edge cache if too big
    const shouldPruneEdgeCache = this.edgeCacheSize > this.nEdges * 2
    if (shouldPruneEdgeCache) {
      this.edgeCacheSize = 0
      const newCache = new Map<string, Map<string, { [id: string]: number }>>()
      for (const nodeRow of this.nodeRows) {
        for (const node of nodeRow.nodes) {
          for (const [childKey, costs] of node.children.entries()) {
            let cache = newCache.get(node.key)
            if (!cache) {
              cache = new Map()
              newCache.set(node.key, cache)
            }
            cache.set(childKey, costs)
            this.edgeCacheSize++
          }
        }
      }
      this.cachedEdges = newCache
    }

    if (this.cachedLowestCost.size > this.nodeMap.size * 2) {
      this.cachedLowestCost.clear()
    }

    if (!this.bestPath) {
      return null
    }

    const parityLabels = new Map<string, Foot>()

    this.notedataRows.forEach((row, idx) => {
      const bestOption = this.nodeMap.get(this.bestPath![idx + 1])!
      bestOption.state.combinedColumns.forEach((foot, col) => {
        if (foot == Foot.NONE) return
        if (!row.notes[col]) return
        parityLabels.set(row.notes[col].beat.toFixed(3) + "-" + col, foot)
      })
    })

    // TODO: Potentially optimize by sending only deltas

    const bestStates = this.bestPath.map((key, i) => {
      if (i == 0) return this.initialNode.state
      if (i == this.bestPath!.length - 1) return this.endNode.state
      return this.nodeMap.get(key)!.state
    })

    const bestNodes = this.bestPath.map((key, i) => {
      if (i == 0) return this.initialNode
      if (i == this.bestPath!.length - 1) return this.endNode
      return this.nodeMap.get(key)!
    })

    const { techRows, techErrors } = calculateTechLabels(
      bestNodes.slice(1, -1),
      this.notedataRows,
      this.layout
    )

    const rowTimestamps = this.notedataRows.map(row => {
      return {
        beat: row.beat,
        second: row.second,
      }
    })

    return { parityLabels, bestStates, techRows, techErrors, rowTimestamps }
  }

  // Regenerates the rows for the given range of beats.
  recalculateRows(startBeat: number, endBeat: number, notedata: Notedata) {
    const rowTimeStart = performance.now()

    // Remove previous rows in the range
    const range = getRangeInSortedArray(
      this.notedataRows,
      Math.round(startBeat * 48), // prevent rounding errors
      Math.round(endBeat * 48),
      a => Math.round(a.beat * 48)
    )
    const startIdx = range[0]
    let endIdx = range[1]

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
      if (note.warped) {
        curIdx--
        continue
      }
      if (columnStatus[note.col] == 1) {
        curIdx--
        continue
      }
      if (note.type == "Mine" && fulfilledColumns == 0) {
        if (note.fake) {
          if (nextFakeMines[note.col] === undefined)
            fakeMines[note.col] = note.second
        } else {
          if (nextMines[note.col] === undefined) mines[note.col] = note.second
        }
        curIdx--
        continue
      }

      if (note.fake) {
        curIdx--
        continue
      }

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
    let overrides: FootOverride[] = []

    // Create rows in the new section
    const rows: Row[] = []
    for (const note of rangeNotes) {
      if (note.warped) {
        continue
      }
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
      if (note.fake) continue
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
            overrides,
            id: "",
          })
          rows.at(-1)!.id = this.rowToKey(rows.at(-1)!)
        }
        lastColumnSecond = note.second
        lastColumnBeat = note.beat
        notes = []
        overrides = []
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
      if (note.parity?.override) overrides[note.col] = note.parity?.override
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
        overrides,
        id: "",
      })
      rows.at(-1)!.id = this.rowToKey(rows.at(-1)!)
    }

    // Update the next row if needed
    if (this.notedataRows[endIdx]) {
      this.notedataRows[endIdx].mines = mines
      this.notedataRows[endIdx].fakeMines = fakeMines
      const oldID = this.notedataRows[endIdx].id
      this.notedataRows[endIdx].id = this.rowToKey(this.notedataRows[endIdx])

      if (oldID != this.notedataRows[endIdx].id) {
        rows.push(this.notedataRows[endIdx])
        endIdx++
      }
    }

    this.debugStats.lastUpdatedRowStart = startIdx
    this.debugStats.lastUpdatedOldRowEnd = endIdx
    this.debugStats.lastUpdatedRowEnd = startIdx + rows.length

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
        this.nEdges -= node.children.size
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
        this.nEdges -= node.children.size
        node.children.clear()
        let permutations = this.getPossibleActions(
          this.notedataRows[rowIndex + 1]
        )
        if (this.notedataRows[rowIndex + 1].overrides.some(p => p)) {
          permutations = this.filterActions(
            this.notedataRows[rowIndex + 1],
            permutations,
            this.notedataRows[rowIndex + 1].overrides
          )
        }

        for (const permutation of permutations) {
          const newState = this.initResultState(
            node.state,
            this.notedataRows[rowIndex + 1],
            permutation
          )
          const newKey = newState.toKey()
          let newNode = this.nodeMap.get(newKey)
          if (!newNode) {
            newNode = new ParityGraphNode(newState, newKey)
            this.nodeMap.set(newKey, newNode)
          }
          newNodes.add(newNode)
          this.debugStats.createdEdges += 1
          this.nEdges++
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
          let cache = this.cachedEdges.get(node.key)
          if (!cache) {
            cache = new Map()
            this.cachedEdges.set(node.key, cache)
          }
          cache.set(childKey, costs)

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

    // we use string for path because list creation is slow
    // a bit jank, but performance!
    this.cachedLowestCost.set(this.initialNode.key, {
      cost: 0,
      path: this.initialNode.key,
    })

    let rowIndex = firstUpdatedEdge
    this.debugStats.cachedBestRows = firstUpdatedEdge + 1

    // We can reuse the shortest paths up to the first updated edge
    // Unforunately, we can't reuse anything after that (at least i think so)
    const rowNodes = new Map<string, number>()

    while (rowIndex < this.notedataRows.length) {
      rowNodes.clear()
      const nodes = this.nodeRows[rowIndex]?.nodes ?? [this.initialNode]
      for (const node of nodes) {
        const currentCost = this.cachedLowestCost.get(node.key)?.cost
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
          const oldCost = rowNodes.get(child)
          if (oldCost === undefined || currentCost + costs["TOTAL"] < oldCost) {
            this.cachedLowestCost.set(child, {
              cost: currentCost + costs["TOTAL"],
              path: this.cachedLowestCost.get(node.key)!.path + "*" + child,
            })
            rowNodes.set(child, currentCost + costs["TOTAL"])
          }
        }
        if (rowIndex == this.notedataRows.length - 1) {
          node.children.delete(this.endNode.key)
        }
      }
      rowIndex++
    }

    // this.cachedLowestCost = lowestCosts

    this.bestPath =
      this.cachedLowestCost.get(this.endNode.key)?.path.split("*") ?? []
    this.bestPathCost = this.cachedLowestCost.get(this.endNode.key)?.cost ?? 0

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

  getPossibleActions(row: Row): Foot[][] {
    const cacheKey = this.calculatePermuteColumnKey(row)
    let permuteColumns = this.permuteCache.get(cacheKey)
    if (permuteColumns == undefined) {
      permuteColumns = this.generateActions(
        row,
        new Array(this.layout.columnCount).fill(Foot.NONE),
        0
      )
      this.permuteCache.set(cacheKey, permuteColumns)
    }
    return this.permuteCache.get(cacheKey)!
  }

  // Recursively generates all permutations of Foot positions given a Row
  generateActions(row: Row, columns: Foot[], column: number): Foot[][] {
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
        permutations.push(...this.generateActions(row, newColumns, column + 1))
      }
      return permutations
    }
    return this.generateActions(row, columns, column + 1)
  }

  // Apply overrides to the permuted columns (only use permutations that actually match the overrides)
  filterActions(
    row: Row,
    permuteColumns: Foot[][],
    overrides: FootOverride[]
  ): Foot[][] {
    // Check for invalid overrides
    const counts = new Array(FEET.length + 1).fill(0)
    const footCounts = {
      Left: 0,
      Right: 0,
    }
    for (const foot of overrides) {
      if (typeof foot == "number") {
        counts[foot]++
      } else if (typeof foot == "string") {
        footCounts[foot]++
      }
    }
    for (let i = 1; i < FEET.length; i++) {
      if (counts[i] > 1) {
        console.warn(
          `Could not generate any valid permutations with parity overrides for row at beat ${row.beat}, clearing overrides, as there must be something invalid about it.`
        )
        return permuteColumns
      }
    }
    if (
      footCounts.Left + counts[Foot.LEFT_HEEL] + counts[Foot.LEFT_TOE] > 2 ||
      footCounts.Right + counts[Foot.RIGHT_HEEL] + counts[Foot.RIGHT_TOE] > 2
    ) {
      console.warn(
        `Could not generate any valid permutations with parity overrides for row at beat ${row.beat}, clearing overrides, as there must be something invalid about it.`
      )
      return permuteColumns
    }
    const updatedColumns = permuteColumns.filter(pc => {
      // Check if the permutation has any overrides that are not NONE
      for (let c = 0; c < this.layout.columnCount; c++) {
        const noteOverride = overrides[c]
        if (noteOverride == undefined || noteOverride == Foot.NONE) continue
        if (noteOverride == "Left") {
          if (pc[c] != Foot.LEFT_HEEL && pc[c] != Foot.LEFT_TOE) {
            return false
          }
        } else if (noteOverride == "Right") {
          if (pc[c] != Foot.RIGHT_HEEL && pc[c] != Foot.RIGHT_TOE) {
            return false
          }
        } else if (pc[c] != noteOverride) {
          return false
        }
      }
      return true
    })

    if (updatedColumns.length == 0) {
      console.warn(
        `Could not generate any valid permutations with parity overrides for row at beat ${row.beat}, clearing overrides, as there must be something invalid about it.`
      )
      return permuteColumns
    }

    return updatedColumns
  }

  // Creates the resulting state after applying the action to the initial state
  initResultState(
    initialState: ParityState,
    row: Row,
    action: Foot[]
  ): ParityState {
    const resultState: ParityState = new ParityState(
      row,
      action,
      new Array(5).fill(-1)
    )

    // Merge initial + result position
    for (let i = 0; i < this.layout.columnCount; i++) {
      resultState.combinedColumns.push(Foot.NONE)
      if (action[i] == undefined || action[i] == Foot.NONE) {
        continue
      }
      resultState.footColumns[action[i]] = i
      resultState.combinedColumns[i] = action[i]
      if (row.holds[i] == undefined) {
        resultState.movedFeet.add(action[i])
      } else if (initialState.combinedColumns[i] != action[i]) {
        resultState.movedFeet.add(action[i])
      }
      if (row.holds[i] != undefined) {
        resultState.holdFeet.add(action[i])
      }
    }
    // Fill in previous position
    if (resultState.footColumns[Foot.LEFT_HEEL] == -1) {
      resultState.footColumns[Foot.LEFT_HEEL] =
        initialState.footColumns[Foot.LEFT_HEEL]
      resultState.footColumns[Foot.LEFT_TOE] =
        initialState.footColumns[Foot.LEFT_TOE]
      if (
        resultState.combinedColumns[resultState.footColumns[Foot.LEFT_HEEL]] ==
        Foot.NONE
      ) {
        resultState.combinedColumns[resultState.footColumns[Foot.LEFT_HEEL]] =
          Foot.LEFT_HEEL
      }
      if (
        resultState.combinedColumns[resultState.footColumns[Foot.LEFT_TOE]] ==
        Foot.NONE
      ) {
        resultState.combinedColumns[resultState.footColumns[Foot.LEFT_TOE]] =
          Foot.LEFT_TOE
      }
    }
    if (resultState.footColumns[Foot.RIGHT_HEEL] == -1) {
      resultState.footColumns[Foot.RIGHT_HEEL] =
        initialState.footColumns[Foot.RIGHT_HEEL]
      resultState.footColumns[Foot.RIGHT_TOE] =
        initialState.footColumns[Foot.RIGHT_TOE]
      if (
        resultState.combinedColumns[resultState.footColumns[Foot.RIGHT_HEEL]] ==
        Foot.NONE
      ) {
        resultState.combinedColumns[resultState.footColumns[Foot.RIGHT_HEEL]] =
          Foot.RIGHT_HEEL
      }
      if (
        resultState.combinedColumns[resultState.footColumns[Foot.RIGHT_TOE]] ==
        Foot.NONE
      ) {
        resultState.combinedColumns[resultState.footColumns[Foot.RIGHT_TOE]] =
          Foot.RIGHT_TOE
      }
    }
    return resultState
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
    let overrideString = ""
    for (let i = 0; i < this.layout.columnCount; i++) {
      if (row.overrides[i] !== undefined) {
        overrideString += i + "" + row.overrides[i]
      }
    }
    return `${row.beat.toFixed(3)}-${noteString}-${fakeString}-${mineString}-${holdString}-${overrideString}`
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

  reset() {
    this.bestPath = undefined
    this.bestPathCost = 0
    this.bestPathSet = undefined
    this.nodeMap.clear()
    this.nEdges = 0
    this.nodeRows = []
    this.notedataRows = []
    this.deleteCache()
  }
}

// Web worker stuff

let instance: ParityInternals | undefined

// Initially, we send the entire debug data if requested (off by default unless debug/graph is turned on)
// This includes the large nodeMap set (which can take a lot to serialize)
function getDebugData(): ParityDebugData | null {
  if (!instance) {
    return null
  }
  return {
    edgeCacheSize: instance.edgeCacheSize,
    nodeMap: instance.nodeMap,
    bestPath: instance.bestPath!,
    bestPathCost: instance.bestPathCost,
    bestPathSet: instance.bestPathSet!,
    notedataRows: instance.notedataRows,
    nodeRows: instance.nodeRows,
    stats: instance.debugStats,
  }
}

// Instead of sending the entire debug data, we send only the updated data
// On first load, the page might freeze on large files, but later edits will be faster
function getDebugUpdateData(): ParityDebugUpdateData | null {
  if (!instance) {
    return null
  }
  return {
    removedRowsStart: instance.debugStats.lastUpdatedRowStart,
    removedRowsEnd: instance.debugStats.lastUpdatedOldRowEnd,
    newRows: instance.notedataRows.slice(
      instance.debugStats.lastUpdatedRowStart,
      instance.debugStats.lastUpdatedRowEnd
    ),
    newStates: instance.nodeRows.slice(
      Math.max(0, instance.debugStats.lastUpdatedNodeStart),
      instance.debugStats.lastUpdatedNodeEnd
    ),
    bestPath: instance.bestPath!,
    bestPathCost: instance.bestPathCost,
    bestPathSet: instance.bestPathSet!,
    edgeCacheSize: instance.edgeCacheSize,
    stats: instance.debugStats,
  }
}

self.onmessage = (e: MessageEvent<ParityInboundMessage>) => {
  switch (e.data.type) {
    case "init":
      if (instance) {
        postMessage({
          type: "error",
          id: e.data.id,
          error: "Instance already initialized",
        })
        return
      }
      try {
        instance = new ParityInternals(e.data.gameType)
        postMessage({
          type: "init",
          id: e.data.id,
        } satisfies ParityOutboundInitMessage)
      } catch (error) {
        postMessage({
          type: "error",
          id: e.data.id,
          error: (error as Error).message,
        })
      }
      break
    case "compute": {
      if (!instance) {
        postMessage({
          type: "error",
          id: e.data.id,
          error: "Instance not initialized",
        })
        return
      }
      const result = instance.compute(
        e.data.startBeat,
        e.data.endBeat,
        e.data.notedata
      )
      if (!result) {
        postMessage({
          type: "error",
          id: e.data.id,
          error: "No path found",
        })
        return
      }
      postMessage({
        type: "compute",
        id: e.data.id,
        ...result,
        debug: e.data.debug ? getDebugUpdateData()! : undefined,
      } satisfies ParityOutboundComputeMessage)
      break
    }
    case "getDebug": {
      if (!instance) {
        postMessage({
          type: "error",
          id: e.data.id,
          error: "Instance not initialized",
        })
        return
      }
      postMessage({
        type: "getDebug",
        id: e.data.id,
        data: getDebugData(),
      } satisfies ParityOutboundGetDebugMessage)
      break
    }
  }
}
