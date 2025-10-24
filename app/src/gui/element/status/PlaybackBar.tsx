import { App } from "../../../App"
import { EditMode } from "../../../chart/ChartManager"
import { Flags } from "../../../util/Flags"
import { Keybinds } from "../../../util/Keybinds"
import { ReactIcon } from "../../Icons"
import { TimeCounters } from "./TimeCounters"

export function PlaybackBar(props: {
  app: App
  playing: boolean
  state: EditMode
}) {
  return (
    <div className="playback-bar">
      <button
        tabIndex={-1}
        ref={el => {
          if (!el) return
          Keybinds.createKeybindTooltip(el)`Skip to start ${"jumpSongStart"}`
        }}
        disabled={props.state != EditMode.View && props.state != EditMode.Edit}
        onClick={e => {
          props.app.chartManager.beat = Math.max(
            0,
            props.app.chartManager.loadedChart!.getBeatFromSeconds(0)
          )
          e.currentTarget.blur()
        }}
      >
        <ReactIcon id="SKIP_START" width={36} height={36} />
      </button>
      <button
        tabIndex={-1}
        ref={el => {
          if (!el) return
          Keybinds.createKeybindTooltip(el)`Skip to end ${"jumpSongEnd"}`
        }}
        disabled={props.state != EditMode.View && props.state != EditMode.Edit}
        onClick={e => {
          props.app.chartManager.beat =
            props.app.chartManager.loadedChart!.getBeatFromSeconds(
              props.app.chartManager.chartAudio.getSongLength()
            )
          e.currentTarget.blur()
        }}
      >
        <ReactIcon id="SKIP_END" width={36} height={36} />
      </button>
      <button
        tabIndex={-1}
        ref={el => {
          if (!el) return
          Keybinds.createKeybindTooltip(el)`Play/Pause ${"playback"}`
        }}
        onClick={e => {
          if (
            props.app.chartManager.getMode() == EditMode.Record ||
            props.app.chartManager.getMode() == EditMode.Play
          ) {
            props.app.chartManager.setMode(EditMode.Edit)
          }
          props.app.chartManager.playPause()
          e.currentTarget.blur()
        }}
      >
        <ReactIcon
          id="STOP"
          width={32}
          height={32}
          style={{ display: props.playing ? "block" : "none" }}
        />
        <ReactIcon
          id="PLAY"
          width={40}
          height={40}
          style={{ display: props.playing ? "none" : "block" }}
        />
      </button>
      {!Flags.viewMode && Flags.recordMode && (
        <button
          tabIndex={-1}
          ref={el => {
            if (!el) return
            Keybinds.createKeybindTooltip(el)`Record ${"recordMode"}`
          }}
          disabled={
            props.state != EditMode.Record && props.state != EditMode.Edit
          }
          style={{
            background:
              props.state == EditMode.Record ? "rgba(170, 0, 0, 0.35)" : "",
          }}
          onClick={e => {
            if (props.app.chartManager.getMode() == EditMode.Record) {
              props.app.chartManager.setMode(EditMode.Edit)
              props.app.chartManager.playPause()
            } else {
              props.app.chartManager.setMode(EditMode.Record)
            }
            e.currentTarget.blur()
          }}
        >
          <ReactIcon id="RECORD" width={36} height={36} color="red" />
        </button>
      )}
      {Flags.playMode && (
        <button
          tabIndex={-1}
          ref={el => {
            if (!el) return
            Keybinds.createKeybindTooltip(el)`Playtest ${"playMode"}`
          }}
          disabled={
            props.state != EditMode.Play && props.state != EditMode.Edit
          }
          style={{
            background:
              props.state == EditMode.Play ? "rgba(12, 97, 31, 0.35)" : "",
          }}
          onClick={e => {
            if (props.app.chartManager.getMode() == EditMode.Play) {
              props.app.chartManager.setMode(EditMode.Edit)
              props.app.chartManager.playPause()
            } else {
              props.app.chartManager.setMode(EditMode.Play)
            }
            e.currentTarget.blur()
          }}
        >
          <ReactIcon id="PLAYTEST" width={30} height={30} />
        </button>
      )}
      <div className="playback-separator" />
      <TimeCounters app={props.app} state={props.state} />
    </div>
  )
}
