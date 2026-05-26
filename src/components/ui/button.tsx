import * as React from "react";
import { Slot } from "@radix-ui/react-slot";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

const buttonVariants = cva(
  "sentra-focus inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-full text-sm font-medium tracking-[-0.01em] transition-all duration-300 ease-out disabled:pointer-events-none disabled:opacity-50",
  {
    variants: {
      variant: {
        default:
          "bg-white/[0.96] text-sentra-ink shadow-[0_8px_22px_rgba(0,0,0,.15)] hover:-translate-y-px hover:bg-white hover:shadow-[0_13px_28px_rgba(0,0,0,.2)]",
        neon:
          "bg-gradient-to-b from-[#3f9cff] to-[#2676eb] text-white shadow-[0_10px_25px_rgba(38,118,235,.3)] hover:-translate-y-px hover:brightness-110 hover:shadow-[0_15px_35px_rgba(38,118,235,.36)]",
        ghost:
          "border border-white/10 bg-white/[0.045] text-white backdrop-blur-xl hover:border-white/18 hover:bg-white/[0.085]",
        link: "text-blue-300 underline-offset-4 hover:text-blue-200 hover:underline",
      },
      size: {
        sm: "h-9 px-4",
        md: "h-11 px-5",
        lg: "h-12 px-7 text-base",
        icon: "h-11 w-11",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "md",
    },
  },
);

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean;
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, asChild = false, ...props }, ref) => {
    const Comp = asChild ? Slot : "button";
    return (
      <Comp
        className={cn(buttonVariants({ variant, size, className }))}
        ref={ref}
        {...props}
      />
    );
  },
);
Button.displayName = "Button";

export { Button, buttonVariants };
