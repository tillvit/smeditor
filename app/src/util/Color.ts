import { Color } from "pixi.js"
import { clamp } from "./Math"

export function rgbtoHex(r: number, g: number, b: number): number {
  return (r << 16) + (g << 8) + b
}

export function lighten(col: number, gamma: number): number {
  let r = col >> 16
  let g = (col >> 8) & 0xff
  let b = col & 0xff
  r = clamp(r * gamma, 0, 255)
  g = clamp(g * gamma, 0, 255)
  b = clamp(b * gamma, 0, 255)
  return rgbtoHex(r, g, b)
}

export function blendColors(colorA: string, colorB: string, amount: number) {
  const [rA, gA, bA] = colorA.match(/\w\w/g)!.map(c => parseInt(c, 16))
  const [rB, gB, bB] = colorB.match(/\w\w/g)!.map(c => parseInt(c, 16))
  const r = Math.round(rA + (rB - rA) * amount)
    .toString(16)
    .padStart(2, "0")
  const g = Math.round(gA + (gB - gA) * amount)
    .toString(16)
    .padStart(2, "0")
  const b = Math.round(bA + (bB - bA) * amount)
    .toString(16)
    .padStart(2, "0")
  return "#" + r + g + b
}

export function getCSSColor(id: string) {
  return new Color(
    document.body.computedStyleMap().get(id)?.toString() ?? "rgba(0, 0, 0, 1)"
  )
}
