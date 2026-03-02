'use client';

export const dynamic = 'force-dynamic';

import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Label } from '@/components/ui/Label';
import Link from 'next/link';
import { useState, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import { login } from './actions';
import { MailCheck } from 'lucide-react';

function ConnexionContent() {
    const [error, setError] = useState<string | null>(null);
    const [loading, setLoading] = useState(false);
    const searchParams = useSearchParams();

    const isResetSent = searchParams.get('reset') === 'sent';
    const isSignupPending = searchParams.get('signup') === 'pending';

    async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
        e.preventDefault();
        setLoading(true);
        setError(null);
        const formData = new FormData(e.currentTarget);
        const result = await login(formData);
        if (result?.error) {
            setError('Email ou mot de passe incorrect.');
            setLoading(false);
        }
    }

    return (
        <form onSubmit={handleSubmit} className="space-y-6">
            {isResetSent && (
                <div className="flex items-start gap-2 text-sm text-green-700 bg-green-500/10 border border-green-500/20 px-3 py-3 rounded-md">
                    <MailCheck className="w-4 h-4 mt-0.5 shrink-0" />
                    Si cet email existe, un lien de réinitialisation a été envoyé. Vérifiez vos spams.
                </div>
            )}

            {isSignupPending && (
                <div className="flex items-start gap-2 text-sm text-blue-700 bg-blue-500/10 border border-blue-500/20 px-3 py-3 rounded-md">
                    <MailCheck className="w-4 h-4 mt-0.5 shrink-0" />
                    Compte créé ! Confirmez votre email avant de vous connecter.
                </div>
            )}

            <div className="space-y-4">
                <div className="space-y-2">
                    <Label htmlFor="email">Email</Label>
                    <Input id="email" name="email" type="email" placeholder="nom@exemple.com" required />
                </div>

                <div className="space-y-2">
                    <div className="flex items-center justify-between">
                        <Label htmlFor="password">Mot de passe</Label>
                        <Link
                            href="/mot-de-passe-oublie"
                            className="text-sm font-medium text-primary hover:underline"
                        >
                            Oublié ?
                        </Link>
                    </div>
                    <Input id="password" name="password" type="password" required />
                </div>

                {error && (
                    <p className="text-sm text-destructive bg-destructive/10 px-3 py-2 rounded-md">
                        {error}
                    </p>
                )}
            </div>

            <Button type="submit" className="w-full" disabled={loading}>
                {loading ? 'Connexion en cours…' : 'Se connecter'}
            </Button>

            <div className="text-center text-sm">
                Pas encore de compte ?{' '}
                <Link href="/inscription" className="font-medium text-primary hover:underline">
                    S'inscrire
                </Link>
            </div>
        </form>
    );
}

export default function ConnexionPage() {
    return (
        <Suspense>
            <ConnexionContent />
        </Suspense>
    );
}
