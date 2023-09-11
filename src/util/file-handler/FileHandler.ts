import { WebFileHandler } from "./WebFileHandler"

export interface BaseFileHandler {
  handleDropEvent(
    event: DragEvent,
    prefix?: string
  ): Promise<string | undefined>

  getDirectoryHandle(
    path: string,
    options?: FileSystemGetFileOptions,
    dir?: FileSystemDirectoryHandle
  ): Promise<FileSystemDirectoryHandle | undefined>

  getFileHandle(
    path: string,
    options?: FileSystemGetFileOptions
  ): Promise<FileSystemFileHandle | undefined>

  getFileHandleRelativeTo(
    absolutePath: string,
    relativePath: string
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

export const FileHandler = window.nw
  ? new (await import("./NodeFileHandler")).NodeFileHandler()
  : new WebFileHandler()
