import EventEmitter from "eventemitter3"

export class EventHandler extends EventEmitter {
  private static _instance: EventHandler

  static get instance(): EventHandler {
    if (!EventHandler._instance) {
      EventHandler._instance = new EventHandler()
    }
    return EventHandler._instance
  }

  static emit(event: string | symbol, ...args: any[]): boolean {
    return EventHandler.instance.emit(event, ...args)
  }

  static on(
    event: string | symbol,
    fn: (...args: any[]) => void,
    context?: any
  ) {
    EventHandler.instance.on(event, fn, context)
  }
}
