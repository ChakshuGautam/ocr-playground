import * as React from "react"
import { cn } from "@/lib/utils"

export interface AlertProps extends React.HTMLAttributes<HTMLDivElement> { }

export function Alert({ className, ...props }: AlertProps) {
    return (
        <div
            role="alert"
            className={cn(
                "relative w-full rounded-lg border border-gray-200 bg-white px-4 py-3 text-gray-900 shadow-sm flex items-start gap-3",
                className
            )}
            {...props}
        />
    )
}

export function AlertDescription({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) {
    return (
        <div
            className={cn("text-sm text-gray-700", className)}
            {...props}
        />
    )
}