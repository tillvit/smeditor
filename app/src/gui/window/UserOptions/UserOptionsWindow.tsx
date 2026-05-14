import { useContext, useEffect, useMemo, useState } from "react"
import {
  USER_OPTIONS_WINDOW_DATA,
  UserOption,
} from "../../../data/UserOptionsWindowData"
import { WindowContext, WindowData } from "../WindowManager"
import { OptionViewer } from "./OptionViewer"
import { UserOptionItemComponent } from "./UserOptionItemComponent"

function UserOptionsWindowContent() {
  const windowData = useContext(WindowContext)!
  const [query, setQuery] = useState("")
  const availableOptions = useMemo(
    () =>
      USER_OPTIONS_WINDOW_DATA.filter(
        option => !option.disable?.(windowData.app)
      ),
    []
  )
  const [options, setOptions] = useState(availableOptions)

  function filterOptions(options: UserOption[] = availableOptions) {
    const filteredOptions: UserOption[] = []
    options.forEach(option => {
      if (
        option.label &&
        option.label.toLowerCase().includes(query.toLowerCase())
      ) {
        filteredOptions.push(option)
        return
      }
      if (option.type == "group" || option.type == "subgroup") {
        const filteredChildren = filterOptions(option.children)
        if (filteredChildren.length != 0)
          filteredOptions.push({ ...option, children: filteredChildren })
      }
    })
    return filteredOptions
  }

  useEffect(() => {
    setOptions(filterOptions())
  }, [query])

  return (
    <div className="flex-column-full" style={{ gap: "0.6rem" }}>
      <input
        className="pref-search-bar"
        type="text"
        placeholder="Search for an option..."
        value={query}
        onChange={e => {
          setQuery(e.target.value)
        }}
      />
      <OptionViewer options={options} itemElement={UserOptionItemComponent} />
    </div>
  )
}

export function UserOptionsWindow(): WindowData {
  return {
    title: "Options",
    width: 600,
    height: 400,
    id: "user-options",
    content: <UserOptionsWindowContent />,
  }
}
