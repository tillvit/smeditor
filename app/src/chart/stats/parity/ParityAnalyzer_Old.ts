// Generates foot parity given notedata
// Original algorithm by Jewel, polished by tillvit

import { STAGE_LAYOUTS } from "./StageLayouts"

import { EventHandler } from "../../../util/EventHandler"
import { Chart } from "../../sm/Chart"
import { ChartAnalyzer } from "../ChartAnalyzer"
import {
  BeatOverrides,
  DEFAULT_WEIGHTS,
  Foot,
  State,
  StepParityGraph,
  StepParityNode,
} from "./ParityDataTypes"
import { ParityGenInternal } from "./ParityGenInternals"

export class ParityAnalyzer extends ChartAnalyzer {
  private layout
  private parityGenInternal: ParityGenInternal
  private isEnabled: boolean = false

  beatOverrides: BeatOverrides
  lastGraph?: StepParityGraph
  lastSelectedStates?: State[]
  lastParities: Foot[][] = []
  lastTechCounts: number[] = []

  private WEIGHTS: { [key: string]: number }

  constructor(chart: Chart) {
    super(chart)

    this.layout = STAGE_LAYOUTS[chart.gameType.id]
    this.beatOverrides = new BeatOverrides(this.layout.columnCount)
    this.parityGenInternal = new ParityGenInternal(chart.gameType.id)
    this.WEIGHTS = { ...DEFAULT_WEIGHTS }
  }

  help() {
    console.log(`Currently only compatible with dance-single.
Available commands:
analyze(): analyze the current chart

clear(): clear parity highlights`)
  }

  recalculate() {
    this.calculateAll()
  }

  // private isAnalyzing: boolean = false
  calculateAll() {
    // if (this.isAnalyzing) {
    //   return
    // }
    const notedata = this.chart.getNotedata()
    if (!notedata) return
    // this.isAnalyzing = true
    const { graph, selectedStates, parities, techCounts } =
      this.parityGenInternal.analyze(notedata, this.beatOverrides, this.WEIGHTS)

    if (this.lastSelectedStates) {
      const stateDifferences: string[] = []
      for (let i = 0; i < selectedStates.length; i++) {
        if (this.lastSelectedStates[i]?.idx != selectedStates[i].idx) {
          stateDifferences[i] =
            `${this.lastSelectedStates[i]?.idx} != ${selectedStates[i].idx}`
        } else {
          stateDifferences[i] = `${selectedStates[i].idx}`
        }
      }
      console.log("selectedStates diff")
      console.log(stateDifferences)
    }
    this.lastGraph = graph
    this.lastSelectedStates = selectedStates
    this.lastParities = parities
    this.lastTechCounts = techCounts

    // this.isAnalyzing = false
    EventHandler.emit("parityUpdated")
  }

  setEnabled(enabled: boolean) {
    this.isEnabled = enabled
  }

  getIsEnabled(): boolean {
    return this.isEnabled
  }

  clearState() {
    this.lastGraph = undefined
    this.lastSelectedStates = undefined
    this.lastParities = []
    this.beatOverrides = new BeatOverrides(this.layout.columnCount)
  }

  //
  // Methods for checking/setting overrides
  //

  hasBeatOverride(beat: number): boolean {
    return this.beatOverrides.hasBeatOverride(beat)
  }

  getBeatOverride(beat: number): Foot[] {
    return this.beatOverrides.getBeatOverride(beat)
  }

  getNoteOverride(beat: number, col: number): Foot {
    return this.beatOverrides.getNoteOverride(beat, col)
  }

  addNoteOverride(beat: number, col: number, foot: Foot): boolean {
    return this.beatOverrides.addNoteOverride(beat, col, foot)
  }

  addBeatOverride(beat: number, feet: Foot[]): boolean {
    return this.beatOverrides.addBeatOverride(beat, feet)
  }

  removeNoteOverride(beat: number, col: number): boolean {
    return this.beatOverrides.removeNoteOverride(beat, col)
  }

  removeBeatOverride(beat: number): boolean {
    return this.beatOverrides.removeBeatOverride(beat)
  }

  resetBeatOverrides() {
    this.beatOverrides = new BeatOverrides(this.layout.columnCount)
  }

  //
  // Retrieving various data by beat/row
  //

  getNodesForBeat(beat: number): StepParityNode[] {
    const nodesForBeat: StepParityNode[] = []

    if (this.lastGraph) {
      for (const node of this.lastGraph.nodes) {
        if (Math.abs(node.state.beat - beat) < 0.0001) {
          nodesForBeat.push(node)
        }
        if (node.state.beat > beat) {
          break
        }
      }
    }

    return nodesForBeat
  }

  getParityForBeat(beat: number): Foot[] | undefined {
    if (this.lastSelectedStates == undefined) {
      return undefined
    }
    for (const state of this.lastSelectedStates) {
      if (Math.abs(state.beat - beat) < 0.0001) {
        return state.columns
      }
      if (state.beat > beat) {
        break
      }
    }
    return undefined
  }

  getNodeForBeat(beat: number): StepParityNode | undefined {
    if (this.lastGraph == undefined || this.lastSelectedStates == undefined) {
      return undefined
    }

    for (const state of this.lastSelectedStates) {
      if (Math.abs(state.beat - beat) < 0.0001) {
        return this.lastGraph.addOrGetExistingNode(state)
      }
      if (state.beat > beat) {
        break
      }
    }
    return undefined
  }

  getAllNodesForBeat(beat: number): StepParityNode[] {
    if (this.lastGraph == undefined) {
      return []
    }

    const nodes: StepParityNode[] = []

    for (const node of this.lastGraph.nodes) {
      if (Math.abs(node.state.beat - beat) < 0.0001) {
        nodes.push(node)
      } else if (node.state.beat > beat) {
        break
      }
    }
    return nodes
  }

  getAllNodesForRow(row: number): StepParityNode[] {
    if (this.lastGraph == undefined) {
      return []
    }

    const nodes: StepParityNode[] = []

    for (const node of this.lastGraph.nodes) {
      if (node.state.rowIndex == row) {
        nodes.push(node)
      } else if (node.state.rowIndex > row) {
        break
      }
    }
    return nodes
  }

  getOverridesByRow() {
    const notedata = this.chart.getNotedata()
    if (!notedata) return []
    const rows = this.parityGenInternal.createRows(notedata)
    const overridesByRow = this.beatOverrides.getOverridesByRow(rows)
    return overridesByRow
  }

  // Loads pre-calculated note parity data from json string
  loadParityData(jsonString: string): boolean {
    const notedata = this.chart.getNotedata()
    if (!notedata) return false
    const rows = this.parityGenInternal.createRows(notedata)
    const parities = this.deserializeParityData(jsonString)
    if (parities == undefined) {
      return false
    }
    const paritiesWithoutOverrides = this.parityGenInternal.generateParities(
      notedata,
      undefined
    )

    // This is mostly a sanity check
    if (
      parities.length != rows.length ||
      parities.length != paritiesWithoutOverrides.length
    ) {
      return false
    }

    // Now that we've loaded the json data, we need to figure out if it represents any
    // notes that were overridden.
    const rowDifferences = this.getParityDifferences(
      paritiesWithoutOverrides,
      parities
    )
    // And then map those differences to beat instead of row

    const beatDifferences: { [key: string]: Foot[] } = {}
    for (const rowIndex in rowDifferences) {
      const beatStr = rows[rowIndex].beat.toFixed(3)
      beatDifferences[beatStr] = rowDifferences[rowIndex]
    }
    this.lastParities = parities
    this.beatOverrides.setBeatOverrides(beatDifferences)
    this.parityGenInternal.setNoteParity(
      rows,
      this.lastParities,
      this.beatOverrides
    )
    return true
  }

  // Returns rows that differ between p1 and p2
  // For a given row, the values of p2 that differ from p1 are returned
  // For examples, given p1 = [[0010], [3100]], p2 = [[0010], [2100]]
  // returns {1: [2000]}
  getParityDifferences(p1: Foot[][], p2: Foot[][]): { [key: number]: Foot[] } {
    const rowDifferences: { [key: number]: Foot[] } = {}

    for (let r = 0; r < p1.length; r++) {
      const diffs: Foot[] = []
      let hasDifference: boolean = false
      for (let c = 0; c < p1[r].length; c++) {
        if (p1[r][c] != p2[r][c]) {
          diffs.push(p2[r][c])
          hasDifference = true
        } else {
          diffs.push(Foot.NONE)
        }
      }
      if (hasDifference) {
        rowDifferences[r] = diffs
      }
    }
    return rowDifferences
  }

  // This just returns the `columns` for each row, indicating the position of
  // each foot for a given row
  // This just returns the `columns` for each row, indicating the position of
  // each foot for a given row
  serializeParityData(indent: boolean = false): string {
    return JSON.stringify(this.lastParities, null, indent ? 2 : undefined)
  }

  deserializeParityData(jsonString: string): Foot[][] | undefined {
    try {
      const deserialized: Foot[][] = JSON.parse(jsonString)
      return deserialized
    } catch (e) {
      return undefined
    }
  }

  serializeStepGraph(indent: boolean = false): string {
    if (this.lastGraph != undefined) {
      return this.lastGraph.serialized(indent)
    }
    return ""
  }

  reset() {
    const notedata = this.chart.getNotedata()
    if (!notedata) return
    notedata.forEach(note => (note.parity = undefined))
  }

  //
  // Getting/setting weights
  //

  getWeights(): { [key: string]: number } {
    const weightsCopy: { [key: string]: number } = JSON.parse(
      JSON.stringify(this.WEIGHTS)
    )
    return weightsCopy
  }

  getDefaultWeights(): { [key: string]: number } {
    const weightsCopy: { [key: string]: number } = JSON.parse(
      JSON.stringify(DEFAULT_WEIGHTS)
    )
    return weightsCopy
  }

  updateWeights(newWeights: { [key: string]: number }) {
    for (const k in this.WEIGHTS) {
      this.WEIGHTS[k] = newWeights[k] || this.WEIGHTS[k]
    }
  }

  resetWeights() {
    this.updateWeights(DEFAULT_WEIGHTS)
  }
}
