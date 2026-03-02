'use server';

import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import { z } from 'zod';

const signupSchema = z.object({
    email: z.string().email('Email invalide'),
    password: z.string().min(8, 'Le mot de passe doit contenir au moins 8 caractères'),
    displayName: z.string().min(1, 'Le nom est requis').max(50, 'Nom trop long'),
    color: z.string().regex(/^#[0-9a-fA-F]{6}$/, 'Couleur invalide').optional().default('#6366f1'),
    avatarId: z.string().max(50).optional().default('avatar-1'),
});

export async function signup(formData: FormData) {
    const parsed = signupSchema.safeParse({
        email: formData.get('email'),
        password: formData.get('password'),
        displayName: formData.get('displayName'),
        color: formData.get('color') || '#6366f1',
        avatarId: formData.get('avatarId') || 'avatar-1',
    });

    if (!parsed.success) {
        return { error: parsed.error.issues[0].message };
    }

    const supabase = await createClient();
    const { error } = await supabase.auth.signUp({
        email: parsed.data.email,
        password: parsed.data.password,
        options: {
            data: {
                display_name: parsed.data.displayName,
                color: parsed.data.color,
                avatar_id: parsed.data.avatarId,
            },
        },
    });

    if (error) {
        return { error: error.message };
    }

    redirect('/mon-calendrier');
}
