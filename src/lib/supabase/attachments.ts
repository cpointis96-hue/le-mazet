import { SupabaseClient } from '@supabase/supabase-js';

export interface EventAttachment {
    id: string;
    eventId: string;
    filePath: string;
    fileName: string;
    fileType: string;
    fileSize: number;
    uploadedBy: string;
    createdAt: string;
    signedUrl?: string;
}

const ALLOWED_MIME_TYPES = [
    'image/jpeg',
    'image/png',
    'image/gif',
    'image/webp',
    'image/svg+xml',
    'application/pdf',
    'application/msword',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'application/vnd.ms-excel',
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    'text/plain',
    'text/csv',
];

const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10 MB

export async function uploadEventAttachments(
    supabase: SupabaseClient,
    eventId: string,
    files: File[],
    userId: string
): Promise<EventAttachment[]> {
    const uploadedAttachments: EventAttachment[] = [];

    for (const file of files) {
        // Validation côté client (défense en profondeur — la validation principale est côté serveur via RLS)
        if (!ALLOWED_MIME_TYPES.includes(file.type)) {
            console.warn(`Fichier rejeté (type non autorisé) : ${file.name} (${file.type})`);
            continue;
        }

        if (file.size > MAX_FILE_SIZE) {
            console.warn(`Fichier rejeté (trop lourd) : ${file.name} (${(file.size / 1024 / 1024).toFixed(1)} MB)`);
            continue;
        }

        const fileExt = file.name.split('.').pop()?.toLowerCase() ?? 'bin';
        const safeName = file.name.replace(/[^a-zA-Z0-9._-]/g, '_');
        const filePath = `${eventId}/${Date.now()}_${safeName}`;

        const { error: uploadError } = await supabase.storage
            .from('event-attachments')
            .upload(filePath, file, { contentType: file.type });

        if (uploadError) {
            console.error('Erreur upload fichier :', uploadError.message);
            continue;
        }

        const { data, error: dbError } = await supabase
            .from('event_attachments')
            .insert({
                event_id: eventId,
                file_path: filePath,
                file_name: file.name,
                file_type: fileExt,
                file_size: file.size,
                uploaded_by: userId
            })
            .select()
            .single();

        if (dbError) {
            console.error('Erreur sauvegarde métadonnées :', dbError.message);
            await supabase.storage.from('event-attachments').remove([filePath]);
        } else if (data) {
            uploadedAttachments.push({
                id: data.id,
                eventId: data.event_id,
                filePath: data.file_path,
                fileName: data.file_name,
                fileType: data.file_type,
                fileSize: data.file_size,
                uploadedBy: data.uploaded_by,
                createdAt: data.created_at
            });
        }
    }

    return uploadedAttachments;
}

export async function getEventAttachments(
    supabase: SupabaseClient,
    eventId: string
): Promise<EventAttachment[]> {
    const { data, error } = await supabase
        .from('event_attachments')
        .select('*')
        .eq('event_id', eventId)
        .order('created_at', { ascending: true });

    if (error) {
        console.error('Erreur récupération pièces jointes :', error.message);
        return [];
    }

    const attachments = (data || []).map(row => ({
        id: row.id,
        eventId: row.event_id,
        filePath: row.file_path,
        fileName: row.file_name,
        fileType: row.file_type,
        fileSize: row.file_size,
        uploadedBy: row.uploaded_by,
        createdAt: row.created_at,
    }));

    if (attachments.length === 0) return [];

    // Génère des URLs signées (bucket privé — 2h de validité)
    const paths = attachments.map(a => a.filePath);
    const { data: signedData } = await supabase.storage
        .from('event-attachments')
        .createSignedUrls(paths, 7200);

    return attachments.map((att, i) => ({
        ...att,
        signedUrl: signedData?.[i]?.signedUrl ?? undefined,
    }));
}
