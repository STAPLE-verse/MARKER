// The plain "@testing-library/jest-dom" entry point registers matchers at
// runtime but doesn't augment vitest's own `Assertion` type — this subpath
// does both, which `tsc --noEmit` (run project-wide, not just through
// vitest's own type-aware runner) needs to recognize matchers like
// `toBeInTheDocument()`.
import "@testing-library/jest-dom/vitest";

// jsdom has never implemented <dialog>'s showModal()/close() (long-standing
// gap, not project-specific — https://github.com/jsdom/jsdom/issues/3294).
// components/ui/Modal.tsx is native-<dialog>-based, so any test that renders
// it needs this polyfill; kept here rather than per-test since it's an
// environment gap, not a test-specific concern.
if (typeof HTMLDialogElement !== "undefined") {
  if (!HTMLDialogElement.prototype.showModal) {
    HTMLDialogElement.prototype.showModal = function (this: HTMLDialogElement) {
      this.setAttribute("open", "");
    };
  }
  if (!HTMLDialogElement.prototype.close) {
    HTMLDialogElement.prototype.close = function (this: HTMLDialogElement) {
      this.removeAttribute("open");
      this.dispatchEvent(new Event("close"));
    };
  }
}
