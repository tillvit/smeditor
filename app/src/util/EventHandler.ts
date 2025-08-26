import EventEmitter from "eventemitter3"
import { isWorker } from "./Util"

export class EventHandler extends EventEmitter {
  private static _instance: EventHandler

  static get instance(): EventHandler {
    if (!EventHandler._instance) {
      EventHandler._instance = new EventHandler()
    }
    return EventHandler._instance
  }

  static emit(event: string | symbol, ...args: any[]): boolean {
    if (isWorker()) return false
    return EventHandler.instance.emit(event, ...args)
  }

  static on(
    event: string | symbol,
    fn: (...args: any[]) => void,
    context?: any
  ) {
    EventHandler.instance.on(event, fn, context)
  }

  static off(
    event: string | symbol,
    fn?: (...args: any[]) => void,
    context?: any,
    once?: boolean
  ) {
    EventHandler.instance.off(event, fn, context, once)
  }
}
