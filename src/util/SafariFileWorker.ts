// WebKit is currently bugged, making this not work at all
// Thanks Apple
export class SafariFileWorker {
  private static _worker: Worker
  private static workID = 0
  private static map: Map<number, (value: void | PromiseLike<void>) => void> =
    new Map()

  private static _init() {
    const workerCode = `
      function resolvePath(path) {
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
      
      async function getFileHandle(path, options) {
        try {
          const pathParts = resolvePath(path).split("/")
          const filename = pathParts.pop()
          const dirHandle = await getDirectoryHandle(
            pathParts.join("/"),
            options
          )
          if (!dirHandle) return undefined
          return await dirHandle.getFileHandle(filename, options)
        } catch (err) {
          console.log(err)
          return undefined
        }
      }
      
      async function getDirectoryHandle(path, options, dir){
        dir ||= await navigator.storage.getDirectory()
        if (path == "" || path == ".") return dir
        try {
          const pathParts = resolvePath(path).split("/")
          const dirname = pathParts.shift()
          const dirHandle = await dir.getDirectoryHandle(dirname, options)
          if (!dirHandle) return undefined
          if (pathParts.length == 0) return dirHandle
          return getDirectoryHandle(pathParts.join("/"), options, dirHandle)
        } catch (err) {
          console.log(err)
          return undefined
        }
      }
      
      async function writeFile(path, arrayBuffer) {
        const handle = await getFileHandle(path)
        const accessHandle = await handle.createSyncAccessHandle();
        const writeSize = accessHandle.write(arrayBuffer, { "at": 0 });
        await accessHandle.flush();
        const fileSize = await accessHandle.getSize();
        // Read file content to a buffer.
        const readBuffer = new ArrayBuffer(fileSize);
        const readSize = accessHandle.read(readBuffer, { "at": 0 });
        await accessHandle.close();
      }
      
      self.onmessage = function(e){
        writeFile(e.data[1],e.data[2]).then(()=>{
          postMessage(e.data[0])
        })
      }
      `

    const blob = new Blob([workerCode], { type: "application/javascript" })
    this._worker = new Worker(URL.createObjectURL(blob))
    this._worker.onmessage = e => {
      const id = e.data as number
      console.log("Finished job " + id)
      if (this.map.has(id)) {
        this.map.get(id)!()
      }
    }
  }

  private static get worker(): Worker {
    if (!this._worker) this._init()
    return this._worker
  }

  static async writeHandle(path: string, file: Blob) {
    const id = this.workID++
    console.log("Starting work write " + path + ", id: " + id)
    const promise = new Promise<void>(resolve => this.map.set(id, resolve))
    this.worker.postMessage([id, path, await file.arrayBuffer()])
    return promise
  }
}
