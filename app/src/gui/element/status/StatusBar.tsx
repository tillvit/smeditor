import { useEffect, useRef, useState } from "react"
import { App } from "../../../App"
import { EditMode, EditTimingMode } from "../../../chart/ChartManager"
import { EventHandler } from "../../../util/EventHandler"
import { Flags } from "../../../util/Flags"
import { EditBar } from "./EditBar"
import { PlaybackBar } from "./PlaybackBar"

export function StatusBar(props: { app: App }) {
  const [playing, setPlaying] = useState(false)
  const [state, setState] = useState<EditMode>(EditMode.Edit)
  const [timingState, setTimingState] = useState<EditTimingMode>(
    EditTimingMode.Off
  )
  const hovering = useRef(false)
  const fadeTimeout = useRef<NodeJS.Timeout>(null)
  const viewRef = useRef<HTMLDivElement>(null)
  const [loadedSM, setLoadedSM] = useState(false)

  useEffect(() => {
    const playStateChanged = () => {
      setPlaying(props.app.chartManager.chartAudio.isPlaying())
    }
    const modeChanged = () => {
      setState(props.app.chartManager.getMode())
      setTimingState(props.app.chartManager.editTimingMode)
      cancelFade()
      if (
        (props.app.chartManager.getMode() == EditMode.Record ||
          props.app.chartManager.getMode() == EditMode.Play) &&
        !hovering.current
      ) {
        queueFade()
      }
    }
    const smLoaded = () => {
      setLoadedSM(true)
    }
    EventHandler.on("playStateChanged", playStateChanged)
    EventHandler.on("modeChanged", modeChanged)
    EventHandler.on("timingModeChanged", modeChanged)
    EventHandler.on("smLoaded", smLoaded)
    return () => {
      EventHandler.off("playStateChanged", playStateChanged)
      EventHandler.off("modeChanged", modeChanged)
      EventHandler.off("timingModeChanged", modeChanged)
      EventHandler.off("smLoaded", smLoaded)
    }
  }, [])

  function queueFade() {
    if (fadeTimeout.current) clearTimeout(fadeTimeout.current)
    fadeTimeout.current = setTimeout(() => {
      viewRef.current!.style.opacity = "0.2"
      viewRef.current!.style.transition = "2s cubic-bezier(.11,.72,.51,1.14)"
    }, 3000)
  }

  function cancelFade() {
    if (fadeTimeout.current) clearTimeout(fadeTimeout.current)
    viewRef.current!.style.opacity = ""
    viewRef.current!.style.transition = ""
  }

  return (
    <div
      id="status-widget"
      style={{ display: !Flags.status || !loadedSM ? "none" : "" }}
      className={Flags.viewMode || state != EditMode.Edit ? "collapsed" : ""}
      ref={viewRef}
      onMouseEnter={() => cancelFade()}
      onMouseLeave={() => {
        if (
          props.app.chartManager.getMode() == EditMode.Record ||
          props.app.chartManager.getMode() == EditMode.Play
        )
          queueFade()
      }}
    >
      <PlaybackBar app={props.app} playing={playing} state={state} />
      <EditBar app={props.app} timingMode={timingState} />
    </div>
  )
}
