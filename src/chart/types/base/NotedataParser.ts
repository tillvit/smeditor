import { PartialNotedata, NotedataStats, Notedata } from "../../sm/NoteTypes"
import { TimingData } from "../../sm/TimingData"

export abstract class NotedataParser {

  abstract fromString(data: string): PartialNotedata

  abstract getStats(notedata: Notedata, timingData: TimingData): NotedataStats

}