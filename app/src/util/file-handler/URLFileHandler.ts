import { errors } from "file-system-access/lib/util"
import { extname } from "../Path"
import { BaseFileHandler } from "./FileHandler"
const { GONE } = errors

FileSystemFileHandle

class URLFileHandle {
  private readonly _path
  readonly kind = "file"
  readonly name
  readonly isFile = true
  readonly isDirectory = false
  constructor(path: string) {
    this._path = path
    this.name = new URL(path).pathname.split("/").pop() ?? ""
  }
  async getFile() {
    return fetch(this._path)
      .then(response => response.blob())
      .then(blob => new File([blob], this.name))
      .catch(() => {
        throw new DOMException(...GONE)
      })
  }
  async createWritable(): Promise<FileSystemWritableFileStream> {
    throw Error("Cannot call createWriteable from a URLFileHandle")
  }

  async isSameEntry(other: FileSystemHandle) {
    if (!(FileSystemHandle instanceof URLFileHandle)) return false
    return (other as unknown as URLFileHandle)._path == this._path
  }

  async queryPermission(): Promise<PermissionState> {
    return "granted"
  }

  async requestPermission(): Promise<PermissionState> {
    return "granted"
  }
}

export class URLFileHandler implements BaseFileHandler {
  async handleDropEvent(_: DragEvent, _2?: string): Promise<undefined> {
    throw Error("Cannot call handleDropEvent from a URLFileHandler")
  }
  async getDirectoryHandle(
    _: string,
    _2?: FileSystemGetFileOptions,
    _3?: FileSystemDirectoryHandle
  ): Promise<FileSystemDirectoryHandle | undefined> {
    throw Error("Cannot call getDirectoryHandle from a URLFileHandler")
  }

  async hasFile(path: string): Promise<boolean> {
    return fetch(path)
      .then(response => {
        return response.ok
      })
      .catch(() => {
        return false
      })
  }

  async getFileHandle(
    path: string,
    _?: FileSystemGetFileOptions
  ): Promise<FileSystemFileHandle | undefined> {
    try {
      if (!(await this.hasFile(path))) {
        throw new DOMException(...GONE)
      }
      return new URLFileHandle(path)
    } catch (err) {
      console.error("Failed to get file " + path + ": " + err)
      return undefined
    }
  }

  async getFileHandleRelativeTo(
    songPath: string,
    fileName: string
  ): Promise<FileSystemFileHandle | undefined> {
    const songURL = new URL(songPath)
    if (extname(songURL.pathname) != "")
      songURL.pathname = songURL.pathname.split("/").slice(0, -1).join("/")
    songURL.pathname += "/" + fileName
    try {
      return this.getFileHandle(songURL.toString())
    } catch (err) {
      console.error("Failed to get relative file " + songURL + ": " + err)
      return undefined
    }
  }

  async getDirectoryFiles(
    _: FileSystemDirectoryHandle | string
  ): Promise<FileSystemFileHandle[]> {
    throw Error("Cannot call getDirectoryFiles from a URLFileHandler")
  }

  async getDirectoryFolders(
    _: FileSystemDirectoryHandle | string
  ): Promise<FileSystemDirectoryHandle[]> {
    throw Error("Cannot call getDirectoryFolders from a URLFileHandler")
  }

  async writeFile(_: FileSystemFileHandle | string, _2: File | string) {
    throw Error("Cannot save to a URL file!")
  }

  async removeFile(_: string) {
    throw Error("Cannot remove a URL file!")
  }

  getRelativePath(_: string, _2: string): string {
    throw Error("Cannot call getRelativePath from a URLFileHandler")
  }

  resolvePath(): string {
    throw Error("Cannot call resolvePath from a URLFileHandler")
  }
}
