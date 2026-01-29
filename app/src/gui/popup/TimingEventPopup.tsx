import { DisplayObject } from "pixi.js"
import {
  Fragment,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react"
import { TIMING_EVENT_COLORS } from "../../chart/component/timing/TimingAreaContainer"
import { TimingData } from "../../chart/sm/TimingData"
import { Cached, TimingEvent } from "../../chart/sm/TimingTypes"
import { TIMING_POPUP_ROWS } from "../../data/TimingEventPopupData"
import { blendColors } from "../../util/Color"
import { EventHandler } from "../../util/EventHandler"
import { ValueInput } from "../inputs/ValueInput"
import { PopupEditIndicator } from "./PopupEditIndicator"
import { PopupContext, PopupData } from "./PopupManager"

interface TimingEventPopupOptions {
  box: DisplayObject
  event: Cached<TimingEvent>
  timingData: TimingData
  newEvent: boolean
  onConfirm: (event: TimingEvent) => void
}

function TimingEventPopupContent(props: TimingEventPopupOptions) {
  const popupData = useContext(PopupContext)
  const schema = useMemo(
    () => TIMING_POPUP_ROWS[props.event.type],
    [props.event.type]
  )
  const [event, setEvent] = useState(props.event)
  const gridRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const onTimingModified = () => {
      const updatedEvent = props.timingData.getEventAtBeat(
        props.event.type,
        props.event.beat,
        false
      )
      if (!updatedEvent || updatedEvent.beat != props.event.beat) {
        popupData?.close()
        return
      }
      setEvent(updatedEvent)
    }
    EventHandler.on("timingModified", onTimingModified)
    return () => EventHandler.off("timingModified", onTimingModified)
  }, [])

  useEffect(() => {
    if (popupData?.highlighted) {
      // Autoselect first textbox
      const firstInput = gridRef.current?.querySelector("input")
      if (firstInput) {
        firstInput.select()
      }
    }
  }, [popupData?.highlighted])

  return (
    <div
      className="flex-column-full"
      style={{ padding: "0.5rem", color: "white" }}
    >
      <div className="popup-title">{schema.title}</div>
      {schema.description && (
        <div className="popup-desc">{schema.description}</div>
      )}
      <div className="popup-grid" ref={gridRef}>
        {schema.rows.map((row, i) => {
          return (
            <Fragment key={i}>
              <div className="popup-label">{row.label}</div>
              <ValueInput
                {...row.input}
                value={event[row.key as keyof TimingEvent] as any}
                onChange={(value: any) => {
                  if (value == null) return
                  if (props.newEvent) {
                    Object.assign(event, {
                      [row.key]: value,
                    })
                  } else {
                    props.timingData.modify([
                      [
                        structuredClone(event),
                        Object.assign(event, {
                          [row.key]: value,
                        }),
                      ],
                    ])
                  }
                }}
              />
            </Fragment>
          )
        })}
      </div>
      <div className="popup-options">
        <button
          className="confirm"
          onClick={() => {
            popupData?.close()
            props.onConfirm(props.event)
          }}
        >
          Ok
        </button>
        <button
          className="delete"
          onClick={() => {
            if (!props.newEvent)
              props.timingData.delete([
                {
                  type: props.event.type,
                  [props.event.type == "ATTACKS" ? "second" : "beat"]:
                    props.event.type == "ATTACKS"
                      ? props.event.second
                      : props.event.beat,
                },
              ])
            popupData?.close()
          }}
        >
          Delete
        </button>
      </div>
      <PopupEditIndicator />
    </div>
  )
}

export function TimingEventPopup(options: TimingEventPopupOptions): PopupData {
  return {
    attach: options.box,
    id: "timing-event-popup",
    width: TIMING_POPUP_ROWS[options.event.type].width ?? 150,
    background: blendColors(
      TIMING_EVENT_COLORS[options.event.type].toString(16).padStart(6, "0"),
      "#333333",
      0.75
    ),
    offset: { x: 0, y: 15 },
    pivot: { x: 0.5, y: 0 },
    content: <TimingEventPopupContent {...options} />,
  }
}
