import { lcm, lcm2 } from "../../../util/Math"
import { getDivision, isSameRow } from "../../../util/Util"
import {
  ExtraNoteAttributes,
  ExtraNoteData,
  isHoldNote,
  NoteType,
  PartialHoldNotedataEntry,
  PartialNotedata,
  PartialNotedataEntry,
  TapNotedataEntry,
} from "../../sm/NoteTypes"
import { NotedataParser } from "../base/NotedataParser"
import { GameType } from "../GameTypeRegistry"

const NOTE_TYPE_LOOKUP: Record<string, NoteType> = {
  "1": "Tap",
  "2": "Hold",
  "4": "Roll",
  M: "Mine",
  F: "Fake",
  L: "Lift",
  X: "Tap",
  Y: "Tap",
  Z: "Tap",
  x: "Hold",
  y: "Hold",
  z: "Hold",
}

const NOTE_TYPE_LOOKUP_REV: Record<NoteType, string> = {
  Tap: "1",
  Hold: "2",
  Roll: "4",
  Mine: "M",
  Fake: "F",
  Lift: "L",
}

export class BasicNotedataParser extends NotedataParser {
  serialize(notedata: PartialNotedata, gameType: GameType): string {
    if (notedata.length == 0) return ""
    const measures = []
    let nIndex = 0
    const holdEnds = notedata
      .filter(isHoldNote)
      .map(note => {
        return {
          holdEnd: note.beat + note.hold,
          note,
        }
      })
      .sort((a, b) => a.holdEnd - b.holdEnd)
    const lastNote = notedata.at(-1)!
    const lastBeat = Math.max(lastNote.beat, holdEnds.at(-1)?.holdEnd ?? 0)
    let numMeasures = Math.ceil(lastBeat / 4)
    if (lastBeat % 4 == 0) numMeasures++
    for (let measure = 0; measure < numMeasures; measure++) {
      let measureString = "// measure " + measure + "\n"
      const measureNotes = []
      while (notedata[nIndex]?.beat < measure * 4 + 4) {
        measureNotes.push(notedata[nIndex++])
      }
      const measureHoldNotes = []
      while (holdEnds[0]?.holdEnd < measure * 4 + 4) {
        measureHoldNotes.push(holdEnds.shift()!)
      }
      const division = Math.max(
        4,
        lcm2(
          lcm(measureNotes.map(note => getDivision(note.beat))),
          lcm(measureHoldNotes.map(note => getDivision(note.holdEnd)))
        )
      )
      for (let div = 0; div < division; div++) {
        const beat = measure * 4 + (4 / division) * div
        const row = new Array(gameType.numCols).fill("0")
        while (isSameRow(beat, measureNotes[0]?.beat ?? -1)) {
          const note = measureNotes.shift()!
          row[note.col] = this.serializeNote(note)
        }
        while (isSameRow(beat, measureHoldNotes[0]?.holdEnd ?? -1)) {
          const note = measureHoldNotes.shift()!.note
          row[note.col] = this.serializeHoldEnd(note)
        }
        measureString += row.join("") + "\n"
      }
      measures.push(measureString)
    }
    return measures.join(",  ")
  }

  serializeNote(note: PartialNotedataEntry) {
    if (!note.extra) {
      return NOTE_TYPE_LOOKUP_REV[note.type]
    }

    switch (note.extra?.attributes.type) {
      case "outfox": {
        const keysoundStr = note.extra?.attributes.keysounds
          ? `[${note.extra.attributes.keysounds}]`
          : ""
        const notemodStr = note.extra?.attributes.notemods
          ? `{${note.extra.attributes.notemods}}`
          : ""
        let noteStr = NOTE_TYPE_LOOKUP_REV[note.type]
        if (note.extra.attributes.source == "fake") {
          noteStr = "J" + noteStr
        }
        return noteStr + notemodStr + keysoundStr
      }
      case "stepp1": {
        const fake = note.extra.attributes.fake ? "1" : "0"
        if (
          note.extra.attributes.attribute == "" &&
          !note.extra.attributes.fake
        ) {
          return note.extra.attributes.noteType
        }

        return `{${note.extra.attributes.noteType}|${note.extra.attributes.attribute}|${fake}|0}`
      }
      case "xsanity": {
        return `{${note.extra.attributes.noteType}${note.extra.attributes.skin}${note.extra.attributes.attribute}}`
      }
    }
  }

  serializeHoldEnd(note: PartialHoldNotedataEntry) {
    return note.extra?.attributes.holdEndType ?? "3"
  }

  parseNote(
    note: string,
    beat: number,
    col: number,
    holds: (PartialNotedataEntry | undefined)[]
  ): PartialNotedataEntry | undefined {
    const registerHold = (entry: PartialNotedataEntry) => {
      if (holds[col]) {
        console.log(
          "Missing end of hold/roll for note " + JSON.stringify(holds[col])
        )
        holds[col].type = "Tap"
      }
      holds[col] = entry
    }

    const endHold = (holdEndType?: string) => {
      if (holds[col]) {
        (holds[col] as PartialHoldNotedataEntry).hold = beat - holds[col].beat
        if (holdEndType && holds[col]?.extra) {
          holds[col].extra.attributes.holdEndType = holdEndType
        }
        holds[col] = undefined
      } else {
        console.log("Extra end of hold/roll at beat " + beat + " col " + col)
      }
    }

    // assume that we don't have notemods + {} notes
    if (note[0] == "{") {
      const extra: ExtraNoteData = {
        attributes: {} as ExtraNoteAttributes,
      }

      // stepp1 {type|attribute|fake|reserved}
      const stepP1Match = note.match(/{(.)\|(.)\|(.)\|(.)\}/)
      if (stepP1Match) {
        const type = stepP1Match[1]
        const attribute = stepP1Match[2]
        const fake = stepP1Match[3] == "1"
        extra.attributes = {
          type: "stepp1",
          noteType: type,
          attribute,
          fake,
        }

        switch (type) {
          case "X":
          case "Y":
          case "Z":
          case "1":
          case "S":
          case "V":
            // P1-4 Tap Note, sudden/vanish
            return {
              beat,
              col,
              type: "Tap",
              extra,
            }
          case "x":
          case "y":
          case "z":
          case "2": {
            // P1-4 Hold Note
            const entry = {
              beat: beat,
              col: col,
              type: "Hold",
              extra,
            } as PartialNotedataEntry
            registerHold(entry)
            return entry
          }
          case "H":
          case "F":
            // hidden/heart
            return {
              beat,
              col,
              type: "Fake",
              extra,
            }
          case "M":
            // mine
            return {
              beat,
              col,
              type: "Mine",
              extra,
            }
          case "L":
            // lift
            return {
              beat,
              col,
              type: "Lift",
              extra,
            }
          default:
            console.log("Unknown stepP1 type " + type + " at beat " + beat)
            return
        }
      }

      // Xsanity {___}
      if (note.startsWith("{") && note.endsWith("}") && note.length == 5) {
        const noteType = note[1]
        const noteSkin = note[2]
        const attribute = note[3]
        extra.attributes = {
          type: "xsanity",
          noteType,
          skin: noteSkin,
          attribute,
        }

        // attributes
        // P = autoplay
        // 8 = fake
        // 2 = vanish
        // 9 = sudden

        // note types
        // q = tap ?
        // everything else is standard
        let type = NOTE_TYPE_LOOKUP[noteType]
        if (noteType == "3") {
          endHold(note)
          return
        }

        if (noteType == "q") type = "Fake"

        if (type == undefined) {
          console.warn("Unknown note type " + noteType + " at beat " + beat)
          return
        }

        const entry = {
          beat,
          col,
          type,
          extra,
        } as PartialNotedataEntry

        if (noteType == "2" || noteType == "4") {
          registerHold(entry)
        }
        return entry
      }

      console.warn("Unknown note " + note + " at beat " + beat)
      return
    } else {
      const tokens = this.parseTokens(note)
      const keysounds = tokens.find(
        token => token.startsWith("[") && token.endsWith("]")
      )
      const notemods = tokens.find(
        token => token.startsWith("{") && token.endsWith("}")
      )
      const mainToken = tokens[0]
      let extra: ExtraNoteData | undefined = undefined
      if (keysounds || notemods) {
        extra = {
          attributes: {
            type: "outfox",
            keysounds: keysounds ? keysounds.slice(1, -1) : "",
            notemods: notemods ? notemods.slice(1, -1) : "",
            source: "original",
          },
        }
      }

      // lifthold/minehold
      if (mainToken[0] == "D") {
        if (mainToken[1] == "L" || mainToken[1] == "M") {
          if (holds[col]) {
            (holds[col] as PartialHoldNotedataEntry).hold =
              beat - holds[col].beat
            if (!holds[col].extra) {
              holds[col].extra = extra ?? {
                attributes: {
                  type: "outfox",
                  keysounds: "",
                  notemods: "",
                  source: "original",
                },
              }
            } else {
              if (holds[col].extra?.attributes.type != "outfox") {
                console.warn(
                  "Tried to use outfox endholds on note with attribute " +
                    holds[col].extra?.attributes.type +
                    " at beat " +
                    beat +
                    " col " +
                    col
                )
              } else {
                holds[col].extra.attributes.holdEndType = note.slice(0, 2)
              }
            }
            holds[col] = undefined
          } else {
            console.log(
              "Extra end of hold/roll at beat " + beat + " col " + col
            )
          }
          return
        } else {
          console.log("Unknown note type " + note + " at beat " + beat)
          return
        }
      } else if (mainToken[0] == "J") {
        // outfox with different note type source
        const entry = {
          beat: beat,
          col: col,
          type: NOTE_TYPE_LOOKUP[mainToken[1]],
          extra: extra ?? {
            attributes: {
              type: "outfox",
              keysounds: "",
              notemods: "",
              source: "fake",
            },
          },
        } as TapNotedataEntry
        if (entry.type == undefined) {
          console.log(
            "Unknown note type " +
              mainToken +
              " at beat " +
              beat +
              " col " +
              col
          )
          return
        }
        if (mainToken[1] == "2" || mainToken[1] == "4") {
          registerHold(entry)
        }
        console.log(entry)
        return entry
      } else {
        if (note != "0" && note != "3") {
          const entry = {
            beat: beat,
            col: col,
            type: NOTE_TYPE_LOOKUP[mainToken],
            extra: extra,
          } as TapNotedataEntry
          if (["X", "Y", "Z", "x", "y", "z"].includes(mainToken)) {
            if (
              entry.extra?.attributes.type &&
              entry.extra?.attributes.type != "stepp1"
            ) {
              console.warn(
                "Tried to use stepP1 attributes on note with attribute " +
                  entry.extra.attributes.type +
                  " at beat " +
                  beat +
                  " col " +
                  col
              )
            }
            if (!entry.extra) {
              entry.extra = {
                attributes: {
                  type: "stepp1",
                  noteType: note,
                  attribute: "",
                  fake: false,
                },
              }
            }
          }
          if (entry.type == undefined) {
            console.log(
              "Unknown note type " + note + " at beat " + beat + " col " + col
            )
            return
          }
          if (note == "2" || note == "4") {
            registerHold(entry)
          }
          return entry
        }
        if (note == "3") {
          endHold()
          return
        }
      }
    }
  }

  parseTokens(row: string): string[] {
    const bracketData = {
      type: "",
      count: 0,
      token: "",
    }
    const PAIR_TOKENS = ["D", "J"]
    const tokens = []
    for (let i = 0; i < row.length; i++) {
      const char = row[i]
      // handle brackets
      if (char == "{" || char == "[") {
        if (bracketData.count == 0) {
          bracketData.type = char
        }
        if (bracketData.type == char) {
          bracketData.count++
        }
        bracketData.token += char
      } else if (char == "}" || char == "]") {
        if (bracketData.type == "{" && char == "}") {
          bracketData.count--
        } else if (bracketData.type == "[" && char == "]") {
          bracketData.count--
        }
        bracketData.token += char

        if (bracketData.count == 0) {
          const token = bracketData.token
          bracketData.token = ""
          tokens.push(token)
        }
      } else if (bracketData.count > 0) {
        bracketData.token += char
      } else {
        // Token pairs
        if (PAIR_TOKENS.includes(char)) {
          const nextChar = row[i + 1]
          if (!nextChar) {
            console.warn("Pair char " + char + " at end of row")
            continue
          }
          tokens.push(char + nextChar)
          i++
          continue
        }
        tokens.push(char)
      }
    }
    return tokens
  }

  parseRow(
    row: string,
    beat: number,
    gameType: GameType,
    holds: (PartialNotedataEntry | undefined)[]
  ): PartialNotedata {
    const notes: PartialNotedata = []
    const tokens = this.parseTokens(row.trim())
    // console.log(row, tokens)
    let useNoteMods = false
    if (tokens.filter(token => token[0] != "[").length > gameType.numCols) {
      // too many tokens, treat {} as notemods
      useNoteMods = true
      if (
        tokens.filter(token => token[0] != "{" && token[0] != "[").length !=
        gameType.numCols
      ) {
        console.warn("Row has incorrect number of tokens", row)
      }
    } else {
      if (tokens.filter(token => token[0] != "[").length != gameType.numCols) {
        console.warn("Row has incorrect number of tokens", row)
      }
    }

    let col = 0

    const isAppendableToken = (token: string) => {
      if (token[0] == "[") return true
      if (token[0] == "{" && useNoteMods) return true
      return false
    }

    for (let i = 0; i < tokens.length; i++) {
      const token = tokens[i]
      if (!isAppendableToken(token)) {
        let currentChunk = token
        // append following {}, [] tokens to current chunk
        while (i + 1 < tokens.length && isAppendableToken(tokens[i + 1])) {
          currentChunk += tokens[i + 1]
          i++
        }

        const note = this.parseNote(currentChunk, beat, col, holds)
        if (note) notes.push(note)
        col++
      }
    }

    return notes
  }

  // fromString(data: string, gameType: GameType): PartialNotedata {
  //   const measures = data.split(",")
  //   const notedata: PartialNotedata = []
  //   const holds: (PartialNotedataEntry | undefined)[] = []
  //   for (let measure_num = 0; measure_num < measures.length; measure_num++) {
  //     const rows = measures[measure_num].trim().split("\n")
  //     for (let row_index = 0; row_index < rows.length; row_index++) {
  //       const row = rows[row_index].trim()
  //       let col = 0
  //       for (let c = 0; c < row.length; c++) {
  //         if (col >= gameType.numCols) break
  //         const beat = measure_num * 4 + (row_index / rows.length) * 4
  //         let type = row[c]
  //         if (type == "{" || type == "[") {
  //           let data = ""
  //           c++
  //           while (c < row.length && row[c] != "}" && row[c] != "]") {
  //             data += row[c]
  //             c++
  //           }
  //           const lastNote = notedata.at(-1)
  //           if (lastNote && (row[c] == "}" || row[c] == "]")) {
  //             if (row[c] == "}") {
  //               lastNote.notemods = data
  //             } else {
  //               lastNote.keysounds = data
  //             }
  //           }
  //           continue
  //         }
  //         if (type == "D" && (row[c + 1] == "L" || row[c + 1] == "M")) {
  //           // lift holds / mineholds
  //           if (row[c + 1] == "L") type = "L"
  //           else type = "M"
  //           c++
  //         }
  //         if (type != "0" && type != "3") {
  //           const entry = {
  //             beat: beat,
  //             col: col,
  //             type: NOTE_TYPE_LOOKUP[type],
  //           } as TapNotedataEntry
  //           if (entry.type == undefined) {
  //             console.log(
  //               "Unknown note type " + type + " at beat " + beat + " col " + col
  //             )
  //             continue
  //           }
  //           if (type == "2" || type == "4") {
  //             if (holds[col]) {
  //               console.log(
  //                 "Missing end of hold/roll for note " +
  //                   JSON.stringify(holds[col])
  //               )
  //             }
  //             holds[col] = entry
  //           }
  //           notedata.push(entry)
  //         }
  //         if (type == "3") {
  //           if (holds[col]) {
  //             ;(holds[col] as PartialHoldNotedataEntry).hold =
  //               beat - holds[col]!.beat
  //             holds[col] = undefined
  //           } else {
  //             console.log(
  //               "Extra end of hold/roll at beat " + beat + " col " + col
  //             )
  //           }
  //         }
  //         col++
  //       }
  //     }
  //   }
  //   return notedata
  // }

  fromString(data: string, gameType: GameType): PartialNotedata {
    const measures = data.split(",")
    const notedata: PartialNotedata = []
    const holds: (PartialNotedataEntry | undefined)[] = []
    for (let measure_num = 0; measure_num < measures.length; measure_num++) {
      const rows = measures[measure_num].trim().split("\n")
      for (let row_index = 0; row_index < rows.length; row_index++) {
        const row = rows[row_index].trim()
        this.parseRow(
          row,
          measure_num * 4 + (row_index / rows.length) * 4,
          gameType,
          holds
        ).forEach(note => notedata.push(note))
      }
    }

    for (let c = 0; c < holds.length; c++) {
      const h = holds[c]
      if (h) {
        h.type = "Tap"
        console.log("Missing end of hold/roll for note " + JSON.stringify(h))
      }
    }

    return notedata
  }
}
