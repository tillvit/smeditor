/* eslint-disable */
const __classPrivateFieldGet =
  (this && this.__classPrivateFieldGet) ||
  function (receiver, state, kind, f) {
    if (kind === "a" && !f)
      throw new TypeError("Private accessor was defined without a getter")
    if (
      typeof state === "function"
        ? receiver !== state || !f
        : !state.has(receiver)
    )
      throw new TypeError(
        "Cannot read private member from an object whose class did not declare it"
      )
    return kind === "m"
      ? f
      : kind === "a"
      ? f.call(receiver)
      : f
      ? f.value
      : state.get(receiver)
  }
let _FileHandle_instances, _FileHandle_getPath
import Blob from "fetch-blob"
import { errors, isChunkObject } from "file-system-access/lib/util.js"
import DOMException from "node-domexception"
import { fileFrom } from "./from.js"
var path = nw.require("path")
const join = path.join
var fs = nw.require("fs").promises
// import mime from 'mime-types'
const { INVALID, GONE, MISMATCH, MOD_ERR, SYNTAX } = errors
export class Sink {
  constructor(fileHandle, path, size) {
    this.position = 0
    this.fileHandle = fileHandle
    this.path = path
    this.size = size
    this.position = 0
  }
  async abort() {
    await this.fileHandle.close()
  }
  async write(chunk) {
    try {
      await fs.stat(this.path)
    } catch (err) {
      if (err.code === "ENOENT") {
        await this.fileHandle.close().catch()
        throw new DOMException(...GONE)
      }
    }
    if (isChunkObject(chunk)) {
      if (chunk.type === "write") {
        if (typeof chunk.position === "number" && chunk.position >= 0) {
          this.position = chunk.position
        }
        if (!("data" in chunk)) {
          await this.fileHandle.close()
          throw new DOMException(...SYNTAX("write requires a data argument"))
        }
        chunk = chunk.data
      } else if (chunk.type === "seek") {
        if (Number.isInteger(chunk.position) && chunk.position >= 0) {
          if (this.size < chunk.position) {
            throw new DOMException(...INVALID)
          }
          this.position = chunk.position
          return
        } else {
          await this.fileHandle.close()
          throw new DOMException(...SYNTAX("seek requires a position argument"))
        }
      } else if (chunk.type === "truncate") {
        if (Number.isInteger(chunk.size) && chunk.size >= 0) {
          await this.fileHandle.truncate(chunk.size)
          this.size = chunk.size
          if (this.position > this.size) {
            this.position = this.size
          }
          return
        } else {
          await this.fileHandle.close()
          throw new DOMException(...SYNTAX("truncate requires a size argument"))
        }
      }
    }
    if (chunk instanceof ArrayBuffer) {
      chunk = new Uint8Array(chunk)
    } else if (typeof chunk === "string") {
      chunk = Buffer.from(chunk)
    } else if (chunk instanceof Blob) {
      for await (const data of chunk.stream()) {
        const res = await this.fileHandle.writev([data], this.position)
        this.position += res.bytesWritten
        this.size += res.bytesWritten
      }
      return
    }
    const res = await this.fileHandle.writev([chunk], this.position)
    this.position += res.bytesWritten
    this.size += res.bytesWritten
  }
  async close() {
    // First make sure we close the handle
    await this.fileHandle.close()
    await fs.stat(this.path).catch(err => {
      if (err.code === "ENOENT") throw new DOMException(...GONE)
    })
  }
}
export class FileHandle {
  constructor(path, name) {
    _FileHandle_instances.add(this)
    this.kind = "file"
    this.writable = true
    this._path = path
    this.name = name
  }
  async getFile() {
    await fs.stat(this._path).catch(err => {
      if (err.code === "ENOENT") throw new DOMException(...GONE)
    })
    return await fileFrom(this._path)
  }
  async isSameEntry(other) {
    return (
      this._path ===
      __classPrivateFieldGet(
        this,
        _FileHandle_instances,
        "m",
        _FileHandle_getPath
      ).apply(other)
    )
  }
  async createWritable() {
    const fileHandle = await fs.open(this._path, "r+").catch(err => {
      if (err.code === "ENOENT") throw new DOMException(...GONE)
      throw err
    })
    const { size } = await fileHandle.stat()
    return new Sink(fileHandle, this._path, size)
  }
}
;(_FileHandle_instances = new WeakSet()),
  (_FileHandle_getPath = function _FileHandle_getPath() {
    return this._path
  })
export class FolderHandle {
  constructor(path = "", name = "") {
    this.kind = "directory"
    this.writable = true
    this.name = name
    this._path = path
  }
  async isSameEntry(other) {
    return this._path === other._path
  }
  async *entries() {
    const dir = this._path
    const items = await fs.readdir(dir).catch(err => {
      if (err.code === "ENOENT") throw new DOMException(...GONE)
      throw err
    })
    for (const name of items) {
      const path = join(dir, name)
      const stat = await fs.lstat(path)
      if (stat.isFile()) {
        yield [name, new FileHandle(path, name)]
      } else if (stat.isDirectory()) {
        yield [name, new FolderHandle(path, name)]
      }
    }
  }
  async getDirectoryHandle(name, opts = {}) {
    const path = join(this._path, name)
    const stat = await fs.lstat(path).catch(err => {
      if (err.code !== "ENOENT") throw err
    })
    const isDirectory =
      stat === null || stat === void 0 ? void 0 : stat.isDirectory()
    if (stat && isDirectory) return new FolderHandle(path, name)
    if (stat && !isDirectory) throw new DOMException(...MISMATCH)
    if (!opts.create) throw new DOMException(...GONE)
    await fs.mkdir(path)
    return new FolderHandle(path, name)
  }
  async getFileHandle(name, opts = {}) {
    const path = join(this._path, name)
    const stat = await fs.lstat(path).catch(err => {
      if (err.code !== "ENOENT") throw err
    })
    const isFile = stat === null || stat === void 0 ? void 0 : stat.isFile()
    if (stat && isFile) return new FileHandle(path, name)
    if (stat && !isFile) throw new DOMException(...MISMATCH)
    if (!opts.create) throw new DOMException(...GONE)
    await (await fs.open(path, "w")).close()
    return new FileHandle(path, name)
  }
  async queryPermission() {
    return "granted"
  }
  async removeEntry(name, opts) {
    const path = join(this._path, name)
    const stat = await fs.lstat(path).catch(err => {
      if (err.code === "ENOENT") throw new DOMException(...GONE)
      throw err
    })
    if (stat.isDirectory()) {
      if (opts.recursive) {
        await fs.rm(path, { recursive: true }).catch(err => {
          if (err.code === "ENOTEMPTY") throw new DOMException(...MOD_ERR)
          throw err
        })
      } else {
        await fs.rmdir(path).catch(err => {
          if (err.code === "ENOTEMPTY") throw new DOMException(...MOD_ERR)
          throw err
        })
      }
    } else {
      await fs.unlink(path)
    }
  }
}
const adapter = path => new FolderHandle(path)
export default adapter
//# sourceMappingURL=node.js.map
