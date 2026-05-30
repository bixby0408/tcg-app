import { createServerClient } from "@supabase/ssr";
import { type NextRequest, NextResponse } from "next/server";

function makeSupabase(request: NextRequest, response: NextResponse) {
  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value, options }) => {
            response.cookies.set(name, value, options);
          });
        },
      },
    }
  );
}

export async function GET(request: NextRequest) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get("code");
  const token_hash = searchParams.get("token_hash");
  const type = searchParams.get("type");

  if (token_hash && type) {
    const response = NextResponse.redirect(`${origin}/dashboard`);
    const supabase = makeSupabase(request, response);

    const { error } = await supabase.auth.verifyOtp({
      type: type as "magiclink" | "recovery" | "email" | "invite",
      token_hash,
    });

    if (!error) return response;
    return NextResponse.redirect(`${origin}/login?error=verify_token`);
  }

  if (code) {
    const raw = searchParams.get('next') ?? '/dashboard';
    const next = raw.startsWith('/') ? raw : '/dashboard'; // open redirect 방지
    const response = NextResponse.redirect(`${origin}${next}`);
    const supabase = makeSupabase(request, response);
    await supabase.auth.exchangeCodeForSession(code);
    return response;
  }

  return NextResponse.redirect(`${origin}/dashboard`);
}
