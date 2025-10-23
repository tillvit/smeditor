import { useContext, useEffect, useRef, useState } from "react"
import { Simfile } from "../../../chart/sm/Simfile"
import { SimfileProperty } from "../../../chart/sm/SimfileTypes"
import { DEFAULT_SM } from "../../../data/SMData"
import { EventHandler } from "../../../util/EventHandler"
import { FileHandler } from "../../../util/file-handler/FileHandler"
import { ConfirmationWindow } from "../Confirmation/ConfirmationWindow"
import { SMPropertyEditor } from "../SMProperties/SMPropertyEditor"
import { WindowContext, WindowData, WindowManager } from "../WindowManager"

function NewSongWindowContent() {
  const smRef = useRef<Simfile | null>(null)
  const [loaded, setLoaded] = useState(false)
  const fileTable = useRef<{ [key: string]: File }>({})
  const windowData = useContext(WindowContext)

  function updateProperty(
    prop: SimfileProperty,
    value: string | File | undefined
  ) {
    if (!smRef.current) return
    if (value === undefined || typeof value === "string") {
      if (value === undefined) {
        if (
          smRef.current.properties[prop] &&
          smRef.current.properties[prop] in fileTable.current
        ) {
          delete fileTable.current[smRef.current.properties[prop]]
        }
      }
      if (prop in fileTable.current) delete fileTable.current[prop]
      smRef.current.properties[prop] = value
    }
    if (value instanceof File) {
      // fileTable.current[value.name] = value
      let fileName = value.name
      while (
        fileName in fileTable.current &&
        (fileTable.current[fileName].size !== value.size ||
          fileTable.current[fileName].type !== value.type)
      ) {
        fileName = "_" + fileName
      }
      fileTable.current[fileName] = value
      smRef.current.properties[prop] = fileName
    }
    EventHandler.emit("smModified")
  }

  async function createSong() {
    if (!smRef.current) return
    console.log(smRef.current)
    windowData?.close()
    let folder = smRef.current.properties.TITLE!
    if (window.nw) {
      const path = nw.require("path")
      const process = nw.require("process")
      const fileSelector = document.createElement("input")
      fileSelector.type = "file"
      fileSelector.nwsaveas = folder + ".sm"
      fileSelector.onchange = async () => {
        const fileName = path.basename(
          fileSelector.value,
          path.extname(fileSelector.value)
        )
        folder = path.dirname(fileSelector.value)
        const smPath = path.join(folder, fileName + ".sm")
        await FileHandler.writeFile(smPath, smRef.current!.serialize("sm"))
        // Add the rest of the files
        await Promise.all(
          Object.entries(fileTable.current).map(entry => {
            const newPath = path.resolve(path.join(folder, entry[0]))
            const filePath = path.resolve(entry[1].path!)
            // Don't copy if they are the same path
            if (
              process.platform == "win32" &&
              newPath.toLowerCase() === filePath.toLowerCase()
            )
              return
            if (newPath === filePath) return
            return FileHandler.writeFile(newPath, entry[1])
          })
        )
        await windowData!.app.chartManager.loadSM(smPath)
        WindowManager.closeWindow("initial")
      }
      fileSelector.click()
    } else {
      if (await FileHandler.getDirectoryHandle(folder)) {
        let i = 2
        while (await FileHandler.getDirectoryHandle(folder)) {
          folder = `${smRef.current.properties.TITLE!} ${i++}`
        }
      }
      await FileHandler.writeFile(
        folder + "/song.sm",
        smRef.current.serialize("sm")
      )
      await FileHandler.writeFile(
        folder + "/song.ssc",
        smRef.current.serialize("ssc")
      )
      // Add the rest of the files
      await Promise.all(
        Object.entries(fileTable.current).map(entry =>
          FileHandler.writeFile(folder + `/${entry[0]}`, entry[1])
        )
      )
      await windowData!.app.chartManager.loadSM(folder + "/song.ssc")
      WindowManager.closeWindow("initial")
    }
  }

  function handleCreate() {
    if (!smRef.current) return
    if (
      smRef.current.properties.MUSIC === undefined ||
      smRef.current.properties.MUSIC === ""
    ) {
      // confirmation
      WindowManager.openWindow(
        ConfirmationWindow({
          title: "No audio file uploaded",
          message: "Are you sure you want to create a file with no audio?",
          buttonOptions: [
            {
              type: "default",
              label: "No",
            },
            {
              type: "confirm",
              label: "Yes",
              callback: () => {
                createSong()
              },
            },
          ],
        })
      )
    } else {
      createSong()
    }
  }

  useEffect(() => {
    if (!windowData) return
    const load = async () => {
      const blob = new Blob([DEFAULT_SM], { type: "text/plain" })
      const file = new File([blob], "song.sm", { type: "text/plain" })
      const newSm = new Simfile(file)
      await newSm.loaded
      smRef.current = newSm
      setLoaded(true)
    }
    load()
  }, [])

  return (
    <div className="flex-column-full">
      {loaded && (
        <SMPropertyEditor
          sm={smRef.current!}
          onChange={updateProperty}
          newSong={true}
        />
      )}

      <div className="menu-options">
        <div className="menu-left">
          <button onClick={() => windowData?.close()}>Cancel</button>
        </div>
        <div className="menu-right">
          <button className="confirm" onClick={handleCreate}>
            Create
          </button>
        </div>
      </div>
    </div>
  )
}

export function NewSongWindow(): WindowData {
  return {
    title: "New Song",
    width: 450,
    disableClose: true,
    blocking: true,
    id: "sm_properties",
    content: <NewSongWindowContent />,
  }
}
