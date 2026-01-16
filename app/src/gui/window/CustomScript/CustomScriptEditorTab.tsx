import { Editor } from "@monaco-editor/react"
import { useContext, useEffect, useRef, useState } from "react"
import { initializeMonaco } from "../../../util/custom-script/CustomScriptEditor"
import { CustomScriptRunner } from "../../../util/custom-script/CustomScriptRunner"
import { CustomScript } from "../../../util/custom-script/CustomScriptTypes"
import { Themes } from "../../../util/Theme"
import { WindowContext } from "../WindowManager"

const LOG_COLORS = {
  log: {
    background: "",
    text: "",
  },
  error: {
    background: "#660000",
    text: "#ffaaaa",
  },
  warn: {
    background: "#665500",
    text: "#ffffaa",
  },
  info: {
    background: "",
    text: "#676767ff",
  },
}

export function CustomScriptEditorTab(props: {
  scriptIndex: number
  scripts: CustomScript[]
}) {
  const editorRef = useRef<
    import("monaco-editor").editor.IStandaloneCodeEditor | null
  >(null)
  const monacoRef = useRef<typeof import("monaco-editor") | null>(null)
  const app = useContext(WindowContext)!.app
  const worker = useRef<Worker | null>(null)
  const [running, setRunning] = useState(false)
  const [logs, setLogs] = useState<
    ["log" | "error" | "warn" | "info", string][]
  >([])
  const startTime = useRef<number>(0)

  const script = props.scripts[props.scriptIndex]

  function toString(object: any) {
    if (typeof object === "string") return object
    try {
      return JSON.stringify(object)
    } catch (e) {
      return String(object)
    }
  }

  async function run() {
    const editor = editorRef.current
    const monaco = monacoRef.current
    if (!editor || !monaco) return
    worker.current?.terminate()
    setLogs([["info", "Running..."]])
    const client = await monaco.languages.typescript
      .getTypeScriptWorker()
      .then(worker => worker())
      .catch(err => {
        setLogs(oldLogs => [
          ...oldLogs,
          ["error", "Compilation error: " + err.message],
        ])
        return null
      })
    if (!client) return
    const result = await client.getEmitOutput("file:///main.ts")
    startTime.current = performance.now()
    const w = CustomScriptRunner.run(
      app,
      {
        name: "Custom Script",
        tsCode: editor.getModel()?.getValue() ?? "",
        jsCode: result.outputFiles[0].text,
        description: "",
        keybinds: [],
        arguments: [],
      },
      [],
      (type, ...args) => {
        setLogs(oldLogs => [...oldLogs, [type, args.map(toString).join(" ")]])
      },
      () => {
        setLogs(oldLogs => [
          ...oldLogs,
          [
            "info",
            `Finished running after ${(performance.now() - startTime.current).toFixed(2)} ms`,
          ],
        ])
        setRunning(false)
      }
    )
    if (!w) return
    setRunning(true)
    worker.current = w
  }

  useEffect(() => {
    const keyDown = (e: KeyboardEvent) => {
      if (!editorRef.current?.getDomNode()?.contains(e.target as HTMLElement))
        return
      if (e.key === "'" || e.key === '"') {
        setTimeout(() => {
          editorRef.current?.trigger("", "editor.action.triggerSuggest", {
            auto: true,
          })
        }, 100)
      }
    }
    document.addEventListener("keydown", keyDown)
    return () => {
      document.removeEventListener("keydown", keyDown)
    }
  }, [editorRef.current])

  useEffect(() => {
    if (!editorRef.current) return
    worker.current?.terminate()
    editorRef.current?.setValue(script.tsCode)
  }, [script, editorRef.current])

  if (!script) return <div>No script selected.</div>

  return (
    <div className="flex-column-full">
      <Editor
        defaultLanguage="typescript"
        beforeMount={monaco => {
          initializeMonaco(monaco)
          monacoRef.current = monaco
        }}
        onMount={e => {
          editorRef.current = e
          e.setValue(script.tsCode)
          e.addCommand(
            monacoRef.current!.KeyMod.WinCtrl | monacoRef.current!.KeyCode.KeyM,
            () =>
              editorRef.current?.trigger("", "editor.action.triggerSuggest", {})
          )
        }}
        path="main.ts"
        theme={Themes.isDarkTheme() ? "dark" : "light"}
        options={{
          fixedOverflowWidgets: true,
          automaticLayout: true,
          minimap: { enabled: false },
          "semanticHighlighting.enabled": true,
        }}
      />
      <div style={{ marginTop: "1rem", marginBottom: "0.5rem" }}>Console</div>
      <pre
        className="custom-console"
        style={{
          height: "10rem",
          overflowY: "auto",
          backgroundColor: "#1e1e1e",
          color: "white",
          margin: "0",
          padding: "0.5rem",
          fontSize: "0.675rem",
        }}
      >
        {logs.map(([type, message], i) => {
          const { background, text } = LOG_COLORS[type]
          return (
            <div
              key={i}
              style={{
                backgroundColor: background,
                color: text,
                wordBreak: "break-word",
                whiteSpace: "pre-wrap",
                fontStyle: type === "info" ? "italic" : "normal",
              }}
            >
              {message}
            </div>
          )
        })}
      </pre>
      <button
        className={running ? "delete" : ""}
        onClick={() => {
          if (running) {
            worker.current?.terminate()
            setLogs(oldLogs => [
              ...oldLogs,
              [
                "info",
                `Interrupted after ${(performance.now() - startTime.current).toFixed(2)} ms`,
              ],
            ])
            setRunning(false)
            return
          }
          run()
        }}
      >
        {running ? "Stop" : "Test"}
      </button>
    </div>
  )
}
