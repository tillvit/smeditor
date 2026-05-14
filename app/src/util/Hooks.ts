import { useEffect, useState } from "react"
import { EventHandler } from "./EventHandler"
import { Options } from "./Options"

export function useOption<T>(id: string) {
  const [option, setOption] = useState<T>(Options.getOption(id))
  useEffect(() => {
    const handler = (optionId: string) => {
      if (optionId == id) setOption(Options.getOption(id))
    }
    EventHandler.on("userOptionUpdated", handler)
    return () => {
      EventHandler.off("userOptionUpdated", handler)
    }
  }, [id])
  return option
}
