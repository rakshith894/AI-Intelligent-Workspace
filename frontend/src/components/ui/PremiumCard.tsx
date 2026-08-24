import {
  type HTMLAttributes,
  type ReactNode,
} from "react";
import { motion } from "framer-motion";
import type { MotionProps } from "framer-motion";

type NativeDivProps = Omit<
  HTMLAttributes<HTMLDivElement>,
  keyof MotionProps
>;

interface PremiumCardProps
  extends NativeDivProps {
  children: ReactNode;
  hover?: boolean;
  glow?: boolean;
  padding?: "none" | "sm" | "md" | "lg";
}

export default function PremiumCard({
  children,
  hover = true,
  glow = true,
  padding = "md",
  className = "",
  ...props
}: PremiumCardProps) {
  const paddingStyles = {
    none: "",
    sm: "p-3",
    md: "p-5",
    lg: "p-7",
  };

  return (
    <motion.div
      initial={{
        opacity: 0,
        y: 8,
      }}
      animate={{
        opacity: 1,
        y: 0,
      }}
      transition={{
        duration: 0.35,
        ease: "easeOut",
      }}
      whileHover={
        hover
          ? {
              y: -3,
              transition: {
                duration: 0.2,
              },
            }
          : undefined
      }
      className={`
        group
        relative
        overflow-hidden
        rounded-2xl
        border
        border-white/[0.08]
        bg-white/[0.045]
        backdrop-blur-2xl
        shadow-2xl
        shadow-black/20

        ${hover ? "hover:border-white/[0.14]" : ""}

        ${paddingStyles[padding]}

        ${className}
      `}
      {...props}
    >
      {/* Top highlight */}

      <div
        className="
          pointer-events-none
          absolute
          inset-x-0
          top-0
          h-px
          bg-gradient-to-r
          from-transparent
          via-white/20
          to-transparent
        "
      />

      {/* Hover glow */}

      {glow && (
        <div
          className="
            pointer-events-none
            absolute
            -right-20
            -top-20
            h-40
            w-40
            rounded-full
            bg-indigo-500/10
            blur-3xl
            opacity-0
            transition-opacity
            duration-500
            group-hover:opacity-100
          "
        />
      )}

      {/* Content */}

      <div className="relative z-10">
        {children}
      </div>
    </motion.div>
  );
}