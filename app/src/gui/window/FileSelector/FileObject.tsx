import { useContext } from "react"
import { FileSelectorContext, FileSelectorFile } from "./FileSelectorWindow"
import { ObjectInfo } from "./ObjectInfo"

export function FileObject(props: { node: FileSelectorFile }) {
  const pickerData = useContext(FileSelectorContext)

  function handleClick() {
    pickerData?.setSelectedItem({ path: props.node.fullPath, type: "file" })
  }

  return (
    <ObjectInfo
      node={props.node}
      onClick={handleClick}
      onDblClick={() => pickerData?.confirmFile(props.node.fullPath)}
    ></ObjectInfo>
  )
}
