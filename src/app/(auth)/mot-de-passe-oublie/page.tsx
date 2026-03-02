'use client';

import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Label } from '@/components/ui/Label';
import Link from 'next/link';
import { useState } from 'react';
import { resetPasswordRequest } from './actions';

export default function ForgotPasswordPage() {
    const [sent, setSent] = useState(false);
    const [loading, setLoading] = useState(false);

    async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
        e.preventDefault();
        setLoading(true);
        const formData = new FormData(e.currentTarget);
        await resetPasswordRequest(formData);
        setSent(true);
        setLoading(false);
    }

    if (sent) {
        return (
            <div className="space-y-4 text-center">
                <div className="text-4xl">📬</div>
                <p className="text-sm text-muted-foreground">
                    Si cet email est associé à un compte, vous recevrez un lien de réinitialisation dans quelques instants.
                </p>
                <Link href="/connexion" className="text-sm font-medium text-primary hover:underline block">
                    Retour à la connexion
                </Link>
            </div>
        );
    }

    return (
        <form onSubmit={handleSubmit} className="space-y-6">
            <div className="space-y-4">
                <div className="space-y-2">
                    <Label htmlFor="email">Email</Label>
                    <Input id="email" name="email" type="email" placeholder="nom@exemple.com" required />
                </div>
            </div>

            <Button type="submit" className="w-full" disabled={loading}>
                {loading ? 'Envoi en cours…' : 'Envoyer les instructions'}
            </Button>

            <div className="text-center text-sm">
                <Link href="/connexion" className="font-medium text-primary hover:underline">
                    Retour à la connexion
                </Link>
            </div>
        </form>
    );
}
