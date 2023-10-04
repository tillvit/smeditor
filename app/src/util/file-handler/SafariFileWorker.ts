// hacky type stuff
interface SecureFileSystemFileHandle extends FileSystemHandle {
  readonly kind: "file"
  /** [MDN Reference](https://developer.mozilla.org/docs/Web/API/FileSystemFileHandle/createSyncAccessHandle) */
  createSyncAccessHandle(): Promise<FileSystemSyncAccessHandle>
  /** [MDN Reference](https://developer.mozilla.org/docs/Web/API/FileSystemFileHandle/createWritable) */
  createWritable(
    options?: FileSystemCreateWritableOptions
  ): Promise<FileSystemWritableFileStream>
  /** [MDN Reference](https://developer.mozilla.org/docs/Web/API/FileSystemFileHandle/getFile) */
  getFile(): Promise<File>
}

interface FileSystemSyncAccessHandle {
  /** [MDN Reference](https://developer.mozilla.org/docs/Web/API/FileSystemSyncAccessHandle/close) */
  close(): void
  /** [MDN Reference](https://developer.mozilla.org/docs/Web/API/FileSystemSyncAccessHandle/flush) */
  flush(): void
  /** [MDN Reference](https://developer.mozilla.org/docs/Web/API/FileSystemSyncAccessHandle/getSize) */
  getSize(): number
  /** [MDN Reference](https://developer.mozilla.org/docs/Web/API/FileSystemSyncAccessHandle/read) */
  read(
    buffer: AllowSharedBufferSource,
    options?: FileSystemReadWriteOptions
  ): number
  /** [MDN Reference](https://developer.mozilla.org/docs/Web/API/FileSystemSyncAccessHandle/truncate) */
  truncate(newSize: number): void
  /** [MDN Reference](https://developer.mozilla.org/docs/Web/API/FileSystemSyncAccessHandle/write) */
  write(
    buffer: AllowSharedBufferSource,
    options?: FileSystemReadWriteOptions
  ): number
}

interface FileSystemReadWriteOptions {
  at?: number
}

onmessage = async event => {
  const [id, path, buffer] = event.data
  const fileHandle = await getFileHandle(path)
  if (!fileHandle) {
    postMessage({
      id,
      success: false,
      error: "Couldn't locate file",
    })
    return
  }
  const accessHandle = await fileHandle.createSyncAccessHandle()
  accessHandle.write(buffer)
  accessHandle.flush()
  accessHandle.close()
  postMessage({
    id,
    success: true,
  })
}

async function getDirectoryHandle(
  path: string,
  options?: FileSystemGetFileOptions,
  dir?: FileSystemDirectoryHandle
): Promise<FileSystemDirectoryHandle | undefined> {
  dir ||= await navigator.storage.getDirectory()
  if (path == "" || path == ".") return dir
  const pathParts = resolvePath(path).split("/")
  const dirname = pathParts.shift()!
  try {
    const dirHandle = await dir.getDirectoryHandle(dirname, options)
    if (!dirHandle) return undefined
    if (pathParts.length == 0) return dirHandle
    return getDirectoryHandle(pathParts.join("/"), options, dirHandle)
  } catch (err) {
    console.error(`Failed to get directory ${path} (${dirname}): ` + err)
    return undefined
  }
}

async function getFileHandle(
  path: string,
  options?: FileSystemGetFileOptions
): Promise<SecureFileSystemFileHandle | undefined> {
  try {
    const pathParts = resolvePath(path).split("/")
    const filename = pathParts.pop()!
    const dirHandle = await getDirectoryHandle(pathParts.join("/"), options)
    if (!dirHandle) return undefined
    return (await dirHandle.getFileHandle(
      filename,
      options
    )) as SecureFileSystemFileHandle
  } catch (err) {
    console.error("Failed to get file " + path + ": " + err)
    return undefined
  }
}

function resolvePath(path: string): string {
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
