// broken for now, but we'll fix it soon

// import {
//   FEET,
//   FEET_LABEL_TO_FOOT,
//   Foot,
//   OTHER_PART_OF_FOOT,
//   Row,
//   TECH_COUNTS,
//   TechCountsCategory,
// } from "./ParityDataTypes"
// import { StageLayout } from "./StageLayouts"

// export function calculateTechCounts(
//   rows: Row[],
//   layout: StageLayout,
//   columnCount: number,
//   timeThresholds: number[]
// ) {
//   const techCounts: number[] = []
//   for (let t = 0; t < 6; t++) {
//     techCounts.push(0)
//   }

//   const techCountsPerRow = calculateTechCountsPerRow(
//     rows,
//     layout,
//     columnCount,
//     timeThresholds
//   )

//   for (let r = 0; r < techCountsPerRow.length; r++) {
//     const techCountRow = techCountsPerRow[r]
//     const currentRow = rows[r]
//     const techs_string = techCountRow.map(t => TECH_COUNTS[t]).join(",")
//     for (const note of currentRow.notes) {
//       if (note != undefined) {
//         note.parity!.tech = techs_string
//       }
//     }

//     for (const t of techCountRow) {
//       techCounts[t] += 1
//     }
//   }

//   return techCounts
// }

// export function calculateTechCountsPerRow(
//   rows: Row[],
//   layout: StageLayout,
//   columnCount: number,
//   timeThresholds: number[]
// ) {
//   const techCountsPerRow: TechCountsCategory[][] = []

//   for (let r = 0; r < rows.length; r++) {
//     const techCountsForRow = calculateTechCountsForRow(
//       rows,
//       r,
//       layout,
//       columnCount,
//       timeThresholds
//     )
//     techCountsPerRow.push(techCountsForRow)
//   }

//   return techCountsPerRow
// }

// export function calculateTechCountsForRow(
//   rows: Row[],
//   rowIndex: number,
//   layout: StageLayout,
//   columnCount: number,
//   timeThresholds: number[]
// ) {
//   const currentRow = rows[rowIndex]
//   const previousRow = rowIndex > 0 ? rows[rowIndex - 1] : undefined

//   const currentFootPlacement: number[] = getFootPlacement(
//     currentRow,
//     columnCount
//   )
//   const currentColumns: Foot[] = getColumns(currentRow, columnCount)
//   const noteCount: number = getNoteCount(currentRow, columnCount)

//   const previousFootPlacement: number[] = previousRow
//     ? getFootPlacement(previousRow, columnCount)
//     : emptyFootPlacement()
//   const previousColumns: Foot[] = previousRow
//     ? getColumns(previousRow, columnCount)
//     : emptyColumns(columnCount)
//   const previousNoteCount = previousRow
//     ? getNoteCount(previousRow, columnCount)
//     : 0

//   for (let i = 0; i <= FEET.length; i++) {
//     previousFootPlacement.push(-1)
//     currentFootPlacement.push(-1)
//   }

//   const techs: TechCountsCategory[] = []

//   /*
//   Jacks are same arrow same foot
//   Doublestep is same foot on successive arrows
//   Brackets are jumps with one foot

//   Footswitch is different foot on the up or down arrow
//   Sideswitch is footswitch on left or right arrow
//   Crossovers are left foot on right arrow or vice versa
//   */

//   // check for jacks and doublesteps
//   if (rowIndex > 0 && previousRow && noteCount == 1 && previousNoteCount == 1) {
//     for (const foot of FEET) {
//       if (
//         currentRow.whereTheFeetAre[foot] == -1 ||
//         previousRow.whereTheFeetAre[foot] == -1
//       ) {
//         continue
//       }
//       const previousColumn = previousRow.whereTheFeetAre[foot]
//       const currentColumn = currentRow.whereTheFeetAre[foot]

//       if (
//         !previousRow.notes[previousColumn] ||
//         previousRow.notes[previousColumn].type != "Tap"
//       ) {
//         continue
//       }

//       if (
//         previousRow.whereTheFeetAre[foot] == currentRow.whereTheFeetAre[foot]
//       ) {
//         if (
//           !(
//             previousRow.holds[previousColumn] &&
//             previousRow.holds[previousColumn].beat +
//               previousRow.holds[previousColumn].hold >=
//               currentRow.beat
//           ) &&
//           (timeThresholds[TechCountsCategory.Jacks] == undefined ||
//             currentRow.second - rows[rowIndex - 1].second <
//               timeThresholds[TechCountsCategory.Jacks])
//         ) {
//           techs.push(TechCountsCategory.Jacks)
//         }
//       } else {
//         if (
//           timeThresholds[TechCountsCategory.Doublesteps] == undefined ||
//           currentRow.second - rows[rowIndex - 1].second <
//             timeThresholds[TechCountsCategory.Doublesteps]
//         ) {
//           techs.push(TechCountsCategory.Doublesteps)
//         }
//       }
//     }
//   }

//   // check for brackets
//   if (
//     noteCount >= 2 &&
//     (rowIndex == 0 ||
//       timeThresholds[TechCountsCategory.Brackets] == undefined ||
//       currentRow.second - rows[rowIndex - 1].second <
//         timeThresholds[TechCountsCategory.Brackets])
//   ) {
//     if (
//       currentRow.whereTheFeetAre[Foot.LEFT_HEEL] != -1 &&
//       currentRow.whereTheFeetAre[Foot.LEFT_TOE] != -1
//     ) {
//       techs.push(TechCountsCategory.Brackets)
//     }

//     if (
//       currentRow.whereTheFeetAre[Foot.RIGHT_HEEL] != -1 &&
//       currentRow.whereTheFeetAre[Foot.RIGHT_TOE] != -1
//     ) {
//       techs.push(TechCountsCategory.Brackets)
//     }
//   }

//   if (previousRow) {
//     // check for up footswitches
//     for (const c of layout.upArrows) {
//       if (
//         isFootswitch(
//           c,
//           currentRow,
//           previousRow,
//           timeThresholds[TechCountsCategory.Footswitches]
//         )
//       ) {
//         techs.push(TechCountsCategory.Footswitches)
//       }
//     }

//     // check for down footswitches
//     for (const c of layout.downArrows) {
//       if (
//         isFootswitch(
//           c,
//           currentRow,
//           previousRow,
//           timeThresholds[TechCountsCategory.Footswitches]
//         )
//       ) {
//         techs.push(TechCountsCategory.Footswitches)
//       }
//     }

//     // check for sideswitches
//     for (const c of layout.sideArrows) {
//       if (
//         isFootswitch(
//           c,
//           currentRow,
//           previousRow,
//           timeThresholds[TechCountsCategory.Footswitches]
//         )
//       ) {
//         techs.push(TechCountsCategory.Sideswitches)
//       }
//     }
//   }

//   // Check for crossovers

//   if (previousRow) {
//     const leftHeel = currentRow.whereTheFeetAre[Foot.LEFT_HEEL]
//     const leftToe = currentRow.whereTheFeetAre[Foot.LEFT_TOE]
//     const rightHeel = currentRow.whereTheFeetAre[Foot.RIGHT_HEEL]
//     const rightToe = currentRow.whereTheFeetAre[Foot.RIGHT_TOE]

//     const previousLeftHeel = previousRow.whereTheFeetAre[Foot.LEFT_HEEL]
//     const previousLeftToe = previousRow.whereTheFeetAre[Foot.LEFT_TOE]
//     const previousRightHeel = previousRow.whereTheFeetAre[Foot.RIGHT_HEEL]
//     const previousRightToe = previousRow.whereTheFeetAre[Foot.RIGHT_TOE]

//     // Is the right crossing over?
//     if (rightHeel != -1 && previousLeftHeel != -1 && previousRightHeel == -1) {
//       const leftPos = layout.averagePoint(previousLeftHeel, previousLeftToe)
//       const rightPos = layout.averagePoint(rightHeel, rightToe)

//       if (rightPos.x < leftPos.x) {
//         if (rowIndex > 1) {
//           const previousPreviousRow = rows[rowIndex - 2]
//           if (
//             previousPreviousRow &&
//             previousPreviousRow.whereTheFeetAre[Foot.RIGHT_HEEL] != rightHeel
//           ) {
//             techs.push(TechCountsCategory.Crossovers)
//           }
//         } else {
//           techs.push(TechCountsCategory.Crossovers)
//         }
//       }
//     }
//     // Is the left crossing over?
//     else if (
//       leftHeel != -1 &&
//       previousRightHeel != -1 &&
//       previousLeftHeel == -1
//     ) {
//       const leftPos = layout.averagePoint(leftHeel, leftToe)
//       const rightPos = layout.averagePoint(previousRightHeel, previousRightToe)

//       if (rightPos.x < leftPos.x) {
//         if (rowIndex > 1) {
//           const previousPreviousRow = rows[rowIndex - 2]
//           if (
//             previousPreviousRow &&
//             previousPreviousRow.whereTheFeetAre[Foot.LEFT_HEEL] != leftHeel
//           ) {
//             techs.push(TechCountsCategory.Crossovers)
//           }
//         } else {
//           techs.push(TechCountsCategory.Crossovers)
//         }
//       }
//     }
//   }

//   return techs
// }

// function isFootswitch(
//   c: number,
//   currentRow: Row,
//   previousRow: Row,
//   cutoff: number
// ) {
//   const elapsedTime = currentRow.second - previousRow.second

//   if (
//     currentRow.columns[c] == Foot.NONE ||
//     previousRow.columns[c] == Foot.NONE
//   ) {
//     return false
//   }

//   if (
//     previousRow.columns[c] != currentRow.columns[c] &&
//     OTHER_PART_OF_FOOT[previousRow.columns[c]] != currentRow.columns[c] &&
//     (cutoff == undefined || elapsedTime < cutoff)
//   ) {
//     return true
//   }
//   return false
// }

// function emptyFootPlacement() {
//   const footPlacement: number[] = []
//   for (let i = 0; i <= FEET.length; i++) {
//     footPlacement.push(-1)
//   }
//   return footPlacement
// }
// function getFootPlacement(row: Row, columnCount: number) {
//   const footPlacement: number[] = emptyFootPlacement()

//   for (let c = 0; c < columnCount; c++) {
//     const currentNote = row.notes[c]
//     if (currentNote != undefined) {
//       const currFoot = currentNote.parity
//         ? FEET_LABEL_TO_FOOT[currentNote.parity.foot]
//         : Foot.NONE

//       if (
//         currentNote.type != "Tap" &&
//         currentNote.type != "Hold" &&
//         currentNote.type != "Roll"
//       ) {
//         continue
//       }

//       footPlacement[currFoot] = c
//     }
//   }
//   return footPlacement
// }

// function emptyColumns(columnCount: number) {
//   const columns: Foot[] = []
//   for (let i = 0; i < columnCount; i++) {
//     columns.push(Foot.NONE)
//   }
//   return columns
// }

// function getColumns(row: Row, columnCount: number) {
//   const columns: Foot[] = emptyColumns(columnCount)

//   for (let c = 0; c < columnCount; c++) {
//     const currentNote = row.notes[c]
//     if (currentNote != undefined) {
//       const currFoot = currentNote.parity
//         ? FEET_LABEL_TO_FOOT[currentNote.parity.foot]
//         : Foot.NONE

//       if (
//         currentNote.type != "Tap" &&
//         currentNote.type != "Hold" &&
//         currentNote.type != "Roll"
//       ) {
//         continue
//       }
//       columns[c] = currFoot
//     }
//   }

//   return columns
// }

// function getNoteCount(row: Row, columnCount: number) {
//   let noteCount: number = 0

//   for (let c = 0; c < columnCount; c++) {
//     const currentNote = row.notes[c]
//     if (currentNote != undefined) {
//       if (
//         currentNote.type != "Tap" &&
//         currentNote.type != "Hold" &&
//         currentNote.type != "Roll"
//       ) {
//         continue
//       }
//       noteCount += 1
//     }
//   }
//   return noteCount
// }
