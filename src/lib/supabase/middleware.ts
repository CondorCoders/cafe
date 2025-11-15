import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

const protectedRoutes = ["/cafe"]; // Comentado para pruebas locales
// const protectedRoutes: string[] = []; //Descomentar para pruebas locales.

export async function updateSession(request: NextRequest) {
  let supabaseResponse = NextResponse.next({
    request,
  });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) =>
            request.cookies.set(name, value)
          );
          supabaseResponse = NextResponse.next({
            request,
          });
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options)
          );
        },
      },
    }
  );

  // IMPORTANT: You *must* try to retrieve the user on the server-side to
  // ensure that the session is refreshed properly

  try {
    const {
      data: { user },
      error,
    } = await supabase.auth.getUser();

    // If there's an auth error (like refresh token issues), clear the session
    if (error) {
      console.log("Auth error in middleware:", error.message);
      // Clear any auth cookies to force a fresh login
      const response = NextResponse.next({ request });
      response.cookies.delete("sb-kzbxxtphwvzryvchmotb-auth-token");
      response.cookies.delete("sb-kzbxxtphwvzryvchmotb-auth-token.0");
      response.cookies.delete("sb-kzbxxtphwvzryvchmotb-auth-token.1");

      // COMENTADO: Redireccion a login deshabilitada para pruebas locales
      // If trying to access a protected route, redirect to login
      if (protectedRoutes.includes(request.nextUrl.pathname)) {
        const url = request.nextUrl.clone();
        url.pathname = "/auth/login";
        return NextResponse.redirect(url);
      }

      return response;
    }

    // COMENTADO: Verificacion de usuario deshabilitada para pruebas locales
    if (!user && protectedRoutes.includes(request.nextUrl.pathname)) {
      // no user, potentially respond by redirecting the user to the login page
      const url = request.nextUrl.clone();
      url.pathname = "/auth/login";
      return NextResponse.redirect(url);
    }

    if (user) {
      const { data: profile } = await supabase
        .from("profiles")
        .select("onboarding")
        .eq("id", user.id)
        .single();

      if (
        profile?.onboarding === false &&
        request.nextUrl.pathname !== "/onboarding"
      ) {
        const url = request.nextUrl.clone();
        url.pathname = "/onboarding";
        return NextResponse.redirect(url);
      }

      if (request.nextUrl.pathname.startsWith("/auth")) {
        // user is logged in, redirect to the home page
        const url = request.nextUrl.clone();
        url.pathname = "/";
        return NextResponse.redirect(url);
      }
    }
  } catch (authError) {
    // If there's any error during auth check, log it and handle gracefully
    console.error("Middleware auth error:", authError);

    // COMENTADO: Redireccion a login deshabilitada para pruebas locales
    // If trying to access a protected route, redirect to login
    if (protectedRoutes.includes(request.nextUrl.pathname)) {
      const url = request.nextUrl.clone();
      url.pathname = "/auth/login";
      return NextResponse.redirect(url);
    }
  }

  // FIXME: No permitir ingresar a otras rutas sin hacer el onboarding
  // if (!profile?.onboarding) {
  //   // user is logged in and has not completed onboarding, redirect to onboarding page
  //   const url = request.nextUrl.clone();
  //   url.pathname = "/onboarding";
  //   return NextResponse.redirect(url);
  // }

  // IMPORTANT: You *must* return the supabaseResponse object as it is.
  // If you're creating a new response object with NextResponse.next() make sure to:
  // 1. Pass the request in it, like so:
  //    const myNewResponse = NextResponse.next({ request })
  // 2. Copy over the cookies, like so:
  //    myNewResponse.cookies.setAll(supabaseResponse.cookies.getAll())
  // 3. Change the myNewResponse object to fit your needs, but avoid changing
  //    the cookies!
  // 4. Finally:
  //    return myNewResponse
  // If this is not done, you may be causing the browser and server to go out
  // of sync and terminate the user's session prematurely!

  return supabaseResponse;
}
