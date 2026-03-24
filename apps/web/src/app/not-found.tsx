import Link from "next/link";

export default function NotFound() {
  return (
    <div className="flex min-h-full flex-col items-center justify-center gap-4 px-4 py-16">
      <h1 className="text-2xl font-semibold text-zinc-900 dark:text-zinc-50">
        Page not found
      </h1>
      <p className="text-zinc-600 dark:text-zinc-400">
        The page you are looking for does not exist.
      </p>
      <div className="flex gap-4">
        <Link
          href="/"
          className="text-sm font-medium text-foreground underline hover:no-underline"
        >
          Go home
        </Link>
        <Link
          href="/projects"
          className="text-sm font-medium text-foreground underline hover:no-underline"
        >
          Go to Projects
        </Link>
      </div>
    </div>
  );
}
