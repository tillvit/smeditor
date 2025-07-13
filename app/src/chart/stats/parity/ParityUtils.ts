export function doFeetOverlap(
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
