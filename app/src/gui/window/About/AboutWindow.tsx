import { WindowData } from "../WindowManager"

export function AboutWindowContent() {
  return (
    <div className="flex-column-full">
      <div className="about-container">
        <div className="logo-container">
          <img src="/smeditor/assets/icon/logo.png" />
          <div>SMEditor</div>
        </div>
        <div style={{ textAlign: "center" }}>
          Open source online web tool to view and edit StepMania charts
          (.sm/.ssc files). Maintained by tillvit
        </div>
        <div
          style={{
            fontSize: "0.875rem",
            color: "var(--text-color-secondary)",
            textAlign: "center",
          }}
        >
          Core v{window.app.VERSION}
          {window.nw && (
            <>
              {" "}
              | App v
              {
                nw.require("nw.gui").App.manifest
                  .version /* why does using App break pixi */
              }
            </>
          )}
          {import.meta.env.VITE_GIT_COMMIT_DATE &&
            import.meta.env.VITE_GIT_COMMIT_HASH &&
            import.meta.env.VITE_GIT_COMMIT_BRANCH && (
              <>
                {" "}
                | {import.meta.env.VITE_GIT_COMMIT_BRANCH}-
                {import.meta.env.VITE_GIT_COMMIT_HASH} (
                {new Date(
                  import.meta.env.VITE_GIT_COMMIT_DATE
                ).toLocaleString()}
                )
              </>
            )}
        </div>
      </div>
    </div>
  )
}

export function AboutWindow(): WindowData {
  return {
    id: "about",
    title: "About",
    width: 300,
    content: <AboutWindowContent />,
  }
}
