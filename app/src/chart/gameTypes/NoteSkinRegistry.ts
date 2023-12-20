import { GameType } from "./GameTypeRegistry"
import { NoteSkinOptions } from "./base/Noteskin"
import { DanceDefaultNoteskin } from "./dance/default/DanceDefaultNoteskin"

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
    const gameTypeNoteskins = this.noteskins.get(gameType.id)
    if (!gameTypeNoteskins || gameTypeNoteskins.size == 0) return
    return gameTypeNoteskins.get(name) ?? [...gameTypeNoteskins.values()][0]
  }

  static getNoteSkins() {
    return this.noteskins
  }
}

NoteSkinRegistry.register(DanceDefaultNoteskin)
