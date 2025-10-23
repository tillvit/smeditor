import { useContext, useEffect, useState } from "react"
import { RecentFileHandler } from "../../../util/RecentFileHandler"
import { ReactIcon } from "../../Icons"
import { FileSelectorWindow } from "../FileSelector/FileSelectorWindow"
import { NewSongWindow } from "../NewSong/NewSongWindow"
import { WindowContext, WindowData, WindowManager } from "../WindowManager"

export function InitialWindowContent() {
  const windowData = useContext(WindowContext)
  const [recents, setRecents] = useState<{ name: string; path: string }[]>([])
  const [selectedRecent, setSelectedRecent] = useState<number | null>(null)

  useEffect(() => {
    RecentFileHandler.getRecents().then(setRecents)
    windowData!.center?.()

    const onResize = () => {
      windowData!.center?.()
    }

    window.addEventListener("resize", onResize)
    return () => {
      window.removeEventListener("resize", onResize)
    }
  }, [])

  function openExisting() {
    if (window.nw) {
      const fileSelector = document.createElement("input")
      fileSelector.type = "file"
      fileSelector.accept = ".sm,.ssc"
      fileSelector.onchange = () => {
        windowData!.app.chartManager.loadSM(fileSelector.value)
        windowData!.close()
      }
      fileSelector.click()
    } else {
      WindowManager.openWindow(
        FileSelectorWindow({
          title: "Select an sm/ssc file...",
          accepted_file_types: [".sm", ".ssc"],
          disableClose: true,
          callback: (path: string) => {
            windowData!.app.chartManager.loadSM(path)
            windowData!.close()
          },
        })
      )
    }
  }

  return (
    <div className="open-container">
      <div className="top-container">
        <button
          style={{
            display: "flex",
            flexDirection: "column",
            backgroundColor: "#414352",
            color: "white",
            padding: "0.5rem",
          }}
          onClick={openExisting}
        >
          <ReactIcon id="UPLOAD" width={30} height={30} />
          <p>{window.nw ? "Open an existing song" : "Import a song folder"}</p>
        </button>
        <button
          style={{
            display: "flex",
            flexDirection: "column",
            backgroundColor: "#506352",
            color: "white",
            padding: "0.5rem",
          }}
          onClick={() => WindowManager.openWindow(NewSongWindow())}
        >
          <ReactIcon id="PLUS" width={30} height={30} />
          <p>New Song</p>
        </button>
      </div>
      <div className="separator" style={{ margin: "0.5rem" }}></div>
      <div className="bottom-container">
        <div className="title">Recently Opened</div>
        <div className="recent-selector">
          {recents.map((entry, i) => (
            <div
              className={`recent-item ${selectedRecent === i ? "selected" : ""}`}
              key={i}
              onClick={() => setSelectedRecent(i)}
              onDoubleClick={() => {
                windowData!.app.chartManager.loadSM(entry.path)
                windowData!.close()
              }}
            >
              <div className="recent-name">{entry.name}</div>
              <div className="recent-path">{entry.path}</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

export function InitialWindow(disableClose = true): WindowData {
  return {
    title: "Open a Song",
    width: 400,
    height: 320,
    disableClose,
    id: "initial",
    content: <InitialWindowContent />,
  }
}
