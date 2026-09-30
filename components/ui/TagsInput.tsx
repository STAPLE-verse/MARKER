import React from "react";
import { WithContext as ReactTags, SEPARATORS } from "react-tag-input";
import { stapleFieldClass } from "@/components/ui/fieldStyles";

type ReactTag = NonNullable<React.ComponentProps<typeof ReactTags>["tags"]>[number];

function getTagText(tag: ReactTag): string {
  return tag.text || tag.id;
}

export interface TagsInputProps {
  value: string[];
  onChange: (value: string[]) => void;
  label?: React.ReactNode;
  placeholder?: string;
  description?: string;
  error?: string;
}

/**
 * Plain controlled tag-list editor (add/remove/reorder a list of short,
 * delimiter-free strings — e.g. keywords), wrapping react-tag-input. Not
 * bound to react-hook-form itself — KeywordsInput wraps this in a Controller
 * for form fields.
 *
 * Not a fit for free-text strings that may themselves contain a separator
 * character (","/";"/Tab/Enter) — react-tag-input commits the current input
 * as a tag the moment one of those characters is typed, silently splitting
 * a single value in two. Affiliation names routinely contain commas, so
 * they use a dedicated plain-text-row list instead of this component.
 */
export function TagsInput({
  value,
  onChange,
  label,
  placeholder = "Add tags...",
  description,
  error,
}: TagsInputProps) {
  const tags = value.map((text) => ({ id: text, text, className: "" }));

  const handleDelete = (index: number) => {
    onChange(tags.filter((_, i) => i !== index).map((t) => t.text));
  };

  const handleAddition = (tag: ReactTag) => {
    const text = getTagText(tag);
    if (!tags.find((t) => t.text === text)) {
      onChange([...tags.map((t) => t.text), text]);
    }
  };

  const handleDrag = (tag: ReactTag, currPos: number, newPos: number) => {
    const texts = tags.map((t) => t.text);
    texts.splice(currPos, 1);
    texts.splice(newPos, 0, getTagText(tag));
    onChange(texts);
  };

  return (
    <div className="form-control w-full">
      {label && (
        <label className="label pb-2">
          <span className="label-text text-xl text-base-content">{label}</span>
        </label>
      )}

      <div className="react-tags-wrapper">
        <ReactTags
          tags={tags}
          separators={[SEPARATORS.TAB, SEPARATORS.COMMA, SEPARATORS.ENTER, SEPARATORS.SEMICOLON]}
          handleDelete={handleDelete}
          handleAddition={handleAddition}
          handleDrag={handleDrag}
          placeholder={placeholder}
          autoFocus={false}
          classNames={{
            tags: "w-full",
            tagInput: "w-full mt-2",
            tagInputField: `input w-full text-base ${stapleFieldClass("input", !!error)}`,
            selected: "flex flex-wrap gap-2",
            tag: "badge badge-primary badge-lg gap-2 cursor-pointer font-medium p-3",
            remove: "hover:text-red-300 opacity-70 hover:opacity-100",
            suggestions: "absolute z-50 bg-base-100 shadow-xl rounded-md border border-base-200 mt-1 overflow-hidden",
            activeSuggestion: "bg-primary text-primary-content cursor-pointer",
            editTagInput: "w-full",
            editTagInputField: `input w-full text-base ${stapleFieldClass("input")}`,
          }}
        />
      </div>

      {description && !error && (
        <label className="label pt-2">
          <span className="label-text-alt text-base-content/90">{description}</span>
        </label>
      )}

      {error && (
        <label className="label pt-2">
          <span className="label-text-alt text-error">{error}</span>
        </label>
      )}
    </div>
  );
}
