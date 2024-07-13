import { GameType } from "../GameTypeRegistry"
import { NoteSkinOptions } from "./NoteSkin"
import { DanceDefaultNoteSkin } from "./dance/default/NoteSkin"
import { DanceMetalNoteSkin } from "./dance/metal/NoteSkin"
import { PumpDefaultNoteSkin } from "./pump/default/NoteSkin"

export class NoteSkinRegistry {
  private static noteskins = new Map<string, Map<string, NoteSkinOptions>>()

  static register(options: NoteSkinOptions) {
    for (const gameType of new Set(options.gameTypes)) {
      if (!NoteSkinRegistry.noteskins.has(gameType)) {
        NoteSkinRegistry.noteskins.set(gameType, new Map())
      }
      NoteSkinRegistry.noteskins.get(gameType)!.set(options.name, options)
    }
  }

  static getNoteSkin(
    gameType: GameType,
    name: string
  ): NoteSkinOptions | undefined {
    const gameTypeNoteSkins = this.noteskins.get(gameType.id)
    if (!gameTypeNoteSkins || gameTypeNoteSkins.size == 0) return
    return gameTypeNoteSkins.get(name) ?? [...gameTypeNoteSkins.values()][0]
  }

  static getNoteSkins() {
    return this.noteskins
  }
}

NoteSkinRegistry.register(DanceDefaultNoteSkin)
NoteSkinRegistry.register(DanceMetalNoteSkin)
NoteSkinRegistry.register(PumpDefaultNoteSkin)
