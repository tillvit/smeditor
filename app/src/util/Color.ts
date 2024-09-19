import { Color, ColorSource } from "pixi.js"
import { EventHandler } from "./EventHandler"
import { clamp, lerp } from "./Math"

export function rgbtoHex(r: number, g: number, b: number): number {
  return (r << 16) + (g << 8) + b
}

export function lighten(col: number, gamma: number): number {
  let r = col >> 16
  let g = (col >> 8) & 0xff
  let b = col & 0xff
  r = clamp(Math.round(r * gamma), 0, 255)
  g = clamp(Math.round(g * gamma), 0, 255)
  b = clamp(Math.round(b * gamma), 0, 255)
  return rgbtoHex(r, g, b)
}

export function add(col: number, gamma: number): number {
  let r = col >> 16
  let g = (col >> 8) & 0xff
  let b = col & 0xff
  r = clamp(Math.round(r + gamma), 0, 255)
  g = clamp(Math.round(g + gamma), 0, 255)
  b = clamp(Math.round(b + gamma), 0, 255)
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

export function blendPixiColors(colorA: Color, colorB: Color, amount: number) {
  const r = lerp(colorA.red, colorB.red, amount)
  const g = lerp(colorA.green, colorB.green, amount)
  const b = lerp(colorA.blue, colorB.blue, amount)
  const a = lerp(colorA.alpha, colorB.alpha, amount)
  return new Color([r, g, b, a])
}

export function getCSSColor(id: string) {
  return new Color(
    document.body.computedStyleMap().get(id)?.toString() ?? "rgba(0, 0, 0, 1)"
  )
}

type TintableObject = { tint: ColorSource; alpha: number; destroyed: boolean }

const themeObjectMap = new Map<string, TintableObject[]>()

EventHandler.on("themeChanged", () => {
  for (const [id, objects] of themeObjectMap.entries()) {
    const color = getCSSColor(id)
    objects.forEach(o => {
      if (o.destroyed) return
      o.tint = color.toNumber()
      o.alpha = color.alpha
    })
    themeObjectMap.set(
      id,
      objects.filter(o => !o.destroyed)
    )
  }
})

export function assignTint(element: TintableObject, id: string) {
  if (!themeObjectMap.has(id)) {
    themeObjectMap.set(id, [])
  }
  themeObjectMap.get(id)!.push(element)
  const color = getCSSColor(id)
  element.tint = color.toNumber()
  element.alpha = color.alpha
}

export function colorToHsla(color: Color) {
  const { r, g, b, a } = color.toRgba()

  const max = Math.max(r, g, b),
    min = Math.min(r, g, b)
  let h = 0
  let s = 0
  const l = (max + min) / 2

  if (max == min) {
    h = s = 0 // achromatic
  } else {
    const d = max - min
    s = l > 0.5 ? d / (2 - max - min) : d / (max + min)

    switch (max) {
      case r:
        h = (g - b) / d + (g < b ? 6 : 0)
        break
      case g:
        h = (b - r) / d + 2
        break
      case b:
        h = (r - g) / d + 4
        break
    }

    h /= 6
  }

  return [h, s, l, a]
}

export function colorToHsva(color: Color) {
  const { r, g, b, a } = color.toRgba()

  const max = Math.max(r, g, b),
    min = Math.min(r, g, b)
  let h = 0
  let s = 0
  const v = max

  const d = max - min
  s = max == 0 ? 0 : d / max

  if (max == min) {
    h = 0 // achromatic
  } else {
    switch (max) {
      case r:
        h = (g - b) / d + (g < b ? 6 : 0)
        break
      case g:
        h = (b - r) / d + 2
        break
      case b:
        h = (r - g) / d + 4
        break
    }

    h /= 6
  }

  return [h, s, v, a]
}
