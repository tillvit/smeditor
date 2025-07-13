import { Foot, ParityState, PlacementData, Row } from "./ParityDataTypes"
import { doFeetOverlap } from "./ParityUtils"

export interface StagePoint {
  x: number
  y: number
  rotation: number
}

export class StageLayout {
  name: string
  layout: StagePoint[]
  columnCount: number
  upArrows: number[]
  downArrows: number[]
  sideArrows: number[]
  constructor(
    name: string,
    layout: StagePoint[],
    upArrows: number[],
    downArrows: number[],
    sideArrows: number[]
  ) {
    this.name = name
    this.layout = layout
    this.columnCount = layout.length
    this.upArrows = upArrows
    this.downArrows = downArrows
    this.sideArrows = sideArrows
  }

  // Returns the cosine of the angle made between the player's
  // left and right feet and the x-axis.
  // This value can inform us on the degree of turning, but
  // not which way the player is turned
  getFacingDirectionCosine(leftIndex: number, rightIndex: number) {
    if (leftIndex == rightIndex) return 0
    let dx = this.layout[rightIndex].x - this.layout[leftIndex].x
    const dy = this.layout[rightIndex].y - this.layout[leftIndex].y

    const distance = Math.sqrt(dx * dx + dy * dy)
    dx /= distance
    return dx
  }

  getYDifference(leftIndex: number, rightIndex: number) {
    if (leftIndex == rightIndex) return 0
    const dx = this.layout[rightIndex].x - this.layout[leftIndex].x
    let dy = this.layout[rightIndex].y - this.layout[leftIndex].y

    const distance = Math.sqrt(dx * dx + dy * dy)
    dy /= distance

    const negative = dy <= 0

    dy = Math.pow(dy, 4)

    if (negative) dy = -dy

    return dy
  }

  averagePoint(leftIndex: number, rightIndex: number) {
    if (leftIndex == -1 && rightIndex == -1) return { x: 0, y: 0 }
    if (leftIndex == -1) return this.layout[rightIndex]
    if (rightIndex == -1) return this.layout[leftIndex]
    return {
      x: (this.layout[leftIndex].x + this.layout[rightIndex].x) / 2,
      y: (this.layout[leftIndex].y + this.layout[rightIndex].y) / 2,
    }
  }

  getDistanceSq(leftIndex: number, rightIndex: number) {
    const p1 = this.layout[leftIndex]
    const p2 = this.layout[rightIndex]
    return (p1.y - p2.y) * (p1.y - p2.y) + (p1.x - p2.x) * (p1.x - p2.x)
  }

  getDistanceSqPoints(
    p1: { x: number; y: number },
    p2: { x: number; y: number }
  ) {
    return (p1.y - p2.y) * (p1.y - p2.y) + (p1.x - p2.x) * (p1.x - p2.x)
  }

  bracketCheck(column1: number, column2: number) {
    return this.getDistanceSq(column1, column2) <= 2
  }

  getPlayerAngle(leftIndex: number, rightIndex: number) {
    const left = this.layout[leftIndex]
    const right = this.layout[rightIndex]
    const x1 = right.x - left.x
    const y1 = right.y - left.y
    const x2 = 1
    const y2 = 0
    const dot = x1 * x2 + y1 * y2
    const det = x1 * y2 - y1 * x2
    return Math.atan2(det, dot)
  }

  getPlacementData(
    initialState: ParityState,
    resultState: ParityState,
    lastRow: Row,
    row: Row
  ): PlacementData {
    const previousNonHeldFeet = []
    const nonHeldFeet = []

    for (let i = 0; i < this.layout.length; i++) {
      if (
        lastRow &&
        lastRow.holds[i] === undefined &&
        initialState.action[i] != Foot.NONE
      ) {
        previousNonHeldFeet[initialState.action[i]] = true
      }

      if (row.holds[i] === undefined && resultState.action[i] != Foot.NONE) {
        nonHeldFeet[resultState.action[i]] = true
      }
    }

    const previousMovedLeft =
      previousNonHeldFeet[Foot.LEFT_HEEL] || previousNonHeldFeet[Foot.LEFT_TOE]
    const previousMovedRight =
      previousNonHeldFeet[Foot.RIGHT_HEEL] ||
      previousNonHeldFeet[Foot.RIGHT_TOE]

    const movedLeft = nonHeldFeet[Foot.LEFT_HEEL] || nonHeldFeet[Foot.LEFT_TOE]
    const movedRight =
      nonHeldFeet[Foot.RIGHT_HEEL] || nonHeldFeet[Foot.RIGHT_TOE]

    const leftBracket =
      nonHeldFeet[Foot.LEFT_HEEL] && nonHeldFeet[Foot.LEFT_TOE]
    const rightBracket =
      nonHeldFeet[Foot.RIGHT_HEEL] && nonHeldFeet[Foot.RIGHT_TOE]

    const previousJumped =
      previousNonHeldFeet[Foot.LEFT_HEEL] &&
      previousNonHeldFeet[Foot.RIGHT_HEEL]

    const jumped = nonHeldFeet[Foot.LEFT_HEEL] && nonHeldFeet[Foot.RIGHT_HEEL]

    const leftJack =
      !jumped &&
      doFeetOverlap(
        initialState.leftHeel,
        initialState.leftToe,
        resultState.leftHeel,
        resultState.leftToe
      ) &&
      previousMovedLeft &&
      movedLeft
    const rightJack =
      !jumped &&
      doFeetOverlap(
        initialState.rightHeel,
        initialState.rightToe,
        resultState.rightHeel,
        resultState.rightToe
      ) &&
      previousMovedRight &&
      movedRight

    const leftDoubleStep =
      previousMovedLeft && movedLeft && !jumped && !leftJack && !previousJumped
    const rightDoubleStep =
      previousMovedRight &&
      movedRight &&
      !jumped &&
      !rightJack &&
      !previousJumped

    const previousLeftPos = this.averagePoint(
      initialState.leftHeel,
      initialState.leftToe
    )

    const previousRightPos = this.averagePoint(
      initialState.rightHeel,
      initialState.rightToe
    )

    const leftPos = this.averagePoint(resultState.leftHeel, resultState.leftToe)
    const rightPos = this.averagePoint(
      resultState.rightHeel,
      resultState.rightToe
    )

    return {
      previousLeftPos,
      previousRightPos,
      leftPos,
      rightPos,
      movedLeft,
      movedRight,
      leftBracket,
      rightBracket,
      previousJumped,
      jumped,
      leftJack,
      rightJack,
      leftDoubleStep,
      rightDoubleStep,
      initialState,
      resultState,
    }
  }
}

export const STAGE_LAYOUTS: { [id: string]: StageLayout } = {
  "dance-single": new StageLayout(
    "dance-single",
    [
      { x: -1, y: 0, rotation: 0 }, // Left
      { x: 0, y: -1, rotation: (Math.PI / 2) * 3 }, // Down
      { x: 0, y: 1, rotation: Math.PI / 2 }, // Up
      { x: 1, y: 0, rotation: Math.PI }, // Right
    ],
    [2],
    [1],
    [0, 3]
  ),
  "dance-double": new StageLayout(
    "dance-double",
    [
      { x: -2.5, y: 0, rotation: 0 }, // P1 Left
      { x: -1.5, y: -1, rotation: (Math.PI / 2) * 3 }, // P1 Down
      { x: -1.5, y: 1, rotation: Math.PI / 2 }, // P1 Up
      { x: -0.5, y: 0, rotation: Math.PI }, // P1 Right

      { x: 0.5, y: 0, rotation: 0 }, // P2 Left
      { x: 1.5, y: -1, rotation: (Math.PI / 2) * 3 }, // P2 Down
      { x: 1.5, y: 1, rotation: Math.PI / 2 }, // P2 Up
      { x: 2.5, y: 0, rotation: Math.PI }, // P2 Right
    ],
    [2, 6],
    [1, 5],
    [0, 3, 4, 7]
  ),
}
