import { useEffect, useState } from "react"
import Markdown from "react-markdown"
import { WindowData } from "../WindowManager"

export interface CoreVersion {
  version: string
  date: number
  changelog: string
}

function LinkRenderer(props: any) {
  return (
    <a href={props.href} target="_blank" rel="noreferrer">
      {props.children}
    </a>
  )
}

function ChangelogWindowContent() {
  const [versions, setVersions] = useState<string[]>([])
  useEffect(() => {
    fetch("/smeditor/assets/app/changelog.json")
      .then(data => data.json())
      .then((versions: CoreVersion[]) => {
        setVersions(
          versions.map(version => {
            return `# ${version.version}\n---\n` + version.changelog
          })
        )
      })
  }, [])

  return (
    <div className="flex-column-full">
      <div className="markdown-container">
        {versions.map((content, i) => (
          <div key={i}>
            <Markdown components={{ a: LinkRenderer }}>{content}</Markdown>
          </div>
        ))}
      </div>
      <div className="menu-options" style={{ justifyContent: "flex-end" }}>
        <button
          className="confirm"
          onClick={() => {
            window.close()
          }}
        >
          Close
        </button>
      </div>
    </div>
  )
}

export function ChangelogWindow(): WindowData {
  return {
    title: "Changelog",
    width: 600,
    height: 500,
    id: "changelog",
    content: <ChangelogWindowContent />,
  }
}
