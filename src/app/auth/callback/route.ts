import { NextResponse } from "next/server";
import type { EmailOtpType } from "@supabase/supabase-js";
import { safeRedirectPath } from "@/lib/safe-redirect";
import { isSupabaseConfigured } from "@/lib/supabase/config";
import { getServerClient } from "@/lib/supabase/server";

function authFailureRedirect(origin: string, next: string, reason: string) {
  const target = new URL("/sign-in", origin);
  target.searchParams.set("error", reason);
  if (next !== "/dashboard") target.searchParams.set("next", next);
  return NextResponse.redirect(target);
}

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get("code");
  const tokenHash = searchParams.get("token_hash");
  const type = searchParams.get("type") as EmailOtpType | null;
  const next = safeRedirectPath(searchParams.get("next"));
  const providerError = searchParams.get("error");

  if (!isSupabaseConfigured()) {
    return NextResponse.redirect(`${origin}${next}`);
  }

  if (providerError) {
    return authFailureRedirect(origin, next, providerError);
  }

  const supabase = await getServerClient();
  if (supabase) {
    if (tokenHash && type) {
      const { error } = await supabase.auth.verifyOtp({ token_hash: tokenHash, type });
      if (!error) {
        return NextResponse.redirect(`${origin}${next}`);
      }
    }

    if (code) {
      const { error } = await supabase.auth.exchangeCodeForSession(code);
      if (!error) {
        return NextResponse.redirect(`${origin}${next}`);
      }
    }
  }

  return authFailureRedirect(origin, next, "auth_callback_failed");
}
