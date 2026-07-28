import React from "react"
import { cn } from "@/lib/utils"

export interface CollapsibleCardProps
  extends Omit<React.DetailsHTMLAttributes<HTMLDetailsElement>, "open" | "title"> {
  title: React.ReactNode
  actions?: React.ReactNode
  defaultOpen?: boolean
  bordered?: boolean
  titleClassName?: string
  contentClassName?: string
  actionsClassName?: string
}

const CollapsibleCard = React.forwardRef<HTMLDetailsElement, CollapsibleCardProps>(
  (
    {
      title,
      children,
      actions,
      defaultOpen = false,
      bordered = false,
      className,
      titleClassName,
      contentClassName,
      actionsClassName,
      ...props
    },
    ref
  ) => (
    <details
      ref={ref}
      open={defaultOpen || undefined}
      className={cn(
        "collapse collapse-arrow bg-base-100 w-full max-w-full",
        bordered ? "border border-base-300 shadow-sm" : "shadow-xl",
        className
      )}
      {...props}
    >
      <summary
        className={cn(
          "collapse-title list-none min-w-0 pr-16 [&:after]:!h-3 [&:after]:!w-3 [&:after]:![box-shadow:3px_3px] [&:after]:![inset-inline-end:2rem] [&::-webkit-details-marker]:hidden",
          titleClassName
        )}
      >
        <div className="card-title min-w-0">
          {typeof title === "string" ? <span className="truncate">{title}</span> : title}
        </div>
      </summary>

      <div className={cn("collapse-content min-w-0", contentClassName)}>
        <div className="w-full min-w-0">{children}</div>
        {actions && (
          <div className={cn("card-actions justify-end mt-4", actionsClassName)}>
            {actions}
          </div>
        )}
      </div>
    </details>
  )
)
CollapsibleCard.displayName = "CollapsibleCard"

export { CollapsibleCard }
