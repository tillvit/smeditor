export class Dropdown {

  view: HTMLDivElement

  private items: string[] = []
  private selectedItem: string = ""
  private onChangeHandlers: ((value: string) => void)[] = []

  static create(items?: string[], selectedItem?: string) {
    return new Dropdown(document.createElement("div"), items, selectedItem)
  }

  private constructor(view: HTMLDivElement, items?: string[], selectedItem?: string) {
    this.view = view
    view.classList.add("dropdown")
    this.items = items ?? []
    this.selectedItem = selectedItem ?? this.items[0] ?? ""
    let itemDisplay = document.createElement("div")
    itemDisplay.classList.add("dropdown-selected")
    let itemList = document.createElement("div")
    itemList.classList.add("dropdown-items")
    itemList.style.display = "none"
    itemDisplay.onclick = () => {
      this.createDropdown()
      if (itemList.style.display == "none") {
        itemList.style.display = "block"
      } else {
        itemList.style.display = "none"
      }
    }
    window.addEventListener("click", (e) => {
      let target = e.target as HTMLElement
      if (!target.closest(".dropdown")) itemList.style.display = "none"
    })
    this.view.appendChild(itemDisplay)
    this.view.appendChild(itemList)
    this.setSelected()
  }

  onChange(handler: (value: string) => void) {
    this.onChangeHandlers.push(handler)
  }

  removeHandler(handler: (value: string) => void) {
    if (!this.onChangeHandlers.includes(handler)) return
    this.onChangeHandlers.splice(this.onChangeHandlers.indexOf(handler), 1)
  }

  setItems(items: string[]) {
    this.items = items
    if (!items.includes(this.selectedItem)) {
      this.selectedItem = this.items[0] ?? ""
      this.setSelected()
    }
  }

  setSelected(item?: string) {
    this.selectedItem = item ?? this.selectedItem 
    let itemDisplay = this.view.querySelector(".dropdown-selected")! as HTMLDivElement
    itemDisplay.innerText = this.selectedItem
  }

  private createDropdown() {
    let itemList = this.view.querySelector(".dropdown-items")! as HTMLDivElement
    let children: HTMLDivElement[] = this.items.map(item => {
      let itemEl = document.createElement("div")
      itemEl.classList.add("dropdown-item")
      itemEl.innerText = item
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