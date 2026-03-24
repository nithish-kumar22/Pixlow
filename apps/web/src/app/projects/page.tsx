import Link from "next/link";
import { ProjectsList } from "./ProjectsList";

export default function ProjectsPage() {
  return (
    <div className="app-page-gradient min-h-full px-4 py-10 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-6xl">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">
              <span className="bg-gradient-to-r from-white to-blue-200 bg-clip-text text-transparent">
                Projects
              </span>
            </h1>
            <p className="mt-2 max-w-xl text-app-muted">
              Your app projects. Create a new one or open an existing editor.
            </p>
          </div>
          <Link href="/projects/new" className="app-btn-primary shrink-0 self-start sm:self-auto">
            New project
          </Link>
        </div>
        <ProjectsList />
      </div>
    </div>
  );
}
