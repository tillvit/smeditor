import { WaterfallManager } from "../../../gui/element/WaterfallManager"
import { GameType } from "../GameTypeRegistry"
import { NoteskinOptions } from "./Noteskin"

interface RegistryData {
  name: string
  gameTypes: string[]
  path: string
}

export class NoteskinRegistry {
  private static noteskins = new Map<string, Map<string, RegistryData>>()

  static register(options: RegistryData) {
    for (const gameType of new Set(options.gameTypes)) {
      if (!NoteskinRegistry.noteskins.has(gameType)) {
        NoteskinRegistry.noteskins.set(gameType, new Map())
      }
      NoteskinRegistry.noteskins.get(gameType)!.set(options.name, options)
    }
  }

  static async getNoteskin(gameType: GameType, name: string) {
    const gameTypeNoteskins = this.noteskins.get(gameType.id)
    if (!gameTypeNoteskins || gameTypeNoteskins.size == 0) return
    const skin =
      gameTypeNoteskins.get(name) ?? [...gameTypeNoteskins.values()][0]
    if (!gameTypeNoteskins.get(name))
      WaterfallManager.createFormatted(
        `Couldn't find the noteskin ${name}!`,
        "warn"
      )
    return (await (
      await import(skin.path)
    ).default) as NoteskinOptions
  }

  static getNoteskinData(gameType: GameType, name: string) {
    const gameTypeNoteskins = this.noteskins.get(gameType.id)
    if (!gameTypeNoteskins || gameTypeNoteskins.size == 0) return
    const skin =
      gameTypeNoteskins.get(name) ?? [...gameTypeNoteskins.values()][0]
    return skin
  }

  static getNoteskins() {
    return this.noteskins
  }

  // static generatePreview(gameType: string, name: string) {
  //   const ch = new Chart(window.app.chartManager.loadedSM!)
  //   ch.gameType = GameTypeRegistry.getGameType(gameType)!
  //   window.app.chartManager.chartView.reloadNotefield()
  // }
}

NoteskinRegistry.register({
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
  path: "./dance/default/Noteskin",
})
NoteskinRegistry.register({
  name: "cf-chrome",
  gameTypes: [
    "dance-single",
    "dance-double",
    "dance-couple",
    "dance-solo",
    "dance-solodouble",
    "dance-threepanel",
    "dance-threedouble",
  ],
  path: "./dance/cf-chrome/Noteskin",
})
NoteskinRegistry.register({
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
  path: "./dance/ddr/Noteskin",
})
NoteskinRegistry.register({
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
  path: "./dance/ddr/Noteskin",
})
NoteskinRegistry.register({
  name: "ddr-itgcolors",
  gameTypes: [
    "dance-single",
    "dance-double",
    "dance-couple",
    "dance-solo",
    "dance-solodouble",
    "dance-threepanel",
    "dance-threedouble",
  ],
  path: "./dance/ddr-itgcolors/Noteskin",
})
NoteskinRegistry.register({
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
  path: "./dance/metal/Noteskin",
})
NoteskinRegistry.register({
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
  path: "./dance/pastel/Noteskin",
})
NoteskinRegistry.register({
  name: "dividebyzero",
  gameTypes: [
    "dance-single",
    "dance-double",
    "dance-couple",
    "dance-solo",
    "dance-solodouble",
    "dance-threepanel",
    "dance-threedouble",
  ],
  path: "./dance/dividebyzero/Noteskin",
})
NoteskinRegistry.register({
  name: "subtractbyzero",
  gameTypes: [
    "dance-single",
    "dance-double",
    "dance-couple",
    "dance-solo",
    "dance-solodouble",
    "dance-threepanel",
    "dance-threedouble",
  ],
  path: "./dance/subtractbyzero/Noteskin",
})
NoteskinRegistry.register({
  name: "sm4",
  gameTypes: [
    "dance-single",
    "dance-double",
    "dance-couple",
    "dance-solo",
    "dance-solodouble",
    "dance-threepanel",
    "dance-threedouble",
  ],
  path: "./dance/sm4/Noteskin",
})
NoteskinRegistry.register({
  name: "sm4-bold",
  gameTypes: [
    "dance-single",
    "dance-double",
    "dance-couple",
    "dance-solo",
    "dance-solodouble",
    "dance-threepanel",
    "dance-threedouble",
  ],
  path: "./dance/sm4-bold/Noteskin",
})
NoteskinRegistry.register({
  name: "starlight-vivid",
  gameTypes: [
    "dance-single",
    "dance-double",
    "dance-couple",
    "dance-solo",
    "dance-solodouble",
    "dance-threepanel",
    "dance-threedouble",
  ],
  path: "./dance/starlight-vivid/Noteskin",
})

NoteskinRegistry.register({
  name: "default",
  gameTypes: [
    "pump-single",
    "pump-double",
    "pump-couple",
    "pump-versus",
    "pump-halfdouble",
  ],
  path: "./pump/default/Noteskin",
})
NoteskinRegistry.register({
  name: "fourv2",
  gameTypes: [
    "pump-single",
    "pump-double",
    "pump-couple",
    "pump-versus",
    "pump-halfdouble",
  ],
  path: "./pump/fourv2/Noteskin",
})

NoteskinRegistry.register({
  name: "prime",
  gameTypes: [
    "pump-single",
    "pump-double",
    "pump-couple",
    "pump-versus",
    "pump-halfdouble",
  ],
  path: "./pump/prime/Noteskin",
})
