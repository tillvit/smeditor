import { useContext, useEffect, useRef, useState } from "react"
import { WindowContext, WindowData } from "../WindowManager"
import { SyncCover } from "./SyncCover"
import { SyncEngine, SyncGraphHeight, SyncGraphWidth } from "./SyncEngine"
import { SyncOnsetView } from "./SyncOnsetView"
import { SyncOptions, SyncOptionsView } from "./SyncOptionsView"
import { SyncTempoView } from "./SyncTempoView"

export interface SyncData {
  hasData: boolean
  bpms: { bpm: number; confidence: number }[]
  offsets: { offset: number; confidence: number }[]
  offsetBPM: number
  state: "idle" | "spectogram" | "tempogram" | "finished"
  percentage: number
  numOnsets: number
}

function SyncWindowContent() {
  const windowData = useContext(WindowContext)!

  const [activeTabIndex, setActiveTabIndex] = useState(0)
  const scrollRef = useRef<HTMLDivElement>(null)

  const canvasRef = useRef<HTMLCanvasElement>(null)
  const engineRef = useRef<SyncEngine | null>(null)
  const [syncData, setSyncData] = useState<SyncData>({
    hasData: false,
    bpms: [],
    offsets: [],
    offsetBPM: 0,
    state: "idle",
    percentage: 0,
    numOnsets: 0,
  })
  const [syncOptions, setSyncOptions] = useState<SyncOptions>({
    fftSize: 1024,
    windowStep: 512,
    tempoFftSize: 4096,
    tempoStep: 2,
  })
  const [onsetThreshold, setOnsetThreshold] = useState(0.3)

  useEffect(() => {
    if (!canvasRef.current) return
    const engine = new SyncEngine(
      windowData.app,
      canvasRef.current,
      setSyncData
    )
    engineRef.current = engine
    return () => {
      engine.destroy()
    }
  }, [canvasRef])

  function swapTab(index: number) {
    if (!scrollRef.current) return
    const fontSize = parseFloat(
      getComputedStyle(document.body.parentElement!).fontSize
    )
    scrollRef.current.scrollLeft = ((370 * fontSize) / 16) * index
    setActiveTabIndex(index)
  }

  useEffect(() => {
    if (!engineRef.current) return
    engineRef.current.fftSize = syncOptions.fftSize
    engineRef.current.windowStep = syncOptions.windowStep
    engineRef.current.tempoFftSize = syncOptions.tempoFftSize
    engineRef.current.tempoStep = syncOptions.tempoStep
    engineRef.current.reset()
  }, [syncOptions])

  useEffect(() => {
    if (!engineRef.current) return
    engineRef.current.threshold = onsetThreshold
  }, [onsetThreshold])

  function getButtonText() {
    if (!engineRef.current) return "Start analyzing"
    if (syncData.state == "finished") {
      return "Finished analyzing"
    }
    if (syncData.state == "idle") {
      return "Start analyzing"
    }
    if (syncData.state == "spectogram") {
      if (engineRef.current.runAnalysis) {
        return `Stop analyzing (${(syncData.percentage * 100).toFixed(1)}%)`
      } else {
        return `Resume analyzing (${(syncData.percentage * 100).toFixed(1)}%)`
      }
    }
    if (syncData.state == "tempogram") {
      return `Finding tempo (${(syncData.percentage * 100).toFixed(1)}%)`
    }
  }

  return (
    <div className="sync-container flex-column-full">
      <canvas
        ref={canvasRef}
        style={{
          width: `${SyncGraphWidth / 2 / 16}rem`,
          height: `${SyncGraphHeight / 16}rem`,
        }}
      ></canvas>
      <div className="sync-tab-container">
        {["Analysis Options", "Tempo Results", "Onset Results"].map(
          (tab, index) => (
            <div
              key={index}
              className={`sync-tab-option ${activeTabIndex === index ? "active" : ""}`}
              onClick={() => swapTab(index)}
            >
              {tab}
            </div>
          )
        )}
      </div>
      <div className="sync-tab-view">
        <div className="sync-tab-scroller" ref={scrollRef}>
          <SyncOptionsView
            syncOptions={syncOptions}
            setSyncOptions={setSyncOptions}
          />
          <SyncCover
            label={"Clear analysis results to edit"}
            index={0}
            active={syncData.hasData}
          />
          <SyncTempoView syncData={syncData} />
          <SyncCover
            label={"Start analysis to view"}
            index={1}
            active={!syncData.hasData}
          />
          <SyncOnsetView
            syncData={syncData}
            onsetThreshold={onsetThreshold}
            setOnsetThreshold={setOnsetThreshold}
            placeOnsets={(selection?: boolean) => {
              engineRef.current?.placeOnsets(selection)
            }}
          />
          <SyncCover
            label={"Start analysis to view"}
            index={2}
            active={!syncData.hasData}
          />
        </div>
      </div>
      <div className="sync-bottom-container">
        <button
          style={{
            width: "12.5rem",
            background: `linear-gradient(90deg, var(--accent-color) 0 ${
              syncData.percentage * 100
            }%, var(--input-bg) ${syncData.percentage * 100}% 100%)`,
          }}
          onClick={() => {
            if (!engineRef.current) return
            if (!engineRef.current.runAnalysis) {
              swapTab(1)
            }
            engineRef.current.runAnalysis = !engineRef.current.runAnalysis
          }}
          disabled={
            syncData.state === "finished" || syncData.state === "tempogram"
          }
        >
          {getButtonText()}
        </button>
        <button
          className="delete"
          style={{ width: "7.5rem" }}
          disabled={!syncData.hasData || engineRef.current?.runAnalysis}
          onClick={() => {
            if (!engineRef.current) return
            swapTab(0)
            engineRef.current.reset()
          }}
        >
          Clear results
        </button>
      </div>
    </div>
  )
}

export function SyncWindow(): WindowData {
  return {
    title: "Detect Audio Sync",
    width: 400,
    height: 450,
    id: "detect-sync",
    viewStyle: { padding: "0" },
    content: <SyncWindowContent />,
  }
}
