import { useContext } from "react"
import { WindowContext, WindowData } from "../WindowManager"

interface ConfirmationWindowOptions {
  title: string
  message: string
  detail?: string
  buttonOptions: ConfirmationOption[]
}

interface ConfirmationOption {
  label: string
  callback?: () => void
  type: "delete" | "confirm" | "default"
}

function ConfirmationWindowContent(props: ConfirmationWindowOptions) {
  const windowData = useContext(WindowContext)
  return (
    <div className="flex-column-full" style={{ gap: "0.3rem" }}>
      <div className="label" style={{ textAlign: "center" }}>
        {props.message}
      </div>
      {props.detail && <div className="secondary">{props.detail}</div>}
      <div className="menu-options">
        {props.buttonOptions.map(option => (
          <button
            key={option.label}
            className={option.type !== "default" ? option.type : undefined}
            onClick={() => {
              windowData?.close()
              option.callback?.()
            }}
          >
            {option.label}
          </button>
        ))}
      </div>
    </div>
  )
}

export function ConfirmationWindow(
  props: ConfirmationWindowOptions
): WindowData {
  return {
    title: props.title,
    width: 300,
    disableClose: true,
    id: "confirm",
    blocking: true,
    content: <ConfirmationWindowContent {...props} />,
  }
}
