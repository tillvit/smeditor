import { UpdatePopup } from "./UpdatePopup"

export class AppUpdatePopup extends UpdatePopup {
  static open(versionName: string, downloadLink: string) {
    super.build({
      title: `A new version of the desktop app is available! (${versionName})`,
      desc: "Click here to download the new version.",
      options: [
        {
          label: "Close",
          type: "default",
          callback: () => this.close(),
        },
        {
          label: "Download",
          type: "confirm",
          callback: () => {
            localStorage.setItem("downloadedVersion", versionName)
            nw.require("nw.gui").Shell.openExternal(downloadLink)
            this.close()
          },
        },
      ],
    })
  }
}
