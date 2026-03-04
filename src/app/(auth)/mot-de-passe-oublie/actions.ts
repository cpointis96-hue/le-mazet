'use server';

import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import { z } from 'zod';

const emailSchema = z.object({
    email: z.string().email('Email invalide'),
});

const passwordSchema = z.object({
    password: z.string().min(8, 'Le mot de passe doit contenir au moins 8 caractères'),
});

export async function resetPasswordRequest(formData: FormData) {
    const parsed = emailSchema.safeParse({ email: formData.get('email') });

    if (!parsed.success) {
        return { error: parsed.error.issues[0].message };
    }

    const supabase = await createClient();
    const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? 'http://localhost:3000';

    await supabase.auth.resetPasswordForEmail(parsed.data.email, {
        redirectTo: `${appUrl}/reinitialiser-mdp`,
    });

    // On redirige toujours (ne pas révéler si l'email existe)
    redirect('/connexion?reset=sent');
}

export async function updatePassword(formData: FormData) {
    const parsed = passwordSchema.safeParse({ password: formData.get('password') });

    if (!parsed.success) {
        return { error: parsed.error.issues[0].message };
    }

    const supabase = await createClient();
    const { error } = await supabase.auth.updateUser({ password: parsed.data.password });

    if (error) {
        return { error: error.message };
    }

    redirect('/calendrier');
}
