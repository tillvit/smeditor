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

export type FootOverride = "Left" | "Right" | Foot

export interface PlacementData {
  previousLeftPos: { x: number; y: number } // can probably cache this?
  previousRightPos: { x: number; y: number }
  leftPos: { x: number; y: number }
  rightPos: { x: number; y: number }
  movedLeft: boolean
  movedRight: boolean
  leftBracket: boolean
  rightBracket: boolean
  previousJumped: boolean
  jumped: boolean
  leftJack: boolean
  rightJack: boolean
  leftDoubleStep: boolean
  rightDoubleStep: boolean

  initialState: ParityState
  resultState: ParityState
}

export const DEFAULT_WEIGHTS: { [key: string]: number } = {
  DOUBLESTEP: 750,
  BRACKETJACK: 60,
  JACK: 40,
  JUMP: 0,
  SLOW_BRACKET: 300,
  TWISTED_FOOT: 100000,
  BRACKETTAP: 400,
  XO_BR: 200,
  HOLDSWITCH: 55,
  MINE: 10000,
  FOOTSWITCH: 325,
  MISSED_FOOTSWITCH: 500,
  FACING: 3,
  DISTANCE: 6,
  SPIN: 3000,
  SIDESWITCH: 130,
  CROWDED_BRACKET: 0,
  OTHER: 0,
  START_XO: 10000,
}

export const WEIGHT_SHORT_NAMES: { [id: string]: string } = {
  DOUBLESTEP: "DST",
  BRACKETJACK: "BRJ",
  JACK: "JAK",
  JUMP: "JMP",
  SLOW_BRACKET: "SLWB",
  TWISTED_FOOT: "TWST",
  BRACKETTAP: "BRT",
  XO_BR: "XBR",
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

export enum TechCategory {
  Crossovers = 0,
  Footswitches,
  Sideswitches,
  Jacks,
  Brackets,
  Doublesteps,
  Holdswitch,
}

export const TECH_STRINGS: Record<number, string> = {
  [TechCategory.Crossovers]: "XO",
  [TechCategory.Footswitches]: "FS",
  [TechCategory.Sideswitches]: "SS",
  [TechCategory.Jacks]: "JA",
  [TechCategory.Brackets]: "BR",
  [TechCategory.Doublesteps]: "DS",
  [TechCategory.Holdswitch]: "HS",
}

export enum TechErrors {
  UnmarkedDoublestep = 0,
  MissedFootswitch,
  Ambiguous,
}

export const TECH_DESCRIPTIONS: {
  [key in TechCategory]: { title: string; description: string }
} = {
  [TechCategory.Crossovers]: {
    title: "Crossover",
    description: "One of the player's feet crosses over the other foot.",
  },
  [TechCategory.Footswitches]: {
    title: "Footswitch",
    description: "The player uses alternating feet to hit the same arrow.",
  },
  [TechCategory.Sideswitches]: {
    title: "Sideswitch",
    description:
      "The player uses alternating feet to hit the same arrow. The arrow appears on the left or right side of the stage.",
  },
  [TechCategory.Jacks]: {
    title: "Jack",
    description: "The player uses the same foot to hit the same arrow.",
  },
  [TechCategory.Brackets]: {
    title: "Bracket",
    description:
      "The player uses one foot to diagonally hit two arrows at once.",
  },
  [TechCategory.Doublesteps]: {
    title: "Doublestep",
    description:
      "The player uses the same foot twice in a row to hit two different arrows.",
  },
  [TechCategory.Holdswitch]: {
    title: "Holdswitch",
    description: "The player swaps which foot is holding a hold.",
  },
}

export const TECH_ERROR_STRINGS: Record<number, string> = {
  [TechErrors.UnmarkedDoublestep]: "DS",
  [TechErrors.MissedFootswitch]: "FS",
  [TechErrors.Ambiguous]: "AM",
}

export const TECH_ERROR_STRING_REVERSE: Record<string, TechErrors> =
  Object.fromEntries(
    Object.entries(TECH_ERROR_STRINGS).map(([k, v]) => [
      v,
      Number(k) as TechErrors,
    ])
  ) as Record<string, TechErrors>

export const TECH_ERROR_DESCRIPTIONS: {
  [key in TechErrors]: { title: string; description: string }
} = {
  [TechErrors.UnmarkedDoublestep]: {
    title: "Unmarked Doublestep",
    description:
      "A doublestep is present but there is no marking for it. You can mark a doublestep with a mine following it or having a hold on the other foot.",
  },
  [TechErrors.MissedFootswitch]: {
    title: "Mismarked Footswitch",
    description:
      "A mine that indicates a footswitch was placed for a jack. Either there is a doublestep or the mine is unnecessary.",
  },
  [TechErrors.Ambiguous]: {
    title: "Ambiguous Step",
    description:
      "The player does not know which foot to use for this step (usually after a jump).",
  },
}

export class ParityState {
  action: Foot[] = []
  combinedColumns: Foot[] = []
  movedFeet: Set<Foot> = new Set()
  holdFeet: Set<Foot> = new Set()
  frontFoot: Foot | null = null
  second: number
  beat: number
  rowKey: string

  footColumns: number[] = []

  constructor(row: Row, action: Foot[], columns: number[] = []) {
    this.second = row.second
    this.beat = row.beat
    this.rowKey = row.id
    this.action = [...action]
    this.footColumns = [...columns]
  }

  get leftHeel() {
    return this.footColumns[Foot.LEFT_HEEL]
  }

  get leftToe() {
    return this.footColumns[Foot.LEFT_TOE]
  }

  get rightHeel() {
    return this.footColumns[Foot.RIGHT_HEEL]
  }

  get rightToe() {
    return this.footColumns[Foot.RIGHT_TOE]
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

    return `${this.rowKey}-${this.action.join("")}-${this.combinedColumns.join("")}-${movedString}-${holdString}-${feetString}-${this.frontFoot}`
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
