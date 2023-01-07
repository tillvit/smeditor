import { ChartRenderer } from "../ChartRenderer"
import { GameLogic } from "./base/GameLogic"
import { NotedataParser } from "./base/NotedataParser"
import { Notefield } from "./base/Notefield"
import { BasicGameLogic } from "./common/BasicGameLogic"
import { BasicNotedataParser } from "./common/BasicNotedataParser"
import { DanceNotefield } from "./dance/DanceNotefield"

export interface GameType {
  id: string
  numCols: number
  notefieldWidth: number
  gameLogic: GameLogic
  parser: NotedataParser
  notefield: new (renderer: ChartRenderer) => Notefield
  editNoteTypes: string[]
}

export class GameTypeRegistry {
  private static gameTypes: Record<string, GameType> = {}
  private static priority: GameType[] = []

  static register(gameType: GameType) {
    GameTypeRegistry.gameTypes[gameType.id] = gameType
    this.priority.push(gameType)
  }

  static getPriority(): GameType[] {
    return this.priority
  }

  static getGameType(id: string): GameType | undefined {
    return GameTypeRegistry.gameTypes[id]
  }
}

GameTypeRegistry.register({
  id: "dance-single",
  numCols: 4,
  notefieldWidth: 4 * 64,
  gameLogic: new BasicGameLogic(),
  parser: new BasicNotedataParser(),
  notefield: DanceNotefield,
  editNoteTypes: ["Tap", "Mine", "Fake", "Lift"],
})

GameTypeRegistry.register({
  id: "dance-double",
  numCols: 8,
  notefieldWidth: 8 * 64,
  gameLogic: new BasicGameLogic(),
  parser: new BasicNotedataParser(),
  notefield: DanceNotefield,
  editNoteTypes: ["Tap", "Mine", "Fake", "Lift"],
})

GameTypeRegistry.register({
  id: "dance-couple",
  numCols: 8,
  notefieldWidth: 8 * 64,
  gameLogic: new BasicGameLogic(),
  parser: new BasicNotedataParser(),
  notefield: DanceNotefield,
  editNoteTypes: ["Tap", "Mine", "Fake", "Lift"],
})

GameTypeRegistry.register({
  id: "dance-solo",
  numCols: 6,
  notefieldWidth: 6 * 64,
  gameLogic: new BasicGameLogic(),
  parser: new BasicNotedataParser(),
  notefield: DanceNotefield,
  editNoteTypes: ["Tap", "Mine", "Fake", "Lift"],
})

GameTypeRegistry.register({
  id: "dance-solodouble",
  numCols: 12,
  notefieldWidth: 12 * 64,
  gameLogic: new BasicGameLogic(),
  parser: new BasicNotedataParser(),
  notefield: DanceNotefield,
  editNoteTypes: ["Tap", "Mine", "Fake", "Lift"],
})

GameTypeRegistry.register({
  id: "dance-3panel",
  numCols: 3,
  notefieldWidth: 3 * 64,
  gameLogic: new BasicGameLogic(),
  parser: new BasicNotedataParser(),
  notefield: DanceNotefield,
  editNoteTypes: ["Tap", "Mine", "Fake", "Lift"],
})
