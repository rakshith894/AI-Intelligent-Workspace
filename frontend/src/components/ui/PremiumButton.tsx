import {
  forwardRef,
  type ReactNode,
} from "react";
import { motion } from "framer-motion";
import type { MotionProps } from "framer-motion";
import type { ButtonHTMLAttributes } from "react";

type ButtonVariant =
  | "primary"
  | "secondary"
  | "ghost"
  | "danger";

type ButtonSize =
  | "sm"
  | "md"
  | "lg";

type NativeButtonProps =
  Omit<
    ButtonHTMLAttributes<HTMLButtonElement>,
    keyof MotionProps
  >;

interface PremiumButtonProps
  extends NativeButtonProps {
  variant?: ButtonVariant;
  size?: ButtonSize;
  loading?: boolean;
  icon?: ReactNode;
  children: ReactNode;
}

const PremiumButton = forwardRef<
  HTMLButtonElement,
  PremiumButtonProps
>(
  (
    {
      variant = "primary",
      size = "md",
      loading = false,
      icon,
      children,
      className = "",
      disabled,
      ...props
    },
    ref,
  ) => {
    const variants: Record<
      ButtonVariant,
      string
    > = {
      primary: `
        border border-indigo-400/30
        bg-gradient-to-r
        from-indigo-500
        via-indigo-500
        to-purple-600
        text-white
        shadow-lg
        shadow-indigo-500/20
        hover:shadow-indigo-500/40
      `,

      secondary: `
        border border-white/10
        bg-white/[0.07]
        text-white
        backdrop-blur-xl
        hover:bg-white/[0.12]
        hover:border-white/20
      `,

      ghost: `
        border border-transparent
        bg-transparent
        text-gray-400
        hover:bg-white/[0.06]
        hover:text-white
      `,

      danger: `
        border border-red-500/20
        bg-red-500/10
        text-red-400
        hover:bg-red-500/20
        hover:text-red-300
      `,
    };

    const sizes: Record<
      ButtonSize,
      string
    > = {
      sm: "h-9 px-3 text-xs",
      md: "h-11 px-4 text-sm",
      lg: "h-13 px-6 text-base",
    };

    return (
      <motion.button
        ref={ref}
        whileHover={{
          scale:
            disabled || loading
              ? 1
              : 1.02,
        }}
        whileTap={{
          scale:
            disabled || loading
              ? 1
              : 0.97,
        }}
        transition={{
          type: "spring",
          stiffness: 400,
          damping: 20,
        }}
        disabled={
          disabled || loading
        }
        className={`
          group
          relative
          inline-flex
          items-center
          justify-center
          gap-2
          overflow-hidden
          rounded-xl
          font-medium
          outline-none
          transition-all
          duration-200
          focus-visible:ring-2
          focus-visible:ring-indigo-400/60
          disabled:cursor-not-allowed
          disabled:opacity-50
          ${variants[variant]}
          ${sizes[size]}
          ${className}
        `}
        {...props}
      >
        {/* Hover shine */}

        <span
          className="
            pointer-events-none
            absolute
            inset-0
            -translate-x-full
            bg-gradient-to-r
            from-transparent
            via-white/10
            to-transparent
            transition-transform
            duration-700
            group-hover:translate-x-full
          "
        />

        {/* Content */}

        {loading ? (
          <span
            className="
              h-4
              w-4
              animate-spin
              rounded-full
              border-2
              border-white/30
              border-t-white
            "
          />
        ) : (
          icon
        )}

        <span className="relative">
          {loading
            ? "Loading..."
            : children}
        </span>
      </motion.button>
    );
  },
);

PremiumButton.displayName =
  "PremiumButton";

export default PremiumButton;