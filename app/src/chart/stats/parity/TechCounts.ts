import {
  Foot,
  OTHER_PART_OF_FOOT,
  PlacementData,
  Row,
  TechCategory,
  TechErrors,
} from "./ParityDataTypes"
import { ParityGraphNode } from "./ParityInternals"
import { StageLayout } from "./StageLayouts"

export function calculateTechLabels(
  nodes: ParityGraphNode[],
  rows: Row[],
  layout: StageLayout
) {
  const techRows: Set<TechCategory>[] = [new Set()]
  const techErrors = new Map<number, Set<TechErrors>>()

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
        currentRow.fakeMines.some(x => x !== undefined)
      ) {
        errors.add(TechErrors.MissedFootswitch)
      }
    }

    if (data.rightPos.x < data.leftPos.x) {
      techs.add(TechCategory.Crossovers)
    }

    // If there was another path that has the same or better cost (and a jump occurred), it could be ambiguous
    if (data.previousJumped) {
      const cost = nodes[i].children.get(nodes[i + 1].key)!["TOTAL"]
      if (
        nodes[i].children.entries().some(([child, costs]) => {
          if (child == nodes[i + 1].key) return false
          if (costs["TOTAL"] <= cost) {
            console.log(child, costs, nodes[i + 1].key)
            return true
          }
          return false
        })
      ) {
        errors.add(TechErrors.Ambiguous)
      }
    }
    techRows.push(techs)
    if (errors.size) {
      techErrors.set(i + 1, errors)
    }
  }
  return { techRows, techErrors }
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
