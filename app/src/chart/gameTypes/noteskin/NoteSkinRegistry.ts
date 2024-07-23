import { WaterfallManager } from "../../../gui/element/WaterfallManager"
import { GameType } from "../GameTypeRegistry"
import { NoteSkinOptions } from "./NoteSkin"

interface RegistryData {
  name: string
  gameTypes: string[]
  load: () => Promise<NoteSkinOptions>
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
    if (!gameTypeNoteSkins.get(name))
      WaterfallManager.createFormatted(
        `Couldn't find the noteskin ${name}!`,
        "warn"
      )
    return await skin.load()
  }

  static getNoteSkinData(gameType: GameType, name: string) {
    const gameTypeNoteSkins = this.noteskins.get(gameType.id)
    if (!gameTypeNoteSkins || gameTypeNoteSkins.size == 0) return
    const skin =
      gameTypeNoteSkins.get(name) ?? [...gameTypeNoteSkins.values()][0]
    return skin
  }

  static getNoteSkins() {
    return this.noteskins
  }

  // static generatePreview(gameType: string, name: string) {
  //   const ch = new Chart(window.app.chartManager.loadedSM!)
  //   ch.gameType = GameTypeRegistry.getGameType(gameType)!
  //   window.app.chartManager.chartView.reloadNotefield()
  // }
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
  load: async () => (await import("./dance/default/NoteSkin")).default,
})
NoteSkinRegistry.register({
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
  load: async () => (await import("./dance/cf-chrome/NoteSkin")).default,
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
  load: async () => (await import("./dance/ddr/NoteSkin")).default,
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
  load: async () => (await import("./dance/ddr/NoteSkin")).default,
})
NoteSkinRegistry.register({
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
  load: async () => (await import("./dance/ddr-itgcolors/NoteSkin")).default,
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
  load: async () => (await import("./dance/metal/NoteSkin")).default,
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
  load: async () => (await import("./dance/pastel/NoteSkin")).default,
})
NoteSkinRegistry.register({
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
  load: async () => (await import("./dance/dividebyzero/NoteSkin")).default,
})
NoteSkinRegistry.register({
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
  load: async () => (await import("./dance/subtractbyzero/NoteSkin")).default,
})
NoteSkinRegistry.register({
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
  load: async () => (await import("./dance/sm4/NoteSkin")).default,
})
NoteSkinRegistry.register({
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
  load: async () => (await import("./dance/sm4-bold/NoteSkin")).default,
})
NoteSkinRegistry.register({
  name: "default",
  gameTypes: [
    "pump-single",
    "pump-double",
    "pump-couple",
    "pump-versus",
    "pump-halfdouble",
  ],
  load: async () => (await import("./pump/default/NoteSkin")).default,
})
NoteSkinRegistry.register({
  name: "fourv2",
  gameTypes: [
    "pump-single",
    "pump-double",
    "pump-couple",
    "pump-versus",
    "pump-halfdouble",
  ],
  load: async () => (await import("./pump/fourv2/NoteSkin")).default,
})

NoteSkinRegistry.register({
  name: "prime",
  gameTypes: [
    "pump-single",
    "pump-double",
    "pump-couple",
    "pump-versus",
    "pump-halfdouble",
  ],
  load: async () => (await import("./pump/prime/NoteSkin")).default,
})
