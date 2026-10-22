import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";
import { safeNextPath } from "@/lib/auth/schemas";
import { getSupabaseEnv } from "./env";

/** Pages that need an account. Everything else (home, login) is public. */
const PROTECTED_PREFIXES = ["/daily", "/learn", "/quiz", "/match"] as const;

const CACHE_HEADERS = ["cache-control", "expires", "pragma"] as const;

const isProtected = (pathname: string): boolean =>
  PROTECTED_PREFIXES.some((prefix) => pathname === prefix || pathname.startsWith(`${prefix}/`));

/** A redirect that still carries any session cookies Supabase just refreshed. */
const redirectKeepingSession = (from: NextResponse, to: URL): NextResponse => {
  const response = NextResponse.redirect(to);
  from.cookies.getAll().forEach((cookie) => response.cookies.set(cookie));
  CACHE_HEADERS.forEach((name) => {
    const value = from.headers.get(name);
    if (value) response.headers.set(name, value);
  });
  return response;
};

export async function updateSession(request: NextRequest): Promise<NextResponse> {
  let supabaseResponse = NextResponse.next({ request });
  const { url, publishableKey } = getSupabaseEnv();

  const supabase = createServerClient(url, publishableKey, {
    cookies: {
      getAll() {
        return request.cookies.getAll();
      },
      setAll(cookiesToSet, headers) {
        cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value));
        supabaseResponse = NextResponse.next({ request });
        cookiesToSet.forEach(({ name, value, options }) => supabaseResponse.cookies.set(name, value, options));
        Object.entries(headers).forEach(([key, value]) => supabaseResponse.headers.set(key, value));
      },
    },
  });

  // Do not run code between createServerClient and getClaims(): it refreshes the session,
  // and skipping it can log people out at random.
  const { data } = await supabase.auth.getClaims();
  const isSignedIn = Boolean(data?.claims?.sub);
  const { pathname, search } = request.nextUrl;

  if (!isSignedIn && isProtected(pathname)) {
    const loginUrl = request.nextUrl.clone();
    loginUrl.pathname = "/login";
    loginUrl.search = `?next=${encodeURIComponent(`${pathname}${search}`)}`;
    return redirectKeepingSession(supabaseResponse, loginUrl);
  }

  if (isSignedIn && pathname === "/login") {
    const target = request.nextUrl.clone();
    const next = safeNextPath(request.nextUrl.searchParams.get("next"));
    const [nextPath, nextSearch = ""] = next.split("?");
    target.pathname = nextPath;
    target.search = nextSearch ? `?${nextSearch}` : "";
    return redirectKeepingSession(supabaseResponse, target);
  }

  return supabaseResponse;
}
