'use client';

import { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { updateProfile, changeEmail, changePassword } from './actions';
import { Loader2, User, Mail, Lock, CheckCircle, AlertCircle } from 'lucide-react';

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
            <div className="flex items-center gap-1.5 text-xs text-destructive">
                <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                {result.error}
            </div>
        );
    }
    return (
        <div className="flex items-center gap-1.5 text-xs text-emerald-500">
            <CheckCircle className="w-3.5 h-3.5 shrink-0" />
            {result.message ?? 'Mis à jour avec succès !'}
        </div>
    );
}

export function ProfileForm({ initialData }: ProfileFormProps) {
    const router = useRouter();

    const [profilePending, startProfileTransition] = useTransition();
    const [profileResult, setProfileResult] = useState<SectionResult>(null);

    const [emailPending, startEmailTransition] = useTransition();
    const [emailResult, setEmailResult] = useState<SectionResult>(null);

    const [passwordPending, startPasswordTransition] = useTransition();
    const [passwordResult, setPasswordResult] = useState<SectionResult>(null);

    function handleProfileSubmit(formData: FormData) {
        setProfileResult(null);
        startProfileTransition(async () => {
            const result = await updateProfile(formData);
            setProfileResult(result ?? null);
            if (result?.success) router.refresh();
        });
    }

    function handleEmailSubmit(formData: FormData) {
        setEmailResult(null);
        startEmailTransition(async () => {
            const result = await changeEmail(formData);
            setEmailResult(result ?? null);
        });
    }

    function handlePasswordSubmit(e: React.FormEvent<HTMLFormElement>) {
        e.preventDefault();
        setPasswordResult(null);
        const formData = new FormData(e.currentTarget);
        startPasswordTransition(async () => {
            const result = await changePassword(formData);
            setPasswordResult(result ?? null);
            if (result?.success) (e.target as HTMLFormElement).reset();
        });
    }

    return (
        <div className="bg-card rounded-xl border border-white/5 divide-y divide-white/5">

            {/* ── Nom d'affichage ── */}
            <section className="px-4 py-4">
                <div className="flex items-center gap-2 mb-3">
                    <User className="w-3.5 h-3.5 text-muted-foreground" />
                    <h2 className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Nom d'affichage</h2>
                </div>
                <form action={handleProfileSubmit} className="flex flex-col gap-2">
                    <Input
                        name="displayName"
                        type="text"
                        defaultValue={initialData.displayName}
                        required
                        placeholder="Ex: Papa, Alice…"
                        className="h-8 text-sm"
                    />
                    <SectionFeedback result={profileResult} />
                    <Button type="submit" disabled={profilePending} size="sm" className="self-end text-xs h-7 px-3">
                        {profilePending ? <><Loader2 className="mr-1.5 h-3 w-3 animate-spin" />Mise à jour…</> : 'Enregistrer'}
                    </Button>
                </form>
            </section>

            {/* ── Email ── */}
            <section className="px-4 py-4">
                <div className="flex items-center gap-2 mb-1">
                    <Mail className="w-3.5 h-3.5 text-muted-foreground" />
                    <h2 className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Email</h2>
                </div>
                <p className="text-xs text-muted-foreground/60 mb-3">
                    {initialData.email} · un lien de confirmation sera envoyé à la nouvelle adresse
                </p>
                <form action={handleEmailSubmit} className="flex flex-col gap-2">
                    <Input
                        name="newEmail"
                        type="email"
                        placeholder="nouvelle@exemple.com"
                        required
                        disabled={emailResult?.success}
                        className="h-8 text-sm"
                    />
                    <SectionFeedback result={emailResult} />
                    {!emailResult?.success && (
                        <Button type="submit" disabled={emailPending} variant="outline" size="sm" className="self-end text-xs h-7 px-3">
                            {emailPending ? <><Loader2 className="mr-1.5 h-3 w-3 animate-spin" />Envoi…</> : 'Envoyer le lien'}
                        </Button>
                    )}
                </form>
            </section>

            {/* ── Mot de passe ── */}
            <section className="px-4 py-4">
                <div className="flex items-center gap-2 mb-3">
                    <Lock className="w-3.5 h-3.5 text-muted-foreground" />
                    <h2 className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Mot de passe</h2>
                </div>
                <form onSubmit={handlePasswordSubmit} className="flex flex-col gap-2">
                    <Input
                        name="currentPassword"
                        type="password"
                        placeholder="Mot de passe actuel"
                        required
                        className="h-8 text-sm"
                    />
                    <Input
                        name="newPassword"
                        type="password"
                        minLength={8}
                        placeholder="Nouveau (min. 8 caractères)"
                        required
                        className="h-8 text-sm"
                    />
                    <Input
                        name="confirmPassword"
                        type="password"
                        minLength={8}
                        placeholder="Confirmer le nouveau"
                        required
                        className="h-8 text-sm"
                    />
                    <SectionFeedback result={passwordResult} />
                    <Button type="submit" disabled={passwordPending} variant="outline" size="sm" className="self-end text-xs h-7 px-3">
                        {passwordPending ? <><Loader2 className="mr-1.5 h-3 w-3 animate-spin" />Mise à jour…</> : 'Changer'}
                    </Button>
                </form>
            </section>

        </div>
    );
}
