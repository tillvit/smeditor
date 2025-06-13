import {
  DisplayObject,
  FederatedMouseEvent,
  Geometry,
  Rectangle,
  Texture,
} from "pixi.js"
import { IS_OSX } from "./Util"

export function destroyChildIf<Child extends DisplayObject>(
  children: Child[],
  predicate: (child: Child, index: number) => boolean
) {
  let i = children.length
  if (children.length == 0) return
  while (i--) {
    if (predicate(children[i], i)) {
      children[i].destroy()
    }
  }
}

export function isRightClick(event: FederatedMouseEvent) {
  return event.button == 2 || (event.getModifierState("Control") && IS_OSX)
}

export function splitTex(
  texture: Texture,
  xFrames: number,
  yFrames: number,
  xWidth: number,
  yWidth: number
) {
  const frames: Texture[][] = []
  for (let y = 0; y < yFrames; y++) {
    const row = []
    for (let x = 0; x < xFrames; x++) {
      row.push(
        new Texture(
          texture.baseTexture,
          new Rectangle(xWidth * x, yWidth * y, xWidth, yWidth)
        )
      )
    }
    frames.push(row)
  }
  return frames
}

export async function loadGeometry(data: string): Promise<Geometry> {
  const lines = data.split("\n")
  const numVertices = parseInt(lines[0])
  const numTriangles = parseInt(lines[numVertices + 1])
  const vPos = []
  const vUvs = []
  const vIndex = []
  for (let i = 0; i < numVertices; i++) {
    const match = /(-?[0-9.]+)\s+(-?[0-9.]+)\s+(-?[0-9.]+)\s+(-?[0-9.]+)/.exec(
      lines[i + 1]
    )
    if (match) {
      vPos.push(parseFloat(match[1]))
      vPos.push(parseFloat(match[2]))
      vUvs.push(parseFloat(match[3]))
      vUvs.push(parseFloat(match[4]))
    } else {
      console.error("Failed to load vertex " + lines[i + 1])
      return new Geometry()
    }
  }
  for (let i = 0; i < numTriangles; i++) {
    const match = /(-?[0-9.]+)\s+(-?[0-9.]+)\s+(-?[0-9.]+)/.exec(
      lines[i + 2 + numVertices]
    )
    if (match) {
      vIndex.push(parseFloat(match[1]))
      vIndex.push(parseFloat(match[2]))
      vIndex.push(parseFloat(match[3]))
    } else {
      console.error("Failed to load triangle " + lines[i + 2 + numVertices])
      return new Geometry()
    }
  }
  return new Geometry()
    .addAttribute("aVertexPosition", vPos, 2)
    .addAttribute("aUvs", vUvs, 2)
    .addIndex(vIndex)
}
