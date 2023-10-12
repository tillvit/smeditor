import { TIMING_EVENT_COLORS } from "../../chart/component/TimingAreaContainer"
import { TimingBox } from "../../chart/component/TimingTrackContainer"
import { TimingData } from "../../chart/sm/TimingData"
import { TimingEvent } from "../../chart/sm/TimingTypes"
import { POPUP_ROWS, PopupRow } from "../../data/TimingEventPopupData"
import { blendColors } from "../../util/Color"
import { EventHandler } from "../../util/EventHandler"
import { clamp } from "../../util/Math"
import { Dropdown } from "../element/Dropdown"
import { NumberSpinner } from "../element/NumberSpinner"

interface FinalRow {
  data: PopupRow
  el: HTMLInputElement | Dropdown<string> | NumberSpinner
}

export class TimingEventPopup {
  static activePopup?: TimingEventPopup
  private readonly timingBox
  private readonly popup: HTMLDivElement
  private zoomer!: HTMLDivElement
  private editText!: HTMLDivElement
  private timingData
  private rows: FinalRow[] = []
  private readonly onTimingChange
  private readonly clickOutside
  private readonly moveInterval
  private readonly modifyBox
  onConfirm: (event: TimingEvent) => void = () => {}
  persistent = false
  constructor(timingBox: TimingBox, timingData: TimingData, modifyBox = false) {
    timingBox.popup = this
    this.timingBox = timingBox
    this.timingData = timingData
    this.modifyBox = modifyBox
    this.popup = this.build()

    // don't show until the position has been set
    this.popup.style.display = `none`
    setTimeout(() => this.movePosition())

    this.onTimingChange = this.updateValues.bind(this)
    this.clickOutside = (event: MouseEvent) => {
      if (!this.popup.contains(event.target as Node | null)) this.close()
    }
    EventHandler.on("timingModified", this.onTimingChange)
    if (TimingEventPopup.activePopup?.persistent) {
      timingBox.popup = undefined
    } else {
      document.getElementById("popups")?.appendChild(this.popup)
      this.moveInterval = setInterval(() => this.movePosition(), 150)
      TimingEventPopup.activePopup?.close()
      TimingEventPopup.activePopup = this
    }
  }
  private movePosition() {
    this.popup.style.display = ``
    const point = this.timingBox.backgroundObj.getBounds()
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
    const centery = point.top + 35 + point.height / 2
    this.popup.style.top = `${point.top + point.height + 35}px`
    if (centery + this.popup.clientHeight > window.innerHeight - 15) {
      this.popup.style.transform = `translate(-50%, -100%)`
      this.popup.style.top = `${point.top - point.height / 2 + 35}px`
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
    this.zoomer = popupZoomer
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

    const editText = document.createElement("div")
    editText.innerText = "click to edit"
    editText.style.marginTop = "4px"
    editText.style.height = "10px"
    popupZoomer.appendChild(editText)
    editText.classList.add("popup-desc")
    this.editText = editText

    const popupOptions = document.createElement("div")
    popupOptions.classList.add("popup-options")

    const okButton = document.createElement("button")
    okButton.innerText = "Ok"
    okButton.onclick = () => {
      this.close()
      this.onConfirm(this.timingBox.event)
    }
    okButton.classList.add("confirm")
    popupOptions.append(okButton)

    const deleteButton = document.createElement("button")
    deleteButton.innerText = "Delete"
    deleteButton.onclick = () => {
      if (!this.modifyBox)
        this.timingData.delete([
          {
            type: this.timingBox.event.type,
            [this.timingBox.event.type == "ATTACKS" ? "second" : "beat"]:
              this.timingBox.event.type == "ATTACKS"
                ? this.timingBox.event.second
                : this.timingBox.event.beat,
          },
        ])
      this.close()
    }
    deleteButton.classList.add("delete")
    popupOptions.append(deleteButton)
    popupZoomer.append(popupOptions)

    return popup
  }
  private buildRow(data: PopupRow) {
    const event = structuredClone(
      this.timingBox.event as { [key: string]: any }
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

  private modifyEvent(key: string, value: any) {
    this.modifyBox
      ? Object.assign(this.timingBox.event, {
          [key]: value,
        })
      : this.timingData.modify([
          [
            structuredClone(this.timingBox.event),
            Object.assign(this.timingBox.event, {
              [key]: value,
            }),
          ],
        ])
  }

  private updateValues() {
    const event = this.timingData.getEventAtBeat(
      this.timingBox.event.type,
      this.timingBox.event.beat
    ) as { [key: string]: any }
    if (!this.timingBox || !event || event.beat != this.timingBox.event.beat) {
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
  close() {
    this.persistent = false
    EventHandler.off("timingModified", this.onTimingChange)
    window.removeEventListener("click", this.clickOutside)
    clearInterval(this.moveInterval)
    this.popup.classList.add("exiting")
    setTimeout(() => this.popup.remove(), 200)
    this.timingBox.popup = undefined
    TimingEventPopup.activePopup = undefined
  }

  select() {
    this.persistent = true
    this.zoomer.classList.add("selected")
    this.editText.style.transform = "scale(0)"
    this.editText.style.height = "0px"
    setTimeout(() => window.addEventListener("click", this.clickOutside), 200)
  }

  detach() {
    clearInterval(this.moveInterval)
  }
}
