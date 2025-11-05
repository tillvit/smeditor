import { useEffect, useRef, useState } from "react"
import { createRoot } from "react-dom/client"
import tippy from "tippy.js"
import "tippy.js/animations/scale-subtle.css"
import "tippy.js/dist/tippy.css"
import { GameTypeRegistry } from "../../app/src/chart/gameTypes/GameTypeRegistry"
import { Simfile } from "../../app/src/chart/sm/Simfile"
import { DropdownInput } from "../../app/src/gui/inputs/DropdownInput"
import { FLAG_MAP } from "../../app/src/util/Flags"

createRoot(document.getElementById("embed")!).render(<Embed />)

tippy.setDefaultProps({ duration: [200, 100] })

function Embed() {
  const [flags, setFlags] = useState<Set<string>>(new Set())
  const [state, setState] = useState("")
  const [smURL, setSMURL] = useState("")
  const [outputUrl, setOutputUrl] = useState("")
  const [chartType, setChartType] = useState<string | undefined>(undefined)
  const [chartTypes, setChartTypes] = useState<string[]>([])
  const [chartIndex, setChartIndex] = useState<number | undefined>(undefined)
  const [charts, setCharts] = useState<string[]>([])
  const [loadingStatus, setLoadingStatus] = useState("")
  const timeoutRef = useRef<NodeJS.Timeout>(undefined)
  const abortControllerRef = useRef<AbortController>(undefined)
  const abortTimeoutRef = useRef<NodeJS.Timeout>(undefined)
  const loadedSM = useRef<Simfile | undefined>(undefined)
  const loadOutputRef = useRef<HTMLDivElement>(null)

  function updateEmbedUrl() {
    const url = new URL(`${location.origin}/smeditor/app/`)
    if (smURL !== undefined) url.searchParams.set("url", smURL)
    if (chartType !== undefined)
      url.searchParams.set(
        "chartType",
        chartType.split(" ")?.[0] ?? "dance-single"
      )
    if (chartIndex !== undefined)
      url.searchParams.set("chartIndex", chartIndex + "")
    if (flags.size > 0)
      url.searchParams.set("flags", [...flags.values()].join(""))
    console.log(url.toString(), smURL, chartType, chartIndex)
    setOutputUrl(url.toString())
  }

  useEffect(() => {
    updateEmbedUrl()
  }, [chartType, chartIndex, flags])

  useEffect(() => {
    loadOutputRef.current!.style.animation = "none"
    // Trigger reflow
    // eslint-disable-next-line @typescript-eslint/no-unused-expressions
    loadOutputRef.current!.offsetHeight
    loadOutputRef.current!.style.animation = ""
  }, [loadingStatus])

  function checkInputUrl(url: string = smURL) {
    abortControllerRef.current?.abort()
    clearTimeout(abortTimeoutRef.current)
    loadedSM.current = undefined
    if (url === "") {
      setState("")
      setChartIndex(undefined)
      setChartType(undefined)
      setLoadingStatus("")
      updateEmbedUrl()
      return
    }
    setState("")
    setLoadingStatus("Loading...")

    const timeout = new AbortController()
    const timeoutId = setTimeout(() => {
      setState("invalid")
      timeout.abort()
      setLoadingStatus("Failed to load the specified URL!")
    }, 5000)
    abortControllerRef.current = timeout
    abortTimeoutRef.current = timeoutId

    fetch(url, { signal: timeout.signal })
      .then(response => {
        if (!response.ok) {
          setState("invalid")
          setLoadingStatus("Failed to load the specified URL!")
          return
        }
        clearTimeout(timeoutId)
        response.text().then(async text => {
          const u = new URL(url)
          const file = new File(
            [text],
            u.pathname.split("/").pop() ?? "song.sm"
          )
          setLoadingStatus("Loading charts...")
          const sm = new Simfile(file)
          await sm.loaded
          if (sm.properties.TITLE === undefined) {
            setState("invalid")
            setLoadingStatus("Invalid file provided!")
          }
          loadedSM.current = sm
          setChartIndex(undefined)
          setChartType(undefined)
          loadCharts()
        })
        setState("ok")
        return
      })
      .catch(() => {
        setState("invalid")
        setLoadingStatus("Failed to load the specified URL!")
      })

    return
  }

  function loadCharts() {
    const sm = loadedSM.current
    if (!sm) return
    const gameTypes = GameTypeRegistry.getPriority().filter(
      gameType => sm.getChartsByGameType(gameType.id).length > 0
    )
    const gameTypeFormatted = gameTypes.map(gameType => {
      const charts = sm.getChartsByGameType(gameType.id) ?? []
      return gameType.id + " (" + charts.length + ")"
    })
    setChartTypes(gameTypeFormatted)
    setChartType(gameTypeFormatted[0] ?? "")
    const charts = sm?.getChartsByGameType("dance-single") ?? []
    setCharts(charts.map(chart => `${chart.difficulty} ${chart.meter}`))
    setChartIndex(charts.length == 0 ? undefined : charts.length - 1)
    setLoadingStatus("")
  }

  return (
    <>
      <h1>Embed SMEditor</h1>
      <input
        id="output-url"
        value={outputUrl}
        readOnly
        ref={el => {
          if (!el) return
          tippy(el, {
            content: "Click to copy to clipboard",
            placement: "bottom",
          })
        }}
        onClick={e => {
          e.preventDefault()
          e.currentTarget.blur()
          navigator.clipboard.writeText(e.currentTarget.value)
          setTimeout(() => e.currentTarget.select(), 10)
        }}
        onSelect={e => {
          e.preventDefault()
          setTimeout(() => e.currentTarget.select(), 10)
        }}
        onDoubleClick={e => {
          e.preventDefault()
          setTimeout(() => e.currentTarget.select(), 10)
        }}
      />
      <div id="option-container">
        <h3>Options</h3>
        <div id="option-bar">
          <div className="option">
            SM URL
            <input
              id="sm-url"
              className={state}
              placeholder="https://example.com/song.sm"
              type="url"
              pattern="https?://.*.(sm|ssc)"
              spellCheck="false"
              autoComplete="off"
              value={smURL}
              onChange={e => {
                const value = e.currentTarget.value
                setState("")
                setLoadingStatus("")
                setSMURL(value)
                clearTimeout(timeoutRef.current)
                if (e.currentTarget.checkValidity())
                  timeoutRef.current = setTimeout(
                    () => checkInputUrl(value),
                    1000
                  )
              }}
              onKeyDown={e => {
                if (e.key == "Enter" || e.key == "Escape") {
                  e.currentTarget.blur()
                }
              }}
              onBlur={e => {
                if (!e.target.checkValidity()) return
                clearInterval(timeoutRef.current)
                checkInputUrl()
              }}
            />
            <div id="loading-output" className={state} ref={loadOutputRef}>
              {loadingStatus}
            </div>
          </div>
          <div id="chart-container" className="option">
            Chart
            <DropdownInput
              value={chartType ?? ""}
              values={chartTypes}
              onChange={type => {
                setChartType(type)
              }}
            />
            <DropdownInput
              value={charts[chartIndex ?? charts.length - 1] ?? ""}
              values={charts}
              onChange={(_, idx) => {
                setChartIndex(idx)
              }}
            />
          </div>
        </div>
        <div id="option-grid-toggles">
          <button
            id="enable-all"
            onClick={() => {
              for (const char of Object.values(FLAG_MAP).map(
                flag => flag.char
              )) {
                flags.add(char)
              }
              setFlags(new Set(flags))
            }}
          >
            Enable All
          </button>
          <button
            id="disable-all"
            onClick={() => {
              for (const char of Object.values(FLAG_MAP).map(
                flag => flag.char
              )) {
                flags.delete(char)
              }
              setFlags(new Set(flags))
            }}
          >
            Disable All
          </button>
        </div>
        <div id="option-grid">
          {Object.values(FLAG_MAP).map(flag => {
            return (
              <label className="option" key={flag.name}>
                <input
                  type="checkbox"
                  checked={flags.has(flag.char)}
                  onChange={e => {
                    if (!e.currentTarget.checked) {
                      flags.delete(flag.char)
                    } else {
                      flags.add(flag.char)
                    }
                    setFlags(new Set(flags))
                  }}
                />{" "}
                {flag.name}
              </label>
            )
          })}
        </div>
      </div>
      <iframe id="output-iframe" src={outputUrl}></iframe>
    </>
  )
}
