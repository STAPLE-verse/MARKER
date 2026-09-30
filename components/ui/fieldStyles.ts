/**
 * STAPLE's field look, shared so every page's boxes match: a 2px primary
 * border, switching to a thick secondary ring while focused. Text inside —
 * typed, selected or placeholder — is the normal text color, not primary. The focus color
 * goes through daisyUI's own `--input-color`, which drives both its border
 * and its focus outline.
 *
 * Add a background to suit the surface the field sits on: `bg-base-300` on
 * the page (as STAPLE does), `bg-base-100` inside a card (cards are already
 * `base-300`, so the same fill would make the box disappear).
 */
const STAPLE_FIELD_BASE =
  "border-2 text-base-content placeholder:text-base-content! rounded-[3px] " +
  "focus:[--input-color:var(--color-secondary)]! focus:outline-[3px]! focus:outline-offset-0!";

/** For `input` elements (pair with daisyUI's `input`). */
export const STAPLE_INPUT_CLASS = `input-primary ${STAPLE_FIELD_BASE}`;

/** For `select` elements (pair with daisyUI's `select`). */
export const STAPLE_SELECT_CLASS = `select-primary ${STAPLE_FIELD_BASE}`;

/** For `textarea` elements (pair with daisyUI's `textarea`). */
export const STAPLE_TEXTAREA_CLASS = `textarea-primary ${STAPLE_FIELD_BASE}`;

/**
 * The default look for the shared field components (`Input`, `Select`,
 * `Textarea`, …): the STAPLE style on the page color, which is right for the
 * usual case of a field inside a card. The border turns to the error color
 * instead of primary when the field has an error. Callers can still pass a
 * different background through `className`.
 */
export function stapleFieldClass(kind: "input" | "select" | "textarea", hasError = false): string {
  return `${kind}-${hasError ? "error" : "primary"} ${STAPLE_FIELD_BASE} bg-base-100`;
}
