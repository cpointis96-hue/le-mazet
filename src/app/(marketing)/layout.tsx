import Link from "next/link";
import { Button } from "@/components/ui/Button";
import { CalendarDays, ArrowRight } from "lucide-react";
import { createClient } from "@/lib/supabase/server";

export default async function MarketingLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    return (
        <div className="flex min-h-screen flex-col bg-slate-50 dark:bg-slate-950 font-sans selection:bg-primary/30">
            {/* Header Public Premium */}
            <header className="sticky top-0 z-50 w-full border-b border-border/40 bg-background/80 backdrop-blur-md supports-[backdrop-filter]:bg-background/60">
                <div className="container mx-auto flex h-16 items-center justify-between px-6 lg:px-8">

                    {/* Logo */}
                    <Link href="/" className="flex items-center gap-2 font-black tracking-tight text-xl group">
                        <div className="bg-primary/10 p-1.5 rounded-lg group-hover:bg-primary/20 transition-colors">
                            <CalendarDays className="h-6 w-6 text-primary" />
                        </div>
                        <span className="bg-clip-text text-transparent bg-gradient-to-r from-slate-900 to-slate-600 dark:from-white dark:to-slate-400">
                            CalenShare
                        </span>
                    </Link>

                    {/* Navigation Desktop */}
                    <nav className="hidden md:flex items-center gap-8 text-sm font-medium text-slate-600 dark:text-slate-300">
                        <a href="#features" className="hover:text-primary transition-colors">Fonctionnalités</a>
                        <a href="#how-it-works" className="hover:text-primary transition-colors">Comment ça marche</a>
                    </nav>

                    {/* Actions (Login / Dashboard) */}
                    <div className="flex items-center gap-4">
                        {user ? (
                            <Button asChild size="sm" className="rounded-full px-6 shadow-md shadow-primary/20 hover:shadow-primary/40 transition-all font-semibold">
                                <Link href="/mon-calendrier">
                                    Mon Calendrier <ArrowRight className="ml-2 w-4 h-4" />
                                </Link>
                            </Button>
                        ) : (
                            <>
                                <Link href="/connexion" className="text-sm font-semibold hover:text-primary transition-colors hidden sm:block">
                                    Se connecter
                                </Link>
                                <Button asChild size="sm" className="rounded-full px-6 shadow-md shadow-primary/20 hover:shadow-primary/40 transition-all font-semibold bg-gradient-to-r from-primary to-violet-600 hover:from-primary/90 hover:to-violet-600/90 border-0">
                                    <Link href="/inscription">
                                        Rejoindre
                                    </Link>
                                </Button>
                            </>
                        )}
                    </div>
                </div>
            </header>

            <main className="flex-1 w-full overflow-hidden">
                {children}
            </main>

            {/* Footer Premium */}
            <footer className="border-t border-border/40 bg-card py-12">
                <div className="container mx-auto flex flex-col items-center justify-between gap-6 md:flex-row px-6 lg:px-8">
                    <div className="flex flex-col items-center md:items-start gap-2">
                        <Link href="/" className="flex items-center gap-2 font-bold text-lg text-primary opacity-80 hover:opacity-100 transition-opacity">
                            <CalendarDays className="h-5 w-5" />
                            <span>CalenShare</span>
                        </Link>
                        <p className="text-sm text-muted-foreground text-center md:text-left max-w-xs">
                            Votre emploi du temps, synchronisé avec ceux qui comptent.
                        </p>
                    </div>

                    <div className="flex gap-6 text-sm text-muted-foreground">
                        <a href="#" className="hover:text-foreground transition-colors">Mentions légales</a>
                        <a href="#" className="hover:text-foreground transition-colors">Confidentialité</a>
                        <a href="#" className="hover:text-foreground transition-colors">Contact</a>
                    </div>
                </div>
                <div className="container mx-auto mt-8 text-center text-xs text-muted-foreground/60 px-6">
                    &copy; {new Date().getFullYear()} CalenShare. Tous droits réservés.
                </div>
            </footer>
        </div>
    );
}
