import { createContext, CSSProperties, ReactNode, useState } from "react"
import { App } from "../../App"
import { Window } from "./Window"

export interface WindowData {
  title: string
  width: number
  height?: number
  disableClose?: boolean
  viewStyle?: CSSProperties
  blocking?: boolean
  id: string
  content: ReactNode
}

interface WindowContextData extends WindowData {
  isFocused: boolean
  focus: () => void
  close: () => void
  setDisableClose: (close: boolean) => void
  setBlocking: (blocking: boolean) => void
  center?: () => void
  app: App
}

export const WindowContext = createContext<WindowContextData | null>(null)

let _wmInstance: {
  openWindow: (windowData: WindowData) => void
  closeWindow: (id: string) => void
  getFocusedWindow: () => string | null
  unfocusAll: () => void
  isBlocking: () => boolean
  isWindowOpen: (id: string) => boolean
} | null = null

export class WindowManager {
  static openWindow(windowData: WindowData) {
    _wmInstance?.openWindow(windowData)
  }
  static closeWindow(id: string) {
    _wmInstance?.closeWindow(id)
  }
  static getFocusedWindow() {
    return _wmInstance?.getFocusedWindow() ?? null
  }
  static unfocusAll() {
    _wmInstance?.unfocusAll()
  }
  static isBlocking() {
    return _wmInstance?.isBlocking() ?? false
  }
  static isWindowOpen(id: string) {
    return _wmInstance?.isWindowOpen(id) ?? false
  }
}

export function WindowManagerComponent({ app }: { app: App | null }) {
  const [windows, setWindows] = useState<WindowData[]>([])
  const [focusedWindow, setFocusedWindow] = useState<string | null>(null)

  _wmInstance = {
    openWindow: (windowData: WindowData) => {
      if (windowData.id && windows.some(w => w.id === windowData.id)) {
        setFocusedWindow(windowData.id)
        return
      }
      setWindows(prev => [...prev, windowData])
      setFocusedWindow(windowData.id)
    },
    closeWindow: (id: string) => {
      setWindows(prev => prev.filter(w => w.id !== id))
    },
    isWindowOpen: (id: string) => {
      return windows.some(w => w.id === id)
    },
    getFocusedWindow: () => {
      return focusedWindow
    },
    unfocusAll: () => {
      setFocusedWindow(null)
    },
    isBlocking: () => {
      return isBlocked()
    },
  }

  function isBlocked() {
    return windows.some(window => window.blocking)
  }

  if (!app) return <></>

  return (
    <>
      <div
        id="blocker"
        style={{ display: isBlocked() ? "block" : "none" }}
        onClick={e => {
          e.stopPropagation()
          e.preventDefault()
        }}
      ></div>
      <div id="windows">
        {windows.map(window => {
          return (
            <WindowContext.Provider
              key={window.id}
              value={{
                ...window,
                isFocused: window.id == focusedWindow,
                app,
                focus: () => {
                  setFocusedWindow(window.id)
                  setWindows(prev => {
                    const newWindows = prev.filter(w => w.id !== window.id)
                    newWindows.push(window)
                    return newWindows
                  })
                },
                close: () => {
                  setWindows(prev => prev.filter(w => w.id !== window.id))
                },
                setDisableClose: close => {
                  setWindows(prev =>
                    prev.map(w => {
                      if (w.id == window.id) w.disableClose = close
                      return w
                    })
                  )
                },
                setBlocking: blocking => {
                  setWindows(prev =>
                    prev.map(w => {
                      if (w.id == window.id) w.blocking = blocking
                      return w
                    })
                  )
                },
              }}
            >
              <Window focused={window.id == focusedWindow} />
            </WindowContext.Provider>
          )
        })}
      </div>
    </>
  )
}
// export class _WindowManager {
//   view: HTMLDivElement
//   windows: Window[] = []
//   app: App

//   constructor(app: App, view: HTMLDivElement) {
//     this.app = app
//     this.view = view
//   }

//   unfocusAll() {
//     for (const window of this.view.querySelectorAll(".focused")) {
//       window.classList.remove("focused")
//     }
//   }

//   getFocusedWindow() {
//     for (const window of this.windows) {
//       if (window.windowElement.classList.contains("focused")) return window
//     }
//     return null
//   }

//   isBlocked(): boolean {
//     return !this.windows.every(window => !window.options.blocking)
//   }

//   openWindow(window: Window) {
//     if (window.options.win_id) {
//       const existingWindow = this.getWindowById(window.options.win_id)
//       if (existingWindow) {
//         existingWindow.focus()
//         return
//       }
//     }
//     window.addToManager(this)
//     this.windows.push(window)
//   }

//   removeWindow(window: Window) {
//     this.windows.splice(this.windows.indexOf(window), 1)
//   }

//   getWindowById(id: string): Window | undefined {
//     for (const window of this.windows) {
//       if (window.options.win_id == id) return window
//     }
//     return undefined
//   }
// }
