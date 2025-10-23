import { showOpenFilePicker } from "file-system-access"
import { useContext } from "react"
import { DEFAULT_THEMES } from "../../../data/ThemeData"
import { Options } from "../../../util/Options"
import { basename } from "../../../util/Path"
import { Themes } from "../../../util/Theme"
import { ReactIcon } from "../../Icons"
import { WaterfallManager } from "../../element/WaterfallManager"
import { ConfirmationWindow } from "../Confirmation/ConfirmationWindow"
import { WindowContext, WindowManager } from "../WindowManager"
import { ThemeEditorWindow } from "./ThemeEditorWindow"

export function ThemeTray({ selectedTheme }: { selectedTheme: string }) {
  const windowData = useContext(WindowContext)

  function handleNewTheme() {
    const themeName = Themes.getNonConflictingName("new-theme")
    Themes.createUserTheme(themeName)
    Themes.loadTheme(themeName)
  }

  function handleDuplicateTheme() {
    const themeName = Themes.getNonConflictingName(Options.general.theme)
    Themes.createUserTheme(themeName, Themes.getCurrentTheme())
    Themes.loadTheme(themeName)
  }

  function handleEditTheme() {
    windowData?.close()
    WindowManager.openWindow(ThemeEditorWindow())
  }

  function handleDeleteTheme() {
    WindowManager.openWindow(
      ConfirmationWindow({
        title: "Delete theme",
        message: "Are you sure you want to delete this theme?",
        buttonOptions: [
          {
            type: "default",
            label: "Cancel",
          },
          {
            type: "delete",
            label: "Delete",
            callback: () => {
              Themes.deleteUserTheme(selectedTheme)
            },
          },
        ],
      })
    )
  }

  async function handleImportTheme() {
    const fileHandlers = await showOpenFilePicker({
      _preferPolyfill: true,
      excludeAcceptAllOption: false,
      multiple: true,
      accepts: [{ extensions: ["txt"] }],
    })
    fileHandlers.forEach(handle => {
      handle
        .getFile()
        .then(file => file.text())
        .then(text => {
          const theme = Themes.parseThemeText(text)
          let themeName = basename(handle.name, ".txt")
          if (!theme) {
            WaterfallManager.createFormatted(
              "Failed to load theme " + themeName,
              "error"
            )
            return
          }
          themeName = Themes.getNonConflictingName(themeName)
          Themes.createUserTheme(themeName, theme)
        })
    })
  }

  function handleExportTheme() {
    const str = Themes.exportCurrentTheme({ spaces: true })
    const file = new File([str], Options.general.theme + ".txt", {
      type: "text/plain",
    })
    const a = document.createElement("a")
    const url = URL.createObjectURL(file)

    a.href = url
    a.download = file.name
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    window.URL.revokeObjectURL(url)
  }

  return (
    <div className="theme-tray">
      <button onClick={handleNewTheme}>
        <ReactIcon id="PLUS" width={16} />
        New
      </button>
      <button onClick={handleDuplicateTheme}>
        <ReactIcon id="COPY" width={16} />
        Duplicate
      </button>
      <button
        disabled={!!DEFAULT_THEMES[selectedTheme]}
        className="confirm"
        onClick={handleEditTheme}
      >
        <ReactIcon id="EDIT" width={16} />
        Edit
      </button>
      <button
        disabled={!!DEFAULT_THEMES[selectedTheme]}
        className="delete"
        onClick={handleDeleteTheme}
      >
        <ReactIcon id="TRASH" width={16} />
        Delete
      </button>
      <button onClick={handleImportTheme}>
        <ReactIcon id="UPLOAD" width={16} />
        Import
      </button>
      <button onClick={handleExportTheme}>
        <ReactIcon id="DOWNLOAD" width={16} />
        Export
      </button>
    </div>
  )
}
