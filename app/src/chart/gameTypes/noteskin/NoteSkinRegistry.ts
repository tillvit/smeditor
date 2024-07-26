import { WaterfallManager } from "../../../gui/element/WaterfallManager"
import { GameType } from "../GameTypeRegistry"
import { NoteskinOptions } from "./Noteskin"

interface RegistryData {
  id: string
  gameTypes: string[]
  path: string
  title?: string
  subtitle?: string
}

export class NoteskinRegistry {
  private static noteskins = new Map<string, Map<string, RegistryData>>()

  static register(options: RegistryData) {
    for (const gameType of new Set(options.gameTypes)) {
      if (!NoteskinRegistry.noteskins.has(gameType)) {
        NoteskinRegistry.noteskins.set(gameType, new Map())
      }
      NoteskinRegistry.noteskins.get(gameType)!.set(options.id, options)
    }
  }

  static async getNoteskin(gameType: GameType, id: string) {
    const gameTypeNoteskins = this.noteskins.get(gameType.id)
    if (!gameTypeNoteskins || gameTypeNoteskins.size == 0) return
    const skin = gameTypeNoteskins.get(id) ?? [...gameTypeNoteskins.values()][0]
    if (!gameTypeNoteskins.get(id))
      WaterfallManager.createFormatted(
        `Couldn't find the noteskin ${id}!`,
        "warn"
      )
    return (await (
      await import(`${skin.path}/Noteskin`)
    ).default) as NoteskinOptions
  }

  static getNoteskinData(gameType: GameType, id: string) {
    const gameTypeNoteskins = this.noteskins.get(gameType.id)
    if (!gameTypeNoteskins || gameTypeNoteskins.size == 0) return
    const skin = gameTypeNoteskins.get(id) ?? [...gameTypeNoteskins.values()][0]
    return skin
  }

  static getNoteskins() {
    return this.noteskins
  }

  static getPreviewUrl(gameType: GameType, id: string) {
    return new URL(
      `${this.getNoteskinData(gameType, id)?.path}/preview.png`,
      import.meta.url
    ).href
  }
}

NoteskinRegistry.register({
  id: "default",
  gameTypes: [
    "dance-single",
    "dance-double",
    "dance-couple",
    "dance-solo",
    "dance-solodouble",
    "dance-threepanel",
    "dance-threedouble",
  ],
  path: "./dance/default",
})
NoteskinRegistry.register({
  id: "cf-chrome",
  gameTypes: [
    "dance-single",
    "dance-double",
    "dance-couple",
    "dance-solo",
    "dance-solodouble",
    "dance-threepanel",
    "dance-threedouble",
  ],
  path: "./dance/cf-chrome",
})
NoteskinRegistry.register({
  id: "ddr",
  gameTypes: [
    "dance-single",
    "dance-double",
    "dance-couple",
    "dance-solo",
    "dance-solodouble",
    "dance-threepanel",
    "dance-threedouble",
  ],
  path: "./dance/ddr",
})
NoteskinRegistry.register({
  id: "ddr",
  gameTypes: [
    "dance-single",
    "dance-double",
    "dance-couple",
    "dance-solo",
    "dance-solodouble",
    "dance-threepanel",
    "dance-threedouble",
  ],
  path: "./dance/ddr",
})
NoteskinRegistry.register({
  id: "ddr-itgcolors",
  gameTypes: [
    "dance-single",
    "dance-double",
    "dance-couple",
    "dance-solo",
    "dance-solodouble",
    "dance-threepanel",
    "dance-threedouble",
  ],
  path: "./dance/ddr-itgcolors",
})
NoteskinRegistry.register({
  id: "metal",
  gameTypes: [
    "dance-single",
    "dance-double",
    "dance-couple",
    "dance-solo",
    "dance-solodouble",
    "dance-threepanel",
    "dance-threedouble",
  ],
  path: "./dance/metal",
})
NoteskinRegistry.register({
  id: "pastel",
  gameTypes: [
    "dance-single",
    "dance-double",
    "dance-couple",
    "dance-solo",
    "dance-solodouble",
    "dance-threepanel",
    "dance-threedouble",
  ],
  path: "./dance/pastel",
})
NoteskinRegistry.register({
  id: "dividebyzero",
  gameTypes: [
    "dance-single",
    "dance-double",
    "dance-couple",
    "dance-solo",
    "dance-solodouble",
    "dance-threepanel",
    "dance-threedouble",
  ],
  path: "./dance/dividebyzero",
})
NoteskinRegistry.register({
  id: "subtractbyzero",
  gameTypes: [
    "dance-single",
    "dance-double",
    "dance-couple",
    "dance-solo",
    "dance-solodouble",
    "dance-threepanel",
    "dance-threedouble",
  ],
  path: "./dance/subtractbyzero",
})
NoteskinRegistry.register({
  id: "sm4",
  gameTypes: [
    "dance-single",
    "dance-double",
    "dance-couple",
    "dance-solo",
    "dance-solodouble",
    "dance-threepanel",
    "dance-threedouble",
  ],
  path: "./dance/sm4",
})
NoteskinRegistry.register({
  id: "sm4-bold",
  gameTypes: [
    "dance-single",
    "dance-double",
    "dance-couple",
    "dance-solo",
    "dance-solodouble",
    "dance-threepanel",
    "dance-threedouble",
  ],
  path: "./dance/sm4-bold",
})
NoteskinRegistry.register({
  id: "starlight-vivid",
  gameTypes: [
    "dance-single",
    "dance-double",
    "dance-couple",
    "dance-solo",
    "dance-solodouble",
    "dance-threepanel",
    "dance-threedouble",
  ],
  path: "./dance/starlight-vivid",
})

NoteskinRegistry.register({
  id: "default",
  gameTypes: [
    "pump-single",
    "pump-double",
    "pump-couple",
    "pump-versus",
    "pump-halfdouble",
  ],
  path: "./pump/default",
})
NoteskinRegistry.register({
  id: "fourv2",
  gameTypes: [
    "pump-single",
    "pump-double",
    "pump-couple",
    "pump-versus",
    "pump-halfdouble",
  ],
  path: "./pump/fourv2",
})

NoteskinRegistry.register({
  id: "prime",
  gameTypes: [
    "pump-single",
    "pump-double",
    "pump-couple",
    "pump-versus",
    "pump-halfdouble",
  ],
  path: "./pump/prime",
})
