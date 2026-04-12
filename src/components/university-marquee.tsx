import Image from "next/image";

const LOGOS = [
  { name: "University of Toronto", file: "uoft.svg" },
  { name: "University of Waterloo", file: "waterloo.svg" },
  { name: "UBC",                   file: "ubc.svg" },
  { name: "McGill",                file: "mcgill.svg" },
  { name: "Harvard",               file: "harvard.svg" },
  { name: "MIT",                   file: "mit.svg" },
  { name: "Caltech",               file: "caltech.svg" },
  { name: "Stanford",              file: "stanford.svg" },
  { name: "Carnegie Mellon",       file: "cmu.svg" },
  { name: "Oxford",                file: "oxford.svg" },
];

export function UniversityMarquee() {
  const logoRow = LOGOS.map((logo) => (
    <div key={logo.name} className="shrink-0 px-8 flex items-center justify-center">
      <Image
        src={`/logos/${logo.file}`}
        alt={logo.name}
        width={120}
        height={28}
        className="h-7 w-auto object-contain grayscale hover:grayscale-0 transition-all duration-300 opacity-60 hover:opacity-100"
        unoptimized
      />
    </div>
  ));

  return (
    <section className="py-20 overflow-hidden">
      <p className="text-center text-xs font-black tracking-[0.2em] uppercase text-on-surface-variant/50 mb-10">
        Trusted by students at top schools
      </p>
      <div className="relative">
        {/* Fade edges */}
        <div className="absolute left-0 top-0 bottom-0 w-24 bg-gradient-to-r from-white to-transparent z-10 pointer-events-none" />
        <div className="absolute right-0 top-0 bottom-0 w-24 bg-gradient-to-l from-white to-transparent z-10 pointer-events-none" />

        <div className="flex animate-marquee whitespace-nowrap" style={{ width: "200%" }}>
          <div className="flex">{logoRow}</div>
          <div className="flex" aria-hidden="true">{logoRow}</div>
        </div>
      </div>
    </section>
  );
}
