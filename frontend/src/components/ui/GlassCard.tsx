import type { ReactNode } from "react";

interface GlassCardProps {
  children: ReactNode;
  className?: string;
}

function GlassCard({
  children,
  className = "",
}: GlassCardProps) {
  return (
    <div className={`glass glass-hover rounded-2xl ${className}`}>
      {children}
    </div>
  );
}

export default GlassCard;