import { Dispatch, SetStateAction } from "react"
import { CustomScript } from "../../../util/custom-script/CustomScriptTypes"

export function CustomScriptSelector(props: {
  scriptIndex: number | null
  setScriptIndex: Dispatch<SetStateAction<number>>
  scripts: CustomScript[]
}) {
  return (
    <div className="custom-script-selector">
      {props.scripts.map((script, index) => (
        <div
          key={index + "-" + script.name}
          className={`custom-script-option ${props.scriptIndex === index ? "selected" : ""}`}
          onClick={() => props.setScriptIndex(index)}
        >
          {script.name}
        </div>
      ))}
    </div>
  )
}
