# Timing Tracks and Events

This page will guide you on how to add timing events to your chart, such as BPM changes
or scroll gimmicks.

[[toc]]

## Introduction

Timing events are events that occur at a specific point in time that trigger some sort of
change. There are many types of timing events, such as BPM events, which change the chart's
tempo.

Timing events are represented in SMEditor as colored boxes that appear on the left and right
side of the playfield. Each type of event has its own color.

![Timing events](assets/timing-events/timing-events.png)

## Editing timing events

::: tip
Used to ArrowVortex? You can select *Chart > Edit timing data at row* for a similar experience.
:::

To start editing timing events, click the **Edit Timing** button in the playback toolbar.
This will rearrange the timing events into different columns, also known as "tracks",
based on their type.

![Edit timing event](assets/timing-events/edit-timing.gif)

Being in this mode allows you to shift timing events by dragging them and select multiple events
by highlighting an area.

---

To add a timing event, click the **Add timing event** button. A ghost timing event box will appear
where your cursor is. Clicking will place the timing event and allow you to edit its details.

![Add timing event](assets/timing-events/add-timing.gif)

To edit an existing timing event, click on it and its details will open. To delete a timing event,
click on the **Delete** button or press Backspace.

![Editing and deleting timing events](assets/timing-events/edit-delete-timing.gif)

## Hiding and rearranging timing tracks

You can hide or rearrange timing tracks by clicking on the **Toggle Timing Track Visibility** button
in the playback toolbar.

To move a track, drag it across the popup.

To delete a track, hover over the track and click on the trash button.

To restore a track that has been deleted, click on the track from the bottom tray or drag it back into the grid.

![Hiding and rearranging timing tracks](assets/timing-events/rearrange.gif)

## Types of timing events

### Standard Events

These events can be used in versions or forks of Stepmania above 3.95 that use the SM file format.

<div style="background-color: #8C1C2E" class="TimingEvent">BPMS</div>

A BPM event contains one field: the tempo in beats per minute. This event can be used
to deal with songs with varying tempos.

![BPM events](assets/timing-events/bpms.png)

---

<div style="background-color: #4B4D01" class="TimingEvent">STOPS</div>

A STOP event will pause the chart at the beat it's on before a specified number of seconds.
Notes that occur on the STOP will be hit before the pause starts. In CMod, stops will be notated with a yellow area.

![STOPS](assets/timing-events/stops.gif)

Negative values will instead skip forward instead of stopping. Notes inside the skipped
area will not be hit. This will appear as a yellow area in XMod.

![Negative STOPS](assets/timing-events/neg-stops.gif)

---

<div style="background-color: #81187F; display: inline" class="TimingEvent">BGCHANGES</div> and <div style="background-color: #87261B; display: inline" class="TimingEvent">FGCHANGES</div>

Both of these events are used to make effects occur in the background or foreground.

You can learn more about them [here](https://outfox.wiki/en/dev/mode-support/sm-support).

---

<div style="background-color: #1C5253" class="TimingEvent">ATTACKS</div>

ATTACKS apply modifiers to the chart, such as Bumpy or Reverse. Unlike all the other events, the time this event occurs
is based on the second.

You can learn more about them [here](https://outfox.wiki/en/dev/mode-support/sm-support).

:::info
Modifiers are not shown in SMEditor, so editing them is not recommended.
:::



### SM5 Events

These events are specific to versions of Stepmania above 5 that use the SSC file format.

<div style="background-color: #03516D" class="TimingEvent">DELAYS</div>

Similar to STOPS, a DELAY event will also pause the chart for a specified number of seconds.
The difference between STOPS and DELAYS is that notes that occur on the DELAY will be hit
*after* the pause starts.

![DELAYS vs. STOPS](assets/timing-events/delays-vs-stops.gif)

---

<div style="background-color: #8D0D5E" class="TimingEvent">WARPS</div>

A WARP event will skip forwards a specified number of beats. This will appear as a pink area in XMod.
Notes that occur on the WARP or are skipped by the WARP will not be hit.

![WARPS](assets/timing-events/warps.gif)

::: info
Since this effect is similar to a negative stop, all warps will be converted to negative stops
when exporting in the SM file format.
:::

---

<div style="background-color: #4A4A4A" class="TimingEvent">FAKES</div>

A FAKE event makes all notes in the next specified number of beats unable to be hit. This will
appear as a gray area.

![FAKES](assets/timing-events/fakes.gif)

---

<div style="background-color: #2D4C75" class="TimingEvent">SPEEDS</div>

A SPEED event multiplies the scroll speed of the *whole playfield* by a constant. This constant can be increased
or decreased over a specified number of beats or seconds. The multiplier can also be negative.

SPEED events are disabled in CMod or when **Do Speed Changes** is off.

![SPEEDS](assets/timing-events/speeds.gif)

---

<div style="background-color: #36468E" class="TimingEvent">SCROLLS</div>

A SCROLL event multiplies the scroll speed of the beats *after the event* by a constant. The multiplier can also be negative.

SCROLL events are disabled in CMod or when **Do Speed Changes** is off.

![SCROLLS](assets/timing-events/scrolls.gif)

::: warning
Having the last SCROLL in your chart have a multiplier of 0 will make it impossible to view any beats after it!
If you want to add another SCROLL after, turn **Do Speed Changes** off.
:::



---

<div style="background-color: #0E5446" class="TimingEvent">COMBOS</div>

A COMBO event changes the number of combo gained when hitting or missing a note. There are two
multipliers: a hit combo multiplier and a miss combo multiplier. Both of these multipliers must
be positive integers.

![COMBOS](assets/timing-events/combos.gif)

---

<div style="background-color: #52492C" class="TimingEvent">TIMESIGNATURES</div>

A TIMESIGNATURE event allows you to change the time signature (which affects barlines and quantizations).

![TIMESIGNATURES](assets/timing-events/timesigs.png)

Each measure will start with a red quantized note, even if the time signature is irregular.

![Irregular TIMESIGNATURES](assets/timing-events/timesigs-irregular.png)

:::warning
Note that this behavior does not exist in Stepmania, instead quantizations are based off the
global beat.
:::

---



<div style="background-color: #76371F" class="TimingEvent">LABELS</div>

A LABEL event allows you to label certain parts of a song.

![LABELS](assets/timing-events/labels.png)

---

<div style="background-color: #18561A" class="TimingEvent">TICKCOUNTS</div>

A TICKCOUNT event specifies how many ticks per beat in a hold there are. This
only applies to pump gamemodes.
