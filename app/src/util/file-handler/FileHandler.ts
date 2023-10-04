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

  getRelativePath(from: string, to: string): string
}

export let FileHandler: BaseFileHandler = null as unknown as BaseFileHandler

export async function initFileSystem() {
  FileHandler = window.nw
    ? new (await import("./NodeFileHandler")).NodeFileHandler()
    : new WebFileHandler()
}
