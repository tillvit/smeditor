/// <reference types="node" />
/// <reference types="wicg-file-system-access" />

import {
  Adapter,
  FileSystemFileHandleAdapter,
  FileSystemFolderHandleAdapter,
  WriteChunk,
} from "../interfaces.js"
export declare class Sink implements UnderlyingSink<WriteChunk> {
  private fileHandle
  private size
  private path
  private position
  constructor(fileHandle: fs.FileHandle, path: string, size: number)
  abort(): Promise<void>
  write(chunk: WriteChunk): Promise<void>
  close(): Promise<void>
}
export declare class FileHandle implements FileSystemFileHandleAdapter {
  #private
  readonly kind = "file"
  readonly name: string
  private _path
  writable: boolean
  constructor(path: string, name: string)
  getFile(): Promise<File>
  isSameEntry(other: FileHandle): Promise<boolean>
  createWritable(): Promise<Sink>
}
export declare class FolderHandle implements FileSystemFolderHandleAdapter {
  readonly kind = "directory"
  readonly name: string
  private _path
  writable: boolean
  constructor(path?: string, name?: string)
  isSameEntry(other: FolderHandle): Promise<boolean>
  entries(): AsyncGenerator<
    [string, FileHandle] | [string, FolderHandle],
    void,
    unknown
  >
  getDirectoryHandle(
    name: string,
    opts?: FileSystemGetDirectoryOptions
  ): Promise<FolderHandle>
  getFileHandle(
    name: string,
    opts?: FileSystemGetFileOptions
  ): Promise<FileHandle>
  queryPermission(): Promise<PermissionState>
  removeEntry(name: string, opts: FileSystemRemoveOptions): Promise<void>
}
declare const adapter: Adapter<string>
export default adapter
