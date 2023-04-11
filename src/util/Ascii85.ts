const _a85chars = Array(85)
  .fill(undefined)
  .map((_, index) => 33 + index)
const _a85chars2: number[][] = []
for (const a of _a85chars) for (const b of _a85chars) _a85chars2.push([a, b])
const _A85START = "<~".split("").map(char => char.charCodeAt(0))
const _A85END = "~>".split("").map(char => char.charCodeAt(0))

function _85encode(
  data: string | ArrayBuffer | number[],
  chars: number[],
  chars2: number[][],
  pad = false,
  foldnuls = false,
  foldspaces = false
) {
  let bytes = []
  if (typeof data == "string")
    bytes = data.split("").map(char => char.charCodeAt(0))
  else bytes = [...new Uint8Array(data)]

  const padding = 4 - (bytes.length % 4)
  for (let i = 0; i < padding; i++) bytes.push(0)

  const arr = new Uint8Array(bytes)
  const dataView = new DataView(arr.buffer)

  let chunks: number[] = []
  for (let i = 0; i < bytes.length; i += 4) {
    const word = dataView.getUint32(i)
    // do whatever
    if (foldnuls && !word) {
      chunks.push("z".charCodeAt(0))
    } else if (foldspaces && word == 0x20202020) {
      chunks.push("y".charCodeAt(0))
    } else {
      chunks = chunks.concat(
        chars2[Math.floor(word / 614125)],
        chars2[Math.floor(word / 85) % 7225]
      )
      chunks.push(chars[word % 85])
    }
  }

  if (padding && !pad) {
    if (chunks.at(-1) == "z".charCodeAt(0)) {
      chunks.pop()
      for (let i = 0; i < 5; i++) chunks.push(chunks[0])
    }
    for (let i = 0; i < padding; i++) chunks.pop()
  }

  return chunks
}

export function a85encode(
  data: string | ArrayBuffer | number[],
  foldspaces = false,
  pad = false,
  adobe = false
) {
  let result = _85encode(data, _a85chars, _a85chars2, pad, true, foldspaces)

  if (adobe) result = _A85START.concat(result).concat(_A85END)

  return result
}

export function a85decode(
  data: string | ArrayBuffer,
  adobe = false,
  ignorechars = " \t\n\r\v"
) {
  let bytes = []
  if (typeof data == "string")
    bytes = data.split("").map(char => char.charCodeAt(0))
  else bytes = [...new Uint8Array(data)]
  if (adobe) {
    if (bytes.at(-1) != _A85END.at(-1) || bytes.at(-2) != _A85END.at(-2))
      return false
    if (bytes.at(0) == _A85START.at(0) && bytes.at(1) == _A85START.at(1))
      bytes = bytes.slice(2, -2)
    else bytes = bytes.slice(undefined, -2)
  }
  for (let i = 0; i < 4; i++) bytes.push("u".charCodeAt(0))
  let decoded = []
  let curr = []
  for (const byte of bytes) {
    if (byte >= 33 && 117 >= byte) {
      curr.push(byte)
      if (curr.length == 5) {
        let acc = 0
        for (const b of curr) acc = 85 * acc + (b - 33)
        if (acc > 2 ** 32 - 1) return false
        decoded.push((acc >> 24) & 0xff)
        decoded.push((acc >> 16) & 0xff)
        decoded.push((acc >> 8) & 0xff)
        decoded.push(acc & 0xff)
        curr = []
      }
    } else if (byte == 122) {
      if (curr.length != 0) return false
      decoded.push(0)
      decoded.push(0)
      decoded.push(0)
      decoded.push(0)
    } else if (byte == 121) {
      if (curr.length != 0) return false
      decoded.push(0x20)
      decoded.push(0x20)
      decoded.push(0x20)
      decoded.push(0x20)
    } else if (ignorechars.includes(String.fromCharCode(byte))) {
      continue
    } else {
      return false
    }
  }
  const padding = 4 - curr.length
  if (padding) decoded = decoded.slice(undefined, -padding)
  return decoded
}
