export class UpdatePopup {
  static popup?: HTMLDivElement

  static open(versionName: string, downloadLink: string) {
    this.popup = this.build(versionName, downloadLink)
    document.getElementById("popups")?.appendChild(this.popup)
  }

  private static build(versionName: string, downloadLink: string) {
    const popup = document.createElement("div")
    popup.classList.add("update-popup")
    const title = document.createElement("div")
    title.classList.add("title")
    title.innerText = `A new version of the desktop app is available! (${versionName})`
    const desc = document.createElement("div")
    desc.classList.add("desc")
    desc.innerText = "Click here to download the new version."
    popup.replaceChildren(title, desc)
    popup.onclick = () => {
      localStorage.setItem("downloadedVersion", versionName)
      nw.require("nw.gui").Shell.openExternal(downloadLink)
      this.close()
    }
    return popup
  }

  static close() {
    if (!this.popup) return
    this.popup.style.opacity = "0"
    this.popup.onclick = null
    setTimeout(() => this.popup!.remove(), 300)
  }
}
