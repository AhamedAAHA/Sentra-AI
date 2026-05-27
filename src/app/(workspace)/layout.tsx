import { Suspense } from "react";
import { redirect } from "next/navigation";
import { AppShell } from "@/components/dashboard/app-shell";
import { isDemoUserEmail, isSupabaseConfigured } from "@/lib/supabase/config";
import { getServerClient } from "@/lib/supabase/server";

export default async function WorkspaceLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  if (isSupabaseConfigured()) {
    const supabase = await getServerClient();
    if (supabase) {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (user && !isDemoUserEmail(user.email)) {
        const { data: profile } = await supabase
          .from("profiles")
          .select("onboarding_completed")
          .eq("id", user.id)
          .maybeSingle();

        if (!profile?.onboarding_completed) {
          redirect("/onboarding");
        }
      }
    }
  }

  return (
    <Suspense fallback={<main className="min-h-screen bg-sentra-ink" />}>
      <AppShell>{children}</AppShell>
    </Suspense>
  );
}
