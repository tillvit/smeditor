import { NoteType } from "../sm/NoteTypes"
import { TimingWindow } from "./TimingWindow"

export class HoldTimingWindow extends TimingWindow {

  static HELD = new HoldTimingWindow("Hold", 0xe29c18, 0, 0, 0)
  
  noteType: NoteType | "Dropped"

  constructor(noteType: NoteType | "Dropped", color: number, timingWindowMS: number, dancePoints: number, lifeChange: number) {
    super(noteType, color, timingWindowMS, dancePoints, lifeChange)
    this.noteType = noteType
  }
}


