import { ReactNode } from "react"

export function TimingDataWindowRow(props: {
  title: string
  children: ReactNode
}) {
  return (
    <>
      <div className="label">{props.title}</div>
      {props.children}
    </>
  )
}
