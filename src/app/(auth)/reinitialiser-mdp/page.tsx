'use client';

import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Label } from '@/components/ui/Label';
import { useState } from 'react';
import { updatePassword } from '../mot-de-passe-oublie/actions';

export default function ResetPasswordPage() {
    const [error, setError] = useState<string | null>(null);
    const [loading, setLoading] = useState(false);

    async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
        e.preventDefault();
        setLoading(true);
        setError(null);
        const formData = new FormData(e.currentTarget);
        const result = await updatePassword(formData);
        if (result?.error) {
            setError(result.error);
            setLoading(false);
        }
    }

    return (
        <form onSubmit={handleSubmit} className="space-y-6">
            <div className="space-y-4">
                <div className="space-y-2">
                    <Label htmlFor="password">Nouveau mot de passe</Label>
                    <Input id="password" name="password" type="password" minLength={6} required />
                </div>

                {error && (
                    <p className="text-sm text-destructive bg-destructive/10 px-3 py-2 rounded-md">
                        {error}
                    </p>
                )}
            </div>

            <Button type="submit" className="w-full" disabled={loading}>
                {loading ? 'Enregistrement…' : 'Enregistrer le mot de passe'}
            </Button>
        </form>
    );
}
