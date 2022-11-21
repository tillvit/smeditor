export class FileSystem {
  files = {}
  file_tree = {}

  constructor() {}

  parseFiles(prefix, files) {
    for (let file of files) {
      this.addFile(prefix != "" ? prefix + "/" + file.webkitRelativePath : file.webkitRelativePath, file)
    }
  }

  rename(path, name) {
    let file = this.getFile(path)
    if (file) {
      file = new File([file], name, {type: file.type});
      let path_arr = path.split("/")
      let key = path_arr.pop()
      delete this.files[path]
      this.files[path_arr.join("/")+"/"+name] = file
      let obj = this.file_tree
      for (let sub of path_arr) {
        if (!(sub in obj)) obj[sub] = {}
        obj = obj[sub]
      }
      delete obj[key]
      obj[name] = file
    }else{
      let path_arr = path.split("/")
      let key = path_arr.pop()
      let obj = this.file_tree
      for (let sub of path_arr) {
        if (!(sub in obj)) obj[sub] = {}
        obj = obj[sub]
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

  move(path, to){
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
      let name = path_arr.pop()
      let obj = this.file_tree
      for (let sub of path_arr) {
        if (!(sub in obj)) obj[sub] = {}
        obj = obj[sub]
      }
      let dir = obj[name]
      delete obj[name]

      let to_arr = to.split("/")
      obj = this.file_tree
      for (let sub of to_arr) {
        if (!(sub in obj)) obj[sub] = {}
        obj = obj[sub]
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

  getFilesAtPath(path) {
    let path_arr = path
    if (typeof path == "string") {
      path_arr = path.split("/")
    }
    path_arr = this.resolvePath(path_arr)
    let obj = this.file_tree
    for (let sub of path_arr)  {
      obj = obj[sub]
    }
    return obj
  }

  getFile(path) {
    if (typeof path == "object") {
      return this.files[this.resolvePath(path).join("/")]
    }
    return this.files[this.resolveStringPath(path).join("/")]
  }

  addFile(p, file) {
    if (file.name == ".DS_Store") {
      return
    }
    let path = p.split("/")
    path = this.resolvePath(path)
    this.files[path.join("/")] = file
    let obj = this.file_tree
    let name = path.pop()
    for (let sub of path) {
      if (!(sub in obj)) obj[sub] = {}
      obj = obj[sub]
    }
    obj[name] = file 
  }

  removeFile(p) {
    let path = this.resolvePath(p.split("/"))
    if (this.files[path.join("/")]) {
      delete this.files[path.join("/")]
      let key = path.pop()
      let obj = this.file_tree
      for (let sub of path) {
        if (!(sub in obj)) obj[sub] = {}
        obj = obj[sub]
      }
      delete obj[key]
    }else{
      let key = path.pop()
      let obj = this.file_tree
      for (let sub of path) {
        if (!(sub in obj)) obj[sub] = {}
        obj = obj[sub]
      }
      delete obj[key]
      for (let file_name in this.files) {
        if (file_name.startsWith(p)) {
          delete this.files[file_name]
        }
      }
    }
    
  }
  
  getFileRelativeTo(path, file) {
    let dir = path.split("/")
    dir.pop()
    dir = dir.concat(file.split("/"))
    return this.getFile(this.resolvePath(dir).join("/"))
  }

  resolveStringPath(str) {
    let path = str.split("/")
    return this.resolvePath(path)
  }

  resolvePath(p)  {
    let path = p
    path = path.filter(item => item !== ".")
    path = path.filter(item => item !== "")
    while (path.indexOf("..")>-1) {
      let ind = path.indexOf("..")
      if (ind == 0) {
        throw Error("Path" + p.join("/") + "is invalid!")
      }
      path.splice(ind-1,2)
    }
    return path
  }
}

