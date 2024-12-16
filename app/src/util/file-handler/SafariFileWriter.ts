export class SafariFileWriter {
  private static worker = new Worker(
    new URL("./SafariFileWorker.ts", import.meta.url),
    {
      type: "module",
    }
  )
  private static workID = 0
  private static map: Map<
    number,
    [(value: void | PromiseLike<void>) => void, (reason?: any) => void]
  > = new Map()
  static {
    this.worker.onmessage = event => {
      const data = event.data
      if (data.success) {
        this.map.get(data.id)![0]()
      } else {
        this.map.get(data.id)![1](data.reason)
      }
      this.map.delete(data.id)
    }
  }

  static async writeHandle(path: string, data: Blob | string) {
    const id = this.workID++
    const promise = new Promise<void>((resolve, reject) =>
      this.map.set(id, [resolve, reject])
    )
    const encode = new TextEncoder()
    const buffer =
      typeof data == "string"
        ? encode.encode(data).buffer
        : await data.arrayBuffer()
    this.worker.postMessage([id, path, buffer], [buffer])
    return promise
  }
}
