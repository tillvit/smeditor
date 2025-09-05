import { CSSProperties, JSX } from "react"
import SVG from "react-inlinesvg"

class Icon extends HTMLDivElement {
  _width: number | undefined
  _height: number | undefined
  _color: string | undefined
  _svg: HTMLElement | undefined
  loadSVG(svg: string) {
    this.innerHTML = svg
    this._svg = this.children[0] as HTMLElement
    this.updateStyles()
  }

  private updateStyles() {
    if (!this._svg) return
    this.style.width = ""
    this.style.height = ""
    if (this._width !== undefined) {
      this._svg.style.width = this._width / 16 + "rem"
    }
    if (this._height !== undefined) {
      this._svg.style.height = this._height / 16 + "rem"
    }
    if (this._color !== undefined) {
      this._svg.style.color = this._color
    }
  }

  get width() {
    return this._width
  }

  set width(value: number | undefined) {
    if (value === undefined) return
    this._width = value
    this.updateStyles()
  }

  get height() {
    return this._height
  }

  set height(value: number | undefined) {
    if (value === undefined) return
    this._height = value
    this.updateStyles()
  }

  get color() {
    return this._color
  }

  set color(value: string | undefined) {
    if (value === undefined) return
    this._color = value
    this.updateStyles()
  }
}

export class Icons {
  static cache = new Map<string, string>()
  private static pendingWrappers = new Map<string, Icon[]>()
  static getIcon(id: string, width?: number, height?: number, color?: string) {
    const wrapper = document.createElement("div") as Icon
    Object.setPrototypeOf(wrapper, Icon.prototype)
    wrapper.loadSVG("<div></div>")
    wrapper.classList.add("icon")
    if (this.cache.has(id)) {
      wrapper.loadSVG(this.cache.get(id)!)
    } else {
      const shouldFetch = !this.pendingWrappers.has(id)
      if (!this.pendingWrappers.has(id)) {
        this.pendingWrappers.set(id, [])
      }
      this.pendingWrappers.get(id)!.push(wrapper)
      if (shouldFetch) {
        this.fetchIcon(id)
      }
    }
    wrapper.width = width
    if (height === undefined && width !== undefined) height = width
    wrapper.height = height
    wrapper.color = color
    return wrapper
  }

  private static fetchIcon(id: string) {
    fetch(`/smeditor/assets/svg/${id}.svg`)
      .then(res => res.text())
      .then(text => {
        this.cache.set(id, text)
        this.pendingWrappers.get(id)!.forEach(div => {
          div.loadSVG(text)
        })
        this.pendingWrappers.set(id, [])
      })
  }
}

interface ReactIconProps {
  id: string
  width?: number
  height?: number
  color?: string
  style?: CSSProperties
}

export function ReactIcon({
  id,
  width,
  height,
  color,
  style,
}: ReactIconProps): JSX.Element {
  return (
    <div className="icon" style={style}>
      <SVG
        src={`/smeditor/assets/svg/${id}.svg`}
        width={width ? width / 16 + "rem" : undefined}
        height={height ? height / 16 + "rem" : undefined}
        fill={color}
        style={{ fillRule: "evenodd" }}
        loader={
          <div
            style={{
              width: width ? width / 16 + "rem" : undefined,
              height: height ? height / 16 + "rem" : undefined,
            }}
          />
        }
      />
    </div>
  )
}
