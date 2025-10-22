import * as React from "react"

import { cn } from "@/lib/utils"
import { withHalfWidthConversion } from "@/lib/utils/text"

const Textarea = React.forwardRef<HTMLTextAreaElement, React.ComponentProps<"textarea">>(
  ({ className, onChange, ...props }, ref) => {
    return (
      <textarea
        className={cn(
          "flex min-h-[80px] w-full rounded-md border border-input bg-background px-3 py-2 text-base placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-ring disabled:cursor-not-allowed disabled:opacity-50 md:text-sm",
          className
        )}
        ref={ref}
        onChange={withHalfWidthConversion(onChange)}
        {...props}
      />
    )
  }
)
Textarea.displayName = "Textarea"

export { Textarea }