import * as React from "react"

import { cn } from "@/lib/utils"

export interface TextareaProps
  extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  // Additional props can be added here if needed
  variant?: 'default' | 'error';
}

const Textarea = React.forwardRef<HTMLTextAreaElement, TextareaProps>(
  ({ className, ...props }, ref) => {
    return (
      <textarea
        className={cn(
          "flex min-h-[80px] w-full rounded-md bg-background px-3 py-2 text-sm placeholder:text-muted-foreground focus-visible:outline-none disabled:cursor-not-allowed disabled:opacity-50 shadow-[0_0_0_1px_rgba(0,0,0,0.1)] dark:shadow-[0_0_0_1px_rgba(0,0,0,0.3)] hover:shadow-[0_0_0_1px_rgba(0,0,0,0.2)] dark:hover:shadow-[0_0_0_1px_rgba(0,0,0,0.4)] focus-visible:shadow-[0_0_0_1px_rgba(0,0,0,0.3)] dark:focus-visible:shadow-[0_0_0_1px_rgba(0,0,0,0.5)]",
          className
        )}
        ref={ref}
        {...props}
      />
    )
  }
)
Textarea.displayName = "Textarea"

export { Textarea }
