import {
  getOriginPrivateDirectory,
  showSaveFilePicker,
} from "file-system-access"
import JSZip from "jszip"
import { WaterfallManager } from "../gui/element/WaterfallManager"
import { basename, dirname, extname } from "./Util"

export class FileHandler {
  private static _root: FileSystemDirectoryHandle

  static get root(): FileSystemDirectoryHandle {
    if (!this._root) this.init()
    return this._root
  }

  static async init() {
    if (!window.isNative) {
      this._root = await getOriginPrivateDirectory()
    } else {
      this._root = await getOriginPrivateDirectory(
        import("file-system-access/lib/adapters/node.js"),
        "."
      )
    }
  }

  static async uploadFiles(
    item: FileSystemEntry,
    base?: FileSystemDirectoryHandle | string
  ): Promise<void> {
    let dirHandle: FileSystemDirectoryHandle
    if (typeof base == "string") {
      const basedir = await this.getDirectoryHandle(base)
      if (!basedir) return
      dirHandle = basedir
    } else {
      dirHandle = base ?? this.root
    }
    return new Promise(resolve => {
      if (item.isFile) {
        const file = item as FileSystemFileEntry
        file.file(async file => {
          const fileHandle = await dirHandle.getFileHandle(file.name, {
            create: true,
          })
          const writeStream = await fileHandle.createWritable()
          writeStream.write(file)
          writeStream.close()
          resolve()
        })
      } else if (item.isDirectory) {
        const dirReader = (<FileSystemDirectoryEntry>item).createReader()
        dirReader.readEntries(async entries => {
          const promises = []
          for (let i = 0; i < entries.length; i++) {
            const newDir = await dirHandle.getDirectoryHandle(item.name, {
              create: true,
            })
            promises.push(this.uploadFiles(entries[i], newDir))
          }
          await Promise.all(promises)
          resolve()
        })
      }
    })
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
        const writeStream = await fileHandle.createWritable()
        writeStream.write(file)
        writeStream.close()
      } else {
        this.uploadDir(handle, dirHandle)
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
      const pathParts = this.resolvePath(path).split("/")
      const dirname = pathParts.shift()!
      const dirHandle = await dir.getDirectoryHandle(dirname, options)
      if (!dirHandle) return undefined
      if (pathParts.length == 0) return dirHandle
      return this.getDirectoryHandle(pathParts.join("/"), options, dirHandle)
    } catch (err) {
      return undefined
    }
  }

  static async getFileHandle(
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
        this.resolvePath(absolutePath + "/" + relativePath)
      )
    } catch (err) {
      return undefined
    }
  }

  static async getDirectoryFiles(
    path: FileSystemDirectoryHandle | string
  ): Promise<FileSystemFileHandle[]> {
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
  }

  static async getDirectoryFolders(
    path: FileSystemDirectoryHandle | string
  ): Promise<FileSystemDirectoryHandle[]> {
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
  }

  static async writeFile(
    path: FileSystemFileHandle | string,
    data: FileSystemWriteChunkType
  ) {
    let fileHandle
    if (typeof path == "string") {
      fileHandle = await this.getFileHandle(path, { create: true })
      if (!fileHandle) return
    } else {
      fileHandle = path
    }
    const writeStream = await fileHandle.createWritable()
    writeStream.write(data)
    writeStream.close()
    return
  }

  static async removeFile(path: string, options?: FileSystemRemoveOptions) {
    try {
      const dir = dirname(path)
      const dirHandle = await this.getDirectoryHandle(dir)
      if (!dirHandle) return
      dirHandle.removeEntry(basename(path), options)
    } catch (err) {
      return
    }
  }

  static async removeDirectory(path: string) {
    return this.removeFile(path, { recursive: true })
  }

  static resolvePath(path: string): string {
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
          "Failed to zip folder " + path + "/" + directoryHandle.name
        )
        continue
      }
      this.zipDirectory(path + "/" + directoryHandle.name, zipFolder)
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
      await blob.stream().pipeTo(await fileHandle.createWritable())
    })
  }

  static getRelativePath(from: string, to: string): string {
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
}

export const fsRoot = FileHandler.root
