import { Parser } from "expr-eval"
import tippy from "tippy.js"
import { EditMode } from "../../chart/ChartManager"
import { EventHandler } from "../../util/EventHandler"
import { Flags } from "../../util/Flags"
import { Keybinds } from "../../util/Keybinds"
import { Options } from "../../util/Options"
import { Icons } from "../Icons"
import { Widget } from "./Widget"
import { WidgetManager } from "./WidgetManager"

interface SpinnerOptions {
  value?: number
  step?: number
  altStep?: number
  min?: number
  max?: number
  hardMin?: number
  hardMax?: number
  getValue: () => number
  onChange: (value: number) => void
}

interface Spinner {
  btnMinus: HTMLButtonElement
  btnPlus: HTMLButtonElement
  input: HTMLInputElement
  options: SpinnerOptions
  currentValue: number
  update: (trigger: boolean) => void
}

interface ToggleOptions {
  getValue: () => number
  onChange: (value: string | HTMLElement, index: number) => void
  value?: number
  values: (string | HTMLElement)[]
}

interface Toggle {
  currentValue: number
  options: ToggleOptions
  update: (trigger: boolean) => void
}

interface CheckboxOptions {
  getValue: () => boolean
  onChange: (value: boolean) => void
  value: boolean
  onEl: HTMLElement
  offEl: HTMLElement
}

interface Checkbox {
  currentValue: boolean
  options: CheckboxOptions
  update: (trigger: boolean) => void
}

export class PlaybackOptionsWidget extends Widget {
  private registeredSpinners: Spinner[] = []
  private registeredToggles: Toggle[] = []
  private registeredCheckboxes: Checkbox[] = []

  private changeRow: HTMLDivElement
  private warpRow: HTMLDivElement
  private fakeRow: HTMLDivElement
  private view: HTMLDivElement
  private collapseButton: HTMLButtonElement

  private lastSpeedMod = Options.chart.CMod

  private rateSpinner: Spinner

  private enteredMain = false

  constructor(manager: WidgetManager) {
    super(manager)
    this.visible = false

    const view = document.createElement("div")
    view.id = "playback-options"
    if (!Options.general.showPlaybackOptions) {
      view.classList.add("collapsed")
    }

    view.style.height = "0px"

    EventHandler.on("resize", () => {
      this.registeredToggles.forEach(toggle => {
        toggle.update(false)
      })
    })

    document.getElementById("menubar")?.insertAdjacentElement("afterend", view)

    this.view = view

    // Add toggle button
    const collapseButton = document.createElement("button")
    collapseButton.classList.add("po-collapse")
    collapseButton.tabIndex = -1

    const collapseIcon = Icons.getIcon("CHEVRON", 18)
    collapseButton.appendChild(collapseIcon)

    if (Options.general.showPlaybackOptions) {
      collapseButton.classList.add("toggled")
    }

    this.collapseButton = collapseButton

    collapseButton.onclick = () => {
      Options.general.showPlaybackOptions = !Options.general.showPlaybackOptions
      view.classList.toggle("collapsed")
      collapseButton.classList.toggle(
        "toggled",
        !view.classList.contains("collapsed")
      )
      collapseButton.blur()
    }

    collapseButton.style.display = "none"

    tippy(collapseButton, {
      onShow(instance) {
        instance.setContent(
          (view.classList.contains("collapsed") ? "Show " : "Hide ") +
            "playback options"
        )
      },
    })
    const zoomRow = this.createRow("Zoom")
    const zoomSpinner = this.createSpinner({
      value: Options.chart.zoom * 100,
      step: 10,
      altStep: 2,
      min: 10,
      hardMin: 0,
      onChange: value => (Options.chart.zoom = value / 100),
      getValue: () => Options.chart.zoom * 100,
    })
    zoomRow.appendChild(zoomSpinner)
    view.appendChild(zoomRow)

    const template = document.createElement("div")
    const template2 = document.createElement("h1")
    template2.innerText = "a"
    template.appendChild(template2)

    Keybinds.createKeybindTooltip(
      zoomRow
    )`Adjust playfield size ${"zoomOut"}/${"zoomIn"}`

    view.appendChild(this.createSeparator())

    const rateRow = this.createRow("Playback")
    const rateSpinner = this.createSpinner({
      value: Options.audio.rate * 100,
      step: 10,
      altStep: 2,
      min: 10,
      hardMin: 0,
      onChange: value => (Options.audio.rate = value / 100),
      getValue: () => Options.audio.rate * 100,
    })
    rateRow.appendChild(rateSpinner)
    view.appendChild(rateRow)
    this.rateSpinner = this.registeredSpinners.at(-1)!

    Keybinds.createKeybindTooltip(
      rateRow
    )`Adjust audio playback rate  ${"rateDown"}/${"rateUp"}`

    const assistContainer = document.createElement("div")
    assistContainer.style.gap = "0.25rem"
    assistContainer.style.display = "flex"
    assistContainer.style.alignItems = "center"
    const assistCheckbox = this.createCheckbox({
      getValue: () => Options.audio.assistTick,
      value: Options.audio.assistTick,
      onEl: Icons.getIcon("CLAP", 18),
      offEl: Icons.getIcon("X_CLAP", 18),
      onChange: value => (Options.audio.assistTick = value),
    })
    assistContainer.appendChild(assistCheckbox)

    Keybinds.createKeybindTooltip(
      assistCheckbox
    )`Toggle assist tick ${"assistTick"}`

    const metronomeCheckbox = this.createCheckbox({
      getValue: () => Options.audio.metronome,
      value: Options.audio.metronome,
      onEl: Icons.getIcon("METRONOME", 18),
      offEl: Icons.getIcon("X_METRONOME", 18),
      onChange: value => (Options.audio.metronome = value),
    })
    assistContainer.appendChild(metronomeCheckbox)
    view.appendChild(assistContainer)

    Keybinds.createKeybindTooltip(
      metronomeCheckbox
    )`Toggle metronome ${"metronome"}`

    view.appendChild(this.createSeparator())

    const scrollRow = this.createRow("Scroll")

    const upIcon = Icons.getIcon("DBL_CHEVRON", 16)
    upIcon.style.padding = "0.125rem"

    const downIcon = Icons.getIcon("DBL_CHEVRON", 16)
    downIcon.style.padding = "0.125rem"
    downIcon.style.transform = "rotate(180deg)"
    const directionToggle = this.createToggle({
      values: [upIcon, downIcon],
      value: Options.chart.reverse ? 1 : 0,
      getValue: () => (Options.chart.reverse ? 1 : 0),
      onChange: (_, idx) => (Options.chart.reverse = idx == 0 ? false : true),
    })
    scrollRow.appendChild(directionToggle)
    view.appendChild(scrollRow)

    Keybinds.createKeybindTooltip(
      scrollRow
    )`Change scroll direction ${"reverse"}`

    const speedRow = this.createRow("Speedmod")
    const speedToggle = this.createToggle({
      values: ["X", "C"],
      value: Options.chart.CMod ? 1 : 0,
      getValue: () => (Options.chart.CMod ? 1 : 0),
      onChange: value => (Options.chart.CMod = value == "X" ? false : true),
    })

    Keybinds.createKeybindTooltip(
      speedToggle
    )`Change speedmod type ${"XMod"}/${"CMod"}`

    const speedSpinner = this.createSpinner({
      value: Options.chart.speed,
      step: 25,
      altStep: 5,
      min: 10,
      hardMin: 10,
      hardMax: 35000,
      onChange: value => (Options.chart.speed = value),
      getValue: () => Options.chart.speed,
    })
    speedRow.appendChild(speedToggle)
    speedRow.appendChild(speedSpinner)
    view.appendChild(speedRow)

    Keybinds.createKeybindTooltip(
      speedSpinner
    )`Adjust scroll speed ${"increaseScrollSpeed"}/${"decreaseScrollSpeed"}`

    view.appendChild(this.createSeparator())

    const changeRow = this.createRow("Speed Changes")
    const changeToggle = this.createToggle({
      values: ["On", "Off"],
      value: Options.chart.doSpeedChanges ? 0 : 1,
      getValue: () => (Options.chart.doSpeedChanges ? 0 : 1),
      onChange: value =>
        (Options.chart.doSpeedChanges = value == "On" ? true : false),
    })
    changeRow.appendChild(changeToggle)
    view.appendChild(changeRow)

    Keybinds.createKeybindTooltip(
      changeRow
    )`Allow scroll/speed events (XMod only) ${"doSpeedChanges"}`

    this.changeRow = changeRow

    const warpRow = this.createRow("Warped Notes")
    const warpCheckbox = this.createCheckbox({
      getValue: () => Options.chart.hideWarpedArrows,
      value: Options.chart.hideWarpedArrows,
      onEl: Icons.getIcon("X_EYE", 18),
      offEl: Icons.getIcon("EYE", 18),
      onChange: value => (Options.chart.hideWarpedArrows = value),
    })
    warpRow.appendChild(warpCheckbox)
    view.appendChild(warpRow)

    Keybinds.createKeybindTooltip(
      warpRow
    )`Show/hide warped notes (CMod only) ${"hideWarpedArrows"}`

    this.warpRow = warpRow

    const fakeRow = this.createRow("Faked Notes")
    const fakeCheckbox = this.createCheckbox({
      getValue: () => Options.chart.hideFakedArrows,
      value: Options.chart.hideFakedArrows,
      onEl: Icons.getIcon("X_EYE", 18),
      offEl: Icons.getIcon("EYE", 18),
      onChange: value => (Options.chart.hideFakedArrows = value),
    })
    fakeRow.appendChild(fakeCheckbox)
    view.appendChild(fakeRow)

    Keybinds.createKeybindTooltip(
      fakeRow
    )`Show/hide faked notes (CMod only) ${"hideFakedArrows"}`

    this.fakeRow = fakeRow

    const audioIcon = Icons.getIcon("VOLUME", 22)
    audioIcon.style.marginLeft = "auto"
    audioIcon.style.marginRight = "-1rem"
    audioIcon.style.height = "1.375rem"
    audioIcon.style.width = "1.375rem"
    audioIcon.style.alignSelf = "center"
    view.appendChild(audioIcon)

    const masterRow = this.createRow("Master")
    const masterSpinner = this.createSpinner({
      value: Options.audio.masterVolume * 100,
      step: 5,
      altStep: 1,
      min: 0,
      max: 200,
      hardMin: 0,
      hardMax: 200,
      onChange: value => (Options.audio.masterVolume = value / 100),
      getValue: () => Options.audio.masterVolume * 100,
    })

    masterRow.appendChild(masterSpinner)
    view.appendChild(masterRow)

    const songRow = this.createRow("Song")
    const songSpinner = this.createSpinner({
      value: Options.audio.songVolume * 100,
      step: 5,
      altStep: 1,
      min: 0,
      max: 200,
      hardMin: 0,
      hardMax: 200,
      onChange: value => (Options.audio.songVolume = value / 100),
      getValue: () => Options.audio.songVolume * 100,
    })

    songRow.appendChild(songSpinner)
    view.appendChild(songRow)

    const fxRow = this.createRow("FX")
    const fxSpinner = this.createSpinner({
      value: Options.audio.soundEffectVolume * 100,
      step: 5,
      altStep: 1,
      min: 0,
      max: 200,
      hardMin: 0,
      hardMax: 200,
      onChange: value => (Options.audio.soundEffectVolume = value / 100),
      getValue: () => Options.audio.soundEffectVolume * 100,
    })

    fxRow.appendChild(fxSpinner)
    view.appendChild(fxRow)

    this.changeRow.style.setProperty(
      "--w",
      this.changeRow.offsetWidth / 16 + "rem"
    )
    this.warpRow.style.setProperty("--w", this.warpRow.offsetWidth / 16 + "rem")
    this.fakeRow.style.setProperty("--w", this.fakeRow.offsetWidth / 16 + "rem")

    this.changeRow.classList.toggle("hidden", Options.chart.CMod)
    this.warpRow.classList.toggle("hidden", !Options.chart.CMod)
    this.fakeRow.classList.toggle("hidden", !Options.chart.CMod)

    if (!Flags.playbackOptions) {
      view.style.display = "none"
      collapseButton.style.display = "none"
    }
  }

  createRow(name: string) {
    const row = document.createElement("div")
    row.classList.add("playback-options-row")

    const label = document.createElement("div")
    label.classList.add("playback-options-label")
    label.innerText = name

    row.appendChild(label)
    return row
  }

  createSeparator() {
    const div = document.createElement("div")
    div.classList.add("po-separator")
    return div
  }

  createSpinner(options: SpinnerOptions) {
    const container = document.createElement("div")
    container.classList.add("po-spinner")

    const getStep = (ev: WheelEvent | MouseEvent) => {
      let step = Options.general.spinnerStep
      if (ev.getModifierState("Shift")) {
        step =
          options.altStep ??
          (options.step !== undefined
            ? options.step / 10
            : Options.general.spinnerStep)
      } else {
        step = options.step ?? Options.general.spinnerStep
      }
      return step
    }

    const btnMinus = document.createElement("button")
    btnMinus.classList.add("po-spinner-btn")
    btnMinus.innerText = "-"

    btnMinus.onclick = ev => {
      spinner.currentValue -= getStep(ev)
      if (options.min !== undefined && spinner.currentValue < options.min)
        spinner.currentValue = options.min
      update(true)
    }

    const btnPlus = document.createElement("button")
    btnPlus.classList.add("po-spinner-btn")
    btnPlus.innerText = "+"

    btnPlus.onclick = ev => {
      spinner.currentValue += getStep(ev)
      if (options.max !== undefined && spinner.currentValue > options.max)
        spinner.currentValue = options.max
      update(true)
    }

    const input = document.createElement("input")
    input.classList.add("po-spinner-input")
    input.type = "text"

    const update = (trigger = true) => {
      if (
        options.hardMin !== undefined &&
        spinner.currentValue < options.hardMin
      )
        spinner.currentValue = options.hardMin
      if (
        options.hardMax !== undefined &&
        spinner.currentValue > options.hardMax
      )
        spinner.currentValue = options.hardMax
      if (trigger) options.onChange(spinner.currentValue)
      input.value = spinner.currentValue.toFixed()
    }

    input.addEventListener("wheel", ev => {
      ev.preventDefault()
      spinner.currentValue +=
        ((getStep(ev) * ev.deltaY) / 100) *
        (Options.chart.scroll.invertZoomScroll ? -1 : 1) *
        Options.chart.scroll.scrollSensitivity
      if (options.max !== undefined && spinner.currentValue > options.max)
        spinner.currentValue = options.max
      if (options.min !== undefined && spinner.currentValue < options.min)
        spinner.currentValue = options.min
      update(true)
    })

    const spinner = {
      btnMinus,
      btnPlus,
      input,
      options,
      currentValue: options.value ?? 0,
      update,
    }

    update()

    container.replaceChildren(btnMinus, input, btnPlus)

    input.spellcheck = false
    input.onkeydown = ev => {
      if (ev.key == "Enter") input.blur()
      if (ev.key == "Escape") {
        spinner.currentValue = options.getValue()
        update(false)
      }
    }
    input.onfocus = () => {
      input.select()
    }
    input.onblur = () => {
      const val = this.parseString(input)
      if (val == null) {
        spinner.currentValue = options.getValue()
        update(false)
        return
      }
      spinner.currentValue = val
      update()
    }
    input.ondragstart = ev => ev.preventDefault()

    this.registeredSpinners.push(spinner)

    return container
  }

  createToggle(options: ToggleOptions) {
    const container = document.createElement("div")
    container.classList.add("po-toggle")

    if (options.values.length == 0) {
      return container
    }

    const highlight = document.createElement("div")
    highlight.classList.add("po-toggle-highlight")

    const valueDivs = options.values.map((item, idx) => {
      if (typeof item == "string") {
        const div = document.createElement("div")
        div.classList.add("po-toggle-item")
        div.innerText = item
        container.appendChild(div)

        div.onclick = () => {
          if (toggle.currentValue == idx) return
          toggle.currentValue = idx
          update()
        }

        return div
      } else {
        item.onclick = () => {
          if (toggle.currentValue == idx) return
          toggle.currentValue = idx
          update()
        }
        container.appendChild(item)
        return item
      }
    })

    // get the sizes of the current objects
    container.style.visibility = "hidden"
    document.body.appendChild(container)

    const moveHighlight = (index: number) => {
      highlight.style.left =
        valueDivs[index].getBoundingClientRect().left -
        valueDivs[0].getBoundingClientRect().left +
        "px"
      highlight.style.width =
        valueDivs[index].getBoundingClientRect().width + "px"
      highlight.style.height =
        valueDivs[index].getBoundingClientRect().height + "px"
    }

    const update = (trigger = true) => {
      if (trigger)
        options.onChange(
          options.values[toggle.currentValue],
          toggle.currentValue
        )
      ;[...container.querySelectorAll(".active")].forEach(el =>
        el.classList.remove("active")
      )
      moveHighlight(toggle.currentValue)
      valueDivs[toggle.currentValue].classList.add("active")
    }

    const toggle = {
      currentValue: options.value ?? 0,
      options,
      update,
    }

    this.registeredToggles.push(toggle)

    update(false)

    container.remove()
    container.style.visibility = ""

    container.appendChild(highlight)

    return container
  }

  createCheckbox(options: CheckboxOptions) {
    const item = document.createElement("div")
    item.classList.add("ico-checkbox")

    const update = (trigger = true) => {
      if (trigger) options.onChange(checkbox.currentValue)
      checkbox.options.onEl.style.display = checkbox.currentValue ? "" : "none"
      checkbox.options.offEl.style.display = checkbox.currentValue ? "none" : ""
    }

    const checkbox = {
      currentValue: options.value ?? true,
      options,
      update,
    }

    item.onclick = () => {
      checkbox.currentValue = !checkbox.currentValue
      update()
    }

    this.registeredCheckboxes.push(checkbox)

    update(false)

    item.replaceChildren(checkbox.options.onEl, checkbox.options.offEl)

    return item
  }

  update() {
    if (
      !this.enteredMain &&
      this.manager.chartManager.loadedChart !== undefined &&
      Flags.menuBar
    ) {
      this.enteredMain = true
      this.view.style.height = ""
      this.collapseButton.style.display = ""
      document.getElementById("menubar")?.appendChild(this.collapseButton)
    }

    for (const spinner of this.registeredSpinners) {
      if (spinner.currentValue != spinner.options.getValue()) {
        if (document.activeElement != spinner.input) {
          spinner.currentValue = spinner.options.getValue()
          spinner.update(false)
        }
      }
    }

    for (const toggle of this.registeredToggles) {
      if (toggle.currentValue != toggle.options.getValue()) {
        toggle.currentValue = toggle.options.getValue()
        toggle.update(false)
      }
    }

    for (const box of this.registeredCheckboxes) {
      if (box.currentValue != box.options.getValue()) {
        box.currentValue = box.options.getValue()
        box.update(false)
      }
    }

    const disablePlaybackRate =
      this.manager.chartManager.getMode() == EditMode.Play ||
      this.manager.chartManager.getMode() == EditMode.Record

    this.rateSpinner.btnMinus.disabled = disablePlaybackRate
    this.rateSpinner.btnPlus.disabled = disablePlaybackRate
    this.rateSpinner.input.disabled = disablePlaybackRate

    if (Options.chart.CMod != this.lastSpeedMod) {
      this.lastSpeedMod = Options.chart.CMod
      this.changeRow.classList.toggle("hidden", Options.chart.CMod)
      this.warpRow.classList.toggle("hidden", !Options.chart.CMod)
      this.fakeRow.classList.toggle("hidden", !Options.chart.CMod)
    }
  }

  private parseString(el: HTMLInputElement) {
    try {
      const val = Parser.evaluate(el.value)
      if (!isFinite(val)) return 0
      return val
    } catch {
      return null
    }
  }
}
