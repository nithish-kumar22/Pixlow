import { LandingCta } from "@/components/LandingCta";

const chips = [
  { label: "Live preview", tone: "blue" as const },
  { label: "React Native", tone: "violet" as const },
  { label: "Export ZIP", tone: "cyan" as const },
];

const chipStyles = {
  blue: "border-blue-500/35 bg-blue-500/10 text-blue-200",
  violet: "border-violet-500/35 bg-violet-500/10 text-violet-200",
  cyan: "border-cyan-500/35 bg-cyan-500/10 text-cyan-200",
};

export default function Home() {
  return (
    <div className="app-hero-mesh relative flex min-h-[calc(100vh-4rem)] flex-col items-center justify-center overflow-hidden px-4 py-16 font-sans sm:py-24">
      <div
        className="pointer-events-none absolute inset-0 opacity-[0.07]"
        style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23ffffff' fill-opacity='1'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`,
        }}
        aria-hidden
      />
      <div className="relative z-[1] flex max-w-2xl flex-col items-center gap-8 text-center">
        <h1 className="text-4xl font-bold tracking-tight sm:text-5xl md:text-6xl">
          <span className="bg-gradient-to-br from-white via-blue-100 to-cyan-300 bg-clip-text text-transparent">
            Prompt to App
          </span>
        </h1>
        <p className="max-w-xl text-lg leading-relaxed text-app-muted sm:text-xl">
          Generate mobile apps from a prompt. Describe your idea and get a React Native app with{" "}
          <span className="text-app-text font-medium">live preview</span> and{" "}
          <span className="text-cyan-300/90 font-medium">export</span>.
        </p>
        <div className="flex flex-wrap items-center justify-center gap-2">
          {chips.map((c) => (
            <span
              key={c.label}
              className={`rounded-full border px-3 py-1 text-xs font-medium ${chipStyles[c.tone]}`}
            >
              {c.label}
            </span>
          ))}
        </div>
        <LandingCta />
      </div>
    </div>
  );
}
