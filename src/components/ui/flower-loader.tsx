export function FlowerLoader({ text = "Loading", subtext = "Please wait a moment...", children }: { text?: string; subtext?: string; children?: React.ReactNode }) {
  return (
    <div className="flex w-full max-w-sm flex-col items-center gap-8 text-center bg-white/80 backdrop-blur-xl p-10 rounded-3xl pebble-shadow border border-white/50 animate-fade-in mx-auto">
      {/* Bloomr icon with spinning ring */}
      <div className="relative flex h-32 w-32 items-center justify-center">
        {/* Outer spinning ring */}
        <svg
          className="absolute inset-0 h-full w-full animate-spin"
          style={{ animationDuration: "2.5s", animationTimingFunction: "linear" }}
          viewBox="0 0 128 128"
        >
          <circle cx="64" cy="64" r="58" fill="none" stroke="#E8F5E9" strokeWidth="3" />
          <circle
            cx="64" cy="64" r="58" fill="none"
            stroke="#3BAB55" strokeWidth="3"
            strokeDasharray="80 290"
            strokeLinecap="round"
          />
        </svg>
        {/* Inner pulsing glow */}
        <div className="absolute inset-4 rounded-full bg-primary-container/5 animate-pulse" />
        {/* Bloomr Icon */}
        <img
          src="/bloomr_icon.svg"
          alt="Bloomr"
          className="relative z-10 h-14 w-14 rounded-xl drop-shadow-sm"
        />
      </div>

      {/* Title */}
      <div>
        <h2 className="text-2xl font-semibold text-[#3D2B1F]">{text}</h2>
        <p className="mt-2 text-sm text-[#6B4C35]/80">{subtext}</p>
      </div>

      {children}

      {/* Loading dots */}
      <div className="flex gap-1.5">
        {[0, 1, 2].map((i) => (
          <div
            key={i}
            className="h-1.5 w-1.5 rounded-full bg-primary-container"
            style={{
              animation: "pulse 1.4s ease-in-out infinite",
              animationDelay: `${i * 0.2}s`,
              opacity: 0.3,
            }}
          />
        ))}
      </div>
    </div>
  );
}
