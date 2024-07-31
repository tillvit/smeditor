import { WaterfallManager } from "../../../gui/element/WaterfallManager"
import { GameType } from "../GameTypeRegistry"
import { NoteskinOptions } from "./Noteskin"

interface RegistryData {
  id: string
  gameTypes: string[]
  load: () => Promise<NoteskinOptions>
  preview: string
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

  static async getNoteskin(
    gameType: GameType,
    id: string
  ): Promise<NoteskinOptions | undefined> {
    const gameTypeNoteskins = this.noteskins.get(gameType.id)
    if (!gameTypeNoteskins || gameTypeNoteskins.size == 0) return
    const skin = gameTypeNoteskins.get(id) ?? [...gameTypeNoteskins.values()][0]
    if (!gameTypeNoteskins.get(id))
      WaterfallManager.createFormatted(
        `Couldn't find the noteskin ${id}!`,
        "warn"
      )
    return await skin.load()
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
    return this.getNoteskinData(gameType, id)!.preview
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
  load: async () => (await import(`./dance/default/Noteskin`)).default,
  preview: new URL(`./dance/default/preview.png`, import.meta.url).href,
  title: "Scalable",
  subtitle: "Pete-Lawrence",
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
  load: async () => (await import(`./dance/cf-chrome/Noteskin`)).default,
  preview: new URL(`./dance/cf-chrome/preview.png`, import.meta.url).href,
  title: "CF_CHROME",
  subtitle: "Pete-Lawrence",
})
NoteskinRegistry.register({
  id: "ddr-note",
  gameTypes: [
    "dance-single",
    "dance-double",
    "dance-couple",
    "dance-solo",
    "dance-solodouble",
    "dance-threepanel",
    "dance-threedouble",
  ],
  load: async () => (await import(`./dance/ddr-note/Noteskin`)).default,
  preview: new URL(`./dance/ddr-note/preview.png`, import.meta.url).href,
  title: "DDR-Note",
  subtitle: "Pete-Lawrence",
})
NoteskinRegistry.register({
  id: "ddr-note-itg",
  gameTypes: [
    "dance-single",
    "dance-double",
    "dance-couple",
    "dance-solo",
    "dance-solodouble",
    "dance-threepanel",
    "dance-threedouble",
  ],
  load: async () => (await import(`./dance/ddr-note-itg/Noteskin`)).default,
  preview: new URL(`./dance/ddr-note-itg/preview.png`, import.meta.url).href,
  title: "DDR-Note (ITG quants)",
  subtitle: "Pete-Lawrence",
})
NoteskinRegistry.register({
  id: "ddr-rainbow",
  gameTypes: ["dance-single", "dance-double", "dance-couple"],
  load: async () => (await import(`./dance/ddr-rainbow/Noteskin`)).default,
  preview: new URL(`./dance/ddr-rainbow/preview.png`, import.meta.url).href,
  title: "DDR-Rainbow",
  subtitle: "LemmaEOF",
})
NoteskinRegistry.register({
  id: "ddr-rainbow-itg",
  gameTypes: ["dance-single", "dance-double", "dance-couple"],
  load: async () => (await import(`./dance/ddr-rainbow-itg/Noteskin`)).default,
  preview: new URL(`./dance/ddr-rainbow-itg/preview.png`, import.meta.url).href,
  title: "DDR-Rainbow (ITG quants)",
  subtitle: "LemmaEOF",
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
  load: async () => (await import(`./dance/metal/Noteskin`)).default,
  preview: new URL(`./dance/metal/preview.png`, import.meta.url).href,
  title: "Metal",
  subtitle: "Pete-Lawrence",
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
  load: async () => (await import(`./dance/pastel/Noteskin`)).default,
  preview: new URL(`./dance/pastel/preview.png`, import.meta.url).href,
  title: "Pastel",
  subtitle: "halcyoniix",
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
  load: async () => (await import(`./dance/dividebyzero/Noteskin`)).default,
  preview: new URL(`./dance/dividebyzero/preview.png`, import.meta.url).href,
  title: "DivideByZero",
  subtitle: "MinaciousGrace",
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
  load: async () => (await import(`./dance/subtractbyzero/Noteskin`)).default,
  preview: new URL(`./dance/subtractbyzero/preview.png`, import.meta.url).href,
  title: "SubtractByZero",
  subtitle: "qwertyzoro/Vague",
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
  load: async () => (await import(`./dance/sm4/Noteskin`)).default,
  preview: new URL(`./dance/sm4/preview.png`, import.meta.url).href,
  title: "SM4",
  subtitle: "from SM4",
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
  load: async () => (await import(`./dance/sm4-bold/Noteskin`)).default,
  preview: new URL(`./dance/sm4-bold/preview.png`, import.meta.url).href,
  title: "SM4 Bold",
  subtitle: "from SM4",
})
NoteskinRegistry.register({
  id: "starlight-vivid",
  gameTypes: ["dance-single", "dance-double", "dance-couple"],
  load: async () => (await import(`./dance/starlight-vivid/Noteskin`)).default,
  preview: new URL(`./dance/starlight-vivid/preview.png`, import.meta.url).href,
  title: "SLNEXXT-vivid",
  subtitle: "from STARLiGHT-NEXXT",
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
  load: async () => (await import(`./pump/default/Noteskin`)).default,
  preview: new URL(`./pump/default/preview.png`, import.meta.url).href,
  title: "Fiesta",
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
  load: async () => (await import(`./pump/fourv2/Noteskin`)).default,
  preview: new URL(`./pump/fourv2/preview.png`, import.meta.url).href,
  title: "FourV2",
  subtitle: "Jousway",
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
  load: async () => (await import(`./pump/prime/Noteskin`)).default,
  preview: new URL(`./pump/prime/preview.png`, import.meta.url).href,
  title: "Prime",
})
