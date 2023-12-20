import { NoteType } from "../sm/NoteTypes"
import { GameLogic } from "./base/GameLogic"
import { NotedataParser } from "./base/NotedataParser"

import { BasicGameLogic } from "./common/BasicGameLogic"
import { BasicNotedataParser } from "./common/BasicNotedataParser"

export interface GameType {
  id: string
  numCols: number
  columnWidths: number[]
  notefieldWidth: number
  columnRotations: number[]
  gameLogic: GameLogic
  parser: NotedataParser
  editNoteTypes: NoteType[]
  flipColumns: {
    horizontal: number[]
    vertical: number[]
  }
}

export class GameTypeRegistry {
  private static gameTypes: Record<string, GameType> = {}
  private static priority: GameType[] = []

  static register(gameType: Omit<GameType, "notefieldWidth">) {
    ;(gameType as GameType).notefieldWidth = gameType.columnWidths.reduce(
      (a, b) => a + b,
      0
    )
    GameTypeRegistry.gameTypes[gameType.id] = gameType as GameType
    this.priority.push(gameType as GameType)
  }

  static getPriority(): GameType[] {
    return this.priority
  }

  static getGameType(id: string): GameType | undefined {
    return GameTypeRegistry.gameTypes[id]
  }

  static getTypes() {
    return this.gameTypes
  }
}

GameTypeRegistry.register({
  id: "dance-single",
  numCols: 4,
  columnWidths: [64, 64, 64, 64],
  columnRotations: [0, -90, 90, 180],
  gameLogic: new BasicGameLogic(),
  parser: new BasicNotedataParser(),
  editNoteTypes: ["Tap", "Mine", "Fake", "Lift"],
  flipColumns: {
    horizontal: [3, 1, 2, 0],
    vertical: [0, 2, 1, 3],
  },
})

GameTypeRegistry.register({
  id: "dance-double",
  numCols: 8,
  columnWidths: [64, 64, 64, 64, 64, 64, 64, 64],
  columnRotations: [0, -90, 90, 180, 0, -90, 90, 180],
  gameLogic: new BasicGameLogic(),
  parser: new BasicNotedataParser(),
  editNoteTypes: ["Tap", "Mine", "Fake", "Lift"],
  flipColumns: {
    horizontal: [3, 1, 2, 0, 7, 5, 6, 4],
    vertical: [0, 2, 1, 3, 4, 6, 5, 7],
  },
})

GameTypeRegistry.register({
  id: "dance-couple",
  numCols: 8,
  columnWidths: [64, 64, 64, 64, 64, 64, 64, 64],
  columnRotations: [0, -90, 90, 180, 0, -90, 90, 180],
  gameLogic: new BasicGameLogic(),
  parser: new BasicNotedataParser(),
  editNoteTypes: ["Tap", "Mine", "Fake", "Lift"],
  flipColumns: {
    horizontal: [3, 1, 2, 0, 7, 5, 6, 4],
    vertical: [0, 2, 1, 3, 4, 6, 5, 7],
  },
})

GameTypeRegistry.register({
  id: "dance-solo",
  numCols: 6,
  columnWidths: [64, 64, 64, 64, 64, 64],
  columnRotations: [0, 45, -90, 90, 135, 180],
  gameLogic: new BasicGameLogic(),
  parser: new BasicNotedataParser(),
  editNoteTypes: ["Tap", "Mine", "Fake", "Lift"],
  flipColumns: {
    horizontal: [5, 4, 2, 3, 1, 0],
    vertical: [0, 1, 3, 2, 4, 5],
  },
})

GameTypeRegistry.register({
  id: "dance-solodouble",
  numCols: 12,
  columnWidths: [64, 64, 64, 64, 64, 64, 64, 64, 64, 64, 64, 64],
  columnRotations: [0, 45, -90, 90, 135, 180, 0, 45, -90, 90, 135, 180],
  gameLogic: new BasicGameLogic(),
  parser: new BasicNotedataParser(),
  editNoteTypes: ["Tap", "Mine", "Fake", "Lift"],
  flipColumns: {
    horizontal: [5, 4, 2, 3, 1, 0, 11, 10, 8, 9, 7, 6],
    vertical: [0, 1, 3, 2, 4, 5, 6, 7, 9, 8, 10, 11],
  },
})

GameTypeRegistry.register({
  id: "dance-3panel",
  numCols: 3,
  columnWidths: [64, 64, 64],
  columnRotations: [45, -90, 135],
  gameLogic: new BasicGameLogic(),
  parser: new BasicNotedataParser(),
  editNoteTypes: ["Tap", "Mine", "Fake", "Lift"],
  flipColumns: {
    horizontal: [2, 1, 0],
    vertical: [0, 1, 2],
  },
})
