import tippy from "tippy.js"
import "tippy.js/animations/scale-subtle.css"
import "tippy.js/dist/tippy.css"
import { GameTypeRegistry } from "../../app/src/chart/gameTypes/GameTypeRegistry"
import { Simfile } from "../../app/src/chart/sm/Simfile"
import { Dropdown } from "../../app/src/gui/element/Dropdown"
import { FLAG_MAP } from "../../app/src/util/Switches"

const flags = new Set<string>()

document.addEventListener("DOMContentLoaded", () => {
  const outputUrl = document.getElementById("output-url")! as HTMLInputElement
  const iframe = document.getElementById("output-iframe")! as HTMLIFrameElement
  const inputUrl = document.getElementById("sm-url")! as HTMLInputElement
  const chartContainer = document.getElementById("chart-container")!
  let loading = document.getElementById("loading-output")!
  const grid = document.getElementById("option-grid")!
  let loadedSM: Simfile | undefined

  let smURL: string | undefined
  let oldUrl = ""

  let chartIndex: number | undefined
  let chartType: string | undefined

  tippy.setDefaultProps({ duration: [200, 100] })
  tippy(outputUrl, {
    content: "Click to copy to clipboard",
    placement: "bottom",
  })

  function setLoadingStatus(text: string, type?: string) {
    const newNode = loading.cloneNode(true) as HTMLElement
    loading.parentNode!.replaceChild(newNode, loading)
    loading = newNode
    loading.innerText = text
    if (type == "error") loading.style.color = "rgba(222, 44, 44, 0.9)"
    else loading.style.color = ""
  }

  function updateEmbedUrl() {
    const url = new URL(`${location.origin}/smeditor/app/`)
    if (smURL !== undefined) url.searchParams.set("url", smURL)
    if (chartType !== undefined) url.searchParams.set("chartType", chartType)
    if (chartIndex !== undefined)
      url.searchParams.set("chartIndex", chartIndex + "")
    if (flags.size > 0)
      url.searchParams.set("flags", [...flags.values()].join(""))
    outputUrl.value = url.toString()
    if (oldUrl != url.toString()) {
      iframe.src = url.toString()
    }
    oldUrl = url.toString()
  }
  updateEmbedUrl()

  document.onclick = () => {
    window.getSelection()?.removeAllRanges()
  }

  outputUrl.onclick = event => {
    event.preventDefault()
    outputUrl.blur()
    navigator.clipboard.writeText(outputUrl.value)
    setTimeout(() => outputUrl.select(), 10)
  }
  outputUrl.onselect = event => {
    event.preventDefault()
    setTimeout(() => outputUrl.select(), 10)
  }
  outputUrl.ondblclick = event => {
    event.preventDefault()
    setTimeout(() => outputUrl.select(), 10)
  }

  let checkUrlTimeout: NodeJS.Timeout

  function checkInputUrl() {
    if (!inputUrl.checkValidity()) return
    smURL = undefined
    updateEmbedUrl()
    const urlToCheck = inputUrl.value
    if (urlToCheck === "") {
      inputUrl.classList.remove("invalid", "ok")
      setLoadingStatus("")
      return
    }
    inputUrl.classList.remove("invalid", "ok")
    setLoadingStatus("Loading...")

    const timeout = new AbortController()
    const timeoutId = setTimeout(() => {
      inputUrl.classList.add("invalid")
      timeout.abort()
      setLoadingStatus("Failed to load the specified URL!", "error")
    }, 5000)

    fetch(urlToCheck, { signal: timeout.signal })
      .then(response => {
        if (!response.ok) {
          inputUrl.classList.add("invalid")
          setLoadingStatus("Failed to load the specified URL!", "error")
          return
        }
        clearTimeout(timeoutId)
        response.text().then(async text => {
          const url = new URL(urlToCheck)
          const file = new File(
            [text],
            url.pathname.split("/").pop() ?? "song.sm"
          )
          setLoadingStatus("Loading charts...")
          const sm = new Simfile(file)
          await sm.loaded
          if (
            sm.properties.TITLE === undefined ||
            sm.properties.MUSIC === undefined
          ) {
            setLoadingStatus("Invalid file provided!", "error")
          }
          loadedSM = sm
          smURL = urlToCheck
          setLoadingStatus("")
          updateEmbedUrl()
          loadCharts()
        })
        inputUrl.classList.add("ok")
        return
      })
      .catch(() => {
        inputUrl.classList.add("invalid")
        setLoadingStatus("Failed to load the specified URL!", "error")
      })

    return
  }

  inputUrl.onkeydown = event => {
    inputUrl.classList.remove("invalid")
    inputUrl.classList.remove("ok")
    setLoadingStatus("")
    clearTimeout(checkUrlTimeout)
    checkUrlTimeout = setTimeout(() => checkInputUrl(), 1000)
    if (event.key == "Enter" || event.key == "Escape") {
      inputUrl.blur()
    }
  }
  inputUrl.onblur = () => {
    if (!inputUrl.checkValidity()) return
    clearInterval(checkUrlTimeout)
    checkInputUrl()
  }

  const gameTypeDropdown = Dropdown.create<string>([])
  gameTypeDropdown.onChange(value => {
    const gameType = value.split(" ")?.[0] ?? "dance-single"
    const charts = loadedSM?.charts[gameType] ?? []
    chartDropdown.setItems(
      charts.map(chart => `${chart.difficulty} ${chart.meter}`)
    )
    chartDropdown.setSelected(chartDropdown.getItems().at(-1))
    if (charts.length != 0) {
      console.log(charts.length)
      if (gameType != "dance-single") {
        chartType = gameType
      } else {
        chartType = undefined
      }
      updateEmbedUrl()
    }
  })
  const chartDropdown = Dropdown.create<string>([])
  chartDropdown.onChange((_, idx) => {
    if (chartIndex != chartDropdown.getItems().length - 1) {
      chartIndex = idx
    } else {
      chartIndex = undefined
    }
    updateEmbedUrl()
  })
  chartContainer.appendChild(gameTypeDropdown.view)
  chartContainer.appendChild(chartDropdown.view)
  function loadCharts() {
    gameTypeDropdown.setItems(
      GameTypeRegistry.getPriority().map(gameType => {
        const charts = loadedSM!.charts[gameType.id] ?? []
        return gameType.id + " (" + charts.length + ")"
      })
    )
    const charts = loadedSM?.charts["dance-single"] ?? []
    chartDropdown.setItems(
      charts.map(chart => `${chart.difficulty} ${chart.meter}`)
    )
    chartDropdown.setSelected(chartDropdown.getItems().at(-1))
  }

  Object.entries(FLAG_MAP).forEach(([_, flag]) => {
    const label = document.createElement("label")
    label.classList.add("option")
    const checkbox = document.createElement("input")
    checkbox.type = "checkbox"

    label.replaceChildren(checkbox, document.createTextNode(flag.name))

    checkbox.onchange = () => {
      if (!checkbox.checked) {
        flags.delete(flag.char)
      } else {
        flags.add(flag.char)
      }
      updateEmbedUrl()
    }

    grid.appendChild(label)
  })

  const enableBtn = document.getElementById("enable-all") as HTMLButtonElement
  enableBtn.onclick = () => {
    for (const label of grid.children) {
      const checkbox = label.childNodes[0] as HTMLInputElement
      checkbox.checked = true
    }
    for (const char of Object.values(FLAG_MAP).map(flag => flag.char)) {
      flags.add(char)
    }
    updateEmbedUrl()
  }

  const disableBtn = document.getElementById("disable-all") as HTMLButtonElement
  disableBtn.onclick = () => {
    for (const label of grid.children) {
      const checkbox = label.childNodes[0] as HTMLInputElement
      checkbox.checked = false
    }
    flags.clear()
    updateEmbedUrl()
  }
})
