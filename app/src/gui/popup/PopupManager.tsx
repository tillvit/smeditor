import { DisplayObject } from "pixi.js"
import {
  createContext,
  CSSProperties,
  ReactNode,
  useRef,
  useState,
} from "react"
import { App } from "../../App"
import { Popup } from "./Popup"

export interface PopupData {
  width?: number
  height?: number
  id: string
  key?: number
  content: ReactNode
  attach: DisplayObject | HTMLElement
  background?: string
  closed?: boolean
  className?: string
  style?: CSSProperties
}

interface PopupContextData extends PopupData {
  close: () => void
  app: App
}

export const PopupContext = createContext<PopupContextData | null>(null)

let _pmInstance: {
  openPopup: (popupData: PopupData) => void
  closePopup: (id: string) => void
  isPopupOpen: (id: string) => boolean
} | null = null

export class PopupManager {
  static openPopup(popupData: PopupData) {
    _pmInstance?.openPopup(popupData)
  }
  static closePopup(id: string) {
    _pmInstance?.closePopup(id)
  }

  static isPopupOpen(id: string) {
    return _pmInstance?.isPopupOpen(id) ?? false
  }
}

export function PopupManagerComponent({ app }: { app: App | null }) {
  const [popups, setPopups] = useState<PopupData[]>([])
  const popupId = useRef(0)

  _pmInstance = {
    openPopup: (popupData: PopupData) => {
      popupData.closed = false
      popupData.key = popupId.current++
      setPopups(prev => [...prev, popupData])
    },
    closePopup: (id: string) => {
      setPopups(prev => prev.filter(w => w.id !== id))
    },
    isPopupOpen: (id: string) => {
      return popups.some(w => w.id === id)
    },
  }

  if (!app) return <></>

  return (
    <>
      <div id="popups">
        {popups.map(popup => {
          return (
            <PopupContext.Provider
              key={popup.key}
              value={{
                ...popup,
                app,
                close: () => {
                  if (popup.closed) return
                  setPopups(prev => {
                    return prev.map(p => {
                      if (p.id === popup.id) p.closed = true
                      return p
                    })
                  })
                  setTimeout(() => {
                    setPopups(prev => prev.filter(w => w.key !== popup.key))
                  }, 200)
                },
              }}
            >
              <Popup />
            </PopupContext.Provider>
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
