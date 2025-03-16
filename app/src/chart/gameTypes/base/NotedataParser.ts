import { PartialNotedata } from "../../sm/NoteTypes"
import { GameType } from "../GameTypeRegistry"

export abstract class NotedataParser {
  /**
   * Parses the string into Notedata.
   *
   * @abstract
   * @param {string} data
   * @param gameType
   * @return {*}  {PartialNotedata}
   * @memberof NotedataParser
   */
  abstract fromString(data: string, gameType: GameType): PartialNotedata

  /**
   * Converts Notedata into SM form.
   *
   * @abstract
   * @param {PartialNotedata} notedata
   * @param {GameType} gameType
   * @return {*}  {string}
   * @memberof NotedataParser
   */
  abstract serialize(notedata: PartialNotedata, gameType: GameType): string
}
