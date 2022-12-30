import { ChartRenderer } from "../ChartRenderer"
import { GameLogic } from "./base/GameLogic"
import { NotedataParser } from "./base/NotedataParser"
import { Notefield } from "./base/Notefield"
import { DanceGameLogic } from "./dance/DanceGameLogic"
import { DanceNotedataParser } from "./dance/DanceNotedataParser"
import { DanceNotefield } from "./dance/DanceNotefield"

export interface GameType {
  id: string,
  numCols: number,
  gameLogic: GameLogic,
  parser: NotedataParser,
  notefield: new (renderer: ChartRenderer) => Notefield,
  editNoteTypes: string[]
}

export class GameTypeRegistry {
  private static gameTypes: Record<string, GameType> = {}
 
  static register(gameType: GameType) {
    GameTypeRegistry.gameTypes[gameType.id] = gameType
  }

  static getGameType(id: string): GameType | undefined {
    return GameTypeRegistry.gameTypes[id]
  }
}

GameTypeRegistry.register({
  id: "dance-single",
  numCols: 4,
  gameLogic: new DanceGameLogic,
  parser: new DanceNotedataParser,
  notefield: DanceNotefield,
  editNoteTypes: ["Tap", "Mine", "Fake", "Lift"]
})

