'use client';

import { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Label } from '@/components/ui/Label';
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
            <div className="flex items-start gap-2 text-sm text-destructive bg-destructive/10 px-3 py-2 rounded-md">
                <AlertCircle className="w-4 h-4 mt-0.5 shrink-0" />
                {result.error}
            </div>
        );
    }
    return (
        <div className="flex items-start gap-2 text-sm text-green-700 bg-green-500/10 px-3 py-2 rounded-md">
            <CheckCircle className="w-4 h-4 mt-0.5 shrink-0" />
            {result.message ?? 'Mis à jour avec succès !'}
        </div>
    );
}

export function ProfileForm({ initialData }: ProfileFormProps) {
    const router = useRouter();

    // Section 1 : infos de base
    const [profilePending, startProfileTransition] = useTransition();
    const [profileResult, setProfileResult] = useState<SectionResult>(null);

    // Section 2 : changement d'email
    const [emailPending, startEmailTransition] = useTransition();
    const [emailResult, setEmailResult] = useState<SectionResult>(null);

    // Section 3 : changement de mot de passe
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
        <div className="space-y-6">

            {/* ── Section 1 : Nom d'affichage ── */}
            <section className="bg-card p-6 rounded-xl border shadow-sm space-y-4">
                <div className="flex items-center gap-2 mb-1">
                    <User className="w-5 h-5 text-muted-foreground" />
                    <h2 className="font-semibold text-lg">Informations de base</h2>
                </div>

                <form action={handleProfileSubmit} className="space-y-4">
                    <div className="space-y-2">
                        <Label htmlFor="email-display">Adresse email</Label>
                        <Input
                            id="email-display"
                            type="email"
                            defaultValue={initialData.email}
                            disabled
                            className="bg-muted/50 cursor-not-allowed"
                        />
                        <p className="text-xs text-muted-foreground">Pour changer l'email, utilisez la section ci-dessous.</p>
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="displayName">Nom d'affichage</Label>
                        <Input
                            id="displayName"
                            name="displayName"
                            type="text"
                            defaultValue={initialData.displayName}
                            required
                            placeholder="Ex: Papa, Alice…"
                        />
                    </div>

                    <SectionFeedback result={profileResult} />

                    <Button type="submit" disabled={profilePending} className="w-full sm:w-auto">
                        {profilePending ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" />Mise à jour…</> : 'Enregistrer'}
                    </Button>
                </form>
            </section>

            {/* ── Section 2 : Changer d'email ── */}
            <section className="bg-card p-6 rounded-xl border shadow-sm space-y-4">
                <div className="flex items-center gap-2 mb-1">
                    <Mail className="w-5 h-5 text-muted-foreground" />
                    <h2 className="font-semibold text-lg">Changer d'adresse email</h2>
                </div>

                <p className="text-sm text-muted-foreground">
                    Un lien de confirmation sera envoyé à la <strong>nouvelle adresse</strong>. Le changement ne sera effectif qu'après validation.
                </p>

                <form action={handleEmailSubmit} className="space-y-4">
                    <div className="space-y-2">
                        <Label htmlFor="newEmail">Nouvelle adresse email</Label>
                        <Input
                            id="newEmail"
                            name="newEmail"
                            type="email"
                            placeholder="nouvelle@exemple.com"
                            required
                            disabled={emailResult?.success}
                        />
                    </div>

                    <SectionFeedback result={emailResult} />

                    {!emailResult?.success && (
                        <Button type="submit" disabled={emailPending} variant="outline" className="w-full sm:w-auto">
                            {emailPending ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" />Envoi…</> : 'Envoyer le lien de confirmation'}
                        </Button>
                    )}
                </form>
            </section>

            {/* ── Section 3 : Changer de mot de passe ── */}
            <section className="bg-card p-6 rounded-xl border shadow-sm space-y-4">
                <div className="flex items-center gap-2 mb-1">
                    <Lock className="w-5 h-5 text-muted-foreground" />
                    <h2 className="font-semibold text-lg">Changer de mot de passe</h2>
                </div>

                <form onSubmit={handlePasswordSubmit} className="space-y-4">
                    <div className="space-y-2">
                        <Label htmlFor="newPassword">Nouveau mot de passe</Label>
                        <Input
                            id="newPassword"
                            name="newPassword"
                            type="password"
                            minLength={8}
                            placeholder="Minimum 8 caractères"
                            required
                        />
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="confirmPassword">Confirmer le mot de passe</Label>
                        <Input
                            id="confirmPassword"
                            name="confirmPassword"
                            type="password"
                            minLength={8}
                            placeholder="Répétez le nouveau mot de passe"
                            required
                        />
                    </div>

                    <SectionFeedback result={passwordResult} />

                    <Button type="submit" disabled={passwordPending} variant="outline" className="w-full sm:w-auto">
                        {passwordPending ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" />Mise à jour…</> : 'Changer le mot de passe'}
                    </Button>
                </form>
            </section>

        </div>
    );
}
