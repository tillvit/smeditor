import {
  DEFAULT_WEIGHTS,
  Foot,
  FootPlacement,
  OTHER_PART_OF_FOOT,
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

  getActionCost(
    initialState: State,
    resultState: State,
    rows: Row[],
    rowIndex: number
  ): { [id: string]: number } {
    const row = rows[rowIndex]
    const elapsedTime = resultState.second - initialState.second

    const costs: { [id: string]: number } = {}

    const combinedColumns: Foot[] = resultState.combinedColumns

    // Where were the feet before this state?
    const initialPlacement = this.footPlacementFromColumns(
      initialState.combinedColumns
    )
    // How did the feet move during this state?
    const resultPlacement = this.footPlacementFromColumns(resultState.action)
    // What do the feet end up at the end of this state?
    const combinedPlacement = this.footPlacementFromColumns(combinedColumns)

    // Mine weighting

    costs["MINE"] = this.calcMineCosts(combinedColumns, row)

    costs["HOLDSWITCH"] = this.calcHoldSwitchCosts(
      initialState,
      combinedColumns,
      row
    )

    costs["BRACKETTAP"] = this.calcBracketTapCost(
      initialState,
      row,
      resultPlacement,
      elapsedTime
    )

    costs["OTHER"] = this.calcMovingFootWhileOtherIsntOnPadCost(
      initialState,
      resultState
    )

    const movedLeft =
      resultState.movedFeet.has(Foot.LEFT_HEEL) ||
      resultState.movedFeet.has(Foot.LEFT_TOE)
    const movedRight =
      resultState.movedFeet.has(Foot.RIGHT_HEEL) ||
      resultState.movedFeet.has(Foot.RIGHT_TOE)

    const didJump =
      ((initialState.movedFeet.has(Foot.LEFT_HEEL) &&
        !initialState.holdFeet.has(Foot.LEFT_HEEL)) ||
        (initialState.movedFeet.has(Foot.LEFT_TOE) &&
          !initialState.holdFeet.has(Foot.LEFT_TOE))) &&
      ((initialState.movedFeet.has(Foot.RIGHT_HEEL) &&
        !initialState.holdFeet.has(Foot.RIGHT_HEEL)) ||
        (initialState.movedFeet.has(Foot.RIGHT_TOE) &&
          !initialState.holdFeet.has(Foot.RIGHT_TOE)))

    // jacks don't matter if you did a jump before

    let jackedLeft = false
    let jackedRight = false

    if (!didJump) {
      if (resultPlacement.leftHeel != -1 && movedLeft) {
        const startColumns = new Set()
        if (
          initialState.movedFeet.has(Foot.LEFT_HEEL) &&
          !initialState.holdFeet.has(Foot.LEFT_HEEL)
        ) {
          startColumns.add(initialState.footColumns[Foot.LEFT_HEEL])
        }
        if (
          initialState.movedFeet.has(Foot.LEFT_TOE) &&
          !initialState.holdFeet.has(Foot.LEFT_TOE)
        ) {
          startColumns.add(initialState.footColumns[Foot.LEFT_TOE])
        }
        const endColumns = new Set()
        if (
          resultState.movedFeet.has(Foot.LEFT_HEEL) &&
          !resultState.holdFeet.has(Foot.LEFT_HEEL)
        ) {
          endColumns.add(resultState.footColumns[Foot.LEFT_HEEL])
        }
        if (
          resultState.movedFeet.has(Foot.LEFT_HEEL) &&
          !resultState.holdFeet.has(Foot.LEFT_TOE)
        ) {
          endColumns.add(resultState.footColumns[Foot.LEFT_TOE])
        }
        jackedLeft = startColumns.intersection(endColumns).size > 0

        // if (
        //   initialState.combinedColumns[resultPlacement.leftHeel] ==
        //     Foot.LEFT_HEEL &&
        //   !resultState.holdFeet.has(Foot.LEFT_HEEL) &&
        //   ((initialState.movedFeet.has(Foot.LEFT_HEEL) &&
        //     !initialState.holdFeet.has(Foot.LEFT_HEEL)) ||
        //     (initialState.movedFeet.has(Foot.LEFT_TOE) &&
        //       !initialState.holdFeet.has(Foot.LEFT_TOE)))
        // )
        //   jackedLeft = true
        // if (
        //   initialState.combinedColumns[resultPlacement.leftToe] ==
        //     Foot.LEFT_TOE &&
        //   !resultState.holdFeet.has(Foot.LEFT_TOE) &&
        //   ((initialState.movedFeet.has(Foot.LEFT_HEEL) &&
        //     !initialState.holdFeet.has(Foot.LEFT_HEEL)) ||
        //     (initialState.movedFeet.has(Foot.LEFT_TOE) &&
        //       !initialState.holdFeet.has(Foot.LEFT_TOE)))
        // )
        //   jackedLeft = true
      }

      if (resultPlacement.rightHeel != -1 && movedRight) {
        // if (
        //   initialState.combinedColumns[resultPlacement.rightHeel] ==
        //     Foot.RIGHT_HEEL &&
        //   !resultState.holdFeet.has(Foot.RIGHT_HEEL) &&
        //   ((initialState.movedFeet.has(Foot.RIGHT_HEEL) &&
        //     !initialState.holdFeet.has(Foot.RIGHT_HEEL)) ||
        //     (initialState.movedFeet.has(Foot.RIGHT_TOE) &&
        //       !initialState.holdFeet.has(Foot.RIGHT_TOE)))
        // )
        //   jackedRight = true
        // if (
        //   initialState.combinedColumns[resultPlacement.rightToe] ==
        //     Foot.RIGHT_TOE &&
        //   !resultState.holdFeet.has(Foot.RIGHT_TOE) &&
        //   ((initialState.movedFeet.has(Foot.RIGHT_HEEL) &&
        //     !initialState.holdFeet.has(Foot.RIGHT_HEEL)) ||
        //     (initialState.movedFeet.has(Foot.RIGHT_TOE) &&
        //       !initialState.holdFeet.has(Foot.RIGHT_TOE)))
        // )
        //   jackedRight = true
        const startColumns = new Set()
        if (
          initialState.movedFeet.has(Foot.RIGHT_HEEL) &&
          !initialState.holdFeet.has(Foot.RIGHT_HEEL)
        ) {
          startColumns.add(initialState.footColumns[Foot.RIGHT_HEEL])
        }
        if (
          initialState.movedFeet.has(Foot.RIGHT_TOE) &&
          !initialState.holdFeet.has(Foot.RIGHT_TOE)
        ) {
          startColumns.add(initialState.footColumns[Foot.RIGHT_TOE])
        }
        const endColumns = new Set()
        if (
          resultState.movedFeet.has(Foot.RIGHT_HEEL) &&
          !resultState.holdFeet.has(Foot.RIGHT_HEEL)
        ) {
          endColumns.add(resultState.footColumns[Foot.RIGHT_HEEL])
        }
        if (
          resultState.movedFeet.has(Foot.RIGHT_HEEL) &&
          !resultState.holdFeet.has(Foot.RIGHT_TOE)
        ) {
          endColumns.add(resultState.footColumns[Foot.RIGHT_TOE])
        }
        jackedRight = startColumns.intersection(endColumns).size > 0
      }
    }

    // Doublestep weighting doesn't apply if you just did a jump or a jack

    costs["BRACKETJACK"] = this.calcBracketJackCost(
      resultState,
      movedLeft,
      movedRight,
      didJump,
      jackedLeft,
      jackedRight
    )
    costs["DOUBLESTEP"] = this.calcDoublestepCost(
      initialState,
      resultState,
      movedLeft,
      movedRight,
      didJump,
      jackedLeft,
      jackedRight,
      row,
      rows,
      rowIndex
    )

    costs["JUMP"] = this.calcJumpCost(row, movedLeft, movedRight, elapsedTime)
    costs["SLOW_BRACKET"] = this.calcSlowBracketCost(
      row,
      movedLeft,
      movedRight,
      elapsedTime
    )

    costs["TWISTED_FOOT"] = this.calcTwistedFoot(combinedPlacement)

    if (combinedPlacement.leftToe == -1)
      combinedPlacement.leftToe = combinedPlacement.leftHeel
    if (combinedPlacement.rightToe == -1)
      combinedPlacement.rightToe = combinedPlacement.rightHeel

    costs["FACING"] = this.calcFacingCost(combinedPlacement)

    costs["SPIN"] = this.calcSpinCost(initialState, combinedPlacement)

    costs["FOOTSWITCH"] = this.calcSlowFootswitchCost(
      initialState,
      resultState,
      combinedColumns,
      row,
      elapsedTime
    )

    costs["SIDESWITCH"] = this.calcSideswitchCost(initialState, resultState)

    // add penalty if jacked

    costs["MISSED_FOOTSWITCH"] = this.calcMissedFootswitchCost(
      jackedLeft,
      jackedRight,
      row
    )

    // To do: small weighting for swapping heel with toe or toe with heel (both add up)

    // To do: huge weighting for having foot direction opposite of eachother (can't twist one leg 180 degrees)

    costs["JACK"] = this.calcJackCost(
      jackedLeft,
      jackedRight,
      movedLeft,
      movedRight,
      elapsedTime
    )

    costs["DISTANCE"] = this.calcDistanceCost(
      initialState,
      resultState,
      elapsedTime,
      didJump
    )

    costs["CROWDED_BRACKET"] = this.calcCrowdedBracketCost(
      initialPlacement,
      resultPlacement,
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
  doesLeftFootOverlapRight(
    initialPlacement: FootPlacement,
    resultPlacement: FootPlacement
  ): boolean {
    if (
      initialPlacement.rightHeel > -1 &&
      (initialPlacement.rightHeel == resultPlacement.leftHeel ||
        initialPlacement.rightHeel == resultPlacement.leftToe)
    ) {
      return true
    }
    if (
      initialPlacement.rightToe > -1 &&
      (initialPlacement.rightToe == resultPlacement.leftHeel ||
        initialPlacement.rightToe == resultPlacement.leftToe)
    ) {
      return true
    }

    return false
  }

  // Does the right foot in resultPlacement overlap the left foot in initialPlacement?
  doesRightFootOverlapLeft(
    initialPlacement: FootPlacement,
    resultPlacement: FootPlacement
  ): boolean {
    if (
      initialPlacement.leftHeel > -1 &&
      (initialPlacement.leftHeel == resultPlacement.rightHeel ||
        initialPlacement.leftHeel == resultPlacement.rightToe)
    ) {
      return true
    }
    if (
      initialPlacement.leftToe > -1 &&
      (initialPlacement.leftToe == resultPlacement.rightHeel ||
        initialPlacement.leftToe == resultPlacement.rightToe)
    ) {
      return true
    }

    return false
  }

  // Does either foot from resultPlacement overlap the other in initialPlacement?
  doFeetOverlap(
    initialPlacement: FootPlacement,
    resultPlacement: FootPlacement
  ): boolean {
    return (
      this.doesRightFootOverlapLeft(initialPlacement, resultPlacement) ||
      this.doesLeftFootOverlapRight(initialPlacement, resultPlacement)
    )
  }

  footPlacementFromColumns(columns: Foot[]): FootPlacement {
    const placement: FootPlacement = {
      leftHeel: -1,
      leftToe: -1,
      rightHeel: -1,
      rightToe: -1,
      leftBracket: false,
      rightBracket: false,
    }

    for (let i = 0; i < columns.length; i++) {
      switch (columns[i]) {
        case Foot.NONE:
          break
        case Foot.LEFT_HEEL:
          placement.leftHeel = i
          break
        case Foot.LEFT_TOE:
          placement.leftToe = i
          break
        case Foot.RIGHT_HEEL:
          placement.rightHeel = i
          break
        case Foot.RIGHT_TOE:
          placement.rightToe = i
          break
      }
    }

    if (placement.leftHeel > -1 && placement.leftToe > -1) {
      placement.leftBracket = true
    }
    if (placement.rightHeel > -1 && placement.rightToe > -1) {
      placement.rightBracket = true
    }

    return placement
  }

  // breakout all of the function costs

  calcMineCosts(combinedColumns: Foot[], row: Row) {
    let cost = 0
    for (let i = 0; i < combinedColumns.length; i++) {
      if (combinedColumns[i] != Foot.NONE && row.mines[i] !== undefined) {
        cost += this.WEIGHTS.MINE
        break
      }
    }
    return cost
  }

  calcHoldSwitchCosts(initialState: State, combinedColumns: Foot[], row: Row) {
    let cost = 0

    for (let c = 0; c < row.holds.length; c++) {
      if (row.holds[c] === undefined) continue
      if (
        ((combinedColumns[c] == Foot.LEFT_HEEL ||
          combinedColumns[c] == Foot.LEFT_TOE) &&
          initialState.combinedColumns[c] != Foot.LEFT_TOE &&
          initialState.combinedColumns[c] != Foot.LEFT_HEEL) ||
        ((combinedColumns[c] == Foot.RIGHT_HEEL ||
          combinedColumns[c] == Foot.RIGHT_TOE) &&
          initialState.combinedColumns[c] != Foot.RIGHT_TOE &&
          initialState.combinedColumns[c] != Foot.RIGHT_HEEL)
      ) {
        const previousFoot = initialState.combinedColumns.indexOf(
          combinedColumns[c]
        )
        const tempcost =
          this.WEIGHTS.HOLDSWITCH *
          (previousFoot == -1
            ? 1
            : Math.sqrt(this.layout.getDistanceSq(c, previousFoot)))
        cost += tempcost
      }
    }

    return cost
  }

  calcBracketTapCost(
    initialState: State,
    row: Row,
    resultPlacement: FootPlacement,
    elapsedTime: number
  ) {
    let cost = 0

    // Small penalty for trying to jack a bracket during a hold
    if (resultPlacement.leftBracket) {
      let jackPenalty = 1
      if (
        initialState.movedFeet.has(Foot.LEFT_HEEL) ||
        initialState.movedFeet.has(Foot.LEFT_TOE)
      )
        jackPenalty = 1 / elapsedTime
      if (
        row.holds[resultPlacement.leftHeel] !== undefined &&
        row.holds[resultPlacement.leftToe] === undefined
      ) {
        cost += this.WEIGHTS.BRACKETTAP * jackPenalty
      }
      if (
        row.holds[resultPlacement.leftToe] !== undefined &&
        row.holds[resultPlacement.leftHeel] === undefined
      ) {
        cost += this.WEIGHTS.BRACKETTAP * jackPenalty
      }
    }

    if (resultPlacement.rightBracket) {
      let jackPenalty = 1
      if (
        initialState.movedFeet.has(Foot.RIGHT_TOE) ||
        initialState.movedFeet.has(Foot.RIGHT_HEEL)
      )
        jackPenalty = 1 / elapsedTime

      if (
        row.holds[resultPlacement.rightHeel] !== undefined &&
        row.holds[resultPlacement.rightToe] === undefined
      ) {
        cost += this.WEIGHTS.BRACKETTAP * jackPenalty
      }
      if (
        row.holds[resultPlacement.rightToe] !== undefined &&
        row.holds[resultPlacement.rightHeel] === undefined
      ) {
        cost += this.WEIGHTS.BRACKETTAP * jackPenalty
      }
    }

    return cost
  }

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

  calcBracketJackCost(
    resultState: State,
    movedLeft: boolean,
    movedRight: boolean,
    didJump: boolean,
    jackedLeft: boolean,
    jackedRight: boolean
  ) {
    let cost = 0
    if (
      movedLeft != movedRight &&
      (movedLeft || movedRight) &&
      resultState.holdFeet.size == 0 &&
      !didJump
    ) {
      if (
        jackedLeft &&
        resultState.movedFeet.has(Foot.LEFT_HEEL) &&
        resultState.movedFeet.has(Foot.LEFT_TOE)
      ) {
        cost += this.WEIGHTS.BRACKETJACK
      }

      if (
        jackedRight &&
        resultState.movedFeet.has(Foot.RIGHT_HEEL) &&
        resultState.movedFeet.has(Foot.RIGHT_TOE)
      ) {
        cost += this.WEIGHTS.BRACKETJACK
      }
    }

    return cost
  }

  calcDoublestepCost(
    initialState: State,
    resultState: State,
    movedLeft: boolean,
    movedRight: boolean,
    didJump: boolean,
    jackedLeft: boolean,
    jackedRight: boolean,
    row: Row,
    rows: Row[],
    rowIndex: number
  ) {
    let cost = 0

    if (movedLeft != movedRight && resultState.holdFeet.size == 0 && !didJump) {
      let doublestepped = false

      if (
        movedLeft &&
        !jackedLeft &&
        ((initialState.movedFeet.has(Foot.LEFT_HEEL) &&
          !initialState.holdFeet.has(Foot.LEFT_HEEL)) ||
          (initialState.movedFeet.has(Foot.LEFT_TOE) &&
            !initialState.holdFeet.has(Foot.LEFT_TOE)))
      ) {
        doublestepped = true
      }
      if (
        movedRight &&
        !jackedRight &&
        ((initialState.movedFeet.has(Foot.RIGHT_HEEL) &&
          !initialState.holdFeet.has(Foot.RIGHT_HEEL)) ||
          (initialState.movedFeet.has(Foot.RIGHT_TOE) &&
            !initialState.holdFeet.has(Foot.RIGHT_TOE)))
      )
        doublestepped = true

      const lastRow = rows[rowIndex - 1]
      if (lastRow !== undefined) {
        for (const hold of lastRow.holds) {
          if (hold === undefined) continue
          const endBeat = row.beat
          const startBeat = lastRow.beat

          // if a hold tail extends past the last row & ends in between, we can doublestep
          if (
            hold.beat + hold.hold > startBeat &&
            hold.beat + hold.hold < endBeat
          )
            doublestepped = false
          // if the hold tail extends past this row, we can doublestep
          if (hold.beat + hold.hold >= endBeat) doublestepped = false
        }
      }

      // Jack detection is wrong, it's detecting a jack even if another foot moved after it
      /*if ((jackedLeft || jackedRight) && row_distance <= 12) {
          if (DoLogging||true) Console.WriteLine("[{0}->{1}] Penalty of 1000 for a fast jack given to {2} -> {3} with distance {4}", a.row, b.row, Stringify(a.panels), Stringify(newMovement.placement.panels), row_distance);
          newMovement.weighting += 1000;
        }*/

      if (doublestepped) {
        cost += this.WEIGHTS.DOUBLESTEP
      }
    }

    return cost
  }

  calcJumpCost(
    row: Row,
    movedLeft: boolean,
    movedRight: boolean,
    elapsedTime: number
  ) {
    let cost = 0

    if (
      movedLeft &&
      movedRight &&
      row.notes.filter(note => note !== undefined).length >= 2
    ) {
      cost += this.WEIGHTS.JUMP / elapsedTime
    }

    return cost
  }

  private slowBracketThreshold = 0.15
  calcSlowBracketCost(
    row: Row,
    movedLeft: boolean,
    movedRight: boolean,
    elapsedTime: number
  ) {
    let cost = 0

    if (
      elapsedTime > this.slowBracketThreshold &&
      movedLeft != movedRight &&
      row.notes.filter(note => note !== undefined).length >= 2
    ) {
      const timediff = elapsedTime - this.slowBracketThreshold
      cost += timediff * this.WEIGHTS.SLOW_BRACKET
    }

    return cost
  }

  // Does this placement result in one of the feet being twisted around?
  // This should probably be getting filtered out as an invalid positioning before we
  // even get here, but :shrug:
  calcTwistedFoot(combinedPlacement: FootPlacement) {
    const leftPos = this.layout.averagePoint(
      combinedPlacement.leftHeel,
      combinedPlacement.leftToe
    )
    const rightPos = this.layout.averagePoint(
      combinedPlacement.rightHeel,
      combinedPlacement.rightToe
    )

    const crossedOver = rightPos.x < leftPos.x
    const rightBackwards =
      combinedPlacement.rightHeel != -1 && combinedPlacement.rightToe != -1
        ? this.layout.layout[combinedPlacement.rightToe].y <
          this.layout.layout[combinedPlacement.rightHeel].y
        : false

    const leftBackwards =
      combinedPlacement.leftHeel != -1 && combinedPlacement.leftToe != -1
        ? this.layout.layout[combinedPlacement.leftToe].y <
          this.layout.layout[combinedPlacement.leftHeel].y
        : false

    if (!crossedOver && (rightBackwards || leftBackwards)) {
      return this.WEIGHTS.TWISTED_FOOT
    }
    return 0
  }

  calcFacingCost(combinedPlacement: FootPlacement) {
    let cost = 0

    // facing backwards gives a bit of bad weight (scaled heavily the further back you angle, so crossovers aren't Too bad; less bad than doublesteps)
    const heelFacing =
      combinedPlacement.leftHeel != -1 && combinedPlacement.rightHeel != -1
        ? this.layout.getFacingDirectionCosine(
            combinedPlacement.leftHeel,
            combinedPlacement.rightHeel
          )
        : 0

    const heelFacingPenalty = Math.pow(-Math.min(heelFacing, 0), 7.2) * 200
    if (heelFacingPenalty > 0) cost += heelFacingPenalty * this.WEIGHTS.FACING
    return cost
  }

  calcSpinCost(initialState: State, combinedPlacement: FootPlacement) {
    let cost = 0

    // spin
    const previousLeftPos = this.layout.averagePoint(
      initialState.combinedColumns.indexOf(Foot.LEFT_HEEL),
      initialState.combinedColumns.indexOf(Foot.LEFT_TOE)
    )
    const previousRightPos = this.layout.averagePoint(
      initialState.combinedColumns.indexOf(Foot.RIGHT_HEEL),
      initialState.combinedColumns.indexOf(Foot.RIGHT_TOE)
    )
    const leftPos = this.layout.averagePoint(
      combinedPlacement.leftHeel,
      combinedPlacement.leftToe
    )
    const rightPos = this.layout.averagePoint(
      combinedPlacement.rightHeel,
      combinedPlacement.rightToe
    )

    if (
      rightPos.x < leftPos.x &&
      previousRightPos.x < previousLeftPos.x &&
      rightPos.y < leftPos.y &&
      previousRightPos.y > previousLeftPos.y
    ) {
      cost += this.WEIGHTS.SPIN
    }
    if (
      rightPos.x < leftPos.x &&
      previousRightPos.x < previousLeftPos.x &&
      rightPos.y > leftPos.y &&
      previousRightPos.y < previousLeftPos.y
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
  calcSlowFootswitchCost(
    initialState: State,
    resultState: State,
    combinedColumns: Foot[],
    row: Row,
    elapsedTime: number
  ) {
    let cost = 0
    let footswitchCount = 0

    // ignore footswitch with elapsed times <= SlowFootswitchThreshold; penalise slower footswitches based on distance
    if (
      elapsedTime >= this.SlowFootswitchThreshold &&
      elapsedTime < this.SlowFootswitchIgnore
    ) {
      // footswitching has no penalty if there's a mine nearby
      if (
        !row.mines.some(x => x !== undefined) &&
        !row.fakeMines.some(x => x !== undefined)
      ) {
        // const timeScaled = elapsedTime - this.SlowFootswitchThreshold

        for (let i = 0; i < combinedColumns.length; i++) {
          if (
            initialState.combinedColumns[i] == Foot.NONE ||
            resultState.action[i] == Foot.NONE
          )
            continue

          if (
            initialState.combinedColumns[i] != resultState.action[i] &&
            initialState.combinedColumns[i] !=
              OTHER_PART_OF_FOOT[resultState.action[i]]
          ) {
            cost +=
              ((elapsedTime - this.SlowFootswitchThreshold) / elapsedTime) *
              this.WEIGHTS.FOOTSWITCH
            footswitchCount += 1
          }
        }
      }
    }

    return cost
  }

  calcSideswitchCost(initialState: State, resultState: State) {
    let cost = 0

    if (
      resultState.action[0] != Foot.NONE &&
      initialState.combinedColumns[0] != Foot.NONE &&
      initialState.combinedColumns[0] != resultState.action[0] &&
      initialState.combinedColumns[0] !=
        OTHER_PART_OF_FOOT[resultState.action[0]]
    ) {
      cost += this.WEIGHTS.SIDESWITCH
    }

    if (
      initialState.combinedColumns[3] != resultState.action[3] &&
      resultState.action[3] != Foot.NONE &&
      initialState.combinedColumns[3] != Foot.NONE &&
      initialState.combinedColumns[3] !=
        OTHER_PART_OF_FOOT[resultState.action[3]]
    ) {
      cost += this.WEIGHTS.SIDESWITCH
    }

    return cost
  }

  calcMissedFootswitchCost(
    jackedLeft: boolean,
    jackedRight: boolean,
    row: Row
  ) {
    let cost = 0

    if (
      (jackedLeft || jackedRight) &&
      (row.mines.some(x => x !== undefined) ||
        row.fakeMines.some(x => x !== undefined))
    ) {
      cost += this.WEIGHTS.MISSED_FOOTSWITCH
    }

    return cost
  }

  // Jacks are hard to do the faster they are.
  // Notes with an elapsed time less than this will incur a penalty
  // 0.1 = 16th note at 150bpm
  private JackMaxElapsedTime = 0.1

  calcJackCost(
    jackedLeft: boolean,
    jackedRight: boolean,
    movedLeft: boolean,
    movedRight: boolean,
    elapsedTime: number
  ) {
    let cost = 0
    // weighting for jacking two notes too close to eachother
    if (elapsedTime < this.JackMaxElapsedTime && movedLeft != movedRight) {
      const timeScaled = this.JackMaxElapsedTime - elapsedTime
      if (jackedLeft || jackedRight) {
        cost +=
          (1 / timeScaled - 1 / this.JackMaxElapsedTime) * this.WEIGHTS.JACK
      }
    }

    return cost
  }

  calcDistanceCost(
    initialState: State,
    resultState: State,
    elapsedTime: number,
    didJump: boolean
  ) {
    let cost = 0

    // To do: weighting for moving a foot a far distance in a fast time
    for (const foot of [Foot.LEFT_HEEL, Foot.RIGHT_HEEL]) {
      if (!resultState.movedFeet.has(foot)) continue
      const initialHeel = initialState.footColumns[foot]
      let initialToe = initialState.footColumns[OTHER_PART_OF_FOOT[foot]]
      if (initialToe == -1) initialToe = initialHeel
      const initialPosition = this.layout.averagePoint(initialHeel, initialToe)

      const resultToe = resultState.footColumns[OTHER_PART_OF_FOOT[foot]]
      let resultHeel = resultState.footColumns[foot]
      if (resultHeel == -1) resultHeel = resultToe
      const resultPosition = this.layout.averagePoint(resultHeel, resultToe)

      // If we're bracketing something, and the toes are now where the heel
      // was, then we don't need to worry about it, we're not actually moving
      // the foot very far
      const isBracketing =
        initialState.footColumns[OTHER_PART_OF_FOOT[foot]] != -1 ||
        resultState.footColumns[OTHER_PART_OF_FOOT[foot]] != -1
      if (isBracketing) {
        const initialColumns = new Set([initialHeel, initialToe])
        const resultColumns = new Set([resultHeel, resultToe])
        if (initialColumns.intersection(resultColumns).size > 0) {
          continue
        }
      }

      if (didJump && elapsedTime < 0.15) {
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

  calcCrowdedBracketCost(
    initialPlacement: FootPlacement,
    resultPlacement: FootPlacement,
    elapsedTime: number
  ) {
    let cost = 0

    // Are we trying to bracket a column that the other foot was just on?

    if (
      resultPlacement.leftBracket &&
      this.doesLeftFootOverlapRight(initialPlacement, resultPlacement)
    ) {
      cost += this.WEIGHTS.CROWDED_BRACKET / elapsedTime
    } else if (
      initialPlacement.leftBracket &&
      this.doesRightFootOverlapLeft(initialPlacement, resultPlacement)
    ) {
      cost += this.WEIGHTS.CROWDED_BRACKET / elapsedTime
    }

    if (
      resultPlacement.rightBracket &&
      this.doesRightFootOverlapLeft(initialPlacement, resultPlacement)
    ) {
      cost += this.WEIGHTS.CROWDED_BRACKET / elapsedTime
    } else if (
      initialPlacement.rightBracket &&
      this.doesLeftFootOverlapRight(initialPlacement, resultPlacement)
    ) {
      cost += this.WEIGHTS.CROWDED_BRACKET / elapsedTime
    }

    return cost
  }
}
