import { GameType } from "../GameTypeRegistry"
import { NoteSkinOptions } from "./NoteSkin"

interface RegistryData {
  name: string
  gameTypes: string[]
  path: string
}

export class NoteSkinRegistry {
  private static noteskins = new Map<string, Map<string, RegistryData>>()

  static register(options: RegistryData) {
    for (const gameType of new Set(options.gameTypes)) {
      if (!NoteSkinRegistry.noteskins.has(gameType)) {
        NoteSkinRegistry.noteskins.set(gameType, new Map())
      }
      NoteSkinRegistry.noteskins.get(gameType)!.set(options.name, options)
    }
  }

  static async getNoteSkin(gameType: GameType, name: string) {
    const gameTypeNoteSkins = this.noteskins.get(gameType.id)
    if (!gameTypeNoteSkins || gameTypeNoteSkins.size == 0) return
    const skin =
      gameTypeNoteSkins.get(name) ?? [...gameTypeNoteSkins.values()][0]
    return (await import(skin.path)).default as NoteSkinOptions
  }

  static getNoteSkins() {
    return this.noteskins
  }
}

NoteSkinRegistry.register({
  name: "default",
  gameTypes: [
    "dance-single",
    "dance-double",
    "dance-couple",
    "dance-solo",
    "dance-solodouble",
    "dance-threepanel",
    "dance-threedouble",
  ],
  path: "./dance/default/NoteSkin",
})
NoteSkinRegistry.register({
  name: "ddr",
  gameTypes: [
    "dance-single",
    "dance-double",
    "dance-couple",
    "dance-solo",
    "dance-solodouble",
    "dance-threepanel",
    "dance-threedouble",
  ],
  path: "./dance/ddr/NoteSkin",
})
NoteSkinRegistry.register({
  name: "metal",
  gameTypes: [
    "dance-single",
    "dance-double",
    "dance-couple",
    "dance-solo",
    "dance-solodouble",
    "dance-threepanel",
    "dance-threedouble",
  ],
  path: "./dance/metal/NoteSkin",
})
NoteSkinRegistry.register({
  name: "pastel",
  gameTypes: [
    "dance-single",
    "dance-double",
    "dance-couple",
    "dance-solo",
    "dance-solodouble",
    "dance-threepanel",
    "dance-threedouble",
  ],
  path: "./dance/pastel/NoteSkin",
})
NoteSkinRegistry.register({
  name: "default",
  gameTypes: ["pump-single"],
  path: "./pump/default/NoteSkin",
})
