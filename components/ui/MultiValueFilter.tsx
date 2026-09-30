"use client";

import React, { useId, useState } from "react";
import { XMarkIcon } from "@heroicons/react/20/solid";
import { cn } from "@/lib/utils";
import { stapleFieldClass } from "./fieldStyles";

export interface MultiValueSuggestion {
  value: string;
  /** How many results carry this value — shown next to it. */
  count?: number;
}

interface MultiValueFilterProps {
  /** Accessible name for the text box (the visible row label sits outside this component). */
  label: string;
  placeholder: string;
  values: string[];
  onChange: (values: string[]) => void;
  /** Known values to suggest while typing. */
  suggestions: MultiValueSuggestion[];
  /** Let people add text that isn't a suggestion, matched as "contains". */
  allowFreeText?: boolean;
  /** Extra classes for the text box (e.g. a different background). */
  inputClassName?: string;
}

const MAX_SUGGESTIONS = 8;

/**
 * Type-ahead filter that collects several values as removable chips — for
 * open-ended fields (keywords, contributors) where a fixed checkbox list
 * can't cover what's actually in the catalog. Ported from the registered
 * reports database's `MultiValueFilter`, with the suggestions passed in
 * rather than fetched, and arrow-key / Enter / Escape support.
 */
export function MultiValueFilter({
  label,
  placeholder,
  values,
  onChange,
  suggestions,
  allowFreeText = false,
  inputClassName,
}: MultiValueFilterProps) {
  const listId = useId();
  const [query, setQuery] = useState("");
  const [activeIndex, setActiveIndex] = useState(0);

  const trimmed = query.trim();
  const needle = trimmed.toLowerCase();
  const taken = new Set(values.map((value) => value.toLowerCase()));

  const matches = needle
    ? suggestions
        .filter((s) => s.value.toLowerCase().includes(needle) && !taken.has(s.value.toLowerCase()))
        .slice(0, MAX_SUGGESTIONS)
    : [];
  const showFreeText =
    allowFreeText && needle !== "" && !taken.has(needle) && !matches.some((s) => s.value.toLowerCase() === needle);

  // One flat list so the keyboard can walk the "Contains …" row and the suggestions alike.
  const options: { key: string; value: string; text: React.ReactNode; count?: number }[] = [
    ...(showFreeText ? [{ key: "__free", value: trimmed, text: <>Contains &ldquo;{trimmed}&rdquo;</> }] : []),
    ...matches.map((s) => ({ key: s.value, value: s.value, text: s.value, count: s.count })),
  ];
  const open = needle !== "";
  const active = Math.min(activeIndex, Math.max(options.length - 1, 0));

  const add = (value: string) => {
    onChange([...values, value]);
    setQuery("");
    setActiveIndex(0);
  };

  const onKeyDown = (event: React.KeyboardEvent<HTMLInputElement>) => {
    if (event.key === "ArrowDown" && options.length > 0) {
      event.preventDefault();
      setActiveIndex((active + 1) % options.length);
    } else if (event.key === "ArrowUp" && options.length > 0) {
      event.preventDefault();
      setActiveIndex((active - 1 + options.length) % options.length);
    } else if (event.key === "Enter") {
      event.preventDefault();
      if (options[active]) add(options[active].value);
    } else if (event.key === "Escape") {
      setQuery("");
    } else if (event.key === "Backspace" && query === "" && values.length > 0) {
      onChange(values.slice(0, -1));
    }
  };

  return (
    <div className="flex flex-col gap-2 w-full">
      {values.length > 0 && (
        <div className="flex flex-wrap items-center gap-2">
      {values.map((value) => (
        <span key={value} className="badge badge-primary badge-lg gap-1">
          {value}
          <button
            type="button"
            onClick={() => onChange(values.filter((v) => v !== value))}
            aria-label={`Remove ${value}`}
            className="cursor-pointer"
          >
            <XMarkIcon className="h-4 w-4" aria-hidden="true" />
          </button>
        </span>
      ))}
        </div>
      )}
      <div className="relative">
        <input
          type="text"
          role="combobox"
          aria-label={label}
          aria-expanded={open}
          aria-controls={listId}
          aria-autocomplete="list"
          aria-activedescendant={open && options[active] ? `${listId}-${active}` : undefined}
          value={query}
          onChange={(event) => {
            setQuery(event.target.value);
            setActiveIndex(0);
          }}
          onKeyDown={onKeyDown}
          onBlur={() => setQuery("")}
          placeholder={placeholder}
          className={cn("input input-md text-base w-full", stapleFieldClass("input"), inputClassName)}
        />
        {open && (
          <ul
            id={listId}
            role="listbox"
            aria-label={label}
            className="absolute z-30 mt-1 w-full max-h-72 overflow-y-auto bg-base-100 border border-base-content/20 rounded-lg shadow-lg"
          >
            {options.length === 0 && <li className="px-3 py-2 text-base text-base-content/90">No matches.</li>}
            {options.map((option, index) => (
              <li
                key={option.key}
                id={`${listId}-${index}`}
                role="option"
                aria-selected={index === active}
                // mousedown, not click: the input's blur (which closes the list) fires before click would.
                onMouseDown={(event) => {
                  event.preventDefault();
                  add(option.value);
                }}
                onMouseEnter={() => setActiveIndex(index)}
                className={`flex items-center justify-between gap-3 px-3 py-2 text-base cursor-pointer ${
                  index === active ? "bg-base-300" : ""
                }`}
              >
                <span className="min-w-0 break-words">{option.text}</span>
                {option.count !== undefined && (
                  <span className="shrink-0 text-base-content/90">{option.count}</span>
                )}
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
