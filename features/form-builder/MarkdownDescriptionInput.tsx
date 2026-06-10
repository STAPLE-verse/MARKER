import { useState } from "react"
import ReactMarkdown from "react-markdown"
import remarkGfm from "remark-gfm"
import remarkBreaks from "remark-breaks"

export default function MarkdownDescriptionInput({
  value,
  onChange,
}: {
  value: string
  onChange: (v: string) => void
}) {
  const [mode, setMode] = useState<"edit" | "preview">("edit")

  return (
    <div className="form-description-wrapper">
      <div className="form-desc-toolbar flex items-center gap-2 mb-3">
        <div className="join">
          <button
            type="button"
            className={`btn btn-sm join-item ${mode === "edit" ? "btn-primary" : "btn-ghost"}`}
            onClick={() => setMode("edit")}
          >
            Edit
          </button>
          <button
            type="button"
            className={`btn btn-sm join-item ${mode === "preview" ? "btn-primary" : "btn-ghost"}`}
            onClick={() => setMode("preview")}
          >
            Preview
          </button>
        </div>
        <span className="text-sm opacity-60 italic">Supports Markdown</span>
      </div>
      {mode === "edit" ? (
        <textarea
          value={value}
          placeholder="Description"
          rows={4}
          className="textarea textarea-primary textarea-bordered w-full form-description"
          onChange={(ev) => onChange(ev.target.value)}
        />
      ) : (
        <div className="markdown-display prose prose-sm max-w-none prose-p:m-0 dark:prose-invert textarea textarea-primary textarea-bordered w-full h-auto min-h-[6rem]">
          {value ? (
            <ReactMarkdown remarkPlugins={[remarkGfm, remarkBreaks]}>
              {value}
            </ReactMarkdown>
          ) : (
            <span className="text-base-content/40 italic">Nothing to preview yet…</span>
          )}
        </div>
      )}
    </div>
  )
}
