import { useEffect } from "react"
import { SetupPageProps } from "../SetupWindow"

export function WelcomePage(props: SetupPageProps) {
  useEffect(() => {
    props.setValid(true)
  }, [])

  return (
    <div className="flex-column-full align-center">
      <h1>Welcome to SMEditor!</h1>
      <div>Click next to continue the setup process.</div>
      <br></br>
      <div>If you've seen this before, you can skip the setup.</div>
    </div>
  )
}
