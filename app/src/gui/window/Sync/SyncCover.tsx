export function SyncCover(props: {
  label: string
  index: number
  active: boolean
}) {
  return (
    <div
      className={`sync-cover ${props.active ? "active" : ""}`}
      style={{ left: `${(props.index * 370) / 16}rem` }}
    >
      {props.label}
    </div>
  )
}
