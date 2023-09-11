import { FileSystemDirectoryHandle } from "file-system-access"
import { SafariFileWorker } from "../SafariFileWorker"
import { FolderHandle } from "../node-adapter/NodeAdapter"
import { BaseFileHandler } from "./FileHandler"

const join: (...paths: string[]) => string = window.nw.require("path").join

export class NodeFileHandler implements BaseFileHandler {
  private root = new FileSystemDirectoryHandle(new FolderHandle("."))

  async handleDropEvent(event: DragEvent, _prefix?: string) {
    event.stopPropagation()
    event.preventDefault()

    const items = event.dataTransfer!.items
    console.log(items)
    return ""
    // if (!prefix) {
    //   prefix = ""
    //   for (let i = 0; i < items.length; i++) {
    //     const item = items[i].webkitGetAsEntry()
    //     if (item?.isFile) {
    //       if (item.name.endsWith(".sm") || item.name.endsWith(".ssc")) {
    //         prefix = "New Song"
    //         break
    //       }
    //     }
    //   }
    // }

    // const queue = []
    // for (let i = 0; i < items.length; i++) {
    //   const item = items[i].webkitGetAsEntry()
    //   if (!item) continue
    //   queue.push(this.uploadFiles(item, prefix))
    // }
    // let returnVal = undefined
    // if (items.length == 1 && items[0].webkitGetAsEntry()!.isDirectory)
    //   returnVal = items[0].webkitGetAsEntry()!.name
    // await Promise.all(queue)
    // return returnVal
  }

  async getDirectoryHandle(
    path: string,
    options?: FileSystemGetFileOptions,
    _dir?: FileSystemDirectoryHandle
  ): Promise<FileSystemDirectoryHandle | undefined> {
    try {
      return this.root.getDirectoryHandle(path, options)
    } catch (err) {
      console.error(`Failed to get directory ${path}): ` + err)
      return undefined
    }
  }

  async getFileHandle(
    path: string,
    options?: FileSystemGetFileOptions
  ): Promise<FileSystemFileHandle | undefined> {
    try {
      return this.root.getFileHandle(path, options)
    } catch (err) {
      console.error("Failed to get file " + path + ": " + err)
      return undefined
    }
  }

  async getFileHandleRelativeTo(
    absolutePath: string,
    relativePath: string
  ): Promise<FileSystemFileHandle | undefined> {
    try {
      const dir = await this.root.getDirectoryHandle(absolutePath)
      return dir.getFileHandle(relativePath)
    } catch (err) {
      console.error("Failed to get relative file " + relativePath + ": " + err)
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

  private async writeHandle(handle: FileSystemFileHandle, data: Blob | string) {
    if (handle.createWritable) {
      const writable = await handle.createWritable()
      await writable.write(data)
      await writable.close()
    } else {
      const path = await this.root.resolve(handle)
      if (!path) return
      await SafariFileWorker.writeHandle(path.join("/"), data)
    }
  }

  getRelativePath(from: string, to: string) {
    return join(from, to)
  }
}
