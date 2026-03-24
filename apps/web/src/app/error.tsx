"use client";

export default function RootError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <div className="flex min-h-full flex-col items-center justify-center gap-4 px-4 py-16">
      <h2 className="text-xl font-semibold text-zinc-900 dark:text-zinc-50">
        Something went wrong
      </h2>
      <p className="max-w-md text-center text-zinc-600 dark:text-zinc-400">
        {error.message || "An unexpected error occurred."}
      </p>
      <button
        type="button"
        onClick={reset}
        className="rounded-full bg-foreground px-4 py-2 text-sm font-medium text-background transition-colors hover:opacity-90"
      >
        Try again
      </button>
    </div>
  );
}
