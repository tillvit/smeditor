import { useContext, useEffect, useRef } from "react"
import { Chart } from "../../../chart/sm/Chart"
import {
  CHART_DIFFICULTIES,
  ChartDifficulty,
} from "../../../chart/sm/ChartTypes"
import { Simfile } from "../../../chart/sm/Simfile"
import { TECH_STRINGS } from "../../../chart/stats/parity/ParityDataTypes"
import { AUDIO_EXT } from "../../../data/FileData"
import { ActionHistory } from "../../../util/ActionHistory"
import { EventHandler } from "../../../util/EventHandler"
import { dirname } from "../../../util/Path"
import { useChart } from "../../hooks/ChartHook"
import { useSM } from "../../hooks/SMHook"
import { DropdownInput } from "../../inputs/DropdownInput"
import { InlineTextInput } from "../../inputs/InlineTextInput"
import { PathInput } from "../../inputs/PathInput"
import { TextInput } from "../../inputs/TextInput"
import { ConfirmationWindow } from "../Confirmation/ConfirmationWindow"
import { WindowContext, WindowManager } from "../WindowManager"

interface ChartListDetailsOptions {
  chart: Chart
  sm: Simfile
  loadCharts: () => void
  selectChart: (chart: Chart | null) => void
}

function ChartListInput(props: {
  name: string
  value: string
  onChange: (value: string) => void
}) {
  return (
    <>
      <div className="label">{props.name}</div>
      <TextInput value={props.value} onChange={props.onChange} />
    </>
  )
}

export function ChartListDetails(props: ChartListDetailsOptions) {
  const windowData = useContext(WindowContext)
  const baseDir = useRef("")
  const sm = useSM(props.sm)
  const chart = useChart(props.chart)
  const scrollerRef = useRef<HTMLDivElement>(null)
  const menuOptionsRef = useRef<HTMLDivElement>(null)

  function setProperty<K extends keyof Chart>(key: K, value: Chart[K]) {
    const cachedValue = props.chart[key]
    ActionHistory.instance.run({
      action: () => {
        props.chart[key] = value
        EventHandler.emit("chartModified")
      },
      undo: () => {
        props.chart[key] = cachedValue
        EventHandler.emit("chartModified")
      },
    })
  }

  useEffect(() => {
    if (!windowData) return
    baseDir.current = dirname(windowData.app.chartManager.smPath)
  }, [windowData])

  useEffect(() => {
    if (!scrollerRef.current || !menuOptionsRef.current) return
    const wheelListener = () => {
      menuOptionsRef.current!.classList.toggle(
        "bottom",
        scrollerRef.current!.clientHeight + scrollerRef.current!.scrollTop <
          scrollerRef.current!.scrollHeight - 10
      )
      scrollerRef.current!.classList.toggle(
        "top",
        scrollerRef.current!.scrollTop > 10
      )
    }
    scrollerRef.current.addEventListener("wheel", wheelListener, {
      passive: true,
    })
    requestAnimationFrame(() =>
      menuOptionsRef.current!.classList.toggle(
        "bottom",
        scrollerRef.current!.clientHeight + scrollerRef.current!.scrollTop <
          scrollerRef.current!.scrollHeight - 10
      )
    )
    return () => {
      scrollerRef.current?.removeEventListener("wheel", wheelListener)
    }
  }, [scrollerRef, menuOptionsRef])

  function duplicateChart() {
    if (!windowData) return
    const newChart: Chart = Object.assign(
      Object.create(Object.getPrototypeOf(props.chart)),
      props.chart
    )
    newChart.setNotedata(
      props.chart.getNotedata().map(note => props.chart.computeNote(note)) ?? []
    )
    windowData.app.chartManager.loadedSM!.addChart(newChart)
    windowData.app.chartManager.loadChart(newChart)
    props.loadCharts()
    props.selectChart(newChart)
  }

  function deleteChart() {
    if (!windowData) return
    WindowManager.openWindow(
      ConfirmationWindow({
        title: "Delete chart",
        message: "Are you sure you want to delete this chart?",
        buttonOptions: [
          {
            type: "default",
            label: "Cancel",
          },
          {
            type: "delete",
            label: "Delete",
            callback: () => {
              if (
                windowData.app.chartManager.loadedSM!.removeChart(props.chart)
              ) {
                windowData.app.chartManager.loadChart()
                props.loadCharts()
                props.selectChart(null)
              }
            },
          },
        ],
      })
    )
  }

  function handleMusicChange(newPath: string | undefined) {
    if (!windowData) return
    const sm = windowData.app.chartManager.loadedSM!
    if (newPath == (chart.music ?? sm.properties.MUSIC)) return
    const playing = windowData.app.chartManager.chartAudio.isPlaying()
    const lastVal = chart.music
    ActionHistory.instance.run({
      action: () => {
        props.chart.music = newPath
        windowData.app.chartManager.loadAudio()
        if (playing) windowData.app.chartManager.chartAudio.play()
        EventHandler.emit("chartModified")
      },
      undo: () => {
        props.chart.music = lastVal
        windowData.app.chartManager.loadAudio()
        if (playing) windowData.app.chartManager.chartAudio.play()
        EventHandler.emit("chartModified")
      },
    })
  }

  return (
    <>
      <div className="chart-info-scroller" ref={scrollerRef}>
        <div className="chart-info-main">
          <DropdownInput
            className="no-border white"
            value={chart.difficulty}
            onChange={v => setProperty("difficulty", v as ChartDifficulty)}
            values={CHART_DIFFICULTIES}
          />
          <InlineTextInput
            value={chart.meter.toString()}
            onChange={v => setProperty("meter", parseInt(v) || 1)}
            style={{ width: "4rem", textOverflow: "clip", textAlign: "right" }}
          />
        </div>
        <div className="chart-properties">
          <ChartListInput
            name="Name"
            value={chart.name}
            onChange={v => setProperty("chartName", v)}
          />
          <ChartListInput
            name="Artist"
            value={chart.credit}
            onChange={v => setProperty("credit", v)}
          />
          <ChartListInput
            name="Style"
            value={chart.style}
            onChange={v => setProperty("chartStyle", v)}
          />
          <ChartListInput
            name="Description"
            value={chart.description}
            onChange={v => setProperty("description", v)}
          />
          <div className="label">Music File</div>
          <PathInput
            typeName="audio"
            accept={AUDIO_EXT}
            baseDir={baseDir.current}
            autoSelect={baseDir.current + "/" + (chart.music ?? sm.MUSIC)}
            value={chart.music ?? ""}
            placeholder={sm.MUSIC}
            onChange={v => {
              handleMusicChange(v)
            }}
          />
        </div>
        <div className="chart-info-grid-item">
          <div className="title chart-info-grid-label">Peak NPS</div>
          <div className="title chart-info-grid-count">4.13</div>
        </div>
        <div className="chart-info-grid">
          {Object.entries(chart.noteCounts).map(entry => {
            return (
              <div className="chart-info-grid-item" key={entry[0]}>
                <div className="title chart-info-grid-label">{entry[0]}</div>
                <div className="title chart-info-grid-count">{entry[1]}</div>
              </div>
            )
          })}
        </div>
        {chart.parity && (
          <div className="chart-info-grid" style={{ marginTop: "1rem" }}>
            {chart.parity.techCounts.map((count, i) => {
              return (
                <div className="chart-info-grid-item" key={i}>
                  <div className="title chart-info-grid-label">
                    {TECH_STRINGS[i]}
                  </div>
                  <div className="title chart-info-grid-count">{count}</div>
                </div>
              )
            })}
          </div>
        )}
      </div>

      <div className="menu-options" ref={menuOptionsRef}>
        <button onClick={duplicateChart}>Duplicate Chart</button>
        <button className="delete" onClick={deleteChart}>
          Delete Chart
        </button>
      </div>
    </>
  )
}
