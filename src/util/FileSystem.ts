export interface FileTree { 
  [key: string]: FileTree | File
}


export class FileSystem {
  files: {[key: string]: File} = {}
  file_tree: FileTree = {}

  constructor() {}

  parseFiles(prefix: string, files: File[] | FileList) {
    for (let file of files) {
      this.addFile(prefix != "" ? prefix + "/" + file.webkitRelativePath : file.webkitRelativePath, file)
    }
  }

  rename(path: string, name: string) {
    if (path.split("/").pop() == name) return
    let file = this.getFile(path)
    if (file) {
      file = new File([file], name, {type: file.type});
      let path_arr = path.split("/")
      let key = path_arr.pop() as string
      delete this.files[path]
      this.files[path_arr.join("/")+"/"+name] = file
      let obj = this.file_tree
      for (let sub of path_arr) {
        if (!(sub in obj)) obj[sub] = {}
        obj = obj[sub] as FileTree
      }
      delete obj[key]
      obj[name] = file
    }else{
      let path_arr = path.split("/")
      let key = path_arr.pop() as string
      let obj = this.file_tree
      for (let sub of path_arr) {
        if (!(sub in obj)) obj[sub] = {}
        obj = obj[sub] as FileTree
      }
      delete obj[key] 
      obj[name] = obj[key]
      //Fix remaining files
      let new_path = path_arr
      new_path.push(name)
      new_path = this.resolvePath(new_path)
      for (let file_name in this.files) {
        if (file_name.startsWith(path)) {
          let cache = this.files[file_name]
          delete this.files[file_name]
          this.files[file_name.replace(path,new_path.join("/"))] = cache
        }
      }
    }
  }

  move(path: string, to: string){
    if (path == to){
      return
    }
    if (path.indexOf(".")>-1) {
      let path_arr = path.split("/")
      let name = path_arr.pop()
      let file = this.getFile(path)
      this.removeFile(path)
      this.addFile(to + "/" + name, file)
    }else{
      if (to.startsWith(path))
        return
      let path_arr = path.split("/")
      let name = path_arr.pop() as string
      let obj = this.file_tree
      for (let sub of path_arr) {
        if (!(sub in obj)) obj[sub] = {}
        obj = obj[sub] as FileTree
      }
      let dir = obj[name]
      delete obj[name]

      let to_arr = to.split("/")
      obj = this.file_tree
      for (let sub of to_arr) {
        if (!(sub in obj)) obj[sub] = {}
        obj = obj[sub] as FileTree
      }
      obj[name] = dir

      for (let file_name in this.files) {
        if (file_name.startsWith(path)) {
          let cache = this.files[file_name]
          delete this.files[file_name]
          this.files[file_name.replace(path,to + "/" + name)] = cache
        }
      }
    }
  }

  getFilesAtPath(path: string | string[]): FileTree {
    let path_arr = path
    if (typeof path == "string") path_arr = path.split("/")
    path_arr = this.resolvePath(path_arr as string[])
    let obj = this.file_tree
    for (let sub of path_arr)  {
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
    let name = path_arr.pop() as string
    for (let sub of path_arr) {
      if (!(sub in obj)) obj[sub] = {}
      obj = obj[sub] as FileTree
    }
    obj[name] = file 
  }

  removeFile(path: string) {
    let path_arr = this.resolvePath(path.split("/"))
    if (this.files[path_arr.join("/")]) {
      delete this.files[path_arr.join("/")]
      let key = path_arr.pop() as string
      let obj = this.file_tree
      for (let sub of path_arr) {
        if (!(sub in obj)) obj[sub] = {}
        obj = obj[sub] as FileTree
      }
      delete obj[key]
    }else{
      let key = path_arr.pop() as string
      let obj = this.file_tree
      for (let sub of path_arr) {
        if (!(sub in obj)) obj[sub] = {}
        obj = obj[sub] as FileTree
      }
      delete obj[key]
      for (let file_name in this.files) {
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
    let path = str.split("/")
    return this.resolvePath(path)
  }

  resolvePath(path_arr: string[]): string[]  {
    path_arr = path_arr.filter(item => item !== ".")
    path_arr = path_arr.filter(item => item !== "")
    while (path_arr.indexOf("..")>-1) {
      let ind = path_arr.indexOf("..")
      if (ind == 0) {
        throw Error("Path" + path_arr.join("/") + "is invalid!")
      }
      path_arr.splice(ind-1,2)
    }
    return path_arr
  }
}

