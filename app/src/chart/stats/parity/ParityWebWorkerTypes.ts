import { Notedata } from "../../sm/NoteTypes"
import {
  Foot,
  ParityState,
  Row,
  TechCategory,
  TechErrors,
} from "./ParityDataTypes"
import { ParityGraphNode } from "./ParityInternals"

export type ParityDebugUpdateData = {
  removedRowsStart: number
  removedRowsEnd: number
  newRows: Row[]
  newStates: {
    beat: number
    nodes: ParityGraphNode[]
  }[]

  bestPath: string[]
  bestPathCost: number
  bestPathSet: Set<string>
  edgeCacheSize: number
  stats: ParityDebugStats
}

export type ParityDebugData = {
  edgeCacheSize: number
  nodeMap: Map<string, ParityGraphNode>
  bestPath: string[]
  bestPathCost: number
  bestPathSet: Set<string>
  notedataRows: Row[]
  nodeRows: { beat: number; nodes: ParityGraphNode[] }[]
  stats: ParityDebugStats
}

export type ParityDebugStats = {
  lastUpdatedRowStart: number
  lastUpdatedOldRowEnd: number
  lastUpdatedRowEnd: number
  rowUpdateTime: number
  lastUpdatedNodeStart: number
  lastUpdatedNodeEnd: number
  nodeUpdateTime: number
  createdNodes: number
  createdEdges: number
  calculatedEdges: number
  cachedEdges: number
  edgeUpdateTime: number
  cachedBestRows: number
  pathUpdateTime: number
  rowStatsUpdateTime: number
}

export interface ParityBaseMessage {
  id: number
}

export interface ParityInboundInitMessage extends ParityBaseMessage {
  type: "init"
  gameType: string
}

export interface ParityOutboundInitMessage extends ParityBaseMessage {
  type: "init"
}

export interface ParityInboundComputeMessage extends ParityBaseMessage {
  type: "compute"
  startBeat: number
  endBeat: number
  notedata: Notedata
  debug: boolean
}

export interface ParityComputeData {
  parityLabels: Map<string, Foot>
  states: ParityState[]
  rowTimestamps: { beat: number; second: number }[]
  techRows: Set<TechCategory>[]
  techErrors: Map<number, Set<TechErrors>>
  facingRows: number[]
}

export interface ParityOutboundComputeMessage
  extends ParityBaseMessage,
    ParityComputeData {
  type: "compute"
  debug?: ParityDebugUpdateData
}

export interface ParityInboundGetDebugMessage extends ParityBaseMessage {
  type: "getDebug"
}

export interface ParityOutboundErrorMessage extends ParityBaseMessage {
  type: "error"
  error: string
}

export interface ParityOutboundGetDebugMessage extends ParityBaseMessage {
  type: "getDebug"
  data: ParityDebugData | null
}
export type ParityInboundMessage =
  | ParityInboundInitMessage
  | ParityInboundComputeMessage
  | ParityInboundGetDebugMessage

export type ParityOutboundMessage =
  | ParityOutboundInitMessage
  | ParityOutboundComputeMessage
  | ParityOutboundGetDebugMessage
  | ParityOutboundErrorMessage
