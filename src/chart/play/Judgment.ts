
export class Judgment {
  name: string
  color: number
  timingWindowMS: number
  order: number
  
  private static wID = 0

  static timingWindows: Judgment[] = []

  static FANTASTIC = new Judgment("Fantastic", 0x21cce8, 15)
  static WHITE_FANTASTIC = new Judgment("Fantastic", 0xffffff, 23)
  static EXCELLENT = new Judgment("Excellent", 0xe29c18, 44.5)
  static GREAT = new Judgment("Great", 0x66c955, 103.5)
  static DECENT = new Judgment("Decent", 0xb45cff, 136.5)
  static WAY_OFF = new Judgment("Way Off", 0xc9855e, 181.5)
  static MISS = new Judgment("Miss", 0xff3030, 181.5)

  constructor(name: string, color: number, timingWindowMS: number) {
    this.name = name
    this.color = color
    this.timingWindowMS = timingWindowMS
    this.order = Judgment.wID++
    Judgment.timingWindows.push(this)
  }
}


