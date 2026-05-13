import { Editor } from "@monaco-editor/react"
import { useContext, useEffect, useRef, useState } from "react"
import { initializeMonaco } from "../../../util/custom-script/CustomScriptEditor"
import { CustomScriptRunner } from "../../../util/custom-script/CustomScriptRunner"
import { CustomScripts } from "../../../util/custom-script/CustomScripts"
import { CustomScript } from "../../../util/custom-script/CustomScriptTypes"
import { Themes } from "../../../util/Theme"
import { WaterfallManager } from "../../element/WaterfallManager"
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
  scriptIndex: number | null
  scripts: CustomScript[]
}) {
  const windowData = useContext(WindowContext)!
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
  const lastIndex = useRef<number | null>(props.scriptIndex)
  const [scriptLength, setScriptLength] = useState(0)

  const script =
    props.scriptIndex == null ? null : props.scripts[props.scriptIndex]

  function toString(object: any) {
    if (typeof object === "string") return object
    try {
      return JSON.stringify(object)
    } catch (e) {
      return String(object)
    }
  }

  async function compile() {
    const monaco = monacoRef.current
    if (!monaco) return null
    const client = await monaco.languages.typescript
      .getTypeScriptWorker()
      .then(worker => worker())
      .catch(() => {
        return null
      })
    if (!client) return null
    const result = await client.getEmitOutput("file:///main.ts")
    return result.outputFiles[0].text
  }

  async function run() {
    const editor = editorRef.current
    const monaco = monacoRef.current
    if (!editor || !monaco || !script) return
    worker.current?.terminate()
    setLogs([["info", "Running..."]])

    const tsCode = editor.getModel()?.getValue() ?? ""
    if (tsCode.length > CustomScriptRunner.MAX_LENGTH) {
      setLogs(oldLogs => [...oldLogs, ["error", "Your script is too long!"]])
      return
    }
    const jsCode = await compile()
    if (!jsCode) {
      setLogs(oldLogs => [
        ...oldLogs,
        ["error", "An error occured while trying to compile this script!"],
      ])

      return
    }

    script.tsCode = tsCode
    script.jsCode = jsCode

    startTime.current = performance.now()
    const w = await CustomScriptRunner.runPrompt(
      app,
      script,
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

  async function saveScript() {
    if (lastIndex.current === null) return
    // compile and save the current script before switching
    const code = editorRef.current?.getModel()?.getValue()

    if (!props.scripts[lastIndex.current]) return

    if (code !== undefined) {
      if (code.length > CustomScriptRunner.MAX_LENGTH) {
        props.scripts[lastIndex.current].tsCode = code
        props.scripts[lastIndex.current].jsCode = null
        WaterfallManager.createFormatted(
          `Your script is too long! It will be saved, but you won't be able to run it.`,
          "warn"
        )
      }

      if (code != props.scripts[lastIndex.current].tsCode) {
        const jsCode = await compile()
        if (jsCode) {
          props.scripts[lastIndex.current].jsCode = jsCode
        } else {
          WaterfallManager.createFormatted(
            "An error occured while trying to save this script!",
            "error"
          )
        }
      }
      props.scripts[lastIndex.current].tsCode = code
    } else {
      WaterfallManager.createFormatted(
        "An error occured while trying to save this script!",
        "error"
      )
    }
    CustomScripts.saveCustomScripts()
  }

  useEffect(() => {
    if (!editorRef.current) return
    worker.current?.terminate()

    const run = async () => {
      if (
        lastIndex.current !== props.scriptIndex &&
        lastIndex.current !== null
      ) {
        await saveScript()
      }

      lastIndex.current = props.scriptIndex
      editorRef.current?.setValue(script?.tsCode ?? "")
    }
    run()
  }, [props.scriptIndex, editorRef.current])

  useEffect(() => {
    window.addEventListener("beforeunload", saveScript)
    windowData.beforeClose(async () => {
      return saveScript()
    })
    return () => {
      window.removeEventListener("beforeunload", saveScript)
    }
  }, [])

  return (
    <div className="flex-column-full" style={{ display: script ? "" : "none" }}>
      <Editor
        defaultLanguage="typescript"
        beforeMount={monaco => {
          initializeMonaco(monaco)
          monacoRef.current = monaco
        }}
        onMount={e => {
          editorRef.current = e
          e.setValue(script?.tsCode ?? "")
          e.addCommand(
            monacoRef.current!.KeyMod.WinCtrl | monacoRef.current!.KeyCode.KeyM,
            () =>
              editorRef.current?.trigger("", "editor.action.triggerSuggest", {})
          )
        }}
        onChange={e => {
          if (!e) return
          setScriptLength(e.length)
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
      <p
        style={{
          marginLeft: "auto",
          fontSize: "0.8rem",
          color:
            scriptLength > CustomScriptRunner.MAX_LENGTH ? "red" : "#676767",
        }}
      >
        {scriptLength}/{CustomScriptRunner.MAX_LENGTH} chars
      </p>
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
