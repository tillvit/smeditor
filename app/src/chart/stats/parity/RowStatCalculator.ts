import {
  Foot,
  OTHER_PART_OF_FOOT,
  PlacementData,
  Row,
  TechCategory,
  TechErrors,
} from "./ParityDataTypes"
import { ParityGraphNode } from "./ParityInternals"
import { getPlayerAngle } from "./ParityUtils"
import { StageLayout } from "./StageLayouts"

export function calculateRowStats(
  nodes: ParityGraphNode[],
  rows: Row[],
  layout: StageLayout
) {
  const techRows: Set<TechCategory>[] = [new Set()]
  const techErrors = new Map<number, Set<TechErrors>>()
  const facingRows: number[] = [0]

  for (let i = 0; i < nodes.length - 1; i++) {
    const initialState = nodes[i].state
    const initialRow = rows[i]
    const currentState = nodes[i + 1].state
    const currentRow = rows[i + 1]

    const data = layout.getPlacementData(
      initialState,
      currentState,
      initialRow,
      currentRow
    )

    facingRows.push(getPlayerAngle(data.leftPos, data.rightPos))

    const techs = new Set<TechCategory>()
    const errors = new Set<TechErrors>()

    for (let c = 0; c < currentRow.holds.length; c++) {
      if (currentRow.holds[c] === undefined) continue
      if (currentRow.holds[c]!.beat < data.initialState.beat) continue // the new hold wasn't there in the previous row
      const initialFoot = data.initialState.combinedColumns[c]
      const resultFoot = data.resultState.combinedColumns[c]
      if (
        initialFoot != resultFoot &&
        initialFoot != OTHER_PART_OF_FOOT[resultFoot]
      ) {
        techs.add(TechCategory.Holdswitch)
        break
      }
    }

    if (!techs.has(TechCategory.Holdswitch) && !data.jumped) {
      if (
        (data.leftDoubleStep || data.rightDoubleStep) &&
        !techs.has(TechCategory.Holdswitch)
      ) {
        techs.add(TechCategory.Doublesteps)

        if (!isDoublestepMarked(data, initialRow, currentRow, layout)) {
          errors.add(TechErrors.UnmarkedDoublestep)
        }
      }

      // Footswitch
      for (const foot of currentState.movedFeet) {
        const col = currentState.footColumns[foot]
        if (initialState.combinedColumns[col] == Foot.NONE) continue
        if (
          initialState.combinedColumns[col] == foot ||
          initialState.combinedColumns[col] == OTHER_PART_OF_FOOT[foot]
        )
          continue
        if (layout.sideArrows.includes(col)) {
          techs.add(TechCategory.Sideswitches)
        } else {
          techs.add(TechCategory.Footswitches)
        }
        break
      }
    }

    if (data.leftBracket || data.rightBracket) techs.add(TechCategory.Brackets)

    if (
      (data.leftJack || data.rightJack) &&
      !data.previousJumped &&
      !techs.has(TechCategory.Brackets)
    ) {
      techs.add(TechCategory.Jacks)
      if (
        currentRow.mines.some(x => x !== undefined) ||
        (currentRow.fakeMines.some(x => x !== undefined) &&
          currentRow.second - techRows.length < 0.2)
      ) {
        errors.add(TechErrors.MissedFootswitch)
      }
    }

    if (data.rightPos.x < data.leftPos.x) {
      techs.add(TechCategory.Crossovers)
    }

    if (isAmbiguous(data, currentRow, nodes, i)) {
      errors.add(TechErrors.Ambiguous)
    }

    techRows.push(techs)
    if (errors.size) {
      techErrors.set(i + 1, errors)
    }
  }
  return { techRows, techErrors, facingRows }
}

function isDoublestepMarked(
  data: PlacementData,
  initialRow: Row,
  currentRow: Row,
  layout: StageLayout
) {
  for (let i = 0; i < layout.layout.length; i++) {
    const hold = initialRow.holds[i]
    // If there is a hold that extends past the last row, we can DS
    if (
      (hold && !initialRow.holdTails.has(i)) ||
      currentRow.holds[i] !== undefined
    ) {
      return true
    }
  }

  if (data.leftDoubleStep) {
    const willHitMine =
      currentRow.mines[data.initialState.footColumns[Foot.LEFT_HEEL]] ||
      currentRow.fakeMines[data.initialState.footColumns[Foot.LEFT_HEEL]] ||
      currentRow.mines[data.initialState.footColumns[Foot.LEFT_TOE]] ||
      currentRow.fakeMines[data.initialState.footColumns[Foot.LEFT_TOE]]
    if (willHitMine) return true
  }
  if (data.rightDoubleStep) {
    const willHitMine =
      currentRow.mines[data.initialState.footColumns[Foot.RIGHT_HEEL]] ||
      currentRow.fakeMines[data.initialState.footColumns[Foot.RIGHT_HEEL]] ||
      currentRow.mines[data.initialState.footColumns[Foot.RIGHT_TOE]] ||
      currentRow.fakeMines[data.initialState.footColumns[Foot.RIGHT_TOE]]
    if (willHitMine) return true
  }
  return false
}

function isAmbiguous(
  data: PlacementData,
  currentRow: Row,
  nodes: ParityGraphNode[],
  i: number
) {
  if (
    !data.previousJumped ||
    currentRow.notes.filter(n => n !== undefined).length != 1
  )
    return false
  const noteIndex = currentRow.notes.findIndex(n => n !== undefined)
  if (
    data.initialState.combinedColumns[noteIndex] ==
      data.resultState.combinedColumns[noteIndex] ||
    data.initialState.combinedColumns[noteIndex] ==
      OTHER_PART_OF_FOOT[data.resultState.combinedColumns[noteIndex]]
  ) {
    return false
  }
  const cost =
    nodes[i].children.get(nodes[i + 1].key)!["TOTAL"] -
    nodes[i].children.get(nodes[i + 1].key)!["DISTANCE"]
  if (
    nodes[i].children.entries().some(([child, costs]) => {
      if (child == nodes[i + 1].key) return false
      if (costs["TOTAL"] - costs["DISTANCE"] <= cost) {
        return true
      }
      return false
    })
  ) {
    return true
  }
  return false
}
