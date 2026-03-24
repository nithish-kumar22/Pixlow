export default function ProjectLoading() {
  return (
    <div className="flex min-h-full items-center justify-center p-6">
      <div
        className="size-8 animate-spin rounded-full border-2 border-zinc-300 border-t-zinc-900 dark:border-zinc-600 dark:border-t-zinc-100"
        aria-hidden
      />
    </div>
  );
}
