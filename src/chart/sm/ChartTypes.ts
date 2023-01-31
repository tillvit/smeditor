export const CHART_DIFFICULTIES: readonly ChartDifficulty[] = [
  "Beginner",
  "Easy",
  "Medium",
  "Hard",
  "Challenge",
  "Edit",
]
export type ChartDifficulty =
  | "Beginner"
  | "Easy"
  | "Medium"
  | "Hard"
  | "Challenge"
  | "Edit"

export function isChartDifficulty(
  difficulty: string
): difficulty is ChartDifficulty {
  return CHART_DIFFICULTIES.includes(difficulty as ChartDifficulty)
}
