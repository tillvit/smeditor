export class Dropdown<T> {
  view: HTMLDivElement

  private items: readonly T[] = []
  private selectedItem: T
  private onChangeHandlers: ((value: T) => void)[] = []

  static create<T>(items?: readonly T[], selectedItem?: T) {
    return new Dropdown(document.createElement("div"), items, selectedItem)
  }

  private constructor(
    view: HTMLDivElement,
    items?: readonly T[],
    selectedItem?: T
  ) {
    this.view = view
    view.classList.add("dropdown")
    this.items = items ?? []
    this.selectedItem = selectedItem ?? this.items[0]
    const itemDisplay = document.createElement("div")
    itemDisplay.classList.add("dropdown-selected")
    const itemList = document.createElement("div")
    itemList.classList.add("dropdown-items")
    itemList.style.height = ""
    itemDisplay.onclick = () => {
      if (itemDisplay.classList.contains("disabled")) return
      if (this.items.length == 0) {
        itemList.style.height = ""
        return
      }
      this.createDropdown()
      if (itemList.style.height == "") {
        itemList.style.width =
          Math.max(itemList.scrollWidth, itemDisplay.clientWidth) + "px"
        itemList.style.height = itemList.scrollHeight + "px"
        Array.from(itemList.children).forEach((child, index) => {
          ;(child as HTMLElement).style.animationDelay = index * 0.02 + "s"
        })
      } else {
        itemList.style.height = ""
      }
    }
    window.addEventListener("click", e => {
      const target = e.target as HTMLElement
      if (!target.closest(".dropdown") || target.closest(".dropdown") != view)
        itemList.style.height = ""
    })
    this.view.appendChild(itemDisplay)
    this.view.appendChild(itemList)
    this.setSelected()
  }

  onChange(handler: (value: T) => void) {
    this.onChangeHandlers.push(handler)
  }

  removeHandler(handler: (value: T) => void) {
    if (!this.onChangeHandlers.includes(handler)) return
    this.onChangeHandlers.splice(this.onChangeHandlers.indexOf(handler), 1)
  }

  setItems(items: readonly T[]) {
    this.items = items
    if (!items.includes(this.selectedItem)) {
      this.selectedItem = this.items[0]
      this.setSelected()
    }
  }

  setSelected(item?: T) {
    this.selectedItem = item ?? this.selectedItem
    const itemDisplay: HTMLElement =
      this.view.querySelector(".dropdown-selected")!
    itemDisplay.innerText = this.selectedItem ? this.selectedItem + "" : ""
  }

  closeDropdown() {
    const itemList = this.view.querySelector<HTMLDivElement>(".dropdown-items")
    if (!itemList) return
    itemList.style.height = ""
  }

  get value(): T {
    return this.selectedItem
  }

  get disabled(): boolean {
    return this.view
      .querySelector(".dropdown-selected")!
      .classList.contains("disabled")
  }

  set disabled(value: boolean) {
    if (value)
      this.view.querySelector(".dropdown-selected")!.classList.add("disabled")
    else
      this.view
        .querySelector(".dropdown-selected")!
        .classList.remove("disabled")
  }

  private createDropdown() {
    const itemList: HTMLElement = this.view.querySelector(".dropdown-items")!
    const children: HTMLDivElement[] = this.items.map(item => {
      const itemEl = document.createElement("div")
      itemEl.classList.add("dropdown-item")
      itemEl.innerText = item + ""
      itemEl.onclick = () => {
        itemList.style.height = ""
        if (this.selectedItem != item) {
          this.setSelected(item)
          this.onChangeHandlers.forEach(handler => handler(item))
        }
      }
      return itemEl
    })
    itemList.replaceChildren(...children)
  }
}
