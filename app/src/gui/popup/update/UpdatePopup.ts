interface UpdatePopupOptions {
  title: string
  desc: string
  options: UpdateOption[]
}

interface UpdateOption {
  label: string
  callback?: (popup: UpdatePopup) => void
  type: "delete" | "confirm" | "default"
}

export abstract class UpdatePopup {
  static popup?: HTMLDivElement

  protected static build(opt: UpdatePopupOptions) {
    const popup = document.createElement("div")
    popup.classList.add("update-popup")

    const title = document.createElement("div")
    title.classList.add("title")
    title.innerText = opt.title

    const desc = document.createElement("div")
    desc.classList.add("desc")
    desc.innerText = opt.desc

    const options = document.createElement("div")
    options.classList.add("update-options")

    popup.replaceChildren(title, desc)

    if (opt.options.length > 0) {
      for (const o of opt.options) {
        const button = document.createElement("button")
        button.innerText = o.label
        button.onclick = () => {
          o.callback?.(this)
        }
        button.classList.add(o.type)
        options.appendChild(button)
      }
      popup.appendChild(options)
    }
    this.popup = popup
    document.getElementById("popups")?.appendChild(this.popup)
  }

  static close() {
    if (!this.popup) return
    this.popup.classList.add("exiting")
    this.popup.style.pointerEvents = "none"
    setTimeout(() => this.popup!.remove(), 300)
  }
}
