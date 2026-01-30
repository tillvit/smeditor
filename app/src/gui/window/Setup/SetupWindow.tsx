import { useContext, useEffect, useState } from "react"
import { EventHandler } from "../../../util/EventHandler"
import { WindowContext, WindowData } from "../WindowManager"
import { FinishPage } from "./pages/FinishPage"
import { OffsetPage } from "./pages/OffsetPage"
import { OptionsPage } from "./pages/OptionsPage"
import { PresetPage } from "./pages/PresetPage"
import { WelcomePage } from "./pages/WelcomePage"

const PAGES = [WelcomePage, PresetPage, OptionsPage, OffsetPage, FinishPage]

export interface SetupPageProps {
  setValid: (valid: boolean) => void
}

function SetupWindowContent() {
  const windowData = useContext(WindowContext)!

  const [page, setPage] = useState(0)
  const [valid, setValid] = useState(false)
  const PageComponent = PAGES[page]

  function handleNext() {
    if (valid) {
      EventHandler.emit("setupConfirmPage", page)
    }
    if (page < PAGES.length - 1) {
      setPage(page + 1)
      setValid(false)
    } else {
      console.log("Finished setup")
      windowData.close()
    }
  }

  function handlePrevious() {
    if (page > 0) {
      setPage(page - 1)
      setValid(true)
    }
  }

  useEffect(() => {
    localStorage.setItem("setupCompleted", "true")
  }, [])

  return (
    <div className="flex-column-full">
      <PageComponent setValid={setValid} />
      <div className="menu-options">
        <div className="menu-left">
          <button disabled={page == 0} onClick={handlePrevious}>
            Previous
          </button>
        </div>
        <div className="menu-right">
          <button onClick={handleNext} className="confirm">
            {page === PAGES.length - 1 ? "Finish" : valid ? "Next" : "Skip"}
          </button>
        </div>
      </div>
    </div>
  )
}

export function SetupWindow(): WindowData {
  return {
    title: "Initial Setup",
    id: "setup",
    width: 600,
    height: 400,
    blocking: true,
    content: <SetupWindowContent />,
  }
}
