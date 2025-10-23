import { Color } from "pixi.js"
import { useContext, useEffect, useState } from "react"
import { UserOptionItem } from "../../../data/UserOptionsWindowData"
import { EventHandler } from "../../../util/EventHandler"
import { Options } from "../../../util/Options"
import { ReactIcon } from "../../Icons"
import { ValueInput } from "../../inputs/ValueInput"
import { WindowContext } from "../WindowManager"

export function UserOptionItemComponent(props: { item: UserOptionItem }) {
  const windowData = useContext(WindowContext)!
  const [optionValue, setOptionValue] = useState(
    serializeValue(Options.getOption(props.item.id))
  )
  const defaultValue = Options.getDefaultOption(props.item.id)

  function serializeValue(value: any): any {
    if (props.item.input.type == "color") {
      return new Color(value)
    }
    return value
  }

  function deserializeValue(value: any): any {
    if (props.item.input.type == "color" && value instanceof Color) {
      return value.toHexa()
    }
    return value
  }

  function applyOption(value: any) {
    value = deserializeValue(value)
    setOptionValue(value)
    Options.applyOption([props.item.id, value])
    props.item.input.onChange?.(windowData.app, value)
  }

  useEffect(() => {
    const handleOptionChange = (id: string) => {
      if (id === props.item.id)
        setOptionValue(serializeValue(Options.getOption(props.item.id)))
    }
    EventHandler.on("userOptionUpdated", handleOptionChange)
    return () => {
      EventHandler.off("userOptionUpdated", handleOptionChange)
    }
  }, [props.item.id])

  return (
    <div className="pref-item">
      <div className="pref-item-label"> {props.item.label}</div>
      {deserializeValue(optionValue) != defaultValue && (
        <ReactIcon
          id="REVERT"
          width={12}
          height={12}
          onClick={() => applyOption(Options.getDefaultOption(props.item.id))}
        />
      )}
      <ValueInput
        value={optionValue}
        {...props.item.input}
        onChange={(value: any) => {
          applyOption(value)
        }}
      />
    </div>
  )
}
