import { useEffect, useState } from "react"
import { Chart } from "../../chart/sm/Chart"
import { Simfile } from "../../chart/sm/Simfile"
import { EventHandler } from "../../util/EventHandler"

type SMProps = Simfile["properties"] & { charts: Record<string, Chart> }

// readonly chart details

export function useSM(sm: Simfile): SMProps {
  const [props, setProps] = useState<SMProps>(getSMProps())

  function getSMProps(): SMProps {
    return {
      ...sm.properties,
      charts: sm.charts,
    }
  }

  useEffect(() => {
    setProps(getSMProps())
    function onSMModified() {
      setProps(getSMProps())
    }
    EventHandler.on("smModified", onSMModified)
    return () => {
      EventHandler.off("smModified", onSMModified)
    }
  }, [sm])

  return props
}
