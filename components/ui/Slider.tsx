import * as React from "react"
import { cn } from "../../lib/utils"

const Slider = React.forwardRef<
  HTMLInputElement,
  React.InputHTMLAttributes<HTMLInputElement> & { onValueChange?: (value: number[]) => void }
>(({ className, onValueChange, ...props }, ref) => {
    const handleChange = (event: React.ChangeEvent<HTMLInputElement>) => {
        if(onValueChange) {
            onValueChange([Number(event.target.value)]);
        }
    }
    
    // Note: This is a simplified version of shadcn/ui Slider using a native range input.
    return (
      <input
        type="range"
        ref={ref}
        className={cn(
          "w-full h-2 bg-[hsl(var(--secondary))] rounded-lg appearance-none cursor-pointer",
          className
        )}
        onChange={handleChange}
        {...props}
      />
    )
})
Slider.displayName = "Slider"

export { Slider }
