import React from "react";
import { cn } from "./cn";

export function Card({ className, ...props }: React.ComponentProps<"div">) {
  return <div className={cn("bg-surface border border-line rounded-md shadow-card", className)} {...props} />;
}
