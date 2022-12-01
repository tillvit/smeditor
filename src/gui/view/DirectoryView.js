import { loadSM } from "../chart/ChartManager.js"
import { createWindow } from "../BaseWindow.js"
import { reloadData } from "./OptionsView.js"


export function createDirectoryWindow(title, accepted_file_types, closeable, initial_select, callback) {
  // Create the window
  let view = createWindow(title, 500, 400, "file_selector"+Math.random(), closeable) 
  view.replaceChildren()
  view.accepted_file_types = accepted_file_types
  view.callback = callback
  view.keyHandler = getKeyHandler(view)
  view.dragHandler = getDragHandler(view)
  view.highlightedPath = ""
  
  //Padding container
  let padding = document.createElement("div")
  padding.classList.add("padding")

  //Navbar
  let navbar = document.createElement("div")
  navbar.classList.add("navbar")
  let navbar_title = document.createElement("div")
  navbar_title.classList.add("title")
  navbar_title.innerText = "Files"
  let add_folder = document.createElement("img")
  add_folder.src = "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAABgAAAAYCAYAAADgdz34AAAABmJLR0QA/wD/AP+gvaeTAAAAvUlEQVRIie2UTQ7CIBBGnz8rb+Mt2hqv4TGMmt4Kexl7gUa3TXBRTAALQqGJJr5kNpR+r8ykwJ9vogJaQDrqlCrwhWeRfAoPrRYo5xRI4OYTpGLkLDMEevl9wXqGzC2wH3uQa8gGOVpUAALoVAmGW+GNKSc44v4XLqmCwgpcqfVeWzNOEisQAYJGfyHkspPARu3vrGCbHrjrQz4oSSiLiL2TuBLZoljKAMEuRQBwxj2rOjX8RcXQioeqBu3Ln4QChU8M4+FlAAAAAElFTkSuQmCC"
  add_folder.onclick = () => {
    var input = document.createElement('input');
    input.type = 'file';
    input.multiple = true
    input.webkitdirectory = true

    input.onchange = e => { 
      uploadDirectory(view, "", e.target.files)
    }
    input.click()
  }
  navbar.appendChild(navbar_title)
  navbar.appendChild(add_folder)

  //Menu Button Options
  let menu_options = document.createElement("div")
  menu_options.classList.add("menu-options")

  let menu_options_left = document.createElement("div")
  menu_options_left.classList.add("menu-left")
  let menu_options_right = document.createElement("div")
  menu_options_right.classList.add("menu-right")
  menu_options.appendChild(menu_options_left)
  menu_options.appendChild(menu_options_right)

  let cancel = document.createElement("button")
  cancel.innerText = "Cancel"
  cancel.onclick = ()=>{
    view.parentElement.classList.add("exiting"); 
    document.removeEventListener("keydown", view.keyHandler, true)
    setTimeout(()=>document.getElementById("windows").removeChild(view.parentElement),40)
  }
  
  let select_btn = document.createElement("button")
  select_btn.innerText = "Select"
  select_btn.classList.add("confirm")
  select_btn.onclick = ()=>confirm(view)
  select_btn.disabled = true
  menu_options_left.appendChild(cancel)
  menu_options_right.appendChild(select_btn)
  
  //Create file explorer
  let scroll = document.createElement("div")
  scroll.classList.add("dir-selector")
  let divs = createDiv(view, files.file_tree)
  scroll.replaceChildren(...divs)

  padding.appendChild(navbar)
  padding.appendChild(scroll)
  padding.appendChild(menu_options)
  view.appendChild(padding)

  //Find a file with extensions
  if (initial_select) 
    select(view, initial_select)
  
  //Drag & drop
  document.addEventListener("keydown", view.keyHandler, true)
  scroll.addEventListener('dragover', function(e) {
      e.preventDefault();
      e.dataTransfer.dropEffect = 'copy';
  });

  view.addEventListener('dragover', view.dragHandler);
  view.addEventListener('dragend',()=>{
    view.querySelector(".outlined")?.classList.remove("outlined")
    view.highlightedPath = ""
  })

  scroll.addEventListener('drop', async function(e) {
    e.stopPropagation();
    e.preventDefault();
    let prefix = view.highlightedPath
    let items = e.dataTransfer.items;
    if (prefix == "") {
      for (var i=0; i<items.length; i++) {
        let item = items[i].webkitGetAsEntry();
        if (item.isFile) {
          if (item.name.endsWith(".sm") || item.name.endsWith(".ssc")) {
            prefix = "New Song"
            break
          }
        }
      }
    }

    let queue = [];
    for (var i=0; i<items.length; i++) {
      let item = items[i].webkitGetAsEntry();
      queue.push(traverseFileTree(prefix, item))
    }
    await Promise.all(queue);
    let scroll = view.querySelector(".dir-selector")?.querySelector("div[data-path='"+prefix+"']")?.parentElement.querySelector(".children")
    if (prefix == "") {
      scroll = view.querySelector(".dir-selector")
    }
    let s_path = prefix.split("/")
    while (scroll == undefined) {
      s_path.pop()
      view.querySelector(".dir-selector")?.querySelector("div[data-path='"+s_path.join("/")+"']")?.parentElement.querySelector(".children")
      if (s_path.length == 0) {
        scroll = view.querySelector(".dir-selector")
      }
    }
    reloadView(view,s_path.join("/"))
    searchForAcceptableFile(view, s_path.join("/"))

  });
} 

function getDragHandler(view) {
  return (e)=>{
    let scroll = view.querySelector(".dir-selector")
    let items = Array.from(scroll.querySelectorAll("div.item.folder"))
    let prevOwner = view.querySelector(".outlined")
    items = items.filter((x)=>!x.parentElement.closest(".collapsed"))
    items.reverse()
    items.push(scroll)
    for (let folder of items) {
      let bounds = folder.getBoundingClientRect();
      if (e.clientX >= bounds.x && e.clientX <= bounds.x + bounds.width &&
        e.clientY >= bounds.y && e.clientY <= bounds.y + bounds.height) {
          if (prevOwner != folder) {
            prevOwner?.classList.remove("outlined")
          }
          view.highlightedPath = folder.querySelector(".info")?.dataset.path ?? ""
          if (folder.classList.contains("dir-selector")) {
            view.highlightedPath = ""
          }
          folder.classList.add("outlined")
          return
        }
    }
    view.querySelector(".outlined")?.classList.remove("outlined")
    view.highlightedPath = ""
  }
}

function traverseFileTree(prefix, item, path) {
  return new Promise(resolve => {
    path = path || "";
    if (item.isFile) {
      item.file(function(file) {
        files.addFile(prefix + "/" + path + file.name, file)
        resolve()
      });
    } else if (item.isDirectory) {
      var dirReader = item.createReader();
      dirReader.readEntries(async function(entries) {
        for (var i=0; i<entries.length; i++) {
          await traverseFileTree(prefix, entries[i], path + item.name + "/");
        }
        resolve()
      });
    }
  })
  
}


function select(view, path) {
  let scroll = view.querySelector(".dir-selector")
  if (!scroll) return
  let info = scroll.querySelector("div[data-path='"+path+"']")
  if (info) {
    view.querySelector(".info.selected")?.classList.remove("selected");
    info.classList.add("selected")
    changeSelectState(view)
    let el = info.parentElement
    while (el.parentElement.parentElement.classList.contains("folder")) {
      el = el.parentElement.parentElement
      el.classList.remove("collapsed")
    }
    info.scrollIntoViewIfNeeded()
  }
}

function changeSelectState(view) {
  let path = view.querySelector(".info.selected")?.dataset.path
  view.querySelector("button.confirm").disabled = true
  if (!path) return
  view.querySelector("button.confirm").disabled =  !(view.accepted_file_types.includes(path.split(".").pop()))
}

function createDiv(view, object, path) {
  let items = []
  //Folders first, then other files
  let keys = Object.keys(object).filter(x=>x.indexOf(".")==-1)
  keys.sort((a,b)=>a.toLowerCase().localeCompare(b.toLowerCase()))
  let files = Object.keys(object).filter(x=>x.indexOf(".")>-1)
  files.sort((a,b)=>a.toLowerCase().localeCompare(b.toLowerCase()))
  keys = keys.concat(files)
  for (let item of keys) {
    let new_div = document.createElement("div")
    new_div.classList.add("item")
    //File/Directory Info
    let info = document.createElement("div")
    info.classList.add("info")
    let folder_open = document.createElement("img")
    folder_open.classList.add("icon")
    folder_open.classList.add("folder-icon")
    folder_open.src = "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAABgAAAAYCAYAAADgdz34AAAABmJLR0QA/wD/AP+gvaeTAAAAbklEQVRIie2PMQqAMAxFXwfP6qJVPIjYzcOKdUkhQ0BaCoLkLS3k818CjuN8ztApYzIDl7xvmalFsAIZuIFozKPMMrC0CAJwKIkuGVX5KdkmLEm3ci1JSlLKU49yLSmXVG1es0EANvnvInKcP/AA784fpjlWwNQAAAAASUVORK5CYII="
    let icon = document.createElement("img")
    icon.src = getIcon(item)
    icon.classList.add("icon")
    let title = document.createElement("textarea")
    title.rows = 1
    title.disabled = true
    title.autocomplete = "off"
    title.autocapitalize = "off"
    title.autocorrect = "off"
    title.spellcheck = false
    title.innerText = item
    title.style.pointerEvents = "none"
    title.classList.add("title")
    let rename = document.createElement("img")
    rename.classList.add("icon")
    rename.classList.add("options-icon")
    rename.src = "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAABgAAAAYCAYAAADgdz34AAAABmJLR0QA/wD/AP+gvaeTAAABqUlEQVRIia3VO2hUQRTG8d+GEC0sRMVKU4naKAQrESEoWBiwshALtREsLQQRGytNt2CvaCPiI52NaK92NlG0kFXw1fgIanztWsy57ma5l52b3APDcGfO+X+z5357h2ZiD9oYa4i3JPZjAT1cbVrkCH4F/HfMV5oSOYW/AZ3FXg3+krMB6uL0wPqKRVrSy+xJrTlakrNPv13tOvBxXI/C75ipyDsXOT8wnQtfhTtRuCA5pyyOSW37g8O58DW4H/APmKrIOyS1pouTufB1eBTwDrZW5E1LLenhfC58Es+j6BM2V+RN4UvkXc6Fb8frKHqr2hFb8D72b8i05S58jKKH0ju4NCDSiryNeBHrDyQjjIwd+BpF85gY2Cv838ZaPI3nx3GIrJiNomJcGNovRN7F/AwbcuFwcUhgWGQCr2L9jWSE7GjhZYlA8TFr4Vo8f8bOOnDSv7MMXownMX/D7rpwuDlCoPjAHVwOfD0WR8C7OFEXPB7zceU+7uBuHOA27tUVKGJe/6Q/cQsHNHD1jUnuWJQ8fQabpItkNeb079zljiWxTfJ9Z4XQ/+MfA5yyJxzqcDgAAAAASUVORK5CYII="
    rename.onclick = (e) => {
      e.preventDefault()
      startEditing(view,title)
      return false
    }
    let add_file = document.createElement("img")
    add_file.classList.add("icon")
    add_file.classList.add("options-icon")
    add_file.src = "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAADAAAAAwCAYAAABXAvmHAAAABmJLR0QA/wD/AP+gvaeTAAABiElEQVRoge2YMU7DMBSGvwQJVO7CwN1YYEFUMAMdYCpHYUMcgg49A3SgEggGE2GskNh5frYr+ZOsppWS93+q9WIbKpWKD4fAHFgBH8BX4NgCt0CbOjiY8M8BYYfGkgwS8wjBs0qsrOKnwH7g/dkl7DkfGh4K+CfsotL7lz3f1SViCjTAnfPbA8oSMQUgg0RsAUgsoSEACSW0BCCRhFRgrA23KHcnqYD9Ijwjg4RU4MJ5RshYSIJ3SAVmwNM/AcfGuyR4h1QAjMQ58EL4cnyQxqO4279T4F0zywYjJlUgN1VgF4jRRkM5Ag5+PgcptY16U+IUajFLiA2RzpJSTqEGuHdqipfXqQT6wkeRSCEwFF4soS3gE14koS2wcGr0bWxEewRtgTf+hm2dmu5u7TW0gLbAFaZl3vA7PdyaLaalboBL++ZSX2R1P7Az+Ah8WtdTjtdV8RFYW9cnFCgxhuRcJ3R0RO18knOdIgQ6iannOkUIpGaLCT96Mrenn2USM+AYuAYeM2epDPINL56D04/lX9sAAAAASUVORK5CYII="
    add_file.onclick = () => {
      var input = document.createElement('input');
      input.type = 'file';
      input.multiple = true
  
      input.onchange = e => { 
        let path = info.dataset.path.split("/")
        if (path[path.length-1].indexOf(".") > -1) {
          path.pop()
        }
        uploadFiles(view, path.join("/"), e.target.files)
      }
      input.click()
      return false
    }
    let add_folder = document.createElement("img")
    add_folder.classList.add("icon")
    add_folder.classList.add("options-icon")
    add_folder.src = "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAABgAAAAYCAYAAADgdz34AAAABmJLR0QA/wD/AP+gvaeTAAAAvUlEQVRIie2UTQ7CIBBGnz8rb+Mt2hqv4TGMmt4Kexl7gUa3TXBRTAALQqGJJr5kNpR+r8ykwJ9vogJaQDrqlCrwhWeRfAoPrRYo5xRI4OYTpGLkLDMEevl9wXqGzC2wH3uQa8gGOVpUAALoVAmGW+GNKSc44v4XLqmCwgpcqfVeWzNOEisQAYJGfyHkspPARu3vrGCbHrjrQz4oSSiLiL2TuBLZoljKAMEuRQBwxj2rOjX8RcXQioeqBu3Ln4QChU8M4+FlAAAAAElFTkSuQmCC"
    add_folder.onclick = () => {
      var input = document.createElement('input');
      input.type = 'file';
      input.multiple = true
      input.webkitdirectory = true
  
      input.onchange = e => { 
        let path = info.dataset.path.split("/")
        if (path[path.length-1].indexOf(".") > -1) {
          path.pop()
        }
        uploadDirectory(view, path.join("/"), e.target.files)
      }
      input.click()
      return false
    }
    let delete_file = document.createElement("img")
    delete_file.classList.add("icon")
    delete_file.classList.add("options-icon")
    delete_file.src = "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAADAAAAAwCAYAAABXAvmHAAAABmJLR0QA/wD/AP+gvaeTAAABdElEQVRoge2YsU7DMBRFDwxlgb0wlB9BLMDXtFvhE2BAogNDxR+1S+ETEBJiLqVSU6lVGOwoJsQhDnEc0DvSU63c+OXeuElVgyAIddMBBsAUWOqaAH2ttZoj4AmILfWoz2kleyiDNvNJzWjpSgxITUbAEDjUdamPJXo/kMdCpqQGhzn6laFPGvRVmg9Sg90cvWvoiyYM3QArfv5O+64VcG0zuVNwfAHsu+f2whI4yBN2LRNi4B714IUmQnnJxbYCecQV57ngfA3bCvwZJEBoJECGO9R7+9ZRawTzx8XGWutrR83lGl+o+zVadM5v5+ciz0BoJEBoJEBoJEBoJEBoJEBoJECGKPNZVqtM3QFGqD2ckaNWGdlWCY1LgK0x9rG/b/bcWs/K4BLgzRifOMwry6kxfvXQnwfSP9zPwDn1rEQHuNA9k/7jGvp+4xh4x21rvErNgZ6PAKDuus8Qc+DMl/mEHmqJX4BNDaY3utcYj3deEP4rn4hExm+tmh+HAAAAAElFTkSuQmCC"
    delete_file.onclick = () => {
      window.files.removeFile(info.dataset.path)
      new_div.parentElement.removeChild(new_div)
      return false
    }

    info.appendChild(folder_open)
    info.appendChild(icon)
    info.appendChild(title)
    info.appendChild(rename)
    info.appendChild(add_file)
    info.appendChild(add_folder)
    info.appendChild(delete_file)

    
    info.addEventListener("mousedown", (e)=>{
      if (e.target == info) {
        info.mousedown = true
        info.totalMovementX = 0  
        info.totalMovementY = 0  
      }
      view.querySelector(".info.selected")?.classList.remove("selected");
      info.classList.add("selected")
      changeSelectState(view)
    })

    window.addEventListener("mousemove", (e)=>{
      if (info.mousedown) {
        info.totalMovementX += e.movementX
        info.totalMovementY += e.movementY
        let info2 = view.querySelector(".drag-copy")
        if (!info2) {
          if (Math.abs(info.totalMovementX) + Math.abs(info.totalMovementY) > 8) {
            view.addEventListener('mousemove', view.dragHandler);
            info2 = new_div.cloneNode(true)
            info2.style.position = "fixed"
            let bounds = info.getBoundingClientRect();
            info2.style.top = bounds.top + info.totalMovementY
            info2.style.left = bounds.left + info.totalMovementX
            info2.style.width = bounds.width
            info2.style.boxShadow = "3px 3px 3px #222";
            info2.classList.add("drag-copy")
            if (info2.querySelector(".children"))
              info2.removeChild(info2.querySelector(".children"))
            view.appendChild(info2)
          }else{
            return
          }
        }
        info2.style.top = parseFloat(info2.style.top.slice(0,-2)) + e.movementY
        info2.style.left = parseFloat(info2.style.left.slice(0,-2)) + e.movementX
      }
    })

    window.addEventListener("mouseup", ()=>{
      if (info.mousedown) {
        info.mousedown = false
        let drags = Array.from(view.querySelectorAll(".drag-copy"))
        drags.forEach(x=>view.removeChild(x))
        view.removeEventListener('mousemove', view.dragHandler);
        if (Math.abs(info.totalMovementX) + Math.abs(info.totalMovementY) > 8) {
          console.log(info.dataset.path, view.highlightedPath)
          window.files.move(info.dataset.path, view.highlightedPath)
          let prefix1 = info.dataset.path.split("/").slice(0,-1).join("/")
          let prefix2 = view.highlightedPath
          reloadView(view,prefix1)
          reloadView(view,prefix2)
          view.querySelector(".outlined")?.classList.remove("outlined")
          view.highlightedPath = ""
          }
      }
    })

    new_div.appendChild(info)
    
    if (object[item] instanceof File) {
      info.removeChild(folder_open)
      info.dataset.path = path + "/" + item
      if (view.accepted_file_types.length > 0 && !view.accepted_file_types.includes(item.split(".").pop())) {
        info.classList.add("disabled")
      }
      items.push(new_div)
    }else{
      info.removeChild(icon)
      let new_children = createDiv(view, object[item], (path ? path + "/" : "") + item)
      let children = document.createElement("div")
      children.classList.add("children")
      new_children.forEach(c=>children.appendChild(c))
      new_div.appendChild(children)
      new_div.classList.add("folder")
      new_div.classList.add("collapsed")
      info.dataset.path = (path ? path + "/" : "") + item
      info.onclick = (e) => {
        view.querySelector(".info.selected")?.classList.remove("selected");
        info.classList.add("selected")
        if (!e.target.classList.contains("options-icon"))
          info.parentElement.classList.toggle("collapsed")
        changeSelectState(view)
      }
      items.push(new_div)
    }
    info.ondblclick = () => {
      confirm(view)
    }
  }
  return items
}

function confirm(view) {
  let path = view.querySelector(".info.selected")?.dataset.path
  view.querySelector("button.confirm").disabled = true
  if (!path) return
  if (view.accepted_file_types.includes(path.split(".").pop())) {
    view.callback(path)
    let win = view.parentElement
    win.classList.add("exiting")
    document.removeEventListener("keydown", view.keyHandler, true)
    setTimeout(function() {
      document.getElementById("windows").removeChild(win)
    },40)
  }
}

function getIcon(name) {
  if (name.indexOf(".") == -1 ) {
    return "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAABgAAAAYCAYAAADgdz34AAAABmJLR0QA/wD/AP+gvaeTAAAAY0lEQVRIiWNgGAWDCXgwMDA8ZmBg+I8DN1BqwSM8hlPFEpgh2EA4AwPDbyIc8B/qUA9SLSDHEpItIBagmMNEBQPxglELRi0YtQDVgsdQmpiiAB9GNgsFeDAQV6KSXdiNgoEBAG+iU6T/ixEpAAAAAElFTkSuQmCC"
  }
  let ext = name.split(".").pop()
  if (["png","jpg","gif","heic","tiff","bnp"].indexOf(ext)>-1) {
    return "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAACAAAAAgCAYAAABzenr0AAAABmJLR0QA/wD/AP+gvaeTAAAB8UlEQVRYhd3WTYjNURjH8c9IozRlwUITTbMRNlNWxksWjKxkYbJQY6mUTCKxmDSkZiezm421KQsRFkgpL7Eg2Si3RJOFl5SIzVicc5t7p/9xz//O/5r41el2nnOe83zv8/zPC4usrgLbBPrbXO8DTuHHQgBm8QjvSwZfg0HcxV58L+nfBDDcht9w9P2IO1ie47SkjUCttBMDuIWexQB4gV3YiJutIDoB0AixoRVEpwCyIaoE+BV/Zxvac6zCdlwoclpaIcBt7EN3wdhxrO40wE9cS4wlt3Unv4EslQE4g5nYTlcFkFuCAxjH2dg/hzeY/lsAQ7iH87G/A7sbAPqFe6VWFiC3BDXheF0v7OsBIQOwEvdxpWzwlIouox48Mbe/H0dbF67jU7RvSaw5LVGu3Ax8w9aGti3aTmCPcP0+xdHM9f6o1HXcHQPXoQeF0+9k7I/Efm+BbzIDZQDG4tjLGOwtbph71CwTXkTjZQByS7ACo5jCK1yOgQ9FKMJJOIXDEaZtFWVgDF8iCKxDX4Fvr1CGkXn2BWWg/u8v4mu0vRZKMF8zuIpjGetmA4zGeZcy15zEJukt2aSck/CIkIXPmQB1HcTDKgD2S9zlLfQsZ1IOwIM2gmfrn3oP/J8AqW9gc8Vx1uJd7uSa5qd1VW2iKNhvOK12/OBuEgoAAAAASUVORK5CYII="
  }
  if (["mp3","ogg","wav","m4a","aac"].indexOf(ext)>-1) {
    return "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAADAAAAAwCAYAAABXAvmHAAAABmJLR0QA/wD/AP+gvaeTAAADFElEQVRoge2ZzWsTQQDFf200qVrBUBAURU/aVgTFSvUoXsQqgoIUFDx68SKieBILeujJFhH/AD0VRBD8REHBD/zCIqUm6kG0UqltE0FFqqkedif7Nuymm2bTbWUfLLy8+dj3kpndmQnEiBEjxv+KDuAx8BroBlLR2qkMx4BJ4K9c5yN1FBD1QA9u4+bKVdjXPOA6kAf2h+jRFymgD7fp+yWfK0GztPsKNIbm1ANp4AFus31YoaYbIAG8l7YnwzJbiuVAP26jvVjDCaYfAOCQtB0FFldrthTrgSG5ySTWBFYEDbAHa7zfBBpsLQFkpf2JUFzb2Gbf0HT+C+j0qBc0wFWpd1j0g6K/qc6yg04sw6bjPFYgLwQNcETqZXGGYAoYk7JN5TpZAHRhTZ4/JTf3u4awhpIfggZYhDXOTd1dUnZR9HPlzD8MaNpcA8DKKYxVMonPSN3Lom8V/aNf464KjBewXjLpAKa8AqSAO8AXYIfoLVI3DyRtvQ4YlrIVXjfSZ+5xYH4Ac0HgFaBNtIxt0GBAyraLrpN8rxHrpcJq4b3A7+q9+2IQ+GHztcAWKbstXCfsE+HthmiAhPCJKg1OhZ/ANfm8U/hL4RuFPxfeYogGmGlcEd4uvF/4GuHDwpsMiTKAvpTU6IhwfUiMCm/CA9WsWcrBr99G0b+JnsDZS+RK9IKtF0NG+Qso6ny435dZ1KMMsEr4uPAlOCHyoqdx/BbrRxmgWXhW+FLhOoR03M+KAPuEPxW+Qfhb4cuEjxmiAQrCk9QWC4Hd8vmGcH15vRK+WfigIRrgg/Cj1DZEK84eN4P7F9C10Qvh+rZ+5tXpaWZuMZcE7mI9DvUt3Cp1c7i/xM9S5rmYmw3L6bNS95Lo7aJ/KtdBA3AKeEc0GxrdeXVI2QXRfTc0laDWW8oMzvxM4t6ptVVjXDFTm/oDooe2qTcI+1glB9zCfaySkfahHqsYzOmDLYM5fbRoEPbh7jppN0KND3cNyh2vj5dp54UkcA/4jvfDoabw+oOjZ5p9Rbbg7AAeYT1Fuqn9AjFGjBgxIsA/jvJ6jenUZ2YAAAAASUVORK5CYII="
  }
  return "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAEAAAABACAYAAACqaXHeAAAABmJLR0QA/wD/AP+gvaeTAAAA+UlEQVR4nO2awQqCQBgGv6KeM+rU+1/L7F4RreY/W86ABw/ujsMPImwiIiLSwlh0XZIcit6piaoAY5JbknPNa31OZYAuI1QH6C7Co9zS63cXgQrQTYTqAMOL+9MC+35MdYBjniOgk1AdIOksAhEg6SgCFSDpJAIZIOkgAvkZfHcNmfDvsJkoOHeNlvVbuCbZtzzwbwGSRp/tzM1+nh0t8ILWiZo1MaufAAPQAjQGoAVoDEAL0BiAFqAxAC1AYwBagMYAtACNAWgBGgPQAjQGoAVoDEAL0BiAFqAxAC1AYwBagMYAtADNN84HLHFOqIzVT4ABaAERERGOO8QV911rDPw7AAAAAElFTkSuQmCC"
}

function getKeyHandler(view) {
  return e => {
    if (!view.parentElement.classList.contains("focused")) return
    let selected = view.querySelector(".info.selected")
    if (selected == undefined) { 
      view.querySelector(".info")?.classList.add("selected") 
      return
    }
    if (e.code == "ArrowUp") {
      e.preventDefault();
      e.stopImmediatePropagation()
      let item = selected.parentElement
      let prev = item.previousSibling?.querySelector(".info")
      if (prev && !prev.parentElement.classList.contains("collapsed") && prev.parentElement.classList.contains("folder")) {
        prev = prev.parentElement.querySelector(".children").lastChild.querySelector(".info")
      }
      if (!prev && item.parentElement.classList.contains("children")) {
        prev = item.parentElement.parentElement.querySelector(".info")
      }
      if (prev) {
        selected.classList.remove("selected")
        prev.classList.add("selected")
        changeSelectState(view)
        prev.scrollIntoViewIfNeeded(false)
      }
    }
    if (e.code == "ArrowDown") {
      e.preventDefault();
      e.stopImmediatePropagation()
      let item = selected.parentElement
      let next = undefined
      if (item.classList.contains("folder") && !item.classList.contains("collapsed")) {
        let children = item.querySelector(".children")
        next = children.children[0].querySelector(".info")
      }
      if (!next)
        next = selected.parentElement.nextSibling?.querySelector(".info")
      if (!next && item.parentElement.classList.contains("children"))
        next = item.parentElement.parentElement.nextSibling?.querySelector(".info")
      if (next) {
        selected.classList.remove("selected")
        next.classList.add("selected")
        changeSelectState(view)
        next.scrollIntoViewIfNeeded(false)
      }
    }
    if (e.code == "ArrowLeft") {
      e.preventDefault();
      e.stopImmediatePropagation()
      if (selected.parentElement.classList.contains("folder")) {
        selected.parentElement.classList.add("collapsed")
      }
    }
    if (e.code == "ArrowRight") {
      e.preventDefault();
      e.stopImmediatePropagation()
      if (selected.parentElement.classList.contains("folder")) {
        selected.parentElement.classList.remove("collapsed")
      }
    }
    if (e.code == "Enter") {
      e.preventDefault();
      e.stopImmediatePropagation()
      startEditing(view,selected.parentElement.querySelector(".title"))
    }
  }
}

function startEditing(view, title) {
  document.removeEventListener("keydown", view.keyHandler, true)
  title.disabled = false
  title.style.pointerEvents = ""
  title.value = title.parentElement.dataset.path.split("/").pop()
  title.focus()
  title.addEventListener("keypress", textAreaKeyHandler, true)
  title.addEventListener("blur", ()=>{
    document.addEventListener("keydown", view.keyHandler, true)
    title.disabled = true
    title.style.pointerEvents = "none"
    let path = title.parentElement.dataset.path.split("/")
    let orig_path = title.parentElement.dataset.path
    let isFolder = orig_path.indexOf(".") == -1
    title.value = title.value.replaceAll("/","")
    if (isFolder) title.value = title.value.replaceAll(".","")
    path[path.length-1] = title.value
    title.parentElement.dataset.path = path.join("/")
    window.files.rename(orig_path,title.value)
    if (title.value.length > 32)
      title.value = title.value.slice(0,32) + "..."
  })
}

function textAreaKeyHandler(e) {
  if (e.code == "Enter") {
    e.preventDefault();
    e.stopImmediatePropagation()
    e.target.blur()
  }
}

function uploadDirectory(view, prefix, dir) {
  files.parseFiles(prefix, dir)
  reloadView(view,prefix)
  searchForAcceptableFile(view, prefix)
}

function uploadFiles(view, prefix, fs) {
  for (let f of fs) {
    files.addFile(prefix + "/" + f.name, f)
  }
  reloadView(view,prefix)
  searchForAcceptableFile(view, prefix)
}

function reloadView(view, prefix) {
  let scroll = view.querySelector(".dir-selector")?.querySelector("div[data-path='"+prefix+"']")?.parentElement.querySelector(".children")
  if (prefix == "") {
    scroll = view.querySelector(".dir-selector")
  }
  let collapseCache = []
  for (let child of scroll.querySelectorAll(".folder:not(.collapsed)")) {
    collapseCache.push(child.querySelector(".info").dataset.path)
  }
  scroll.replaceChildren(...createDiv(view, files.getFilesAtPath(prefix),prefix))
  for (let cache of collapseCache) {
    view.querySelector(".dir-selector")?.querySelector("div[data-path='"+cache+"']")?.parentElement.classList.remove("collapsed")
  }
}

function searchForAcceptableFile(view, prefix) {
  let suggested = ""
  for (let f in window.files.files) {
    if (f.startsWith(prefix) && view.accepted_file_types.includes(f.split(".").pop())) {
      suggested = f
    }
  }
  select(view, suggested)
}

window.openSM = function() {
  createDirectoryWindow("Select an sm/ssc file...",["sm","ssc"], true, "", (file) => {
    window.selected_sm = file
    loadSM()
    reloadData("song_properties")
  })
}