import { useEffect, useRef, useState } from "react"
import { EventHandler } from "../../util/EventHandler"
import { Keybinds } from "../../util/Keybinds"
import { Options } from "../../util/Options"
import { parseString } from "../../util/Util"
import { ReactIcon } from "../Icons"

interface SpinnerOptions {
  getValue: () => number
  step?: number
  altStep?: number
  min?: number
  max?: number
  hardMin?: number
  hardMax?: number
  onChange: (value: number) => void
  addTooltip?: (ref: HTMLElement) => void
}

interface ToggleOptions {
  onChange: (index: number) => void
  getValue: () => number
  values: React.JSX.Element[]
  addTooltip?: (ref: HTMLElement) => void
}

interface CheckboxOptions {
  onChange: (value: boolean) => void
  getValue: () => boolean
  onEl: React.JSX.Element
  offEl: React.JSX.Element
  addTooltip?: (ref: HTMLElement) => void
}

function PlaybackOptionsToggle(props: ToggleOptions) {
  const [currentValue, setCurrentValue] = useState(props.getValue())
  const containerRef = useRef<HTMLDivElement>(null)
  const highlightRef = useRef<HTMLDivElement>(null)
  const valueRefs = useRef<(HTMLDivElement | null)[]>([])

  useEffect(() => {
    const optionUpdate = () => {
      setCurrentValue(props.getValue())
    }
    EventHandler.on("userOptionUpdated", optionUpdate)
    return () => EventHandler.off("userOptionUpdated", optionUpdate)
  }, [])

  function updateHighlight() {
    if (
      containerRef.current &&
      highlightRef.current &&
      valueRefs.current[currentValue]
    ) {
      const selected = valueRefs.current[currentValue]
      const first = valueRefs.current[0]!
      const left =
        selected.getBoundingClientRect().left -
        first.getBoundingClientRect().left
      highlightRef.current.style.left = `${left}px`
      highlightRef.current.style.width = `${selected.getBoundingClientRect().width}px`
      highlightRef.current.style.height = `${selected.getBoundingClientRect().height}px`
    }
  }

  useEffect(() => {
    if (props.addTooltip && containerRef.current) {
      props.addTooltip(containerRef.current)
    }
  }, [containerRef, props.addTooltip])

  useEffect(() => {
    // Move highlight to selected item
    updateHighlight()
  }, [currentValue, highlightRef, valueRefs, containerRef])

  useEffect(() => {
    window.addEventListener("resize", updateHighlight)
    return () => {
      window.removeEventListener("resize", updateHighlight)
    }
  })

  const handleClick = (idx: number) => {
    if (currentValue === idx) return
    setCurrentValue(idx)
    props.onChange(idx)
  }

  return (
    <div className="po-toggle" ref={containerRef}>
      {props.values.map((el, idx) => (
        <div
          key={idx}
          onClick={() => handleClick(idx)}
          ref={el => void (valueRefs.current[idx] = el)}
          className={currentValue === idx ? "active" : ""}
        >
          {el}
        </div>
      ))}
      <div className="po-toggle-highlight" ref={highlightRef} />
    </div>
  )
}

function PlusMinusSpinner(props: SpinnerOptions) {
  const [value, setValue] = useState(props.getValue().toFixed())
  const [lastValue, setLastValue] = useState(props.getValue())
  const inputRef = useRef<HTMLInputElement>(null)
  const containerRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const optionUpdate = () => {
      setValue(props.getValue().toFixed())
      setLastValue(props.getValue())
    }
    EventHandler.on("userOptionUpdated", optionUpdate)
    return () => EventHandler.off("userOptionUpdated", optionUpdate)
  }, [])

  useEffect(() => {
    if (props.addTooltip && containerRef.current) {
      props.addTooltip(containerRef.current)
    }
  }, [containerRef, props.addTooltip])

  const getStep = (shift: boolean) => {
    let step = Options.general.spinnerStep
    if (shift) {
      step =
        props.altStep ??
        (props.step !== undefined
          ? props.step / 10
          : Options.general.spinnerStep)
    } else {
      step = props.step ?? Options.general.spinnerStep
    }
    return step
  }

  function clampNumber(val: number) {
    if (props.min !== undefined && val < props.min) {
      val = props.min
    }
    if (props.max !== undefined && val > props.max) {
      val = props.max
    }
    return val
  }

  function setNumberValue(val: number) {
    val = clampNumber(val)
    setValue(val.toFixed())
    setLastValue(val)
    props.onChange(val)
  }

  function checkValue() {
    const val = parseString(value)
    if (val == null || !isFinite(val)) {
      setValue(lastValue.toString())
      return
    }
    setNumberValue(val)
  }

  function handleWheel(ev: React.WheelEvent) {
    const newValue =
      lastValue +
      ((getStep(ev.getModifierState("Shift")) * ev.deltaY) / 100) *
        (Options.chart.scroll.invertZoomScroll ? -1 : 1) *
        Options.chart.scroll.scrollSensitivity
    setNumberValue(newValue)
  }

  function handleButton(ev: React.MouseEvent, direction: number) {
    const newValue =
      lastValue + direction * getStep(ev.getModifierState("Shift"))
    setNumberValue(newValue)
  }

  return (
    <div className="pm-spinner" ref={containerRef}>
      <button className="pm-spinner-btn" onClick={ev => handleButton(ev, -1)}>
        -
      </button>
      <input
        className="pm-spinner-input"
        type="text"
        ref={inputRef}
        value={value}
        onKeyDown={e => {
          const el = inputRef.current!
          if (e.key == "Enter") el.blur()
          if (e.key == "Escape") {
            setValue(value)
          }
        }}
        onWheel={handleWheel}
        onChange={el => setValue(el.target.value)}
        onBlur={() => checkValue()}
      />
      <button className="pm-spinner-btn" onClick={ev => handleButton(ev, 1)}>
        +
      </button>
    </div>
  )
}

function PlaybackOptionsCheckbox(props: CheckboxOptions) {
  const [toggled, setToggled] = useState(props.getValue())
  const containerRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const optionUpdate = () => {
      setToggled(props.getValue())
    }
    EventHandler.on("userOptionUpdated", optionUpdate)
    return () => EventHandler.off("userOptionUpdated", optionUpdate)
  }, [])

  useEffect(() => {
    if (props.addTooltip && containerRef.current) {
      props.addTooltip(containerRef.current)
    }
  }, [containerRef, props.addTooltip])

  return (
    <div
      className="ico-checkbox"
      ref={containerRef}
      onClick={() => {
        setToggled(!toggled)
        props.onChange(!toggled)
      }}
    >
      {toggled ? props.onEl : props.offEl}
    </div>
  )
}

function PlaybackOptionsSeparator() {
  return <div className="po-separator" />
}

function PlaybackOptionsGroup(props: {
  label: string
  children: React.ReactNode
  className?: string
  scaling?: boolean
  addTooltip?: (ref: HTMLElement) => void
}) {
  const container = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!container.current) return
    if (props.addTooltip) {
      props.addTooltip(container.current)
    }
    if (props.scaling) {
      container.current.style.setProperty(
        "--w",
        container.current.offsetWidth / 16 + "rem"
      )
    }
  }, [container])

  return (
    <div
      className={"playback-options-row " + (props.className || "")}
      ref={container}
    >
      <div className="playback-options-label">{props.label}</div>
      {props.children}
    </div>
  )
}

export function PlaybackOptions() {
  const playbackOptionsRef = useRef<HTMLDivElement>(null)
  const [initialRender, setInitialRender] = useState(false) // scuffed way to fix x/c mod sizes
  const [isCMod, setIsCMod] = useState(Options.chart.CMod)

  useEffect(() => {
    if (!playbackOptionsRef.current) return
    const view = playbackOptionsRef.current
    if (!Options.general.showPlaybackOptions) {
      view.classList.add("collapsed")
    }
    EventHandler.on("userOptionUpdated", (id: string) => {
      if (id == "general.showPlaybackOptions") {
        view.classList.toggle("collapsed", !Options.general.showPlaybackOptions)
      }
      if (id == "chart.CMod") {
        setIsCMod(Options.chart.CMod)
      }
    })
  }, [playbackOptionsRef])

  useEffect(() => {
    if (!initialRender) setTimeout(() => setInitialRender(true), 200)
  }, [])

  function tooltip(strings: TemplateStringsArray, ...ids: string[]) {
    return (el: HTMLElement) => {
      Keybinds.createKeybindTooltip(el)(strings, ...ids)
    }
  }

  return (
    <div ref={playbackOptionsRef} id="playback-options">
      <PlaybackOptionsGroup
        label="Zoom"
        addTooltip={tooltip`Adjust playfield size ${"zoomOut"}/${"zoomIn"}`}
      >
        <PlusMinusSpinner
          getValue={() => Options.chart.zoom * 100}
          step={10}
          altStep={2}
          min={10}
          hardMin={0}
          onChange={value => (Options.chart.zoom = value / 100)}
        />
      </PlaybackOptionsGroup>
      <PlaybackOptionsSeparator />
      <PlaybackOptionsGroup
        label="Playback"
        addTooltip={tooltip`Adjust audio playback rate ${"rateDown"}/${"rateUp"}`}
      >
        <PlusMinusSpinner
          getValue={() => Options.audio.rate * 100}
          step={10}
          altStep={2}
          min={10}
          hardMin={0}
          onChange={value => (Options.audio.rate = value / 100)}
        />
      </PlaybackOptionsGroup>
      <div style={{ gap: "0.25rem", display: "flex", alignItems: "center" }}>
        <PlaybackOptionsCheckbox
          addTooltip={tooltip`Toggle assist tick ${"assistTick"}`}
          onChange={value => (Options.audio.assistTick = value)}
          getValue={() => Options.audio.assistTick}
          onEl={<ReactIcon id="CLAP" width={18} />}
          offEl={<ReactIcon id="X_CLAP" width={18} />}
        />
        <PlaybackOptionsCheckbox
          addTooltip={tooltip`Toggle metronome ${"metronome"}`}
          onChange={value => (Options.audio.metronome = value)}
          getValue={() => Options.audio.metronome}
          onEl={<ReactIcon id="METRONOME" width={18} />}
          offEl={<ReactIcon id="X_METRONOME" width={18} />}
        />
      </div>
      <PlaybackOptionsSeparator />
      <PlaybackOptionsGroup
        label="Scroll"
        addTooltip={tooltip`Change scroll direction ${"reverse"}`}
      >
        <PlaybackOptionsToggle
          onChange={value => (Options.chart.reverse = !!value)}
          getValue={() => (Options.chart.reverse ? 1 : 0)}
          values={[
            <ReactIcon
              id="DBL_CHEVRON"
              width={16}
              style={{ margin: "0.125rem" }}
            />,
            <ReactIcon
              id="DBL_CHEVRON"
              width={16}
              style={{ transform: "rotate(180deg)", margin: "0.125rem" }}
            />,
          ]}
        />
      </PlaybackOptionsGroup>
      <PlaybackOptionsGroup label="Speedmod">
        <PlaybackOptionsToggle
          addTooltip={tooltip`Change speedmod type ${"XMod"}/${"CMod"}`}
          onChange={value => (Options.chart.CMod = !!value)}
          getValue={() => (Options.chart.CMod ? 1 : 0)}
          values={[
            <p className="po-toggle-text">X</p>,
            <p className="po-toggle-text">C</p>,
          ]}
        />
        <PlusMinusSpinner
          addTooltip={tooltip`Adjust playfield size ${"zoomOut"}/${"zoomIn"}`}
          getValue={() => Options.chart.speed}
          step={25}
          altStep={5}
          min={10}
          hardMin={10}
          hardMax={35000}
          onChange={value => (Options.chart.speed = value)}
        />
      </PlaybackOptionsGroup>
      <PlaybackOptionsSeparator />
      <PlaybackOptionsGroup
        label="Speed Changes"
        addTooltip={tooltip`Allow scroll/speed events (XMod only) ${"doSpeedChanges"}`}
        className={isCMod && initialRender ? "hidden" : ""}
        scaling={true}
      >
        <PlaybackOptionsToggle
          onChange={value => (Options.chart.doSpeedChanges = !value)}
          getValue={() => (Options.chart.doSpeedChanges ? 1 : 0)}
          values={[
            <p className="po-toggle-text">On</p>,
            <p className="po-toggle-text">Off</p>,
          ]}
        />
      </PlaybackOptionsGroup>
      <PlaybackOptionsGroup
        label="Warped Notes"
        addTooltip={tooltip`Show/hide warped notes (CMod only) ${"hideWarpedArrows"}`}
        className={isCMod || !initialRender ? "" : "hidden"}
        scaling={true}
      >
        <PlaybackOptionsCheckbox
          onChange={value => (Options.chart.hideWarpedArrows = value)}
          getValue={() => Options.chart.hideWarpedArrows}
          onEl={<ReactIcon id="X_EYE" width={18} />}
          offEl={<ReactIcon id="EYE" width={18} />}
        />
      </PlaybackOptionsGroup>
      <PlaybackOptionsGroup
        label="Faked Notes"
        addTooltip={tooltip`Show/hide faked notes (CMod only) ${"hideFakedArrows"}`}
        className={isCMod || !initialRender ? "" : "hidden"}
        scaling={true}
      >
        <PlaybackOptionsCheckbox
          onChange={value => (Options.chart.hideFakedArrows = value)}
          getValue={() => Options.chart.hideFakedArrows}
          onEl={<ReactIcon id="X_EYE" width={18} />}
          offEl={<ReactIcon id="EYE" width={18} />}
        />
      </PlaybackOptionsGroup>
      <ReactIcon
        id="VOLUME"
        width={22}
        style={{
          marginLeft: "auto",
          marginRight: "-1rem",
          height: "1.375rem",
          width: "1.375rem",
          alignSelf: "center",
        }}
      />
      <PlaybackOptionsGroup label="Master">
        <PlusMinusSpinner
          step={5}
          altStep={1}
          min={0}
          max={200}
          hardMin={0}
          hardMax={200}
          onChange={value => (Options.audio.masterVolume = value / 100)}
          getValue={() => Options.audio.masterVolume * 100}
        />
      </PlaybackOptionsGroup>
      <PlaybackOptionsGroup label="Song">
        <PlusMinusSpinner
          step={5}
          altStep={1}
          min={0}
          max={200}
          hardMin={0}
          hardMax={200}
          onChange={value => (Options.audio.songVolume = value / 100)}
          getValue={() => Options.audio.songVolume * 100}
        />
      </PlaybackOptionsGroup>
      <PlaybackOptionsGroup label="FX">
        <PlusMinusSpinner
          step={5}
          altStep={1}
          min={0}
          max={200}
          hardMin={0}
          hardMax={200}
          onChange={value => (Options.audio.soundEffectVolume = value / 100)}
          getValue={() => Options.audio.soundEffectVolume * 100}
        />
      </PlaybackOptionsGroup>
    </div>
  )
}
