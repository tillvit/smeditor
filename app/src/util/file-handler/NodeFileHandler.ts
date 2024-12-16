import * as fsa from "file-system-access"
import { BaseFileHandler } from "./FileHandler"
import { FileHandle, FolderHandle } from "./NodeAdapter"

const {
  dirname,
  extname,
  basename,
  relative,
}: {
  dirname: (path: string) => string
  extname: (path: string) => string
  basename: (path: string) => string
  relative: (path1: string, path2: string) => string
} = window.nw.require("path")

const fs = window.nw.require("fs").promises

import { errors } from "file-system-access/lib/util.js"
import { WaterfallManager } from "../../gui/element/WaterfallManager"
const { GONE, MISMATCH } = errors

export class NodeFileHandler implements BaseFileHandler {
  async handleDropEvent(event: DragEvent, _prefix?: string) {
    event.stopPropagation()
    event.preventDefault()

    const items = event.dataTransfer!.items
    // TODO: make dropping files load sm
    console.log(items)
    return ""
  }

  async getDirectoryHandle(
    path: string,
    options?: FileSystemGetFileOptions
  ): Promise<FileSystemDirectoryHandle | undefined> {
    try {
      const stat = await fs.lstat(path).catch((err: any) => {
        if (err.code !== "ENOENT") throw err
      })
      const isDirectory =
        stat === null || stat === void 0 ? void 0 : stat.isDirectory()
      if (stat && isDirectory)
        return new fsa.FileSystemDirectoryHandle(
          new FolderHandle(path, dirname(path))
        )
      if (stat && !isDirectory) throw new DOMException(...MISMATCH)
      if (!options?.create) throw new DOMException(...GONE)
      await fs.mkdir(path)
      return new fsa.FileSystemDirectoryHandle(
        new FolderHandle(path, dirname(path))
      )
    } catch (err) {
      console.error(`Failed to get directory ${path}): ` + err)
      return undefined
    }
  }

  async hasFile(path: string): Promise<boolean> {
    return (await this.getFileHandle(path)) !== undefined
  }

  async getFileHandle(
    path: string,
    options?: FileSystemGetFileOptions
  ): Promise<FileSystemFileHandle | undefined> {
    try {
      const stat = await fs.lstat(path).catch((err: any) => {
        if (err.code !== "ENOENT") throw err
      })
      const isFile = stat === null || stat === void 0 ? void 0 : stat.isFile()
      if (stat && isFile)
        return new fsa.FileSystemFileHandle(
          new FileHandle(path, basename(path))
        )
      if (stat && !isFile) throw new DOMException(...MISMATCH)
      if (!options?.create) throw new DOMException(...GONE)
      await (await fs.open(path, "w")).close()
      return new fsa.FileSystemFileHandle(new FileHandle(path, basename(path)))
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
      const dir = await this.getDirectoryHandle(songPath)
      if (!dir) {
        throw new DOMException(...GONE)
      }
      return await dir.getFileHandle(fileName)
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
      if (!fileHandle) {
        WaterfallManager.createFormatted(
          "Failed to write to " + path + "!",
          "error"
        )
        return
      }
    } else {
      fileHandle = path
    }
    await this.writeHandle(fileHandle, data)
    return
  }

  async removeFile(path: string): Promise<void> {
    await fs.unlink(path)
  }

  private async writeHandle(handle: FileSystemFileHandle, data: Blob | string) {
    const writable = await handle.createWritable()
    await writable.truncate(0)
    await writable.write(data)
    await writable.close()
  }

  getRelativePath(from: string, to: string) {
    return relative(from, to)
  }
}
