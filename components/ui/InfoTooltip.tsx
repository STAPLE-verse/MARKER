import { InformationCircleIcon } from "@heroicons/react/24/outline";

export interface InfoTooltipProps {
  text: string;
}

/**
 * Small hover-reveal explainer icon, for a form label that needs a short
 * aside without permanently occupying space (unlike Input/Textarea's
 * always-visible `helperText`). Styled to match form-studio's own tooltip
 * icons (kept as a separate package, but matched deliberately so the two
 * don't look inconsistent side by side) — `tooltip-info` tints the bubble,
 * `h-6 w-6` matches both form-studio's icon size and this codebase's own
 * Alert.tsx, and `text-info` is the same semantic blue Alert/Toast already
 * use for their "info" variant.
 */
export function InfoTooltip({ text }: InfoTooltipProps) {
  return (
    <span
      className="tooltip tooltip-right tooltip-info z-50 before:max-w-xs inline-flex cursor-help"
      data-tip={text}
    >
      <InformationCircleIcon className="h-6 w-6 text-info" strokeWidth={2} />
    </span>
  );
}
