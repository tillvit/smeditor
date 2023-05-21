import { SimfileProperty } from "../chart/sm/SimfileTypes"

type SMPropertyGroupData = {
  title: string
  items: SMPropertyData[]
}

type SMPropertyData = {
  title: string
  propName: SimfileProperty
  type: "string" | "image" | "audio"
}

export const SM_PROPERTIES_DATA: SMPropertyGroupData[] = [
  {
    title: "Properties",
    items: [
      {
        title: "Title",
        propName: "TITLE",
        type: "string",
      },
      {
        title: "Subtitle",
        propName: "SUBTITLE",
        type: "string",
      },
      {
        title: "Artist",
        propName: "ARTIST",
        type: "string",
      },
      {
        title: "Credit",
        propName: "CREDIT",
        type: "string",
      },
      {
        title: "Genre",
        propName: "GENRE",
        type: "string",
      },
      {
        title: "Origin",
        propName: "ORIGIN",
        type: "string",
      },
    ],
  },
  {
    title: "Resources",
    items: [
      {
        title: "Audio Track",
        propName: "MUSIC",
        type: "audio",
      },
      {
        title: "Background Image",
        propName: "BACKGROUND",
        type: "image",
      },
      {
        title: "Banner Image",
        propName: "BANNER",
        type: "image",
      },
      {
        title: "CD Title",
        propName: "CDTITLE",
        type: "image",
      },
      {
        title: "CD Image",
        propName: "CDIMAGE",
        type: "image",
      },
      {
        title: "Jacket",
        propName: "JACKET",
        type: "image",
      },
      {
        title: "Disc Image",
        propName: "DISCIMAGE",
        type: "image",
      },
    ],
  },
]
