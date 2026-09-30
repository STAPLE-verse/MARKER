"use client";

import React, { useRef, useState } from 'react';
import { cn } from '@/lib/utils';
import { stapleFieldClass } from './fieldStyles';
import { Markdown } from './Markdown';

type TextareaProps = React.TextareaHTMLAttributes<HTMLTextAreaElement> & {
  label?: React.ReactNode;
  error?: string;
  helperText?: string;
  /**
   * Adds STAPLE's Edit / Preview toggle and a "Supports Markdown" note. Only
   * turn this on for text that is rendered as Markdown where it's displayed
   * (see `Markdown`), or the preview promises formatting readers won't get.
   */
  markdown?: boolean;
};

export const Textarea = React.forwardRef<HTMLTextAreaElement, TextareaProps>(({
  label,
  error,
  helperText,
  markdown = false,
  className,
  ...props
}, ref) => {
  const innerRef = useRef<HTMLTextAreaElement | null>(null);
  const [mode, setMode] = useState<"edit" | "preview">("edit");
  const [previewText, setPreviewText] = useState("");

  // The caller's ref (react-hook-form's `register`) and ours both need the element.
  const setRefs = (element: HTMLTextAreaElement | null) => {
    innerRef.current = element;
    if (typeof ref === "function") ref(element);
    else if (ref) ref.current = element;
  };

  const showPreview = () => {
    // Read straight from the element: the field is usually uncontrolled, so
    // there is no `value` prop to look at.
    setPreviewText(innerRef.current?.value ?? "");
    setMode("preview");
  };

  return (
    <div className="form-control w-full mt-6">
      {label && (
        <label className="label pb-2">
          <span className="label-text text-xl text-base-content">{label}</span>
        </label>
      )}
      {markdown && (
        <div className="flex flex-wrap items-center gap-3 mb-2">
          <div className="join">
            <button
              type="button"
              aria-pressed={mode === "edit"}
              className={cn("btn btn-md text-base join-item", mode === "edit" ? "btn-primary" : "")}
              onClick={() => setMode("edit")}
            >
              Edit
            </button>
            <button
              type="button"
              aria-pressed={mode === "preview"}
              className={cn("btn btn-md text-base join-item", mode === "preview" ? "btn-primary" : "")}
              onClick={showPreview}
            >
              Preview
            </button>
          </div>
          <span className="text-base text-base-content italic">
            Supports{" "}
            <a
              href="https://www.markdownguide.org/cheat-sheet/"
              target="_blank"
              rel="noopener noreferrer"
              className="text-primary underline"
            >
              Markdown
            </a>{" "}
            formatting.
          </span>
        </div>
      )}
      {/* Hidden, not unmounted, while previewing: react-hook-form reads the
          value from this element, so it has to stay in the document. */}
      <textarea
        ref={setRefs}
        className={cn(
          "textarea w-full text-base",
          stapleFieldClass("textarea", !!error),
          className,
          mode === "preview" && "hidden"
        )}
        {...props}
      />
      {mode === "preview" && (
        <div
          className={cn(
            "w-full min-h-32 rounded-[3px] border-2 border-base-content/20 bg-base-100 px-4 py-3 text-base overflow-auto"
          )}
        >
          <Markdown>{previewText.trim() || "_Nothing to preview yet…_"}</Markdown>
        </div>
      )}
      {(error || helperText) && (
        <label className="label pt-2">
          <span className={cn(
            "label-text-alt",
            error ? "text-error" : "text-base-content/90"
          )}>
            {error || helperText}
          </span>
        </label>
      )}
    </div>
  );
});

Textarea.displayName = 'Textarea';
