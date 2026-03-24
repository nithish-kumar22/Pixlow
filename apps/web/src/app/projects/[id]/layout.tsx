import { BuilderWorkspaceShell } from "@/components/builder/BuilderWorkspaceShell";

export default function ProjectEditorLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return <BuilderWorkspaceShell>{children}</BuilderWorkspaceShell>;
}
