import { Notedata } from "../../sm/NoteTypes"
import { Foot, Row } from "./ParityDataTypes"
import { ParityGraphNode } from "./ParityInternals"

export type DebugUpdateData = {
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
}

export interface ParityBaseMessage {
  id: number
}

export interface ParityBaseOutboundMessage extends ParityBaseMessage {
  success: boolean
  error?: string
}

export interface ParityInboundInitMessage extends ParityBaseMessage {
  type: "init"
  gameType: string
}

export interface ParityOutboundInitMessage extends ParityBaseOutboundMessage {
  type: "init"
}

export interface ParityInboundComputeMessage extends ParityBaseMessage {
  type: "compute"
  startBeat: number
  endBeat: number
  notedata: Notedata
  debug: boolean
}

export interface ParityOutboundComputeMessage
  extends ParityBaseOutboundMessage {
  type: "compute"
  parityLabels: Map<string, Foot> | null
  debug?: DebugUpdateData
}

export interface ParityInboundGetDebugMessage extends ParityBaseMessage {
  type: "getDebug"
}

export interface ParityOutboundGetDebugMessage
  extends ParityBaseOutboundMessage {
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
