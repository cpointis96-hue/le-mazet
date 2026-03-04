'use client';

import { useState, useTransition, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { updateProfile, changeEmail, changePassword } from './actions';
import { Loader2, User, Mail, Lock, CheckCircle, AlertCircle, Sun, Moon, Palette, LogOut } from 'lucide-react';
import { useTheme } from 'next-themes';

interface ProfileFormProps {
    initialData: {
        email: string;
        displayName: string;
        color: string;
        avatarId?: string;
    };
}

type SectionResult = { error?: string; success?: boolean; message?: string } | null;

function SectionFeedback({ result }: { result: SectionResult }) {
    if (!result) return null;
    if (result.error) {
        return (
            <div className="flex items-center gap-1.5 text-xs text-destructive w-full justify-end">
                <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                {result.error}
            </div>
        );
    }
    return (
        <div className="flex items-center gap-1.5 text-xs text-emerald-500 w-full justify-end">
            <CheckCircle className="w-3.5 h-3.5 shrink-0" />
            {result.message ?? 'Mis à jour avec succès !'}
        </div>
    );
}

export function ProfileForm({ initialData }: ProfileFormProps) {
    const router = useRouter();
    const { theme, setTheme } = useTheme();
    const [mounted, setMounted] = useState(false);

    useEffect(() => {
        setMounted(true);
    }, []);

    const [isPending, startTransition] = useTransition();
    const [result, setResult] = useState<SectionResult>(null);

    function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
        e.preventDefault();
        setResult(null);
        const form = e.currentTarget;
        const formData = new FormData(form);

        startTransition(async () => {
            let messages: string[] = [];
            let hasError = false;

            // 1. Profile (displayName)
            const newName = formData.get('displayName') as string;
            if (newName && newName !== initialData.displayName) {
                const res = await updateProfile(formData);
                if (res?.error) {
                    setResult({ error: res.error });
                    return;
                }
                messages.push("Profil mis à jour");
            }

            // 2. Email
            const newEmail = formData.get('newEmail') as string;
            if (newEmail && newEmail !== initialData.email) {
                const res = await changeEmail(formData);
                if (res?.error) {
                    setResult({ error: res.error });
                    return;
                }
                messages.push("Lien de confirmation d'email envoyé");
            }

            // 3. Password
            const currentPw = formData.get('currentPassword') as string;
            const newPw = formData.get('newPassword') as string;
            if (currentPw || newPw) {
                const res = await changePassword(formData);
                if (res?.error) {
                    setResult({ error: res.error });
                    return;
                }
                messages.push("Mot de passe changé");
                // Clear password fields on success
                (form.elements.namedItem('currentPassword') as HTMLInputElement).value = '';
                (form.elements.namedItem('newPassword') as HTMLInputElement).value = '';
                (form.elements.namedItem('confirmPassword') as HTMLInputElement).value = '';
            }

            if (messages.length > 0) {
                setResult({ success: true, message: messages.join(' · ') });
                router.refresh();
            } else {
                setResult({ success: true, message: "Aucune modification détectée" });
            }
        });
    }

    return (
        <form onSubmit={handleSubmit} className="bg-card rounded-xl border border-white/5 divide-y divide-white/5 flex flex-col shadow-xl">

            {/* ── Apparence ── */}
            <section className="px-4 py-4 flex items-center justify-between">
                <div className="flex items-center gap-2">
                    <Palette className="w-3.5 h-3.5 text-muted-foreground" />
                    <h2 className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Apparence</h2>
                </div>
                {mounted && (
                    <button
                        type="button"
                        onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
                        className="p-2 bg-white/5 hover:bg-white/10 rounded-lg transition-colors border border-white/5"
                        aria-label="Toggle Dark Mode"
                    >
                        {theme === 'dark' ? (
                            <Sun className="w-4 h-4 text-emerald-400" />
                        ) : (
                            <Moon className="w-4 h-4 text-emerald-600" />
                        )}
                    </button>
                )}
            </section>

            {/* ── Nom d'affichage ── */}
            <section className="px-4 py-4 flex flex-col gap-3">
                <div className="flex items-center gap-2">
                    <User className="w-3.5 h-3.5 text-muted-foreground" />
                    <h2 className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Profil</h2>
                </div>
                <Input
                    name="displayName"
                    type="text"
                    defaultValue={initialData.displayName}
                    required
                    placeholder="Nom d'affichage (Ex: Papa, Alice…)"
                    className="h-9 text-sm"
                />
            </section>

            {/* ── Email ── */}
            <section className="px-4 py-4 flex flex-col gap-3">
                <div className="flex items-center gap-2">
                    <Mail className="w-3.5 h-3.5 text-muted-foreground" />
                    <h2 className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Adresse Email</h2>
                </div>
                <Input
                    name="newEmail"
                    type="email"
                    defaultValue={initialData.email}
                    required
                    placeholder="nouvelle@exemple.com"
                    className="h-9 text-sm"
                />
            </section>

            {/* ── Mot de passe ── */}
            <section className="px-4 py-4 flex flex-col gap-3">
                <div className="flex items-center gap-2">
                    <Lock className="w-3.5 h-3.5 text-muted-foreground" />
                    <h2 className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Changer le mot de passe</h2>
                </div>
                <Input
                    name="currentPassword"
                    type="password"
                    placeholder="Mot de passe actuel (requis si modification)"
                    className="h-9 text-sm"
                />
                <div className="flex gap-2 w-full">
                    <Input
                        name="newPassword"
                        type="password"
                        placeholder="Nouveau (min. 8 caractères)"
                        className="h-9 text-sm flex-1"
                    />
                    <Input
                        name="confirmPassword"
                        type="password"
                        placeholder="Confirmer"
                        className="h-9 text-sm flex-1"
                    />
                </div>
            </section>

            <section className="px-4 py-4 bg-muted/20 flex flex-col gap-3 rounded-b-xl items-end relative overflow-hidden">
                <SectionFeedback result={result} />
                <Button
                    type="submit"
                    disabled={isPending}
                    className="w-full sm:w-auto h-9 px-6 bg-emerald-600 hover:bg-emerald-500 text-white font-semibold transition-all shadow-[0_0_15px_rgba(16,185,129,0.2)] hover:shadow-[0_0_20px_rgba(16,185,129,0.4)]"
                >
                    {isPending ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" />Enregistrement…</> : 'Enregistrer'}
                </Button>
            </section>

            {/* ── Déconnexion ── */}
            <section className="px-4 py-4 border-t border-white/5">
                <button
                    type="button"
                    onClick={async () => {
                        const { createClient } = await import('@/lib/supabase/client');
                        const supabase = createClient();
                        await supabase.auth.signOut();
                        window.location.href = "/";
                    }}
                    className="flex w-full items-center justify-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold transition-all text-red-500/80 hover:bg-red-500/10 hover:text-red-400"
                >
                    <LogOut className="w-4 h-4" />
                    Se déconnecter
                </button>
            </section>

        </form>
    );
}
