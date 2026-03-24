/** Low-poly geometric flower icons matching the Gemini-generated art style.
 *  Each icon accepts a `className` for sizing and an optional `color` override. */

interface IconProps {
  className?: string;
  color?: string;
}

export function SunflowerIcon({ className = "w-10 h-10" }: IconProps) {
  return (
    <svg viewBox="0 0 64 64" className={className} fill="none" xmlns="http://www.w3.org/2000/svg">
      {/* Petals */}
      {Array.from({ length: 12 }).map((_, i) => {
        const angle = (i / 12) * 360;
        return (
          <ellipse
            key={i}
            cx="32"
            cy="12"
            rx="5"
            ry="10"
            fill={i % 2 === 0 ? "#F5D03B" : "#E8C22A"}
            transform={`rotate(${angle} 32 32)`}
          />
        );
      })}
      {/* Center disk */}
      <circle cx="32" cy="32" r="10" fill="#5C3D1E" />
      <circle cx="32" cy="32" r="7" fill="#3D2B1F" />
      <circle cx="30" cy="30" r="3" fill="#2A6B35" opacity="0.6" />
      {/* Stem hint */}
      <rect x="30.5" y="42" width="3" height="14" rx="1.5" fill="#2A8040" />
      <ellipse cx="26" cy="50" rx="5" ry="3" fill="#2A8040" transform="rotate(-30 26 50)" />
    </svg>
  );
}

export function TulipIcon({ className = "w-10 h-10" }: IconProps) {
  return (
    <svg viewBox="0 0 64 64" className={className} fill="none" xmlns="http://www.w3.org/2000/svg">
      {/* Left petal */}
      <path d="M22 30 C22 14, 32 8, 32 8 C32 8, 26 18, 22 30 Z" fill="#E8637A" />
      <path d="M22 30 C22 36, 27 40, 32 40 C27 38, 22 34, 22 30 Z" fill="#C2334F" />
      {/* Right petal */}
      <path d="M42 30 C42 14, 32 8, 32 8 C32 8, 38 18, 42 30 Z" fill="#F07088" />
      <path d="M42 30 C42 36, 37 40, 32 40 C37 38, 42 34, 42 30 Z" fill="#E8637A" />
      {/* Center petal */}
      <path d="M28 28 C28 16, 32 8, 32 8 C32 8, 36 16, 36 28 C36 34, 34 38, 32 40 C30 38, 28 34, 28 28 Z" fill="#F4909E" />
      {/* Stem */}
      <rect x="30.5" y="40" width="3" height="18" rx="1.5" fill="#2A8040" />
      {/* Leaves */}
      <path d="M32 48 C26 44, 18 46, 16 50" stroke="#2A8040" strokeWidth="2.5" strokeLinecap="round" fill="none" />
      <path d="M32 52 C38 48, 46 50, 48 54" stroke="#2A8040" strokeWidth="2.5" strokeLinecap="round" fill="none" />
    </svg>
  );
}

export function LilyIcon({ className = "w-10 h-10" }: IconProps) {
  return (
    <svg viewBox="0 0 64 64" className={className} fill="none" xmlns="http://www.w3.org/2000/svg">
      {/* 6-pointed star petals */}
      {Array.from({ length: 6 }).map((_, i) => {
        const angle = (i / 6) * 360 - 90;
        return (
          <ellipse
            key={i}
            cx="32"
            cy="14"
            rx="6"
            ry="14"
            fill={i % 2 === 0 ? "#FFF5E6" : "#F5E6D0"}
            stroke="#D4A0A0"
            strokeWidth="0.5"
            transform={`rotate(${angle} 32 32)`}
          />
        );
      })}
      {/* Pink center streaks */}
      {Array.from({ length: 6 }).map((_, i) => {
        const angle = (i / 6) * 360 - 90;
        return (
          <ellipse
            key={`s-${i}`}
            cx="32"
            cy="22"
            rx="2"
            ry="7"
            fill="#D4728A"
            opacity="0.5"
            transform={`rotate(${angle} 32 32)`}
          />
        );
      })}
      {/* Center stamens */}
      <circle cx="32" cy="32" r="3" fill="#8B6043" />
      <circle cx="32" cy="32" r="1.5" fill="#F5D03B" />
      {/* Stem */}
      <rect x="30.5" y="44" width="3" height="14" rx="1.5" fill="#2A8040" />
      <ellipse cx="38" cy="52" rx="5" ry="3" fill="#2A8040" transform="rotate(25 38 52)" />
    </svg>
  );
}

export function HydrangeaIcon({ className = "w-10 h-10" }: IconProps) {
  return (
    <svg viewBox="0 0 64 64" className={className} fill="none" xmlns="http://www.w3.org/2000/svg">
      {/* Floret cluster — many small circles forming a ball */}
      {[
        { x: 28, y: 16, r: 4, c: "#7C6CC4" },
        { x: 36, y: 14, r: 4.5, c: "#8B80D0" },
        { x: 22, y: 22, r: 4, c: "#9B8FD8" },
        { x: 30, y: 20, r: 5, c: "#6B5BB5" },
        { x: 38, y: 22, r: 4.5, c: "#7C6CC4" },
        { x: 44, y: 18, r: 3.5, c: "#A8A0E0" },
        { x: 20, y: 28, r: 4, c: "#8B80D0" },
        { x: 28, y: 28, r: 5, c: "#7464B8" },
        { x: 36, y: 28, r: 5, c: "#6B5BB5" },
        { x: 44, y: 28, r: 4, c: "#9B8FD8" },
        { x: 24, y: 34, r: 4.5, c: "#7C6CC4" },
        { x: 32, y: 34, r: 5, c: "#8B80D0" },
        { x: 40, y: 34, r: 4.5, c: "#A8A0E0" },
        { x: 28, y: 40, r: 4, c: "#6B5BB5" },
        { x: 36, y: 38, r: 4, c: "#7C6CC4" },
      ].map((f, i) => (
        <circle key={i} cx={f.x} cy={f.y} r={f.r} fill={f.c} />
      ))}
      {/* Stem + leaves */}
      <rect x="30.5" y="42" width="3" height="16" rx="1.5" fill="#2A8040" />
      <ellipse cx="24" cy="48" rx="6" ry="3.5" fill="#358C45" transform="rotate(-20 24 48)" />
      <ellipse cx="40" cy="50" rx="6" ry="3.5" fill="#2A8040" transform="rotate(20 40 50)" />
    </svg>
  );
}

export function MagnoliaIcon({ className = "w-10 h-10" }: IconProps) {
  return (
    <svg viewBox="0 0 64 64" className={className} fill="none" xmlns="http://www.w3.org/2000/svg">
      {/* Outer petals — large cupped white/cream */}
      {Array.from({ length: 8 }).map((_, i) => {
        const angle = (i / 8) * 360;
        return (
          <ellipse
            key={i}
            cx="32"
            cy="12"
            rx="7"
            ry="14"
            fill={i % 2 === 0 ? "#FDF8EF" : "#F5EDE0"}
            stroke="#E8DCC8"
            strokeWidth="0.5"
            transform={`rotate(${angle} 32 30)`}
          />
        );
      })}
      {/* Inner petals */}
      {Array.from({ length: 5 }).map((_, i) => {
        const angle = (i / 5) * 360 + 20;
        return (
          <ellipse
            key={`inner-${i}`}
            cx="32"
            cy="20"
            rx="4"
            ry="8"
            fill="#FFF9F0"
            stroke="#E8DCC8"
            strokeWidth="0.3"
            transform={`rotate(${angle} 32 30)`}
          />
        );
      })}
      {/* Center — reddish stamens */}
      <circle cx="32" cy="30" r="5" fill="#C27A5A" />
      <circle cx="32" cy="30" r="3" fill="#A85A3A" />
      <circle cx="31" cy="29" r="1" fill="#F5D03B" />
      {/* Stem */}
      <path d="M32 42 C32 48, 30 54, 28 58" stroke="#5C3D1E" strokeWidth="3" strokeLinecap="round" fill="none" />
      <ellipse cx="24" cy="48" rx="5" ry="3" fill="#2A8040" transform="rotate(-30 24 48)" />
      <ellipse cx="38" cy="46" rx="4.5" ry="2.5" fill="#358C45" transform="rotate(15 38 46)" />
    </svg>
  );
}

/** Map of flower type to icon component */
export const FLOWER_ICON_MAP: Record<string, React.FC<IconProps>> = {
  sunflower: SunflowerIcon,
  tulip: TulipIcon,
  lily: LilyIcon,
  hydrangea: HydrangeaIcon,
  magnolia: MagnoliaIcon,
};
