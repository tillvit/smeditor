import { PopupData } from "./PopupManager"

function SimplePopupContent(props: { label: string; description: string }) {
  return (
    <div
      className="flex-column-full"
      style={{ padding: "0.5rem", color: "white" }}
    >
      <div className="popup-title">{props.label}</div>
      <div className="popup-desc">{props.description}</div>
    </div>
  )
}

type SimplePopupOptions = Partial<PopupData> & {
  id: string
  label: string
  attach: PopupData["attach"]
  description: string
}

export function SimplePopup(data: SimplePopupOptions): PopupData {
  return {
    ...data,
    content: (
      <SimplePopupContent label={data.label} description={data.description} />
    ),
  }
}
