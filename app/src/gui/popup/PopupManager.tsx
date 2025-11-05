import { DisplayObject, Point } from "pixi.js"
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
  padding?: number
  pivot?: { x: number; y: number }
  offset?: { x: number; y: number }
  id: string
  key?: number
  content: ReactNode
  attach: DisplayObject | HTMLElement | Point
  background?: string
  closed?: boolean
  highlighted?: boolean
  className?: string
  style?: CSSProperties
}

interface PopupContextData extends PopupData {
  close: () => void
  setBackground: (color: string) => void
  app: App
}

export const PopupContext = createContext<PopupContextData | null>(null)

let _pmInstance: {
  openPopup: (popupData: PopupData) => void
  closePopup: (id: string) => void
  isPopupOpen: (id: string) => boolean
  getPopupOptions: (id: string) => PopupData | null
  updatePopupOptions: (id: string, options: Partial<PopupData>) => void
} | null = null

export class PopupManager {
  static open(popupData: PopupData, overrideIfOpen = false) {
    if (this.isOpen(popupData.id) && !overrideIfOpen) return
    popupData.highlighted = popupData.highlighted ?? false
    _pmInstance?.openPopup(popupData)
  }
  static close(id: string) {
    _pmInstance?.closePopup(id)
  }

  static isOpen(id: string) {
    return _pmInstance?.isPopupOpen(id) ?? false
  }

  static getPopupOptions(id: string): PopupData | null {
    return _pmInstance?.getPopupOptions(id) ?? null
  }

  static highlight(id: string) {
    _pmInstance?.updatePopupOptions(id, { highlighted: true })
  }

  static isHighlighted(id: string): boolean {
    return _pmInstance?.getPopupOptions(id)?.highlighted ?? false
  }

  static updatePopupOptions(id: string, options: Partial<PopupData>) {
    _pmInstance?.updatePopupOptions(id, options)
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
      setPopups(prev => {
        const popup = prev.find(p => p.id === id && p.closed !== true)
        if (!popup) return prev
        setTimeout(() => {
          setPopups(prev => prev.filter(p => p.key !== popup.key))
        }, 200)
        return prev.map(p => {
          if (p.id === popup.id) p.closed = true
          return p
        })
      })
    },
    isPopupOpen: (id: string) => {
      return popups.some(p => p.id === id && p.closed !== true)
    },
    getPopupOptions: (id: string) => {
      const popup = popups.find(p => p.id === id && p.closed !== true)
      return popup || null
    },
    updatePopupOptions: (id: string, options: Partial<PopupData>) => {
      setPopups(prev => {
        const popup = prev.find(p => p.id === id && p.closed !== true)
        if (!popup) return prev
        Object.assign(popup, options)
        return [...prev]
      })
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
                setBackground(color) {
                  popup.background = color
                  setPopups(prev => [...prev])
                },
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
