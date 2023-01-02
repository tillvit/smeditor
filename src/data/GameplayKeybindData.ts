import { KeyCombo } from "./KeybindData"

interface GameplayKeybind {
  label: string,
  col: number,
  keybinds: KeyCombo[]
}

export const GAMEPLAY_KEYBINDS: {[key: string]: GameplayKeybind[]} = {
  "dance-single": [
    {
      label: "Left",
      col: 0,
      keybinds: [
        {key: "Left", mods: []},
        {key: "A", mods: []}
      ],
    },
    {
      label: "Down",
      col: 1,
      keybinds: [
        {key: "Down", mods: []},
        {key: "S", mods: []}
      ],
    },
    {
      label: "Up",
      col: 2,
      keybinds: [
        {key: "Up", mods: []},
        {key: "W", mods: []}
      ],
    },
    {
      label: "Right",
      col: 3,
      keybinds: [
        {key: "Right", mods: []},
        {key: "D", mods: []}
      ],
    },
  ],
  "dance-double": [
    {
      label: "Left",
      col: 4,
      keybinds: [
        {key: "Left", mods: []},
      ],
    },
    {
      label: "Down",
      col: 5,
      keybinds: [
        {key: "Down", mods: []},
      ],
    },
    {
      label: "Up",
      col: 6,
      keybinds: [
        {key: "Up", mods: []},
      ],
    },
    {
      label: "Right",
      col: 7,
      keybinds: [
        {key: "Right", mods: []},
      ],
    },
    {
      label: "Left",
      col: 0,
      keybinds: [
        {key: "A", mods: []},
      ],
    },
    {
      label: "Down",
      col: 1,
      keybinds: [
        {key: "S", mods: []},
      ],
    },
    {
      label: "Up",
      col: 2,
      keybinds: [
        {key: "W", mods: []},
      ],
    },
    {
      label: "Right",
      col: 3,
      keybinds: [
        {key: "D", mods: []},
      ],
    },
  ],
  "dance-solo": [
    {
      label: "Left",
      col: 0,
      keybinds: [
        {key: "Left", mods: []},
        {key: "A", mods: []}
      ],
    },
    {
      label: "UpLeft",
      col: 1,
      keybinds: [
        {key: "Q", mods: []}
      ],
    },
    {
      label: "Down",
      col: 2,
      keybinds: [
        {key: "Down", mods: []},
        {key: "S", mods: []}
      ],
    },
    {
      label: "Up",
      col: 3,
      keybinds: [
        {key: "Up", mods: []},
        {key: "W", mods: []}
      ],
    },
    {
      label: "UpRight",
      col: 4,
      keybinds: [
        {key: "E", mods: []}
      ],
    },
    {
      label: "Right",
      col: 5,
      keybinds: [
        {key: "Right", mods: []},
        {key: "D", mods: []}
      ],
    },
  ]
}