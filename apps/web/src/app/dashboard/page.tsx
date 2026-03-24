import Link from "next/link";

const actions = [
  {
    href: "/projects",
    title: "Your projects",
    description: "Open an existing app and keep building in the editor.",
    accent: "from-blue-500/20 to-blue-600/5",
    glow: "rgba(59, 130, 246, 0.25)",
  },
  {
    href: "/projects/new",
    title: "New project",
    description: "Start from a blank canvas and describe what you want.",
    accent: "from-violet-500/20 to-violet-600/5",
    glow: "rgba(139, 92, 246, 0.25)",
  },
];

export default function DashboardPage() {
  return (
    <div className="app-page-gradient min-h-full px-4 py-10 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-3xl">
        <h1 className="text-3xl font-bold tracking-tight">
          <span className="bg-gradient-to-r from-white to-blue-200 bg-clip-text text-transparent">
            Dashboard
          </span>
        </h1>
        <p className="mt-2 text-app-muted">You are signed in. Pick where to go next.</p>

        <ul className="mt-10 grid gap-4 sm:grid-cols-2">
          {actions.map((a) => (
            <li key={a.href}>
              <Link href={a.href} className="app-card app-card-hover block h-full p-6">
                <div
                  className={`mb-4 h-1 w-12 rounded-full bg-gradient-to-r ${a.accent}`}
                  style={{ boxShadow: `0 0 20px ${a.glow}` }}
                />
                <h2 className="text-lg font-semibold text-app-text">{a.title}</h2>
                <p className="mt-2 text-sm text-app-muted">{a.description}</p>
                <span className="mt-4 inline-flex text-sm font-medium text-app-accent">
                  Continue →
                </span>
              </Link>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}
