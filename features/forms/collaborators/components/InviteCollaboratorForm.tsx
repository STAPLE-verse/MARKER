"use client";

import { useEffect, useRef, useState } from "react";
import { Input } from "@/components/ui/Input";
import { Select } from "@/components/ui/Select";
import { Button } from "@/components/ui/Button";
import { Avatar } from "@/components/ui/Avatar";
import { runAction } from "@/lib/action";
import { toast } from "@/lib/toast";
import { searchInvitableUsers } from "../actions/searchInvitableUsers";
import type { CollaboratorRole, InvitableUserDTO } from "../types";

interface InviteCollaboratorFormProps {
  formId: number;
  onInvite: (invitee: InvitableUserDTO, role: CollaboratorRole, onDone?: () => void) => void;
  isPending: boolean;
}

const DEBOUNCE_MS = 300;
const MIN_QUERY_LENGTH = 2;

/**
 * GitHub-style "add a collaborator" search (docs/refactor/
 * form-collaboration.md §6 item 1): a dropdown of matching user cards, then
 * a role picker once one is selected. Built as a small bespoke list rather
 * than `components/ui/Dropdown` — that component's `DropdownContent`
 * hardcodes DaisyUI's `menu` class, which isn't meant to be combined with
 * `list`/`list-row`'s own row layout (see the plan doc for why `list-row`
 * fits multi-line avatar+text cards better than a single-line `menu` item).
 *
 * The results list is rendered in normal document flow, not
 * `position: absolute` over the page. This form only ever renders inside
 * `CollaboratorManagementModal`, and DaisyUI's `.modal-box` has
 * `overflow-y: auto` for its own legitimate reason (a tall modal needs to
 * scroll) — unlike the avatar-group's `overflow: hidden`, that's not safe to
 * blanket-override. An absolutely-positioned dropdown doesn't count toward
 * its containing block's content height, so it would float past the modal's
 * edge and get clipped with no way to scroll to it. In-flow, it just pushes
 * the content below it down and becomes part of the modal's normal
 * scrollable area, which is the robust fix rather than fighting nested
 * overflow contexts.
 */
export function InviteCollaboratorForm({ formId, onInvite, isPending }: InviteCollaboratorFormProps) {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<InvitableUserDTO[]>([]);
  const [isOpen, setIsOpen] = useState(false);
  const [isSearching, setIsSearching] = useState(false);
  const [selected, setSelected] = useState<InvitableUserDTO | null>(null);
  const [role, setRole] = useState<CollaboratorRole>("EDITOR");
  const containerRef = useRef<HTMLDivElement>(null);
  // Debounce driven from the onChange handler below, not a `useEffect` —
  // triggering an async fetch is a response to a user event here, not a
  // synchronization with an external system, so a ref-held timer/generation
  // counter (to drop a stale response if the query changes again mid-flight)
  // is the right tool, not an effect.
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const searchGenerationRef = useRef(0);

  const runSearch = (value: string) => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    const generation = ++searchGenerationRef.current;
    setIsSearching(true);
    debounceRef.current = setTimeout(async () => {
      const res = await runAction(searchInvitableUsers({ formId, query: value }));
      if (searchGenerationRef.current !== generation) return; // a newer keystroke superseded this search
      setIsSearching(false);
      if (!res.ok) {
        toast.error(res.error);
        return;
      }
      setResults(res.data);
      setIsOpen(true);
    }, DEBOUNCE_MS);
  };

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  useEffect(() => {
    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, []);

  const handleSelect = (user: InvitableUserDTO) => {
    setSelected(user);
    setQuery(user.username);
    setIsOpen(false);
  };

  const handleInvite = () => {
    if (!selected) return;
    onInvite(selected, role, () => {
      setSelected(null);
      setQuery("");
      setResults([]);
      setRole("EDITOR");
    });
  };

  return (
    <div className="space-y-3">
      <div ref={containerRef}>
        <Input
          label="Invite a collaborator"
          placeholder="Search by username or email"
          value={query}
          onChange={(e) => {
            const value = e.target.value;
            setSelected(null);
            setQuery(value);
            const trimmed = value.trim();
            if (trimmed.length < MIN_QUERY_LENGTH) {
              searchGenerationRef.current++; // drop any in-flight search for the old, longer query
              setIsSearching(false);
              setResults([]);
              setIsOpen(false);
              return;
            }
            runSearch(trimmed);
          }}
          onFocus={() => results.length > 0 && !selected && setIsOpen(true)}
          autoComplete="off"
        />
        {isOpen && query.trim().length >= MIN_QUERY_LENGTH && (
          <ul className="list bg-base-100 rounded-box shadow-md mt-1 w-full max-h-64 overflow-y-auto border border-base-300">
            {isSearching && <li className="p-4 text-sm text-base-content/60">Searching…</li>}
            {!isSearching && results.length === 0 && (
              <li className="p-4 text-sm text-base-content/60">No matching users.</li>
            )}
            {!isSearching &&
              results.map((user) => (
                <li
                  key={user.userId}
                  className="list-row cursor-pointer hover:bg-base-200"
                  onClick={() => handleSelect(user)}
                >
                  <Avatar email={user.avatarEmail} fallback={user.username[0]} size={32} />
                  <div>
                    <div className="font-medium">{user.username}</div>
                    {user.name && <div className="text-xs text-base-content/60">{user.name}</div>}
                  </div>
                </li>
              ))}
          </ul>
        )}
      </div>

      {selected && (
        <div className="flex items-end gap-2">
          <Select
            label="Role"
            className="max-w-[10rem]"
            value={role}
            onChange={(e) => setRole(e.target.value as CollaboratorRole)}
            options={[
              { value: "EDITOR", label: "Editor" },
              { value: "VIEWER", label: "Viewer" },
            ]}
          />
          <Button size="sm" onClick={handleInvite} disabled={isPending}>
            {isPending ? "Inviting..." : `Invite ${selected.username}`}
          </Button>
        </div>
      )}
    </div>
  );
}
