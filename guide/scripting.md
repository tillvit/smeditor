# Scripting

[[toc]]

---

With scripting, you can programmatically add notes and timing events instead of doing them manually.
Here's an example of what you can do with scripting:

<video controls="controls" src="./assets/scripting/scripting-demo.mp4"/>

## Examples

When scripting, you can paste your script into the javascript console. Here are some examples to get you started.

### Adding new notes

This script creates 16 new notes in a 1234 pattern.
```ts
const chart = app.chartManager.loadedChart
const newNotes = []

for (let i = 0; i < 16; i++) {
  newNotes.push({
    type: "Tap",
    beat: i,
    col: i % 4
  })
}

chart.addNotes(newNotes)
```

### Repeating a section

This script grabs the notes in the first 4 beats and copies them 4 beats later.

```ts
const chart = app.chartManager.loadedChart

const newNotes = chart.notedata
                  .filter(note => note.beat < 4) // only select notes that are in the first 4 beats
                  .map(note => {
                    return {
                      ...note,
                      beat: note.beat + 4 // shift each note by 4 beats
                    }
                  })

chart.addNotes(newNotes)
```

### Stutter gimmicks

Using **BPMS** and **STOPS**

Note that this method may cause desync issues since STOPS are limited to 1ms intervals.

```ts
function stutterStops(beat, length, factor = 2) {
  const chart = app.chartManager.loadedChart
  const td = chart.timingData

  // Grab the current bpm
  const bpm = td.getEventAtBeat("BPMS", beat).value
  const newBPM = bpm * factor

  // Grab all notes in the area
  const notes = chart.notedata.filter(note => note.beat >= beat && note.beat < beat + length)

  // Convert notes to rows (in case there are jumps)
  const rows = new Set(notes.map(note => note.beat))
  const uniqueBeats = [...rows.values()].sort((a, b) => a - b)

  const events = []

  events.push({ // add the new bpm
    type: "BPMS",
    value: newBPM,
    beat: beat
  })

  events.push({ // revert back to old bpm
    type: "BPMS",
    value: bpm,
    beat: notes.at(-1).beat
  })

  for (let i = 0; i < uniqueBeats.length - 1; i++) {
    const beatsToNextNote = uniqueBeats[i+1] - uniqueBeats[i]
    const timeToNextNote = beatsToNextNote * 60 / bpm
    const travelTime = beatsToNextNote * 60 / newBPM // find the amount of time elapsed when moving normally
    const stopLength = timeToNextNote - travelTime
    events.push({ // add the new stop
      type: "STOPS",
      value: stopLength,
      beat: uniqueBeats[i],
    })
  }
  td.insert(events)
}

```
<video controls="controls" src="./assets/scripting/stutter-stops.mp4"/>

Using **SCROLLS**

This does not introduce any timing issues.
Note that this method will only work in SM5 variants of the game.

```ts
function stutterScrolls(beat, length, factor = 2) {
  const chart = app.chartManager.loadedChart
  const td = chart.timingData

  // Grab all notes in the area
  const notes = chart.notedata.filter(note => note.beat >= beat && note.beat < beat + length)

  // Convert notes to rows (in case there are jumps)
  const rows = new Set(notes.map(note => note.beat))
  const uniqueBeats = [...rows.values()].sort((a, b) => a - b)

  const events = []

  for (let i = 0; i < uniqueBeats.length - 1; i++) {
    const beatsToNextNote = uniqueBeats[i+1] - uniqueBeats[i]
    events.push({ // stop
      type: "SCROLLS",
      value: 0,
      beat: uniqueBeats[i],
    })

    events.push({ // go fast
      type: "SCROLLS",
      value: factor,
      beat: uniqueBeats[i] + (1 - 1 / factor) * beatsToNextNote,
    })
  }

  events.push({  // Revert to normal
    type: "SCROLLS",
    value: 1,
    beat: uniqueBeats.at(-1),
  })

  td.insert(events)
}

```
<video controls="controls" src="./assets/scripting/stutter-scrolls.mp4"/>



## Notedata Objects

Partial notedata objects contain only the important properties of each note, like note type and beat.
You will most likely be working with Partial objects instead of normal ones.

```ts
type PartialNotedata = PartialNotedataEntry[]

type NoteType = "Tap" | "Hold" | "Roll" | "Mine" | "Lift" | "Fake"

interface PartialTapNotedataEntry {
  beat: number
  col: number // note that colums are 0-indexed in SMEditor
  type: NoteType
  notemods?: string // unsupported for now
  keysounds?: string // unsupported for now
}

interface PartialHoldNotedataEntry extends PartialTapNotedataEntry {
  hold: number
}

type PartialNotedataEntry =
  | PartialTapNotedataEntry
  | PartialHoldNotedataEntry
```
---
Normal notedata objects have extra computed properties for caching purposes, such as the second and quantization.

```ts
type Notedata = NotedataEntry[]
interface ExtraNotedata {
  warped: boolean
  fake: boolean
  second: number
  quant: number
  gameplay?: { // object for working with play mode
    hideNote: boolean
    hasHit: boolean
  }
  parity?: string // object for working with Parity Generation
}

type TapNotedataEntry = PartialTapNotedataEntry & ExtraNotedata
type HoldNotedataEntry = PartialHoldNotedataEntry &
  ExtraNotedata & {
    gameplay?: {
      lastHoldActivation: number
      droppedHoldBeat: number
    }
  }
type NotedataEntry = TapNotedataEntry | HoldNotedataEntry
```

## Simfile

This object can be accessed through `app.chartManager.loadedSM`.

### Types
```ts
type SimfileProperty = "TITLE" | "SUBTITLE" | "ARTIST" | "TITLETRANSLIT" | "SUBTITLETRANSLIT" | "ARTISTTRANSLIT" |
                       "GENRE" | "CREDIT" | "ORIGIN" | "BACKGROUND" | "BANNER" | "MUSIC" | "CDTITLE" | "JACKET" |
                       "DISCIMAGE" | "CDIMAGE" | "PREVIEW" | "LYRICSPATH" | "SAMPLESTART" | "SAMPLELENGTH" |
                       "SELECTABLE"
class Simfile {
  charts: Record<string, Chart[]> // A Record from gameType IDs to lists of charts
  other_properties: { [key: string]: string } // any other properties that could not be parsed
  properties: { [key in SimfileProperty]?: string } // map of all valid properties that were parsed
  timingData: SimfileTimingData // timing data specific to the simfile

  unloadedCharts: (string | { [key: string]: string })[] = // any charts that could not be loaded (unsupported game types)
}
```

### Methods

```ts
addChart(chart: Chart): void
```
Adds a new chart to the simfile.

---

```ts
removeChart(chart: Chart): boolean
```
Removes a chart from the simfile. Returns true if the operation succeeded.

## Chart

This object can be accessed through `app.chartManager.loadedChart`.

### Types

```ts
interface Chart {
  gameType: GameType // the game type associated with this chart

  description: string // DESCRIPTION
  difficulty: "Beginner" | "Easy" | "Medium" | "Hard" | "Challenge" | "Edit" // DIFFICULTY
  meter: number // METER
  meterF: number // METERF
  radarValues: string // RADARVALUES
  chartName: string // CHARTNAME
  chartStyle: string // CHARTSTYLE
  credit: string // CREDIT
  music?: string // chart-specific audio file. leave blank for the simfile audio file

  timingData: ChartTimingData // timing data specific to the chart
  sm: Simfile // the simfile this chart belongs to

  other_properties: { [key: string]: string } // any other properties that could not be parsed

  notedata: Notedata // the notedata of this chart
}
```

### Methods

```ts
addNote(note: PartialNotedataEntry, callListeners = true): NotedataEntry
```
Adds a note to the current chart. Returns the computed note. If callListeners is
off, will not trigger any post editing effects, such as computing note count stats.

---

```ts
addNotes(notes: PartialNotedataEntry[], callListeners = true): NotedataEntry[]
```
Adds notes to the current chart. Returns all the computed notes. If callListeners is
off, will not trigger any post editing effects, such as computing note count stats.

---

```ts
removeNote(note: PartialNotedataEntry, callListeners = true): NotedataEntry | undefined
```
Removes a note in the current notedata. Returns the computed removed note
if it exists. If callListeners is
off, will not trigger any post editing effects, such as computing note count stats.

---

```ts
removeNotes(notes: PartialNotedataEntry[], callListeners = true): NotedataEntry[]
```
Removes notes in the current notedata. Returns all computed removed note
if they exist. If callListeners is
off, will not trigger any post editing effects, such as computing note count stats.

---

```ts
setNotedata(notedata: Notedata): void
```
Replaces the current notedata with a new one.

---

```ts
modifyNote(note: PartialNotedataEntry, properties: Partial<NotedataEntry>, callListeners = true): NotedataEntry
```
Modifies a note by replacing its properties with a new set of properties. If callListeners is
off, will not trigger any post editing effects, such as computing note count stats.

---

```ts
computeNote(note: PartialNotedataEntry): NotedataEntry
```
Computes the second and quantization of the note, as well as if the note is
warped or faked.

## TimingData

There are two types of TimingData which represent data
specific to a certain object: `SimfileTimingData` and `ChartTimingData`. `SimfileTimingData`
stores simfile-specific timing data, while `ChartTimingData` stores chart-specific timing data.

A timing column represents a list of timing events with the same type. When finding timing columns
to use, the game will first search for timing columns in `ChartTimingData`. If there is no
column present, it will fallback to the `SimfileTimingData`.

You will most likely be operating on the `ChartTimingData`.

Modifying timing columns will default to the simfile-specific one, unless there is already a chart-specific
column present or if the events added are specific marked as chart-specific.

---

There are two main types of timing events: **continuing** and **instant** events.
**Continuing** events persist until another timing event occurs, such as
BPMS, SCROLLS, and SPEEDS.
**Instant** events do not persist after the event has occured, such as
STOPS and WARPS.

### Types

```ts
type TimingEventType = "BPMS" | "STOPS" | "WARPS" | "DELAYS" | "LABELS" |
                              "SPEEDS" | "SCROLLS" | "TICKCOUNTS" | "TIMESIGNATURES" |
                              "COMBOS" | "FAKES" | "ATTACKS" | "BGCHANGES" | "FGCHANGES"
type TimingType = "OFFSET" | TimingEventType

// Timing event types

interface BPMTimingEvent {
  type: "BPMS"
  beat: number
  value: number
}
interface StopTimingEvent {
  type: "STOPS"
  beat: number
  value: number
}
interface WarpTimingEvent {
  type: "WARPS"
  beat: number
  value: number
}
interface DelayTimingEvent {
  type: "DELAYS"
  beat: number
  value: number
}
interface ScrollTimingEvent {
  type: "SCROLLS"
  beat: number
  value: number
}
interface TickCountTimingEvent {
  type: "TICKCOUNTS"
  beat: number
  value: number
}
interface FakeTimingEvent {
  type: "FAKES"
  beat: number
  value: number
}
interface LabelTimingEvent {
  type: "LABELS"
  beat: number
  value: string
}
interface SpeedTimingEvent {
  type: "SPEEDS"
  beat: number
  value: number
  delay: number
  unit: "B" | "T"
}
interface TimeSignatureTimingEvent {
  type: "TIMESIGNATURES"
  beat: number
  upper: number
  lower: number
}
interface ComboTimingEvent {
  type: "COMBOS"
  beat: number
  hitMult: number
  missMult: number
}
interface AttackTimingEvent {
  type: "ATTACKS"
  second: number
  endType: "LEN" | "END"
  value: number
  mods: string
}
interface BGChangeTimingEvent {
  type: "BGCHANGES"
  beat: number
  file: string
  updateRate: number
  crossFade: boolean
  stretchRewind: boolean
  stretchNoLoop: boolean
  effect: string
  file2: string
  transition: string
  color1: string
  color2: string
}
interface FGChangeTimingEvent {
  type: "FGCHANGES"
  beat: number
  file: string
  updateRate: number
  crossFade: boolean
  stretchRewind: boolean
  stretchNoLoop: boolean
  effect: string
  file2: string
  transition: string
  color1: string
  color2: string
}

type TimingEvent =
  | BPMTimingEvent
  | StopTimingEvent
  | WarpTimingEvent
  | DelayTimingEvent
  | ScrollTimingEvent
  | TickCountTimingEvent
  | FakeTimingEvent
  | LabelTimingEvent
  | SpeedTimingEvent
  | TimeSignatureTimingEvent
  | ComboTimingEvent
  | AttackTimingEvent
  | BGChangeTimingEvent
  | FGChangeTimingEvent

// Cached timing events have extra properties that are calculated.

export type Cached<T extends TimingEvent> = T & {
  beat: number
  second: number
  isChartTiming: boolean
}

interface TimingColumn<Event extends TimingEvent> {
  type: TimingEventType
  events: Cached<Event>[]
}
```

### TimingData Methods

```ts
getTimingData(types?: TimingEventType[]): Cached<TimingEvent>[]
```

Returns all events with the given type names. If no types are given, returns all timing events.

---

```ts
getEventAtBeat(
  type: TimingEventType,
  beat: number,
  useDefault = true
): Cached<TimingEvent> | undefined
```

Returns the timing event with the given type at a given beat. For continuing events, returns the
event that is active at the specified beat. If there are no events, returns a default event if useDefault
is enabled.

For instant events, only returns an event if there is an event on the exact beat specified.

---

```ts
setOffset(offset: number): void
```

Sets the offset for this timing data. When used on a `ChartTimingData`, sets the chart-specific offset.

---

```ts
getBeatFromSeconds(seconds: number): number
```

Returns the beat corresponding to the given second.

---

```ts
getSecondsFromBeat(
    beat: number,
    option?: "noclamp" | "before" | "after" | ""
): number
```

Returns the second corresponding to the given beat.
Options:
- noclamp: allow negative bpms to count backwards in time
- before: get the second before STOPS/DELAYS
- after: get the second after STOPS/DELAYS

---

```ts
isBeatWarped(beat: number): boolean
```
Returns true if the beat given is in a warped section.

---

```ts
isBeatFaked(beat: number): boolean
```
Returns true if the beat given is in a faked section.

---

```ts
getMeasure(beat: number): number
```
Returns the measure number at the given beat.

---

```ts
getDivisionLength(beat: number): number
```
Returns the division length at the given beat. In x/**4**, the division length is 1, while in x/**8**, it is 0.5.

---

```ts
getMeasureLength(beat: number): number
```
Returns the length of a measure at the given beat.

---

```ts
getBeatOfMeasure(measure: number): number
```
Returns the beat number of the current measure. For example, if the time signature was 4/4, beat 5 would return 1,
since it is the second beat (0-indexed) of measure 1.

---

```ts
getBeatFromMeasure(measure: number): number
```
Returns the beat at the given measure number.

---

```ts
getDivisionOfMeasure(measure: number): number
```
Returns the division number of the current measure. For example, if the time signature was 6/8, beat 1 would return 2,
since it is the third division (0-indexed) of measure 0 (beat 0, beat 0.5, beat 1).

---

```ts
getEffectiveBeat(beat: number): number
```
Returns the effective beat at the given beat. The effective beat is what is used when calculating **SCROLLS**.

---

```ts
getBeatFromEffectiveBeat(effBeat: number): number
```
Returns the beat at the given effective beat. This method may not work when dealing with negative **SCROLLS**
since there can be two beats with the same effective beat.

---

```ts
getSpeedMult(beat: number, seconds: number): number
```
Returns the speed multiplier at the given beat and second. The speed multiplier is affected by **SPEEDS**.

---

```ts
reloadCache(types: TimingType[] = []): number
```
Reloads all caches in the timing data object. When specified, only refreshes caches relating to the given
types.

You may want to use this method if you are editing the timing columns directly without using
the given insert/delete methods.

### ChartTimingData Methods

```ts
getColumn(type: TimingEventType): TimingColumn
```

Returns the timing column with the given type. If there is no chart-specific timing column, will return the
simfile-specific timing column instead.

---

```ts
insert(events: TimingEvent[]): void
```

Inserts the given timing events into the timing data. If an event has `isChartTiming` set to true, it will be
added to the corresponding chart-specific timing column and the column will be used.

---

```ts
modify(events: [TimingEvent, TimingEvent][]): void
```

For each pair of events, replaces the first timing event with the second one.

---

```ts
delete(events: TimingEvent[]): void
```

Deletes the given timing events.

---

```ts
getOffset(): number
```

Returns the chart offset, if there is one. Otherwise, returns the simfile offset.

---

```ts
usesChartTiming(): boolean
```

Returns true if chart-specific timing data is present.

---

```ts
hasChartOffset(): boolean
```

Returns true if chart-specific offset is used.

---

```ts
isPropertyChartSpecific(type: TimingEventType): boolean
```

Returns true if the timing column with the given type is chart-specific.

### SimfileTimingData Methods

```ts
getColumn(type: TimingEventType): TimingColumn
```

Returns the timing column with the given type.

---

```ts
insert(events: TimingEvent[]): void
```

Inserts the given timing events into the timing data.

---

```ts
modify(events: [TimingEvent, TimingEvent][]): void
```

For each pair of events, replaces the first timing event with the second one.

---

```ts
delete(events: TimingEvent[]): void
```

Deletes the given timing events.

---

```ts
getOffset(): number
```

Returns the simfile offset.