const ogg: OggDec
export default ogg

interface OggDec {
  decodeOggData(data: ArrayBuffer): Promise<AudioBuffer>
}
