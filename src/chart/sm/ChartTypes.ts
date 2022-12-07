export const CHART_DIFFICULTIES = ["Beginner", "Easy", "Medium", "Hard", "Challenge", "Edit"] as const
export type ChartDifficulty = typeof CHART_DIFFICULTIES[number]