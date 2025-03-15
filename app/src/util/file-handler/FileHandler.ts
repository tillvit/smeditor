import { URLFileHandler } from "./URLFileHandler"
import { WebFileHandler } from "./WebFileHandler"

export interface BaseFileHandler {
  handleDropEvent(
    event: DragEvent,
    prefix?: string
  ): Promise<string | undefined>

  getDirectoryHandle(
    path: string,
    options?: FileSystemGetFileOptions
  ): Promise<FileSystemDirectoryHandle | undefined>

  hasFile(path: string): Promise<boolean>

  getFileHandle(
    path: string,
    options?: FileSystemGetFileOptions
  ): Promise<FileSystemFileHandle | undefined>

  getFileHandleRelativeTo(
    songPath: string,
    fileName: string
  ): Promise<FileSystemFileHandle | undefined>

  getDirectoryFiles(
    path: FileSystemDirectoryHandle | string
  ): Promise<FileSystemFileHandle[]>

  getDirectoryFolders(
    path: FileSystemDirectoryHandle | string
  ): Promise<FileSystemDirectoryHandle[]>

  writeFile(
    path: FileSystemFileHandle | string,
    data: File | string
  ): Promise<void>

  removeFile(path: FileSystemFileHandle | string): Promise<void>

  getRelativePath(from: string, to: string): string

  resolvePath(...parts: string[]): string
}

export class FileHandler {
  private static standardHandler?: BaseFileHandler
  private static urlHandler?: URLFileHandler

  static async initFileSystem() {
    this.urlHandler = new URLFileHandler()
    this.standardHandler = window.nw
      ? new (await import("./NodeFileHandler")).NodeFileHandler()
      : new WebFileHandler()
  }

  static getStandardHandler() {
    return this.standardHandler
  }

  private static getHandler(url?: string): BaseFileHandler {
    if (
      (url !== undefined && url.startsWith("https://")) ||
      url?.startsWith("http://")
    ) {
      return this.urlHandler!
    }

    return this.standardHandler!
  }

  static handleDropEvent(event: DragEvent, prefix?: string) {
    return this.getHandler().handleDropEvent(event, prefix)
  }

  static getDirectoryHandle(
    path: string,
    options?: FileSystemGetFileOptions
  ): Promise<FileSystemDirectoryHandle | undefined> {
    return FileHandler.getHandler(path).getDirectoryHandle(path, options)
  }

  static hasFile(path: string): Promise<boolean> {
    return FileHandler.getHandler(path).hasFile(path)
  }

  static getFileHandle(
    path: string,
    options?: FileSystemGetFileOptions
  ): Promise<FileSystemFileHandle | undefined> {
    return FileHandler.getHandler(path).getFileHandle(path, options)
  }

  static getFileHandleRelativeTo(
    songPath: string,
    fileName: string
  ): Promise<FileSystemFileHandle | undefined> {
    return FileHandler.getHandler(songPath).getFileHandleRelativeTo(
      songPath,
      fileName
    )
  }

  static getDirectoryFiles(
    path: FileSystemDirectoryHandle | string
  ): Promise<FileSystemFileHandle[]> {
    return FileHandler.getHandler(
      typeof path == "string" ? path : undefined
    ).getDirectoryFiles(path)
  }

  static getDirectoryFolders(
    path: FileSystemDirectoryHandle | string
  ): Promise<FileSystemDirectoryHandle[]> {
    return FileHandler.getHandler(
      typeof path == "string" ? path : undefined
    ).getDirectoryFolders(path)
  }

  static writeFile(
    path: FileSystemFileHandle | string,
    data: File | string
  ): Promise<void> {
    return FileHandler.getHandler(
      typeof path == "string" ? path : undefined
    ).writeFile(path, data)
  }

  static removeFile(path: string): Promise<void> {
    return FileHandler.getHandler(path).removeFile(path)
  }

  static getRelativePath(from: string, to: string): string {
    return FileHandler.getHandler().getRelativePath(from, to)
  }
}
