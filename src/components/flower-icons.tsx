/** Flower species emoji map and backward-compatible React component wrappers. */

import React from "react";

interface IconProps {
  className?: string;
  color?: string;
}

export const FLOWER_EMOJI_MAP: Record<string, string> = {
  rose:      "🌹",
  tulip:     "🌷",
  sunflower: "🌻",
  daisy:     "🌼",
  lily:      "🌸",
  lavender:  "🪻",
};

/**
 * Backward-compatible map — each value is a React component function
 * so existing callsites using <IconComponent className="..." /> still work.
 */
export const FLOWER_ICON_MAP: Record<string, React.FC<IconProps>> = Object.fromEntries(
  Object.entries(FLOWER_EMOJI_MAP).map(([key, emoji]) => [
    key,
    function FlowerEmoji({ className = "w-10 h-10" }: IconProps) {
      return (
        <span
          className={`flex items-center justify-center leading-none select-none ${className}`}
          style={{ fontSize: "1.5em" }}
        >
          {emoji}
        </span>
      );
    },
  ])
);

// Named exports for any direct imports
export function RoseIcon(props: IconProps) { return FLOWER_ICON_MAP.rose(props); }
export function TulipIcon(props: IconProps) { return FLOWER_ICON_MAP.tulip(props); }
export function SunflowerIcon(props: IconProps) { return FLOWER_ICON_MAP.sunflower(props); }
export function DaisyIcon(props: IconProps) { return FLOWER_ICON_MAP.daisy(props); }
export function LilyIcon(props: IconProps) { return FLOWER_ICON_MAP.lily(props); }
