import { CalendarDays } from "lucide-react";
import Link from "next/link";

export default function AuthLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    return (
        <div className="flex min-h-screen items-start pt-8 sm:items-center sm:pt-4 justify-center bg-slate-50 dark:bg-slate-950 p-4">
            <div className="w-full max-w-md bg-card rounded-2xl shadow-xl border p-8 mt-4 sm:mt-0">
                <div className="flex flex-col items-center mb-8">
                    <Link href="/" className="flex items-center gap-2 font-bold text-2xl text-primary mb-2">
                        <CalendarDays className="h-6 w-6" />
                        <span>CalenShare</span>
                    </Link>
                    <p className="text-muted-foreground text-sm text-center">
                        Connectez-vous pour accéder à votre calendrier partagé.
                    </p>
                </div>
                {children}
            </div>
        </div>
    );
}
