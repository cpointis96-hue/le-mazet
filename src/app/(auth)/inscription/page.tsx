'use client';

import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Label } from '@/components/ui/Label';
import Link from 'next/link';
import { useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import { MailCheck } from 'lucide-react';

export default function RegisterPage() {
    const [error, setError] = useState<string | null>(null);
    const [loading, setLoading] = useState(false);
    const [confirmationPending, setConfirmationPending] = useState(false);
    const [registeredEmail, setRegisteredEmail] = useState('');

    async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
        e.preventDefault();
        setLoading(true);
        setError(null);

        const formData = new FormData(e.currentTarget);
        const email = formData.get('email') as string;
        const password = formData.get('password') as string;
        const displayName = formData.get('displayName') as string;

        if (password.length < 8) {
            setError('Le mot de passe doit contenir au moins 8 caractères.');
            setLoading(false);
            return;
        }

        const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? 'http://localhost:3000';
        const supabase = createClient();

        const { data, error: signUpError } = await supabase.auth.signUp({
            email,
            password,
            options: {
                data: { display_name: displayName, color: '#D4AF37' },
                emailRedirectTo: `${appUrl}/mon-calendrier`,
            },
        });

        if (signUpError) {
            setError(signUpError.message);
            setLoading(false);
            return;
        }

        // Si pas de session → confirmation email requise
        if (data.user && !data.session) {
            setRegisteredEmail(email);
            setConfirmationPending(true);
        } else {
            // Session immédiate (confirmation désactivée dans Supabase)
            window.location.href = '/mon-calendrier';
        }
    }

    // ── Écran de confirmation en attente ──
    if (confirmationPending) {
        return (
            <div className="text-center space-y-4 py-4">
                <div className="flex justify-center">
                    <div className="w-14 h-14 bg-primary/10 rounded-full flex items-center justify-center">
                        <MailCheck className="w-7 h-7 text-primary" />
                    </div>
                </div>
                <h2 className="text-xl font-bold">Confirmez votre email</h2>
                <p className="text-sm text-muted-foreground leading-relaxed">
                    Un lien de confirmation a été envoyé à{' '}
                    <strong className="text-foreground">{registeredEmail}</strong>.
                    <br />
                    Cliquez sur le lien dans l'email pour activer votre compte.
                </p>
                <p className="text-xs text-muted-foreground">
                    Pas reçu ? Vérifiez vos spams ou{' '}
                    <Link href="/connexion" className="text-primary hover:underline font-medium">
                        retournez à la connexion
                    </Link>
                    .
                </p>
            </div>
        );
    }

    return (
        <form onSubmit={handleSubmit} className="space-y-6">
            <div className="space-y-4">
                <div className="space-y-2">
                    <Label htmlFor="displayName">Nom d'affichage</Label>
                    <Input
                        id="displayName"
                        name="displayName"
                        type="text"
                        placeholder="Ex: Alice"
                        required
                    />
                </div>

                <div className="space-y-2">
                    <Label htmlFor="email">Email</Label>
                    <Input id="email" name="email" type="email" placeholder="nom@exemple.com" required />
                </div>

                <div className="space-y-2">
                    <Label htmlFor="password">Mot de passe</Label>
                    <Input id="password" name="password" type="password" minLength={8} required />
                    <p className="text-xs text-muted-foreground">Minimum 8 caractères</p>
                </div>

                {error && (
                    <p className="text-sm text-destructive bg-destructive/10 px-3 py-2 rounded-md">
                        {error}
                    </p>
                )}
            </div>

            <Button type="submit" className="w-full" disabled={loading}>
                {loading ? 'Création en cours…' : 'Créer mon compte'}
            </Button>

            <div className="text-center text-sm">
                Déjà un compte ?{' '}
                <Link href="/connexion" className="font-medium text-primary hover:underline">
                    Se connecter
                </Link>
            </div>
        </form>
    );
}
