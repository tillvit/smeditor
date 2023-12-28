interface GameplayKeybind {
  label: string
  keys: string[]
}

export const GAMEPLAY_KEYBINDS: { [key: string]: GameplayKeybind[] } = {
  "dance-single": [
    {
      label: "Left",
      keys: ["Left", "A"],
    },
    {
      label: "Down",
      keys: ["Down", "S"],
    },
    {
      label: "Up",
      keys: ["Up", "W"],
    },
    {
      label: "Right",
      keys: ["Right", "D"],
    },
  ],
  "dance-double": [
    {
      label: "P1 Left",
      keys: ["Left"],
    },
    {
      label: "P1 Down",
      keys: ["Down"],
    },
    {
      label: "P1 Up",
      keys: ["Up"],
    },
    {
      label: "P1 Right",
      keys: ["Right"],
    },
    {
      label: "P2 Left",
      keys: ["A"],
    },
    {
      label: "P2 Down",
      keys: ["S"],
    },
    {
      label: "P2 Up",
      keys: ["W"],
    },
    {
      label: "P2 Right",
      keys: ["D"],
    },
  ],
  "dance-couple": [
    {
      label: "P1 Left",
      keys: ["Left"],
    },
    {
      label: "P1 Down",
      keys: ["Down"],
    },
    {
      label: "P1 Up",
      keys: ["Up"],
    },
    {
      label: "P1 Right",
      keys: ["Right"],
    },
    {
      label: "P2 Left",
      keys: ["A"],
    },
    {
      label: "P2 Down",
      keys: ["S"],
    },
    {
      label: "P2 Up",
      keys: ["W"],
    },
    {
      label: "P2 Right",
      keys: ["D"],
    },
  ],
  "dance-solo": [
    {
      label: "Left",
      keys: ["Left", "A"],
    },
    {
      label: "UpLeft",
      keys: ["Q"],
    },
    {
      label: "Down",
      keys: ["Down", "S"],
    },
    {
      label: "Up",
      keys: ["Up", "W"],
    },
    {
      label: "UpRight",
      keys: ["E"],
    },
    {
      label: "Right",
      keys: ["Right", "D"],
    },
  ],
  "dance-solodouble": [
    {
      label: "P1 Left",
      keys: ["A"],
    },
    {
      label: "P1 UpLeft",
      keys: ["Q"],
    },
    {
      label: "P1 Down",
      keys: ["S"],
    },
    {
      label: "P1 Up",
      keys: ["W"],
    },
    {
      label: "P1 UpRight",
      keys: ["E"],
    },
    {
      label: "P1 Right",
      keys: ["D"],
    },
    {
      label: "P2 Left",
      keys: ["J"],
    },
    {
      label: "P2 UpLeft",
      keys: ["U"],
    },
    {
      label: "P2 Down",
      keys: ["K"],
    },
    {
      label: "P2 Up",
      keys: ["I"],
    },
    {
      label: "P2 UpRight",
      keys: ["O"],
    },
    {
      label: "P2 Right",
      keys: ["L"],
    },
  ],
  "dance-threepanel": [
    {
      label: "UpLeft",
      keys: ["Left", "Q"],
    },
    {
      label: "Down",
      keys: ["Down", "S"],
    },
    {
      label: "UpRight",
      keys: ["Right", "E"],
    },
  ],
  "dance-threedouble": [
    {
      label: "P1 UpLeft",
      keys: ["Left"],
    },
    {
      label: "P1 Down",
      keys: ["Down"],
    },
    {
      label: "P1 UpRight",
      keys: ["Right"],
    },
    {
      label: "P2 UpLeft",
      keys: ["Q"],
    },
    {
      label: "P2 Down",
      keys: ["S"],
    },
    {
      label: "P2 UpRight",
      keys: ["E"],
    },
  ],
}
