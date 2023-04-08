import { TIMING_EVENT_COLORS } from "../../chart/component/TimingAreaContainer"
import { TimingBox } from "../../chart/component/TimingTrackContainer"
import { TimingData } from "../../chart/sm/TimingData"
import { POPUP_ROWS, PopupRow } from "../../data/TimingEventPopupData"
import { EventHandler } from "../../util/EventHandler"
import { blendColors, clamp } from "../../util/Util"
import { Dropdown } from "./Dropdown"
import { NumberSpinner } from "./NumberSpinner"

interface FinalRow {
  data: PopupRow
  el: HTMLInputElement | Dropdown<string> | NumberSpinner
}

export class TimingEventPopup {
  private static activePopup?: TimingEventPopup
  private timingBox
  private popup: HTMLDivElement
  private timingData
  private rows: FinalRow[] = []
  private onTimingChange
  private moveInterval
  constructor(timingBox: TimingBox, timingData: TimingData) {
    timingBox.popup = this
    this.timingBox = timingBox
    this.timingData = timingData
    this.popup = this.build()
    setTimeout(() => this.movePosition())
    document.getElementById("popups")?.appendChild(this.popup)

    this.onTimingChange = this.updateValues.bind(this)
    this.moveInterval = setInterval(() => this.movePosition(), 150)
    EventHandler.on("timingChanged", this.onTimingChange)
    TimingEventPopup.activePopup?.close()
    TimingEventPopup.activePopup = this
  }
  private movePosition() {
    const point = this.timingBox.getBounds()
    // will the box stay in bounds?
    const centerx = point.left + point.width / 2
    const width = POPUP_ROWS[this.timingBox.event.type].width ?? 150
    const leftRestriction = width / 2 + 15
    const rightRestriction = window.innerWidth - width / 2 - 15
    this.popup.style.left = `${clamp(
      centerx,
      leftRestriction,
      rightRestriction
    )}px`
    const centery = point.top + point.height / 2
    this.popup.style.top = `${point.top + point.height}px`
    if (centery + this.popup.clientHeight > window.innerHeight - 15) {
      this.popup.style.transform = `translate(-50%, -100%)`
      this.popup.style.top = `${point.top - point.height / 2}px`
    }
  }
  private build() {
    const data = POPUP_ROWS[this.timingBox.event.type]
    const popup = document.createElement("div")
    popup.classList.add("popup")
    const popupZoomer = document.createElement("div")
    popupZoomer.classList.add("popup-zoomer")
    popupZoomer.style.width = data.width ? `${data.width}px` : "150px"
    popupZoomer.style.backgroundColor = blendColors(
      TIMING_EVENT_COLORS[this.timingBox.event.type]
        .toString(16)
        .padStart(6, "0"),
      "#333333",
      0.75
    )
    popup.appendChild(popupZoomer)
    const title = document.createElement("div")
    title.innerText = data.title
    title.classList.add("popup-title")
    popupZoomer.appendChild(title)
    if (data.description) {
      const desc = document.createElement("div")
      desc.innerText = data.description
      popupZoomer.appendChild(desc)
      desc.classList.add("popup-desc")
    }
    const grid = document.createElement("div")
    grid.classList.add("popup-grid")
    popupZoomer.appendChild(grid)
    data.rows.forEach(row => grid.append(...this.buildRow(row)))
    return popup
  }
  private buildRow(data: PopupRow) {
    const event = this.timingBox.event as { [key: string]: any }
    // const container = document.createElement("div")
    // container.classList.add("popup-row")
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
          if (!value) return
          this.timingData.insert(
            this.timingBox.songTiming,
            this.timingBox.event.type,
            { [data.key]: value },
            this.timingBox.event.beat
          )
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
          this.timingData.insert(
            this.timingBox.songTiming,
            this.timingBox.event.type,
            { [data.key]: input.value },
            this.timingBox.event.beat
          )
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
            this.timingData.insert(
              this.timingBox.songTiming,
              this.timingBox.event.type,
              { [data.key]: deserializer(value) },
              this.timingBox.event.beat
            )
          })
          this.rows.push({ data: data, el: dropdown })
          ret.push(dropdown.view)
        } else {
          const dropdown = Dropdown.create(data.input.items, event[data.key])
          dropdown.onChange(value => {
            this.timingData.insert(
              this.timingBox.songTiming,
              this.timingBox.event.type,
              { [data.key]: value },
              this.timingBox.event.beat
            )
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
          this.timingData.insert(
            this.timingBox.songTiming,
            this.timingBox.event.type,
            { [data.key]: checkbox.checked },
            this.timingBox.event.beat
          )
        }
        this.rows.push({ data: data, el: checkbox })
        ret.push(checkbox)
        break
      }
    }
    return ret
  }
  private updateValues() {
    const event = this.timingBox.event as { [key: string]: any }
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
  close() {
    EventHandler.off("timingChanged", this.onTimingChange)
    clearInterval(this.moveInterval)
    this.popup.classList.add("exiting")
    setTimeout(() => this.popup.remove(), 200)
    this.timingBox.popup = undefined
  }
}
