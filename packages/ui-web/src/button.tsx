import { cn } from "@repo/utils";
import type { ButtonHTMLAttributes, Ref } from "react";

/**
 * Available button style variants.
 *
 * Exported for consumers who need to type props or create wrapper components.
 *
 * @example
 * // Typing a wrapper component
 * import type { ButtonVariant } from "@repo/ui-web";
 * const MyButton = ({ variant }: { variant: ButtonVariant }) => { ... }
 */
export type ButtonVariant = "primary" | "secondary" | "ghost";

/**
 * Available button sizes.
 *
 * Exported for consumers who need to type props or create wrapper components.
 *
 * @example
 * // Typing a size prop
 * import type { ButtonSize } from "@repo/ui-web";
 * const sizes: ButtonSize[] = ["sm", "md", "lg"];
 */
export type ButtonSize = "sm" | "md" | "lg";

/**
 * Props for the Button component.
 *
 * Extends native button attributes with additional styling and state props.
 * Exported for consumers who need to type props or create wrapper components.
 *
 * @example
 * // Typing a wrapper component
 * import type { ButtonProps } from "@repo/ui-web";
 * const MyButton = (props: ButtonProps) => <Button {...props} />;
 */
export interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  /** Visual style variant */
  variant?: ButtonVariant;
  /** Button size */
  size?: ButtonSize;
  /** Shows loading state and disables the button */
  isLoading?: boolean;
  /** Ref to the button element (React 19 ref-as-prop pattern) */
  ref?: Ref<HTMLButtonElement>;
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

/**
 * A flexible button component with variants and sizes.
 *
 * Uses React 19's ref-as-prop pattern instead of forwardRef.
 *
 * @example
 * <Button variant="primary" size="md">Click me</Button>
 * <Button variant="secondary" isLoading>Loading...</Button>
 * <Button ref={myRef}>With ref</Button>
 */
export function Button({
  className,
  variant = "primary",
  size = "md",
  isLoading = false,
  disabled,
  children,
  ref,
  ...props
}: ButtonProps) {
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
}
