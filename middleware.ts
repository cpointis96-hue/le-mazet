import { createServerClient } from '@supabase/ssr';
import { NextResponse, type NextRequest } from 'next/server';

// Routes publiques (accessibles sans connexion) — approche allowlist par défaut
// Toute nouvelle route de l'app (groupe (app)) est protégée automatiquement.
const PUBLIC_PATHS = ['/', '/connexion', '/inscription', '/mot-de-passe-oublie', '/reinitialiser-mdp'];
const AUTH_ONLY_PATHS = ['/connexion', '/inscription', '/mot-de-passe-oublie'];

export async function middleware(request: NextRequest) {
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
                    supabaseResponse = NextResponse.next({ request });
                    cookiesToSet.forEach(({ name, value, options }) =>
                        supabaseResponse.cookies.set(name, value, options)
                    );
                },
            },
        }
    );

    const { data: { user } } = await supabase.auth.getUser();
    const { pathname } = request.nextUrl;

    const isPublic = PUBLIC_PATHS.some(
        (p) => pathname === p || pathname.startsWith(p + '/')
    );

    // Toute route non-publique requiert une connexion
    if (!isPublic && !user) {
        const url = request.nextUrl.clone();
        url.pathname = '/connexion';
        return NextResponse.redirect(url);
    }

    // Redirige vers l'app si déjà connecté et tente d'accéder aux pages auth
    const isAuthPage = AUTH_ONLY_PATHS.some((p) => pathname === p);
    if (isAuthPage && user) {
        const url = request.nextUrl.clone();
        url.pathname = '/mon-calendrier';
        return NextResponse.redirect(url);
    }

    return supabaseResponse;
}

export const config = {
    matcher: [
        '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
    ],
};
