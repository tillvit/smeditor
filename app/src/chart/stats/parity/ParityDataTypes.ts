import { HoldNotedataEntry, NotedataEntry } from "../../sm/NoteTypes"

export enum Foot {
  NONE,
  LEFT_HEEL,
  LEFT_TOE,
  RIGHT_HEEL,
  RIGHT_TOE,
}

export const FEET = [
  Foot.LEFT_HEEL,
  Foot.LEFT_TOE,
  Foot.RIGHT_HEEL,
  Foot.RIGHT_TOE,
]

// Instead of having to write out if((someFootPart == Foot.LEFT_TOE && someOtherPart != Foot.LEFT_HEEL || someFootPart == Foot.LEFT_HEEL && someOtherPart != Foot.LEFT_TOE))
// get the other part of the foot for a given value, if(OTHER_PART_OF_FOOT[someFootPart] != someOtherPart)
export const OTHER_PART_OF_FOOT = [
  Foot.NONE,
  Foot.LEFT_TOE,
  Foot.LEFT_HEEL,
  Foot.RIGHT_TOE,
  Foot.RIGHT_HEEL,
]

export const FEET_LABELS = [".", "L", "l", "R", "r"]

export const FEET_LABELS_LONG = [
  "None",
  "Left Heel",
  "Left Toe",
  "Right Heel",
  "Right Toe",
]

export const FEET_LABEL_TO_FOOT: { [key: string]: Foot } = {
  L: Foot.LEFT_HEEL,
  l: Foot.LEFT_TOE,
  R: Foot.RIGHT_HEEL,
  r: Foot.RIGHT_TOE,
}

export type FootOverride = Foot | "Left" | "Right"

export interface FootPlacement {
  leftHeel: number
  leftToe: number
  rightHeel: number
  rightToe: number
  leftBracket: boolean
  rightBracket: boolean
}

export const ZERO_WEIGHT: { [key: string]: number } = {
  DOUBLESTEP: 0,
  BRACKETJACK: 0,
  JACK: 0,
  JUMP: 0,
  SLOW_BRACKET: 0,
  TWISTED_FOOT: 0,
  BRACKETTAP: 0,
  HOLDSWITCH: 0,
  MINE: 0,
  FOOTSWITCH: 0,
  MISSED_FOOTSWITCH: 0,
  FACING: 0,
  DISTANCE: 0,
  SPIN: 0,
  SIDESWITCH: 0,
  CROWDED_BRACKET: 0,
  OTHER: 0,
  OVERRIDE: 0,
  TOTAL: 0,
}

export const DEFAULT_WEIGHTS: { [key: string]: number } = {
  DOUBLESTEP: 850,
  BRACKETJACK: 20,
  JACK: 30,
  JUMP: 0,
  SLOW_BRACKET: 400,
  TWISTED_FOOT: 100000,
  BRACKETTAP: 400,
  HOLDSWITCH: 55,
  MINE: 10000,
  FOOTSWITCH: 325,
  MISSED_FOOTSWITCH: 500,
  FACING: 2,
  DISTANCE: 6,
  SPIN: 1000,
  SIDESWITCH: 130,
  CROWDED_BRACKET: 0,
  OTHER: 0,
}

export const WEIGHT_SHORT_NAMES: { [id: string]: string } = {
  DOUBLESTEP: "DST",
  BRACKETJACK: "BRJ",
  JACK: "JAK",
  JUMP: "JMP",
  SLOW_BRACKET: "SLWB",
  TWISTED_FOOT: "TWST",
  BRACKETTAP: "BRT",
  HOLDSWITCH: "HLS",
  MINE: "MNE",
  FOOTSWITCH: "FSW",
  MISSED_FOOTSWITCH: "MFS",
  FACING: "FAC",
  DISTANCE: "DIS",
  SPIN: "SPN",
  SIDESWITCH: "SSW",
  CROWDED_BRACKET: "CBK",
  OTHER: "OTH",
  OVERRIDE: "OVR",
  TOTAL: "TOT",
}

export enum TechCountsCategory {
  Crossovers = 0,
  Footswitches,
  Sideswitches,
  Jacks,
  Brackets,
  Doublesteps,
  NUM_TechCountsCategory,
  Invalid,
}

export const TECH_COUNTS = ["XO", "FS", "SS", "JA", "BR", "DS"]

export class State {
  action: Foot[] = []
  combinedColumns: Foot[] = []
  movedFeet: Set<Foot> = new Set()
  holdFeet: Set<Foot> = new Set()
  second: number
  beat: number

  footColumns: number[] = []

  constructor(
    second: number,
    beat: number,
    action: Foot[],
    columns: number[] = []
  ) {
    this.second = second
    this.beat = beat
    this.action = [...action]
    this.footColumns = [...columns]
  }

  toKey() {
    let movedString = ""
    for (let i = 0; i < FEET.length; i++) {
      if (this.movedFeet.has(FEET[i])) {
        movedString += FEET[i]
      }
    }
    let holdString = ""
    for (let i = 0; i < FEET.length; i++) {
      if (this.holdFeet.has(FEET[i])) {
        holdString += FEET[i]
      }
    }
    let feetString = ""
    for (let i = 1; i < this.footColumns.length; i++) {
      if (this.footColumns[i] !== -1) {
        feetString += this.footColumns[i]
      } else {
        feetString += "."
      }
    }

    return `${this.second.toFixed(3)}-${this.beat.toFixed(3)}-${this.action.join("")}-${this.combinedColumns.join("")}-${movedString}-${holdString}-${feetString}`
  }
}

export interface Row {
  notes: (NotedataEntry | undefined)[]
  holds: (HoldNotedataEntry | undefined)[]
  holdTails: Set<number>
  mines: (number | undefined)[]
  fakeMines: (number | undefined)[]
  second: number
  beat: number
  columns: Foot[]
  overrides: FootOverride[]
  id: string
}
