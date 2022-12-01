export class OffsetHowler extends Howl {
  position = 0
  timeout_id;
  last_tick = 0
  isplaying = false
  delay = false

  constructor(options) {
    super(options)
    this.timeout_id = setInterval(()=>{
      if (this.isplaying) {
        let dt = (Date.now() - this.last_tick) * super.rate()
        this.last_tick = Date.now()
        if (this.position >= 0 && this.delay) {
          this.delay = false
          super.play()
        }else{
          this.position += dt/1000
        }
      }
    }) 
  }
  
  // start playing in `offset` milliseconds.
  play() {
    this.isplaying = true
    this.delay = true
    this.last_tick = Date.now();
  }

  pause() {
    this.isplaying = false
    super.pause()
  }

  seek(position) {
    if (position != null) {
      var ids = this._getSoundIds();
      var index = ids.indexOf(position);
      if (index >= 0) {
        return super.seek(position)
      }
      if (position < 0) {
        super.pause()
        this.position = position
        this.delay = true
      }
      super.seek(Math.max(0,position))
    }else{
      if (super.seek() > 0) {
        return super.seek()
      }else{
        return this.position
      }
    }
  }
}