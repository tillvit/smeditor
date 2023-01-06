export interface DropdownItem<T> {
  label: string,
  value: T
}

export interface DropdownGroup<T> {
  label: string,
  options: DropdownItem<T>[]
}

export class Dropdown<T> {

  view: HTMLDivElement

  private items: readonly T[] = []
  private selectedItem: T
  private onChangeHandlers: ((value: T) => void)[] = []

  static create<T>(items?: readonly T[], selectedItem?: T) {
    return new Dropdown(document.createElement("div"), items, selectedItem)
  }

  private constructor(view: HTMLDivElement, items?: readonly T[], selectedItem?: T) {
    this.view = view
    view.classList.add("dropdown")
    this.items = items ?? []
    this.selectedItem = selectedItem ?? this.items[0]
    let itemDisplay = document.createElement("div")
    itemDisplay.classList.add("dropdown-selected")
    let itemList = document.createElement("div")
    itemList.classList.add("dropdown-items")
    itemList.style.display = "none"
    itemDisplay.onclick = () => {
      if (this.items.length == 0) {
        itemList.style.display = "none"
        return
      }
      this.createDropdown()
      if (itemList.style.display == "none") {
        itemList.style.display = "block"
      } else {
        itemList.style.display = "none"
      }
    }
    window.addEventListener("click", (e) => {
      let target = e.target as HTMLElement
      if (!target.closest(".dropdown") || target.closest(".dropdown") != view) itemList.style.display = "none"
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
    let itemDisplay = this.view.querySelector(".dropdown-selected")! as HTMLDivElement
    itemDisplay.innerText = this.selectedItem ? this.selectedItem + "" : ""
  }

  private createDropdown() {
    let itemList = this.view.querySelector(".dropdown-items")! as HTMLDivElement
    let children: HTMLDivElement[] = this.items.map(item => {
      let itemEl = document.createElement("div")
      itemEl.classList.add("dropdown-item")
      itemEl.innerText = item + ""
      itemEl.onclick = () => {
        itemList.style.display = "none"
        if (this.selectedItem != item){
          this.onChangeHandlers.forEach(handler => handler(item))
          this.setSelected(item)
        }
      }
      return itemEl
    })
    itemList.replaceChildren(...children)
  }
}