import { EventHandler } from "../../util/EventHandler"
import { bsearch } from "../../util/Util"
import { GameType, GameTypeRegistry } from "../gameTypes/GameTypeRegistry"
import { CHART_DIFFICULTIES, ChartDifficulty } from "./ChartTypes"
import {
  Notedata,
  NotedataEntry,
  NotedataStats,
  PartialNotedataEntry,
  isHoldNote,
} from "./NoteTypes"
import { Simfile } from "./Simfile"
import { TimingData } from "./TimingData"
import {
  TIMING_EVENT_NAMES,
  TimingEventProperty,
  TimingProperty,
} from "./TimingTypes"

export class Chart {
  gameType: GameType = GameTypeRegistry.getPriority()[0]
  description = ""
  difficulty: ChartDifficulty = "Beginner"
  meter = 1
  meterF = 1
  radarValues = "0,0,0,0,0"
  chartName = ""
  chartStyle = ""
  credit = ""
  music?: string
  timingData: TimingData
  sm: Simfile
  other_properties: { [key: string]: string } = {}

  private notedata: Notedata = []

  private _notedataStats?: NotedataStats

  constructor(sm: Simfile, data?: string | { [key: string]: string }) {
    this.timingData = new TimingData(sm.timingData, this)
    this.sm = sm
    if (!data) {
      this.recalculateStats()
      return
    }
    if (sm._type == "ssc") {
      const dict = data as { [key: string]: string }
      for (const property in dict) {
        if (
          property == "OFFSET" ||
          TIMING_EVENT_NAMES.includes(property as TimingEventProperty)
        )
          this.timingData.parse(property as TimingProperty, dict[property])
      }
      this.timingData.reloadCache()
      const gameType = GameTypeRegistry.getGameType(dict["STEPSTYPE"])
      if (!gameType) throw Error("Unknown step type " + dict["STEPSTYPE"])
      this.gameType = gameType
      this.description = dict["DESCRIPTION"] ?? ""
      if (CHART_DIFFICULTIES.includes(dict["DIFFICULTY"] as ChartDifficulty))
        this.difficulty = dict["DIFFICULTY"] as ChartDifficulty
      else throw Error("Unknown chart difficulty " + dict["DIFFICULTY"])
      this.meter = parseInt(dict["METER"])
      if (!isFinite(this.meter) || this.meter < 0) this.meter = 0
      this.meterF = parseFloat(dict["METERF"])
      if (!isFinite(this.meterF) || this.meterF < 0) this.meterF = this.meter
      this.radarValues = dict["RADARVALUES"] ?? ""
      this.notedata =
        gameType.parser
          .fromString(dict["NOTES"])
          .map(note => this.computeNote(note)) ?? []
      this.credit = dict["CREDIT"] ?? ""
      this.chartName = dict["CHARTNAME"] ?? ""
      this.chartStyle = dict["CHARTSTYLE"] ?? ""
      this.music = dict["MUSIC"]
      for (const key in dict) {
        if (
          [
            "STEPSTYPE",
            "DESCRIPTION",
            "DIFFICULTY",
            "METER",
            "METERF",
            "RADARVALUES",
            "CREDIT",
            "CHARTNAME",
            "CHARTSTYLE",
            "MUSIC",
            "NOTES",
            "NOTEDATA",
          ].includes(key)
        )
          continue
        this.other_properties[key] = dict[key]
      }
    } else {
      const match =
        /([\w\d-]+):[\s ]*([^:]*):[\s ]*([\w\d]+):[\s ]*([\d]+):[\s ]*([\d.,]*):[\s ]*([\w\d\s, ]*)/g.exec(
          (<string>data).trim()
        )
      if (match != null) {
        const gameType = GameTypeRegistry.getGameType(match[1])
        if (!gameType) throw Error("Unknown step type " + match[1])
        this.gameType = gameType
        this.description = match[2] ?? ""
        if (CHART_DIFFICULTIES.includes(match[3] as ChartDifficulty))
          this.difficulty = match[3] as ChartDifficulty
        else throw Error("Unknown chart difficulty " + match[3])
        this.meter = parseInt(match[4])
        if (!isFinite(this.meter) || this.meter < 0) this.meter = 0
        this.meterF = this.meter
        this.radarValues = match[5] ?? ""
        this.notedata =
          gameType.parser
            .fromString(match[6])
            .map(note => this.computeNote(note)) ?? []
      } else {
        throw Error("Failed to load sm chart!")
      }
    }
    this.recalculateStats()
  }

  getNotedataStats() {
    return this._notedataStats!
  }

  getSecondsFromBeat(
    beat: number,
    option?: "noclamp" | "before" | "after" | ""
  ): number {
    return this.timingData.getSecondsFromBeat(beat, option)
  }

  getBeatFromSeconds(seconds: number): number {
    return this.timingData.getBeatFromSeconds(seconds)
  }

  getBeatFromEffectiveBeat(effBeat: number): number {
    return this.timingData.getBeatFromEffectiveBeat(effBeat)
  }

  isBeatWarped(beat: number): boolean {
    return this.timingData.isBeatWarped(beat)
  }

  isBeatFaked(beat: number): boolean {
    return this.timingData.isBeatFaked(beat)
  }

  private getNoteIndex(note: PartialNotedataEntry): number {
    if (this.notedata.includes(note as NotedataEntry)) {
      return this.notedata.indexOf(note as NotedataEntry)
    }
    for (let i = 0; i < this.notedata.length; i++) {
      const n = this.notedata[i]
      if (n.beat == note.beat && n.col == note.col && n.type == note.type) {
        return i
      }
    }
    return -1
  }

  addNote(note: PartialNotedataEntry): NotedataEntry {
    note.beat = Math.round(note.beat * 48) / 48
    if (isHoldNote(note)) note.hold = Math.round(note.hold * 48) / 48
    const computedNote = this.computeNote(note)
    let index = bsearch(this.notedata, note.beat, a => a.beat) + 1
    if (index >= 1 && this.notedata[index - 1].beat > note.beat) index--
    this.notedata.splice(index, 0, computedNote)
    EventHandler.emit("chartModified")
    return computedNote
  }

  addNotes(notes: PartialNotedataEntry[]): NotedataEntry[] {
    const computedNotes = notes.map(note => {
      note.beat = Math.round(note.beat * 48) / 48
      if (isHoldNote(note)) note.hold = Math.round(note.hold * 48) / 48
      const computedNote = this.computeNote(note)
      let index = bsearch(this.notedata, note.beat, a => a.beat) + 1
      if (index >= 1 && this.notedata[index - 1].beat > note.beat) index--
      this.notedata.splice(index, 0, computedNote)
      return computedNote
    })
    EventHandler.emit("chartModified")
    return computedNotes
  }

  computeNote(note: PartialNotedataEntry): NotedataEntry {
    return Object.assign(note, {
      warped: this.timingData.isBeatWarped(note.beat),
      fake: note.type == "Fake" || this.timingData.isBeatFaked(note.beat),
      second: this.timingData.getSecondsFromBeat(note.beat),
    })
  }

  modifyNote(note: PartialNotedataEntry, properties: Partial<NotedataEntry>) {
    const i = this.getNoteIndex(note)
    if (i == -1) return
    const noteToModify = Object.assign({}, this.notedata[i])
    this.notedata.splice(i, 1)
    Object.assign(noteToModify, properties)
    this.addNote(noteToModify)
    EventHandler.emit("chartModified")
  }

  removeNote(note: PartialNotedataEntry): NotedataEntry | undefined {
    const i = this.getNoteIndex(note)
    if (i == -1) return
    const removedNote = this.notedata.splice(i, 1)
    EventHandler.emit("chartModified")
    return removedNote[0]
  }

  removeNotes(notes: PartialNotedataEntry[]): NotedataEntry[] {
    const computedNotes = notes
      .map(note => {
        const i = this.getNoteIndex(note)
        if (i == -1) return
        const removedNote = this.notedata.splice(i, 1)
        return removedNote[0]
      })
      .filter(note => note != undefined)
    EventHandler.emit("chartModified")
    return computedNotes as NotedataEntry[]
  }

  setNotedata(notedata: Notedata) {
    this.notedata = notedata
    EventHandler.emit("chartModified")
  }

  getNotedata(): Notedata {
    return this.notedata
  }

  recalculateNotes() {
    this.notedata = this.notedata.map(note => this.computeNote(note))
  }

  recalculateStats() {
    this._notedataStats = this.gameType.parser.getStats(
      this.notedata,
      this.timingData
    )
  }

  getMusicPath(): string {
    return this.music ?? this.sm.properties.MUSIC ?? ""
  }

  toString(): string {
    return this.difficulty + " " + this.meter
  }

  serialize(type: "sm" | "ssc"): string {
    let str =
      "//---------------" +
      this.gameType.id +
      " - " +
      this.description +
      "---------------\n"
    if (type == "sm") {
      str += "#NOTES:\n"
      str += `     ${this.gameType.id}:\n`
      str += `     ${this.description}:\n`
      str += `     ${this.difficulty}:\n`
      str += `     ${this.meter}:\n`
      str += `     ${this.radarValues}:\n`
    } else {
      str += "#NOTEDATA:;\n"
      str += `#CHARTNAME:${this.chartName};\n`
      str += `#CHARTSTYLE:${this.chartStyle};\n`
      str += `#CREDIT:${this.credit};\n`
      if (this.music) str += `#MUSIC:${this.music};\n`
      str += `#STEPSTYPE:${this.gameType.id};\n`
      str += `#DESCRIPTION:${this.description};\n`
      str += `#DIFFICULTY:${this.difficulty};\n`
      str += `#METER:${this.meter};\n`
      str += `#METERF:${this.meterF};\n`
      str += `#RADARVALUES:${this.radarValues};\n`
      for (const key in this.other_properties) {
        str += `#${key}:${this.other_properties[key]};\n`
      }
      str += `#NOTES:\n`
    }
    str += this.gameType.parser.serialize(this.notedata, this.gameType) + ";\n"
    return str
  }
}
