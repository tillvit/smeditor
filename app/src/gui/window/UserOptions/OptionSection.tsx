import { UserOptionGroup } from "../../../data/UserOptionsWindowData"

export function UserOptionSectionComponent(props: {
  data: UserOptionGroup
  highlighted: boolean
}) {
  return (
    <div
      className={"pref-section" + (props.highlighted ? " selected" : "")}
      data-id={props.data.id}
      onClick={() => {
        document
          .querySelector(`.pref-group[data-id=${props.data.id}]`)
          ?.scrollIntoView()
      }}
    >
      {props.data.label}
    </div>
  )
}
