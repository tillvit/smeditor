import { lcm, lcm2, roundDigit } from "../../../util/Math"
import { getDivision } from "../../../util/Util"
import {
  ExtraAttributes,
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
    const holdEnds: { col: number; beat: number; holdType?: string }[] =
      notedata
        .filter(isHoldNote)
        .map(hold => {
          return {
            col: hold.col,
            beat: hold.beat + hold.hold,
            holdType: hold.extra?.xsanity
              ? `{3${hold.extra.xsanity.skin}${hold.extra.xsanity.attribute}}`
              : hold.extra?.holdType,
          }
        })
        .sort((a, b) => a.beat - b.beat)
    const lastNote = notedata.at(-1)!
    const lastBeat = lastNote.beat + (isHoldNote(lastNote) ? lastNote.hold : 0)
    let numMeasures = Math.ceil(lastBeat / 4)
    if (lastBeat % 4 == 0) numMeasures++
    for (let measure = 0; measure < numMeasures; measure++) {
      let measureString = "// measure " + measure + "\n"
      const measureNotes = []
      while (notedata[nIndex]?.beat < measure * 4 + 4) {
        measureNotes.push(notedata[nIndex++])
      }
      const measureHoldNotes = []
      while (holdEnds[0]?.beat < measure * 4 + 4) {
        measureHoldNotes.push(holdEnds.shift()!)
      }
      const division = Math.max(
        4,
        lcm2(
          lcm(measureNotes.map(note => getDivision(note.beat))),
          lcm(measureHoldNotes.map(note => getDivision(note.beat)))
        )
      )
      for (let div = 0; div < division; div++) {
        const beat = measure * 4 + (4 / division) * div
        const row = new Array(gameType.numCols).fill("0")
        while (
          roundDigit(measureNotes[0]?.beat ?? -1, 3) == roundDigit(beat, 3)
        ) {
          const note = measureNotes.shift()!
          // row[note.col] = NOTE_TYPE_LOOKUP_REV[note.type]
          // if (note.extra?.notemods) row[note.col] += `{${note.extra.notemods}}`
          // if (note.extra?.keysounds)
          //   row[note.col] += `[${note.extra.keysounds}]`
          row[note.col] = this.serializeNote(note)
        }
        while (
          roundDigit(measureHoldNotes[0]?.beat ?? -1, 3) == roundDigit(beat, 3)
        ) {
          const note = measureHoldNotes.shift()!
          row[note.col] = note.holdType ?? "3"
        }
        measureString += row.join("") + "\n"
      }
      measures.push(measureString)
    }
    return measures.join(",  ")
  }

  serializeNote(note: PartialNotedataEntry) {
    const keysoundStr = note.extra?.keysounds ? `[${note.extra.keysounds}]` : ""
    if (note.extra?.stepp1 !== undefined) {
      const stepP1 = note.extra.stepp1
      const fake = stepP1.fake ? "1" : "0"

      if (stepP1.attribute == "" && !stepP1.fake) {
        return stepP1.type
      }

      return `{${stepP1.type}|${stepP1.attribute}|${fake}|0}${keysoundStr}`
    }
    if (note.extra?.xsanity !== undefined) {
      return `{${note.extra.xsanity.type}${note.extra.xsanity.skin}${note.extra.xsanity.attribute}}${keysoundStr}`
    }
    const notemodStr = note.extra?.notemods ? `{${note.extra.notemods}}` : ""
    const noteStr = NOTE_TYPE_LOOKUP_REV[note.type]
    return noteStr + notemodStr + keysoundStr
  }

  parseNote(
    note: string,
    beat: number,
    col: number,
    holds: (PartialNotedataEntry | undefined)[]
  ): PartialNotedataEntry | undefined {
    // assume that we don't have notemods + {} notes
    if (note[0] == "{") {
      const keysoundMatch = note.match(/\[([^\]]*?)\]/)
      const extra = {} as Partial<ExtraAttributes>
      if (keysoundMatch) extra.keysounds = keysoundMatch[1]

      // stepp1 {type|attribute|fake|reserved}
      const stepP1Match = note.match(/{(.)\|(.)\|(.)\|(.)\}/)
      if (stepP1Match) {
        const type = stepP1Match[1]
        const attribute = stepP1Match[2]
        const fake = stepP1Match[3] == "1"
        extra.stepp1 = {
          type,
          attribute,
          fake,
        }
        if (fake) {
          extra.isFake = true
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
              extra: extra,
            }
            if (holds[col]) {
              console.log(
                "Missing end of hold/roll for note " +
                  JSON.stringify(holds[col])
              )
            }
            holds[col] = entry as PartialNotedataEntry
            break
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
        extra.xsanity = {
          type: noteType,
          attribute,
          skin: noteSkin,
        }
        // attributes
        // P/8 = fake
        // 2 = vanish
        // 9 = sudden

        // note types
        // q = tap ?
        // everything else is standard
        let type = NOTE_TYPE_LOOKUP[noteType]
        if (noteType == "3") {
          if (holds[col]) {
            (holds[col] as PartialHoldNotedataEntry).hold =
              beat - holds[col].beat
            holds[col] = undefined
            return
          } else {
            console.log(
              "Extra end of hold/roll at beat " + beat + " col " + col
            )
          }
        }

        if (noteType == "q") {
          type = "Fake"
        }
        if (type == undefined) {
          console.warn("Unknown note type " + noteType + " at beat " + beat)
          return
        }
        if (attribute == "P" || attribute == "8") {
          extra.isFake = true
        }

        const entry = {
          beat,
          col,
          type,
          extra,
        } as PartialNotedataEntry

        if (noteType == "2" || noteType == "4") {
          if (holds[col]) {
            console.log(
              "Missing end of hold/roll for note " + JSON.stringify(holds[col])
            )
          }
          holds[col] = entry
        }
        return entry
      }

      console.warn("Unknown note " + note + " at beat " + beat)
    } else {
      const keysoundMatch = note.match(/\[([^\]]*?)\]/)
      const noteModsMatch = note.match(/\{([^}]*?)\}/)
      const extra = {} as Partial<ExtraAttributes>
      if (keysoundMatch) extra.keysounds = keysoundMatch[1]
      if (noteModsMatch) extra.notemods = noteModsMatch[1]
      if (keysoundMatch || noteModsMatch) {
        console.log("Parsing note with extra attributes:", extra)
      }

      // lifthold/minehold
      if (note[0] == "D") {
        if (note[1] == "L" || note[1] == "M") {
          if (holds[col]) {
            (holds[col] as PartialHoldNotedataEntry).hold =
              beat - holds[col].beat
            if (!holds[col].extra) holds[col].extra = {}
            holds[col].extra.holdType = note
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
      } else {
        if (note != "0" && note != "3") {
          const entry = {
            beat: beat,
            col: col,
            type: NOTE_TYPE_LOOKUP[note],
            extra: extra,
          } as TapNotedataEntry
          if (["X", "Y", "Z", "x", "y", "z"].includes(note)) {
            entry.extra!.stepp1 = {
              type: note,
              attribute: "",
              fake: false,
            }
          }
          if (entry.type == undefined) {
            console.log(
              "Unknown note type " + note + " at beat " + beat + " col " + col
            )
            return
          }
          if (note == "2" || note == "4") {
            if (holds[col]) {
              console.log(
                "Missing end of hold/roll for note " +
                  JSON.stringify(holds[col])
              )
            }
            holds[col] = entry
          }
          return entry
        }
        if (note == "3") {
          if (holds[col]) {
            (holds[col] as PartialHoldNotedataEntry).hold =
              beat - holds[col].beat
            holds[col] = undefined
          } else {
            console.log(
              "Extra end of hold/roll at beat " + beat + " col " + col
            )
          }
        }
      }
    }
  }

  parseRow(
    row: string,
    beat: number,
    gameType: GameType,
    holds: (PartialNotedataEntry | undefined)[]
  ): PartialNotedata {
    const notes: PartialNotedata = []
    const tokens = row
      .trim()
      .matchAll(/\{[^}]*?\}|\[[^\]]*?\]|[^[\]{}D]|D./g)
      .toArray()
      .map(match => match[0])
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
    for (const token of tokens) {
      if (token[0] == "{") {
        if (useNoteMods) {
          const lastNote = notes.at(-1)
          if (!lastNote) {
            console.warn("Notemod without preceding note", token[0])
            continue
          } else {
            if (lastNote.extra == undefined) lastNote.extra = {}
            lastNote.extra.notemods = token.slice(1, -1)
          }
        } else {
          const note = this.parseNote(token, beat, col, holds)
          if (note) notes.push(note)
          col++
        }
      } else if (token[0] == "[") {
        const lastNote = notes.at(-1)
        if (!lastNote) {
          console.warn("Keysound without preceding note", token[0])
          continue
        } else {
          if (lastNote.extra == undefined) lastNote.extra = {}
          lastNote.extra.keysounds = token.slice(1, -1)
        }
      } else {
        const note = this.parseNote(token, beat, col, holds)
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

    return notedata
  }
}
