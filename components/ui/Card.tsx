import React from "react"
import { cn } from "@/lib/utils"

const Card = React.forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement> & { bordered?: boolean }>(
  ({ className, bordered = false, ...props }, ref) => (
    <div
      ref={ref}
      className={cn(
        "card bg-base-100",
        bordered ? "border border-base-300 shadow-sm" : "shadow-xl",
        className
      )}
      {...props}
    />
  )
)
Card.displayName = "Card"

const CardBody = React.forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement>>(
  ({ className, ...props }, ref) => (
    <div ref={ref} className={cn("card-body", className)} {...props} />
  )
)
CardBody.displayName = "CardBody"

const CardTitle = React.forwardRef<HTMLHeadingElement, React.HTMLAttributes<HTMLHeadingElement>>(
  ({ className, ...props }, ref) => (
    <h2 ref={ref} className={cn("card-title text-2xl font-bold", className)} {...props} />
  )
)
CardTitle.displayName = "CardTitle"

const CardActions = React.forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement>>(
  ({ className, ...props }, ref) => (
    <div ref={ref} className={cn("card-actions justify-end mt-4", className)} {...props} />
  )
)
CardActions.displayName = "CardActions"

export { Card, CardBody, CardTitle, CardActions }
