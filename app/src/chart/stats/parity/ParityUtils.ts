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

export function getPlayerAngle(
  left: { x: number; y: number },
  right: { x: number; y: number }
) {
  const x1 = right.x - left.x
  const y1 = right.y - left.y
  const x2 = 1
  const y2 = 0
  const dot = x1 * x2 + y1 * y2
  const det = x1 * y2 - y1 * x2
  return Math.atan2(det, dot)
}
