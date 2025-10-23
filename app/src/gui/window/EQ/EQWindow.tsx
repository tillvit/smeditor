import { Color } from "pixi.js"
import { useContext, useEffect, useRef, useState } from "react"
import { average, blendPixiColors } from "../../../util/Color"
import { EventHandler } from "../../../util/EventHandler"
import { clamp, roundDigit } from "../../../util/Math"
import { Themes } from "../../../util/Theme"
import { parseString as numericParse } from "../../../util/Util"
import { ReactIcon } from "../../Icons"
import { InlineTextInput } from "../../inputs/InlineTextInput"
import { WindowContext, WindowData } from "../WindowManager"
import { EQCanvas } from "./EQCanvas"
import { EQPoint } from "./EQPoint"

const FILTER_DEFAULTS: { frequency: number; Q?: number; gain?: number }[] = [
  { frequency: 20, Q: 0.71 },
  { frequency: 75, gain: 0 },
  { frequency: 100, gain: 0, Q: 0.6 },
  { frequency: 250, gain: 0, Q: 0.3 },
  { frequency: 1040, gain: 0, Q: 0.41 },
  { frequency: 2500, gain: 0, Q: 0.2 },
  { frequency: 7500, gain: 0 },
  { frequency: 20000, Q: 0.71 },
]

export const EQGraphLeft = 0
export const EQGraphTop = 0
export const EQGraphWidth = 1200
export const EQGraphHeight = 400
export const EQFreqPool = new Array(EQGraphWidth)
  .fill(0)
  .map((_, index) => xToFreq(index))
export const EQFreqPoolTyped = new Float32Array(EQFreqPool)

export function freqToX(frequency: number) {
  return (Math.log(frequency / 20) / Math.log(1102.5)) * EQGraphWidth
}

export function xToFreq(x: number) {
  return Math.pow(1102.5, x / EQGraphWidth) * 20
}

export function gainToY(gain: number) {
  return -gain * 6 + EQGraphHeight / 2
}

export function yToGain(y: number) {
  return -(y - EQGraphHeight / 2) / 6
}

export const EQFills = [
  "#a3001b",
  "#a34f00",
  "#d6d606",
  "#19c402",
  "#02c4ba",
  "#022fc4",
  "#5602c4",
  "#c402b4",
]

function getTargetColor() {
  if (average(Themes.getColor("primary-bg")) > 0.5) {
    return new Color("white")
  } else {
    return new Color("black")
  }
}

function getTextColor() {
  if (average(Themes.getColor("primary-bg")) > 0.5) {
    return new Color("black")
  } else {
    return new Color("white")
  }
}

function getColors() {
  const targetColor = getTargetColor()
  const accentColor = Themes.getColor("accent-color")
  const bgColor = blendPixiColors(accentColor, targetColor, 0.95)
  const borderHighlight = blendPixiColors(accentColor, targetColor, 0.5)

  return {
    bg: bgColor.toHexa(),
    border: `linear-gradient(to right, ${bgColor.toHexa()}, ${borderHighlight.toHexa()}, ${bgColor.toHexa()})`,
  }
}

function EQWindowContent() {
  const windowData = useContext(WindowContext)!
  const response = useRef(new Array(EQGraphWidth).fill(0))
  const points = useRef<EQPoint[]>([])
  const [chartAudio, setChartAudio] = useState(
    windowData.app.chartManager.chartAudio
  )

  const [backgroundColor, setBackgroundColor] = useState(getColors().bg)
  const [borderSource, setBorderSource] = useState(getColors().border)
  const [filterIndex, setFilterIndex] = useState<number | null>(null)
  const [activeFilterData, setActiveFilterData] = useState({
    type: "",
    frequency: "",
    gain: "",
    Q: "",
  })
  const [activeFilterColor, setActiveFilterColor] = useState("#000000")

  function onAudioLoad() {
    setChartAudio(windowData.app.chartManager.chartAudio)
    points.current = windowData.app.chartManager.chartAudio
      .getFilters()
      .map(
        (_, index) =>
          new EQPoint(windowData.app.chartManager.chartAudio, index, fetchData)
      )
    fetchData()
  }

  function changeThemeColors() {
    const colors = getColors()
    setBackgroundColor(colors.bg)
    setBorderSource(colors.border)
  }

  function fetchFilterData(index = filterIndex) {
    if (index === null) {
      setActiveFilterData({
        type: "",
        frequency: "",
        gain: "",
        Q: "",
      })
      return
    }
    const activeFilter = windowData.app.chartManager.chartAudio.getFilter(index)
    if (activeFilter === null) {
      setActiveFilterData({
        type: "",
        frequency: "",
        gain: "",
        Q: "",
      })
      return
    }
    setActiveFilterData({
      type: activeFilter.type,
      frequency: Math.round(activeFilter.frequency.value) + " Hz",
      gain: activeFilter.type.endsWith("pass")
        ? "-"
        : roundDigit(activeFilter.gain.value, 1) + " dB",
      Q: activeFilter.type.endsWith("shelf")
        ? "-"
        : roundDigit(activeFilter.Q.value, 2) + "",
    })
    setActiveFilterColor(
      blendPixiColors(getTextColor(), new Color(EQFills[index]), 0.6).toHexa()
    )
  }

  function fetchData(index = filterIndex) {
    response.current =
      windowData.app.chartManager.chartAudio.getFrequencyResponse(EQFreqPool)
    fetchFilterData(index)
  }

  useEffect(() => {
    EventHandler.on("audioLoaded", onAudioLoad)
    EventHandler.on("themeChanged", changeThemeColors)
    changeThemeColors()
    onAudioLoad()
    return () => {
      EventHandler.off("audioLoaded", onAudioLoad)
      EventHandler.off("themeChanged", changeThemeColors)
    }
  }, [])

  useEffect(() => {
    fetchFilterData()
  }, [filterIndex])

  return (
    <div className="eq-container">
      <div
        className="icon-container"
        style={{
          backgroundColor: backgroundColor,
          borderImageSource: borderSource,
        }}
      >
        {chartAudio.getFilters().map((filter, index) => {
          return (
            <div
              onMouseEnter={() => points.current[index].highlight()}
              onMouseLeave={() => points.current[index].unhighlight()}
              onClick={() => {
                const enabled =
                  windowData.app.chartManager.chartAudio.getFilter(
                    index
                  ).enabled
                if (enabled)
                  windowData.app.chartManager.chartAudio.disableFilter(index)
                else windowData.app.chartManager.chartAudio.enableFilter(index)
                fetchData()
              }}
              key={index}
            >
              <ReactIcon
                id={filter.type.toUpperCase()}
                width={36}
                height={24}
                color={EQFills[index]}
                className="eq-icon"
                style={{
                  backgroundColor: `${EQFills[index]}40`,
                }}
              />
            </div>
          )
        })}
      </div>
      <EQCanvas
        response={response}
        points={points}
        setFilterIndex={setFilterIndex}
      />
      <div
        className="eq-info-container"
        style={{
          backgroundColor: backgroundColor,
          borderImageSource: borderSource,
          color: "var(--accent-color)",
        }}
      >
        <div className="eq-info">
          <div className="eq-info-label">Type</div>
          <InlineTextInput
            value={activeFilterData.type}
            className="eq-info-value"
            disabled={true}
            style={{ color: activeFilterColor }}
          />
        </div>
        <div className="eq-info">
          <div className="eq-info-label">Frequency</div>
          <InlineTextInput
            value={activeFilterData.frequency}
            className="eq-info-value"
            disabled={activeFilterData.frequency == ""}
            style={{ color: activeFilterColor }}
            onChange={value => {
              const number = numericParse(value.replace("Hz", ""))
              if (number === null) return
              windowData.app.chartManager.chartAudio.updateFilter(
                filterIndex!,
                {
                  frequency: clamp(number, 20, 22050),
                }
              )
              points.current[filterIndex!].refreshPoint()
              fetchData(filterIndex)
            }}
          />
        </div>
        <div className="eq-info">
          <div className="eq-info-label">Gain</div>
          <InlineTextInput
            value={activeFilterData.gain}
            className="eq-info-value"
            disabled={
              activeFilterData.gain == "-" || activeFilterData.gain == ""
            }
            style={{ color: activeFilterColor }}
            onChange={value => {
              const number = numericParse(value.replace("dB", ""))
              if (number === null) return
              windowData.app.chartManager.chartAudio.updateFilter(
                filterIndex!,
                {
                  gain: clamp(number, -24, 24),
                }
              )
              points.current[filterIndex!].refreshPoint()
              fetchData(filterIndex)
            }}
          />
        </div>
        <div className="eq-info">
          <div className="eq-info-label">Q</div>
          <InlineTextInput
            value={activeFilterData.Q}
            className="eq-info-value"
            disabled={activeFilterData.Q == "-" || activeFilterData.Q == ""}
            style={{ color: activeFilterColor }}
            onChange={value => {
              const number = numericParse(value)
              if (number === null) return
              windowData.app.chartManager.chartAudio.updateFilter(
                filterIndex!,
                {
                  Q: clamp(number, 0.0001, 1000),
                }
              )
              points.current[filterIndex!].refreshPoint()
              fetchData(filterIndex)
            }}
          />
        </div>
        <button
          className="eq-reset"
          onClick={() => {
            if (filterIndex === null) {
              for (let i = 0; i < FILTER_DEFAULTS.length; i++) {
                windowData.app.chartManager.chartAudio.updateFilter(
                  i,
                  FILTER_DEFAULTS[i]
                )
                windowData.app.chartManager.chartAudio.disableFilter(i)
                points.current[i].refreshPoint()
              }
              fetchData()
            } else {
              windowData.app.chartManager.chartAudio.updateFilter(
                filterIndex,
                FILTER_DEFAULTS[filterIndex]
              )
              windowData.app.chartManager.chartAudio.disableFilter(filterIndex)
              points.current[filterIndex].refreshPoint()
              fetchData()
            }
          }}
        >
          Reset
        </button>
      </div>
    </div>
  )
}

export function EQWindow(): WindowData {
  return {
    id: "audio-eq",
    title: "Audio Equalizer",
    width: 600,
    viewStyle: { padding: "0px" },
    content: <EQWindowContent />,
  }
}
