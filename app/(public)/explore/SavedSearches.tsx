"use client";

import React, { useMemo, useState, useSyncExternalStore } from "react";
import { BookmarkIcon, TrashIcon } from "@heroicons/react/24/outline";
import { Button } from "@/components/ui/Button";
import { Dropdown, DropdownContent, DropdownTrigger } from "@/components/ui/Dropdown";
import { STAPLE_INPUT_CLASS } from "@/components/ui/fieldStyles";
import { cn } from "@/lib/utils";
import {
  MAX_SAVED_SEARCH_NAME_LENGTH,
  SAVED_SEARCHES_STORAGE_KEY,
  addSavedSearch,
  parseSavedSearches,
  removeSavedSearch,
  type SavedSearch,
} from "@/features/forms/utils/savedSearches";

const CHANGE_EVENT = "marker:saved-searches-changed";

export const SAVED_SEARCHES_NOTE =
  "Saved searches are kept in this browser only. They won't show up on another device or browser, and clearing your browsing data removes them.";

// localStorage as an external store: `storage` fires for changes made in
// other tabs, the custom event for changes made in this one.
function subscribe(onChange: () => void) {
  window.addEventListener("storage", onChange);
  window.addEventListener(CHANGE_EVENT, onChange);
  return () => {
    window.removeEventListener("storage", onChange);
    window.removeEventListener(CHANGE_EVENT, onChange);
  };
}

function readRaw(): string | null {
  try {
    return window.localStorage.getItem(SAVED_SEARCHES_STORAGE_KEY);
  } catch {
    return null;
  }
}

/** False when the browser blocks storage (private mode, strict settings) or it is full. */
function write(searches: SavedSearch[]): boolean {
  try {
    window.localStorage.setItem(SAVED_SEARCHES_STORAGE_KEY, JSON.stringify(searches));
    window.dispatchEvent(new Event(CHANGE_EVENT));
    return true;
  } catch {
    return false;
  }
}

interface SavedSearchesProps {
  /** The current search as a query string ("" when nothing is searched or filtered). */
  currentQuery: string;
  /** Pre-filled name for the current search. */
  suggestedName: string;
  onApply: (query: string) => void;
}

/**
 * "Save this search" and the "Saved searches" menu for the Explore page. The
 * list lives in this browser's localStorage (see savedSearches.ts), so it
 * works signed out and needs no database — at the cost of not following the
 * user to another device, which the note under it says plainly.
 */
export function SavedSearches({ currentQuery, suggestedName, onApply }: SavedSearchesProps) {
  // The server (and the first client render) sees an empty list; the stored
  // one appears right after hydration without a mismatch.
  const raw = useSyncExternalStore(subscribe, readRaw, () => null);
  const searches = useMemo(() => parseSavedSearches(raw), [raw]);

  const [isNaming, setIsNaming] = useState(false);
  const [name, setName] = useState("");
  const [error, setError] = useState<string | null>(null);

  const alreadySaved = searches.some((search) => search.query === currentQuery);

  const startNaming = () => {
    setName(suggestedName.slice(0, MAX_SAVED_SEARCH_NAME_LENGTH));
    setError(null);
    setIsNaming(true);
  };

  const save = (event: React.FormEvent) => {
    event.preventDefault();
    if (!name.trim()) {
      setError("Give this search a name.");
      return;
    }
    const saved = write(
      addSavedSearch(searches, {
        id: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
        name,
        query: currentQuery,
        savedAt: new Date().toISOString(),
      })
    );
    if (!saved) {
      setError("This browser wouldn't let MARKER save the search (private browsing or blocked storage).");
      return;
    }
    setIsNaming(false);
  };

  return (
    <div className="mt-4">
      <div className="flex flex-wrap items-center gap-2">
        {searches.length > 0 && (
          <Dropdown>
            <DropdownTrigger className="btn btn-md text-base btn-secondary" aria-label="Saved searches">
              <BookmarkIcon className="h-5 w-5" aria-hidden="true" />
              Saved searches ({searches.length})
            </DropdownTrigger>
            <DropdownContent className="w-96 max-w-[90vw] mt-1 z-30 flex-nowrap max-h-96 overflow-y-auto">
              {searches.map((search) => (
                <li key={search.id} className="flex flex-row items-center gap-1">
                  <button
                    type="button"
                    className="flex-1 min-w-0 text-left break-words"
                    onClick={() => {
                      onApply(search.query);
                      // daisyUI dropdowns close when focus leaves them.
                      if (document.activeElement instanceof HTMLElement) document.activeElement.blur();
                    }}
                  >
                    {search.name}
                  </button>
                  <button
                    type="button"
                    className="shrink-0 text-error"
                    aria-label={`Delete saved search ${search.name}`}
                    onClick={() => write(removeSavedSearch(searches, search.id))}
                  >
                    <TrashIcon className="h-5 w-5" aria-hidden="true" />
                  </button>
                </li>
              ))}
              <li className="menu-title text-base font-normal whitespace-normal">{SAVED_SEARCHES_NOTE}</li>
            </DropdownContent>
          </Dropdown>
        )}

        {!isNaming && (
          <Button
            variant="primary"
            size="md"
            onClick={startNaming}
            disabled={currentQuery === "" || alreadySaved}
          >
            {alreadySaved ? "Search saved" : "Save this search"}
          </Button>
        )}

        {isNaming && (
          <form onSubmit={save} className="flex flex-wrap items-center gap-2">
            <input
              type="text"
              autoFocus
              value={name}
              maxLength={MAX_SAVED_SEARCH_NAME_LENGTH}
              onChange={(event) => setName(event.target.value)}
              onKeyDown={(event) => event.key === "Escape" && setIsNaming(false)}
              placeholder="Name this search"
              aria-label="Name for this saved search"
              aria-describedby="saved-searches-note"
              className={cn("input input-md text-base w-72 bg-base-300", STAPLE_INPUT_CLASS)}
            />
            <Button type="submit" variant="primary" size="md">
              Save
            </Button>
            <Button type="button" variant="secondary" size="md" onClick={() => setIsNaming(false)}>
              Cancel
            </Button>
          </form>
        )}
      </div>

      {isNaming && (
        <p id="saved-searches-note" className="text-base text-base-content/90 mt-2">
          {SAVED_SEARCHES_NOTE}
        </p>
      )}
      {error && (
        <p role="alert" className="text-base text-error mt-2">
          {error}
        </p>
      )}
    </div>
  );
}
