import {
  getOriginPrivateDirectory,
  showSaveFilePicker,
  support,
} from "file-system-access"
import JSZip from "jszip"
import { WaterfallManager } from "../../gui/element/WaterfallManager"
import { basename, dirname, extname } from "../Path"
import { BaseFileHandler } from "./FileHandler"
import { SafariFileWriter } from "./SafariFileWriter"

export class WebFileHandler implements BaseFileHandler {
  private root!: FileSystemDirectoryHandle

  constructor() {
    if (support.adapter.native) {
      getOriginPrivateDirectory().then(root => (this.root = root))
    } else {
      getOriginPrivateDirectory(
        import("file-system-access/lib/adapters/memory.js")
      ).then(root => (this.root = root))
    }
  }

  async uploadHandle(
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

  async uploadFiles(
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

  async handleDropEvent(event: DragEvent, prefix?: string) {
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

  async uploadDir(
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

  async getDirectoryHandle(
    path: string,
    options?: FileSystemGetFileOptions,
    dir?: FileSystemDirectoryHandle
  ): Promise<FileSystemDirectoryHandle | undefined> {
    dir ||= this.root
    if (path == "" || path == ".") return dir
    const pathParts = this.resolvePath(path).split("/")
    const dirname = pathParts.shift()!
    try {
      const dirHandle = await dir.getDirectoryHandle(dirname, options)
      if (!dirHandle) return undefined
      if (pathParts.length == 0) return dirHandle
      return this.getDirectoryHandle(pathParts.join("/"), options, dirHandle)
    } catch (err) {
      console.error(`Failed to get directory ${path} (${dirname}): ` + err)
      return undefined
    }
  }

  async hasFile(path: string): Promise<boolean> {
    try {
      return (await this.getFileHandle(path)) !== undefined
    } catch (err) {
      return false
    }
  }

  async getFileHandle(
    path: string,
    options?: FileSystemGetFileOptions
  ): Promise<FileSystemFileHandle | undefined> {
    try {
      const pathParts = this.resolvePath(path).split("/")
      const filename = pathParts.pop()!
      const dirHandle = await this.getDirectoryHandle(
        pathParts.join("/"),
        options
      )
      if (!dirHandle) return undefined
      return await dirHandle.getFileHandle(filename, options)
    } catch (err) {
      console.error("Failed to get file " + path + ": " + err)
      return undefined
    }
  }

  async getFileHandleRelativeTo(
    songPath: string,
    fileName: string
  ): Promise<FileSystemFileHandle | undefined> {
    try {
      if (extname(songPath) != "") songPath = dirname(songPath)
      return this.getFileHandle(this.resolvePath(songPath + "/" + fileName))
    } catch (err) {
      console.error("Failed to get relative file " + fileName + ": " + err)
      return undefined
    }
  }

  async getDirectoryFiles(
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
      console.error(err)
      return []
    }
  }

  async getDirectoryFolders(
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
      console.error(err)
      return []
    }
  }

  async writeFile(path: FileSystemFileHandle | string, data: File | string) {
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

  async removeFile(path: string, options?: FileSystemRemoveOptions) {
    try {
      const dir = dirname(path)
      const dirHandle = await this.getDirectoryHandle(dir)
      if (!dirHandle) return
      await dirHandle.removeEntry(basename(path), options)
    } catch (err) {
      console.error(err)
      return
    }
  }

  async removeDirectory(path: string) {
    return this.removeFile(path, { recursive: true })
  }

  async remove(path: string) {
    if (extname(path) == "") {
      return this.removeDirectory(path)
    } else {
      return this.removeFile(path)
    }
  }

  resolvePath(path: string): string {
    let pathParts = path.split("/")
    pathParts = pathParts.filter(item => item != "." && item != "")
    while (pathParts.indexOf("..") > -1) {
      const ind = pathParts.indexOf("..")
      if (ind == 0) {
        throw Error("Path" + pathParts.join("/") + "is invalid!")
      }
      pathParts.splice(ind - 1, 2)
    }
    return pathParts.join("/")
  }

  async zipDirectory(path: string, folderZip?: JSZip) {
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
          "Failed to zip folder " + path + "/" + directoryHandle.name
        )
        continue
      }
      await this.zipDirectory(path + "/" + directoryHandle.name, zipFolder)
    }
    return zip
  }

  async saveDirectory(path: string) {
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

  async renameFile(path: string, pathTo: string) {
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
      console.error(err)
    }
  }

  async renameDirectory(path: string, pathTo: string) {
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
      console.error(err)
    }
  }

  async copyToHandle(
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
      console.error(err)
    }
  }

  getRelativePath(from: string, to: string): string {
    const fromParts = from.split("/")
    const toParts = to.split("/")

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

    return outputParts.join("/")
  }

  private async writeHandle(handle: FileSystemFileHandle, data: Blob | string) {
    if (handle.createWritable) {
      const writable = await handle.createWritable()
      await writable.write(data)
      await writable.close()
    } else {
      const path = await this.root.resolve(handle)
      if (!path) return
      await SafariFileWriter.writeHandle(path.join("/"), data)
    }
  }
}
