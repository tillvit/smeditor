import { ActionHistory } from "../../util/ActionHistory"
import { EventHandler } from "../../util/EventHandler"
import { maxArr } from "../../util/Math"
import {
  bsearch,
  bsearchEarliest,
  getDivision,
  getNoteEnd,
  getRangeInSortedArray,
  isSameRow,
  toRowIndex,
} from "../../util/Util"
import { GameType, GameTypeRegistry } from "../gameTypes/GameTypeRegistry"
import { ChartStats } from "../stats/ChartStats"
import {
  FootOverride,
  TECH_ERROR_STRING_REVERSE,
  TechErrors,
} from "../stats/parity/ParityDataTypes"
import { ChartTimingData } from "./ChartTimingData"
import { CHART_DIFFICULTIES, ChartDifficulty } from "./ChartTypes"
import {
  isHoldNote,
  Notedata,
  NotedataEntry,
  PartialNotedata,
  PartialNotedataEntry,
  RowData,
} from "./NoteTypes"
import { Simfile } from "./Simfile"
import { getParityData, loadChartParityData } from "./SMEParser"
import { TIMING_EVENT_NAMES, TimingEventType, TimingType } from "./TimingTypes"

export class Chart {
  /** @internal */
  _id?: string
  readonly sm: Simfile

  readonly stats: ChartStats
  private notedata: Notedata = []
  private notedataRows: RowData[] = []

  gameType: GameType = GameTypeRegistry.getPriority()[0]
  timingData: ChartTimingData

  description = ""
  difficulty: ChartDifficulty = "Beginner"
  meter = 1
  meterF = 1
  radarValues = "0,0,0,0,0"
  chartName = ""
  chartStyle = ""
  credit = ""
  music?: string

  other_properties: { [key: string]: string } = {}

  // stripped for custom scripts
  /** @internal */
  ignoredErrors = new Map<number, Set<TechErrors>>()

  private _lastBeat = 0
  private _lastSecond = 0

  // range of notes modified before last event listener
  private _startModify: number | null = null
  private _endModify: number | null = null

  /**
   * Creates a new Chart.
   * @param {Simfile} sm The Simfile this chart belongs to
   * @param {(string | { [key: string]: string })} [data] The data to load the chart from (used internally)
   * @memberof Chart
   */
  constructor(sm: Simfile, data?: string | { [key: string]: string }) {
    this.timingData = sm.timingData.createChartTimingData(this)
    this.timingData.reloadCache()
    this.sm = sm
    if (!data) {
      this.stats = new ChartStats(this)
      this.recalculateStats()
      return
    }
    if (sm._type == "ssc") {
      const dict = data as { [key: string]: string }
      for (const property in dict) {
        if (
          property == "OFFSET" ||
          TIMING_EVENT_NAMES.includes(property as TimingEventType)
        ) {
          this.timingData.parse(property as TimingType, dict[property])
          delete dict[property]
        }
      }
      this.timingData.reloadCache()
      const gameType = GameTypeRegistry.getGameType(dict["STEPSTYPE"])
      if (!gameType) throw Error("Unknown step type " + dict["STEPSTYPE"])
      this.gameType = gameType
      this.description = dict["DESCRIPTION"] ?? ""
      if (CHART_DIFFICULTIES.includes(dict["DIFFICULTY"] as ChartDifficulty))
        this.difficulty = dict["DIFFICULTY"] as ChartDifficulty
      else throw Error("Unknown chart difficulty " + dict["DIFFICULTY"])
      this.meter = parseInt(dict["METER"])
      if (!isFinite(this.meter) || this.meter < 0) this.meter = 0
      this.meterF = parseFloat(dict["METERF"])
      if (!isFinite(this.meterF) || this.meterF < 0) this.meterF = this.meter
      this.radarValues = dict["RADARVALUES"] ?? ""
      this.notedata =
        gameType.parser
          .fromString(dict["NOTES"], gameType)
          .map(note => this.computeNote(note)) ?? []
      this.credit = dict["CREDIT"] ?? ""
      this.chartName = dict["CHARTNAME"] ?? ""
      this.chartStyle = dict["CHARTSTYLE"] ?? ""
      this.music = dict["MUSIC"]
      if (dict["PARITY"]) {
        try {
          const parityData = JSON.parse(dict["PARITY"])
          loadChartParityData(parityData, this)
        } catch (e) {
          console.warn("Failed to parse parity data: " + e)
        }
      }
      for (const key in dict) {
        if (
          [
            "STEPSTYPE",
            "DESCRIPTION",
            "DIFFICULTY",
            "METER",
            "METERF",
            "RADARVALUES",
            "CREDIT",
            "CHARTNAME",
            "CHARTSTYLE",
            "MUSIC",
            "NOTES",
            "NOTEDATA",
            "PARITY",
          ].includes(key)
        )
          continue
        this.other_properties[key] = dict[key]
      }
    } else {
      const match =
        /([\w-]+):[\s ]*([^:]*):[\s ]*(\w+):[\s ]*(\d+):[\s ]*([\d.,]*):[\s ]*([\w\s, ]*)/g.exec(
          (<string>data).trim()
        )
      if (match != null) {
        const gameType = GameTypeRegistry.getGameType(match[1])
        if (!gameType) throw Error("Unknown step type " + match[1])
        this.gameType = gameType
        this.description = match[2] ?? ""
        if (CHART_DIFFICULTIES.includes(match[3] as ChartDifficulty))
          this.difficulty = match[3] as ChartDifficulty
        else throw Error("Unknown chart difficulty " + match[3])
        this.meter = parseInt(match[4])
        if (!isFinite(this.meter) || this.meter < 0) this.meter = 0
        this.meterF = this.meter
        this.radarValues = match[5] ?? ""
        this.notedata =
          gameType.parser
            .fromString(match[6], gameType)
            .map(note => this.computeNote(note)) ?? []
      } else {
        throw Error("Failed to load sm chart!")
      }
    }
    this.stats = new ChartStats(this)
    this.recalculateRows()
    this.recalculateStats()
  }

  /**
   * Gets the last beat of this chart. If the last beat is a hold, it includes the hold length.
   *
   * @return {number} The last beat of the chart.
   * @memberof Chart
   */
  getLastBeat() {
    return this._lastBeat
  }

  /**
   * Gets the last second of this chart. If the last beat is a hold, it includes the hold length.
   *
   * @return {number} The last second of the chart.
   * @memberof Chart
   */
  getLastSecond() {
    return this._lastSecond
  }

  /**
   * Gets the second from a given beat.
   * Convenience method for this.timingData.getSecondsFromBeat
   *
   * @param {number} beat
   * @param {("noclamp" | "before" | "after" | "")} [option]
   * @return {*}  {number}
   * @memberof Chart
   */
  getSecondsFromBeat(
    beat: number,
    option?: "noclamp" | "before" | "after" | ""
  ): number {
    return this.timingData.getSecondsFromBeat(beat, option)
  }

  /**
   * Gets the beat from a given second.
   * Convenience method for this.timingData.getBeatFromSeconds
   *
   * @param {number} seconds
   * @return {*}  {number}
   * @memberof Chart
   */
  getBeatFromSeconds(seconds: number): number {
    return this.timingData.getBeatFromSeconds(seconds)
  }

  /**
   * Gets the beat from a given effective beat.
   * Convenience method for this.timingData.getBeatFromEffectiveBeat
   *
   * @param {number} effBeat
   * @return {*}  {number}
   * @memberof Chart
   */
  getBeatFromEffectiveBeat(effBeat: number): number {
    return this.timingData.getBeatFromEffectiveBeat(effBeat)
  }

  /**
   * Returns true if a beat is warped over (via WARPS, negative STOPS, etc.).
   * @param {number} beat
   * @return {*}  {boolean}
   * @memberof Chart
   */
  isBeatWarped(beat: number): boolean {
    return this.timingData.isBeatWarped(beat)
  }

  /**
   * Returns true if a beat is marked as fake.
   * @param {number} beat
   * @return {*}  {boolean}
   * @memberof Chart
   */
  isBeatFaked(beat: number): boolean {
    return this.timingData.isBeatFaked(beat)
  }

  private recalculateLastNote() {
    let lastBeat = 0
    let lastSecond = 0
    this.notedata.forEach(note => {
      const endBeat = note.beat + (isHoldNote(note) ? note.hold : 0)
      const endSecond = this.timingData.getSecondsFromBeat(endBeat)
      if (endBeat > lastBeat) {
        lastBeat = endBeat
      }
      if (endSecond > lastSecond) {
        lastSecond = endSecond
      }
    })
    this._lastBeat = lastBeat
    this._lastSecond = lastSecond
  }

  private getNoteIndex(note: PartialNotedataEntry): number {
    if (this.notedata.includes(note as NotedataEntry)) {
      return this.notedata.indexOf(note as NotedataEntry)
    }
    for (let i = 0; i < this.notedata.length; i++) {
      const n = this.notedata[i]
      if (n.beat == note.beat && n.col == note.col && n.type == note.type) {
        return i
      }
    }
    return -1
  }

  private insertNote(note: PartialNotedataEntry) {
    note.beat = Math.round(note.beat * 48) / 48
    if (isHoldNote(note)) note.hold = Math.round(note.hold * 48) / 48
    const computedNote = this.computeNote(note)
    let index = bsearch(this.notedata, note.beat, a => a.beat) + 1
    if (index >= 1 && this.notedata[index - 1].beat > note.beat) index--
    this.notedata.splice(index, 0, computedNote)
    return computedNote
  }

  private addEditRange(from: number, to: number) {
    if (this._startModify == null) this._startModify = from
    else this._startModify = Math.min(this._startModify, from)
    if (this._endModify == null) this._endModify = to
    else this._endModify = Math.max(this._endModify, to)
  }

  private callEventListeners() {
    this.recalculateRows(this._startModify, this._endModify)
    this.recalculateStats(this._startModify, this._endModify)
    EventHandler.emit("chartModified")
  }

  private markRecalculateAll() {
    this._startModify = null
    this._endModify = null
  }

  /**
   * Adds a note to the notedata.
   * @param {PartialNotedataEntry} note
   * @param {boolean} [callListeners=true] Whether to call event listeners after adding the note
   * @return {NotedataEntry} The computed note that was added
   * @memberof Chart
   */
  addNote(note: PartialNotedataEntry, callListeners = true): NotedataEntry {
    const computedNote = this.insertNote(note)
    this.addEditRange(note.beat, getNoteEnd(note))
    if (callListeners) this.callEventListeners()
    return computedNote
  }

  /**
   * Adds notes to the notedata.
   * @param {PartialNotedataEntry[]} notes
   * @param {boolean} [callListeners=true] Whether to call event listeners after adding the notes
   * @return {NotedataEntry[]} The computed notes that were added
   * @memberof Chart
   */
  addNotes(
    notes: PartialNotedataEntry[],
    callListeners = true
  ): NotedataEntry[] {
    if (notes.length == 0) {
      if (callListeners) this.callEventListeners()
      return []
    }

    const computedNotes = notes.map(note => this.insertNote(note))
    this.addEditRange(
      computedNotes[0].beat,
      maxArr(computedNotes.map(note => getNoteEnd(note)))
    )
    if (callListeners) this.callEventListeners()
    return computedNotes
  }

  /**
   * Computes a note's eextra properties (second, quant, fake, warped).
   * @param {PartialNotedataEntry} note
   * @return {NotedataEntry} The computed note
   * @memberof Chart
   */
  computeNote(note: PartialNotedataEntry): NotedataEntry {
    if (note.extra) {
      if (!note.extra.computed) note.extra.computed = { fake: false }
      switch (note.extra.attributes.type) {
        case "stepp1":
          note.extra.computed.fake = note.extra.attributes.fake
          break
        case "xsanity": {
          note.extra.computed.fake =
            note.extra.attributes.attribute == "P" ||
            note.extra.attributes.attribute == "8"
          break
        }
        case "outfox": {
          note.extra.computed.fake = note.extra.attributes.source == "fake"
          break
        }
      }
    }

    return Object.assign(note, {
      warped: this.timingData.isBeatWarped(note.beat),
      fake:
        note.type == "Fake" ||
        note.extra?.computed?.fake ||
        this.timingData.isBeatFaked(note.beat),
      second: this.timingData.getSecondsFromBeat(note.beat),
      quant: Math.round(
        getDivision(this.timingData.getBeatOfMeasure(note.beat))
      ),
    })
  }

  /**
   * Modifies a note in the notedata.
   * @param {PartialNotedataEntry} note
   * @return {NotedataEntry} The modified note
   * @memberof Chart
   */
  modifyNote(
    note: PartialNotedataEntry,
    properties: Partial<NotedataEntry>,
    callListeners = true
  ) {
    const originalNote = structuredClone(note)
    const i = this.getNoteIndex(note)
    if (i == -1) return
    const newNote = Object.assign({}, this.notedata[i])
    this.notedata.splice(i, 1)
    if (!isHoldNote(properties as PartialNotedataEntry))
      (properties as Record<string, any>).hold = undefined
    Object.assign(newNote, properties)
    this.addNote(newNote, false)
    this.addEditRange(
      Math.min(originalNote.beat, newNote.beat),
      Math.max(getNoteEnd(originalNote), getNoteEnd(newNote))
    )
    if (callListeners) this.callEventListeners()
  }

  /**
   * Removes a note from the notedata.
   * @param {PartialNotedataEntry} note
   * @param {boolean} [callListeners=true] Whether to call event listeners after removing the note
   * @return {NotedataEntry | undefined} The removed note, if it existed
   * @memberof Chart
   */
  removeNote(
    note: PartialNotedataEntry,
    callListeners = true
  ): NotedataEntry | undefined {
    const i = this.getNoteIndex(note)
    if (i == -1) return
    const removedNote = this.notedata.splice(i, 1)
    this.addEditRange(note.beat, getNoteEnd(note))
    if (callListeners) this.callEventListeners()
    return removedNote[0]
  }

  /**
   * Removes notes from the notedata.
   * @param {PartialNotedataEntry[]} notes
   * @param {boolean} [callListeners=true] Whether to call event listeners after removing the notes
   * @return {NotedataEntry[]} The removed notes
   * @memberof Chart
   */
  removeNotes(
    notes: PartialNotedataEntry[],
    callListeners = true
  ): NotedataEntry[] {
    if (notes.length == 0) return []
    const computedNotes = notes
      .map(note => {
        const i = this.getNoteIndex(note)
        if (i == -1) return
        const removedNote = this.notedata.splice(i, 1)
        return removedNote[0]
      })
      .filter(note => note != undefined)
    this.addEditRange(
      computedNotes[0].beat,
      maxArr(computedNotes.map(note => getNoteEnd(note)))
    )
    if (callListeners) this.callEventListeners()
    return computedNotes
  }

  /**
   * Sets the notedata for the chart.
   * @param {PartialNotedata} notedata
   * @memberof Chart
   */
  setNotedata(notedata: PartialNotedata) {
    this.notedata = notedata.map(note => this.computeNote(note))
    // Recalculate everything
    this.markRecalculateAll()
    this.callEventListeners()
  }

  /**
   * Gets the notedata for the chart.
   * @returns {Notedata} The notedata of the chart.
   * @memberof Chart
   */
  getNotedata(): Notedata {
    return this.notedata
  }

  /**
   * Gets all rows in the chart.
   *
   * @return {RowData[]} The rows of the chart.
   * @memberof Chart
   */
  getRows(): RowData[] {
    return this.notedataRows
  }

  /**
   * Returns all notes within the given range (inclusive)
   *
   * @param {number} startBeat
   * @param {number} endBeat
   * @return {*}  {Notedata}
   * @memberof Chart
   */
  getNotedataInRange(startBeat: number, endBeat: number): Notedata {
    if (this.notedata.length == 0) return []
    const [startIdx, endIdx] = getRangeInSortedArray(
      this.notedata,
      Math.round(startBeat * 48),
      Math.round(endBeat * 48),
      a => Math.round(a.beat * 48)
    )
    return this.notedata.slice(startIdx, endIdx)
  }

  /**
   * Returns all rows within the given range (inclusive)
   *
   * @param {number} startBeat
   * @param {number} endBeat
   * @return {*}  {RowData[]}
   * @memberof Chart
   */
  getRowsInRange(startBeat: number, endBeat: number): RowData[] {
    return this.notedataRows.filter(
      row => row.beat >= startBeat && row.beat <= endBeat
    )
  }

  /**
   * Recomputes all notes in the chart.
   * @memberof Chart
   */
  recalculateNotes() {
    this.notedata = this.notedata.map(note => this.computeNote(note))
  }

  /**
   * Recalculates the rows in the chart.
   * @param startBeat The start beat of the range to recalculate.
   * @param endBeat The end beat of the range to recalculate.
   * @memberof Chart
   */
  recalculateRows(
    startBeat: number | null = null,
    endBeat: number | null = null
  ) {
    if (startBeat === null || endBeat === null) {
      // Recalculate all rows
      const rows: RowData[] = []
      for (const note of this.notedata) {
        let previousRow = rows.at(-1)
        if (!previousRow || !isSameRow(previousRow.beat, note.beat)) {
          previousRow = {
            beat: note.beat,
            second: note.second,
            notes: [],
            faked: this.timingData.isBeatFaked(note.beat),
            warped: this.timingData.isBeatWarped(note.beat),
          }
          rows.push(previousRow)
        }
        previousRow.notes.push(note)
      }
      this.notedataRows = rows
    } else {
      // create new rows
      const newRows: RowData[] = []
      let notedataIdx = bsearch(this.notedata, startBeat, note => note.beat)
      while (
        this.notedata[notedataIdx] &&
        toRowIndex(this.notedata[notedataIdx].beat) < toRowIndex(startBeat)
      ) {
        notedataIdx++
      }

      while (this.notedata[notedataIdx]?.beat <= endBeat) {
        const note = this.notedata[notedataIdx]
        let previousRow = newRows.at(-1)
        if (!previousRow || !isSameRow(previousRow.beat, note.beat)) {
          previousRow = {
            beat: note.beat,
            second: note.second,
            notes: [],
            faked: this.timingData.isBeatFaked(note.beat),
            warped: this.timingData.isBeatWarped(note.beat),
          }
          newRows.push(previousRow)
        }
        previousRow.notes.push(note)
        notedataIdx++
      }

      // splice out the modified rows
      let rowIdx = bsearch(this.notedataRows, startBeat, row => row.beat)
      while (
        this.notedataRows[rowIdx] &&
        toRowIndex(this.notedataRows[rowIdx].beat) < toRowIndex(startBeat)
      ) {
        rowIdx++
      }
      let endRowIdx = rowIdx
      while (this.notedataRows[endRowIdx]?.beat <= endBeat) {
        endRowIdx++
      }
      // insert new rows
      this.notedataRows = this.notedataRows
        .slice(0, rowIdx)
        .concat(newRows, this.notedataRows.slice(endRowIdx))
    }
  }

  /** @internal */
  recalculateStats(start: number | null = null, end: number | null = null) {
    this.recalculateLastNote()
    if (start == null || end == null) {
      this.stats.reset()
      this.stats.calculate()
    } else {
      if (!this.stats.recalculate(start, end)) return
    }
    this._startModify = null
    this._endModify = null
  }

  /**
   * Gets the music path for this chart. If this chart does not have a music path, it returns the simfile's music path.
   *
   * @return {*}  {string}
   * @memberof Chart
   */
  getMusicPath(): string {
    return this.music ?? this.sm.properties.MUSIC ?? ""
  }

  toString(): string {
    return this.difficulty + " " + this.meter
  }

  /**
   * Serializes the chart to a string.
   *
   * @param {("sm" | "ssc" | "smebak")} type The type of serialization to perform.
   * @return {*}  {string} The serialized chart.
   * @memberof Chart
   */
  serialize(type: "sm" | "ssc" | "smebak"): string {
    let str =
      "//---------------" +
      this.gameType.id +
      " - " +
      this.description +
      "---------------\n"
    if (type == "sm") {
      str += "#NOTES:\n"
      str += `     ${this.gameType.id}:\n`
      str += `     ${this.description}:\n`
      str += `     ${this.difficulty}:\n`
      str += `     ${this.meter}:\n`
      str += `     ${this.radarValues}:\n`
    } else {
      str += "#NOTEDATA:;\n"
      str += `#CHARTNAME:${this.chartName};\n`
      str += `#CHARTSTYLE:${this.chartStyle};\n`
      str += `#CREDIT:${this.credit};\n`
      if (this.music) str += `#MUSIC:${this.music};\n`
      str += `#STEPSTYPE:${this.gameType.id};\n`
      str += `#DESCRIPTION:${this.description};\n`
      str += `#DIFFICULTY:${this.difficulty};\n`
      str += `#METER:${this.meter};\n`
      str += `#METERF:${this.meterF};\n`
      str += `#RADARVALUES:${this.radarValues};\n`
      if (type == "smebak") {
        str += `#PARITY:${JSON.stringify(getParityData(this))};\n`
      }
      for (const key in this.other_properties) {
        str += `#${key}:${this.other_properties[key]};\n`
      }
      if (this.timingData.usesChartTiming())
        str += this.timingData.serialize("ssc")
      str += `#NOTES:\n`
    }
    str += this.gameType.parser.serialize(this.notedata, this.gameType) + ";\n"
    return str
  }

  /** @internal */
  loadParity(string: string, callListeners = true) {
    const data = JSON.parse(string)
    const parts = string.split("=")

    const overrides = data["overrides"]
    if (overrides) {
      for (const part of overrides) {
        const parts = part.split("|")
        try {
          const beat = parseFloat(parts[0])
          const col = parseInt(parts[1])
          const override = parts[2]

          const validOverrides = ["Left", "Right", "1", "2", "3", "4"]
          if (!validOverrides.includes(override)) continue
          if (parts.length != 3) continue

          let noteIdx = bsearchEarliest(this.notedata, beat, n => n.beat)
          while (
            this.notedata[noteIdx] &&
            this.notedata[noteIdx].col != col &&
            isSameRow(this.notedata[noteIdx].beat, beat)
          ) {
            noteIdx++
          }
          if (!isSameRow(this.notedata[noteIdx].beat, beat)) {
            console.warn(
              `No note found at beat ${beat} and column ${col} for parity override ${override}`
            )
            continue
          }
          const note = this.notedata[noteIdx]
          if (!note.parity) note.parity = {}
          note.parity.override = override as FootOverride
        } catch (e) {
          console.warn(
            `Failed to parse parity override ${part} in ${this.chartName}: ${e}`
          )
        }
      }
    }

    const ignores = parts[1].split(",")
    for (const part of ignores) {
      const parts = part.split("|")
      try {
        const beat = parseFloat(parts[0])
        const errors = parts
          .slice(1)
          .map(e => TECH_ERROR_STRING_REVERSE[e])
          .filter(e => e !== undefined)

        if (parts.length < 2) continue
        if (!this.ignoredErrors.has(beat))
          this.ignoredErrors.set(beat, new Set())
        errors.forEach(error => this.ignoredErrors.get(beat)?.add(error))
      } catch (e) {
        console.warn(
          `Failed to parse parity ignore ${part} in ${this.chartName}: ${e}`
        )
      }
    }

    if (callListeners) this.recalculateStats()
  }

  /**
   * Returns whether or not this chart has SSC features.
   * @return {boolean}
   * @memberof Chart
   */
  requiresSSC(): boolean {
    return (
      this.chartName !== "" ||
      this.chartStyle !== "" ||
      this.credit !== "" ||
      this.music !== undefined ||
      this.timingData.requiresSSC()
    )
  }

  /**
   * Returns the number of columns in this chart.
   * @return {number}
   * @memberof Chart
   */
  getColumnCount(): number {
    return this.gameType.numCols
  }

  /** @internal */
  destroy() {
    this.stats.destroy()
    this.timingData.destroy()
  }

  /** @internal */
  addErrorIgnore(error: TechErrors, beat: number) {
    if (!this.ignoredErrors.has(beat)) this.ignoredErrors.set(beat, new Set())
    ActionHistory.instance.run({
      undo: () => {
        this.ignoredErrors.get(beat)?.delete(error)
        EventHandler.emit("parityIgnoresModified")
      },
      action: () => {
        this.ignoredErrors.get(beat)?.add(error)
        EventHandler.emit("parityIgnoresModified")
      },
    })
  }

  /** @internal */
  getErrorIgnoresAtBeat(beat: number): Set<TechErrors> | undefined {
    return this.ignoredErrors.get(beat)
  }

  /** @internal */
  isErrorIgnored(error: TechErrors, beat: number) {
    return this.ignoredErrors.get(beat)?.has(error) ?? false
  }

  /** @internal */
  deleteErrorIgnore(error: TechErrors, beat: number) {
    ActionHistory.instance.run({
      undo: () => {
        if (!this.ignoredErrors.has(beat))
          this.ignoredErrors.set(beat, new Set())
        this.ignoredErrors.get(beat)?.add(error)
        EventHandler.emit("parityIgnoresModified")
      },
      action: () => {
        this.ignoredErrors.get(beat)?.delete(error)
        EventHandler.emit("parityIgnoresModified")
      },
    })
  }

  /** @internal */
  getTechErrorsAtBeat(beat: number, includeIgnored = false): Set<TechErrors> {
    if (!this.stats.parity) return new Set()
    const rowIdx = bsearchEarliest(
      this.stats.parity.rowTimestamps,
      beat,
      r => r.beat
    )
    return this.getTechErrorsAtRow(rowIdx, includeIgnored)
  }

  /** @internal */
  getTechErrorsAtRow(rowIdx: number, includeIgnored = false): Set<TechErrors> {
    if (!this.stats.parity) return new Set()
    if (!this.stats.parity.rowTimestamps[rowIdx]) return new Set()
    const techErrors = this.stats.parity.techErrors.get(rowIdx)
    if (!techErrors) return new Set()
    const errors = new Set(techErrors)

    if (includeIgnored) return errors
    const ignored =
      this.ignoredErrors.get(this.stats.parity.rowTimestamps[rowIdx].beat) ??
      new Set()
    return errors.difference(ignored)
  }

  /** @internal */
  getTechErrors(includeIgnored = false): { beat: number; error: TechErrors }[] {
    if (!this.stats.parity) return []
    const techErrors = this.stats.parity.techErrors

    return techErrors
      .keys()
      .map(idx => {
        return this.getTechErrorsAtRow(idx, includeIgnored)
          .values()
          .map(error => {
            return {
              beat: this.stats.parity!.rowTimestamps[idx].beat,
              error: error,
            }
          })
          .toArray() as { beat: number; error: TechErrors }[]
      })
      .toArray()
      .flat()
      .sort((a, b) => a.beat - b.beat)
  }
}
