import { Fragment, ReactNode } from "react"
import { OptionData, OptionItem, OptionSubgroup } from "./OptionViewer"

export function OptionSubgroupComponent<Item extends OptionItem>(props: {
  data: OptionSubgroup<Item>
  createComponent: (option: OptionData<Item>) => ReactNode
}) {
  return (
    <div className="pref-subgroup">
      {props.data.label && (
        <div className="pref-subgroup-label"> {props.data.label}</div>
      )}
      <div className="pref-children">
        {props.data.children.map(child => (
          <Fragment key={JSON.stringify(child)}>
            {props.createComponent(child)}
          </Fragment>
        ))}
      </div>
    </div>
  )
}
