import { PartialNotedata, NotedataStats, Notedata } from "../../sm/NoteTypes"
import { TimingData } from "../../sm/TimingData"
import { GameType } from "../GameTypeRegistry"

export abstract class NotedataParser {
  abstract fromString(data: string): PartialNotedata

  abstract serialize(notedata: PartialNotedata, gameType: GameType): string

  abstract getStats(notedata: Notedata, timingData: TimingData): NotedataStats
}
