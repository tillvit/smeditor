import {
  getOriginPrivateDirectory,
  showSaveFilePicker,
  support,
} from "file-system-access"
import JSZip from "jszip"
import { WaterfallManager } from "../gui/element/WaterfallManager"
import { SafariFileWorker } from "./SafariFileWorker"
import { basename, dirname, extname, getBrowser } from "./Util"

const SEPERATOR = window.nw?.require("path").sep ?? "/"

export class FileHandler {
  private static _root: FileSystemDirectoryHandle
  private static persistentFiles = false

  static get root(): FileSystemDirectoryHandle {
    if (!this._root) this.init()
    return this._root
  }

  static init() {
    if (window.nw) {
      getOriginPrivateDirectory(
        import("./node-adapter/NodeAdapter.js"),
        SEPERATOR
      ).then(root => (this._root = root))
      this.persistentFiles = true
    } else {
      if (support.adapter.native && !getBrowser().includes("Safari")) {
        getOriginPrivateDirectory().then(root => (this._root = root))
        this.persistentFiles = true
      } else {
        getOriginPrivateDirectory(
          import("file-system-access/lib/adapters/memory.js")
        ).then(root => (this._root = root))
      }
    }
  }

  static isPersistent(): boolean {
    return this.persistentFiles
  }

  static async uploadHandle(
    handle: FileSystemFileHandle | FileSystemDirectoryHandle,
    base?: FileSystemDirectoryHandle | string
  ): Promise<void> {
    let baseHandle: FileSystemDirectoryHandle
    if (typeof base == "string") {
      const basedir = await this.getDirectoryHandle(base, { create: true })
      if (!basedir) return
      baseHandle = basedir
    } else {
      baseHandle = base ?? this.root
    }
    if (handle.kind == "file") {
      const fileHandle = await baseHandle.getFileHandle(handle.name, {
        create: true,
      })
      await this.writeFile(fileHandle, await handle.getFile())
    } else {
      const dirHandle = await baseHandle.getDirectoryHandle(handle.name, {
        create: true,
      })
      const promises = []
      for await (const fileHandle of handle.values()) {
        promises.push(this.uploadHandle(fileHandle, dirHandle))
      }
      await Promise.all(promises)
    }
  }

  static async uploadFiles(
    item: FileSystemEntry,
    base?: FileSystemDirectoryHandle | string
  ): Promise<void> {
    let dirHandle: FileSystemDirectoryHandle
    if (typeof base == "string") {
      const basedir = await this.getDirectoryHandle(base, { create: true })
      if (!basedir) return
      dirHandle = basedir
    } else {
      dirHandle = base ?? this.root
    }
    if (item.isFile) {
      const file = item as FileSystemFileEntry
      if (file.name == ".DS_Store") return
      else
        file.file(async file => {
          const fileHandle = await dirHandle.getFileHandle(file.name, {
            create: true,
          })
          await this.writeHandle(fileHandle, file)
        })
    } else if (item.isDirectory) {
      const dirReader = (<FileSystemDirectoryEntry>item).createReader()
      const newDir = await dirHandle.getDirectoryHandle(item.name, {
        create: true,
      })
      for await (const existingHandle of newDir.values()) {
        await newDir.removeEntry(existingHandle.name, { recursive: true })
      }
      dirReader.readEntries(async entries => {
        const promises = []
        for (let i = 0; i < entries.length; i++) {
          promises.push(this.uploadFiles(entries[i], newDir))
        }
        await Promise.all(promises)
      })
    }
  }

  static async handleDropEvent(event: DragEvent, prefix?: string) {
    event.stopPropagation()
    event.preventDefault()

    const items = event.dataTransfer!.items
    if (!prefix) {
      prefix = ""
      for (let i = 0; i < items.length; i++) {
        const item = items[i].webkitGetAsEntry()
        if (item?.isFile) {
          if (item.name.endsWith(".sm") || item.name.endsWith(".ssc")) {
            prefix = "New Song"
            break
          }
        }
      }
    }

    const queue = []
    for (let i = 0; i < items.length; i++) {
      const item = items[i].webkitGetAsEntry()
      if (!item) continue
      queue.push(this.uploadFiles(item, prefix))
    }
    let returnVal = undefined
    if (items.length == 1 && items[0].webkitGetAsEntry()!.isDirectory)
      returnVal = items[0].webkitGetAsEntry()!.name
    await Promise.all(queue)
    return returnVal
  }

  static async uploadDir(
    dir: FileSystemDirectoryHandle,
    base?: FileSystemDirectoryHandle | string
  ): Promise<void> {
    let baseHandle: FileSystemDirectoryHandle
    if (typeof base == "string") {
      const basedir = await this.getDirectoryHandle(base)
      if (!basedir) return
      baseHandle = basedir
    } else {
      baseHandle = base ?? this.root
    }
    const dirHandle = await baseHandle.getDirectoryHandle(dir.name, {
      create: true,
    })
    for await (const handle of dir.values()) {
      if (handle.kind == "file") {
        const fileHandle = await dirHandle.getFileHandle(handle.name, {
          create: true,
        })
        const file = await handle.getFile()
        await this.writeHandle(fileHandle, file)
      } else {
        await this.uploadDir(handle, dirHandle)
      }
    }
  }

  static async getDirectoryHandle(
    path: string,
    options?: FileSystemGetFileOptions,
    dir?: FileSystemDirectoryHandle
  ): Promise<FileSystemDirectoryHandle | undefined> {
    dir ||= this.root
    if (path == "" || path == ".") return dir
    try {
      const pathParts = this.resolvePath(path).split(SEPERATOR)
      const dirname = pathParts.shift()!
      const dirHandle = await dir.getDirectoryHandle(dirname, options)
      if (!dirHandle) return undefined
      if (pathParts.length == 0) return dirHandle
      return this.getDirectoryHandle(
        pathParts.join(SEPERATOR),
        options,
        dirHandle
      )
    } catch (err) {
      console.log(err)
      return undefined
    }
  }

  static async getFileHandle(
    path: string,
    options?: FileSystemGetFileOptions
  ): Promise<FileSystemFileHandle | undefined> {
    try {
      const pathParts = this.resolvePath(path).split(SEPERATOR)
      const filename = pathParts.pop()!
      const dirHandle = await this.getDirectoryHandle(
        pathParts.join(SEPERATOR),
        options
      )
      if (!dirHandle) return undefined
      return await dirHandle.getFileHandle(filename, options)
    } catch (err) {
      console.log(err)
      return undefined
    }
  }

  static async getFileHandleRelativeTo(
    absolutePath: string,
    relativePath: string
  ): Promise<FileSystemFileHandle | undefined> {
    try {
      if (extname(absolutePath) != "") absolutePath = dirname(absolutePath)
      return this.getFileHandle(
        this.resolvePath(absolutePath + SEPERATOR + relativePath)
      )
    } catch (err) {
      console.log(err)
      return undefined
    }
  }

  static async getDirectoryFiles(
    path: FileSystemDirectoryHandle | string
  ): Promise<FileSystemFileHandle[]> {
    try {
      let dirHandle
      if (typeof path == "string") {
        dirHandle = await this.getDirectoryHandle(path)
        if (!dirHandle) return []
      } else {
        dirHandle = path
      }
      const files: FileSystemFileHandle[] = []
      for await (const entry of dirHandle.values()) {
        if (entry.kind == "file") files.push(entry)
      }
      return files
    } catch (err) {
      console.log(err)
      return []
    }
  }

  static async getDirectoryFolders(
    path: FileSystemDirectoryHandle | string
  ): Promise<FileSystemDirectoryHandle[]> {
    try {
      let dirHandle
      if (typeof path == "string") {
        dirHandle = await this.getDirectoryHandle(path)
        if (!dirHandle) return []
      } else {
        dirHandle = path
      }
      const files: FileSystemDirectoryHandle[] = []
      for await (const entry of dirHandle.values()) {
        if (entry.kind == "directory") files.push(entry)
      }
      return files
    } catch (err) {
      console.log(err)
      return []
    }
  }

  static async writeFile(
    path: FileSystemFileHandle | string,
    data: File | string
  ) {
    let fileHandle
    if (typeof path == "string") {
      fileHandle = await this.getFileHandle(path, { create: true })
      if (!fileHandle) return
    } else {
      fileHandle = path
    }
    await this.writeHandle(fileHandle, data)
    return
  }

  static async removeFile(path: string, options?: FileSystemRemoveOptions) {
    try {
      const dir = dirname(path)
      const dirHandle = await this.getDirectoryHandle(dir)
      if (!dirHandle) return
      await dirHandle.removeEntry(basename(path), options)
    } catch (err) {
      console.log(err)
      return
    }
  }

  static async removeDirectory(path: string) {
    return this.removeFile(path, { recursive: true })
  }

  static async remove(path: string) {
    if (extname(path) == "") {
      return this.removeDirectory(path)
    } else {
      return this.removeFile(path)
    }
  }

  static resolvePath(path: string): string {
    let pathParts = path.split(SEPERATOR)
    pathParts = pathParts.filter(item => item != "." && item != "")
    while (pathParts.indexOf("..") > -1) {
      const ind = pathParts.indexOf("..")
      if (ind == 0) {
        throw Error("Path" + pathParts.join(SEPERATOR) + "is invalid!")
      }
      pathParts.splice(ind - 1, 2)
    }
    return pathParts.join(SEPERATOR)
  }

  static async zipDirectory(path: string, folderZip?: JSZip) {
    const zip = folderZip ?? new JSZip()
    const dirName = extname(path) == "" ? path : dirname(path)
    const dirHandle = await this.getDirectoryHandle(dirName)
    if (!dirHandle) return undefined
    for (const fileHandle of await this.getDirectoryFiles(dirHandle)) {
      zip.file(fileHandle.name, await fileHandle.getFile())
    }
    for (const directoryHandle of await this.getDirectoryFolders(dirHandle)) {
      const zipFolder = zip.folder(directoryHandle.name)
      if (!zipFolder) {
        console.error(
          "Failed to zip folder " + path + SEPERATOR + directoryHandle.name
        )
        continue
      }
      this.zipDirectory(path + SEPERATOR + directoryHandle.name, zipFolder)
    }
    return zip
  }

  static async saveDirectory(path: string) {
    const dirName = extname(path) == "" ? path : dirname(path)
    WaterfallManager.create("Exporting " + dirName + ".zip")
    const fileHandle = await showSaveFilePicker({
      _preferPolyfill: false,
      suggestedName: `${dirName}.zip`,
      types: [{ accept: { "application/zip": [".zip"] } }],
      excludeAcceptAllOption: false,
    })
    const zip = await this.zipDirectory(path)
    if (!zip) return
    await zip.generateAsync({ type: "blob" }).then(async blob => {
      await this.writeHandle(fileHandle, blob)
    })
  }

  static async renameFile(path: string, pathTo: string) {
    if (path == pathTo) return
    try {
      const baseFromDirHandle = await this.getDirectoryHandle(dirname(path))
      const baseToDirHandle = await this.getDirectoryHandle(dirname(pathTo), {
        create: true,
      })
      const fileHandle = await this.getFileHandle(path)
      if (!baseFromDirHandle || !baseToDirHandle || !fileHandle) return
      await this.copyToHandle(baseToDirHandle, fileHandle, basename(pathTo))
      await baseFromDirHandle.removeEntry(basename(path))
    } catch (err) {
      console.log(err)
    }
  }

  static async renameDirectory(path: string, pathTo: string) {
    if (pathTo.startsWith(path)) return
    try {
      const baseFromDirHandle = await this.getDirectoryHandle(dirname(path))
      const baseToDirHandle = await this.getDirectoryHandle(dirname(pathTo), {
        create: true,
      })
      const dirHandle = await this.getDirectoryHandle(path)
      if (!baseFromDirHandle || !baseToDirHandle || !dirHandle) return
      await this.copyToHandle(baseToDirHandle, dirHandle, basename(pathTo))
      await baseFromDirHandle.removeEntry(basename(path), { recursive: true })
    } catch (err) {
      console.log(err)
    }
  }

  static async copyToHandle(
    directory: FileSystemDirectoryHandle,
    handle: FileSystemDirectoryHandle | FileSystemFileHandle,
    name?: string
  ) {
    try {
      if (handle.kind == "directory") {
        const newDirHandle = await directory.getDirectoryHandle(
          name ?? handle.name,
          {
            create: true,
          }
        )
        const promises = []
        for await (const newHandle of handle.values()) {
          promises.push(this.copyToHandle(newDirHandle, newHandle))
        }
        await Promise.all(promises)
      } else {
        const file = await handle.getFile()
        const newFileHandle = await directory.getFileHandle(
          name ?? handle.name,
          {
            create: true,
          }
        )
        await this.writeHandle(newFileHandle, file)
      }
    } catch (err) {
      console.log(err)
    }
  }

  static getRelativePath(from: string, to: string): string {
    const fromParts = from.split(SEPERATOR)
    const toParts = to.split(SEPERATOR)

    const length = Math.min(fromParts.length, toParts.length)
    let samePartsLength = length
    for (let i = 0; i < length; i++) {
      if (fromParts[i] !== toParts[i]) {
        samePartsLength = i
        break
      }
    }

    if (samePartsLength == 0) return to

    let outputParts = []
    for (let i = samePartsLength; i < fromParts.length; i++) {
      outputParts.push("..")
    }

    outputParts = outputParts.concat(toParts.slice(samePartsLength))

    return outputParts.join(SEPERATOR)
  }

  private static async writeHandle(
    handle: FileSystemFileHandle,
    data: Blob | string
  ) {
    if (handle.createWritable) {
      const writable = await handle.createWritable()
      await writable.write(data)
      await writable.close()
    } else {
      const path = await this.root.resolve(handle)
      if (!path) return
      await SafariFileWorker.writeHandle(path.join(SEPERATOR), data)
    }
  }
}

export const fsRoot = FileHandler.root
