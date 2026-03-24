import Link from "next/link";
import { NewProjectForm } from "./NewProjectForm";

export default function NewProjectPage() {
  return (
    <div className="app-page-gradient min-h-full px-4 py-10 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-lg">
        <Link
          href="/projects"
          className="text-sm font-medium text-app-accent hover:text-blue-300"
        >
          ← Back to projects
        </Link>
        <h1 className="mt-6 text-3xl font-bold tracking-tight">
          <span className="bg-gradient-to-r from-white to-cyan-200 bg-clip-text text-transparent">
            New project
          </span>
        </h1>
        <p className="mt-2 text-app-muted">
          Create a project to start building your app with a prompt.
        </p>
        <div className="mt-8">
          <NewProjectForm />
        </div>
      </div>
    </div>
  );
}
