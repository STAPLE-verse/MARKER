"use client";

import React, { useId, useRef, useState } from "react";
import { cn } from "@/lib/utils";
import { stapleFieldClass } from "./fieldStyles";
import type { SelectOption } from "./Select";

interface SearchableSelectProps {
  label?: React.ReactNode;
  /** Plain-text name for assistive tech when `label` is absent or not just text. */
  ariaLabel?: string;
  options: SelectOption[];
  /** The selected option's `value`, or "" for none. */
  value: string;
  onChange: (value: string) => void;
  onBlur?: () => void;
  placeholder?: string;
  error?: string;
  className?: string;
}

/**
 * A single-choice dropdown you can type into — for lists too long to scroll
 * (every language, every research field). Looks and labels like `Select`;
 * typing narrows the list by label or group, arrow keys move, Enter picks,
 * Escape or clicking away puts the current choice back.
 *
 * A stored value that isn't in `options` (legacy data) is shown as-is rather
 * than blanked, so opening a form never silently drops it.
 */
export function SearchableSelect({
  label,
  ariaLabel,
  options,
  value,
  onChange,
  onBlur,
  placeholder,
  error,
  className,
}: SearchableSelectProps) {
  const id = useId();
  const listId = `${id}-list`;
  const listRef = useRef<HTMLUListElement>(null);
  // null = closed (the box shows the selected label); a string = open, holding what's been typed.
  const [query, setQuery] = useState<string | null>(null);
  const [activeIndex, setActiveIndex] = useState(0);

  const selectedLabel = options.find((option) => option.value === value)?.label ?? value;
  const open = query !== null;
  const needle = (query ?? "").trim().toLowerCase();
  const matches = needle
    ? options.filter(
        (option) =>
          option.label.toLowerCase().includes(needle) || (option.group ?? "").toLowerCase().includes(needle)
      )
    : options;
  const active = Math.min(activeIndex, Math.max(matches.length - 1, 0));

  const scrollTo = (index: number) => {
    listRef.current?.querySelector(`[data-index="${index}"]`)?.scrollIntoView({ block: "nearest" });
  };

  const move = (index: number) => {
    setActiveIndex(index);
    scrollTo(index);
  };

  const pick = (option: SelectOption) => {
    onChange(option.value);
    setQuery(null);
  };

  const onKeyDown = (event: React.KeyboardEvent<HTMLInputElement>) => {
    if (event.key === "ArrowDown" || event.key === "ArrowUp") {
      event.preventDefault();
      if (!open) {
        setQuery("");
        setActiveIndex(0);
      } else if (matches.length > 0) {
        const step = event.key === "ArrowDown" ? 1 : -1;
        move((active + step + matches.length) % matches.length);
      }
    } else if (event.key === "Enter" && open) {
      // Keep Enter from submitting the surrounding form while choosing.
      event.preventDefault();
      if (matches[active]) pick(matches[active]);
    } else if (event.key === "Escape" && open) {
      event.preventDefault();
      setQuery(null);
    }
  };

  return (
    <div className="flex w-full flex-col gap-1.5">
      {label && (
        <label className="label" htmlFor={id}>
          <span className="label-text text-xl text-base-content">{label}</span>
        </label>
      )}
      <div className="relative">
        <input
          id={id}
          type="text"
          role="combobox"
          aria-label={ariaLabel}
          aria-expanded={open}
          aria-controls={listId}
          aria-autocomplete="list"
          aria-invalid={error ? true : undefined}
          aria-activedescendant={open && matches[active] ? `${listId}-${active}` : undefined}
          autoComplete="off"
          value={open ? query : selectedLabel}
          placeholder={placeholder}
          onFocus={(event) => event.currentTarget.select()}
          onClick={() => {
            if (!open) {
              setQuery("");
              setActiveIndex(Math.max(options.findIndex((option) => option.value === value), 0));
            }
          }}
          onChange={(event) => {
            setQuery(event.target.value);
            setActiveIndex(0);
          }}
          onKeyDown={onKeyDown}
          onBlur={() => {
            setQuery(null);
            onBlur?.();
          }}
          className={cn("input w-full text-base", stapleFieldClass("input", !!error), className)}
        />
        {open && (
          <ul
            ref={listRef}
            id={listId}
            role="listbox"
            className="absolute z-30 mt-1 w-full max-h-72 overflow-y-auto bg-base-100 border border-base-content/20 rounded-lg shadow-lg"
          >
            {matches.length === 0 && <li className="px-3 py-2 text-base text-base-content/90">No matches.</li>}
            {matches.map((option, index) => (
              <li
                key={option.value}
                id={`${listId}-${index}`}
                data-index={index}
                role="option"
                aria-selected={option.value === value}
                // mousedown, not click: the input's blur (which closes the list) fires before click would.
                onMouseDown={(event) => {
                  event.preventDefault();
                  pick(option);
                }}
                onMouseEnter={() => setActiveIndex(index)}
                className={cn(
                  "flex items-baseline justify-between gap-3 px-3 py-2 text-base cursor-pointer",
                  index === active && "bg-base-300",
                  option.value === value && "font-semibold"
                )}
              >
                <span className="min-w-0 break-words">{option.label}</span>
                {option.group && <span className="shrink-0 text-base-content/90">{option.group}</span>}
              </li>
            ))}
          </ul>
        )}
      </div>
      {error && (
        <label className="label">
          <span className="label-text-alt text-error">{error}</span>
        </label>
      )}
    </div>
  );
}
