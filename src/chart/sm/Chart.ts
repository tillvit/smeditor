import { bsearch } from "../../util/Util"
import { GameType, GameTypeRegistry } from "../types/GameTypeRegistry"
import { ChartDifficulty, CHART_DIFFICULTIES } from "./ChartTypes"
import { isHoldNote, Notedata, NotedataEntry, NotedataStats, PartialNotedataEntry } from "./NoteTypes"
import { Simfile } from "./Simfile"
import { TimingData } from "./TimingData";
import { TimingEventProperty, TimingProperty, TIMING_EVENT_NAMES } from "./TimingTypes"

export class Chart {
  gameType: GameType
  description: string = ""
  difficulty: ChartDifficulty = "Beginner";
  meter: number = 0
  radarValues: string = ""
  chartName: string = ""
  chartStyle: string = ""
  credit: string = ""
  music?: string
  timingData: TimingData
  sm: Simfile

  notedata: Notedata = [];
  private _notedataStats?: NotedataStats


  constructor(sm: Simfile, data: string | {[key: string]: string}) {
    this.timingData = new TimingData(sm.timingData, this)
    this.sm = sm
    if (sm._type == "ssc") {
      let dict = data as {[key: string]: string}
      for (let property in dict) {
        if (property == "OFFSET" || TIMING_EVENT_NAMES.includes(property as TimingEventProperty)) this.timingData.parse(property as TimingProperty, dict[property])
      }
      this.timingData.reloadCache()
      let gameType = GameTypeRegistry.getGameType(dict["STEPSTYPE"])
      if (!gameType) throw Error("Unknown step type " + dict["STEPSTYPE"])
      this.gameType = gameType
      this.description = dict["DESCRIPTION"] ?? ""
      if (CHART_DIFFICULTIES.includes(dict["DIFFICULTY"] as ChartDifficulty)) this.difficulty = dict["DIFFICULTY"] as ChartDifficulty
      else throw Error("Unknown chart difficulty " + dict["DIFFICULTY"])
      this.meter = parseInt(dict["METER"]) ?? 0
      this.radarValues = dict["RADARVALUES"] ?? ""
      this.notedata = gameType.parser.fromString(dict["NOTES"]).map(note => this.computeNote(note)) ?? []
      this.credit = dict["CREDIT"] ?? ""
      this.chartName = dict["CHARTNAME"] ?? ""
      this.chartStyle = dict["CHARTSTYLE"] ?? ""
      this.music = dict["MUSIC"]
    }else{
      let match = /([\w\d\-]+):[\s ]*([^:]*):[\s ]*([\w\d]+):[\s ]*([\d]+):[\s ]*([\d.,]+):[\s ]*([\w\d\s, ]+)/g.exec((<string>data).trim())
      if (match != null) {
        let gameType = GameTypeRegistry.getGameType(match[1])
        if (!gameType) throw Error("Unknown step type " + match[1])
        this.gameType = gameType
        this.description = match[2] ?? ""
        if (CHART_DIFFICULTIES.includes(match[3] as ChartDifficulty)) this.difficulty = match[3] as ChartDifficulty
        else throw Error("Unknown chart difficulty " + match[3])
        this.meter = parseInt(match[4]) ?? 0
        this.radarValues = match[5] ?? ""
        this.notedata = gameType.parser.fromString(match[6]).map(note => this.computeNote(note)) ?? []
      }else{
        throw Error("Failed to load sm chart!")
      }
    }
    this.recalculateStats()
    console.log("Loading chart " + this.difficulty + " " + this.meter + " " + this.gameType.id)
  }

  getNotedataStats() {
    return this._notedataStats!
  }

  getSeconds(beat: number): number {
    return this.timingData.getSeconds(beat)
  }

  getBeat(seconds: number): number {
    return this.timingData.getBeat(seconds)
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
      let n = this.notedata[i]
      if (n.beat == note.beat && n.col == note.col && n.type == note.type) {
        return i
      }
    }
    return -1
  }

  addNote(note: PartialNotedataEntry): NotedataEntry {
    note.beat = Math.round(note.beat*48)/48
    if (isHoldNote(note)) note.hold = Math.round(note.hold*48)/48
    let computedNote = this.computeNote(note)
    let index = bsearch(this.notedata, note.beat, a => a.beat) + 1
    if (index >= 1 && this.notedata[index-1].beat > note.beat) index--
    this.notedata.splice(index, 0, computedNote)
    this.recalculateStats()
    window.postMessage("chartModified")
    return computedNote
  }

  computeNote(note: PartialNotedataEntry): NotedataEntry {
    return Object.assign(note, {
      warped: this.timingData.isBeatWarped(note.beat),
      fake: note.type == "Fake" || this.timingData.isBeatFaked(note.beat),
      second: this.timingData.getSeconds(note.beat)
    })
  }

  modifyNote(note: PartialNotedataEntry, properties: Partial<NotedataEntry>) {
    let i = this.getNoteIndex(note)
    if (i == -1) return
    let noteToModify = this.notedata[i]
    this.notedata.splice(i, 1)
    Object.assign(noteToModify, properties)
    this.addNote(noteToModify)
    window.postMessage("chartModified")
  }

  removeNote(note: PartialNotedataEntry): NotedataEntry | undefined {
    let i = this.getNoteIndex(note)
    if (i == -1) return
    let removedNote = this.notedata.splice(i, 1)
    this.recalculateStats()
    window.postMessage("chartModified")
    return removedNote[0]
  }
  
  recalculateNotes() {
    this.notedata = this.notedata.map(note => this.computeNote(note))
  }
  
  private recalculateStats() {
    this._notedataStats = this.gameType.parser.getStats(this.notedata, this.timingData)
  }

  getMusicPath(): string {
    return this.music ?? this.sm.properties.MUSIC ?? ""
  }
} 