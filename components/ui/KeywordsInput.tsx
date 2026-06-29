import React from "react";
import { WithContext as ReactTags, SEPARATORS } from "react-tag-input";
import { Control, Controller, FieldErrors, FieldValues, Path } from "react-hook-form";

type ReactTag = NonNullable<React.ComponentProps<typeof ReactTags>["tags"]>[number];
type KeywordTag = ReactTag & { text: string };

function getTagText(tag: ReactTag): string {
  return tag.text || tag.id;
}

function toKeywordTag(tag: ReactTag): KeywordTag {
  return {
    ...tag,
    text: getTagText(tag),
  };
}

interface KeywordsInputProps<TFieldValues extends FieldValues> {
  name: Path<TFieldValues>;
  control: Control<TFieldValues>;
  label: string;
  placeholder?: string;
  description?: string;
  errors?: FieldErrors<TFieldValues>;
}

export function KeywordsInput<TFieldValues extends FieldValues>({
  name,
  control,
  label,
  placeholder = "Add tags...",
  description,
  errors,
}: KeywordsInputProps<TFieldValues>) {
  return (
    <Controller
      control={control}
      name={name}
      render={({ field: { value, onChange } }) => {
        // Map string[] to Tag[]
        const tags: KeywordTag[] = Array.isArray(value) 
          ? value.map((t: string) => ({ id: t, text: t, className: "" }))
          : [];

        const handleDelete = (index: number) => {
          const newTags = tags.filter((_, i) => i !== index);
          onChange(newTags.map(t => t.text));
        };

        const handleAddition = (tag: ReactTag) => {
          const text = getTagText(tag);
          // Prevent duplicates
          if (!tags.find(t => t.text === text)) {
            onChange([...tags.map(t => t.text), text]);
          }
        };

        const handleDrag = (tag: ReactTag, currPos: number, newPos: number) => {
          const newTags = [...tags];
          newTags.splice(currPos, 1);
          newTags.splice(newPos, 0, toKeywordTag(tag));
          onChange(newTags.map(t => t.text));
        };

        const errorMessage = errors?.[name]?.message as string | undefined;

        return (
          <div className="form-control w-full">
            <div className="label pt-0 pb-1">
              <span className="label-text font-semibold">{label}</span>
            </div>
            
            <div className="react-tags-wrapper">
              <ReactTags
                tags={tags}
                separators={[SEPARATORS.TAB, SEPARATORS.COMMA, SEPARATORS.ENTER, SEPARATORS.SEMICOLON]}
                handleDelete={handleDelete}
                handleAddition={handleAddition}
                handleDrag={handleDrag}
                placeholder={placeholder}
                autofocus={false}
                classNames={{
                  tags: "w-full",
                  tagInput: "w-full mt-2",
                  tagInputField: `input input-bordered w-full ${errorMessage ? "input-error" : ""}`,
                  selected: "flex flex-wrap gap-2",
                  tag: "badge badge-primary badge-lg gap-2 cursor-pointer font-medium p-3",
                  remove: "hover:text-red-300 opacity-70 hover:opacity-100",
                  suggestions: "absolute z-50 bg-base-100 shadow-xl rounded-md border border-base-200 mt-1 overflow-hidden",
                  activeSuggestion: "bg-primary text-primary-content cursor-pointer",
                  editTagInput: "w-full",
                  editTagInputField: "input input-bordered w-full",
                }}
              />
            </div>

            {description && !errorMessage && (
              <div className="label pb-0 pt-1">
                <span className="label-text-alt text-base-content/60">{description}</span>
              </div>
            )}
            
            {errorMessage && (
              <div className="label pb-0 pt-1">
                <span className="label-text-alt text-error">{errorMessage}</span>
              </div>
            )}
          </div>
        );
      }}
    />
  );
}
