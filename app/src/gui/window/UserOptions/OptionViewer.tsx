import {
  Fragment,
  ReactNode,
  useCallback,
  useEffect,
  useMemo,
  useState,
} from "react"
import { OptionGroupComponent } from "./OptionGroupComponent"
import { OptionSubgroupComponent } from "./OptionSubgroupComponent"

export type OptionData<Item extends OptionItem> =
  | OptionGroup<Item>
  | OptionSubgroup<Item>
  | Item

export interface OptionGroup<Item extends OptionItem> {
  type: "group"
  id: string
  label: string
  children: OptionData<Item>[]
}

export interface OptionSubgroup<Item extends OptionItem> {
  type: "subgroup"
  label?: string
  children: OptionData<Item>[]
}

export interface OptionItem {
  type: "item"
}

interface OptionsViewerProps<Item extends OptionItem> {
  options: OptionData<Item>[]
  itemElement: (props: { item: Item }) => ReactNode
}

export function OptionViewer<Item extends OptionItem>(
  props: OptionsViewerProps<Item>
) {
  const { options, itemElement } = props
  const [highlightedSections, setHighlightedSections] = useState<string[]>([])
  const observer = useMemo(() => {
    return new IntersectionObserver(entries => {
      const newSelected: string[] = []
      const newDeleted: string[] = []
      entries.forEach(entry => {
        const id = (entry.target as HTMLDivElement).dataset.id!
        if (entry.intersectionRatio > 0) newSelected.push(id)
        else newDeleted.push(id)
      })
      setHighlightedSections(highlighted => {
        const set = new Set(highlighted)
        newSelected.forEach(id => set.add(id))
        newDeleted.forEach(id => set.delete(id))
        return Array.from(set)
      })
    })
  }, [])

  const createElement = useCallback(
    (option: OptionData<Item>): ReactNode => {
      if (option.type === "group") {
        return (
          <OptionGroupComponent
            data={option}
            observer={observer}
            createElement={createElement}
          />
        )
      } else if (option.type === "subgroup") {
        return (
          <OptionSubgroupComponent
            data={option}
            createComponent={createElement}
          />
        )
      } else if (option.type === "item") {
        return itemElement({ item: option })
      }
    },
    [itemElement]
  )

  useEffect(() => {
    return () => observer.disconnect()
  }, [])

  return (
    <>
      <div className="pref-scrollers">
        <div className="pref-section-scroller">
          {options
            .filter(option => option.type == "group")
            .map(group => (
              <div
                className={
                  "pref-section" +
                  (highlightedSections.includes(group.id) ? " selected" : "")
                }
                key={group.id}
                data-id={group.id}
                onClick={() => {
                  document
                    .querySelector(`.pref-group[data-id=${group.id}]`)
                    ?.scrollIntoView()
                }}
              >
                {group.label}
              </div>
            ))}
        </div>
        <div className="pref-option-scroller">
          {options.map(option => (
            <Fragment key={JSON.stringify(option)}>
              {createElement(option)}
            </Fragment>
          ))}
        </div>
      </div>
    </>
  )
}
