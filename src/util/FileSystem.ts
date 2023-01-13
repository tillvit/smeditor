export interface FileTree {
  [key: string]: FileTree | File
}

export class FileSystem {
  files: { [key: string]: File } = {}
  file_tree: FileTree = {}

  parseFiles(prefix: string, files: File[] | FileList) {
    for (const file of files) {
      this.addFile(
        prefix != ""
          ? prefix + "/" + file.webkitRelativePath
          : file.webkitRelativePath,
        file
      )
    }
  }

  rename(path: string, name: string) {
    if (path.split("/").pop() == name) return
    let file = this.getFile(path)
    if (file) {
      file = new File([file], name, { type: file.type })
      const path_arr = path.split("/")
      const key = path_arr.pop() as string
      delete this.files[path]
      this.files[path_arr.join("/") + "/" + name] = file
      let obj = this.file_tree
      for (const sub of path_arr) {
        if (!(sub in obj)) obj[sub] = {}
        obj = obj[sub] as FileTree
      }
      delete obj[key]
      obj[name] = file
    } else {
      const path_arr = path.split("/")
      const key = path_arr.pop() as string
      let obj = this.file_tree
      for (const sub of path_arr) {
        if (!(sub in obj)) obj[sub] = {}
        obj = obj[sub] as FileTree
      }
      delete obj[key]
      obj[name] = obj[key]
      //Fix remaining files
      let new_path = path_arr
      new_path.push(name)
      new_path = this.resolvePath(new_path)
      for (const file_name in this.files) {
        if (file_name.startsWith(path)) {
          const cache = this.files[file_name]
          delete this.files[file_name]
          this.files[file_name.replace(path, new_path.join("/"))] = cache
        }
      }
    }
  }

  move(path: string, to: string) {
    if (path == to) {
      return
    }
    if (path.indexOf(".") > -1) {
      const path_arr = path.split("/")
      const name = path_arr.pop()
      const file = this.getFile(path)
      this.removeFile(path)
      this.addFile(to + "/" + name, file)
    } else {
      if (to.startsWith(path)) return
      const path_arr = path.split("/")
      const name = path_arr.pop() as string
      let obj = this.file_tree
      for (const sub of path_arr) {
        if (!(sub in obj)) obj[sub] = {}
        obj = obj[sub] as FileTree
      }
      const dir = obj[name]
      delete obj[name]

      const to_arr = to.split("/")
      obj = this.file_tree
      for (const sub of to_arr) {
        if (!(sub in obj)) obj[sub] = {}
        obj = obj[sub] as FileTree
      }
      obj[name] = dir

      for (const file_name in this.files) {
        if (file_name.startsWith(path)) {
          const cache = this.files[file_name]
          delete this.files[file_name]
          this.files[file_name.replace(path, to + "/" + name)] = cache
        }
      }
    }
  }

  getFilesAtPath(path: string | string[]): FileTree {
    let path_arr = path
    if (typeof path == "string") path_arr = path.split("/")
    path_arr = this.resolvePath(path_arr as string[])
    let obj = this.file_tree
    for (const sub of path_arr) {
      obj = obj[sub] as FileTree
    }
    return obj
  }

  getFile(path: string | string[]): File {
    if (typeof path == "object") {
      return this.files[this.resolvePath(path).join("/")]
    }
    return this.files[this.resolveStringPath(path).join("/")]
  }

  addFile(path: string, file: File) {
    if (file.name == ".DS_Store") {
      return
    }
    let path_arr = path.split("/")
    path_arr = this.resolvePath(path_arr)
    this.files[path_arr.join("/")] = file
    let obj = this.file_tree
    const name = path_arr.pop() as string
    for (const sub of path_arr) {
      if (!(sub in obj)) obj[sub] = {}
      obj = obj[sub] as FileTree
    }
    obj[name] = file
  }

  removeFile(path: string) {
    const path_arr = this.resolvePath(path.split("/"))
    if (this.files[path_arr.join("/")]) {
      delete this.files[path_arr.join("/")]
      const key = path_arr.pop() as string
      let obj = this.file_tree
      for (const sub of path_arr) {
        if (!(sub in obj)) obj[sub] = {}
        obj = obj[sub] as FileTree
      }
      delete obj[key]
    } else {
      const key = path_arr.pop() as string
      let obj = this.file_tree
      for (const sub of path_arr) {
        if (!(sub in obj)) obj[sub] = {}
        obj = obj[sub] as FileTree
      }
      delete obj[key]
      for (const file_name in this.files) {
        if (file_name.startsWith(path)) {
          delete this.files[file_name]
        }
      }
    }
  }

  getFileRelativeTo(path: string, file: string): File {
    let dir = path.split("/")
    dir.pop()
    dir = dir.concat(file.split("/"))
    return this.getFile(this.resolvePath(dir).join("/"))
  }

  resolveStringPath(str: string): string[] {
    const path = str.split("/")
    return this.resolvePath(path)
  }

  resolvePath(path_arr: string[]): string[] {
    path_arr = path_arr.filter(item => item !== ".")
    path_arr = path_arr.filter(item => item !== "")
    while (path_arr.indexOf("..") > -1) {
      const ind = path_arr.indexOf("..")
      if (ind == 0) {
        throw Error("Path" + path_arr.join("/") + "is invalid!")
      }
      path_arr.splice(ind - 1, 2)
    }
    return path_arr
  }

  static relPath(from: string, to: string): string {
    const fromParts = from.split("/")
    const toParts = to.split("/")

    const length = Math.min(fromParts.length, toParts.length)
    let samePartsLength = length
    for (let i = 0; i < length; i++) {
      if (fromParts[i] !== toParts[i]) {
        samePartsLength = i
        break
      }
    }

    if (samePartsLength == 0) return to

    let outputParts = []
    for (let i = samePartsLength; i < fromParts.length; i++) {
      outputParts.push("..")
    }

    outputParts = outputParts.concat(toParts.slice(samePartsLength))

    return outputParts.join("/")
  }
}
