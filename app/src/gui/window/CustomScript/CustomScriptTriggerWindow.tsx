import { useContext, useEffect, useState } from "react"
import { CustomScript } from "../../../util/custom-script/CustomScriptTypes"
import { tippySafe } from "../../../util/Util"
import { ValueInput } from "../../inputs/ValueInput"
import { WindowContext, WindowData } from "../WindowManager"

function CustomScriptTriggerContent({
  script,
  callback,
}: {
  script: CustomScript
  callback?: (args: (string | number | boolean)[]) => void
}) {
  const windowData = useContext(WindowContext)!
  const [args, setArgs] = useState<(string | number | boolean)[]>(
    script.arguments.map(arg => arg.default)
  )

  useEffect(() => {
    if (script.arguments.length == 0) {
      callback?.([])
      windowData.close()
    }
  }, [script])

  return (
    <div className="flex-column-full" style={{ gap: "0.2rem" }}>
      {script.arguments.map((arg, i) => (
        <div
          key={i}
          className="pref-item"
          ref={el => {
            if (script.arguments[i].description.length > 0 && el) {
              tippySafe(el, {
                content: script.arguments[i].description,
                zIndex: 10001,
              })
            }
          }}
        >
          <div className="pref-label">{arg.name}</div>
          <ValueInput
            {...arg}
            value={args[i] as any}
            onChange={(value: any) => {
              setArgs(prevArgs => {
                const newArgs = [...prevArgs]
                newArgs[i] = value
                return newArgs
              })
            }}
          />
        </div>
      ))}
      <div className="menu-options">
        <button
          onClick={() => {
            windowData.close()
          }}
        >
          Cancel
        </button>
        <button
          className="confirm"
          onClick={() => {
            windowData.close()
            callback?.(args)
          }}
        >
          Run
        </button>
      </div>
    </div>
  )
}

export function CustomScriptTriggerWindow(
  script: CustomScript,
  callback?: (args: (string | number | boolean)[]) => void
): WindowData {
  return {
    title: script.name,
    width: 400,
    blocking: true,
    id: "custom-trigger-" + script.name,
    content: <CustomScriptTriggerContent script={script} callback={callback} />,
  }
}
