import { cn } from "@repo/utils";
import type { ButtonHTMLAttributes } from "react";
import { forwardRef } from "react";

export type ButtonVariant = "primary" | "secondary" | "ghost";
export type ButtonSize = "sm" | "md" | "lg";

export interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  size?: ButtonSize;
  isLoading?: boolean;
}

const baseClasses =
  "inline-flex items-center justify-center font-medium rounded-md transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-primary";

const variantClasses: Record<ButtonVariant, string> = {
  primary: "bg-primary text-primary-foreground hover:bg-primary/90",
  secondary: "bg-muted text-muted-foreground hover:bg-muted/80",
  ghost: "bg-transparent hover:bg-muted",
};

const sizeClasses: Record<ButtonSize, string> = {
  sm: "h-8 px-3 text-sm",
  md: "h-10 px-4 text-sm",
  lg: "h-12 px-6 text-base",
};

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(function Button(
  { className, variant = "primary", size = "md", isLoading = false, disabled, children, ...props },
  ref,
) {
  const classes = cn(
    baseClasses,
    variantClasses[variant],
    sizeClasses[size],
    { "opacity-60 cursor-not-allowed": disabled || isLoading },
    className,
  );

  return (
    <button ref={ref} className={classes} disabled={disabled || isLoading} {...props}>
      {children}
    </button>
  );
});
