'use server';

import { createClient } from '@/lib/supabase/server';
import { revalidatePath } from 'next/cache';
import { z } from 'zod';

const profileSchema = z.object({
    displayName: z.string().min(1, 'Le nom est requis').max(50, 'Nom trop long'),
    color: z.string().regex(/^#[0-9a-fA-F]{6}$/, 'Couleur invalide').optional().default('#D4AF37'),
});

const changeEmailSchema = z.object({
    newEmail: z.string().email('Adresse email invalide'),
});

const changePasswordSchema = z.object({
    newPassword: z.string().min(8, 'Minimum 8 caractères'),
    confirmPassword: z.string().min(1, 'Confirmation requise'),
}).refine((data) => data.newPassword === data.confirmPassword, {
    message: 'Les mots de passe ne correspondent pas',
    path: ['confirmPassword'],
});

export async function updateProfile(formData: FormData) {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) return { error: 'Non autorisé' };

    const parsed = profileSchema.safeParse({
        displayName: formData.get('displayName'),
        color: formData.get('color') || '#D4AF37',
    });

    if (!parsed.success) return { error: parsed.error.issues[0].message };

    const { error } = await supabase
        .from('profiles')
        .update({
            display_name: parsed.data.displayName,
            color: parsed.data.color,
            updated_at: new Date().toISOString(),
        })
        .eq('id', user.id);

    if (error) return { error: 'Erreur lors de la mise à jour du profil' };

    revalidatePath('/profil');
    revalidatePath('/mon-calendrier');
    revalidatePath('/calendrier-commun');

    return { success: true };
}

export async function changeEmail(formData: FormData) {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) return { error: 'Non autorisé' };

    const parsed = changeEmailSchema.safeParse({ newEmail: formData.get('newEmail') });
    if (!parsed.success) return { error: parsed.error.issues[0].message };

    if (parsed.data.newEmail === user.email) {
        return { error: 'C\'est déjà votre adresse email actuelle' };
    }

    const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? 'http://localhost:3000';

    const { error } = await supabase.auth.updateUser(
        { email: parsed.data.newEmail },
        { emailRedirectTo: `${appUrl}/mon-calendrier` }
    );

    if (error) return { error: error.message };

    return {
        success: true,
        message: `Un email de confirmation a été envoyé à ${parsed.data.newEmail}. Cliquez sur le lien pour valider le changement.`,
    };
}

export async function changePassword(formData: FormData) {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) return { error: 'Non autorisé' };

    const parsed = changePasswordSchema.safeParse({
        newPassword: formData.get('newPassword'),
        confirmPassword: formData.get('confirmPassword'),
    });

    if (!parsed.success) return { error: parsed.error.issues[0].message };

    const { error } = await supabase.auth.updateUser({
        password: parsed.data.newPassword,
    });

    if (error) return { error: error.message };

    return { success: true, message: 'Mot de passe modifié avec succès !' };
}
