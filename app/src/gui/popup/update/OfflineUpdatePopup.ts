import { UpdatePopup } from "./UpdatePopup"

export class OfflineUpdatePopup extends UpdatePopup {
  static open() {
    super.build({
      title: `SMEditor was loaded offline!`,
      desc: "You can now use SMEditor without an internet connection.",
      options: [],
    })
    setTimeout(() => this.close(), 5000)
  }
}
