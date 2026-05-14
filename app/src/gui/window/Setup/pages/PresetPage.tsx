import { useEffect, useState } from "react"
import { SetupPageProps } from "../SetupWindow"

import { KEYBIND_DATA, KeyCombo } from "../../../../data/KeybindData"
import { SETUP_PRESETS, SetupPreset } from "../../../../data/SetupData"
import {
  USER_OPTIONS_WINDOW_DATA,
  UserOption,
  UserOptionItem,
} from "../../../../data/UserOptionsWindowData"
import { EventHandler } from "../../../../util/EventHandler"
import { Keybinds } from "../../../../util/Keybinds"
import { Options } from "../../../../util/Options"
import { tippySafe } from "../../../../util/Util"
import { ValueInput } from "../../../inputs/ValueInput"

function getUserOptionItem(
  optionId: string,
  current: UserOption[]
): UserOptionItem | null {
  for (const option of current) {
    if (option.type == "group" || option.type == "subgroup") {
      const found = getUserOptionItem(optionId, option.children)
      if (found) return found
    } else if (option.id === optionId) {
      return option
    }
  }
  return null
}

function getPresetModifications(preset: SetupPreset) {
  const modifications: { options: Set<string>; keybinds: Set<string> } = {
    options: new Set(),
    keybinds: new Set(),
  }
  for (const option of preset.options) {
    const defaultValue = Options.getDefaultOption(option[0])
    const value = option[1] ?? defaultValue
    if (Options.getOption(option[0]) !== value) {
      modifications.options.add(option[0])
    }
  }
  for (const keybind of preset.keybinds) {
    const defaultCombos = KEYBIND_DATA[keybind[0]].combos
    const combos = [...(keybind[1] ?? defaultCombos)].map(c =>
      Keybinds.getComboString(c)
    )
    const currentCombos = [...Keybinds.getCombosForKeybind(keybind[0])].map(c =>
      Keybinds.getComboString(c)
    )
    if (currentCombos.length !== combos.length) {
      modifications.keybinds.add(keybind[0])
      continue
    }
    combos.sort()
    currentCombos.sort()
    for (let i = 0; i < combos.length; i++) {
      if (combos[i] !== currentCombos[i]) {
        modifications.keybinds.add(keybind[0])
        break
      }
    }
  }
  return modifications
}

export function PresetOption(props: {
  optionId: string
  value: any
  modified: boolean
}) {
  const item = getUserOptionItem(props.optionId, USER_OPTIONS_WINDOW_DATA)
  const defaultValue = Options.getDefaultOption(props.optionId)
  const value = props.value ?? defaultValue

  if (!item) return <div>Unknown option {props.optionId}</div>

  return (
    <div
      className="pref-item"
      ref={el => {
        if (item.tooltip) {
          tippySafe(el, { content: item.tooltip, zIndex: 10001 })
        }
      }}
    >
      <div className="pref-item-label"> {item.label}</div>
      {props.modified && (
        <p
          style={{
            color: "rgba(255, 147, 58, 0.5)",
            marginLeft: "0.5rem",
            fontSize: "0.875rem",
            fontStyle: "italic",
          }}
        >
          {" "}
          (modified)
        </p>
      )}
      <ValueInput
        value={value}
        {...item.input}
        style={{ pointerEvents: "none" }}
        onChange={() => {
          return
        }}
      />
    </div>
  )
}

function PresetKeybind(props: {
  action: keyof typeof KEYBIND_DATA
  keybind?: KeyCombo[]
  modified: boolean
}) {
  const combos = props.keybind || KEYBIND_DATA[props.action].combos

  return (
    <div className="pref-keybind">
      <div className="pref-keybind-label">
        {KEYBIND_DATA[props.action].label}
      </div>
      {props.modified && (
        <p
          style={{
            color: "rgba(255, 147, 58, 0.5)",
            marginLeft: "0.5rem",
            fontSize: "0.875rem",
            fontStyle: "italic",
          }}
        >
          {" "}
          (modified)
        </p>
      )}
      <div className="pref-keybind-combos">
        {combos.map(combo => {
          return (
            <button
              key={Keybinds.getComboString(combo)}
              className="pref-keybind-combo"
            >
              {Keybinds.getComboString(combo)}
            </button>
          )
        })}
      </div>
    </div>
  )
}

export function PresetPage(props: SetupPageProps) {
  const [preset, setPreset] = useState<string | null>(null)
  const [mods, setMods] = useState<{
    options: Set<string>
    keybinds: Set<string>
  } | null>(null)

  const onConfirm = (page: number) => {
    if (page == 1) {
      if (preset) {
        const presetData = SETUP_PRESETS[preset]
        for (const option of presetData.options) {
          const defaultValue = Options.getDefaultOption(option[0])
          const value = option[1] ?? defaultValue
          Options.applyOption([option[0], value])
        }
        for (const keybind of presetData.keybinds) {
          const defaultCombos = KEYBIND_DATA[keybind[0]].combos
          const combos = keybind[1] ?? defaultCombos
          Keybinds.setKeybinds(keybind[0], combos)
        }
      }
    }
  }

  useEffect(() => {
    props.setValid(!!preset)
    if (preset) {
      setMods(getPresetModifications(SETUP_PRESETS[preset]))
    }
    EventHandler.on("setupConfirmPage", onConfirm)
    return () => {
      EventHandler.off("setupConfirmPage", onConfirm)
    }
  }, [preset])

  return (
    <div className="flex-column-full" style={{ flex: 1, height: 0 }}>
      <h3>Choose a settings preset:</h3>
      <p>
        If you're coming from a different editor, SMEditor can change settings
        to match your previous setup.
      </p>
      <div className="preset-grid">
        {Object.keys(SETUP_PRESETS).map(key => {
          const presetData = SETUP_PRESETS[key]
          return (
            <div
              key={key}
              className={`preset-item ${preset === key ? "selected" : ""}`}
              onClick={() => {
                if (key == preset) {
                  setPreset(null)
                  return
                }
                setPreset(key)
              }}
            >
              <img src={presetData.img}></img>
              <div className="preset-label">
                <div className="preset-title">{presetData.title}</div>
                {presetData.subtitle && (
                  <div className="preset-subtitle">{presetData.subtitle}</div>
                )}
              </div>
            </div>
          )
        })}
      </div>

      {preset && mods && (
        <>
          <div style={{ marginTop: "0.5rem", marginBottom: "0.5rem" }}>
            <span>Preset Details:</span>
            {mods.keybinds.size + mods.options.size > 0 && (
              <span
                style={{
                  color: "rgba(255, 147, 58, 0.5)",
                  marginLeft: "0.5rem",
                  fontSize: "0.875rem",
                  fontStyle: "italic",
                }}
              >
                ({mods.keybinds.size + mods.options.size} modified)
              </span>
            )}
          </div>
          <div
            style={{
              display: "flex",
              flexDirection: "row",
              height: 0,
              flex: 1,
              gap: "1rem",
            }}
          >
            <div className="scroller" style={{ flex: 1 }}>
              {SETUP_PRESETS[preset].options.map(option => (
                <PresetOption
                  key={option[0]}
                  optionId={option[0]}
                  value={option[1]}
                  modified={mods.options.has(option[0])}
                />
              ))}
              <div className="separator"></div>
              {SETUP_PRESETS[preset].keybinds.map(option => (
                <PresetKeybind
                  key={option[0]}
                  action={option[0] as keyof typeof KEYBIND_DATA}
                  keybind={option[1] as KeyCombo[]}
                  modified={mods.keybinds.has(option[0])}
                />
              ))}
            </div>
          </div>
          <span
            style={{
              marginTop: "0.5rem",
              fontStyle: "italic",
              textAlign: "center",
              fontSize: "0.875rem",
              color: "var(--text-color-secondary)",
            }}
          >
            You can modify these settings later in the Options window.
          </span>
        </>
      )}
    </div>
  )
}
