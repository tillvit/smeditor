import { Fragment, ReactNode, useEffect, useRef } from "react"
import { OptionData, OptionGroup, OptionItem } from "./OptionViewer"

export function OptionGroupComponent<Item extends OptionItem>(props: {
  data: OptionGroup<Item>
  observer: IntersectionObserver
  createElement: (option: OptionData<Item>) => ReactNode
}) {
  const containerRef = useRef<HTMLDivElement | null>(null)

  useEffect(() => {
    if (!containerRef.current || !props.observer) return
    props.observer.observe(containerRef.current)
  }, [containerRef.current, props.observer])

  return (
    <div className="pref-group" data-id={props.data.id} ref={containerRef}>
      {props.data.label && (
        <div className="pref-group-label"> {props.data.label}</div>
      )}
      <div className="pref-children">
        {props.data.children.map(child => (
          <Fragment key={JSON.stringify(child)}>
            {props.createElement(child)}
          </Fragment>
        ))}
      </div>
    </div>
  )
}
