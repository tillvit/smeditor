import { useContext, useEffect, useState } from "react"
import { Fragment } from "react/jsx-runtime"
import { Simfile } from "../../../chart/sm/Simfile"
import { SimfileProperty } from "../../../chart/sm/SimfileTypes"
import { AUDIO_EXT, IMG_EXT } from "../../../data/FileData"
import { ActionHistory } from "../../../util/ActionHistory"
import { EventHandler } from "../../../util/EventHandler"
import { dirname } from "../../../util/Path"
import { useSM } from "../../hooks/SMHook"
import { NumberInput } from "../../inputs/NumberInput"
import { ValueInput, ValueInputOptions } from "../../inputs/ValueInput"
import { WindowContext } from "../WindowManager"

interface SMPropertyEditorOptions {
  sm: Simfile
  newSong: boolean
  onChange?: (
    property: SimfileProperty,
    value: string | File | undefined
  ) => void
}

type SMPropertyGroupData = {
  title: string
  items: SMPropertyData[]
}

type SMPropertyData = {
  title: string
  propName: SimfileProperty
  input: ValueInputOptions
}

const SM_PROPERTIES_DATA: SMPropertyGroupData[] = [
  {
    title: "Metadata",
    items: [
      { title: "Title", propName: "TITLE", input: { type: "text" } },
      { title: "Subtitle", propName: "SUBTITLE", input: { type: "text" } },
      { title: "Artist", propName: "ARTIST", input: { type: "text" } },
      { title: "Credit", propName: "CREDIT", input: { type: "text" } },
      { title: "Genre", propName: "GENRE", input: { type: "text" } },
      { title: "Origin", propName: "ORIGIN", input: { type: "text" } },
    ],
  },
  {
    title: "Resources",
    items: [
      {
        title: "Audio Track",
        propName: "MUSIC",
        input: { type: "path", typeName: "audio", accept: AUDIO_EXT },
      },
      {
        title: "Background Image",
        propName: "BACKGROUND",
        input: { type: "path", typeName: "image", accept: IMG_EXT },
      },
      {
        title: "Banner Image",
        propName: "BANNER",
        input: { type: "path", typeName: "image", accept: IMG_EXT },
      },
      {
        title: "CD Title",
        propName: "CDTITLE",
        input: { type: "path", typeName: "image", accept: IMG_EXT },
      },
      {
        title: "CD Image",
        propName: "CDIMAGE",
        input: { type: "path", typeName: "image", accept: IMG_EXT },
      },
      {
        title: "Jacket",
        propName: "JACKET",
        input: { type: "path", typeName: "image", accept: IMG_EXT },
      },
      {
        title: "Disc Image",
        propName: "DISCIMAGE",
        input: { type: "path", typeName: "image", accept: IMG_EXT },
      },
    ],
  },
  {
    title: "Song",
    items: [
      {
        title: "Song Preview",
        propName: "SAMPLESTART",
        input: {
          type: "custom",
          element: SampleInput,
        },
      },
    ],
  },
]

const NEW_SONG_DATA: SMPropertyGroupData[] = [
  {
    title: "Metadata",
    items: [
      { title: "Title", propName: "TITLE", input: { type: "text" } },
      { title: "Subtitle", propName: "SUBTITLE", input: { type: "text" } },
      { title: "Artist", propName: "ARTIST", input: { type: "text" } },
      { title: "Credit", propName: "CREDIT", input: { type: "text" } },
      { title: "Genre", propName: "GENRE", input: { type: "text" } },
      { title: "Origin", propName: "ORIGIN", input: { type: "text" } },
    ],
  },
  {
    title: "Resources",
    items: [
      {
        title: "Audio Track",
        propName: "MUSIC",
        input: { type: "file", typeName: "audio", accept: AUDIO_EXT },
      },
      {
        title: "Background Image",
        propName: "BACKGROUND",
        input: { type: "file", typeName: "image", accept: IMG_EXT },
      },
      {
        title: "Banner Image",
        propName: "BANNER",
        input: { type: "file", typeName: "image", accept: IMG_EXT },
      },
      {
        title: "CD Title",
        propName: "CDTITLE",
        input: { type: "file", typeName: "image", accept: IMG_EXT },
      },
      {
        title: "CD Image",
        propName: "CDIMAGE",
        input: { type: "file", typeName: "image", accept: IMG_EXT },
      },
      {
        title: "Jacket",
        propName: "JACKET",
        input: { type: "file", typeName: "image", accept: IMG_EXT },
      },
      {
        title: "Disc Image",
        propName: "DISCIMAGE",
        input: { type: "file", typeName: "image", accept: IMG_EXT },
      },
    ],
  },
]

function SampleInput() {
  const app = useContext(WindowContext)!.app
  const sm = app.chartManager.loadedSM!
  const data = useSM(sm)
  const [start, setStart] = useState(parseFloat(data.SAMPLESTART ?? "0"))
  const [length, setLength] = useState(parseFloat(data.SAMPLELENGTH ?? "10"))

  useEffect(() => {
    setStart(parseFloat(data.SAMPLESTART ?? "0"))
    setLength(parseFloat(data.SAMPLELENGTH ?? "10"))
  }, [data.SAMPLESTART, data.SAMPLELENGTH])

  return (
    <div>
      <NumberInput
        value={start}
        min={0}
        precision={3}
        allowNull={false}
        onChange={value => {
          if (value == null) return
          const oldValue = start
          ActionHistory.instance.run({
            action: () => {
              sm.properties.SAMPLESTART = value.toString()
              EventHandler.emit("smModified")
            },
            undo: () => {
              sm.properties.SAMPLESTART = oldValue.toString()
              EventHandler.emit("smModified")
            },
          })
        }}
      />
      <NumberInput
        value={start + length}
        min={start}
        precision={3}
        allowNull={false}
        onChange={value => {
          if (value == null) return
          const newLength = value - parseFloat(data.SAMPLESTART ?? "0")
          const oldLength = length
          ActionHistory.instance.run({
            action: () => {
              sm.properties.SAMPLELENGTH = newLength.toString()
              EventHandler.emit("smModified")
            },
            undo: () => {
              sm.properties.SAMPLELENGTH = oldLength.toString()
              EventHandler.emit("smModified")
            },
          })
        }}
      />
    </div>
  )
}

// create: (_, sm, history) => {
//             const updateValues = () => {
//               if (toSpinner.value < fromSpinner.value) {
//                 toSpinner.value = fromSpinner.value
//               }
//               const lastStart = sm.properties.SAMPLESTART ?? "0"
//               const lastLength = sm.properties.SAMPLELENGTH ?? "10"
//               const newStart = fromSpinner.value.toString()
//               const newLength = (toSpinner.value - fromSpinner.value).toString()
//               history.run({
//                 action: () => {
//                   sm.properties.SAMPLESTART = newStart
//                   sm.properties.SAMPLELENGTH = newLength
//                   fromSpinner.value = parseFloat(newStart)
//                   toSpinner.value = parseFloat(newStart) + parseFloat(newLength)
//                 },
//                 undo: () => {
//                   sm.properties.SAMPLESTART = lastStart
//                   sm.properties.SAMPLELENGTH = lastLength
//                   fromSpinner.value = parseFloat(lastStart)
//                   toSpinner.value =
//                     parseFloat(lastStart) + parseFloat(lastLength)
//                 },
//               })
//             }
//             const fromSpinner = NumberSpinner.create({
//               value: parseFloat(sm.properties.SAMPLESTART ?? "0"),
//               precision: 3,
//               min: 0,
//             })
//             fromSpinner.onchange = value => {
//               if (value === undefined) {
//                 fromSpinner.value = parseFloat(sm.properties.SAMPLESTART ?? "0")
//                 return
//               }
//               updateValues()
//             }
//             const toSpinner = NumberSpinner.create({
//               value:
//                 parseFloat(sm.properties.SAMPLESTART ?? "0") +
//                 parseFloat(sm.properties.SAMPLELENGTH ?? "10"),
//               precision: 3,
//               min: 0,
//             })
//             toSpinner.onchange = value => {
//               if (value === undefined) {
//                 toSpinner.value =
//                   parseFloat(sm.properties.SAMPLESTART ?? "0") +
//                   parseFloat(sm.properties.SAMPLELENGTH ?? "10")
//                 return
//               }
//               updateValues()
//             }

//             const container = document.createElement("div")
//             const to = document.createElement("div")
//             to.innerText = "to"
//             container.classList.add("flex-row", "flex-column-gap")
//             container.replaceChildren(fromSpinner.view, to, toSpinner.view)
//             return container
//           },
//         },

function SMPropertyGroup(props: {
  data: SMPropertyGroupData
  sm: Simfile
  onChange?: (
    property: SimfileProperty,
    value: string | File | undefined
  ) => void
}) {
  const windowData = useContext(WindowContext)
  const sm = useSM(props.sm)
  return (
    <div className="sm-container">
      <div className="property-title">{props.data.title}</div>
      <div className="property-grid">
        {props.data.items.map(item => {
          if (item.input.type == "path") {
            item.input.baseDir = dirname(windowData!.app.chartManager.smPath)
          }
          return (
            <Fragment key={item.propName}>
              <div className="label">{item.title}</div>
              <ValueInput
                {...item.input}
                value={(sm[item.propName] ?? "") as any} // :(
                onChange={(value: any) =>
                  props.onChange?.(item.propName, value)
                }
              />
            </Fragment>
          )
        })}
      </div>
    </div>
  )
}

export function SMPropertyEditor(props: SMPropertyEditorOptions) {
  return (
    <div>
      {(props.newSong ? NEW_SONG_DATA : SM_PROPERTIES_DATA).map(group => {
        return (
          <SMPropertyGroup
            key={group.title}
            data={group}
            sm={props.sm}
            onChange={props.onChange}
          />
        )
      })}
    </div>
  )
}
