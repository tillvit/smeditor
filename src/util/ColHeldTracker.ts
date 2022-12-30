export class ColHeldTracker {
  private cols: number[] = []

  keyDown(col: number) {
    this.cols[col] = (this.cols[col] ?? 0) + 1
  }

  keyUp(col: number) {
    this.cols[col] = (this.cols[col] ?? 1) - 1
    this.cols[col] = Math.max(this.cols[col], 0)
  }

  isPressed(col: number): boolean {
    return !!this.cols[col]
  }

  getHeldCols() {
    return this.cols.filter((_, col) => this.isPressed(col)).map((_, col) => col)
  }
  
  reset() {
    this.cols = []
  }
}