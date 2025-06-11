import {
  DEFAULT_WEIGHTS,
  Foot,
  OTHER_PART_OF_FOOT,
  PlacementData,
  Row,
  State,
} from "./ParityDataTypes"

import { STAGE_LAYOUTS, StageLayout } from "./StageLayouts"

export class ParityCostCalculator {
  private readonly layout: StageLayout

  private WEIGHTS: { [key: string]: number }

  constructor(
    type: string,
    weights: { [key: string]: number } | undefined = undefined
  ) {
    this.layout = STAGE_LAYOUTS[type]
    if (weights != undefined) {
      this.WEIGHTS = { ...weights }
    } else {
      this.WEIGHTS = { ...DEFAULT_WEIGHTS }
    }
  }

  setWeights(newWeights: { [key: string]: number }) {
    this.WEIGHTS = { ...this.WEIGHTS, ...newWeights }
  }

  getPlacementData(initialState: State, resultState: State): PlacementData {
    const previousNonHeldFeet = initialState.movedFeet.difference(
      initialState.holdFeet
    )
    const nonHeldFeet = resultState.movedFeet.difference(resultState.holdFeet)

    const previousMovedLeft =
      previousNonHeldFeet.has(Foot.LEFT_HEEL) ||
      previousNonHeldFeet.has(Foot.LEFT_TOE)
    const previousMovedRight =
      previousNonHeldFeet.has(Foot.RIGHT_HEEL) ||
      previousNonHeldFeet.has(Foot.RIGHT_TOE)

    const movedLeft =
      nonHeldFeet.has(Foot.LEFT_HEEL) || nonHeldFeet.has(Foot.LEFT_TOE)
    const movedRight =
      nonHeldFeet.has(Foot.RIGHT_HEEL) || nonHeldFeet.has(Foot.RIGHT_TOE)

    const leftBracket =
      nonHeldFeet.has(Foot.LEFT_HEEL) && nonHeldFeet.has(Foot.LEFT_TOE)
    const rightBracket =
      nonHeldFeet.has(Foot.RIGHT_HEEL) && nonHeldFeet.has(Foot.RIGHT_TOE)

    const previousJumped =
      previousNonHeldFeet.has(Foot.LEFT_HEEL) &&
      previousNonHeldFeet.has(Foot.RIGHT_HEEL)

    const jumped =
      nonHeldFeet.has(Foot.LEFT_HEEL) && nonHeldFeet.has(Foot.RIGHT_HEEL)

    const leftJack =
      !jumped &&
      this.doFeetOverlap(
        initialState.leftHeel,
        initialState.leftToe,
        resultState.leftHeel,
        resultState.leftToe
      ) &&
      previousMovedLeft &&
      movedLeft
    const rightJack =
      !jumped &&
      this.doFeetOverlap(
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

    const previousLeftPos = this.layout.averagePoint(
      initialState.leftHeel,
      initialState.leftToe
    )

    const previousRightPos = this.layout.averagePoint(
      initialState.rightHeel,
      initialState.rightToe
    )

    const leftPos = this.layout.averagePoint(
      resultState.leftHeel,
      resultState.leftToe
    )
    const rightPos = this.layout.averagePoint(
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

  getActionCost(
    initialState: State,
    resultState: State,
    rows: Row[],
    rowIndex: number
  ): { [id: string]: number } {
    const lastRow = rows[rowIndex - 1]
    const row = rows[rowIndex]
    const elapsedTime = resultState.second - initialState.second

    const costs: { [id: string]: number } = {}

    // Calculate some data beforehand
    const placementData = this.getPlacementData(initialState, resultState)

    // Mine weighting

    costs["MINE"] = this.calcMineCosts(placementData, row)

    costs["HOLDSWITCH"] = this.calcHoldSwitchCosts(placementData, row)

    costs["BRACKETTAP"] = this.calcBracketTapCost(placementData, elapsedTime)

    // costs["OTHER"] = this.calcMovingFootWhileOtherIsntOnPadCost( // this shouldn't trigger?
    //   initialState,
    //   resultState
    // )

    costs["BRACKETJACK"] = this.calcBracketJackCost(placementData)

    costs["XO_BR"] = this.calcXOBRCost(placementData)

    costs["DOUBLESTEP"] = this.calcDoublestepCost(placementData, lastRow, row)

    costs["JUMP"] = this.calcJumpCost(placementData, elapsedTime)

    costs["SLOW_BRACKET"] = this.calcSlowBracketCost(placementData, elapsedTime)

    costs["TWISTED_FOOT"] = this.calcTwistedFoot(placementData)

    // if (combinedPlacement.leftToe == -1)
    //   combinedPlacement.leftToe = combinedPlacement.leftHeel
    // if (combinedPlacement.rightToe == -1)
    //   combinedPlacement.rightToe = combinedPlacement.rightHeel

    costs["FACING"] = this.calcFacingCost(placementData)

    costs["SPIN"] = this.calcSpinCost(placementData)

    costs["FOOTSWITCH"] = this.calcSlowFootswitchCost(
      placementData,
      row,
      elapsedTime
    )

    costs["SIDESWITCH"] = this.calcSideswitchCost(placementData)

    // add penalty if jacked

    costs["MISSED_FOOTSWITCH"] = this.calcMissedFootswitchCost(
      placementData,
      row
    )

    // To do: small weighting for swapping heel with toe or toe with heel (both add up)

    // To do: huge weighting for having foot direction opposite of eachother (can't twist one leg 180 degrees)

    costs["JACK"] = this.calcJackCost(placementData, elapsedTime)

    costs["DISTANCE"] = this.calcDistanceCost(placementData, elapsedTime)

    costs["CROWDED_BRACKET"] = this.calcCrowdedBracketCost(
      placementData,
      elapsedTime
    )

    let totalCost = 0
    for (const c in costs) {
      totalCost += costs[c]
    }
    costs["TOTAL"] = totalCost
    return costs
  }

  // Does the left foot in resultPlacement overlap the right foot in initialPlacement?
  doesLeftFootOverlapRight(data: PlacementData): boolean {
    if (data.resultState.rightHeel == -1) return false
    if (
      data.resultState.rightHeel == data.resultState.leftHeel ||
      data.resultState.rightHeel == data.resultState.leftToe
    ) {
      return true
    }
    if (data.resultState.rightToe == -1) return false
    if (
      data.resultState.rightToe == data.resultState.leftHeel ||
      data.resultState.rightToe == data.resultState.leftToe
    ) {
      return true
    }

    return false
  }

  // Does the right foot in resultPlacement overlap the left foot in initialPlacement?
  doesRightFootOverlapLeft(data: PlacementData): boolean {
    if (data.resultState.leftHeel == -1) return false
    if (
      data.resultState.leftHeel == data.resultState.rightHeel ||
      data.resultState.leftHeel == data.resultState.rightToe
    ) {
      return true
    }
    if (data.resultState.leftToe == -1) return false
    if (
      data.resultState.leftToe == data.resultState.rightHeel ||
      data.resultState.leftToe == data.resultState.rightToe
    ) {
      return true
    }

    return false
  }

  doFeetOverlap(
    oldHeel: number,
    oldToe: number,
    newHeel: number,
    newToe: number
  ): boolean {
    if (oldHeel != -1) {
      if (oldHeel == newHeel || oldHeel == newToe) {
        return true
      }
    }

    if (oldToe != -1) {
      if (oldToe == newHeel || oldToe == newToe) {
        return true
      }
    }

    return false
  }

  // breakout all of the function costs

  calcMineCosts(data: PlacementData, row: Row) {
    for (let i = 0; i < this.layout.layout.length; i++) {
      if (
        data.resultState.combinedColumns[i] != Foot.NONE &&
        row.mines[i] !== undefined
      ) {
        return this.WEIGHTS.MINE
      }
    }
    return 0
  }

  calcHoldSwitchCosts(data: PlacementData, row: Row) {
    let cost = 0

    for (let c = 0; c < row.holds.length; c++) {
      if (row.holds[c] === undefined) continue
      if (row.holds[c]!.beat < data.initialState.beat) continue // the new hold wasn't there in the previous row
      const initialFoot = data.initialState.combinedColumns[c]
      const resultFoot = data.resultState.combinedColumns[c]
      if (initialFoot != resultFoot) {
        const tempcost =
          this.WEIGHTS.HOLDSWITCH *
          (data.resultState.footColumns[initialFoot] == -1
            ? 1
            : Math.sqrt(
                this.layout.getDistanceSq(
                  c,
                  data.resultState.footColumns[initialFoot]
                )
              ))
        // const tempcost2 =
        //   this.WEIGHTS.HOLDSWITCH *
        //   (data.initialState.footColumns[resultFoot] == -1
        //     ? 1
        //     : Math.sqrt(
        //         this.layout.getDistanceSq(
        //           c,
        //           data.resultState.footColumns[resultFoot]
        //         )
        //       ))
        cost += tempcost
      }
    }

    return cost
  }

  calcBracketTapCost(data: PlacementData, elapsedTime: number) {
    let cost = 0

    // Small penalty for trying to jack a bracket during a hold
    if (data.resultState.leftHeel != -1 && data.resultState.leftToe != -1) {
      let jackPenalty = 1
      if (
        data.initialState.movedFeet.has(Foot.LEFT_HEEL) ||
        data.initialState.movedFeet.has(Foot.LEFT_TOE)
      )
        jackPenalty = 1 / elapsedTime
      if (
        data.resultState.holdFeet.has(Foot.LEFT_HEEL) !=
        data.resultState.holdFeet.has(Foot.LEFT_TOE)
      ) {
        cost += this.WEIGHTS.BRACKETTAP * jackPenalty
      }
    }

    if (data.resultState.rightHeel != -1 && data.resultState.rightToe != -1) {
      let jackPenalty = 1
      if (
        data.initialState.movedFeet.has(Foot.RIGHT_HEEL) ||
        data.initialState.movedFeet.has(Foot.RIGHT_TOE)
      )
        jackPenalty = 1 / elapsedTime
      if (
        data.resultState.holdFeet.has(Foot.RIGHT_HEEL) !=
        data.resultState.holdFeet.has(Foot.RIGHT_TOE)
      ) {
        cost += this.WEIGHTS.BRACKETTAP * jackPenalty
      }
    }

    return cost
  }

  // Old "OTHER" cost
  calcMovingFootWhileOtherIsntOnPadCost(
    initialState: State,
    resultState: State
  ) {
    let cost = 0

    // Weighting for moving a foot while the other isn't on the pad (so marked doublesteps are less bad than this)
    if (initialState.combinedColumns.some(x => x != Foot.NONE)) {
      for (const f of resultState.movedFeet) {
        switch (f) {
          case Foot.LEFT_HEEL:
          case Foot.LEFT_TOE:
            if (
              !(
                initialState.combinedColumns.includes(Foot.RIGHT_HEEL) ||
                initialState.combinedColumns.includes(Foot.RIGHT_TOE)
              )
            )
              cost += this.WEIGHTS.OTHER
            break
          case Foot.RIGHT_HEEL:
          case Foot.RIGHT_TOE:
            if (
              !(
                initialState.combinedColumns.includes(Foot.LEFT_HEEL) ||
                initialState.combinedColumns.includes(Foot.LEFT_TOE)
              )
            )
              cost += this.WEIGHTS.OTHER
            break
        }
      }
    }

    return cost
  }

  calcBracketJackCost(data: PlacementData) {
    if (data.jumped) return 0
    if (
      (data.leftJack && data.leftBracket) ||
      (data.rightJack && data.rightBracket)
    ) {
      return this.WEIGHTS.BRACKETJACK
    }
    return 0
  }

  calcXOBRCost(data: PlacementData) {
    let cost = 0
    const crossedOver = data.rightPos.x < data.leftPos.x
    if (data.leftBracket && crossedOver) {
      cost += this.WEIGHTS.XO_BR
    }
    if (data.rightBracket && crossedOver) {
      cost += this.WEIGHTS.XO_BR
    }
    return cost
  }

  calcDoublestepCost(data: PlacementData, lastRow: Row, row: Row) {
    if (data.leftDoubleStep || data.rightDoubleStep) {
      // Check if we are allowed to DS

      for (let i = 0; i < this.layout.layout.length; i++) {
        const hold = lastRow.holds[i]
        // If there is a hold that extends past the last row, we can DS
        if ((hold && !lastRow.holdTails.has(i)) || row.holds[i] !== undefined) {
          return 0
        }
      }
      return this.WEIGHTS.DOUBLESTEP
    }
    return 0
  }

  calcJumpCost(data: PlacementData, elapsedTime: number) {
    if (data.jumped) return this.WEIGHTS.JUMP / elapsedTime
    return 0
  }

  private slowBracketThreshold = 0.15
  calcSlowBracketCost(data: PlacementData, elapsedTime: number) {
    if (
      elapsedTime > this.slowBracketThreshold &&
      (data.leftBracket || data.rightBracket) &&
      !data.jumped
    ) {
      return (
        (elapsedTime - this.slowBracketThreshold) * this.WEIGHTS.SLOW_BRACKET
      )
    }
    return 0
  }

  // Does this placement result in one of the feet being twisted around?
  // This should probably be getting filtered out as an invalid positioning before we
  // even get here, but :shrug:
  calcTwistedFoot(data: PlacementData) {
    const crossedOver = data.rightPos.x < data.leftPos.x
    const rightBackwards =
      data.resultState.rightHeel != -1 && data.resultState.rightToe != -1
        ? this.layout.layout[data.resultState.rightToe].y <
          this.layout.layout[data.resultState.rightHeel].y
        : false

    const leftBackwards =
      data.resultState.leftHeel != -1 && data.resultState.leftToe != -1
        ? this.layout.layout[data.resultState.leftToe].y <
          this.layout.layout[data.resultState.leftHeel].y
        : false

    if (!crossedOver && (rightBackwards || leftBackwards)) {
      return this.WEIGHTS.TWISTED_FOOT
    }
    return 0
  }

  calcFacingCost(data: PlacementData) {
    let cost = 0

    // facing backwards gives a bit of bad weight (scaled heavily the further back you angle, so crossovers aren't Too bad; less bad than doublesteps)
    const heelFacing =
      data.resultState.leftHeel != -1 && data.resultState.rightHeel != -1
        ? this.layout.getFacingDirectionCosine(
            data.resultState.leftHeel,
            data.resultState.rightHeel
          )
        : 0

    const heelFacingPenalty = Math.pow(-Math.min(heelFacing, 0), 7.2) * 200
    if (heelFacingPenalty > 0) cost += heelFacingPenalty * this.WEIGHTS.FACING
    return cost
  }

  calcSpinCost(data: PlacementData) {
    let cost = 0

    // spin

    if (
      data.rightPos.x < data.leftPos.x &&
      data.previousRightPos.x < data.previousLeftPos.x &&
      data.rightPos.y < data.leftPos.y &&
      data.previousRightPos.y > data.previousLeftPos.y
    ) {
      cost += this.WEIGHTS.SPIN
    }
    if (
      data.rightPos.x < data.leftPos.x &&
      data.previousRightPos.x < data.previousLeftPos.x &&
      data.rightPos.y > data.leftPos.y &&
      data.previousRightPos.y < data.previousLeftPos.y
    ) {
      cost += this.WEIGHTS.SPIN
    }

    // if (
    //   leftPos.y < rightPos.y &&
    //   previousLeftPos.y < previousRightPos.y &&
    //   rightPos.x > leftPos.x &&
    //   previousRightPos.x < previousLeftPos.x
    // ) {
    //   cost += this.WEIGHTS.SPIN
    // }

    return cost
  }

  // Footswitches are harder to do when they get too slow.
  // Notes with an elapsed time greater than this will incur a penalty
  // 0.2 = 8th notes at 150 bpm
  private SlowFootswitchThreshold = 0.2

  private SlowFootswitchIgnore = 0.4
  calcSlowFootswitchCost(data: PlacementData, row: Row, elapsedTime: number) {
    // ignore footswitch with elapsed times <= SlowFootswitchThreshold; penalise slower footswitches based on distance
    if (
      elapsedTime < this.SlowFootswitchThreshold ||
      elapsedTime >= this.SlowFootswitchIgnore
    ) {
      return 0
    }

    // footswitching has no penalty if there's a mine nearby
    if (
      row.mines.some(x => x !== undefined) ||
      row.fakeMines.some(x => x !== undefined)
    ) {
      return 0
    }

    // const timeScaled = elapsedTime - this.SlowFootswitchThreshold

    let cost = 0

    for (const foot of data.resultState.movedFeet) {
      const col = data.resultState.footColumns[foot]
      if (data.initialState.combinedColumns[col] == Foot.NONE) continue
      if (
        data.initialState.combinedColumns[col] == foot ||
        data.initialState.combinedColumns[col] == OTHER_PART_OF_FOOT[foot]
      )
        continue
      cost +=
        ((elapsedTime - this.SlowFootswitchThreshold) / elapsedTime) *
        this.WEIGHTS.FOOTSWITCH
    }

    return cost
  }

  calcSideswitchCost(data: PlacementData) {
    let cost = 0

    this.layout.sideArrows.forEach(col => {
      if (data.resultState.action[col] == Foot.NONE) return
      if (data.initialState.combinedColumns[col] == Foot.NONE) return
      if (
        data.initialState.combinedColumns[col] ==
          data.resultState.action[col] ||
        data.initialState.combinedColumns[col] ==
          OTHER_PART_OF_FOOT[data.resultState.action[col]]
      )
        return
      cost += this.WEIGHTS.SIDESWITCH
    })

    return cost
  }

  calcMissedFootswitchCost(data: PlacementData, row: Row) {
    if (
      (data.leftJack || data.rightJack) &&
      (row.mines.some(x => x !== undefined) ||
        row.fakeMines.some(x => x !== undefined))
    ) {
      return this.WEIGHTS.MISSED_FOOTSWITCH
    }

    return 0
  }

  // Jacks are hard to do the faster they are.
  // Notes with an elapsed time less than this will incur a penalty
  // 0.125 = 16th note at 120bpm
  private JackMaxElapsedTime = 0.125

  calcJackCost(data: PlacementData, elapsedTime: number) {
    // weighting for jacking two notes too close to eachother
    if (
      elapsedTime < this.JackMaxElapsedTime &&
      (data.leftJack || data.rightJack) &&
      !data.previousJumped
    ) {
      return (1 / elapsedTime - 1 / this.JackMaxElapsedTime) * this.WEIGHTS.JACK
    }
    return 0
  }

  calcDistanceCost(data: PlacementData, elapsedTime: number) {
    let cost = 0

    // To do: weighting for moving a foot a far distance in a fast time
    for (const foot of [Foot.LEFT_HEEL, Foot.RIGHT_HEEL]) {
      if (!data.resultState.movedFeet.has(foot)) continue

      const initialPosition =
        foot == Foot.LEFT_HEEL ? data.previousLeftPos : data.previousRightPos

      const resultPosition =
        foot == Foot.LEFT_HEEL ? data.leftPos : data.rightPos

      // If we're bracketing something, and the previous position + new position had an overlap,
      // then we don't need to worry about it, we're not actually moving
      // the foot very far
      const isBracketing =
        foot == Foot.LEFT_HEEL ? data.leftBracket : data.rightBracket
      if (isBracketing) {
        const initialHeel = data.initialState.footColumns[foot]
        const initialToe =
          data.initialState.footColumns[OTHER_PART_OF_FOOT[foot]]

        const resultHeel = data.resultState.footColumns[foot]
        let resultToe = data.resultState.footColumns[OTHER_PART_OF_FOOT[foot]]
        if (resultToe == -1) resultToe = resultHeel

        if (initialHeel != -1) {
          if (initialHeel == resultHeel || initialHeel == resultToe) {
            continue
          }
        }

        if (initialToe != -1) {
          if (initialToe == resultHeel || initialToe == resultToe) {
            continue
          }
        }
      }

      if (data.previousJumped && !data.jumped && elapsedTime < 0.25) {
        elapsedTime = Math.pow(elapsedTime, 1.5)
      }

      const dist =
        (Math.sqrt(
          this.layout.getDistanceSqPoints(initialPosition, resultPosition)
        ) *
          this.WEIGHTS.DISTANCE) /
        elapsedTime
      // if (isBracketing) {
      //   dist = dist * 0.2
      // }

      cost += dist
    }
    return cost
  }

  calcCrowdedBracketCost(data: PlacementData, elapsedTime: number) {
    let cost = 0

    // Are we trying to bracket a column that the other foot was just on?

    if (data.leftBracket && this.doesLeftFootOverlapRight(data)) {
      cost += this.WEIGHTS.CROWDED_BRACKET / elapsedTime
    }

    if (data.rightBracket && this.doesRightFootOverlapLeft(data)) {
      cost += this.WEIGHTS.CROWDED_BRACKET / elapsedTime
    }

    return cost
  }
}
