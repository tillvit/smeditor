import { useEffect } from "react"
import { SetupPageProps } from "../SetupWindow"

export function FinishPage(props: SetupPageProps) {
  useEffect(() => {
    props.setValid(true)
  }, [])

  return (
    <div
      className="flex-column-full align-center"
      style={{ textAlign: "center" }}
    >
      <h1>All set!</h1>
      <div>
        To learn more about SMEditor, check out the{" "}
        <a href="/smeditor/guide" target="_blank">
          help guide
        </a>{" "}
        (located under Help in the menubar).
      </div>
      <br></br>
      <div>Click Finish to start editing!</div>
    </div>
  )
}
