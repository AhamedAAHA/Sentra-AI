import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

const badgeVariants = cva(
  "inline-flex items-center rounded-full border px-3 py-1 text-xs font-medium tracking-[-0.01em] backdrop-blur-xl transition-colors duration-300",
  {
    variants: {
      variant: {
        default: "border-white/10 bg-white/[0.055] text-white/88",
        cyan: "border-blue-300/20 bg-blue-300/10 text-blue-100",
        violet: "border-indigo-300/20 bg-indigo-300/10 text-indigo-100",
        risk: "border-rose-300/25 bg-rose-400/10 text-rose-100",
        success: "border-emerald-300/25 bg-emerald-400/10 text-emerald-100",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  },
);

export interface BadgeProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof badgeVariants> {}

function Badge({ className, variant, ...props }: BadgeProps) {
  return <div className={cn(badgeVariants({ variant }), className)} {...props} />;
}

export { Badge, badgeVariants };
