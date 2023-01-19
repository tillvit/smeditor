export class EventHandler {
  private static events: Record<string, ((data?: object) => void)[]> = {}

  static on(event: string, handler: (data?: object) => void) {
    if (!this.events[event]) this.events[event] = []
    this.events[event].push(handler)
  }

  static removeHandler(event: string, handler: (data?: object) => void) {
    if (!this.events[event]) return
    const i = this.events[event].indexOf(handler)
    if (i == -1) return
    this.events[event].splice(i, 1)
  }

  static emit(event: string, data?: object) {
    if (!this.events[event]) return
    this.events[event].forEach(handler => handler(data))
  }
}
