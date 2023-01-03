export interface Timer {
  name: string
  time: number
  startTime: number
  lastTime: number
}

export class TimerStats {
  private static timers: Record<string, Timer> = {}
  static time(name: string) {
    if (!this.timers[name]) this.timers[name] = {name: name, time: 0, startTime: 0, lastTime: 0}
    this.timers[name].startTime = performance.now()
  }
  static endTime(name: string) {
    if (!this.timers[name]) return
    this.timers[name].time += performance.now() - this.timers[name].startTime
  }
  static endFrame() {
    for (let key in this.timers) {
      this.timers[key].lastTime = this.timers[key].time
      this.timers[key].time = 0
    }
  }
  static getTimers() {
    return Object.values(this.timers)
  }
}