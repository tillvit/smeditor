import { useContext, useEffect, useState } from "react"
import {
  KeyCombo,
  Modifier,
  MODORDER,
  MODPROPS,
} from "../../../data/KeybindData"
import { Keybinds } from "../../../util/Keybinds"
import { WindowContext, WindowData } from "../WindowManager"

interface KeyComboWindowProps {
  allowMods: boolean
  callback: (combo: KeyCombo) => void
  conflictCheck?: (combo: KeyCombo) => string[] | "self"
}

function KeyComboWindowContent(props: KeyComboWindowProps) {
  const [combo, setCombo] = useState<KeyCombo>({ mods: [], key: "" })
  const [conflicts, setConflicts] = useState<string[] | "self">([])
  const windowData = useContext(WindowContext)!

  useEffect(() => {
    const listener = (event: KeyboardEvent) => {
      if (["Meta", "Control", "Shift", "Alt", "Escape"].includes(event.key))
        return
      const newCombo: KeyCombo = { key: "", mods: [] }
      newCombo.key = Keybinds.getKeyNameFromEvent(event)
      if (props.allowMods) {
        const mods: Modifier[] = []
        for (let i = 0; i < MODPROPS.length; i++) {
          if (event[MODPROPS[i]]) mods.push(MODORDER[i])
        }
        newCombo.mods = mods
      }
      setCombo(newCombo)
      setConflicts(props.conflictCheck?.(newCombo) ?? [])

      event.preventDefault()
    }
    window.addEventListener("keydown", listener, true)
    return () => {
      window.removeEventListener("keydown", listener, true)
    }
  }, [props.allowMods])

  return (
    <div style={{ padding: "0.5rem" }}>
      <div
        className="label"
        style={{ marginBottom: "0.5rem", textAlign: "center" }}
      >
        Input a key combo and select Ok when finished.
      </div>
      <input
        type="text"
        disabled
        style={{
          fontSize: "1.25rem",
          height: "1.5rem",
          flex: "0",
          textAlign: "center",
          width: "100%",
          marginBottom: "0.5rem",
        }}
        value={Keybinds.getComboString(combo)}
      />
      <div className="detail" style={{ flex: "1", marginBottom: "0.5rem" }}>
        {conflicts === "self"
          ? "Combo already binded for this keybind"
          : conflicts.length >= 3
            ? `Conflicts with ${conflicts.length} keybinds`
            : conflicts.length >= 1
              ? `Conflicts with ${conflicts.join(",")}`
              : "No conflicts"}
      </div>
      <div className="menu-options">
        <button
          onClick={() => {
            windowData.close()
          }}
        >
          Cancel
        </button>
        <button
          className="confirm"
          onClick={() => {
            props.callback(combo)
            windowData.close()
          }}
          disabled={conflicts == "self" || combo.key == ""}
        >
          Ok
        </button>
      </div>
    </div>
  )
}

export function KeyComboWindow(props: KeyComboWindowProps): WindowData {
  return {
    id: "key-combo-selector",
    title: "",
    width: 300,
    height: 168,
    disableClose: true,
    blocking: true,
    content: <KeyComboWindowContent {...props} />,
  }
}
