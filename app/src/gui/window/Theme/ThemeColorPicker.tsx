import { Color } from "pixi.js"
import { Dispatch, SetStateAction, useEffect, useRef, useState } from "react"
import tippy from "tippy.js"
import {
  THEME_GENERATOR_LINKS,
  THEME_PROPERTY_DESCRIPTIONS,
  ThemeProperty,
} from "../../../data/ThemeData"
import { ReactIcon } from "../../Icons"
import { ColorInput } from "../../inputs/color/ColorInput"

export function ThemeColorPicker(props: {
  id: ThemeProperty
  label: string
  color: Color
  onChange: (color: Color) => void
  linkBlacklist: Record<string, boolean>
  setLinkedBlacklist: Dispatch<SetStateAction<Record<string, boolean>>>
  hovered: ThemeProperty | null
  setHovered: Dispatch<SetStateAction<ThemeProperty | null>>
}) {
  const [linked, setLinked] = useState(true)
  const linkedRef = useRef(true)
  const link = getLink(props.id)
  const linkRef = useRef<HTMLDivElement | null>(null)

  function getLink(id: ThemeProperty) {
    for (const [linker, links] of Object.entries(THEME_GENERATOR_LINKS)) {
      if (id in links) {
        return linker as ThemeProperty
      }
    }
    return null
  }

  useEffect(() => {
    if (!linkRef.current) return
    tippy(linkRef.current, {
      onShow(inst) {
        inst.setContent(linkedRef.current ? `Linked to ${link}` : "Unlinked")
      },
    })
  }, [linkRef.current])

  function shouldHighlight() {
    if (!props.hovered) return false
    if (props.linkBlacklist[props.id]) return false
    return !!THEME_GENERATOR_LINKS[props.hovered]?.[props.id]
  }

  return (
    <div
      className={"theme-color-cell " + (shouldHighlight() ? "linked" : "")}
      ref={el => {
        if (!el) return
        if (THEME_PROPERTY_DESCRIPTIONS[props.id] != "")
          tippy(el, {
            content: THEME_PROPERTY_DESCRIPTIONS[props.id],
          })
      }}
      onMouseEnter={() => props.setHovered(props.id)}
      onMouseLeave={() => props.setHovered(null)}
    >
      <div>{props.label}</div>
      <div className="theme-color-detail">
        {props.color.toHex() +
          " | " +
          Math.round(props.color.alpha * 100) +
          "%"}
      </div>
      <ColorInput
        value={props.color}
        width={30}
        height={30}
        onChange={color => props.onChange(color)}
      />
      {link && (
        <div
          ref={linkRef}
          className="ico-checkbox"
          onClick={() => {
            setLinked(!linked)
            linkedRef.current = !linked
            props.setLinkedBlacklist(prev => {
              const newObj = { ...prev }
              if (linked) newObj[props.id] = true
              else delete newObj[props.id]
              return newObj
            })
          }}
        >
          {linked ? (
            <ReactIcon id="LINK" width={16} />
          ) : (
            <ReactIcon id="LINK_BROKEN" width={16} />
          )}
        </div>
      )}
    </div>
  )
}
