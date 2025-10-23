import { KEYBIND_DATA } from "../../../data/KeybindData"
import { MenuCheckbox, MenuSelection } from "../../../data/MenubarData"
import { Keybinds } from "../../../util/Keybinds"
import { MenubarProps, evaluateDynamicProperty } from "./Menubar"

export function MenubarSelection(
  props: MenubarProps<MenuSelection | MenuCheckbox>
) {
  const meta = KEYBIND_DATA[props.data.id] ?? {
    label: props.data.id,
    combos: [],
    callback: () => {},
  }
  const visible =
    meta.visible === undefined ||
    evaluateDynamicProperty(props.app, meta.visible)
  const disabled = evaluateDynamicProperty(props.app, meta.disabled)
  if (!visible) return <></>

  const checked =
    props.data.type == "checkbox" &&
    evaluateDynamicProperty(props.app, props.data.checked)

  return (
    <div
      className={
        "menu-item" +
        (disabled ? " disabled" : "") +
        (props.parentActive == props.id ? " selected" : "")
      }
      onClick={event => {
        event.stopPropagation()
        if (disabled) return
        meta?.callback(props.app)
        props.close()
      }}
      onMouseEnter={() => props.setActive(props.id)}
    >
      <div className="menu-title">
        <span className="title unselectable">
          {checked && "✓ "}
          {meta.label}
        </span>
        <span className="keybind unselectable">
          {Keybinds.getKeybindString(props.data.id)}
        </span>
      </div>
    </div>
  )
}
