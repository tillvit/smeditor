import { useEffect, useRef, useState } from "react"
import { EventHandler } from "../../../util/EventHandler"
import { Flags } from "../../../util/Flags"
import { Keybinds } from "../../../util/Keybinds"
import { Options } from "../../../util/Options"
import { ReactIcon } from "../../Icons"
import { PlaybackOptionsCheckbox } from "./PlaybackOptionsCheckbox"
import { PlaybackOptionsGroup } from "./PlaybackOptionsGroup"
import { PlaybackOptionsSeparator } from "./PlaybackOptionsSeparator"
import { PlaybackOptionsToggle } from "./PlaybackOptionsToggle"
import { PlusMinusSpinner } from "./PlusMinusSpinner"

export function PlaybackOptions() {
  const [initialRender, setInitialRender] = useState(false) // scuffed way to fix x/c mod sizes
  const [isCMod, setIsCMod] = useState(Options.chart.CMod)
  const [collapsed, setCollapsed] = useState(true)
  const chartLoaded = useRef(false)

  if (!Flags.playbackOptions) return <></>

  useEffect(() => {
    if (!initialRender) setTimeout(() => setInitialRender(true), 200)
    EventHandler.on("userOptionUpdated", (id: string) => {
      if (id == "chart.CMod") {
        setIsCMod(Options.chart.CMod)
      }
      if (id === "general.showPlaybackOptions" && chartLoaded.current) {
        setCollapsed(!Options.general.showPlaybackOptions)
      }
    })
    EventHandler.on("chartLoaded", () => {
      chartLoaded.current = true
      setCollapsed(!Options.general.showPlaybackOptions)
    })
  }, [])

  function tooltip(strings: TemplateStringsArray, ...ids: string[]) {
    return (el: HTMLElement) => {
      Keybinds.createKeybindTooltip(el)(strings, ...ids)
    }
  }

  return (
    <div id="playback-options" className={`${collapsed ? "collapsed" : ""}`}>
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
      <div
        style={{
          gap: "0.25rem",
          display: "flex",
          alignItems: "center",
          opacity: Flags.assist ? 1 : 0.5,
          pointerEvents: Flags.assist ? "auto" : "none",
        }}
      >
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
          getValue={() => (Options.chart.doSpeedChanges ? 0 : 1)}
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
