"use client";

import { motion, type Variants } from "framer-motion";
import { AgentState } from "@/types";
import { AGENT_STATE_COLORS } from "@/lib/constants";
import { cn } from "@/lib/utils";

interface TonyAvatarProps {
  state: AgentState;
  size?: "sm" | "md" | "lg";
  className?: string;
}

const sizeMap = {
  sm: "w-8 h-8 text-sm",
  md: "w-12 h-12 text-lg",
  lg: "w-20 h-20 text-2xl",
};

const variants: Variants = {
  active: {
    scale: [1, 1.05, 1],
    transition: { repeat: Infinity, duration: 2, ease: "easeInOut" as const },
  },
  idle: {
    opacity: [1, 0.7, 1],
    transition: { repeat: Infinity, duration: 3, ease: "easeInOut" as const },
  },
  busy: {
    rotate: [0, 360],
    transition: { repeat: Infinity, duration: 4, ease: "linear" as const },
  },
  sleeping: {
    opacity: 0.4,
    scale: 0.95,
  },
};

export function TonyAvatar({ state, size = "md", className }: TonyAvatarProps) {
  const color = AGENT_STATE_COLORS[state];

  return (
    <motion.div
      className={cn(
        "rounded-full flex items-center justify-center font-bold relative",
        sizeMap[size],
        className
      )}
      style={{
        backgroundColor: `${color}20`,
        color: color,
        boxShadow: state === "active" ? `0 0 20px ${color}40` : undefined,
      }}
      variants={variants}
      animate={state}
    >
      T
      <span
        className="absolute -bottom-0.5 -right-0.5 w-3 h-3 rounded-full border-2 border-background"
        style={{ backgroundColor: color }}
      />
    </motion.div>
  );
}
