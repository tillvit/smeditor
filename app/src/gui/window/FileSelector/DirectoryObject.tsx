import { useContext } from "react"
import { FileObject } from "./FileObject"
import {
  FileSelectorContext,
  FileSelectorDirectory,
} from "./FileSelectorWindow"
import { ObjectInfo } from "./ObjectInfo"

export function DirectoryObject(props: { node: FileSelectorDirectory }) {
  const pickerData = useContext(FileSelectorContext)
  const expanded = props.node.children != null

  function toggleExpand() {
    if (!expanded) {
      pickerData?.loadDirectory(props.node.fullPath)
    } else {
      pickerData?.unloadDirectory(props.node.fullPath)
    }
  }

  function handleClick() {
    toggleExpand()
    pickerData?.setSelectedItem({
      path: props.node.fullPath,
      type: "directory",
    })
  }

  return (
    <ObjectInfo
      node={props.node}
      onClick={handleClick}
      className={`${expanded ? "" : "collapsed"}`}
    >
      <div
        className="children"
        style={{ marginLeft: "1rem", display: expanded ? "" : "none" }}
      >
        {props.node.children?.map(folder => {
          if (folder.type == "directory") {
            return <DirectoryObject key={folder.name} node={folder} />
          } else {
            return <FileObject key={folder.name} node={folder} />
          }
        })}
      </div>
    </ObjectInfo>
  )
}
