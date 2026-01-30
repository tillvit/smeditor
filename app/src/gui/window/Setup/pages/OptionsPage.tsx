import { useEffect, useState } from "react"
import { SetupPageProps } from "../SetupWindow"

import { SETUP_OPTIONS } from "../../../../data/SetupData"
import { EventHandler } from "../../../../util/EventHandler"
import { Options } from "../../../../util/Options"
import { tippySafe } from "../../../../util/Util"
import { DropdownInput } from "../../../inputs/DropdownInput"

function gatherOptions() {
  const options: number[] = []
  for (const option of SETUP_OPTIONS) {
    const value = Options.getOption(option.option)
    if (value === undefined) continue
    options.push(option.values.findIndex(v => v.value === value))
  }
  return options
}

export function OptionsPage(props: SetupPageProps) {
  const [choices, setChoices] = useState(gatherOptions())

  useEffect(() => {
    props.setValid(true)
  }, [])

  const onConfirm = (page: number) => {
    if (page == 2) {
      for (let i = 0; i < SETUP_OPTIONS.length; i++) {
        const option = SETUP_OPTIONS[i]
        Options.applyOption([option.option, option.values[choices[i]].value])
      }
    }
  }

  useEffect(() => {
    EventHandler.on("setupConfirmPage", onConfirm)
    return () => {
      EventHandler.off("setupConfirmPage", onConfirm)
    }
  }, [choices])

  return (
    <div className="flex-column-full" style={{ flex: 1, height: 0 }}>
      <h3>Other options:</h3>
      <div className="scroller" style={{ flex: 1, marginTop: "0.5rem" }}>
        {SETUP_OPTIONS.map((option, index) => (
          <div
            key={option.option}
            className="pref-item"
            ref={el =>
              tippySafe(el, { content: option.description, zIndex: 10001 })
            }
          >
            <label>{option.name}:</label>
            <DropdownInput
              values={option.values.map(v => v.label)}
              value={option.values[choices[index]].label}
              onChange={value => {
                const idx = option.values.findIndex(v => v.label === value)
                const newChoices = [...choices]
                newChoices[index] = idx
                setChoices(newChoices)
              }}
            />
          </div>
        ))}
      </div>
    </div>
  )
}
