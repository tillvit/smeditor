export function lerp(v0: number, v1: number, t: number): number {
  return v0 * (1 - t) + v1 * t
}

export function unlerp(min: number, max: number, value: number) {
  return (value - min) / (max - min)
}

export function roundDigit(num: number, scale: number): number {
  return Math.round(num * Math.pow(10, scale)) / Math.pow(10, scale)
}
export function clamp(val: number, low: number, high: number): number {
  return Math.max(low, Math.min(high, val))
}

export function stdDev(array: number[]): number {
  if (array.length == 0) return 0
  const n = array.length
  const mean = array.reduce((a, b) => a + b) / n
  return Math.sqrt(
    array.map(x => Math.pow(x - mean, 2)).reduce((a, b) => a + b) / n
  )
}

export function median(array: number[]): number {
  if (array.length == 0) return 0
  array = [...array]
  array.sort((a, b) => a - b)
  const half = Math.floor(array.length / 2)
  if (array.length % 2) return array[half]
  return (array[half - 1] + array[half]) / 2.0
}

export function mean(array: number[]): number {
  if (array.length == 0) return 0
  return array.reduce((a, b) => a + b) / array.length
}

export function gcd2(a: number, b: number): number {
  if (!b) return b === 0 ? a : NaN
  return gcd2(b, a % b)
}

export function lcm2(a: number, b: number): number {
  return (a * b) / gcd2(a, b)
}
export function lcm(array: number[]): number {
  let n = 1
  for (let i = 0; i < array.length; ++i) n = lcm2(array[i], n)
  return n
}

export function minArr(array: number[]): number {
  if (array.length == 0) return 0
  let min = Number.MAX_VALUE
  for (const item of array) {
    if (item < min) {
      min = item
    }
  }
  return min
}

export function maxArr(array: number[]): number {
  if (array.length == 0) return 0
  let max = -Number.MAX_VALUE
  for (const item of array) {
    if (item > max) {
      max = item
    }
  }
  return max
}
