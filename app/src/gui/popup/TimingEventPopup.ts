import { TIMING_EVENT_COLORS } from "../../chart/component/timing/TimingAreaContainer"
import { TimingBox } from "../../chart/component/timing/TimingTrackContainer"
import { TimingData } from "../../chart/sm/TimingData"
import { TimingEvent } from "../../chart/sm/TimingTypes"
import { POPUP_ROWS, PopupRow } from "../../data/TimingEventPopupData"
import { blendColors } from "../../util/Color"
import { EventHandler } from "../../util/EventHandler"
import { Dropdown } from "../element/Dropdown"
import { NumberSpinner } from "../element/NumberSpinner"
import { Popup, PopupOptions } from "./Popup"

interface FinalRow {
  data: PopupRow
  el: HTMLInputElement | Dropdown<string> | NumberSpinner
}

interface TimingEventPopupOptions {
  box: TimingBox
  timingData: TimingData
  modifyBox: boolean
  onConfirm: (event: TimingEvent) => void
}

export class TimingEventPopup extends Popup {
  static options: TimingEventPopupOptions & PopupOptions
  static cachedEvent: TimingEvent

  private static rows: FinalRow[] = []
  static onTimingChange: () => void

  static open(options: TimingEventPopupOptions) {
    if (this.active) return
    super._open({
      ...options,
      attach: options.box.backgroundObj,
      title: POPUP_ROWS[options.box.event.type].title,
      description: POPUP_ROWS[options.box.event.type].description,
      width: POPUP_ROWS[options.box.event.type].width ?? 150,
      editable: true,
      cancelableOnOpen: false,
      background: blendColors(
        TIMING_EVENT_COLORS[options.box.event.type]
          .toString(16)
          .padStart(6, "0"),
        "#333333",
        0.75
      ),
      textColor: "#ffffff",
      options: [
        {
          label: "Ok",
          type: "confirm",
          callback: () => {
            this.close()
            this.options.onConfirm(this.cachedEvent)
          },
        },
        {
          label: "Delete",
          type: "delete",
          callback: () => {
            if (!this.options.modifyBox)
              this.options.timingData.delete([
                {
                  type: this.cachedEvent.type,
                  [this.cachedEvent.type == "ATTACKS" ? "second" : "beat"]:
                    this.cachedEvent.type == "ATTACKS"
                      ? this.cachedEvent.second
                      : this.cachedEvent.beat,
                },
              ])
            this.close()
          },
        },
      ],
    })
    this.cachedEvent = options.box.event

    this.onTimingChange = this.updateValues.bind(this)
    EventHandler.on("timingModified", this.onTimingChange)
    // if (TimingEventPopup.activePopup?.persistent) {
    //   timingBox.popup = undefined
    // } else {
    //   TimingEventPopup.activePopup?.close()
    //   TimingEventPopup.activePopup = this
    // }
  }
  static buildContent() {
    const data = POPUP_ROWS[this.options.box.event.type]
    const grid = document.createElement("div")
    grid.classList.add("popup-grid")
    this.view!.appendChild(grid)
    data.rows.forEach(row => grid.append(...this.buildRow(row)))
  }

  private static buildRow(data: PopupRow) {
    const event = structuredClone(
      this.options.box.event as { [key: string]: any }
    )
    const label = document.createElement("div")
    label.innerText = data.label
    label.classList.add("popup-label")
    const ret: HTMLElement[] = []
    ret.push(label)
    switch (data.input.type) {
      case "spinner": {
        const spinner = NumberSpinner.create(
          event[data.key],
          data.input.step,
          data.input.precision,
          data.input.min,
          data.input.max
        )
        spinner.onChange = value => {
          if (value === undefined) return
          this.modifyEvent(data.key, value)
        }
        this.rows.push({ data: data, el: spinner })
        ret.push(spinner.view)
        break
      }
      case "text": {
        const input = document.createElement("input")
        input.type = "text"
        input.autocomplete = "off"
        input.spellcheck = false
        input.onkeydown = ev => {
          if (ev.key == "Enter") input.blur()
        }
        input.onblur = () => {
          this.modifyEvent(data.key, input.value)
        }
        input.value = event[data.key]
        this.rows.push({ data: data, el: input })
        ret.push(input)
        break
      }
      case "dropdown": {
        if (data.input.transformers) {
          const deserializer = data.input.transformers.deserialize
          const serializer = data.input.transformers.serialize
          const dropdown = Dropdown.create(
            data.input.items,
            serializer(event[data.key])
          )
          dropdown.onChange(value => {
            this.modifyEvent(data.key, deserializer(value))
          })
          this.rows.push({ data: data, el: dropdown })
          ret.push(dropdown.view)
        } else {
          const dropdown = Dropdown.create(data.input.items, event[data.key])
          dropdown.onChange(value => {
            this.modifyEvent(data.key, value)
          })
          this.rows.push({ data: data, el: dropdown })
          ret.push(dropdown.view)
        }
        break
      }
      case "checkbox": {
        const checkbox = document.createElement("input")
        checkbox.type = "checkbox"
        checkbox.checked = event[data.key] as boolean
        checkbox.onchange = () => {
          this.modifyEvent(data.key, checkbox.checked)
        }
        this.rows.push({ data: data, el: checkbox })
        ret.push(checkbox)
        break
      }
    }
    return ret
  }

  private static modifyEvent(key: string, value: any) {
    if (this.options.modifyBox) {
      Object.assign(this.options.box.event, {
        [key]: value,
      })
    } else {
      this.options.timingData.modify([
        [
          structuredClone(this.options.box.event),
          Object.assign(this.options.box.event, {
            [key]: value,
          }),
        ],
      ])
    }
  }

  private static updateValues() {
    const event = this.options.timingData.getEventAtBeat(
      this.options.box.event.type,
      this.options.box.event.beat,
      false
    ) as { [key: string]: any }
    if (
      !this.options.box ||
      !event ||
      event.beat != this.options.box.event.beat
    ) {
      this.close()
      return
    }
    this.rows.forEach(row => {
      switch (row.data.input.type) {
        case "spinner": {
          ;(row.el as NumberSpinner).setValue(event[row.data.key])
          break
        }
        case "text": {
          ;(row.el as HTMLInputElement).value = event[row.data.key]
          break
        }
        case "dropdown": {
          const dropdown = row.el as Dropdown<string>
          if (row.data.input.transformers) {
            dropdown.setSelected(
              row.data.input.transformers.serialize(event[row.data.key])
            )
          } else {
            dropdown.setSelected(event[row.data.key])
          }
          break
        }
        case "checkbox": {
          ;(row.el as HTMLInputElement).checked = event[row.data.key]
          break
        }
      }
    })
  }
  static close() {
    if (!this.active) return
    super.close()
    EventHandler.off("timingModified", this.onTimingChange)
  }

  static getEvent() {
    return this.cachedEvent
  }

  static attach(target: TimingBox) {
    super.attach(target)
    this.cachedEvent = target.event
  }
}
