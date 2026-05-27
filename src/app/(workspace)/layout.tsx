import { Suspense } from "react";
import { AppShell } from "@/components/dashboard/app-shell";

export default function WorkspaceLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <Suspense fallback={<main className="min-h-screen bg-sentra-ink" />}>
      <AppShell>{children}</AppShell>
    </Suspense>
  );
}
