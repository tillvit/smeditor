import { HoldNotedataEntry, NotedataEntry } from "../../sm/NoteTypes"

export enum Foot {
  NONE,
  LEFT_HEEL,
  LEFT_TOE,
  RIGHT_HEEL,
  RIGHT_TOE,
}

export const FEET = [
  Foot.LEFT_HEEL,
  Foot.LEFT_TOE,
  Foot.RIGHT_HEEL,
  Foot.RIGHT_TOE,
]

// Instead of having to write out if((someFootPart == Foot.LEFT_TOE && someOtherPart != Foot.LEFT_HEEL || someFootPart == Foot.LEFT_HEEL && someOtherPart != Foot.LEFT_TOE))
// get the other part of the foot for a given value, if(OTHER_PART_OF_FOOT[someFootPart] != someOtherPart)
export const OTHER_PART_OF_FOOT = [
  Foot.NONE,
  Foot.LEFT_TOE,
  Foot.LEFT_HEEL,
  Foot.RIGHT_TOE,
  Foot.RIGHT_HEEL,
]

export const FEET_LABELS = [".", "L", "l", "R", "r"]

export const FEET_LABELS_LONG = [
  "None",
  "Left Heel",
  "Left Toe",
  "Right Heel",
  "Right Toe",
]

export const FEET_LABEL_TO_FOOT: { [key: string]: Foot } = {
  L: Foot.LEFT_HEEL,
  l: Foot.LEFT_TOE,
  R: Foot.RIGHT_HEEL,
  r: Foot.RIGHT_TOE,
}

export type FootOverride = Foot | "Left" | "Right"

export interface FootPlacement {
  leftHeel: number
  leftToe: number
  rightHeel: number
  rightToe: number
  leftBracket: boolean
  rightBracket: boolean
}

export const ZERO_WEIGHT: { [key: string]: number } = {
  DOUBLESTEP: 0,
  BRACKETJACK: 0,
  JACK: 0,
  JUMP: 0,
  SLOW_BRACKET: 0,
  TWISTED_FOOT: 0,
  BRACKETTAP: 0,
  HOLDSWITCH: 0,
  MINE: 0,
  FOOTSWITCH: 0,
  MISSED_FOOTSWITCH: 0,
  FACING: 0,
  DISTANCE: 0,
  SPIN: 0,
  SIDESWITCH: 0,
  CROWDED_BRACKET: 0,
  OTHER: 0,
  OVERRIDE: 0,
  TOTAL: 0,
}

export const DEFAULT_WEIGHTS: { [key: string]: number } = {
  DOUBLESTEP: 850,
  BRACKETJACK: 20,
  JACK: 30,
  JUMP: 0,
  SLOW_BRACKET: 400,
  TWISTED_FOOT: 100000,
  BRACKETTAP: 400,
  HOLDSWITCH: 55,
  MINE: 10000,
  FOOTSWITCH: 325,
  MISSED_FOOTSWITCH: 500,
  FACING: 2,
  DISTANCE: 6,
  SPIN: 1000,
  SIDESWITCH: 130,
  CROWDED_BRACKET: 0,
  OTHER: 0,
}

export const WEIGHT_SHORT_NAMES: { [id: string]: string } = {
  DOUBLESTEP: "DST",
  BRACKETJACK: "BRJ",
  JACK: "JAK",
  JUMP: "JMP",
  SLOW_BRACKET: "SLWB",
  TWISTED_FOOT: "TWST",
  BRACKETTAP: "BRT",
  HOLDSWITCH: "HLS",
  MINE: "MNE",
  FOOTSWITCH: "FSW",
  MISSED_FOOTSWITCH: "MFS",
  FACING: "FAC",
  DISTANCE: "DIS",
  SPIN: "SPN",
  SIDESWITCH: "SSW",
  CROWDED_BRACKET: "CBK",
  OTHER: "OTH",
  OVERRIDE: "OVR",
  TOTAL: "TOT",
}

export enum TechCountsCategory {
  Crossovers = 0,
  Footswitches,
  Sideswitches,
  Jacks,
  Brackets,
  Doublesteps,
  NUM_TechCountsCategory,
  Invalid,
}

export const TECH_COUNTS = ["XO", "FS", "SS", "JA", "BR", "DS"]

export class State {
  idx: number = -1
  columns: Foot[] = []
  combinedColumns: Foot[] = []
  movedFeet: Set<Foot> = new Set()
  holdFeet: Set<Foot> = new Set()
  second: number
  beat: number
  rowIndex: number

  constructor(rowIndex: number, second: number, beat: number, columns: Foot[]) {
    this.rowIndex = rowIndex
    this.second = second
    this.beat = beat
    this.columns = [...columns]
  }

  toKey() {
    return `${this.second.toFixed(3)}-${this.beat.toFixed(3)}-${this.columns.join("")}-${this.combinedColumns.join("")}-${[...this.movedFeet].sort().join("")}-${[...this.holdFeet].sort().join("")}`
  }
}

// because sets aren't serializable, this is an intermediate
export interface Row {
  notes: (NotedataEntry | undefined)[]
  holds: (HoldNotedataEntry | undefined)[]
  holdTails: Set<number>
  mines: (number | undefined)[]
  fakeMines: (number | undefined)[]
  second: number
  beat: number
  columns: Foot[]
  overrides: FootOverride[]
  id: string
}

// A node within a StepParityGraph.
// Represents a given state, and its connections to the states in the
// following row of the step chart.
export class StepParityNode {
  id: number = 0 // The index of this node in its graph.nodes array
  neighbors: Map<number, { [id: string]: number }> = new Map() // Connections to, and the cost of moving to, the connected nodes. Keys are the connected node's id, and values are the cost.
  ancestors: Map<number, { [id: string]: number }> = new Map() // Connections to, and cost of moving from, a connected node to this node.

  state: State

  constructor(state: State, id: number) {
    this.state = state
    this.id = id
  }

  toSerializable(): SerializableNode {
    const mappedStuff: [number, { [id: string]: number }][] = []
    this.neighbors.forEach((val, key) => {
      mappedStuff.push([key, val])
    })

    const mappedAncestors: [number, { [id: string]: number }][] = []
    this.ancestors.forEach((val, key) => {
      mappedAncestors.push([key, val])
    })

    const serializableNode: SerializableNode = {
      id: this.id,
      stateIdx: this.state.idx,
      neighbors: mappedStuff,
      ancestors: mappedAncestors,
    }
    return serializableNode
  }
  serialized(): string {
    const serializableNode = this.toSerializable()
    return JSON.stringify(serializableNode)
  }
}

export interface SerializableNode {
  id: number
  neighbors: [number, { [id: string]: number }][]
  ancestors: [number, { [id: string]: number }][]
  stateIdx: number
}

// A graph, representing all of the possible states for a step chart.
export class StepParityGraph {
  nodes: Array<StepParityNode> = []
  states: Array<State> = []

  startNode: number = 0
  endNode: number = 0
  // A nested map to keep track of states and associated nodes
  // first key is row number,
  // second key is index of state in the graph's states array
  // resulting value is index of node in the graph's nodes array
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
    state.idx = this.states.length
    this.states.push(state)
    const newNode = new StepParityNode(state, nodeIdx)
    this.nodes.push(newNode)
    this.stateNodeMap.get(state.rowIndex)?.set(stateIdx, nodeIdx)
    return newNode
  }

  addEdge(
    from: StepParityNode,
    to: StepParityNode,
    cost: { [id: string]: number }
  ) {
    from.neighbors.set(to.id, cost)
    to.ancestors.set(from.id, cost)
  }

  computeCheapestPath(): number[] {
    const start = this.startNode
    const end = this.endNode
    return this.getCheapestPathBetweenNodes(start, end)
  }

  getCheapestPathBetweenNodes(start: number, end: number): number[] {
    const shortest_path: number[] = []
    const cost = Array(this.nodes.length).fill(Number.MAX_VALUE)
    const predecessor = Array(this.nodes.length).fill(-1)

    cost[start] = 0
    for (let i = 0; i <= end; i++) {
      const node = this.nodes[i]
      for (const [neighborNodeIdx, weight] of node.neighbors) {
        if (cost[i] + weight.TOTAL < cost[neighborNodeIdx]) {
          cost[neighborNodeIdx] = cost[i] + weight.TOTAL
          predecessor[neighborNodeIdx] = i
        }
      }
    }

    let current_node = end
    while (current_node != start) {
      if (current_node == -1) {
        console.warn(
          `getCheapestPathBetweenNodes:: current_node == -1, while searching for path between ${start} and ${end}`
        )
        break
      }
      if (current_node != end) {
        shortest_path.push(current_node)
      }
      current_node = predecessor[current_node]
    }
    shortest_path.reverse()
    return shortest_path
  }

  serialized(indent: boolean): string {
    return ""
  }

  // Returns the minimum amount of data needed to rebuild this graph,
  // for doing maths stuff
  // Returns basically just the neighbors
  // [number, number[]][]
  // An array of a pairing: a number, which is the index of the neighboring node,
  // and an array of numbers where each number correstponds to a certain weight
  //

  private weightsToSkip: string[] = ["TOTAL", "OVERRIDE"]

  toSerializableMinimalNodes() {
    const serializedNodes = this.nodes.map(n => n.toSerializable())

    const minimalNodes = serializedNodes.map(n => {
      const minimalerNeighbors = []
      for (const neighbor of n.neighbors) {
        const [nIdx, cost] = neighbor
        const onlyCosts: number[] = []
        for (const c in cost) {
          if (!this.weightsToSkip.includes(c)) {
            onlyCosts.push(cost[c])
          }
        }
        minimalerNeighbors.push([nIdx, onlyCosts])
      }
      return minimalerNeighbors
    })
    return minimalNodes
  }
  serializeMinimalNodes(indent: boolean): string {
    const serializedNodes = this.toSerializableMinimalNodes()
    return JSON.stringify(serializedNodes, null, indent ? 2 : undefined)
  }
}

// Holds onto all the data for letting us override the parity for notes.
//
// beatOverrides is a dictionary, where the key is the song's beat truncated to 3 decimal places,
// and the value is a Foot[] array. Any value other than Foot.NONE indicates an override.
export class BeatOverrides {
  beatOverrides: { [key: string]: Foot[] } = {}
  columnCount: number

  constructor(columnCount: number) {
    this.columnCount = columnCount
  }

  shouldNodeBeOverridden(node: StepParityNode): boolean {
    if (this.hasBeatOverride(node.state.beat)) {
      const override = this.getBeatOverride(node.state.beat)
      for (let i = 0; i < override.length; i++) {
        if (override[i] != Foot.NONE && override[i] != node.state.columns[i]) {
          return true
        }
      }
    }
    return false
  }

  hasBeatOverride(beat: number): boolean {
    const beatStr = beat.toFixed(3)
    if (this.beatOverrides[beatStr] != undefined) {
      for (const f of this.beatOverrides[beatStr]) {
        if (f != Foot.NONE) {
          return true
        }
      }
    }
    return false
  }

  getBeatOverride(beat: number): Foot[] {
    const beatStr = beat.toFixed(3)
    if (this.beatOverrides[beatStr] != undefined) {
      return this.beatOverrides[beatStr]
    }
    const empty: Array<Foot> = []
    for (let i = 0; i < this.columnCount; i++) {
      empty.push(Foot.NONE)
    }
    return empty
  }

  getNoteOverride(beat: number, col: number): Foot {
    const beatStr = beat.toFixed(3)
    if (this.beatOverrides[beatStr] != undefined) {
      return this.beatOverrides[beatStr][col]
    }
    return Foot.NONE
  }

  addNoteOverride(beat: number, col: number, foot: Foot): boolean {
    const beatStr = beat.toFixed(3)
    if (this.beatOverrides[beatStr] == undefined) {
      this.beatOverrides[beatStr] = new Array(this.columnCount).fill(Foot.NONE)
    }
    // Check that this row doesn't already contain an override for the given foot. If so, return false
    if (
      foot != Foot.NONE &&
      this.beatOverrides[beatStr][col] != foot &&
      this.beatOverrides[beatStr].includes(foot)
    ) {
      return false
    }
    this.beatOverrides[beatStr][col] = foot
    return true
  }

  addBeatOverride(beat: number, feet: Foot[]): boolean {
    const beatStr = beat.toFixed(3)
    const footCount: { [key: number]: number } = {}
    let totalCount = 0
    for (const foot of feet) {
      footCount[foot] = (footCount[foot] || 0) + 1
      totalCount += 1
      if (foot != Foot.NONE && footCount[foot] > 1) {
        return false
      }
    }
    if (totalCount == 0) {
      return false
    }

    this.beatOverrides[beatStr] = feet
    return true
  }

  removeNoteOverride(beat: number, col: number): boolean {
    const beatStr = beat.toFixed(3)
    if (this.beatOverrides[beatStr] != undefined) {
      this.beatOverrides[beatStr][col] = Foot.NONE
    }
    return true
  }

  removeBeatOverride(beat: number): boolean {
    const beatStr = beat.toFixed(3)
    delete this.beatOverrides[beatStr]
    return true
  }

  setBeatOverrides(newBeatOverrides: { [key: string]: Foot[] }) {
    this.beatOverrides = newBeatOverrides
  }
  resetBeatOverrides() {
    this.beatOverrides = {}
  }

  getOverridesByRow(rows: Row[]): { [key: number]: Foot[] } {
    const rowOverrides: { [key: number]: Foot[] } = {}
    for (let r = 0; r < rows.length; r++) {
      if (this.hasBeatOverride(rows[r].beat)) {
        const override = this.getBeatOverride(rows[r].beat)
        rowOverrides[r] = override
      }
    }
    return rowOverrides
  }
}

// helper functions

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
  if (!arraysAreEqual(state1.combinedColumns, state2.combinedColumns)) {
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
