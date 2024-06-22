# XMod vs CMod

[[toc]]

## What are XMod and CMod?

XMod and CMod are two different types of speedmod.

In XMod (X for multiplier), the current scroll position is based on the current *beat*
The scrolling speed for XMod can vary based on tempo and other timing changes.

In CMod (C for constant), the current scroll position is based on the current *second*.
CMod will always maintain the same scrolling speed regardless of any timing changes.

---

To swap between the two, you click on the *X/C* toggle in the playback options submenu at
the top of the screen, or select *View > Scroll* from the menubar.

![XMod/CMod toggle](assets/xmod-cmod/toggle.png)



## Differences between XMod and CMod

XMod and CMod differ when the tempo changes or when certain timing events are used.

In this example, the BPM changes from 60 to 120 to 240. In XMod, the scrolling speed changes
to make sure the spacing between beats stays constant. In CMod, the spacing between beats
gets smaller to maintain a constant scrolling speed.

![XMod vs CMod with varying BPMS](assets/xmod-cmod/bpms.gif)

---

When [STOPS](./timing-events#standard-events) are used, XMod will stop scrolling,
while CMod will instead represent the stop as an extra segment to scroll through.

![XMod vs CMod with STOPS](assets/timing-events/stops.gif)

---

When [WARPS](./timing-events#sm5-events) are used, XMod will skip over the warped section,
while CMod will instead condense all notes within the warped section into one row.

![XMod vs CMod with WARPS](assets/timing-events/warps.gif)

## XMod-specific Options

### Do Speed Changes
This setting can be toggled in the playback options submenu or through *View > Do speed changes*.

When enabled, [SCROLL](./timing-events#sm5-events) and [SPEED](./timing-events#sm5-events) events
can affect the playfield.

<video controls="controls" src="./assets/xmod-cmod/speed-changes.mov"/>

## CMod-specific Options

### Hide warped notes
This setting can be toggled in the playback options submenu or through *View > Hide warped notes*.

Since CMod will condense all notes within warped sections into singular rows, this may hide
the correct note to play. Additionally, using many warps are hundreds of skipped notes can cause
lag.

![Hide warped notes](assets/xmod-cmod/warped.gif)

### Hide faked notes

This setting can be toggled in the playback options submenu or through *View > Hide faked notes*.

This setting is similar to the previous one, except that it hides all notes in fake sections.